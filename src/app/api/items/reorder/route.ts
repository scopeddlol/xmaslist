import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    const body = await request.json().catch(() => ({}));
    const ids: unknown = body.ids;

    if (!Array.isArray(ids)) return NextResponse.json({ error: "Expected an array of gift ids" }, { status: 400 });

    const update = db.prepare("UPDATE items SET position = ? WHERE id = ?");
    db.transaction((ordered: string[]) => ordered.forEach((id, index) => update.run(index, id)))(ids.map(String));

    return NextResponse.json({ ok: true });
}
