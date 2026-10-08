"use client";

import { BriefcaseBusiness, ClipboardCheck, LayoutDashboard, UserRound, UsersRound } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";

const items = [
  { label: "Tổng quan bộ phận", href: "/manager/dashboard", icon: LayoutDashboard },
  { label: "Duyệt yêu cầu tuyển dụng", href: "/manager/requisitions", icon: ClipboardCheck },
  { label: "Vị trí đang tuyển", href: "/jobs", icon: BriefcaseBusiness },
  { label: "Hồ sơ cá nhân", href: "/profile", icon: UserRound },
];

export function ManagerShell({ children }: { children: React.ReactNode }) {
  return <WorkspaceShell title="Trưởng bộ phận" description="Điều phối nhu cầu nhân sự" icon={UsersRound} items={items} allowedRoles={["manager", "admin"]}>{children}</WorkspaceShell>;
}
