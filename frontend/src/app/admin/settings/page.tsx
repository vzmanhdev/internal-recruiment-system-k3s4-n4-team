import type { Metadata } from "next";
import { SystemSettings } from "@/features/admin/components/SystemSettings";

export const metadata: Metadata = {
  title: "Cấu hình hệ thống | Tuyển dụng nội bộ",
};

export default function SettingsPage() {
  return <SystemSettings />;
}
