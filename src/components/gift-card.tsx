"use client";

import {
    ArrowDown,
    ArrowUp,
    CheckCircle,
    Edit02,
    Gift01,
    LinkExternal02,
    Star01,
    Trash01,
} from "@untitledui/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cx, formatPrice, hostnameOf } from "@/lib/cx";
import type { GiftItem } from "@/lib/types";

export interface GiftCardProps {
    item: GiftItem;
    editMode: boolean;
    isFirst: boolean;
    isLast: boolean;
    onClaim: (item: GiftItem) => void;
    onUnclaim: (item: GiftItem) => void;
    onEdit: (item: GiftItem) => void;
    onDelete: (item: GiftItem) => void;
    onMove: (item: GiftItem, direction: -1 | 1) => void;
}

export function GiftCard({ item, editMode, isFirst, isLast, onClaim, onUnclaim, onEdit, onDelete, onMove }: GiftCardProps) {
    const price = formatPrice(item.price, item.currency);
    const host = hostnameOf(item.url);
    const claimed = Boolean(item.claimed_by);

    return (
        <article
            className={cx(
                "group relative flex flex-col overflow-hidden rounded-2xl border border-secondary bg-primary shadow-xs transition duration-200",
                "hover:-translate-y-0.5 hover:border-primary hover:shadow-lg",
                claimed && !editMode && "opacity-75",
            )}
        >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary">
                {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={item.image_url}
                        alt=""
                        loading="lazy"
                        className={cx(
                            "size-full object-cover transition duration-300 group-hover:scale-[1.03]",
                            claimed && "grayscale",
                        )}
                        onError={(event) => {
                            event.currentTarget.style.display = "none";
                        }}
                    />
                ) : (
                    <div className="flex size-full items-center justify-center bg-gradient-to-br from-[var(--brand-subtle)] to-transparent">
                        <Gift01 className="size-10 text-brand opacity-60" />
                    </div>
                )}

                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {item.priority === "high" && (
                        <Badge color="brand" className="backdrop-blur">
                            <Star01 className="size-3" /> Most wanted
                        </Badge>
                    )}
                    {item.quantity > 1 && <Badge className="backdrop-blur">×{item.quantity}</Badge>}
                </div>

                {claimed && (
                    <div className="absolute top-3 right-3">
                        <Badge color="success" className="backdrop-blur">
                            <CheckCircle className="size-3" /> {item.claimed_by}
                        </Badge>
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <h3 className="line-clamp-2 text-sm font-semibold text-primary sm:text-base">{item.title}</h3>
                    {price && (
                        <span className="text-sm font-semibold text-primary tabular-nums sm:shrink-0 sm:text-base">{price}</span>
                    )}
                </div>

                {item.notes && <p className="line-clamp-2 text-xs text-tertiary sm:text-sm">{item.notes}</p>}

                {host && (
                    <a
                        href={item.url ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-fit max-w-full items-center gap-1 text-xs font-medium text-brand hover:underline sm:text-sm"
                    >
                        <span className="truncate">{host}</span>
                        <LinkExternal02 className="size-3.5 shrink-0" />
                    </a>
                )}

                <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                    {editMode ? (
                        <>
                            <Button size="sm" variant="secondary" onPress={() => onEdit(item)}>
                                <Edit02 className="size-4" /> Edit
                            </Button>
                            <Button
                                size="sm"
                                variant="tertiary"
                                iconOnly
                                aria-label="Move up"
                                isDisabled={isFirst}
                                onPress={() => onMove(item, -1)}
                            >
                                <ArrowUp className="size-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="tertiary"
                                iconOnly
                                aria-label="Move down"
                                isDisabled={isLast}
                                onPress={() => onMove(item, 1)}
                            >
                                <ArrowDown className="size-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="tertiary"
                                iconOnly
                                aria-label={`Delete ${item.title}`}
                                className="ml-auto text-error-600 hover:bg-error-50 dark:text-error-300 dark:hover:bg-error-600/15"
                                onPress={() => onDelete(item)}
                            >
                                <Trash01 className="size-4" />
                            </Button>
                        </>
                    ) : claimed ? (
                        <div className="flex w-full flex-wrap items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success-700 dark:text-success-300">
                                <CheckCircle className="size-3.5" /> {item.claimed_by} is getting this
                            </span>
                            <button
                                type="button"
                                onClick={() => onUnclaim(item)}
                                className="cursor-pointer text-xs font-semibold text-tertiary underline-offset-2 hover:underline"
                            >
                                Undo
                            </button>
                        </div>
                    ) : (
                        <Button size="sm" variant="ghost-brand" className="w-full" onPress={() => onClaim(item)}>
                            <CheckCircle className="size-4" /> I&apos;ll get this
                        </Button>
                    )}
                </div>
            </div>
        </article>
    );
}
