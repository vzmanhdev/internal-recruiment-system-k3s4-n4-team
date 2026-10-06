"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Briefcase,
  Calendar,
  CalendarCheck,
  CheckCircle,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Kanban,
  List,
  Mail,
  MessageSquare,
  Phone,
  Search,
  Star,
  User,
  UserCheck,
  X,
} from "lucide-react";
import { recruiterService } from "../services/recruiter.service";
import type { CandidateApplication, CandidateStage, RecruiterJob } from "../types/recruiter.types";
import { Spinner } from "@/components/ui/Spinner";

const STAGE_CONFIG: Record<
  CandidateStage,
  { label: string; tone: string; bg: string; border: string; badgeBg: string; text: string }
> = {
  new: {
    label: "Mới tiếp nhận",
    tone: "blue",
    bg: "bg-blue-50/50",
    border: "border-blue-200",
    badgeBg: "bg-blue-100 text-blue-700",
    text: "text-blue-700",
  },
  screening: {
    label: "Lọc hồ sơ",
    tone: "indigo",
    bg: "bg-indigo-50/50",
    border: "border-indigo-200",
    badgeBg: "bg-indigo-100 text-indigo-700",
    text: "text-indigo-700",
  },
  interview: {
    label: "Phỏng vấn",
    tone: "amber",
    bg: "bg-amber-50/50",
    border: "border-amber-200",
    badgeBg: "bg-amber-100 text-amber-700",
    text: "text-amber-700",
  },
  offer: {
    label: "Đề xuất Offer",
    tone: "purple",
    bg: "bg-purple-50/50",
    border: "border-purple-200",
    badgeBg: "bg-purple-100 text-purple-700",
    text: "text-purple-700",
  },
  hired: {
    label: "Đã tuyển dụng",
    tone: "emerald",
    bg: "bg-emerald-50/50",
    border: "border-emerald-200",
    badgeBg: "bg-emerald-100 text-emerald-800",
    text: "text-emerald-700",
  },
  rejected: {
    label: "Không phù hợp",
    tone: "red",
    bg: "bg-slate-50/70",
    border: "border-slate-200",
    badgeBg: "bg-slate-200 text-slate-700",
    text: "text-slate-600",
  },
};

