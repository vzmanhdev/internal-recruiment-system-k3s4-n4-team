import type { Metadata } from "next";
import { UserManagement } from "@/features/admin/components/UserManagement";

export const metadata: Metadata = { title: "Quản lý tài khoản | Tuyển dụng nội bộ" };
export default function UsersPage() { return <UserManagement />; }
