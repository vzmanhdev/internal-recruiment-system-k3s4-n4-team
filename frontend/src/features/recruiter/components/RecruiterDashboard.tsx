"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Filter,
  Flame,
  Plus,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Video,
} from "lucide-react";
import { recruiterService } from "../services/recruiter.service";
import type { RecruiterOverviewData } from "../types/recruiter.types";
import { Spinner } from "@/components/ui/Spinner";

export function RecruiterDashboard() {
  const [data, setData] = useState<RecruiterOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const overview = await recruiterService.getOverview();
        setData(overview);
      } catch (err) {
        console.error("Failed to load recruiter overview:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm font-medium text-slate-500">Đang tải bảng điều khiển tuyển dụng...</p>
      </div>
    );
  }

  const metrics = data?.metrics ?? {
    active_jobs: 4,
    total_jobs: 4,
    new_applications: 1,
    interviewing: 1,
    hired_count: 1,
    total_referrals: 3,
    successful_referrals: 1,
  };

  const stages = data?.stages ?? {
    new: 1,
    screening: 1,
    interview: 1,
    offer: 1,
    hired: 1,
    rejected: 1,
  };

  const totalInPipeline = stages.new + stages.screening + stages.interview + stages.offer + stages.hired;

  const pipelineStages = [
    { key: "new", label: "Mới tiếp nhận", count: stages.new, color: "bg-blue-500", text: "text-blue-700" },
    { key: "screening", label: "Lọc hồ sơ", count: stages.screening, color: "bg-indigo-500", text: "text-indigo-700" },
    { key: "interview", label: "Phỏng vấn", count: stages.interview, color: "bg-amber-500", text: "text-amber-700" },
    { key: "offer", label: "Đề xuất Offer", count: stages.offer, color: "bg-purple-500", text: "text-purple-700" },
    { key: "hired", label: "Đã tuyển", count: stages.hired, color: "bg-emerald-500", text: "text-emerald-700" },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-blue-900/10">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur text-white">
              <Flame className="h-3.5 w-3.5 text-amber-300" />
              Chiến dịch Tuyển dụng Nội bộ Q4/2026
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight !text-white" style={{ color: '#FFFFFF' }}>
              Bảng Điều Khiển Nhân Sự Tuyển Dụng
            </h1>
            <p className="text-sm !text-blue-100 leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
              Theo dõi toàn diện phễu tuyển dụng, quản lý ứng viên, lịch phỏng vấn và chương trình giới thiệu nhân tài nội bộ theo thời gian thực.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/recruiter/jobs?action=create"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-blue-900 shadow-lg shadow-black/10 hover:bg-blue-50 transition-all active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 text-blue-600" />
              Đăng tin tuyển dụng mới
            </Link>
            <Link
              href="/recruiter/candidates"
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur border border-white/20 hover:bg-white/20 transition-all"
            >
              <UserCheck className="h-4 w-4" />
              Pipeline ứng viên
            </Link>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute right-48 -bottom-16 h-48 w-48 rounded-full bg-indigo-500/20 blur-2xl" />
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1 */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Vị trí đang mở
            </span>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <BriefcaseBusiness className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{metrics.active_jobs}</span>
            <span className="text-xs font-semibold text-slate-500">/ {metrics.total_jobs} vị trí</span>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>100% chỉ tiêu được niêm yết</span>
          </p>
        </div>

        {/* Metric 2 */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Hồ sơ mới nộp
            </span>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{metrics.new_applications}</span>
            <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              Cần xử lý
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Ưu tiên sàng lọc trong 24 giờ</p>
        </div>

        {/* Metric 3 */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Đang phỏng vấn
            </span>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
              <CalendarCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{metrics.interviewing}</span>
            <span className="text-xs font-medium text-slate-500">ứng viên</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Có lịch phỏng vấn tuần này</p>
        </div>

        {/* Metric 4 */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Đã trúng tuyển
            </span>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{metrics.hired_count}</span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              Thành công
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Đã nhận việc & chuyển khối</p>
        </div>
      </div>

      {/* Recruitment Pipeline Funnel Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Phễu Ứng Viên Hiện Tại (Recruitment Pipeline)</h2>
            <p className="text-xs text-slate-500">Tổng cộng {totalInPipeline} hồ sơ đang luân chuyển qua các giai đoạn</p>
          </div>
          <Link
            href="/recruiter/candidates"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            Mở bảng Kanban ATS
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {pipelineStages.map((stage) => {
            const pct = totalInPipeline > 0 ? Math.round((stage.count / totalInPipeline) * 100) : 0;
            return (
              <div key={stage.key} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">{stage.label}</span>
                  <span className={`text-xs font-bold ${stage.text}`}>{pct}%</span>
                </div>
                <p className="mt-2 text-2xl font-black text-slate-900">{stage.count}</p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className={`h-full rounded-full ${stage.color}`} style={{ width: `${Math.max(pct, 12)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2-Columns Section: Upcoming Interviews & Recent Candidates */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Interviews */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Lịch phỏng vấn sắp tới</h3>
                  <p className="text-xs text-slate-500">Danh sách các ca phỏng vấn đã xếp lịch</p>
                </div>
              </div>
              <Link
                href="/recruiter/interviews"
                className="text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                Xem tất cả
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {(data?.upcoming_interviews ?? []).length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">Chưa có lịch phỏng vấn nào sắp tới.</p>
              ) : (
                data?.upcoming_interviews.map((iv) => (
                  <div
                    key={iv.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">{iv.candidate_name}</span>
                        <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          {iv.format}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 truncate">{iv.job_title}</p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        <span>{iv.interview_date} lúc {iv.interview_time}</span>
                      </p>
                    </div>

                    <div className="shrink-0">
                      {iv.format === "Online" ? (
                        <a
                          href={iv.location_or_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                        >
                          <Video className="h-3.5 w-3.5" />
                          Vào phòng
                        </a>
                      ) : (
                        <span className="inline-block rounded-lg bg-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-700 truncate max-w-[140px]">
                          {iv.location_or_link}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <Link
              href="/recruiter/interviews"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <CalendarCheck className="h-4 w-4 text-blue-600" />
              Lên lịch phỏng vấn mới
            </Link>
          </div>
        </div>

        {/* Recent Applications & Urgency */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Ứng viên mới nộp gần đây</h3>
                  <p className="text-xs text-slate-500">Hồ sơ chờ HR phản hồi và sàng lọc</p>
                </div>
              </div>
              <Link
                href="/recruiter/candidates"
                className="text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                Xem chi tiết
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {(data?.recent_candidates ?? []).length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">Chưa có ứng viên mới.</p>
              ) : (
                data?.recent_candidates.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">{c.candidate_name}</span>
                        {c.is_internal ? (
                          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            Nội bộ
                          </span>
                        ) : (
                          <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                            Giới thiệu
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{c.candidate_email} • {c.candidate_phone}</p>
                      <p className="text-[11px] text-slate-400">
                        Nộp ngày: {c.created_at} {c.current_department ? `• ${c.current_department}` : ""}
                      </p>
                    </div>

                    <Link
                      href={`/recruiter/candidates?id=${c.id}`}
                      className="shrink-0 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                    >
                      Duyệt hồ sơ
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <Link
              href="/recruiter/referrals"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Users className="h-4 w-4 text-emerald-600" />
              Xem {metrics.total_referrals} hồ sơ Giới thiệu nhân tài nội bộ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
