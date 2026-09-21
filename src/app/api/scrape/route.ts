import { NextResponse } from "next/server";
import { scrapeUrl } from "@/lib/scrape";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    const body = await request.json().catch(() => ({}));
    const url = String(body.url ?? "").trim();

    if (!url) return NextResponse.json({ error: "A link is required" }, { status: 400 });

    try {
        return NextResponse.json(await scrapeUrl(url.startsWith("http") ? url : `https://${url}`));
    } catch (error) {
        const message = error instanceof Error ? error.message : "Could not read that link";
        return NextResponse.json({ error: message }, { status: 422 });
    }
}
