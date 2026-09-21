import type { ReactNode } from "react";
import { cx } from "@/lib/cx";

type Color = "gray" | "brand" | "success" | "warning";

const COLORS: Record<Color, string> = {
    gray: "bg-tertiary text-tertiary ring-[var(--border-secondary)]",
    brand: "bg-brand-subtle text-brand ring-[var(--border-brand)]",
    success: "bg-success-50 text-success-700 ring-success-200 dark:bg-success-900/30 dark:text-success-300 dark:ring-success-800",
    warning: "bg-warning-50 text-warning-700 ring-warning-100 dark:bg-warning-600/20 dark:text-warning-100 dark:ring-warning-700",
};

export function Badge({
    color = "gray",
    children,
    className,
}: {
    color?: Color;
    children: ReactNode;
    className?: string;
}) {
    return (
        <span
            className={cx(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                COLORS[color],
                className,
            )}
        >
            {children}
        </span>
    );
}
