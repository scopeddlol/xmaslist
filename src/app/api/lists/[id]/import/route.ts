import { NextResponse } from "next/server";
import { db, newId, slugify } from "@/lib/db";
import { parseMarkdown } from "@/lib/markdown";
import { getItems, getList, nextItemPosition, nextListPosition } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

/**
 * Import markdown into a list. `id` may be the literal "new", in which case a
 * list is created from the document's H1 (or the supplied name).
 */
export async function POST(request: Request, { params }: Context) {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const markdown = String(body.markdown ?? "");

    if (!markdown.trim()) return NextResponse.json({ error: "The file looks empty" }, { status: 400 });

    const parsed = parseMarkdown(markdown);
    if (!parsed.items.length)
        return NextResponse.json(
            { error: "No gifts found. Use a bullet list, e.g. `- [Gift name](https://link) — $25`" },
            { status: 422 },
        );

    let list = id === "new" ? undefined : getList(id);

    if (!list) {
        const name = String(body.name ?? "").trim() || parsed.name || "Imported list";
        const created = {
            id: newId(),
            slug: slugify(name),
            name: name.slice(0, 80),
            description: parsed.description,
            accent: "red",
            position: nextListPosition(),
        };
        db.prepare(
            "INSERT INTO lists (id, slug, name, description, accent, position) VALUES (@id, @slug, @name, @description, @accent, @position)",
        ).run(created);
        list = getList(created.id)!;
    }

    const insert = db.prepare(
        `INSERT INTO items (id, list_id, title, url, image_url, price, currency, notes, quantity, position)
         VALUES (@id, @list_id, @title, @url, @image_url, @price, @currency, @notes, @quantity, @position)`,
    );

    let position = nextItemPosition(list.id);
    db.transaction(() => {
        for (const item of parsed.items) {
            insert.run({ ...item, id: newId(), list_id: list!.id, position: position++ });
        }
        db.prepare("UPDATE lists SET updated_at = datetime('now') WHERE id = ?").run(list!.id);
    })();

    return NextResponse.json({ ...list, items: getItems(list.id), imported: parsed.items.length }, { status: 201 });
}
