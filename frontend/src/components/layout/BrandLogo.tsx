"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type BrandLogoSize = "sm" | "md" | "lg";

export interface BrandLogoProps {
  size?: BrandLogoSize;
  showText?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  href?: string;
  className?: string;
  onClick?: () => void;
  logoUrl?: string;
  companyName?: string;
}

/**
 * Biểu tượng Monogram 'TD' kết hợp tia sáng bứt phá sự nghiệp (Option 1: Career Spark).
 * Vector SVG siêu nhẹ, sắc nét tuyệt đối trên màn hình Retina / 4K.
 */
export function TDSparkEmblem({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 drop-shadow-sm select-none", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="td-bg-grad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="50%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="td-spark-grad" x1="12" y1="33" x2="34" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="60%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
        <filter id="td-glow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#0F172A" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Modern Squircle Badge with subtle light-border */}
      <rect width="44" height="44" rx="12" fill="url(#td-bg-grad)" />
      <rect width="44" height="44" rx="12" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />

      {/* Monogram T & D with Career Spark */}
      <g filter="url(#td-glow)">
        {/* Letter 'T' - Top horizontal bar */}
        <path
          d="M10.5 14.5 H25"
          stroke="#FFFFFF"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        {/* Letter 'T' - Vertical stem */}
        <path
          d="M16 15 V31"
          stroke="#FFFFFF"
          strokeWidth="3.2"
          strokeLinecap="round"
        />

        {/* Letter 'D' - Sleek modern geometric curve */}
        <path
          d="M21 17.5 H25.5 C29.5 17.5 32.5 20.2 32.5 24.25 C32.5 28.3 29.5 31 25.5 31 H21 V17.5 Z"
          stroke="#FFFFFF"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dynamic Career Spark Arrow piercing diagonally */}
        <path
          d="M13 32 L31 13"
          stroke="url(#td-spark-grad)"
          strokeWidth="2.8"
          strokeLinecap="round"
        />

        {/* Career Spark Diamond Star at top right */}
        <path
          d="M32 7.5 L33.2 10.8 L36.5 12 L33.2 13.2 L32 16.5 L30.8 13.2 L27.5 12 L30.8 10.8 Z"
          fill="#38BDF8"
          stroke="#FFFFFF"
          strokeWidth="0.8"
        />
      </g>
    </svg>
  );
}

const emblemSizes: Record<BrandLogoSize, string> = {
  sm: "w-8 h-8",
  md: "w-9 h-9",
  lg: "w-11 h-11",
};

const titleSizes: Record<BrandLogoSize, string> = {
  sm: "text-[14px] font-bold tracking-tight",
  md: "text-[15px] font-bold tracking-tight",
  lg: "text-[19px] font-extrabold tracking-tight",
};

const subtitleSizes: Record<BrandLogoSize, string> = {
  sm: "text-[10px]",
  md: "text-[10.5px]",
  lg: "text-[11.5px]",
};

export function BrandLogo({
  size = "md",
  showText = true,
  showSubtitle = true,
  subtitle = "Internal Talent Network",
  href = "/",
  className,
  onClick,
  logoUrl,
  companyName,
}: BrandLogoProps) {
  const [imgError, setImgError] = React.useState(false);

  const displayTitle = companyName || "Tuyển dụng nội bộ";

  const content = (
    <div className={cn("inline-flex items-center gap-2.5 select-none group", className)}>
      {logoUrl && !imgError ? (
        <div className={cn(emblemSizes[size], "relative rounded-xl overflow-hidden bg-white/80 border border-slate-200/80 p-0.5 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform duration-200")}>
          <img
            src={logoUrl}
            alt={displayTitle}
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <TDSparkEmblem className={cn(emblemSizes[size], "group-hover:scale-105 transition-transform duration-200")} />
      )}

      {showText && (
        <div className="leading-tight text-left">
          <span className={cn("block text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1", titleSizes[size])}>
            {displayTitle}
          </span>
          {showSubtitle && (
            <span className={cn("block font-medium text-slate-400 tracking-tight", subtitleSizes[size])}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        title="Về trang chủ Tuyển dụng nội bộ"
        className="inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 rounded-xl"
      >
        {content}
      </Link>
    );
  }

  return content;
}

