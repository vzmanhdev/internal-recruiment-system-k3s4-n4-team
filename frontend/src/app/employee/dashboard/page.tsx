import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { EmployeeDashboard } from "@/features/employee/components/EmployeeDashboard";

export default function EmployeeDashboardPage() {
  return <div className="min-h-screen bg-slate-50"><Header/><main className="px-4 py-8 sm:px-6 lg:py-10"><EmployeeDashboard/></main><Footer/></div>;
}
