"use client";

import { X } from "@untitledui/icons";
import type { ReactNode } from "react";
import { Dialog, Heading, Modal as AriaModal, ModalOverlay } from "react-aria-components";
import { cx } from "@/lib/cx";
import { Button } from "./button";

export interface ModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: "sm" | "md" | "lg";
}

const SIZES = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };

export function Modal({ isOpen, onOpenChange, title, description, children, footer, size = "md" }: ModalProps) {
    return (
        <ModalOverlay
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            isDismissable
            className={cx(
                "fixed inset-0 z-50 flex items-end justify-center bg-overlay p-0 backdrop-blur-sm sm:items-center sm:p-4",
                "data-[entering]:animate-[fade-in_0.15s_ease-out] data-[exiting]:animate-[fade-in_0.12s_ease-in_reverse]",
            )}
        >
            <AriaModal
                className={cx(
                    "w-full bg-primary shadow-2xl outline-none",
                    "max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl",
                    "data-[entering]:animate-[rise_0.28s_cubic-bezier(0.16,1,0.3,1)]",
                    SIZES[size],
                )}
            >
                <Dialog className="outline-none">
                    {({ close }) => (
                        <>
                            <div className="flex items-start gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
                                <div className="flex-1">
                                    <Heading slot="title" className="text-lg font-semibold text-primary">
                                        {title}
                                    </Heading>
                                    {description && <p className="mt-1 text-sm text-tertiary">{description}</p>}
                                </div>
                                <Button variant="tertiary" size="sm" iconOnly aria-label="Close" onPress={close}>
                                    <X className="size-5" />
                                </Button>
                            </div>

                            <div className="px-5 py-5 sm:px-6">{children}</div>

                            {footer && (
                                <div className="flex flex-col-reverse gap-3 border-t border-secondary px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                                    {footer}
                                </div>
                            )}
                        </>
                    )}
                </Dialog>
            </AriaModal>
        </ModalOverlay>
    );
}
