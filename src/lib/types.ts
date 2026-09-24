export type Priority = "low" | "normal" | "high";

export interface GiftItem {
    id: string;
    list_id: string;
    title: string;
    url: string | null;
    image_url: string | null;
    price: number | null;
    currency: string;
    notes: string | null;
    quantity: number;
    priority: Priority;
    position: number;
    created_at: string;
    updated_at: string;
}

export interface GiftList {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    accent: string;
    position: number;
    created_at: string;
    updated_at: string;
}

export interface GiftListWithItems extends GiftList {
    items: GiftItem[];
}

export interface ScrapeResult {
    title: string | null;
    image_url: string | null;
    price: number | null;
    currency: string | null;
    site_name: string | null;
}
