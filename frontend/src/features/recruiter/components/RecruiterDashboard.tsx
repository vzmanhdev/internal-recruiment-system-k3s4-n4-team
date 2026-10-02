"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  FileSpreadsheet,
  Kanban,
  Mail,
  Plus,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { recruiterService } from "../services/recruiter.service";

export function RecruiterDashboard() {
  const summary = recruiterService.getMetricsSummary();
  const candidates = recruiterService.getCandidates();
  const interviews = recruiterService.getInterviews();
  const offers = recruiterService.getOffers();
  const jobs = recruiterService.getJobPostings();

  // SLA Overdue candidates
  const overdueCandidates = candidates.filter((c) => c.slaOverdue);

  // Upcoming interviews
  const upcomingInterviews = interviews.filter((i) => i.status === "scheduled").slice(0, 3);

  // Stage distribution
  const stagesCount = {
    new_applied: candidates.filter((c) => c.stage === "new_applied").length,
    screening: candidates.filter((c) => c.stage === "screening").length,
    interviewing: candidates.filter((c) => c.stage === "interviewing").length,
    offer_proposed: candidates.filter((c) => c.stage === "offer_proposed").length,
    hired: candidates.filter((c) => c.stage === "hired").length,
    rejected: candidates.filter((c) => c.stage === "rejected").length,
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Welcome */}
      <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Bàn làm việc Nhân viên Tuyển dụng — Phong</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Chào mừng trở lại, Phong!
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-blue-100 leading-relaxed">
              Hôm nay hệ thống có <strong className="text-white">{summary.newAppliedCount} hồ sơ mới</strong> cần sàng lọc và{" "}
              <strong className="text-white">{summary.interviewsTodayCount} buổi phỏng vấn</strong> cần điều phối.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/recruiter/pipeline"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-blue-700 shadow-md hover:bg-blue-50 transition-all"
            >
              <Kanban className="h-4 w-4" />
              Vào Bảng Pipeline
            </Link>
          </div>
        </div>

        {/* Decorative circle */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* 6 Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Vị trí mở</span>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600">
              <Briefcase className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{summary.activeJobsCount}</p>
          <p className="mt-1 text-[11px] text-emerald-600 font-semibold">Đang nhận CV</p>
        </div>

        {/* Card 2 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Tổng ứng viên</span>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{summary.totalCandidatesCount}</p>
          <p className="mt-1 text-[11px] text-slate-400">Trong toàn hệ thống</p>
        </div>

        {/* Card 3 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Hồ sơ mới</span>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-100 text-blue-700">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-blue-700">{summary.newAppliedCount}</p>
          <p className="mt-1 text-[11px] text-blue-600 font-semibold">Cần duyệt ngay</p>
        </div>

        {/* Card 4 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Phỏng vấn</span>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
              <Calendar className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{interviews.length}</p>
          <p className="mt-1 text-[11px] text-emerald-600 font-semibold">{summary.interviewsTodayCount} buổi hôm nay</p>
        </div>

        {/* Card 5 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Offer chờ</span>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-purple-50 text-purple-600">
              <FileCheck className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{summary.offersPendingCount}</p>
          <p className="mt-1 text-[11px] text-purple-600 font-semibold">Đang thương lượng</p>
        </div>

        {/* Card 6 */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900">Trễ hạn SLA</span>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-100 text-amber-700">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-amber-800">{summary.slaOverdueCount}</p>
          <p className="mt-1 text-[11px] text-amber-700 font-semibold">Cần xử lý gấp</p>
        </div>
      </div>

      {/* Main Grid: SLA Warnings & Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Overdue SLA & Actions (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* SLA Alerts Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-100 text-amber-700">
                  <AlertCircle className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Cảnh báo hồ sơ quá hạn SLA (S5-10)</h3>
                  <p className="text-xs text-slate-400">Các hồ sơ nằm ở một giai đoạn quá 3 ngày làm việc chưa được cập nhật</p>
                </div>
              </div>
              <Link
                href="/recruiter/pipeline"
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                Mở Pipeline <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {overdueCandidates.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                Tuyệt vời! Không có hồ sơ nào bị trễ hạn SLA.
              </p>
            ) : (
              <div className="space-y-2.5">
                {overdueCandidates.map((cand) => (
                  <div
                    key={cand.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/40 p-3.5 transition-all hover:bg-amber-50"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{cand.fullName}</span>
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">
                          {cand.slaDaysInCurrentStage} ngày trễ
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {cand.jobTitle} · Giai đoạn hiện tại: <strong>{cand.stage}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href="/recruiter/pipeline"
                        className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        Xử lý ngay
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recruitment Funnel Breakdown */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600">
                  <TrendingUp className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Phễu chuyển đổi tuyển dụng VinaTech</h3>
                  <p className="text-xs text-slate-400">Số lượng ứng viên phân bố qua từng giai đoạn phễu</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {[
                { label: "1. Hồ sơ mới nộp", count: stagesCount.new_applied, color: "bg-blue-500" },
                { label: "2. Đang sàng lọc", count: stagesCount.screening, color: "bg-indigo-500" },
                { label: "3. Tham gia phỏng vấn", count: stagesCount.interviewing, color: "bg-amber-500" },
                { label: "4. Soạn thảo đề xuất Offer", count: stagesCount.offer_proposed, color: "bg-purple-500" },
                { label: "5. Đồng ý nhận việc (Hired)", count: stagesCount.hired, color: "bg-emerald-500" },
                { label: "6. Hồ sơ bị loại", count: stagesCount.rejected, color: "bg-red-400" },
              ].map((item) => {
                const total = candidates.length || 1;
                const percent = Math.round((item.count / total) * 100);
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">{item.label}</span>
                      <span className="font-bold text-slate-900">
                        {item.count} ứng viên ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all duration-500`}
                        style={{ width: `${Math.max(percent, item.count > 0 ? 5 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming Interviews & Quick Links (1 col) */}
        <div className="space-y-6">
          {/* Upcoming Interviews Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-slate-900">Lịch phỏng vấn sắp tới</h3>
              <Link href="/recruiter/interviews" className="text-xs font-bold text-blue-600 hover:underline">
                Xem tất cả
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingInterviews.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center italic">
                  Chưa có lịch phỏng vấn nào sắp tới.
                </p>
              ) : (
                upcomingInterviews.map((iv) => (
                  <div
                    key={iv.id}
                    className="rounded-xl border border-slate-200 p-3 space-y-2 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{iv.candidateName}</h4>
                        <p className="text-[11px] text-slate-500">{iv.jobTitle}</p>
                      </div>
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                        {iv.round.split("-")[0].trim()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-600">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>{new Date(iv.scheduledAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })} ({iv.durationMinutes}p)</span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                        {iv.locationOrLink}
                      </span>
                      {iv.format === "online" && (
                        <a
                          href={iv.locationOrLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                        >
                          <Video className="h-3 w-3" />
                          Vào phòng
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions Shortcuts */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900">Lối tắt nghiệp vụ</h3>
            <div className="space-y-2">
              <Link
                href="/recruiter/pipeline"
                className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Kanban className="h-4 w-4 text-blue-600" />
                  <span>Mở Bảng Kanban Pipeline</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>

              <Link
                href="/recruiter/jobs"
                className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Briefcase className="h-4 w-4 text-emerald-600" />
                  <span>Soạn tin từ Yêu cầu đã duyệt</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>

              <Link
                href="/recruiter/communications"
                className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-purple-600" />
                  <span>Gửi thư hàng loạt & Nhật ký email</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
