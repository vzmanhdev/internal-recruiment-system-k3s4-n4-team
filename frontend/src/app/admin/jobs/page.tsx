import type { Metadata } from "next";
import { AdminJobsManagement } from "@/features/admin/components/AdminJobsManagement";

export const metadata: Metadata = {
  title: "Quản lý vị trí tuyển dụng | Tuyển dụng nội bộ",
};

export default function AdminJobsPage() {
  return <AdminJobsManagement />;
}
