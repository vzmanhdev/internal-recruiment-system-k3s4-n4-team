"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  Calendar,
  Clock,
  ExternalLink,
  MapPin,
  Plus,
  Search,
  UserCheck,
  Video,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Interview } from "@/features/recruiter/types/recruiter.types";
import { recruiterService } from "@/features/recruiter/services/recruiter.service";
import { InterviewSchedulerModal } from "@/features/recruiter/components/InterviewSchedulerModal";

export default function RecruiterInterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>(() => recruiterService.getInterviews());
  const candidates = recruiterService.getCandidates();
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(candidates[0] || null);

  // Cancellation modal state
  const [interviewToCancel, setInterviewToCancel] = useState<Interview | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");

  const refreshInterviews = () => {
    setInterviews([...recruiterService.getInterviews()]);
  };

  const filtered = interviews.filter((i) => {
    if (statusFilter !== "all" && i.status !== statusFilter) return false;
    if (formatFilter !== "all" && i.format !== formatFilter) return false;
    return true;
  });

  const handleCancelInterview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewToCancel || !cancelReason.trim()) return;

    recruiterService.cancelInterview(interviewToCancel.id, cancelReason.trim());
    setInterviewToCancel(null);
    setCancelReason("");
    refreshInterviews();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
            <Calendar className="h-4 w-4" />
            <span>Điều phối Lịch phỏng vấn (EP-06)</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-950 sm:text-3xl">
            Lịch Phỏng vấn Ứng viên
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Đặt lịch mới, tự động phát hiện xung đột lịch phỏng vấn viên và phòng họp.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setSelectedCandidate(candidates.find((c) => c.stage === "screening" || c.stage === "interviewing") || candidates[0]);
            setIsSchedulerOpen(true);
          }}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Đặt lịch phỏng vấn mới
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-52">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: "all", label: "Tất cả trạng thái" },
                { value: "scheduled", label: "Đã lên lịch" },
                { value: "completed", label: "Đã hoàn thành" },
                { value: "cancelled", label: "Đã hủy" },
              ]}
            />
          </div>

          <div className="w-48">
            <Select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              options={[
                { value: "all", label: "Tất cả hình thức" },
                { value: "online", label: "Trực tuyến" },
                { value: "in_person", label: "Trực tiếp" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Interviews Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-400">
            Không tìm thấy buổi phỏng vấn nào phù hợp với bộ lọc.
          </div>
        ) : (
          filtered.map((iv) => {
            const isCancelled = iv.status === "cancelled";
            return (
              <div
                key={iv.id}
                className={`rounded-2xl border bg-white p-5 shadow-xs transition-all space-y-4 ${
                  isCancelled
                    ? "border-red-200 bg-red-50/20 opacity-75"
                    : "border-slate-200 hover:border-blue-400 hover:shadow-md"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-extrabold text-blue-700">
                      {iv.round}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-base mt-2">{iv.candidateName}</h3>
                    <p className="text-xs text-slate-500 font-medium">{iv.jobTitle}</p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      isCancelled
                        ? "bg-red-100 text-red-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {isCancelled ? "Đã hủy" : "Sắp diễn ra"}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span>
                      {new Date(iv.scheduledAt).toLocaleString("vi-VN", {
                        weekday: "short",
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      ({iv.durationMinutes} phút)
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    {iv.format === "online" ? (
                      <Video className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    ) : (
                      <MapPin className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    )}
                    <span className="break-all">{iv.locationOrLink}</span>
                  </div>

                  <div className="flex items-start gap-2">
                    <UserCheck className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-700">Hội đồng phỏng vấn:</p>
                      <p className="text-slate-500">{iv.interviewers.join(", ")}</p>
                    </div>
                  </div>

                  {iv.notes && (
                    <p className="rounded-lg bg-slate-50 p-2 text-[11px] text-slate-500 italic">
                      "{iv.notes}"
                    </p>
                  )}

                  {isCancelled && iv.cancelReason && (
                    <p className="rounded-lg bg-red-50 p-2 text-[11px] text-red-700">
                      <strong>Lý do hủy:</strong> {iv.cancelReason}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">#{iv.id}</span>
                  <div className="flex items-center gap-2">
                    {!isCancelled && (
                      <button
                        type="button"
                        onClick={() => setInterviewToCancel(iv)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Hủy buổi phỏng vấn (S6-06)"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}

                    {iv.format === "online" && !isCancelled && (
                      <a
                        href={iv.locationOrLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-xs"
                      >
                        <Video className="h-3.5 w-3.5" />
                        Vào phòng họp
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Interview Scheduler Modal */}
      <InterviewSchedulerModal
        isOpen={isSchedulerOpen}
        candidate={selectedCandidate}
        onClose={() => setIsSchedulerOpen(false)}
        onSuccess={() => refreshInterviews()}
      />

      {/* Cancel Interview Modal */}
      {interviewToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-extrabold text-slate-950">Hủy buổi phỏng vấn</h3>
            <p className="text-xs text-slate-500 mt-1">
              Ứng viên: <strong>{interviewToCancel.candidateName}</strong> — {interviewToCancel.round}
            </p>

            <form onSubmit={handleCancelInterview} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nhập lý do hủy bắt buộc (S6-06) *
                </label>
                <textarea
                  required
                  placeholder="Ví dụ: Người phỏng vấn bận đột xuất, ứng viên xin dời lịch..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full min-h-24 rounded-xl border border-slate-200 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={() => setInterviewToCancel(null)}>
                  Đóng
                </Button>
                <Button variant="danger" size="sm" type="submit">
                  Xác nhận hủy
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
