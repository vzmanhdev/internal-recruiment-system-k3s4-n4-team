"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Icon } from "@/components/ui/Icons";
import { fetchPublicJobDetail } from "@/features/jobs/services/job-posting.service";
import { submitApplication } from "@/features/applications/services/application.service";
import type { Job } from "@/types/job";
import { useAuthSession } from "@/features/auth/lib/auth-session";
import { PublicJobContent } from "@/features/jobs/components/PublicJobContent";

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const session = useAuthSession();
  const [job, setJob] = useState<Job | null>(null);
  const [backendJobId, setBackendJobId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [benefits, setBenefits] = useState("");

  // Application Modal state
  const [showAppModal, setShowAppModal] = useState(false);
  const [appForm, setAppForm] = useState({
    full_name: session?.full_name || "",
    email: session?.email || "",
    phone: "",
    cv_url: "",
    cover_letter: "",
    current_department: "",
    referral_code: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [appError, setAppError] = useState("");
  const [appNotice, setAppNotice] = useState("");

  useEffect(() => {
    async function loadDetail() {
      setLoading(true);
      if (!isNaN(Number(id))) {
        try {
          const item = await fetchPublicJobDetail(Number(id));
          setBackendJobId(item.id);
          setBenefits(item.benefits || "");
          const mapped: Job = {
            id: String(item.id),
            title: item.title,
            department: item.department_name || "Tuyển dụng nội bộ",
            location: item.work_location || "Trụ sở chính",
            employmentType: item.employment_type === "full_time" ? "Toàn thời gian" : item.employment_type === "part_time" ? "Bán thời gian" : "Hợp đồng",
            openings: `${item.quantity} người`,
            status: "open",
            description: item.job_description || "Không có mô tả chi tiết",
            skills: item.requirements ? item.requirements.split(",").map((s) => s.trim()).filter(Boolean) : ["Toàn thời gian"],
            deadline: item.deadline ? new Date(item.deadline).toLocaleDateString("vi-VN") : "Không giới hạn",
            responsibilities: item.job_description ? item.job_description.split("\n").filter(Boolean) : [],
            requirements: item.requirements ? item.requirements.split("\n").filter(Boolean) : [],
          };
          setJob(mapped);
          setLoading(false);
          return;
        } catch (err) {
          console.error("Backend job detail fetch failed:", err);
        }
      }

      setJob(null);
      setLoading(false);
    }

    loadDetail();
  }, [id, session]);


  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppError("");
    setSubmitting(true);
    try {

      await submitApplication({
        job_id: backendJobId || 1,
        full_name: appForm.full_name,
        email: appForm.email,
        phone: appForm.phone,
        cv_url: appForm.cv_url,
        cover_letter: appForm.cover_letter,
        current_department: appForm.current_department,
        referral_code: appForm.referral_code,
      });

      setAppNotice("Chúc mừng! Hồ sơ ứng tuyển của bạn đã được gửi thành công đến Bộ phận Nhân sự.");
      setShowAppModal(false);
    } catch (err: unknown) {
      setAppError(err instanceof Error ? err.message : "Không thể nộp hồ sơ ứng tuyển.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="inner-page container py-12 text-center text-slate-500">Đang tải thông tin việc làm...</main>
      </>
    );
  }

  if (!job) {
    return (
      <>
        <Header />
        <main className="inner-page container py-12 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Không tìm thấy vị trí tuyển dụng</h1>
          <p className="mt-2 text-slate-500">Vị trí này có thể đã hết hạn hoặc không tồn tại.</p>
          <Link href="/jobs" className="mt-4 inline-block font-bold text-blue-600 hover:underline">
            ← Quay lại danh sách việc làm
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="inner-page container space-y-6">
        {appNotice && <Alert variant="success">{appNotice}</Alert>}

        <PublicJobContent job={job} benefits={benefits} action={<Button onClick={() => setShowAppModal(true)}>Ứng tuyển ngay <Icon name="arrow" /></Button>}/>

        {/* Modal Submit Application */}
        {showAppModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 overflow-y-auto">
            <Card className="w-full max-w-lg p-6 bg-white space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Nộp Hồ Sơ Ứng Tuyển</h2>
              <p className="text-xs text-slate-500">
                Vị trí: <strong className="text-slate-800">{job.title}</strong> ({job.department})
              </p>

              {appError && <Alert variant="error">{appError}</Alert>}

              <form onSubmit={handleApplySubmit} className="space-y-3 text-left">
                <Input
                  label="Họ và tên *"
                  required
                  placeholder="Nguyễn Văn A"
                  value={appForm.full_name}
                  onChange={(e) => setAppForm({ ...appForm, full_name: e.target.value })}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Email liên hệ *"
                    type="email"
                    required
                    placeholder="nguyenvana@company.com"
                    value={appForm.email}
                    onChange={(e) => setAppForm({ ...appForm, email: e.target.value })}
                  />
                  <Input
                    label="Số điện thoại *"
                    required
                    placeholder="0912345678"
                    value={appForm.phone}
                    onChange={(e) => setAppForm({ ...appForm, phone: e.target.value })}
                  />
                </div>
                <Input
                  label="Link/URL File CV đính kèm *"
                  required
                  placeholder="https://drive.google.com/my-cv.pdf"
                  value={appForm.cv_url}
                  onChange={(e) => setAppForm({ ...appForm, cv_url: e.target.value })}
                />
                <Input
                  label="Phòng ban hiện tại (Nếu là Nhân sự nội bộ)"
                  placeholder="Khối Công nghệ"
                  value={appForm.current_department}
                  onChange={(e) => setAppForm({ ...appForm, current_department: e.target.value })}
                />
                <label className="block text-xs font-semibold text-slate-700">
                  Thư giới thiệu / Động lực ứng tuyển
                  <textarea
                    rows={3}
                    placeholder="Giới thiệu bản thân và lý do ứng tuyển vị trí này..."
                    value={appForm.cover_letter}
                    onChange={(e) => setAppForm({ ...appForm, cover_letter: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </label>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <Button type="button" variant="secondary" onClick={() => setShowAppModal(false)}>
                    Hủy bỏ
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Đang gửi..." : "Gửi hồ sơ ứng tuyển"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </main>
    </>
  );
}
