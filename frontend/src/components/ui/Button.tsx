import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  href?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] shadow-sm",
  secondary:
    "bg-[var(--color-primary-light)] text-[var(--color-primary)] hover:bg-blue-100 active:bg-blue-200",
  outline:
    "bg-white border border-[var(--color-border)] text-[var(--color-heading)] hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100",
  ghost:
    "bg-transparent text-[var(--color-body)] hover:bg-slate-100 hover:text-[var(--color-heading)] active:bg-slate-200",
  danger:
    "bg-[var(--color-danger)] text-white hover:bg-red-600 active:bg-red-700 shadow-sm",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-xs font-medium rounded-lg gap-1.5",
  md: "h-11 px-5 text-sm font-semibold rounded-xl gap-2",
  lg: "h-12 px-6 text-base font-semibold rounded-xl gap-2.5",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      href,
      disabled,
      className,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;
    const combinedClassName = cn(
      "inline-flex flex-row items-center justify-center whitespace-nowrap transition-all duration-200 focus-visible:outline-none cursor-pointer select-none",
      "disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none",
      variantStyles[variant],
      sizeStyles[size],
      className
    );

    const innerContent = (
      <>
        {isLoading ? (
          <Spinner size={size === "sm" ? "sm" : "md"} />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </>
    );

    if (href && !isDisabled) {
      return (
        <Link href={href} className={combinedClassName}>
          {innerContent}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading}
        className={combinedClassName}
        {...props}
      >
        {innerContent}
      </button>
    );
  }
);

Button.displayName = "Button";
