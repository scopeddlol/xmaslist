import { twMerge } from "tailwind-merge";

type ClassValue = string | number | bigint | boolean | null | undefined;

export function cx(...values: ClassValue[]): string {
    return twMerge(values.filter((value): value is string => typeof value === "string" && value.length > 0).join(" "));
}

export function formatPrice(price: number | null | undefined, currency = "USD"): string | null {
    if (price === null || price === undefined || !Number.isFinite(price)) return null;

    try {
        return new Intl.NumberFormat(undefined, {
            style: "currency",
            currency,
            maximumFractionDigits: Number.isInteger(price) ? 0 : 2,
        }).format(price);
    } catch {
        return `${currency} ${price.toFixed(2)}`;
    }
}

export function hostnameOf(url: string | null | undefined): string | null {
    if (!url) return null;
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return null;
    }
}
