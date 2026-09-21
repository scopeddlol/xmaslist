"use client";

import type { ReactNode } from "react";
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";
import { cx } from "@/lib/cx";

type Variant = "primary" | "secondary" | "tertiary" | "destructive" | "ghost-brand";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
    primary:
        "bg-brand-solid text-brand-fg shadow-xs hover:brightness-[1.08] active:brightness-95 disabled:bg-quaternary disabled:text-quaternary disabled:shadow-none",
    secondary:
        "bg-primary text-secondary border border-primary shadow-xs hover:bg-secondary disabled:text-quaternary",
    tertiary: "text-tertiary hover:bg-tertiary hover:text-secondary disabled:text-quaternary",
    destructive: "bg-error-600 text-white shadow-xs hover:bg-error-700",
    "ghost-brand": "bg-brand-subtle text-brand hover:brightness-95 dark:hover:brightness-125",
};

const SIZES: Record<Size, string> = {
    sm: "h-9 gap-1.5 px-3 text-sm",
    md: "h-10 gap-1.5 px-3.5 text-sm",
    lg: "h-11 gap-2 px-4 text-base",
};

const ICON_SIZES: Record<Size, string> = {
    sm: "size-9",
    md: "size-10",
    lg: "size-11",
};

export interface ButtonProps extends AriaButtonProps {
    variant?: Variant;
    size?: Size;
    iconOnly?: boolean;
    children?: ReactNode;
}

export function Button({ variant = "primary", size = "md", iconOnly, className, ...props }: ButtonProps) {
    return (
        <AriaButton
            {...props}
            className={cx(
                "inline-flex cursor-pointer items-center justify-center rounded-lg font-semibold whitespace-nowrap transition duration-100",
                "outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring-brand)]",
                "disabled:cursor-not-allowed disabled:opacity-70",
                iconOnly ? cx(ICON_SIZES[size], "px-0") : SIZES[size],
                VARIANTS[variant],
                typeof className === "string" ? className : undefined,
            )}
        />
    );
}
