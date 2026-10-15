import React from "react";
import { Info, CircleCheck, TriangleAlert, CircleX } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertVariant = "info" | "success" | "warning" | "error";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
}

const variantStyles: Record<AlertVariant, { container: string; icon: React.ComponentType<{ className?: string }> }> = {
  info: {
    container: "bg-blue-50 border-blue-200 text-blue-800",
    icon: Info,
  },
  success: {
    container: "bg-[var(--color-success-light)] border-emerald-200 text-[var(--color-success-text)]",
    icon: CircleCheck,
  },
  warning: {
    container: "bg-[var(--color-warning-light)] border-amber-200 text-[var(--color-warning-text)]",
    icon: TriangleAlert,
  },
  error: {
    container: "bg-[var(--color-danger-light)] border-red-200 text-red-800",
    icon: CircleX,
  },
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
  ...props
}: AlertProps) {
  const config = variantStyles[variant];
  const IconComponent = config.icon;

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-3 p-4 rounded-xl border text-sm transition-all duration-200",
        config.container,
        className
      )}
      {...props}
    >
      <IconComponent className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex flex-col gap-0.5">
        {title && <h4 className="font-semibold text-sm">{title}</h4>}
        <div className="text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
