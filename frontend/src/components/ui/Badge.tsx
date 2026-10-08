import React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700 border border-slate-200",
  primary: "bg-[var(--color-primary-light)] text-[var(--color-primary)] font-semibold border border-blue-200",
  success: "bg-[var(--color-success-light)] text-[var(--color-success-text)] font-semibold border border-emerald-200",
  warning: "bg-[var(--color-warning-light)] text-[var(--color-warning-text)] font-semibold border border-amber-200",
  danger: "bg-[var(--color-danger-light)] text-red-700 font-semibold border border-red-200",
};

export function Badge({ children, variant = "default", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide uppercase",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
