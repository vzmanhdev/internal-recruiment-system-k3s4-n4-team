"use client";

import React from "react";
import { 
  X, Briefcase, MapPin, Clock, Building, Users, Calendar, 
  CheckCircle2, Sparkles, Send, ShieldCheck, ArrowRight, FileText, ChevronRight 
} from "lucide-react";
import type { Job } from "@/types/job";

interface JobDetailModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onApply: (job: Job) => void;
  isSaved?: boolean;
  onToggleSave?: (jobId: string) => void;
  isApplied?: boolean;
}

export function JobDetailModal({
  job,
  isOpen,
  onClose,
  onApply,
  isSaved = false,
  onToggleSave,
  isApplied = false,
}: JobDetailModalProps) {
  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-blue-50 via-sky-50 to-white p-6 sm:p-8 text-slate-900 border-b border-blue-100 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-700 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-blue-100/80 text-blue-800 text-xs font-bold rounded-full border border-blue-200 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-blue-600" />
              {job.department}
            </span>
            <span className="px-3 py-1 bg-emerald-100/80 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
              {job.employmentType}
            </span>
            <span className="px-3 py-1 bg-indigo-100/80 text-indigo-800 text-xs font-bold rounded-full border border-indigo-200">
              Tuyển dụng nội bộ
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight mb-2">
            {job.title}
          </h2>

          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600 font-medium">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>{job.openings}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Hạn nộp: {job.deadline}</span>
            </div>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 text-slate-700 text-sm leading-relaxed">
          {/* Summary Banner */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-900 text-sm mb-0.5">Cơ hội điều chuyển & phát triển nghề nghiệp nội bộ</div>
              <p className="text-xs text-slate-600">
                Ứng viên nội bộ được ưu tiên phỏng vấn rút gọn trong vòng 3 ngày làm việc và giữ nguyên các chế độ thâm niên hiện có.
              </p>
            </div>
          </div>

          {/* Job Overview */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-2.5 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Mô tả công việc & Vai trò chính</span>
            </h3>
            <p className="text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {job.description || "Chịu trách nhiệm thực hiện các mục tiêu chuyên môn của vị trí, phối hợp cùng các bộ phận liên quan để thúc đẩy tiến độ dự án và nâng cao hiệu quả vận hành tổ chức."}
            </p>
          </div>

          {/* Key Responsibilities */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-2.5 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Nhiệm vụ chính</span>
              </h3>
              <ul className="space-y-2">
                {job.responsibilities.map((resp, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 bg-slate-50/60 p-3 rounded-xl border border-slate-100/80">
                    <ChevronRight className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <span className="text-slate-700 font-medium">{resp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements & Skills */}
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-2.5 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Yêu cầu năng lực & Kỹ năng</span>
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {job.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl border border-blue-200/60"
                >
                  {skill}
                </span>
              ))}
            </div>
            {job.requirements && job.requirements.length > 0 && (
              <ul className="space-y-2">
                {job.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 bg-slate-50/60 p-3 rounded-xl border border-slate-100/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-slate-700 font-medium">{req}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Benefits declared on the posting (S4-02 AC1) — never hardcoded policy text */}
          {job.benefits && job.benefits.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60">
              <h4 className="font-bold text-amber-900 text-xs uppercase tracking-wider mb-2">Quyền lợi</h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-amber-900 font-medium">
                {job.benefits.map((b, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer / Actions */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4 shrink-0">
          <button
            onClick={() => onToggleSave && onToggleSave(job.id)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              isSaved
                ? "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <span>{isSaved ? "★ Đã lưu vị trí" : "☆ Lưu vị trí"}</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
            >
              Đóng
            </button>
            {isApplied ? (
              <span className="px-5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1.5 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Bạn đã nộp hồ sơ vị trí này</span>
              </span>
            ) : job.isExpired ? (
              <span className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                Tin tuyển dụng đã hết hạn nhận hồ sơ.
              </span>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onApply(job);
                }}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Ứng tuyển nội bộ ngay</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
