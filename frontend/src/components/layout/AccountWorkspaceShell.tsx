"use client";

import { getSessionRoles, useAuthSession } from "@/features/auth/lib/auth-session";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { HrShell } from "@/features/hr/components/HrShell";
import { ManagerShell } from "@/features/manager/components/ManagerShell";
import { PersonalWorkspaceShell } from "./PersonalWorkspaceShell";

export function AccountWorkspaceShell({ children }: { children: React.ReactNode }) {
  const session = useAuthSession();
  const roles = getSessionRoles(session);
  if (roles.includes("admin")) return <AdminShell>{children}</AdminShell>;
  if (roles.includes("hr_manager")) return <HrShell>{children}</HrShell>;
  if (roles.includes("manager")) return <ManagerShell>{children}</ManagerShell>;
  return <PersonalWorkspaceShell candidate={roles.includes("candidate")}>{children}</PersonalWorkspaceShell>;
}
