"use client";

import React, { useState } from "react";
import {
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileCheck,
  FileText,
  History,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  Sparkles,
  Star,
  Tag,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Candidate, PipelineStage } from "../types/recruiter.types";
import { recruiterService } from "../services/recruiter.service";

interface CandidateUnifiedDrawerProps {
  isOpen: boolean;
  candidate: Candidate | null;
  onClose: () => void;
  onStageChange: (candidateId: string, newStage: PipelineStage) => void;
  onOpenSchedule: (candidate: Candidate) => void;
  onOpenOffer: (candidate: Candidate) => void;
  onOpenReject: (candidate: Candidate) => void;
}

export function CandidateUnifiedDrawer({
  isOpen,
  candidate,
  onClose,
  onStageChange,
  onOpenSchedule,
  onOpenOffer,
  onOpenReject,
}: CandidateUnifiedDrawerProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "notes" | "history">("overview");
  const [newNote, setNewNote] = useState("");
  const [newTag, setNewTag] = useState("");

  if (!isOpen || !candidate) return null;

  const stageLabels: Record<PipelineStage, string> = {
    new_applied: "Hồ sơ mới",
    screening: "Sàng lọc",
    interviewing: "Phỏng vấn",
    offer_proposed: "Đề xuất Offer",
    hired: "Nhận việc",
    rejected: "Đã loại",
  };

  const handleRatingChange = (stars: number) => {
    recruiterService.updateCandidateRating(candidate.id, stars);
    candidate.rating = stars;
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    const added = recruiterService.addCandidateNote(candidate.id, newNote.trim());
    if (added) {
      candidate.notes.unshift(added);
      setNewNote("");
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTag.trim()) {
      e.preventDefault();
      recruiterService.addCandidateTags(candidate.id, newTag.trim());
      setNewTag("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <aside className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Drawer Header */}
          <div className="border-b border-slate-200 p-6 bg-slate-50/60">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-600 font-extrabold text-white text-lg shadow-md shadow-blue-500/20">
                  {candidate.fullName.slice(0, 1)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-slate-950">{candidate.fullName}</h2>
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                      {stageLabels[candidate.stage]}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">
                    {candidate.jobTitle} · {candidate.department}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Mã hồ sơ: #{candidate.id} · Nộp ngày {candidate.appliedDate} · Nguồn: {candidate.source}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Metrics Bar & Interactive Rating */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/60 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-500">Đánh giá sao:</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingChange(star)}
                      className="p-0.5 hover:scale-125 transition-transform"
                      title={`Chấm ${star} sao`}
                    >
                      <Star
                        className={`h-4 w-4 ${
                          star <= candidate.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-500">Điểm sàng lọc:</span>
                <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                  {candidate.matchScore}% Đạt chuẩn
                </span>
              </div>

              {candidate.slaOverdue && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 animate-pulse">
                  ⚠️ Quá hạn SLA {candidate.slaDaysInCurrentStage} ngày
                </span>
              )}
            </div>

            {/* Navigation Tabs */}
            <div className="mt-4 flex border-b border-slate-200 text-xs font-bold">
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors ${
                  activeTab === "overview"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <User className="h-3.5 w-3.5" />
                Tổng quan & CV
              </button>
              <button
                onClick={() => setActiveTab("timeline")}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors ${
                  activeTab === "timeline"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <History className="h-3.5 w-3.5" />
                Dòng thời gian ({candidate.timeline.length})
              </button>
              <button
                onClick={() => setActiveTab("notes")}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors ${
                  activeTab === "notes"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Ghi chú ({candidate.notes.length})
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors ${
                  activeTab === "history"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <FileCheck className="h-3.5 w-3.5" />
                Lịch sử ứng tuyển ({candidate.pastApplications.length})
              </button>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Contact info cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600">
                      <Mail className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400">Email liên hệ</p>
                      <p className="truncate text-xs font-bold text-slate-900">{candidate.email}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Phone className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400">Số điện thoại</p>
                      <p className="truncate text-xs font-bold text-slate-900">{candidate.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Professional details */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3.5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Thông tin chuyên môn</h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500">Số năm kinh nghiệm:</span>
                      <p className="font-bold text-slate-900 mt-0.5">{candidate.experienceYears} năm</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Công ty hiện tại:</span>
                      <p className="font-bold text-slate-900 mt-0.5">{candidate.currentCompany || "Chưa cập nhật"}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500">Học vấn / Bằng cấp:</span>
                      <p className="font-bold text-slate-900 mt-0.5">{candidate.education}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-500">Kỹ năng chuyên môn:</span>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {candidate.skills.map((skill) => (
                        <span key={skill} className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-500">Nhãn (Tags):</span>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {candidate.tags.map((t) => (
                        <span key={t} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                          <Tag className="h-3 w-3 text-slate-400" />
                          {t}
                          <button
                            onClick={() => recruiterService.removeCandidateTag(candidate.id, t)}
                            className="hover:text-red-500 ml-0.5 text-slate-400"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        placeholder="+ Nhập tag & gõ Enter"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={handleAddTag}
                        className="h-7 w-36 rounded-full border border-dashed border-slate-300 px-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* CV Viewer simulation */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{candidate.cvFileName}</h4>
                        <p className="text-[11px] text-slate-400">{candidate.cvFileSize} · Định dạng PDF</p>
                      </div>
                    </div>
                    <button
                      onClick={() => alert(`Đang tải xuống tệp CV ${candidate.cvFileName}...`)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Tải CV
                    </button>
                  </div>

                  {/* CV Preview Document Box */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 leading-relaxed font-mono">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 mb-3 font-sans">
                      <span className="font-extrabold text-slate-900">{candidate.fullName} - CURRICULUM VITAE</span>
                      <span className="text-[10px] text-slate-400">Trích xuất tự động</span>
                    </div>
                    <p className="font-sans text-xs text-slate-600 mb-2">
                      <strong>Tóm tắt kinh nghiệm:</strong> {candidate.cvSummary}
                    </p>
                    <p className="font-sans text-xs text-slate-600">
                      <strong>Kỹ năng nổi bật:</strong> {candidate.skills.join(" • ")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "timeline" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Dòng thời gian ghi nhận toàn bộ hoạt động tương tác, nộp hồ sơ, đổi giai đoạn và liên hệ với ứng viên.
                </p>
                <div className="relative pl-6 space-y-6 before:absolute before:bottom-0 before:top-2 before:left-2.5 before:w-0.5 before:bg-slate-200">
                  {candidate.timeline.map((event) => (
                    <div key={event.id} className="relative">
                      <span className="absolute -left-6 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-blue-600 text-white shadow-sm ring-4 ring-white">
                        <Clock className="h-2.5 w-2.5" />
                      </span>
                      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900">{event.title}</h4>
                          <span className="text-[11px] text-slate-400">{event.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{event.description}</p>
                        <p className="text-[11px] font-semibold text-blue-600 mt-2">Người thực hiện: {event.actor}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "notes" && (
              <div className="space-y-4">
                <form onSubmit={handleAddNote} className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Thêm ghi chú nội bộ (Ứng viên không thấy)
                  </label>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Nhập nhận xét về tác phong, kỹ năng phỏng vấn, trao đổi lương..."
                    className="w-full min-h-20 rounded-xl border border-slate-200 p-3 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  <div className="flex justify-end">
                    <Button size="sm" type="submit" leftIcon={<Send className="h-3.5 w-3.5" />}>
                      Lưu ghi chú
                    </Button>
                  </div>
                </form>

                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <h4 className="text-xs font-bold text-slate-500">Danh sách ghi chú ({candidate.notes.length})</h4>
                  {candidate.notes.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Chưa có ghi chú nội bộ nào.</p>
                  ) : (
                    candidate.notes.map((note) => (
                      <div key={note.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-500">
                          <span className="font-bold text-slate-900">{note.authorName} ({note.authorRole})</span>
                          <span className="text-[11px]">{note.createdAt}</span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">{note.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Lịch sử các lần ứng tuyển vị trí khác của cùng một ứng viên tại VinaTech.
                </p>
                {candidate.pastApplications.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                    Ứng viên chưa từng nộp hồ sơ vào các vị trí nào khác trước đây.
                  </div>
                ) : (
                  candidate.pastApplications.map((app) => (
                    <div key={app.id} className="rounded-xl border border-slate-200 bg-white p-4 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900">{app.jobTitle}</h4>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                          {app.outcome === "hired" ? "Đã tuyển" : app.outcome === "rejected" ? "Đã loại" : "Đang xử lý"}
                        </span>
                      </div>
                      <p className="text-slate-500">{app.department} · Ngày nộp: {app.appliedDate}</p>
                      <p className="text-slate-600">Giai đoạn cuối cùng: <strong>{app.finalStage}</strong></p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Action Bar Footer */}
          <div className="border-t border-slate-200 p-4 bg-slate-50/90 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenSchedule(candidate)}
                leftIcon={<Calendar className="h-4 w-4" />}
              >
                Đặt lịch phỏng vấn
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenOffer(candidate)}
                leftIcon={<FileCheck className="h-4 w-4" />}
              >
                Soạn Offer
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {candidate.stage !== "rejected" && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onOpenReject(candidate)}
                >
                  Loại hồ sơ
                </Button>
              )}
              {candidate.stage === "new_applied" && (
                <Button
                  size="sm"
                  onClick={() => onStageChange(candidate.id, "screening")}
                >
                  Duyệt sang Sàng lọc
                </Button>
              )}
              {candidate.stage === "screening" && (
                <Button
                  size="sm"
                  onClick={() => onStageChange(candidate.id, "interviewing")}
                >
                  Chuyển sang Phỏng vấn
                </Button>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
