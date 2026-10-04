"use client";

import { BriefcaseBusiness, KeyRound, LayoutDashboard, UserRound, UsersRound } from "lucide-react";
import { WorkspaceShell } from "./WorkspaceShell";

export function PersonalWorkspaceShell({ children, candidate = false }: { children: React.ReactNode; candidate?: boolean }) {
  const items = [
    { href: candidate ? "/candidate/dashboard" : "/employee/dashboard", label: "Tổng quan cá nhân", icon: LayoutDashboard },
    { href: "/jobs", label: "Cơ hội nghề nghiệp", icon: BriefcaseBusiness },
    ...(!candidate ? [{ href: "/referrals", label: "Giới thiệu ứng viên", icon: UsersRound }] : []),
    { href: "/profile", label: "Hồ sơ cá nhân", icon: UserRound },
    { href: "/change-password", label: "Đổi mật khẩu", icon: KeyRound },
  ];
  return <WorkspaceShell title={candidate ? "Cổng ứng viên" : "Nhân sự nội bộ"} description={candidate ? "Theo dõi hành trình ứng tuyển" : "Phát triển sự nghiệp cùng công ty"} icon={UserRound} items={items} allowedRoles={candidate ? ["candidate"] : ["employee", "manager", "hr_manager", "admin"]}>{children}</WorkspaceShell>;
}
