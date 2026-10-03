import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { CandidateDashboard } from "@/features/candidate/components/CandidateDashboard";

export default function CandidateDashboardPage() {
  return <div className="min-h-screen bg-slate-50"><Header/><main className="px-4 py-8 sm:px-6 lg:py-10"><CandidateDashboard/></main><Footer/></div>;
}
