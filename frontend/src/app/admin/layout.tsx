import React from "react";
import { AuthProvider } from "@/providers/auth-provider";
import { AdminAppShell } from "@/components/layout/AdminAppShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminAppShell>
        {children}
      </AdminAppShell>
    </AuthProvider>
  );
}
