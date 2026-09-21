import { db } from "./db";
import type { GiftItem, GiftList, GiftListWithItems } from "./types";

export function getLists(): GiftList[] {
    return db.prepare("SELECT * FROM lists ORDER BY position ASC, created_at ASC").all() as GiftList[];
}

export function getList(idOrSlug: string): GiftList | undefined {
    return db.prepare("SELECT * FROM lists WHERE id = ? OR slug = ?").get(idOrSlug, idOrSlug) as GiftList | undefined;
}

export function getItems(listId: string): GiftItem[] {
    return db
        .prepare("SELECT * FROM items WHERE list_id = ? ORDER BY position ASC, created_at ASC")
        .all(listId) as GiftItem[];
}

export function getListsWithItems(): GiftListWithItems[] {
    return getLists().map((list) => ({ ...list, items: getItems(list.id) }));
}

export function touchList(listId: string): void {
    db.prepare("UPDATE lists SET updated_at = datetime('now') WHERE id = ?").run(listId);
}

export function nextItemPosition(listId: string): number {
    const row = db.prepare("SELECT COALESCE(MAX(position), -1) + 1 AS pos FROM items WHERE list_id = ?").get(listId) as {
        pos: number;
    };
    return row.pos;
}

export function nextListPosition(): number {
    const row = db.prepare("SELECT COALESCE(MAX(position), -1) + 1 AS pos FROM lists").get() as { pos: number };
    return row.pos;
}
