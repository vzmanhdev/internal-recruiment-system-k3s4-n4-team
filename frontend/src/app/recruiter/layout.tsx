import type { Metadata } from "next";
import { RecruiterShell } from "@/features/recruiter/components/RecruiterShell";

export const metadata: Metadata = {
  title: "Cổng Nhân Sự Tuyển Dụng | HR Recruiter Workspace",
  description: "Không gian làm việc dành riêng cho chuyên viên tuyển dụng và quản lý nhân sự",
};

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  return <RecruiterShell>{children}</RecruiterShell>;
}
