"use client";

import { AlertCircle, Gift01, Link01, RefreshCcw01 } from "@untitledui/icons";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select, TextArea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import type { GiftItem, Priority } from "@/lib/types";

const CURRENCIES = ["USD", "GBP", "EUR", "CAD", "AUD", "NZD", "SEK", "NOK", "DKK", "CHF", "JPY", "INR", "BRL", "PLN"];

interface Draft {
    title: string;
    url: string;
    image_url: string;
    price: string;
    currency: string;
    notes: string;
    quantity: string;
    priority: Priority;
}

const EMPTY: Draft = {
    title: "",
    url: "",
    image_url: "",
    price: "",
    currency: "USD",
    notes: "",
    quantity: "1",
    priority: "normal",
};

function toDraft(item: GiftItem | null): Draft {
    if (!item) return EMPTY;
    return {
        title: item.title,
        url: item.url ?? "",
        image_url: item.image_url ?? "",
        price: item.price === null ? "" : String(item.price),
        currency: item.currency || "USD",
        notes: item.notes ?? "",
        quantity: String(item.quantity),
        priority: item.priority,
    };
}

export interface GiftDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    item: GiftItem | null;
    defaultCurrency: string;
    onSave: (values: Partial<GiftItem>) => Promise<void>;
}

export function GiftDialog({ isOpen, onOpenChange, item, defaultCurrency, onSave }: GiftDialogProps) {
    const [draft, setDraft] = useState<Draft>(EMPTY);
    const [fetching, setFetching] = useState(false);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setDraft(item ? toDraft(item) : { ...EMPTY, currency: defaultCurrency });
        setNotice(null);
        setError(null);
    }, [isOpen, item, defaultCurrency]);

    const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));

    async function lookup(url: string, { silent = false } = {}) {
        if (!url.trim()) return;

        setFetching(true);
        setError(null);
        setNotice(null);

        try {
            const found = await api.scrape(url.trim());
            setDraft((current) => ({
                ...current,
                title: current.title || found.title || "",
                image_url: current.image_url || found.image_url || "",
                price: current.price || (found.price !== null ? String(found.price) : ""),
                currency: found.currency || current.currency,
            }));
            setNotice(
                found.title || found.price || found.image_url
                    ? `Pulled details from ${found.site_name ?? "the page"}. Edit anything below.`
                    : "That page did not share any product details — fill things in by hand.",
            );
        } catch (cause) {
            if (!silent) setError(cause instanceof Error ? cause.message : "Could not read that link");
        } finally {
            setFetching(false);
        }
    }

    async function save() {
        if (!draft.title.trim()) {
            setError("Give the gift a name");
            return;
        }

        setSaving(true);
        setError(null);

        try {
            await onSave({
                title: draft.title.trim(),
                url: draft.url.trim() || null,
                image_url: draft.image_url.trim() || null,
                price: draft.price.trim() === "" ? null : Number(draft.price),
                currency: draft.currency,
                notes: draft.notes.trim() || null,
                quantity: Number(draft.quantity) || 1,
                priority: draft.priority,
            });
            onOpenChange(false);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Could not save that gift");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            size="lg"
            title={item ? "Edit gift" : "Add a gift"}
            description="Paste a link and we will pull the name, image and price. Everything stays editable."
            footer={
                <>
                    <Button variant="secondary" onPress={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onPress={save} isDisabled={saving}>
                        {saving ? "Saving…" : item ? "Save changes" : "Add gift"}
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-4">
                <Input
                    label="Link"
                    inputMode="url"
                    placeholder="https://shop.example.com/the-perfect-gift"
                    value={draft.url}
                    icon={<Link01 className="size-4.5" />}
                    onChange={(event) => set("url", event.target.value)}
                    onBlur={(event) => {
                        if (event.target.value.trim() && !draft.title.trim()) void lookup(event.target.value, { silent: true });
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            void lookup(draft.url);
                        }
                    }}
                    trailing={
                        <Button
                            size="sm"
                            variant="tertiary"
                            onPress={() => void lookup(draft.url)}
                            isDisabled={fetching || !draft.url.trim()}
                        >
                            <RefreshCcw01 className={fetching ? "size-4 animate-spin" : "size-4"} />
                            {fetching ? "Fetching" : "Fetch"}
                        </Button>
                    }
                />

                {notice && <p className="-mt-2 text-sm text-tertiary">{notice}</p>}
                {error && (
                    <p className="-mt-2 flex items-center gap-1.5 text-sm text-error-600 dark:text-error-300">
                        <AlertCircle className="size-4 shrink-0" /> {error}
                    </p>
                )}

                <Input
                    label="Gift name"
                    placeholder="Lego Millennium Falcon"
                    value={draft.title}
                    onChange={(event) => set("title", event.target.value)}
                />

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Input
                        label="Price"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={draft.price}
                        onChange={(event) => set("price", event.target.value.replace(/[^\d.]/g, ""))}
                    />
                    <Select
                        label="Currency"
                        value={draft.currency}
                        options={CURRENCIES.map((code) => ({ value: code, label: code }))}
                        onChange={(event) => set("currency", event.target.value)}
                    />
                    <Input
                        label="Quantity"
                        inputMode="numeric"
                        value={draft.quantity}
                        onChange={(event) => set("quantity", event.target.value.replace(/\D/g, "").slice(0, 2))}
                    />
                    <Select
                        label="Priority"
                        value={draft.priority}
                        options={[
                            { value: "high", label: "Most wanted" },
                            { value: "normal", label: "Normal" },
                            { value: "low", label: "Nice to have" },
                        ]}
                        onChange={(event) => set("priority", event.target.value as Priority)}
                    />
                </div>

                <div className="flex items-end gap-3">
                    <Input
                        label="Image URL"
                        placeholder="https://…/photo.jpg"
                        value={draft.image_url}
                        wrapperClassName="flex-1"
                        onChange={(event) => set("image_url", event.target.value)}
                    />
                    <div className="size-[46px] shrink-0 overflow-hidden rounded-lg border border-secondary bg-secondary">
                        {draft.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={draft.image_url} alt="" className="size-full object-cover" />
                        ) : (
                            <div className="flex size-full items-center justify-center">
                                <Gift01 className="size-5 text-quaternary" />
                            </div>
                        )}
                    </div>
                </div>

                <TextArea
                    label="Notes"
                    placeholder="Size medium, in blue if they have it"
                    value={draft.notes}
                    onChange={(event) => set("notes", event.target.value)}
                />
            </div>
        </Modal>
    );
}
