import { notFound } from "next/navigation";
import { getList, getListsWithItems } from "@/lib/queries";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function ListPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const list = getList(slug);
    if (!list) notFound();

    return <AppShell initialLists={getListsWithItems()} initialListId={list.id} />;
}
