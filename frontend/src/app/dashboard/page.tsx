import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { DashboardOverview } from "@/features/admin/components/DashboardOverview";

export const metadata: Metadata = {
  title: "Dashboard | Tuyển dụng nội bộ",
  description: "Tổng quan hoạt động của hệ thống tuyển dụng nội bộ",
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <DashboardOverview />
      </main>
      <Footer />
    </div>
  );
}
