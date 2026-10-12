import type { Metadata } from "next";
import { SystemSettings } from "@/features/admin/components/SystemSettings";

export const metadata: Metadata = {
  title: "Cấu hình hệ thống | Quản trị tuyển dụng nội bộ",
  description: "Thiết lập cấu hình chung, bảo mật và thông báo hệ thống",
};

export default function SettingsPage() {
  return <SystemSettings />;
}
