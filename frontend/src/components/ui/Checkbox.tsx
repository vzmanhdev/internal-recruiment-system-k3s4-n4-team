import React, { useId } from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  description?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      id: customId,
      label,
      description,
      error,
      className,
      disabled,
      checked,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const checkboxId = customId || generatedId;

    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={checkboxId}
          className={cn(
            "inline-flex items-start gap-2.5 cursor-pointer select-none text-sm text-[var(--color-heading)]",
            disabled && "cursor-not-allowed opacity-60",
            className
          )}
        >
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            disabled={disabled}
            checked={checked}
            className={cn(
              "w-4 h-4 mt-0.5 rounded border border-[var(--color-border)] accent-[var(--color-primary)]",
              "focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors shrink-0 cursor-pointer",
              disabled && "cursor-not-allowed"
            )}
            {...props}
          />
          {(label || description) && (
            <div className="flex flex-col">
              {label && <span className="font-medium text-[var(--color-heading)]">{label}</span>}
              {description && (
                <span className="text-xs text-[var(--color-muted)]">{description}</span>
              )}
            </div>
          )}
        </label>
        {error && (
          <p className="text-xs font-medium text-[var(--color-danger)] ml-6">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
