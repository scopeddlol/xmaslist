"use client";

import {
    Check,
    Copy01,
    Edit02,
    Gift01,
    Moon01,
    Plus,
    Settings01,
    Sun,
    UploadCloud01,
} from "@untitledui/icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GiftCard } from "@/components/gift-card";
import { GiftDialog } from "@/components/gift-dialog";
import { ImportDialog } from "@/components/import-dialog";
import { ListDialog } from "@/components/list-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { cx, formatPrice } from "@/lib/cx";
import type { GiftItem, GiftListWithItems } from "@/lib/types";

export interface AppShellProps {
    initialLists: GiftListWithItems[];
    initialListId?: string;
}

export function AppShell({ initialLists, initialListId }: AppShellProps) {
    const [lists, setLists] = useState(initialLists);
    const [activeId, setActiveId] = useState<string | null>(initialListId ?? initialLists[0]?.id ?? null);
    const [editMode, setEditMode] = useState(false);
    const [dark, setDark] = useState(false);
    const [copied, setCopied] = useState(false);

    const [giftDialog, setGiftDialog] = useState<{ open: boolean; item: GiftItem | null }>({ open: false, item: null });
    const [listDialog, setListDialog] = useState<{ open: boolean; editing: boolean }>({ open: false, editing: false });
    const [importOpen, setImportOpen] = useState(false);

    const active = useMemo(() => lists.find((list) => list.id === activeId) ?? lists[0] ?? null, [lists, activeId]);

    useEffect(() => setDark(document.documentElement.classList.contains("dark-mode")), []);

    // Keep the address bar on the shareable per-list URL.
    useEffect(() => {
        if (!active) return;
        const path = `/l/${active.slug}`;
        if (window.location.pathname !== path) window.history.replaceState(null, "", path);
    }, [active]);

    function toggleTheme() {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle("dark-mode", next);
        try {
            localStorage.setItem("xmas-theme", next ? "dark" : "light");
        } catch {
            /* ignore */
        }
    }

    const refresh = useCallback(async () => setLists(await api.lists()), []);

    const patchItems = useCallback(
        (listId: string, update: (items: GiftItem[]) => GiftItem[]) =>
            setLists((current) =>
                current.map((list) => (list.id === listId ? { ...list, items: update(list.items) } : list)),
            ),
        [],
    );

    async function saveGift(values: Partial<GiftItem>) {
        if (!active) return;

        if (giftDialog.item) {
            const updated = await api.updateItem(giftDialog.item.id, values);
            patchItems(active.id, (items) => items.map((item) => (item.id === updated.id ? updated : item)));
        } else {
            const created = await api.createItem(active.id, values);
            patchItems(active.id, (items) => [...items, created]);
        }
    }

    async function removeGift(item: GiftItem) {
        patchItems(item.list_id, (items) => items.filter((current) => current.id !== item.id));
        await api.deleteItem(item.id);
    }

    async function move(item: GiftItem, direction: -1 | 1) {
        if (!active) return;

        const ordered = [...active.items];
        const index = ordered.findIndex((current) => current.id === item.id);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= ordered.length) return;

        [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
        patchItems(active.id, () => ordered);
        await api.reorder(ordered.map((current) => current.id));
    }

    async function saveList(values: { name: string; description: string | null }) {
        if (listDialog.editing && active) {
            const updated = await api.updateList(active.id, values);
            setLists((current) => current.map((list) => (list.id === updated.id ? { ...list, ...updated } : list)));
        } else {
            const created = await api.createList(values);
            setLists((current) => [...current, created]);
            setActiveId(created.id);
            setEditMode(true);
        }
    }

    async function deleteList() {
        if (!active) return;
        await api.deleteList(active.id);
        const remaining = lists.filter((list) => list.id !== active.id);
        setLists(remaining);
        setActiveId(remaining[0]?.id ?? null);
    }

    async function importMarkdown(target: string, markdown: string) {
        const result = await api.importMarkdown(target, markdown);
        await refresh();
        setActiveId(result.id);
        return result.imported;
    }

    async function copyLink() {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            /* clipboard blocked — the URL is in the address bar anyway */
        }
    }

    const stats = useMemo(() => {
        const items = active?.items ?? [];
        const currency = items.find((item) => item.price !== null)?.currency ?? "USD";
        const total = items
            .filter((item) => item.price !== null && item.currency === currency)
            .reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);

        return { count: items.length, total: total > 0 ? formatPrice(total, currency) : null };
    }, [active]);

    return (
        <div className="flex min-h-dvh flex-col">
            <header className="sticky top-0 z-30 border-b border-secondary bg-[var(--bg-page)]/80 backdrop-blur-xl">
                <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-solid shadow-xs">
                        <Gift01 className="size-5 text-brand-fg" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-primary">Christmas List</p>
                        <p className="truncate text-xs text-tertiary">
                            {editMode ? "Editor mode — changes save instantly" : "Everything on the list"}
                        </p>
                    </div>

                    <Button variant="tertiary" size="sm" iconOnly aria-label="Copy share link" onPress={() => void copyLink()}>
                        {copied ? <Check className="size-4.5 text-success-600" /> : <Copy01 className="size-4.5" />}
                    </Button>
                    <Button
                        variant="tertiary"
                        size="sm"
                        iconOnly
                        aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
                        onPress={toggleTheme}
                    >
                        {dark ? <Sun className="size-4.5" /> : <Moon01 className="size-4.5" />}
                    </Button>
                    <Button
                        variant={editMode ? "primary" : "secondary"}
                        size="sm"
                        iconOnly={!editMode}
                        aria-label={editMode ? "Leave editor mode" : "Enter editor mode"}
                        onPress={() => setEditMode((current) => !current)}
                    >
                        {editMode ? (
                            <>
                                <Check className="size-4" /> Done
                            </>
                        ) : (
                            <Edit02 className="size-4.5" />
                        )}
                    </Button>
                </div>

                {lists.length > 0 && (
                    <nav className="no-scrollbar -mx-1 mt-3 flex gap-1 overflow-x-auto px-1">
                        {lists.map((list) => (
                            <button
                                key={list.id}
                                type="button"
                                onClick={() => setActiveId(list.id)}
                                className={cx(
                                    "flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap transition",
                                    list.id === active?.id
                                        ? "bg-brand-solid text-brand-fg shadow-xs"
                                        : "text-tertiary hover:bg-tertiary hover:text-secondary",
                                )}
                            >
                                {list.name}
                                <span className={cx("text-xs font-medium", list.id === active?.id ? "opacity-80" : "opacity-60")}>
                                    {list.items.length}
                                </span>
                            </button>
                        ))}
                        {editMode && (
                            <button
                                type="button"
                                onClick={() => setListDialog({ open: true, editing: false })}
                                className="flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-primary px-3.5 py-1.5 text-sm font-semibold text-tertiary transition hover:border-brand hover:text-brand"
                            >
                                <Plus className="size-4" /> New list
                            </button>
                        )}
                    </nav>
                )}
                </div>
            </header>

            {active ? (
                <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-24 sm:px-6 lg:px-8">
                    <section className="flex flex-col gap-4 border-b border-secondary py-6 sm:py-8">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div className="min-w-0">
                                <h1 className="text-display-xs font-semibold text-primary sm:text-display-sm">{active.name}</h1>
                                {active.description && <p className="mt-1.5 max-w-2xl text-secondary">{active.description}</p>}
                            </div>

                            {editMode && (
                                <div className="flex flex-wrap items-center gap-2">
                                    <Button variant="secondary" onPress={() => setImportOpen(true)}>
                                        <UploadCloud01 className="size-4" /> Import
                                    </Button>
                                    <Button variant="secondary" iconOnly aria-label="List settings" onPress={() => setListDialog({ open: true, editing: true })}>
                                        <Settings01 className="size-4.5" />
                                    </Button>
                                    <Button onPress={() => setGiftDialog({ open: true, item: null })}>
                                        <Plus className="size-4" /> Add gift
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Badge>
                                {stats.count} {stats.count === 1 ? "gift" : "gifts"}
                            </Badge>
                            {stats.total && <Badge color="brand">{stats.total} total</Badge>}
                        </div>
                    </section>

                    {active.items.length > 0 ? (
                        <div
                            className={cx(
                                "grid gap-3 py-6 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4",
                                editMode ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2",
                            )}
                        >
                            {active.items.map((item, index) => (
                                <GiftCard
                                    key={item.id}
                                    item={item}
                                    editMode={editMode}
                                    isFirst={index === 0}
                                    isLast={index === active.items.length - 1}
                                    onEdit={(target) => setGiftDialog({ open: true, item: target })}
                                    onDelete={(target) => void removeGift(target)}
                                    onMove={(target, direction) => void move(target, direction)}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="This list is empty"
                            body="Add gifts by hand, or import a markdown file you already have."
                            action={
                                editMode ? (
                                    <div className="flex flex-wrap justify-center gap-2">
                                        <Button onPress={() => setGiftDialog({ open: true, item: null })}>
                                            <Plus className="size-4" /> Add a gift
                                        </Button>
                                        <Button variant="secondary" onPress={() => setImportOpen(true)}>
                                            <UploadCloud01 className="size-4" /> Import markdown
                                        </Button>
                                    </div>
                                ) : (
                                    <Button variant="secondary" onPress={() => setEditMode(true)}>
                                        <Edit02 className="size-4" /> Open the editor
                                    </Button>
                                )
                            }
                        />
                    )}
                </main>
            ) : (
                <EmptyState
                    title="Start your first list"
                    body="Create a list for each person, then fill it with links — we will pull in names, images and prices."
                    action={
                        <div className="flex flex-wrap justify-center gap-2">
                            <Button onPress={() => setListDialog({ open: true, editing: false })}>
                                <Plus className="size-4" /> New list
                            </Button>
                            <Button variant="secondary" onPress={() => setImportOpen(true)}>
                                <UploadCloud01 className="size-4" /> Import markdown
                            </Button>
                        </div>
                    }
                />
            )}

            <GiftDialog
                isOpen={giftDialog.open}
                onOpenChange={(open) => setGiftDialog((current) => ({ ...current, open }))}
                item={giftDialog.item}
                defaultCurrency={active?.items.find((item) => item.price !== null)?.currency ?? "USD"}
                onSave={saveGift}
            />

            <ListDialog
                isOpen={listDialog.open}
                onOpenChange={(open) => setListDialog((current) => ({ ...current, open }))}
                list={listDialog.editing ? active : null}
                onSave={saveList}
                onDelete={listDialog.editing ? deleteList : undefined}
            />

            <ImportDialog
                isOpen={importOpen}
                onOpenChange={setImportOpen}
                lists={lists}
                onImport={importMarkdown}
            />

        </div>
    );
}

function EmptyState({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-center">
            <span className="flex size-12 items-center justify-center rounded-xl border border-secondary bg-primary shadow-xs">
                <Gift01 className="size-6 text-tertiary" />
            </span>
            <h2 className="text-lg font-semibold text-primary">{title}</h2>
            <p className="max-w-sm text-sm text-tertiary">{body}</p>
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}
