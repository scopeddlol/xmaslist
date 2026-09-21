import { getListsWithItems } from "@/lib/queries";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default function HomePage() {
    return <AppShell initialLists={getListsWithItems()} />;
}
