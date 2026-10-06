import type { Metadata } from "next";
import { Suspense } from "react";
import { InterviewManagement } from "@/features/recruiter/components/InterviewManagement";
import { Spinner } from "@/components/ui/Spinner";

export const metadata: Metadata = {
  title: "Lịch phỏng vấn | HR Recruiter Workspace",
  description: "Quản lý và điều phối các ca phỏng vấn chuyên môn",
};

export default function RecruiterInterviewsPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>}>
      <InterviewManagement />
    </Suspense>
  );
}
