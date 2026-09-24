"use client";

import { ArrowDown, ArrowUp, Edit02, Gift01, LinkExternal02, Star01, Trash01 } from "@untitledui/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cx, formatPrice, hostnameOf } from "@/lib/cx";
import type { GiftItem } from "@/lib/types";

export interface GiftCardProps {
    item: GiftItem;
    editMode: boolean;
    isFirst: boolean;
    isLast: boolean;
    onEdit: (item: GiftItem) => void;
    onDelete: (item: GiftItem) => void;
    onMove: (item: GiftItem, direction: -1 | 1) => void;
}

export function GiftCard({ item, editMode, isFirst, isLast, onEdit, onDelete, onMove }: GiftCardProps) {
    const price = formatPrice(item.price, item.currency);
    const host = hostnameOf(item.url);

    return (
        <article
            className={cx(
                "group relative flex flex-col overflow-hidden rounded-2xl border border-secondary bg-primary shadow-xs transition duration-200",
                "hover:-translate-y-0.5 hover:border-primary hover:shadow-lg",
            )}
        >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary">
                {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={item.image_url}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover transition duration-300 group-hover:scale-[1.03]"
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
            </div>

            <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <h3 className="line-clamp-2 text-sm font-semibold text-primary sm:text-base">{item.title}</h3>
                    {price && (
                        <span className="text-sm font-semibold text-primary tabular-nums sm:shrink-0 sm:text-base">{price}</span>
                    )}
                </div>

                {item.notes && <p className="line-clamp-2 text-xs text-tertiary sm:text-sm">{item.notes}</p>}

                {editMode ? (
                    <>
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
                        </div>
                    </>
                ) : (
                    host && (
                        <a
                            href={item.url ?? undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cx(
                                "mt-auto flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition",
                                "bg-brand-subtle text-brand hover:brightness-95 dark:hover:brightness-125",
                                "outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-brand)]",
                            )}
                        >
                            <span className="truncate">{host}</span>
                            <LinkExternal02 className="size-3.5 shrink-0" />
                        </a>
                    )
                )}
            </div>
        </article>
    );
}
