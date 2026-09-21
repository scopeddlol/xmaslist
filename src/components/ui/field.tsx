"use client";

import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { useId } from "react";
import { cx } from "@/lib/cx";

const CONTROL =
    "w-full rounded-lg border border-primary bg-primary px-3.5 py-2.5 text-base text-primary shadow-xs transition placeholder-default md:text-sm " +
    "focus:outline-none focus:border-[var(--brand-solid)] focus:ring-4 focus:ring-[var(--ring-brand)] disabled:bg-secondary disabled:text-quaternary";

interface FieldShellProps {
    label?: string;
    hint?: ReactNode;
    error?: string | null;
    htmlFor?: string;
    children: ReactNode;
    className?: string;
}

function FieldShell({ label, hint, error, htmlFor, children, className }: FieldShellProps) {
    return (
        <div className={cx("flex flex-col gap-1.5", className)}>
            {label && (
                <label htmlFor={htmlFor} className="text-sm font-medium text-secondary">
                    {label}
                </label>
            )}
            {children}
            {(error || hint) && (
                <p className={cx("text-sm", error ? "text-error-600 dark:text-error-300" : "text-tertiary")}>{error ?? hint}</p>
            )}
        </div>
    );
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
    label?: string;
    hint?: ReactNode;
    error?: string | null;
    icon?: ReactNode;
    trailing?: ReactNode;
    wrapperClassName?: string;
}

export function Input({ label, hint, error, icon, trailing, className, wrapperClassName, ...props }: InputProps) {
    const generated = useId();
    const id = props.id ?? generated;

    return (
        <FieldShell label={label} hint={hint} error={error} htmlFor={id} className={wrapperClassName}>
            <div className="relative flex items-center">
                {icon && <span className="pointer-events-none absolute left-3.5 text-quaternary">{icon}</span>}
                <input
                    {...props}
                    id={id}
                    className={cx(
                        CONTROL,
                        icon && "pl-10.5",
                        trailing && "pr-11",
                        error && "border-error-300 focus:border-error-500 focus:ring-error-500/20",
                        className,
                    )}
                />
                {trailing && <span className="absolute right-2 flex items-center">{trailing}</span>}
            </div>
        </FieldShell>
    );
}

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    hint?: ReactNode;
    error?: string | null;
}

export function TextArea({ label, hint, error, className, ...props }: TextAreaProps) {
    const generated = useId();
    const id = props.id ?? generated;

    return (
        <FieldShell label={label} hint={hint} error={error} htmlFor={id}>
            <textarea {...props} id={id} className={cx(CONTROL, "min-h-20 resize-y", className)} />
        </FieldShell>
    );
}

export interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
    label?: string;
    hint?: ReactNode;
    options: { value: string; label: string }[];
}

export function Select({ label, hint, options, className, ...props }: SelectProps) {
    const generated = useId();
    const id = props.id ?? generated;

    return (
        <FieldShell label={label} hint={hint} htmlFor={id}>
            <select {...props} id={id} className={cx(CONTROL, "cursor-pointer appearance-none bg-no-repeat pr-9", className)}
                style={{
                    backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%23717680' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                    backgroundPosition: "right 0.65rem center",
                }}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </FieldShell>
    );
}
