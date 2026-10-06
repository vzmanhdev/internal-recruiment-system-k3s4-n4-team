import type { Metadata } from "next";
import { Suspense } from "react";
import { CandidateManagement } from "@/features/recruiter/components/CandidateManagement";
import { Spinner } from "@/components/ui/Spinner";

export const metadata: Metadata = {
  title: "Hồ sơ ứng viên (ATS) | HR Recruiter Workspace",
  description: "Bảng Kanban theo dõi và đánh giá ứng viên các vòng",
};

export default function RecruiterCandidatesPage() {
  return (
    <Suspense fallback={<div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>}>
      <CandidateManagement />
    </Suspense>
  );
}
