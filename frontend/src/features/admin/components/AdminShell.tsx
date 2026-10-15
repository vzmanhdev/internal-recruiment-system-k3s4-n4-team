"use client";

import { ShieldCheck } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { adminNavItems } from "../data/dashboard";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return <WorkspaceShell title="Quản trị hệ thống" description="Tài khoản và phân quyền" icon={ShieldCheck} items={adminNavItems} allowedRoles={["admin"]}>{children}</WorkspaceShell>;
}
