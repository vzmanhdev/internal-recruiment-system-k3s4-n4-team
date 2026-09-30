import type { Metadata } from "next";
import { AdminShell } from "@/features/admin/components/AdminShell";

export const metadata: Metadata = {
  title: "Quản trị hệ thống | Tuyển dụng nội bộ",
  description: "Bảng điều khiển quản trị hệ thống tuyển dụng nội bộ",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
