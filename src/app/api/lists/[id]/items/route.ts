import { NextResponse } from "next/server";
import { db, newId } from "@/lib/db";
import { getItems, getList, nextItemPosition, touchList } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
    const { id } = await params;
    const list = getList(id);
    if (!list) return NextResponse.json({ error: "List not found" }, { status: 404 });

    return NextResponse.json(getItems(list.id));
}

export async function POST(request: Request, { params }: Context) {
    const { id } = await params;
    const list = getList(id);
    if (!list) return NextResponse.json({ error: "List not found" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const title = String(body.title ?? "").trim();
    if (!title) return NextResponse.json({ error: "A gift name is required" }, { status: 400 });

    const item = {
        id: newId(),
        list_id: list.id,
        title: title.slice(0, 200),
        url: body.url ? String(body.url).slice(0, 2000) : null,
        image_url: body.image_url ? String(body.image_url).slice(0, 2000) : null,
        price: body.price === null || body.price === undefined || body.price === "" ? null : Number(body.price),
        currency: String(body.currency ?? "USD").slice(0, 8).toUpperCase(),
        notes: body.notes ? String(body.notes).slice(0, 500) : null,
        quantity: Math.min(99, Math.max(1, Number(body.quantity ?? 1) || 1)),
        priority: ["low", "normal", "high"].includes(body.priority) ? body.priority : "normal",
        position: nextItemPosition(list.id),
    };

    db.prepare(
        `INSERT INTO items (id, list_id, title, url, image_url, price, currency, notes, quantity, priority, position)
         VALUES (@id, @list_id, @title, @url, @image_url, @price, @currency, @notes, @quantity, @priority, @position)`,
    ).run(item);
    touchList(list.id);

    return NextResponse.json(db.prepare("SELECT * FROM items WHERE id = ?").get(item.id), { status: 201 });
}
