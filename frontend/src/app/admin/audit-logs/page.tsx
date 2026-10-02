import type { Metadata } from "next";
import { AuditLogsManagement } from "@/features/admin/components/AuditLogsManagement";

export const metadata: Metadata = {
  title: "Nhật ký hệ thống | Tuyển dụng nội bộ",
};

export default function AuditLogsPage() {
  return <AuditLogsManagement />;
}
