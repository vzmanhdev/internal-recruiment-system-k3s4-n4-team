import React from "react";
import { cn } from "@/lib/utils";

export type CardVariant = "default" | "interactive" | "subtle";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variantStyles: Record<CardVariant, string> = {
  default:
    "bg-gradient-to-br from-white via-white to-blue-50/35 border border-white/90 ring-1 ring-[var(--color-border)]/80 shadow-[var(--shadow-card)]",
  interactive:
    "bg-gradient-to-br from-white via-white to-blue-50/45 border border-white/90 ring-1 ring-[var(--color-border)]/80 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-1 hover:ring-blue-300/80 transition-all duration-200 cursor-pointer",
  subtle:
    "bg-gradient-to-br from-blue-50/90 to-slate-50 border border-blue-100/80 shadow-sm",
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
