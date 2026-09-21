import type { ScrapeResult } from "./types";

const UA =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";

const CURRENCY_SYMBOLS: Record<string, string> = {
    $: "USD",
    "£": "GBP",
    "€": "EUR",
    "¥": "JPY",
    "₹": "INR",
    "R$": "BRL",
    "A$": "AUD",
    "C$": "CAD",
};

const NAMED_ENTITIES: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    mdash: "\u2014",
    ndash: "\u2013",
    hellip: "\u2026",
    lsquo: "\u2018",
    rsquo: "\u2019",
    ldquo: "\u201c",
    rdquo: "\u201d",
    bull: "\u2022",
    middot: "\u00b7",
    times: "\u00d7",
    deg: "\u00b0",
    copy: "\u00a9",
    reg: "\u00ae",
    trade: "\u2122",
    euro: "\u20ac",
    pound: "\u00a3",
    yen: "\u00a5",
    cent: "\u00a2",
};

function decodeEntities(value: string): string {
    return value
        .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
            if (entity.startsWith("#x") || entity.startsWith("#X")) return String.fromCodePoint(parseInt(entity.slice(2), 16));
            if (entity.startsWith("#")) return String.fromCodePoint(parseInt(entity.slice(1), 10));
            return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
        })
        .trim();
}

/** Pull the `content` attribute of the first <meta> whose name/property matches. */
function meta(html: string, keys: string[]): string | null {
    for (const key of keys) {
        const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const pattern = new RegExp(
            `<meta[^>]+(?:property|name|itemprop)\\s*=\\s*["']${escaped}["'][^>]*>`,
            "i",
        );
        const tag = html.match(pattern)?.[0];
        if (!tag) continue;

        const content = tag.match(/content\s*=\s*["']([^"']*)["']/i)?.[1];
        if (content?.trim()) return decodeEntities(content);
    }
    return null;
}

function parsePrice(raw: unknown): number | null {
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (typeof raw !== "string") return null;

    // Normalise "1.299,00" (EU) and "1,299.00" (US) into a plain float.
    const cleaned = raw.replace(/[^\d.,]/g, "");
    if (!cleaned) return null;

    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");
    let normalised = cleaned;

    if (lastComma > lastDot) normalised = cleaned.replace(/\./g, "").replace(",", ".");
    else normalised = cleaned.replace(/,/g, "");

    const value = Number.parseFloat(normalised);
    return Number.isFinite(value) && value > 0 ? value : null;
}

function currencyFromText(text: string): string | null {
    const code = text.match(/\b(USD|EUR|GBP|CAD|AUD|JPY|INR|SEK|NOK|DKK|CHF|PLN|NZD|BRL|MXN|ZAR)\b/i)?.[1];
    if (code) return code.toUpperCase();

    for (const [symbol, iso] of Object.entries(CURRENCY_SYMBOLS)) if (text.includes(symbol)) return iso;
    return null;
}

/** Walk JSON-LD blocks looking for a Product node with an offer. */
function fromJsonLd(html: string): Partial<ScrapeResult> {
    const result: Partial<ScrapeResult> = {};
    const blocks = html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi);

    for (const block of blocks) {
        let parsed: unknown;
        try {
            parsed = JSON.parse(block[1].trim());
        } catch {
            continue;
        }

        const queue: unknown[] = [parsed];
        while (queue.length) {
            const node = queue.shift();
            if (Array.isArray(node)) {
                queue.push(...node);
                continue;
            }
            if (!node || typeof node !== "object") continue;

            const record = node as Record<string, unknown>;
            if (record["@graph"]) queue.push(record["@graph"]);

            const type = String(record["@type"] ?? "").toLowerCase();
            if (!type.includes("product")) continue;

            if (!result.title && typeof record.name === "string") result.title = decodeEntities(record.name);

            const image = record.image;
            if (!result.image_url) {
                if (typeof image === "string") result.image_url = image;
                else if (Array.isArray(image) && typeof image[0] === "string") result.image_url = image[0];
                else if (image && typeof image === "object" && typeof (image as Record<string, unknown>).url === "string")
                    result.image_url = (image as Record<string, string>).url;
            }

            const offers = Array.isArray(record.offers) ? record.offers[0] : record.offers;
            if (offers && typeof offers === "object") {
                const offer = offers as Record<string, unknown>;
                result.price ??= parsePrice(offer.price ?? offer.lowPrice ?? offer.highPrice);
                if (typeof offer.priceCurrency === "string") result.currency ??= offer.priceCurrency.toUpperCase();
            }
        }
    }

    return result;
}

export async function scrapeUrl(rawUrl: string): Promise<ScrapeResult> {
    const url = new URL(rawUrl);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only http(s) links are supported");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    let html: string;
    try {
        const response = await fetch(url, {
            signal: controller.signal,
            redirect: "follow",
            headers: {
                "user-agent": UA,
                accept: "text/html,application/xhtml+xml",
                "accept-language": "en-US,en;q=0.9",
            },
        });
        if (!response.ok) throw new Error(`The site responded with ${response.status}`);
        html = (await response.text()).slice(0, 1_500_000);
    } finally {
        clearTimeout(timeout);
    }

    const ld = fromJsonLd(html);

    const title =
        meta(html, ["og:title", "twitter:title", "title"]) ??
        ld.title ??
        (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ? decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)![1]) : null);

    const image =
        meta(html, ["og:image:secure_url", "og:image:url", "og:image", "twitter:image", "twitter:image:src", "image"]) ??
        ld.image_url ??
        html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i)?.[1] ??
        null;

    const priceText = meta(html, [
        "product:price:amount",
        "og:price:amount",
        "twitter:data1",
        "price",
        "product:price",
    ]);

    const currencyText = meta(html, ["product:price:currency", "og:price:currency", "priceCurrency"]);

    return {
        title: title?.slice(0, 200) ?? null,
        image_url: image ? new URL(image, url).toString() : null,
        price: parsePrice(priceText) ?? ld.price ?? null,
        currency:
            (currencyText && currencyFromText(currencyText)) ??
            ld.currency ??
            (priceText ? currencyFromText(priceText) : null) ??
            null,
        site_name: meta(html, ["og:site_name"]) ?? url.hostname.replace(/^www\./, ""),
    };
}
