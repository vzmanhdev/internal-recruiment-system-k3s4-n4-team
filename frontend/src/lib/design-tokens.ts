/**
 * Corporate / CEO / Enterprise SaaS Design Tokens
 * Centralized constant definitions for TypeScript usage.
 */

export const COLORS = {
  primary: "#3B82F6",
  primaryHover: "#2563EB",
  primaryActive: "#1D4ED8",
  primaryLight: "#EFF6FF",

  success: "#22C55E",
  successLight: "#DCFCE7",
  successText: "#15803D",

  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  warningText: "#B45309",

  danger: "#EF4444",
  dangerLight: "#FEF2F2",

  backgroundStart: "#F0F6FF",
  backgroundEnd: "#F8FAFC",
  surface: "#FFFFFF",

  heading: "#0F172A",
  body: "#475569",
  muted: "#64748B",
  border: "#E2E8F0",
} as const;

export const RADII = {
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "20px",
  "2xl": "24px",
} as const;

export const SHADOWS = {
  sm: "0 1px 2px rgba(15, 23, 42, 0.04)",
  card: "0 10px 30px rgba(59, 130, 246, 0.05)",
  cardHover: "0 14px 40px rgba(59, 130, 246, 0.08)",
} as const;

export const TYPOGRAPHY = {
  display: {
    fontSize: "clamp(2.5rem, 5vw, 4rem)",
    fontWeight: 700,
    lineHeight: 1.1,
  },
  h1: {
    fontSize: "clamp(2.25rem, 4vw, 3rem)",
    fontWeight: 700,
    lineHeight: 1.15,
  },
  h2: {
    fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
    fontWeight: 700,
    lineHeight: 1.2,
  },
  h3: {
    fontSize: "1.375rem",
    fontWeight: 600,
    lineHeight: 1.3,
  },
  bodyLarge: {
    fontSize: "1.125rem",
    lineHeight: 1.5,
  },
  body: {
    fontSize: "1rem",
    lineHeight: 1.5,
  },
  small: {
    fontSize: "0.875rem",
    lineHeight: 1.4,
  },
  caption: {
    fontSize: "0.75rem",
    lineHeight: 1.4,
  },
} as const;

export type ColorToken = keyof typeof COLORS;
export type RadiusToken = keyof typeof RADII;
export type ShadowToken = keyof typeof SHADOWS;
