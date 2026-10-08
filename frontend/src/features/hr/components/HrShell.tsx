"use client";

import { BarChart3, CalendarDays, ClipboardList, FileText, FolderTree, Gift, UserRound, Users, Wallet } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";

const items = [
  { href: "/hr/configuration", label: "Thiết lập nhân sự", icon: FolderTree },
  { href: "/hr/requests", label: "Yêu cầu tuyển dụng", icon: ClipboardList },
  { href: "/hr/headcount", label: "Headcount & đăng tin", icon: Wallet },
  { href: "/hr/applications", label: "Hồ sơ ứng tuyển", icon: Users },
  { href: "/hr/interviews", label: "Lịch phỏng vấn", icon: CalendarDays },
  { href: "/hr/offers", label: "Thư mời và nhận việc", icon: Gift },
  { href: "/hr/analytics", label: "Báo cáo tuyển dụng", icon: BarChart3 },
  { href: "/hr/content", label: "Nội dung công ty", icon: FileText },
  { href: "/profile", label: "Hồ sơ cá nhân", icon: UserRound },
];

export function HrShell({ children }: { children: React.ReactNode }) {
  return <WorkspaceShell title="Trưởng phòng Nhân sự" description="Quản lý tuyển dụng nội bộ" icon={Users} items={items} allowedRoles={["hr_manager", "admin"]}>{children}</WorkspaceShell>;
}
