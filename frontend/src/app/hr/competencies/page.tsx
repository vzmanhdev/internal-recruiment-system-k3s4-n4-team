import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CompetencyManagementView } from "@/features/hr/components/CompetencyManagementView";

export const metadata: Metadata = {
  title: "Khung năng lực chức danh (Story S2-06) | HR Workspace",
  description: "Khai báo khung năng lực và tiêu chí đánh giá chuẩn hóa cho từng chức danh",
};

export default function HRCompetenciesStandalonePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8">
        <CompetencyManagementView />
      </main>
      <Footer />
    </div>
  );
}
