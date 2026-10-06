import type { Metadata } from "next";
import { SystemSettings } from "@/features/admin/components/SystemSettings";

export const metadata: Metadata = {
  title: "Cấu hình hệ thống | Quản trị",
  description: "Thiết lập cấu hình chung, bảo mật và quy trình phê duyệt",
};

export default function SettingsPage() {
  return <SystemSettings />;
}
