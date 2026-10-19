"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/providers/auth-provider";
import { AppShell } from "@/components/layout/app-shell/AppShell";
import { isProtectedPath, policyFor } from "@/lib/auth/route-registry";

/**
 * Mounted once in the root layout, so the auth state and the shell survive navigation between
 * workspaces (no remount, no /auth/me refetch, no header/sidebar flash).
 */
function ShellGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const usesShell = isProtectedPath(pathname) && !policyFor(pathname)?.public;
  return usesShell ? <AppShell>{children}</AppShell> : <>{children}</>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ShellGate>{children}</ShellGate>
    </AuthProvider>
  );
}