export function CandidateManagement() {
  const searchParams = useSearchParams();
  const [candidates, setCandidates] = useState<CandidateApplication[]>([]);
  const [jobs, setJobs] = useState<RecruiterJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

  // Filters
  const [selectedJobId, setSelectedJobId] = useState<string>(searchParams.get("job_id") ?? "all");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Detail Modal
  const [activeCandidate, setActiveCandidate] = useState<CandidateApplication | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [modalStage, setModalStage] = useState<CandidateStage>("new");
  const [modalRating, setModalRating] = useState(4);
  const [modalNotes, setModalNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [candRes, jobsRes] = await Promise.all([
        recruiterService.getCandidates({
          job_id: selectedJobId !== "all" ? parseInt(selectedJobId) : undefined,
          stage: selectedStage,
          search,
        }),
        recruiterService.getJobs(),
      ]);
      setCandidates(candRes.items);
      setJobs(jobsRes.items);
    } catch (err) {
      console.error("Failed to load candidates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedJobId, selectedStage]);

  // Check if query param ?id= exists
  useEffect(() => {
    const candidateIdParam = searchParams.get("id");
    if (candidateIdParam && candidates.length > 0) {
      const match = candidates.find((c) => String(c.id) === candidateIdParam);
      if (match) openDetailModal(match);
    }
  }, [searchParams, candidates]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const openDetailModal = (candidate: CandidateApplication) => {
    setActiveCandidate(candidate);
    setModalStage(candidate.stage);
    setModalRating(candidate.rating);
    setModalNotes(candidate.hr_notes || "");
    setDetailModalOpen(true);
  };

  const handleUpdateCandidate = async () => {
    if (!activeCandidate) return;
    try {
      setIsUpdating(true);
      const updated = await recruiterService.updateCandidateStage(activeCandidate.id, {
        stage: modalStage,
        rating: modalRating,
        hr_notes: modalNotes,
      });

      setCandidates((prev) =>
        prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
      );
      setToastMessage(`Đã cập nhật trạng thái ứng viên ${updated.candidate_name}.`);
      setDetailModalOpen(false);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error(err);
      alert("Đã xảy ra lỗi khi cập nhật hồ sơ ứng viên.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFastAdvance = async (candidate: CandidateApplication, nextStage: CandidateStage) => {
    try {
      const updated = await recruiterService.updateCandidateStage(candidate.id, {
        stage: nextStage,
      });
      setCandidates((prev) =>
        prev.map((c) => (c.id === updated.id ? { ...c, stage: nextStage } : c))
      );
      setToastMessage(`Đã chuyển ứng viên ${candidate.candidate_name} sang "${STAGE_CONFIG[nextStage].label}".`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error(err);
      alert("Không thể chuyển giai đoạn ứng viên.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-xl">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản Lý Hồ Sơ Ứng Viên (ATS)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi hành trình ứng viên từ tiếp nhận hồ sơ, đánh giá chuyên môn, phỏng vấn đến duyệt Offer.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            onClick={() => setViewMode("kanban")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              viewMode === "kanban" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Kanban className="h-3.5 w-3.5" />
            <span>Kanban Pipeline</span>
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              viewMode === "table" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>Danh sách</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Job Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500">Vị trí:</span>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">Tất cả vị trí tuyển dụng ({jobs.length})</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>

          {/* Stage Filter for Table view */}
          {viewMode === "table" && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500">Giai đoạn:</span>
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">Tất cả các vòng</option>
                <option value="new">Mới tiếp nhận</option>
                <option value="screening">Lọc hồ sơ</option>
                <option value="interview">Phỏng vấn</option>
                <option value="offer">Đề xuất Offer</option>
                <option value="hired">Đã tuyển dụng</option>
                <option value="rejected">Không phù hợp</option>
              </select>
            </div>
          )}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            placeholder="Tìm theo tên, email, SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 sm:w-64 rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
          />
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
        </form>
      </div>

      {/* Main Content Area: Kanban or Table */}
      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : viewMode === "kanban" ? (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 gap-4 overflow-x-auto pb-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 min-w-full">
          {(["new", "screening", "interview", "offer", "hired", "rejected"] as CandidateStage[]).map((stageKey) => {
            const config = STAGE_CONFIG[stageKey];
            const stageCandidates = candidates.filter((c) => c.stage === stageKey);

            return (
              <div
                key={stageKey}
                className="flex flex-col rounded-2xl border border-slate-200/80 bg-slate-100/60 p-3 min-w-[240px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200/70">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800">{config.label}</span>
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[11px] font-bold text-slate-700 shadow-xs">
                      {stageCandidates.length}
                    </span>
                  </div>
                </div>

                {/* Candidate Cards in Column */}
                <div className="mt-3 space-y-3 flex-1 overflow-y-auto max-h-[70vh]">
                  {stageCandidates.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-[11px] text-slate-400">
                      Không có hồ sơ
                    </div>
                  ) : (
                    stageCandidates.map((c) => (
                      <div
                        key={c.id}
                        className="group relative rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs hover:shadow-md transition-all space-y-2 cursor-pointer"
                        onClick={() => openDetailModal(c)}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {c.candidate_name}
                            </h4>
                            <p className="text-[11px] font-medium text-slate-500 truncate max-w-[170px]">
                              {c.job_title}
                            </p>
                          </div>
                          <div className="flex items-center gap-0.5 text-amber-500">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span className="text-[10px] font-bold text-slate-700">{c.rating}</span>
                          </div>
                        </div>

                        {/* Origin tag */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {c.is_internal ? (
                            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                              {c.current_department ?? "Nội bộ"}
                            </span>
                          ) : (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                              {c.referral_by ? `GT: ${c.referral_by}` : "Bên ngoài"}
                            </span>
                          )}
                        </div>

                        {/* Quick Advance Button Bar */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 text-[10px]">{c.created_at}</span>
                          
                          {stageKey === "new" && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFastAdvance(c, "screening");
                              }}
                              className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-blue-700 shadow-xs"
                            >
                              Duyệt lọc →
                            </button>
                          )}
                          {stageKey === "screening" && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFastAdvance(c, "interview");
                              }}
                              className="rounded bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-amber-600 shadow-xs"
                            >
                              Phỏng vấn →
                            </button>
                          )}
                          {stageKey === "interview" && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFastAdvance(c, "offer");
                              }}
                              className="rounded bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-purple-700 shadow-xs"
                            >
                              Gửi Offer →
                            </button>
                          )}
                          {stageKey === "offer" && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFastAdvance(c, "hired");
                              }}
                              className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-emerald-700 shadow-xs"
                            >
                              Trúng tuyển 🎉
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Ứng viên</th>
                  <th className="px-4 py-3.5">Vị trí ứng tuyển</th>
                  <th className="px-4 py-3.5">Nguồn hồ sơ</th>
                  <th className="px-4 py-3.5">Giai đoạn</th>
                  <th className="px-4 py-3.5">Đánh giá</th>
                  <th className="px-4 py-3.5">Ngày nộp</th>
                  <th className="px-4 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {candidates.map((c) => {
                  const stageConfig = STAGE_CONFIG[c.stage];
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900">{c.candidate_name}</div>
                        <div className="text-[11px] text-slate-500">{c.candidate_email} • {c.candidate_phone}</div>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700">
                        {c.job_title}
                      </td>
                      <td className="px-4 py-3.5">
                        {c.is_internal ? (
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                            Nội bộ ({c.current_department ?? "Cán bộ"})
                          </span>
                        ) : (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            {c.referral_by ? `Giới thiệu: ${c.referral_by}` : "Bên ngoài"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block rounded-md px-2.5 py-0.5 text-[11px] font-bold ${stageConfig.badgeBg}`}>
                          {stageConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="h-3.5 w-3.5 fill-amber-400" />
                          <span className="font-bold text-slate-700">{c.rating} / 5</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                        {c.created_at}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => openDetailModal(c)}
                          className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Candidate Detail Modal */}
      {detailModalOpen && activeCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl my-8">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900">
                    {activeCandidate.candidate_name}
                  </h2>
                  <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${STAGE_CONFIG[modalStage].badgeBg}`}>
                    {STAGE_CONFIG[modalStage].label}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Ứng tuyển vị trí: <span className="font-bold text-blue-700">{activeCandidate.job_title}</span>
                </p>
              </div>

              <button
                onClick={() => setDetailModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="mt-5 space-y-5">
              {/* Contact Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-100 text-xs">
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase font-bold">Email liên hệ</span>
                  <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    {activeCandidate.candidate_email}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase font-bold">Số điện thoại</span>
                  <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {activeCandidate.candidate_phone}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase font-bold">Đơn vị công tác</span>
                  <p className="font-semibold text-slate-800">
                    {activeCandidate.is_internal ? (activeCandidate.current_department ?? "Nhân viên nội bộ") : "Ứng viên ngoài"}
                  </p>
                </div>
              </div>

              {/* Resume / CV Attachment */}
              <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/60 p-3.5">
                <div className="flex items-center gap-2.5">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">{activeCandidate.resume_filename}</p>
                    <p className="text-[11px] text-slate-500">Đã kiểm tra tính toàn vẹn hồ sơ</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => alert(`Tải xuống tệp ${activeCandidate.resume_filename}`)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  Xem CV
                </button>
              </div>

              {/* Recruitment Stage and Rating Editor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giai đoạn tuyển dụng *
                  </label>
                  <select
                    value={modalStage}
                    onChange={(e) => setModalStage(e.target.value as CandidateStage)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 font-semibold"
                  >
                    <option value="new">1. Mới tiếp nhận</option>
                    <option value="screening">2. Lọc hồ sơ</option>
                    <option value="interview">3. Phỏng vấn</option>
                    <option value="offer">4. Đề xuất Offer</option>
                    <option value="hired">5. Đã tuyển dụng 🎉</option>
                    <option value="rejected">6. Không phù hợp (Từ chối)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Đánh giá chất lượng hồ sơ
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setModalRating(star)}
                        className="p-1 focus:outline-none"
                      >
                        <Star
                          className={`h-5 w-5 ${
                            star <= modalRating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-600 pl-2">{modalRating} / 5 sao</span>
                  </div>
                </div>
              </div>

              {/* HR Assessment Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ghi chú thẩm định & Đánh giá của HR Recruiter
                </label>
                <textarea
                  rows={3}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Nhập nhận xét về năng lực, thái độ, sự phù hợp văn hóa hoặc kết quả trao đổi..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-blue-500"
                />
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Link
                  href={`/recruiter/interviews?candidate=${encodeURIComponent(activeCandidate.candidate_name)}&job=${encodeURIComponent(activeCandidate.job_title ?? "")}&app_id=${activeCandidate.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                >
                  <CalendarCheck className="h-4 w-4" />
                  Xếp lịch phỏng vấn
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={handleUpdateCandidate}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isUpdating && <Spinner size="sm" />}
                    <span>Lưu cập nhật</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
