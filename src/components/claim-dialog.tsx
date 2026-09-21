"use client";

import { CheckCircle } from "@untitledui/icons";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import type { GiftItem } from "@/lib/types";

const STORAGE_KEY = "xmas-shopper-name";

export interface ClaimDialogProps {
    item: GiftItem | null;
    onOpenChange: (open: boolean) => void;
    onConfirm: (item: GiftItem, name: string) => Promise<void>;
}

export function ClaimDialog({ item, onOpenChange, onConfirm }: ClaimDialogProps) {
    const [name, setName] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!item) return;
        try {
            setName(localStorage.getItem(STORAGE_KEY) ?? "");
        } catch {
            setName("");
        }
    }, [item]);

    async function confirm() {
        if (!item) return;
        const trimmed = name.trim() || "Someone";

        setBusy(true);
        try {
            try {
                localStorage.setItem(STORAGE_KEY, trimmed);
            } catch {
                /* private browsing — not worth failing over */
            }
            await onConfirm(item, trimmed);
            onOpenChange(false);
        } finally {
            setBusy(false);
        }
    }

    return (
        <Modal
            isOpen={Boolean(item)}
            onOpenChange={onOpenChange}
            size="sm"
            title="Claim this gift"
            description={item ? `So nobody else buys “${item.title}” too.` : undefined}
            footer={
                <>
                    <Button variant="secondary" onPress={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button isDisabled={busy} onPress={() => void confirm()}>
                        <CheckCircle className="size-4" /> {busy ? "Saving…" : "I'll get this"}
                    </Button>
                </>
            }
        >
            <Input
                label="Your name"
                placeholder="Aunt Jo"
                value={name}
                autoFocus
                hint="Shown on the gift so the family can coordinate."
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === "Enter") void confirm();
                }}
            />
        </Modal>
    );
}
