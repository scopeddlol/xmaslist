export interface ParsedItem {
    title: string;
    url: string | null;
    image_url: string | null;
    price: number | null;
    currency: string;
    notes: string | null;
    quantity: number;
}

export interface ParsedMarkdown {
    name: string | null;
    description: string | null;
    items: ParsedItem[];
}

const BULLET = /^\s*(?:[-*+]|\d+[.)])\s+/;
const CHECKBOX = /^\[([ xX])\]\s*/;
const MD_LINK = /\[([^\]]*)\]\((\s*<?([^)\s>]+)>?[^)]*)\)/;
const BARE_URL = /\bhttps?:\/\/[^\s)<>\]]+/i;
const PRICE = /(?:(USD|EUR|GBP|CAD|AUD|JPY|SEK|NOK|DKK|CHF|NZD)\s*)?([$£€¥₹]|R\$|A\$|C\$)?\s*(\d[\d.,]*)\s*(USD|EUR|GBP|CAD|AUD|JPY|SEK|NOK|DKK|CHF|NZD|kr|zł)?/i;
const QUANTITY = /(?:^|\s)(?:x|×)\s?(\d{1,3})(?:$|\s)/i;

const SYMBOL_TO_ISO: Record<string, string> = {
    $: "USD",
    "£": "GBP",
    "€": "EUR",
    "¥": "JPY",
    "₹": "INR",
    "R$": "BRL",
    "A$": "AUD",
    "C$": "CAD",
    kr: "SEK",
    "zł": "PLN",
};

function stripInline(value: string): string {
    return value
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
        .replace(/\*\*|__|[*_`~]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function toNumber(raw: string): number | null {
    const lastComma = raw.lastIndexOf(",");
    const lastDot = raw.lastIndexOf(".");
    const normalised = lastComma > lastDot ? raw.replace(/\./g, "").replace(",", ".") : raw.replace(/,/g, "");
    const value = Number.parseFloat(normalised);
    return Number.isFinite(value) && value > 0 ? value : null;
}

/** A segment counts as a price only when it is mostly the number itself. */
function readPrice(segment: string): { price: number; currency: string } | null {
    const trimmed = segment.trim();
    if (!trimmed || !/\d/.test(trimmed)) return null;
    if (!/[$£€¥₹]|\b(USD|EUR|GBP|CAD|AUD|JPY|SEK|NOK|DKK|CHF|NZD|kr|zł)\b/i.test(trimmed)) return null;
    if (trimmed.replace(PRICE, "").replace(/[~approx.\s]/gi, "").length > 4) return null;

    const match = trimmed.match(PRICE);
    if (!match) return null;

    const price = toNumber(match[3]);
    if (price === null) return null;

    const code = match[1] ?? match[4];
    const currency = code
        ? (SYMBOL_TO_ISO[code] ?? code.toUpperCase())
        : match[2]
          ? (SYMBOL_TO_ISO[match[2]] ?? "USD")
          : "USD";

    return { price, currency };
}

function parseLine(line: string): ParsedItem | null {
    let rest = line.replace(BULLET, "").trim();
    if (!rest) return null;

    rest = rest.replace(CHECKBOX, "");

    let url: string | null = null;
    let title: string | null = null;

    const link = rest.match(MD_LINK);
    if (link) {
        url = link[3];
        title = stripInline(link[1]) || null;
        rest = rest.replace(link[0], title ? ` ${title} ` : " ").trim();
    } else {
        const bare = rest.match(BARE_URL);
        if (bare) {
            url = bare[0].replace(/[.,;]$/, "");
            rest = rest.replace(bare[0], " ").trim();
        }
    }

    let quantity = 1;
    const qty = rest.match(QUANTITY);
    if (qty) {
        quantity = Math.min(99, Math.max(1, Number.parseInt(qty[1], 10)));
        rest = rest.replace(qty[0], " ");
    }

    const segments = rest
        .split(/\s+[—–|]\s+|\s+-\s+|\s{2,}/)
        .map(stripInline)
        .filter(Boolean);

    let price: number | null = null;
    let currency = "USD";
    const remaining: string[] = [];

    for (const segment of segments) {
        const found = readPrice(segment);
        if (found && price === null) {
            price = found.price;
            currency = found.currency;
        } else {
            remaining.push(segment);
        }
    }

    if (!title) title = remaining.shift() ?? null;
    else if (remaining[0] && stripInline(remaining[0]) === title) remaining.shift();

    if (!title) title = url ? new URL(url, "https://example.com").hostname.replace(/^www\./, "") : null;
    if (!title) return null;

    return {
        title: title.slice(0, 200),
        url,
        image_url: null,
        price,
        currency,
        notes: remaining.join(" · ").slice(0, 500) || null,
        quantity,
    };
}

export function parseMarkdown(source: string): ParsedMarkdown {
    const lines = source.replace(/\r\n?/g, "\n").split("\n");

    let name: string | null = null;
    let description: string | null = null;
    const items: ParsedItem[] = [];

    let inCodeFence = false;
    let tableColumns: string[] | null = null;

    for (const raw of lines) {
        const line = raw.trimEnd();

        if (/^\s*```/.test(line)) {
            inCodeFence = !inCodeFence;
            continue;
        }
        if (inCodeFence || !line.trim()) {
            tableColumns = null;
            continue;
        }

        const heading = line.match(/^(#{1,6})\s+(.*)$/);
        if (heading) {
            const text = stripInline(heading[2]);
            if (heading[1].length === 1 && !name) name = text;
            tableColumns = null;
            continue;
        }

        // Markdown tables: use the header row to find which column holds what.
        if (/^\s*\|/.test(line)) {
            const cells = line.split("|").slice(1, -1).map((cell) => stripInline(cell));
            if (cells.every((cell) => /^:?-{2,}:?$/.test(cell.replace(/\s/g, "")))) continue;

            if (!tableColumns) {
                tableColumns = cells.map((cell) => cell.toLowerCase());
                continue;
            }

            const pick = (keys: string[]) => {
                const index = tableColumns!.findIndex((column) => keys.some((key) => column.includes(key)));
                return index >= 0 ? (cells[index] ?? "") : "";
            };

            const item = parseLine(
                [pick(["item", "name", "gift", "title"]), pick(["link", "url", "where"]), pick(["price", "cost"]), pick(["note", "comment", "detail"])]
                    .filter(Boolean)
                    .join(" — "),
            );
            if (item) items.push(item);
            continue;
        }

        tableColumns = null;

        if (BULLET.test(line)) {
            const item = parseLine(line);
            if (item) items.push(item);
            continue;
        }

        if (!description && !items.length && line.trim().length > 1) description = stripInline(line).slice(0, 280);
    }

    return { name, description, items };
}
