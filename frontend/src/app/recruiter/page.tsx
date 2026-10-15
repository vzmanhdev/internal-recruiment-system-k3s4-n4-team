"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BriefcaseBusiness,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileEdit,
  FileText,
  Filter,
  Globe,
  Layers,
  MapPin,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { recruiterService } from "@/features/recruiter/services/recruiter.service";
import type { JobRequisition, RecruiterJob } from "@/features/recruiter/types/recruiter.types";
import { AssignedRequisitionsTab } from "@/features/recruiter/components/AssignedRequisitionsTab";
import { JobDraftFromRequisitionModal } from "@/features/recruiter/components/JobDraftFromRequisitionModal";
import { Spinner } from "@/components/ui/Spinner";

export default function RecruiterSprint3Workspace() {
  const [activeMainTab, setActiveMainTab] = useState<"requisitions" | "jobs">("requisitions");

  // Requisitions State (S3-06, S3-08)
  const [requisitions, setRequisitions] = useState<JobRequisition[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(true);
  const [reqStatusFilter, setReqStatusFilter] = useState("all");
  const [reqSearchQuery, setReqSearchQuery] = useState("");
  const [reqDeptFilter, setReqDeptFilter] = useState("all");

  // Jobs State (S3-09, S3-10)
  const [jobs, setJobs] = useState<RecruiterJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobStatusFilter, setJobStatusFilter] = useState("all");
  const [jobSearchQuery, setJobSearchQuery] = useState("");

  // Modal State
  const [selectedReqForDraft, setSelectedReqForDraft] = useState<JobRequisition | null>(null);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Departments List
  const departments = [
    "Khối Công nghệ",
    "Khối Công Nghệ Thông Tin",
    "Khối Kinh doanh",
    "Phòng Nhân sự",
    "Phòng Marketing",
    "Phòng Tài chính Kế toán",
  ];

  const loadRequisitions = async () => {
    try {
      setLoadingReqs(true);
      const res = await recruiterService.getRequisitions({
        status: reqStatusFilter,
        department: reqDeptFilter,
        search: reqSearchQuery,
      });
      setRequisitions(res.items || []);
    } catch (err) {
      console.error("Không thể tải danh sách tờ trình:", err);
    } finally {
      setLoadingReqs(false);
    }
  };

  const loadJobs = async () => {
    try {
      setLoadingJobs(true);
      const res = await recruiterService.getJobs({
        status: jobStatusFilter,
        search: jobSearchQuery,
      });
      setJobs(res.items || []);
    } catch (err) {
      console.error("Không thể tải danh sách tin tuyển dụng:", err);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    loadRequisitions();
  }, [reqStatusFilter, reqDeptFilter, reqSearchQuery]);

  useEffect(() => {
    loadJobs();
  }, [jobStatusFilter, jobSearchQuery]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleSelectReqForDraft = (req: JobRequisition) => {
    setSelectedReqForDraft(req);
    setIsDraftModalOpen(true);
  };

  const handleDraftSuccess = (createdJob: RecruiterJob) => {
    showToast(
      `Đã soạn tin tuyển dụng thành công: "${createdJob.title}". Bài đăng đã được liên kết với tờ trình gốc.`
    );
    loadRequisitions();
    loadJobs();
  };

  // KPIs for Sprint 3
  const totalAssignedReqs = requisitions.length;
  const approvedReqsCount = requisitions.filter((r) => r.status === "approved").length;
  const overdueReqsCount = requisitions.filter(
    (r) => r.is_overdue || (r.days_remaining !== null && r.days_remaining !== undefined && r.days_remaining < 0 && r.status !== "closed")
  ).length;
  const activeJobsCount = jobs.filter((j) => j.status === "open").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-emerald-600 px-5 py-3.5 text-xs font-bold text-white shadow-xl shadow-emerald-600/20 border border-emerald-400 animate-in slide-in-from-top-4">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-blue-900/10">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur text-white">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                Sprint 3 Workspace
              </span>
              <span className="rounded-full bg-blue-500/30 px-3 py-1 text-xs font-bold text-blue-100">
                Nhân Viên Tuyển Dụng (Recruiter)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Bàn Làm Việc Nhân Viên Tuyển Dụng
            </h1>
            <p className="text-sm text-blue-100/90 leading-relaxed">
              Vận hành các tờ trình tuyển dụng được giao phụ trách (S3-06), theo dõi hạn mức và cảnh báo trễ hạn SLA (S3-08), soạn thảo tin tuyển dụng kế thừa từ yêu cầu đã duyệt (S3-09) và quản lý xuất bản tin (S3-10).
            </p>
          </div>

          {/* Quick Action Button */}
          <div className="shrink-0 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const firstApproved = requisitions.find((r) => r.status === "approved");
                if (firstApproved) {
                  handleSelectReqForDraft(firstApproved);
                } else {
                  showToast("Hiện chưa có tờ trình nào ở trạng thái 'Đã duyệt' để soạn tin. Vui lòng kiểm tra lại danh sách.");
                }
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-black !text-blue-700 shadow-lg shadow-black/10 hover:bg-blue-50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-blue-700 shrink-0" />
              <span className="font-black text-blue-700">Soạn tin từ Yêu cầu đã duyệt (S3-09)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 KPI Summary Cards (Sprint 3 Focus) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Assigned Requisitions (S3-06) */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Yêu cầu được giao (S3-06)
            </span>
            <div className="h-9 w-9 rounded-2xl bg-blue-50 text-blue-600 grid place-items-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalAssignedReqs}</span>
            <span className="text-xs text-slate-400">tờ trình</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Chỉ hiển thị các vị trí bạn phụ trách chính hoặc hỗ trợ
          </p>
        </div>

        {/* KPI 2: Approved Requisitions (S3-09 Ready) */}
        <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Đã duyệt - Sẵn sàng tạo tin (S3-09)
            </span>
            <div className="h-9 w-9 rounded-2xl bg-emerald-100 text-emerald-700 grid place-items-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{approvedReqsCount}</span>
            <span className="text-xs text-emerald-600">vị trí sẵn sàng</span>
          </div>
          <p className="mt-2 text-[11px] text-emerald-600 font-semibold">
            Đủ điều kiện AC3 để xuất bản tin ra cổng việc làm
          </p>
        </div>

        {/* KPI 3: Overdue SLA Alerts (S3-08) */}
        <div
          className={`rounded-3xl border p-5 shadow-sm hover:shadow-md transition-shadow ${
            overdueReqsCount > 0
              ? "border-rose-200 bg-rose-50/50"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                overdueReqsCount > 0 ? "text-rose-700" : "text-slate-500"
              }`}
            >
              Cảnh báo quá hạn (S3-08)
            </span>
            <div
              className={`h-9 w-9 rounded-2xl grid place-items-center ${
                overdueReqsCount > 0
                  ? "bg-rose-100 text-rose-600 animate-pulse"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span
              className={`text-2xl font-black ${
                overdueReqsCount > 0 ? "text-rose-700" : "text-slate-900"
              }`}
            >
              {overdueReqsCount}
            </span>
            <span className="text-xs text-slate-400">vị trí trễ SLA</span>
          </div>
          <p
            className={`mt-2 text-[11px] font-semibold ${
              overdueReqsCount > 0 ? "text-rose-600" : "text-slate-400"
            }`}
          >
            {overdueReqsCount > 0
              ? "Cần ưu tiên đẩy nhanh tiến độ tuyển dụng"
              : "Tất cả vị trí đều trong hạn an toàn"}
          </p>
        </div>

        {/* KPI 4: Active Job Postings */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tin đang đăng tuyển (S3-10)
            </span>
            <div className="h-9 w-9 rounded-2xl bg-indigo-50 text-indigo-600 grid place-items-center">
              <BriefcaseBusiness className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{activeJobsCount}</span>
            <span className="text-xs text-slate-400">bài đăng mở</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Ứng viên có thể tiếp cận nộp CV trực tiếp trên Career Portal
          </p>
        </div>
      </div>

      {/* Main Workspace Tabs */}
      <div className="space-y-6">
        {/* Navigation Tabs Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveMainTab("requisitions")}
              className={`flex items-center gap-2 pb-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeMainTab === "requisitions"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>1. Yêu cầu tuyển dụng được phân công (Story S3-06 & S3-08)</span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                {requisitions.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab("jobs")}
              className={`flex items-center gap-2 pb-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeMainTab === "jobs"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <BriefcaseBusiness className="h-4 w-4" />
              <span>2. Quản lý Tin tuyển dụng & Xuất bản (Story S3-09 & S3-10)</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {jobs.length}
              </span>
            </button>
          </div>

          <Link
            href="/jobs"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <span>Mở Cổng việc làm công khai</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Tab 1: Assigned Requisitions (S3-06, S3-08) */}
        {activeMainTab === "requisitions" && (
          <AssignedRequisitionsTab
            requisitions={requisitions}
            loading={loadingReqs}
            onSelectForDraft={handleSelectReqForDraft}
            statusFilter={reqStatusFilter}
            onStatusFilterChange={setReqStatusFilter}
            searchQuery={reqSearchQuery}
            onSearchQueryChange={setReqSearchQuery}
            departmentFilter={reqDeptFilter}
            onDepartmentFilterChange={setReqDeptFilter}
            departments={departments}
          />
        )}

        {/* Tab 2: Job Postings Management (S3-09, S3-10) */}
        {activeMainTab === "jobs" && (
          <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
              <div className="relative flex-1 w-full max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={jobSearchQuery}
                  onChange={(e) => setJobSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm tin tuyển dụng theo tiêu đề..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center rounded-xl bg-slate-100 p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setJobStatusFilter("all")}
                  className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                    jobStatusFilter === "all" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"
                  }`}
                >
                  Tất cả ({jobs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setJobStatusFilter("open")}
                  className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                    jobStatusFilter === "open" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600"
                  }`}
                >
                  Đang mở
                </button>
                <button
                  type="button"
                  onClick={() => setJobStatusFilter("closed")}
                  className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                    jobStatusFilter === "closed" ? "bg-slate-700 text-white shadow-sm" : "text-slate-600"
                  }`}
                >
                  Bản nháp / Đóng
                </button>
              </div>
            </div>

            {/* Jobs List */}
            {loadingJobs ? (
              <div className="flex h-64 flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200">
                <Spinner size="lg" />
                <p className="text-xs text-slate-500">Đang tải danh sách bài đăng...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200 p-6 text-center">
                <div className="h-12 w-12 rounded-2xl bg-slate-100 grid place-items-center text-slate-400">
                  <BriefcaseBusiness className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">Chưa có tin tuyển dụng nào</p>
                <p className="text-xs text-slate-500 max-w-sm">
                  Hãy chuyển sang Tab 1 để chọn một Yêu cầu đã duyệt và bấm "Soạn tin tuyển dụng" theo quy trình Sprint 3.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-0.5 text-[11px] font-bold">
                          {job.department}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            job.status === "open"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {job.status === "open" ? "Đang mở" : "Bản nháp"}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base line-clamp-2">
                          {job.title}
                        </h3>
                        {job.requisition_id && (
                          <p className="text-[11px] text-slate-400 mt-1 font-mono">
                            Kế thừa từ Yêu cầu #{job.requisition_id}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="font-semibold text-slate-800">{job.salary_range}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>Hạn nhận: {job.deadline}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <Link
                        href={`/jobs/${job.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Xem trang công khai</span>
                      </Link>

                      <Link
                        href={`/recruiter/jobs`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
                      >
                        <FileEdit className="h-3.5 w-3.5" />
                        <span>Quản lý</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global S3-09 Drafting & S3-10 Live Preview Modal */}
      <JobDraftFromRequisitionModal
        isOpen={isDraftModalOpen}
        onClose={() => {
          setIsDraftModalOpen(false);
          setSelectedReqForDraft(null);
        }}
        requisition={selectedReqForDraft}
        onSuccess={handleDraftSuccess}
      />
    </div>
  );
}
