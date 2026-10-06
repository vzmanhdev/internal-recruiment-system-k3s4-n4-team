import type { Metadata } from "next";
import { RolePermissionManagement } from "@/features/admin/components/RolePermissionManagement";

export const metadata: Metadata = {
  title: "Vai trò và phân quyền | Quản trị",
  description: "Quản lý vai trò và ma trận phân quyền hệ thống",
};

export default function RolesPage() {
  return <RolePermissionManagement />;
}
