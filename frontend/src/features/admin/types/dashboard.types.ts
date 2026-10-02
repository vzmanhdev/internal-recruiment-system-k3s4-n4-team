import type { LucideIcon } from "lucide-react";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface DashboardMetric {
  label: string;
  value: string;
  change: string;
  changeLabel: string;
  tone: "blue" | "green" | "amber" | "red";
  icon: LucideIcon;
}

export interface RecentAccount {
  id: string;
  name: string;
  email: string;
  department: string;
  roles: string[];
  status: "active" | "pending" | "locked";
  createdAt: string;
}

export interface AdminActivity {
  id: string;
  actor: string;
  action: string;
  subject: string;
  time: string;
  tone: "blue" | "green" | "amber" | "red";
}
