import React, { useId } from "react";
import { cn } from "@/lib/utils";
import { FormField } from "./FormField";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id: customId,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      required,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = customId || generatedId;

    const describedBy = error
      ? `${inputId}-error`
      : helperText
      ? `${inputId}-helper`
      : undefined;

    const inputControl = (
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-[14px] text-slate-400 pointer-events-none flex items-center justify-center w-[18px] h-[18px]">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          style={{
            paddingLeft: leftIcon ? "44px" : "16px",
            paddingRight: rightIcon ? "44px" : "16px",
            ...props.style,
          }}
          className={cn(
            "w-full h-12 bg-white border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-heading)]",
            "placeholder:text-slate-400 transition-all duration-200",
            "focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-blue-500/12",
            "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed",
            error && "border-[#EF4444] focus:border-[#EF4444] focus:ring-red-100",
            leftIcon && "!pl-[44px]",
            rightIcon && "!pr-[44px]",
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-[14px] text-slate-400 flex items-center justify-center">
            {rightIcon}
          </div>
        )}
      </div>
    );

    if (label || error || helperText) {
      return (
        <FormField
          label={label}
          htmlFor={inputId}
          required={required}
          error={error}
          helperText={helperText}
        >
          {inputControl}
        </FormField>
      );
    }

    return inputControl;
  }
);

Input.displayName = "Input";
