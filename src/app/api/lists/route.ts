import { NextResponse } from "next/server";
import { db, newId, slugify } from "@/lib/db";
import { getItems, getListsWithItems, nextListPosition } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** Lists always travel with their items — the client renders both together. */
export async function GET() {
    return NextResponse.json(getListsWithItems());
}

export async function POST(request: Request) {
    const body = await request.json().catch(() => ({}));
    const name = String(body.name ?? "").trim();

    if (!name) return NextResponse.json({ error: "A list name is required" }, { status: 400 });

    const list = {
        id: newId(),
        slug: slugify(name),
        name: name.slice(0, 80),
        description: body.description ? String(body.description).slice(0, 280) : null,
        accent: typeof body.accent === "string" ? body.accent : "red",
        position: nextListPosition(),
    };

    db.prepare(
        "INSERT INTO lists (id, slug, name, description, accent, position) VALUES (@id, @slug, @name, @description, @accent, @position)",
    ).run(list);

    const created = db.prepare("SELECT * FROM lists WHERE id = ?").get(list.id) as Record<string, unknown>;
    return NextResponse.json({ ...created, items: getItems(list.id) }, { status: 201 });
}
