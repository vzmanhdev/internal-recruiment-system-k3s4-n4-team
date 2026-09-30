import {
  BriefcaseBusiness,
  FileText,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";
import type {
  AdminActivity,
  AdminNavItem,
  DashboardMetric,
  RecentAccount,
} from "../types/dashboard.types";

export const adminNavItems: AdminNavItem[] = [
  { label: "Tổng quan", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Quản lý tài khoản", href: "/admin/users", icon: Users },
  { label: "Vai trò và phân quyền", href: "/admin/roles", icon: ShieldCheck },
  { label: "Vị trí tuyển dụng", href: "/admin/jobs", icon: BriefcaseBusiness },
  { label: "Nhật ký hệ thống", href: "/admin/audit-logs", icon: FileText },
  { label: "Cấu hình", href: "/admin/settings", icon: Settings },
];

export const dashboardMetrics: DashboardMetric[] = [
  {
    label: "Tổng tài khoản",
    value: "1.248",
    change: "+8,2%",
    changeLabel: "so với tháng trước",
    tone: "blue",
    icon: Users,
  },
  {
    label: "Đang hoạt động",
    value: "1.186",
    change: "95,0%",
    changeLabel: "trên tổng tài khoản",
    tone: "green",
    icon: UserCheck,
  },
  {
    label: "Chờ kích hoạt",
    value: "24",
    change: "+5",
    changeLabel: "trong 7 ngày qua",
    tone: "amber",
    icon: UserPlus,
  },
  {
    label: "Tài khoản bị khóa",
    value: "38",
    change: "3,0%",
    changeLabel: "trên tổng tài khoản",
    tone: "red",
    icon: UserX,
  },
];

export const recentAccounts: RecentAccount[] = [
  {
    id: "EMP-1028",
    name: "Nguyễn Minh Anh",
    email: "minhanh.nguyen@company.com",
    department: "Công nghệ",
    roles: ["Nhân viên"],
    status: "active",
    createdAt: "30/09/2026",
  },
  {
    id: "EMP-1027",
    name: "Trần Hoàng Nam",
    email: "hoangnam.tran@company.com",
    department: "Nhân sự",
    roles: ["HR", "Quản lý"],
    status: "active",
    createdAt: "29/09/2026",
  },
  {
    id: "EMP-1026",
    name: "Lê Thu Hà",
    email: "thuha.le@company.com",
    department: "Kinh doanh",
    roles: ["Nhân viên"],
    status: "pending",
    createdAt: "29/09/2026",
  },
  {
    id: "EMP-1025",
    name: "Phạm Quốc Bảo",
    email: "quocbao.pham@company.com",
    department: "Sản phẩm",
    roles: ["Quản lý"],
    status: "active",
    createdAt: "28/09/2026",
  },
  {
    id: "EMP-1024",
    name: "Vũ Ngọc Linh",
    email: "ngoclinh.vu@company.com",
    department: "Tài chính",
    roles: ["Nhân viên"],
    status: "locked",
    createdAt: "27/09/2026",
  },
];

export const roleDistribution = [
  { label: "Nhân viên", value: 842, percentage: 67, color: "bg-blue-500" },
  { label: "Quản lý", value: 246, percentage: 20, color: "bg-indigo-500" },
  { label: "Nhân sự", value: 128, percentage: 10, color: "bg-violet-500" },
  { label: "Quản trị viên", value: 32, percentage: 3, color: "bg-slate-700" },
];

export const recentActivities: AdminActivity[] = [
  {
    id: "activity-1",
    actor: "Admin Nguyễn Văn A",
    action: "đã tạo tài khoản",
    subject: "Nguyễn Minh Anh",
    time: "10 phút trước",
    tone: "green",
  },
  {
    id: "activity-2",
    actor: "HR Trần Hoàng Nam",
    action: "đã gán vai trò Quản lý cho",
    subject: "Phạm Quốc Bảo",
    time: "45 phút trước",
    tone: "blue",
  },
  {
    id: "activity-3",
    actor: "Admin Nguyễn Văn A",
    action: "đã khóa tài khoản",
    subject: "Vũ Ngọc Linh",
    time: "2 giờ trước",
    tone: "red",
  },
  {
    id: "activity-4",
    actor: "Hệ thống",
    action: "đã gửi email kích hoạt tới",
    subject: "Lê Thu Hà",
    time: "3 giờ trước",
    tone: "amber",
  },
];
