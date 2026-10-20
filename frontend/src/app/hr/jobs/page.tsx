"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { jobService, type JobPostingItem } from "@/services/job.service";
import { requisitionService } from "@/services/requisition.service";
import { useApiData } from "@/hooks/useApiData";
import { ErrorState, LoadingState } from "@/components/ui/DataStates";
import { ApiError } from "@/lib/api-client";
import {
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Eye,
  Check,
  RotateCcw,
  Building2,
  Calendar,
  Clock,
  Sparkles,
  Search,
  Filter,
  DollarSign,
  MapPin,
  X,
  ExternalLink,
  ShieldCheck,
  Layers,
  Smartphone,
  Monitor,
  AlertTriangle,
  User,
  Share2,
  Send,
  Award,
  ArrowRight,
  Archive,
  RefreshCw,
} from "lucide-react";

const lines = (text?: string | null): string[] =>
  (text || "")
    .replace(/<\/(p|li|div)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean);

const formatVNDate = (iso?: string | null): string => {
  if (!iso) return "—";
  try {
    const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

const formatVNDateTime = (iso?: string | null): string => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return `${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ${d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })}`;
  } catch {
    return iso;
  }
};

export interface JobPostingReview {
  id: string;
  slug: string;
  title: string;
  department: string;
  code: string;
  location: string;
  salaryDisplay: string;
  employmentType: string;
  experienceLevel: string;
  level: string;
  hiringManager: string;
  creatorName: string;
  creatorEmail: string;
  submittedAt: string;
  publishedBy?: string;
  publishedByEmail?: string;
  publishedAt?: string;
  deadline?: string;
  isExpired: boolean;
  status: "pending_review" | "published" | "needs_revision" | "draft" | "closed";
  revisionReason?: string;
  description: string;
  requirements: string[];
  benefits: string[];
  skills: string[];
  raw: JobPostingItem;
}

async function loadJobsList(): Promise<JobPostingReview[]> {
  const [jobs, reqs] = await Promise.all([
    jobService.getAdminJobs(),
    requisitionService.getRequisitions().catch(() => []),
  ]);

  return jobs.map((j) => {
    let uiStatus: JobPostingReview["status"] = "draft";
    if (j.status === "pending_review") uiStatus = "pending_review";
    else if (j.status === "published") uiStatus = "published";
    else if (j.status === "closed") uiStatus = "closed";
    else if (j.status === "draft" && j.review_note) uiStatus = "needs_revision";
    else uiStatus = "draft";

    const isExpired = Boolean(j.is_expired || (j.deadline && new Date(`${j.deadline.slice(0, 10)}T23:59:59`) < new Date()));
    const req = reqs.find((r) => r.id === j.requisition_id);

    return {
      id: String(j.id),
      slug: j.slug || `job-${j.id}`,
      title: j.title,
      department: j.department_name || j.department || "Khối Công Nghệ Thông Tin",
      code: `JOB-${j.id}`,
      location: j.location || "Hà Nội",
      salaryDisplay: j.salary_range || "Thỏa thuận",
      employmentType: j.type || "Toàn thời gian",
      experienceLevel: j.experience_level || j.level || "Mid-Level",
      level: j.level || "Mid-Level",
      hiringManager: req?.creator_name || j.creator_name || "Phòng Tuyển dụng",
      creatorName: j.creator_name || "Nhân viên tuyển dụng",
      creatorEmail: j.creator_email || "recruiter@company.com",
      submittedAt: formatVNDate(j.created_at),
      publishedBy: j.published_by_name || undefined,
      publishedByEmail: j.published_by_email || undefined,
      publishedAt: j.published_at ? formatVNDateTime(j.published_at) : undefined,
      deadline: j.deadline ? formatVNDate(j.deadline) : undefined,
      isExpired,
      status: uiStatus,
      revisionReason: j.review_note || undefined,
      description: lines(j.description).join("\n\n") || j.description,
      requirements: lines(j.requirements),
      benefits: lines(j.benefits),
      skills: (j as any).required_skills || ["Python", "FastAPI", "PostgreSQL"],
      raw: j,
    };
  });
}

