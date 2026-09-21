import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getItems, getList } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
    const { id } = await params;
    const list = getList(id);
    if (!list) return NextResponse.json({ error: "List not found" }, { status: 404 });

    return NextResponse.json({ ...list, items: getItems(list.id) });
}

export async function PATCH(request: Request, { params }: Context) {
    const { id } = await params;
    const list = getList(id);
    if (!list) return NextResponse.json({ error: "List not found" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const name = body.name === undefined ? list.name : String(body.name).trim().slice(0, 80);
    if (!name) return NextResponse.json({ error: "A list name is required" }, { status: 400 });

    db.prepare(
        "UPDATE lists SET name = ?, description = ?, accent = ?, updated_at = datetime('now') WHERE id = ?",
    ).run(
        name,
        body.description === undefined ? list.description : String(body.description ?? "").slice(0, 280) || null,
        body.accent === undefined ? list.accent : String(body.accent),
        list.id,
    );

    return NextResponse.json(db.prepare("SELECT * FROM lists WHERE id = ?").get(list.id));
}

export async function DELETE(_request: Request, { params }: Context) {
    const { id } = await params;
    const list = getList(id);
    if (!list) return NextResponse.json({ error: "List not found" }, { status: 404 });

    db.prepare("DELETE FROM lists WHERE id = ?").run(list.id);
    return NextResponse.json({ ok: true });
}
