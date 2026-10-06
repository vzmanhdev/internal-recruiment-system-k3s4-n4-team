import type { Metadata } from "next";
import { Suspense } from "react";
import { JobManagement } from "@/features/recruiter/components/JobManagement";
import { Spinner } from "@/components/ui/Spinner";

export const metadata: Metadata = {
  title: "Vị trí tuyển dụng | HR Recruiter Workspace",
  description: "Quản lý và đăng tin tuyển dụng nội bộ",
};

export default function RecruiterJobsPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>}>
      <JobManagement />
    </Suspense>
  );
}
