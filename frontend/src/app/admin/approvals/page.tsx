import type { Metadata } from "next";
import { PendingApprovals } from "@/features/admin/components/PendingApprovals";

export const metadata: Metadata = { title: "Phê duyệt tài khoản | Quản trị" };
export default function ApprovalsPage() { return <PendingApprovals />; }
