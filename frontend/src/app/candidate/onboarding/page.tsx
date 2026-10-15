"use client";
import { ClipboardCheck, Gift } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { CandidateOnboarding } from "@/features/offers/components/CandidateOnboarding";
export default function CandidateOnboardingPage() {
  return (
    <WorkspaceShell
      title="Cổng ứng viên"
      description="Cùng chuẩn bị cho ngày làm việc đầu tiên"
      icon={ClipboardCheck}
      items={[
        { href: "/candidate/dashboard", label: "Hồ sơ & thư mời", icon: Gift },
        {
          href: "/candidate/onboarding",
          label: "Checklist nhận việc",
          icon: ClipboardCheck,
        },
      ]}
      allowedRoles={[
        "candidate",
        "employee",
        "admin",
        "hr_manager",
        "recruiter",
        "manager",
        "interviewer",
      ]}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="workspace-hero">
          <p className="text-sm font-bold text-blue-600">
            Onboarding · Sprint 7
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            Sẵn sàng cho hành trình mới
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Theo dõi tiến độ chuẩn bị nhận việc và xác nhận hồ sơ cá nhân.
          </p>
        </section>
        <CandidateOnboarding />
      </div>
    </WorkspaceShell>
  );
}
