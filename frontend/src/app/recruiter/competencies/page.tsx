import type { Metadata } from "next";
import { CompetencyManagementView } from "@/features/hr/components/CompetencyManagementView";

export const metadata: Metadata = {
  title: "Khung năng lực chức danh (Story S2-06) | Tuyển dụng nhân sự",
  description: "Khai báo khung năng lực và tiêu chí đánh giá chuẩn hóa cho từng chức danh",
};

export default function RecruiterCompetenciesPage() {
  return <CompetencyManagementView />;
}
