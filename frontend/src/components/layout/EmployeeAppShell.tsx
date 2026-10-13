import React from "react";

/**
 * Legacy per-role shell, kept as a pass-through so existing pages keep compiling.
 * The single permission-driven AppShell (components/layout/app-shell/AppShell.tsx) is mounted once in
 * the root layout; nesting a second header/sidebar here would duplicate the shell.
 */
export function EmployeeAppShell({ children }: { children: React.ReactNode; activeTab?: string; [prop: string]: unknown }) {
  return <>{children}</>;
}

export default EmployeeAppShell;
