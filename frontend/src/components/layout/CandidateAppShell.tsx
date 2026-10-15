import React from "react";

/** Legacy alias kept as a pass-through; see app/candidate/layout.tsx and the unified AppShell. */
export function CandidateAppShell({ children }: { children: React.ReactNode; [prop: string]: unknown }) {
  return <>{children}</>;
}

export default CandidateAppShell;
