import React from "react";
import { cn } from "@/lib/utils";

export type CardVariant = "default" | "interactive" | "subtle";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variantStyles: Record<CardVariant, string> = {
  default:
    "bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-card)]",
  interactive:
    "bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer",
  subtle:
    "bg-[var(--color-background-start)] border border-slate-200/80 shadow-none",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = "default", className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("rounded-2xl p-5 transition-all duration-200", variantStyles[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
