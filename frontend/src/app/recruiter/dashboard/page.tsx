import type { Metadata } from "next";
import { RecruiterDashboard } from "@/features/recruiter/components/RecruiterDashboard";

export const metadata: Metadata = {
  title: "Tổng quan tuyển dụng | HR Recruiter Workspace",
  description: "Theo dõi chỉ số KPI tuyển dụng và phễu ứng viên",
};

export default function RecruiterDashboardPage() {
  return <RecruiterDashboard />;
}
