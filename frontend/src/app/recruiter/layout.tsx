import type { Metadata } from "next";
import { RecruiterShell } from "@/features/recruiter/components/RecruiterShell";

export const metadata: Metadata = {
  title: "Không gian làm việc Recruiter | Tuyển dụng nội bộ VinaTech",
  description: "Bàn làm việc và quản lý pipeline ứng viên cho Nhân viên tuyển dụng",
};

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  return <RecruiterShell>{children}</RecruiterShell>;
}
