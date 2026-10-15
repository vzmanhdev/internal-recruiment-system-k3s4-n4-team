import React from "react";
import { cn } from "@/lib/utils";

export interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  htmlFor,
  required,
  helperText,
  error,
  className,
  children,
}: FormFieldProps) {
  const cleanLabel = label ? label.replace(/[\s*]+$/, "") : "";
  const isRequired = Boolean(required || (label && label.includes("*")));

  return (
    <div className={cn("flex flex-col gap-1.5 w-full", className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-sm font-semibold text-[var(--color-heading)] flex items-center gap-1 select-none"
        >
          <span>{cleanLabel}</span>
          {isRequired && (
            <span className="text-[#EF4444] font-bold text-sm" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {children}

      {error ? (
        <p id={htmlFor ? `${htmlFor}-error` : undefined} className="text-xs font-medium text-[var(--color-danger)]">
          {error}
        </p>
      ) : helperText ? (
        <p id={htmlFor ? `${htmlFor}-helper` : undefined} className="text-xs text-[var(--color-muted)]">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
