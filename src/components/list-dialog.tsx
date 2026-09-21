"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, TextArea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import type { GiftList } from "@/lib/types";

export interface ListDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    list: GiftList | null;
    onSave: (values: { name: string; description: string | null }) => Promise<void>;
    onDelete?: () => Promise<void>;
}

export function ListDialog({ isOpen, onOpenChange, list, onSave, onDelete }: ListDialogProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        setName(list?.name ?? "");
        setDescription(list?.description ?? "");
        setConfirmingDelete(false);
        setError(null);
    }, [isOpen, list]);

    async function run(action: () => Promise<void>) {
        setBusy(true);
        setError(null);
        try {
            await action();
            onOpenChange(false);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Something went wrong");
        } finally {
            setBusy(false);
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            title={list ? "List settings" : "New list"}
            description={list ? undefined : "One list per person, or one per occasion — whatever suits."}
            footer={
                <>
                    {list && onDelete && (
                        <Button
                            variant={confirmingDelete ? "destructive" : "tertiary"}
                            className="sm:mr-auto"
                            onPress={() => (confirmingDelete ? void run(onDelete) : setConfirmingDelete(true))}
                        >
                            {confirmingDelete ? "Yes, delete this list" : "Delete list"}
                        </Button>
                    )}
                    <Button variant="secondary" onPress={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        isDisabled={busy || !name.trim()}
                        onPress={() => void run(() => onSave({ name: name.trim(), description: description.trim() || null }))}
                    >
                        {busy ? "Saving…" : list ? "Save" : "Create list"}
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-4">
                <Input
                    label="List name"
                    placeholder="Ellie's Christmas list"
                    value={name}
                    autoFocus
                    onChange={(event) => setName(event.target.value)}
                />
                <TextArea
                    label="Description"
                    placeholder="Anything from here would be perfect. Sizes are in the notes!"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                />
                {error && <p className="text-sm text-error-600 dark:text-error-300">{error}</p>}
            </div>
        </Modal>
    );
}