export default function HRJobsPage() {
  const { data, error, loading, reload } = useApiData(loadJobsList, []);
  const jobs = useMemo(() => data || [], [data]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pending_review" | "published" | "needs_revision" | "closed">("all");

  // Modal: Xem trước giao diện tin đăng (Live Portal Preview - S3-10 AC2)
  const [previewJob, setPreviewJob] = useState<JobPostingReview | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  // Modal: Yêu cầu sửa lại (Bắt buộc nhập lý do)
  const [revisionJob, setRevisionJob] = useState<JobPostingReview | null>(null);
  const [revisionReason, setRevisionReason] = useState("");
  const [revisionError, setRevisionError] = useState("");

  // Modal: Xác nhận gỡ tin / đóng tin
  const [closingJob, setClosingJob] = useState<JobPostingReview | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Duyệt và Xuất bản tin (S3-10 AC1 & AC3)
  const handlePublishJob = async (job: JobPostingReview) => {
    if (job.isExpired) {
      showToast("Không thể xuất bản tin tuyển dụng đã quá hạn nộp hồ sơ. Vui lòng gia hạn trước.", "error");
      return;
    }
    setActionLoading(true);
    try {
      await jobService.publishJob(Number(job.id));
      showToast(`Đã duyệt & xuất bản tin "${job.title}" lên Career Portal thành công (AC3)!`, "success");
      if (previewJob?.id === job.id) setPreviewJob(null);
      await reload();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Không xuất bản được tin.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Gửi yêu cầu sửa lại (S3-10 Rule & Edge Case)
  const handleSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionJob || revisionReason.trim().length < 3) {
      setRevisionError("Vui lòng nhập lý do chi tiết tối thiểu 3 ký tự!");
      return;
    }

    setActionLoading(true);
    try {
      await jobService.requestChanges(Number(revisionJob.id), revisionReason.trim());
      showToast(`Đã trả lại tin "${revisionJob.title}" kèm yêu cầu chỉnh sửa cho Recruiter!`, "success");
      setRevisionJob(null);
      setRevisionReason("");
      setRevisionError("");
      if (previewJob?.id === revisionJob.id) setPreviewJob(null);
      await reload();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Không thể trả lại tin.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Gỡ tin / Đóng tin
  const handleCloseJob = async () => {
    if (!closingJob) return;
    setActionLoading(true);
    try {
      await jobService.closeJob(Number(closingJob.id));
      showToast(`Đã gỡ tin "${closingJob.title}" khỏi Career Portal.`, "success");
      setClosingJob(null);
      if (previewJob?.id === closingJob.id) setPreviewJob(null);
      await reload();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Không thể đóng tin tuyển dụng.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter counts
  const counts = useMemo(() => {
    return {
      all: jobs.length,
      pending_review: jobs.filter((j) => j.status === "pending_review").length,
      published: jobs.filter((j) => j.status === "published").length,
      needs_revision: jobs.filter((j) => j.status === "needs_revision").length,
      closed: jobs.filter((j) => j.status === "closed" || j.isExpired).length,
    };
  }, [jobs]);

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return jobs.filter((j) => {
      const matchSearch =
        !q ||
        j.title.toLowerCase().includes(q) ||
        j.code.toLowerCase().includes(q) ||
        j.department.toLowerCase().includes(q) ||
        (j.publishedBy && j.publishedBy.toLowerCase().includes(q)) ||
        (j.creatorName && j.creatorName.toLowerCase().includes(q));

      let matchTab = true;
      if (activeTab === "pending_review") matchTab = j.status === "pending_review";
      else if (activeTab === "published") matchTab = j.status === "published";
      else if (activeTab === "needs_revision") matchTab = j.status === "needs_revision";
      else if (activeTab === "closed") matchTab = j.status === "closed" || j.isExpired;

      return matchSearch && matchTab;
    });
  }, [jobs, searchQuery, activeTab]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="w-full space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-300"
              : "bg-rose-50 text-rose-900 border-rose-300"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-black text-[11px] tracking-wider uppercase border border-blue-200">
                [S3-10] Portal Publishing Hub
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Chuẩn hóa thương hiệu & Duyệt xuất bản tin tuyển dụng
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-2 tracking-tight">
              Duyệt & Xuất Bản Tin Tuyển Dụng
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Kiểm tra kỹ lưỡng mô tả công việc (JD), mức lương phê duyệt và xem trước (Preview) chính xác như ứng viên nhìn thấy trước khi duyệt xuất bản ra ngoài Cổng tuyển dụng công khai.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => reload()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Đồng bộ dữ liệu</span>
            </button>
            <Link
              href="/candidate/jobs"
              target="_blank"
              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Mở Career Portal</span>
            </Link>
          </div>
        </div>

        {/* Metric KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div
            onClick={() => setActiveTab("all")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === "all" ? "bg-blue-50/60 border-blue-300 shadow-sm" : "bg-slate-50 border-slate-200/80 hover:bg-slate-100/60"
            }`}
          >
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Tổng số tin đăng</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{counts.all}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Toàn bộ hồ sơ tin</span>
          </div>

          <div
            onClick={() => setActiveTab("pending_review")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === "pending_review" ? "bg-amber-50 border-amber-300 shadow-sm" : "bg-slate-50 border-slate-200/80 hover:bg-slate-100/60"
            }`}
          >
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Chờ duyệt xuất bản</span>
            <div className="text-2xl font-black text-amber-900 mt-1">{counts.pending_review}</div>
            <span className="text-[11px] text-amber-600/80 mt-0.5 block">Cần Trưởng phòng duyệt</span>
          </div>

          <div
            onClick={() => setActiveTab("published")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === "published" ? "bg-emerald-50 border-emerald-300 shadow-sm" : "bg-slate-50 border-slate-200/80 hover:bg-slate-100/60"
            }`}
          >
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Đang hiển thị ngoài Portal</span>
            <div className="text-2xl font-black text-emerald-900 mt-1">{counts.published}</div>
            <span className="text-[11px] text-emerald-600/80 mt-0.5 block">Đã qua duyệt (AC1)</span>
          </div>

          <div
            onClick={() => setActiveTab("needs_revision")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === "needs_revision" ? "bg-orange-50 border-orange-300 shadow-sm" : "bg-slate-50 border-slate-200/80 hover:bg-slate-100/60"
            }`}
          >
            <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wider block">Yêu cầu sửa lại</span>
            <div className="text-2xl font-black text-orange-900 mt-1">{counts.needs_revision}</div>
            <span className="text-[11px] text-orange-600/80 mt-0.5 block">Đã gửi phản hồi</span>
          </div>
        </div>

        {/* Filter Navigation Tabs + Search Bar */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Tất cả ({counts.all})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("pending_review")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "pending_review" ? "bg-white text-amber-800 shadow-xs" : "text-slate-600 hover:text-amber-800"
                }`}
              >
                <span>🟡 Chờ kiểm duyệt</span>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {counts.pending_review}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("published")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "published" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600 hover:text-emerald-800"
                }`}
              >
                <span>🟢 Đã lên Portal</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {counts.published}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("needs_revision")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "needs_revision" ? "bg-white text-orange-800 shadow-xs" : "text-slate-600 hover:text-orange-800"
                }`}
              >
                <span>🟠 Cần sửa lại</span>
                <span className="bg-orange-100 text-orange-800 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {counts.needs_revision}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("closed")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "closed" ? "bg-white text-slate-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>⚪ Đã đóng / Hết hạn</span>
                <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {counts.closed}
                </span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tiêu đề, mã tin, phòng ban, người tạo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden font-medium transition-all"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-3/12">Chức danh & Mã tin</th>
                  <th className="py-3.5 px-3">Phòng ban & Địa điểm</th>
                  <th className="py-3.5 px-3">Mức lương</th>
                  <th className="py-3.5 px-3">Người đề xuất</th>
                  <th className="py-3.5 px-3">Người xuất bản (AC3)</th>
                  <th className="py-3.5 px-3 text-center">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-medium">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-semibold">Không tìm thấy tin tuyển dụng nào phù hợp</p>
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-blue-50/20 transition-colors">
                      {/* Cột 1: Chức danh & Mã tin */}
                      <td className="py-3.5 px-4">
                        <div
                          onClick={() => setPreviewJob(job)}
                          className="font-extrabold text-slate-900 text-xs hover:text-blue-600 cursor-pointer transition-colors"
                        >
                          {job.title}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                          <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-bold text-[10px]">
                            {job.code}
                          </span>
                          <span>• {job.employmentType}</span>
                          <span>• {job.level}</span>
                        </div>
                      </td>

                      {/* Cột 2: Phòng ban & Địa điểm */}
                      <td className="py-3.5 px-3 text-slate-700">
                        <div className="font-semibold text-slate-800">{job.department}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{job.location}</span>
                        </div>
                      </td>

                      {/* Cột 3: Mức lương */}
                      <td className="py-3.5 px-3">
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                          {job.salaryDisplay}
                        </span>
                      </td>

                      {/* Cột 4: Người đề xuất & Ngày tạo */}
                      <td className="py-3.5 px-3 text-slate-600">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{job.creatorName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Gửi ngày: {job.submittedAt}</div>
                      </td>

                      {/* Cột 5: Người xuất bản & Thời điểm (S3-10 AC3) */}
                      <td className="py-3.5 px-3">
                        {job.status === "published" && job.publishedBy ? (
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>{job.publishedBy}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{job.publishedAt || "Đã xuất bản"}</span>
                            </div>
                          </div>
                        ) : job.status === "published" ? (
                          <div>
                            <span className="font-bold text-slate-800">Trưởng phòng HR</span>
                            <div className="text-[10px] text-slate-400 mt-0.5">{job.publishedAt || "Đã xuất bản"}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">— Chưa xuất bản —</span>
                        )}
                      </td>

                      {/* Cột 6: Trạng thái */}
                      <td className="py-3.5 px-3 text-center">
                        {job.status === "pending_review" && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                            🟡 Chờ duyệt
                          </span>
                        )}
                        {job.status === "published" && !job.isExpired && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            🟢 Đã lên Portal
                          </span>
                        )}
                        {job.status === "published" && job.isExpired && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                            🔴 Hết hạn nhận hồ sơ
                          </span>
                        )}
                        {job.status === "needs_revision" && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-orange-50 text-orange-700 border border-orange-200">
                            🟠 Cần sửa lại
                          </span>
                        )}
                        {job.status === "draft" && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
                            ⚪ Bản nháp
                          </span>
                        )}
                        {job.status === "closed" && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
                            Đã đóng
                          </span>
                        )}
                        {job.deadline && (
                          <div className="text-[10px] text-slate-400 mt-1">Hạn: {job.deadline}</div>
                        )}
                      </td>

                      {/* Cột 7: Thao tác duyệt */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Nút Xem trước */}
                          <button
                            type="button"
                            onClick={() => setPreviewJob(job)}
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            title="Xem trước giao diện Career Portal (AC2)"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>Xem trước</span>
                          </button>

                          {/* Thao tác cho tin Chờ duyệt */}
                          {job.status === "pending_review" && (
                            <>
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={() => handlePublishJob(job)}
                                className="flex items-center gap-1 px-3 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all cursor-pointer shadow-sm active:scale-95"
                                title="Duyệt và xuất bản tin ngay"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Xuất bản</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setRevisionJob(job);
                                  setRevisionReason("");
                                  setRevisionError("");
                                }}
                                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-orange-800 bg-orange-100 hover:bg-orange-200 rounded-lg transition-colors cursor-pointer"
                                title="Yêu cầu người tạo chỉnh sửa lại"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Sửa lại</span>
                              </button>
                            </>
                          )}

                          {/* Thao tác cho tin Đã xuất bản */}
                          {job.status === "published" && (
                            <>
                              <Link
                                href={`/candidate/jobs/${job.raw.slug || job.id}`}
                                target="_blank"
                                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer border border-emerald-200"
                                title="Mở trang xem công khai"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Portal</span>
                              </Link>

                              <button
                                type="button"
                                onClick={() => setClosingJob(job)}
                                className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Gỡ tin khỏi Portal"
                              >
                                <Archive className="w-3.5 h-3.5" />
                                <span>Gỡ tin</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL 1: LIVE PORTAL PREVIEW VỚI RESPONSIVE SWITCHER (S3-10 AC2) */}
      {previewJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div
            className={`w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150 transition-all ${
              previewDevice === "mobile" ? "max-w-[420px]" : "max-w-5xl"
            }`}
          >
            {/* Modal Top Bar */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Briefcase className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30">
                      Live Portal Preview Mode [S3-10]
                    </span>
                    <span className="text-xs text-slate-400 hidden sm:inline">• Chuẩn nhận diện Career Site</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold tracking-tight mt-0.5 line-clamp-1">
                    {previewJob.title}
                  </h3>
                </div>
              </div>

              {/* Responsive Device Switcher (Desktop vs Mobile) */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/15">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("desktop")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      previewDevice === "desktop" ? "bg-blue-600 text-white shadow-xs" : "text-slate-300 hover:text-white"
                    }`}
                    title="Mô phỏng màn hình máy tính"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("mobile")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      previewDevice === "mobile" ? "bg-blue-600 text-white shadow-xs" : "text-slate-300 hover:text-white"
                    }`}
                    title="Mô phỏng điện thoại di động (375px)"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mobile</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewJob(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-xl cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Mock Public Career Site Exactly */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-[#f8fafc] text-slate-800">
              {/* Brand Top Banner */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
                    T
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm tracking-tight">Cổng Tuyển Dụng Tập Đoàn</h4>
                    <p className="text-[11px] text-slate-500">Môi trường chuyên nghiệp • Đãi ngộ vượt trội</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-lg border border-blue-100">
                    {previewJob.department}
                  </span>
                  <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-lg">
                    {previewJob.code}
                  </span>
                </div>
              </div>

              {/* Expired Job Notice if expired */}
              {previewJob.isExpired && (
                <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-amber-900 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div className="text-xs">
                    <strong>Vị trí này đã hết hạn nhận hồ sơ ({previewJob.deadline}).</strong> Khi duyệt xuất bản, ứng viên sẽ không thể nộp CV nếu chưa được gia hạn thời gian tuyển.
                  </div>
                </div>
              )}

              {/* Revision note banner if present */}
              {previewJob.revisionReason && (
                <div className="bg-orange-50 border border-orange-300 rounded-2xl p-4 text-orange-950 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-900">
                    <RotateCcw className="w-4 h-4 text-orange-600" />
                    <span>Lý do Trưởng phòng đã yêu cầu chỉnh sửa trước đó:</span>
                  </div>
                  <p className="text-xs text-orange-800 bg-white/70 p-2.5 rounded-xl border border-orange-200/80">
                    {previewJob.revisionReason}
                  </p>
                </div>
              )}

              {/* Job Main Header */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {previewJob.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-2.5">
                    <span className="flex items-center gap-1 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {previewJob.location}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-semibold">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      {previewJob.employmentType}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                      <DollarSign className="w-3.5 h-3.5" />
                      {previewJob.salaryDisplay}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Hạn: {previewJob.deadline || "Không giới hạn"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2-Column Responsive Body Layout */}
              <div className={`grid gap-6 ${previewDevice === "desktop" ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1"}`}>
                {/* Left Column: Details */}
                <div className={`space-y-6 ${previewDevice === "desktop" ? "lg:col-span-8" : "w-full"}`}>
                  {/* Mô tả công việc */}
                  <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-3">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                      <span>Mô Tả Công Việc</span>
                    </h3>
                    <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-2 whitespace-pre-line">
                      {previewJob.description}
                    </div>
                  </div>

                  {/* Yêu cầu ứng viên */}
                  <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-3">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>Yêu Cầu Ứng Viên</span>
                    </h3>
                    {previewJob.requirements.length > 0 ? (
                      <ul className="space-y-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {previewJob.requirements.map((req, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-2" />
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Theo tiêu chuẩn vị trí {previewJob.level}</p>
                    )}

                    {/* Tags */}
                    {previewJob.skills && previewJob.skills.length > 0 && (
                      <div className="pt-3 border-t border-slate-100">
                        <span className="text-[11px] font-bold text-slate-500 block mb-2">Kỹ năng liên quan:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {previewJob.skills.map((skill, sIdx) => (
                            <span key={sIdx} className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-lg border border-blue-100">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quyền lợi được hưởng */}
                  <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-3">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>Quyền Lợi & Đãi Ngộ</span>
                    </h3>
                    {previewJob.benefits.length > 0 ? (
                      <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {previewJob.benefits.map((ben, bIdx) => (
                          <li key={bIdx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{ben}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Chế độ phúc lợi theo chính sách tập đoàn.</p>
                    )}
                  </div>
                </div>

                {/* Right Column: Application Widget */}
                <div className={`space-y-5 ${previewDevice === "desktop" ? "lg:col-span-4" : "w-full"}`}>
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Tổng Quan Vị Trí Tuyển Dụng
                    </h3>

                    <div className="space-y-3 text-xs border-y border-slate-100 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Hình thức:</span>
                        <strong className="text-slate-800">{previewJob.employmentType}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Cấp bậc:</span>
                        <strong className="text-slate-800">{previewJob.level}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Hạn nộp hồ sơ:</span>
                        <strong className="text-slate-800">{previewJob.deadline || "Vô thời hạn"}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Địa điểm:</span>
                        <strong className="text-slate-800">{previewJob.location}</strong>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        disabled
                        className="w-full py-3 bg-blue-600 text-white font-extrabold text-xs rounded-xl shadow-md opacity-85 cursor-not-allowed flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Nộp Hồ Sơ Ứng Tuyển Ngay</span>
                      </button>
                      <p className="text-[10px] text-center text-slate-400 italic">
                        (Mô phỏng nút nộp hồ sơ của ứng viên trên giao diện Career Portal)
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100 text-xs space-y-1.5 text-blue-900">
                    <div className="font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>Thông tin kiểm duyệt (S3-10)</span>
                    </div>
                    <p className="text-[11px] text-blue-700">
                      Người tạo tin: <strong>{previewJob.creatorName}</strong> ({previewJob.creatorEmail})
                    </p>
                    {previewJob.publishedBy && (
                      <p className="text-[11px] text-blue-700">
                        Đã xuất bản bởi: <strong>{previewJob.publishedBy}</strong> ({previewJob.publishedAt})
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setPreviewJob(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/80 rounded-xl transition-all cursor-pointer"
              >
                Đóng xem trước
              </button>

              <div className="flex items-center gap-2">
                {previewJob.status === "pending_review" && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setRevisionJob(previewJob);
                        setRevisionReason("");
                        setRevisionError("");
                      }}
                      className="px-4 py-2 text-xs font-bold text-orange-800 bg-orange-100 hover:bg-orange-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Yêu cầu sửa lại</span>
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handlePublishJob(previewJob)}
                      className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/25 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      <span>Duyệt & Xuất Bản Lên Portal Ngay (AC1)</span>
                    </button>
                  </>
                )}

                {previewJob.status === "published" && (
                  <Link
                    href={`/candidate/jobs/${previewJob.raw.slug || previewJob.id}`}
                    target="_blank"
                    className="px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-emerald-300"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Mở tin thực tế ngoài Portal</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: YÊU CẦU SỬA LẠI (BẮT BUỘC NHẬP LÝ DO - S3-10 RULE) */}
      {revisionJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 bg-orange-50/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-orange-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Yêu Cầu Sửa Lại Tin Tuyển Dụng (S3-10)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRevisionJob(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRevision} className="p-6 space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                <div>Tin tuyển dụng: <strong className="text-slate-900">{revisionJob.title}</strong></div>
                <div className="text-slate-500">Người phụ trách: {revisionJob.creatorName} ({revisionJob.creatorEmail})</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Lý do chi tiết & Các điểm cần chỉnh sửa <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Nhập yêu cầu sửa đổi (VD: Cần cập nhật dải lương theo band mới của khối IT, điều chỉnh hạn nộp hồ sơ và bổ sung chứng chỉ yêu cầu...)"
                  value={revisionReason}
                  onChange={(e) => {
                    setRevisionReason(e.target.value);
                    if (revisionError) setRevisionError("");
                  }}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-2xl focus:border-orange-500 focus:outline-hidden font-medium"
                />
                {revisionError && (
                  <p className="text-xs text-rose-600 font-semibold mt-1">{revisionError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRevisionJob(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-md shadow-orange-500/20 cursor-pointer active:scale-95"
                >
                  {actionLoading ? "Đang gửi..." : "Gửi yêu cầu sửa cho Recruiter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: XÁC NHẬN GỠ TIN KHỎI PORTAL */}
      {closingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Xác nhận gỡ tin tuyển dụng</h3>
                <p className="text-xs text-slate-500">Tin sẽ lập tức biến mất khỏi Cổng tuyển dụng công khai.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-200">
              Bạn có chắc chắn muốn gỡ tin <strong>{closingJob.title}</strong>? Các ứng viên sẽ không thể nộp đơn cho vị trí này nữa.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClosingJob(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleCloseJob}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-500/20 cursor-pointer"
              >
                {actionLoading ? "Đang xử lý..." : "Xác nhận gỡ tin"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
