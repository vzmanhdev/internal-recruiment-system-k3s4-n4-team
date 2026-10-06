import type { Metadata } from "next";
import { AuditLogViewer } from "@/features/admin/components/AuditLogViewer";

export const metadata: Metadata = {
  title: "Nhật ký hệ thống | Quản trị",
  description: "Theo dõi toàn bộ hoạt động quản trị và kiểm toán bảo mật",
};

export default function AuditLogsPage() {
  return <AuditLogViewer />;
}
