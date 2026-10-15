import React from "react";
import Link from "next/link";
import { UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";

export type BrandLogoSize = "sm" | "md" | "lg";

export interface BrandLogoProps {
  size?: BrandLogoSize;
  showText?: boolean;
  href?: string;
  className?: string;
}

const iconSizes: Record<BrandLogoSize, string> = {
  sm: "w-5 h-5",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

const containerSizes: Record<BrandLogoSize, string> = {
  sm: "w-8 h-8 rounded-lg",
  md: "w-10 h-10 rounded-xl",
  lg: "w-12 h-12 rounded-2xl",
};

const textSizes: Record<BrandLogoSize, string> = {
  sm: "text-sm font-bold tracking-tight",
  md: "text-base font-bold tracking-tight",
  lg: "text-xl font-extrabold tracking-tight",
};

export function BrandLogo({
  size = "md",
  showText = true,
  href = "/",
  className,
}: BrandLogoProps) {
  const content = (
    <div className={cn("inline-flex items-center gap-3 select-none", className)}>
      <div
        className={cn(
          "bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center shrink-0 border border-blue-100",
          containerSizes[size]
        )}
      >
        <UsersRound className={iconSizes[size]} />
      </div>

      {showText && (
        <span className={cn("text-[var(--color-heading)]", textSizes[size])}>
          TUYỂN DỤNG NỘI BỘ
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex focus-visible:outline-none rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}
