import React from "react";

/** Legacy alias kept as a pass-through; the unified AppShell lives in the root layout. */
export function InterviewerAppShell({ children }: { children: React.ReactNode; [prop: string]: unknown }) {
  return <>{children}</>;
}

export default InterviewerAppShell;
