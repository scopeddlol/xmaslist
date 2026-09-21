"use client";

import { FileCode01, UploadCloud02 } from "@untitledui/icons";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, TextArea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { cx } from "@/lib/cx";
import type { GiftList } from "@/lib/types";

const SAMPLE = `# Ellie's Christmas list

- [Lego Millennium Falcon](https://lego.com/…) — $159.99 — the big one
- [Wool socks](https://example.com/socks) — £18 ×3
- Chemex filters — $12`;

export interface ImportDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    lists: GiftList[];
    onImport: (target: string, markdown: string) => Promise<number>;
}

export function ImportDialog({ isOpen, onOpenChange, lists, onImport }: ImportDialogProps) {
    const [markdown, setMarkdown] = useState("");
    const [target, setTarget] = useState("new");
    const [dragging, setDragging] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        setMarkdown("");
        setError(null);
        setTarget("new");
    }, [isOpen]);

    async function readFile(file: File | undefined) {
        if (!file) return;
        setError(null);
        setMarkdown(await file.text());
    }

    async function submit() {
        if (!markdown.trim()) {
            setError("Add a markdown file or paste your list below");
            return;
        }

        setBusy(true);
        setError(null);
        try {
            await onImport(target, markdown);
            onOpenChange(false);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Could not import that file");
        } finally {
            setBusy(false);
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            size="lg"
            title="Import from markdown"
            description="Drop a .md file or paste it in. Links, prices and notes are picked out automatically."
            footer={
                <>
                    <Button variant="secondary" onPress={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button isDisabled={busy} onPress={() => void submit()}>
                        {busy ? "Importing…" : "Import gifts"}
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-4">
                <div
                    onDragOver={(event) => {
                        event.preventDefault();
                        setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(event) => {
                        event.preventDefault();
                        setDragging(false);
                        void readFile(event.dataTransfer.files[0]);
                    }}
                    className={cx(
                        "flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-8 text-center transition",
                        dragging ? "border-brand bg-brand-subtle" : "border-primary bg-secondary hover:bg-tertiary",
                    )}
                    onClick={() => fileInput.current?.click()}
                >
                    <span className="flex size-10 items-center justify-center rounded-lg border border-secondary bg-primary shadow-xs">
                        <UploadCloud02 className="size-5 text-tertiary" />
                    </span>
                    <p className="text-sm font-semibold text-brand">
                        Click to upload <span className="font-normal text-tertiary">or drag and drop</span>
                    </p>
                    <p className="text-xs text-quaternary">Markdown (.md, .markdown, .txt)</p>
                    <input
                        ref={fileInput}
                        type="file"
                        accept=".md,.markdown,.txt,text/markdown,text/plain"
                        className="hidden"
                        onChange={(event) => void readFile(event.target.files?.[0])}
                    />
                </div>

                <Select
                    label="Import into"
                    value={target}
                    options={[
                        { value: "new", label: "A brand new list" },
                        ...lists.map((list) => ({ value: list.id, label: list.name })),
                    ]}
                    onChange={(event) => setTarget(event.target.value)}
                />

                <TextArea
                    label="Markdown"
                    className="min-h-40 font-mono text-xs"
                    placeholder={SAMPLE}
                    value={markdown}
                    onChange={(event) => setMarkdown(event.target.value)}
                    error={error}
                    hint={
                        <span className="flex items-start gap-1.5">
                            <FileCode01 className="mt-0.5 size-3.5 shrink-0" />
                            <span>
                                Bullets, checkboxes and tables all work — e.g. <code className="whitespace-nowrap">- [Name](link) — $25</code>
                            </span>
                        </span>
                    }
                />
            </div>
        </Modal>
    );
}
