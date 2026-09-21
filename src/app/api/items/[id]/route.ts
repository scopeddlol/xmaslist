import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { touchList } from "@/lib/queries";
import type { GiftItem } from "@/lib/types";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

const FIELDS = ["title", "url", "image_url", "price", "currency", "notes", "quantity", "priority", "claimed_by"] as const;

export async function PATCH(request: Request, { params }: Context) {
    const { id } = await params;
    const item = db.prepare("SELECT * FROM items WHERE id = ?").get(id) as GiftItem | undefined;
    if (!item) return NextResponse.json({ error: "Gift not found" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const updates: Record<string, unknown> = {};

    for (const field of FIELDS) {
        if (!(field in body)) continue;
        const value = body[field];

        switch (field) {
            case "title": {
                const title = String(value ?? "").trim();
                if (!title) return NextResponse.json({ error: "A gift name is required" }, { status: 400 });
                updates.title = title.slice(0, 200);
                break;
            }
            case "price":
                updates.price = value === null || value === "" ? null : Number(value);
                break;
            case "quantity":
                updates.quantity = Math.min(99, Math.max(1, Number(value) || 1));
                break;
            case "priority":
                updates.priority = ["low", "normal", "high"].includes(value) ? value : "normal";
                break;
            case "currency":
                updates.currency = String(value ?? "USD").slice(0, 8).toUpperCase();
                break;
            case "claimed_by": {
                const claimed = value === null ? null : String(value).trim().slice(0, 60) || null;
                updates.claimed_by = claimed;
                updates.claimed_at = claimed ? new Date().toISOString() : null;
                break;
            }
            default:
                updates[field] = value === null || value === "" ? null : String(value).slice(0, 2000);
        }
    }

    if (Object.keys(updates).length) {
        const assignments = Object.keys(updates).map((key) => `${key} = @${key}`);
        db.prepare(
            `UPDATE items SET ${assignments.join(", ")}, updated_at = datetime('now') WHERE id = @id`,
        ).run({ ...updates, id: item.id });
        touchList(item.list_id);
    }

    return NextResponse.json(db.prepare("SELECT * FROM items WHERE id = ?").get(item.id));
}

export async function DELETE(_request: Request, { params }: Context) {
    const { id } = await params;
    const item = db.prepare("SELECT * FROM items WHERE id = ?").get(id) as GiftItem | undefined;
    if (!item) return NextResponse.json({ error: "Gift not found" }, { status: 404 });

    db.prepare("DELETE FROM items WHERE id = ?").run(item.id);
    touchList(item.list_id);

    return NextResponse.json({ ok: true });
}
