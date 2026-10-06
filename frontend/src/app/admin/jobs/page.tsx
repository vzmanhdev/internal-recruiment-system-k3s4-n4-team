import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { JobManagement } from "@/features/recruiter/components/JobManagement";
import { Spinner } from "@/components/ui/Spinner";

export const metadata: Metadata = {
  title: "Quản lý vị trí tuyển dụng | Quản trị hệ thống",
  description: "Quản trị danh sách tin tuyển dụng nội bộ toàn công ty",
};

export default function AdminJobsPage() {
  return (
    <AdminShell>
      <Suspense fallback={<div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>}>
        <JobManagement />
      </Suspense>
    </AdminShell>
  );
}
