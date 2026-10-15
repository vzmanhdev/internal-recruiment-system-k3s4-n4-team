import type { Metadata } from "next";
import { RoleManagement } from "@/features/admin/components/RoleManagement";

export const metadata: Metadata = {
  title: "Vai trò & Phân quyền | Tuyển dụng nội bộ",
};

export default function RolesPage() {
  return <RoleManagement />;
}
