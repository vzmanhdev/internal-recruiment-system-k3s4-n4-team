import React, { useId } from "react";
import { cn } from "@/lib/utils";
import { FormField } from "./FormField";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      id: customId,
      label,
      error,
      helperText,
      options = [],
      required,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = customId || generatedId;

    const describedBy = error
      ? `${selectId}-error`
      : helperText
      ? `${selectId}-helper`
      : undefined;

    const selectControl = (
      <select
        ref={ref}
        id={selectId}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={cn(
          "w-full h-12 bg-white border border-[var(--color-border)] rounded-xl px-4 text-sm text-[var(--color-heading)]",
          "transition-all duration-200 cursor-pointer",
          "focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100",
          "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed",
          error && "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-red-100",
          className
        )}
        {...props}
      >
        {children
          ? children
          : options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
      </select>
    );

    if (label || error || helperText) {
      return (
        <FormField
          label={label}
          htmlFor={selectId}
          required={required}
          error={error}
          helperText={helperText}
        >
          {selectControl}
        </FormField>
      );
    }

    return selectControl;
  }
);

Select.displayName = "Select";
