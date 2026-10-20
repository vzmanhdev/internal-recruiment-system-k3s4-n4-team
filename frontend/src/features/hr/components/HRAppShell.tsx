import React from "react";

/** Legacy HR shell kept as a pass-through; the unified AppShell lives in the root layout. */
export const HRAppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;
