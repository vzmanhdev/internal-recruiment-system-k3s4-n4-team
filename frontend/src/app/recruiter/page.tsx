'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Calendar,
  FileText,
  Mail,
  Kanban,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  ChevronRight,
  Sparkles,
  Award,
} from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { STAGE_LABEL, type ApiApplication } from '@/features/candidates/api';
import { interviewService } from '@/services/interview.service';
import { offerService } from '@/services/offer.service';
import { useApiData } from '@/hooks/useApiData';
import { ErrorState, LoadingState } from '@/components/ui/DataStates';
import { useAuth } from '@/providers/auth-provider';

const DAY_MS = 86_400_000;
const OPEN = new Set(['submitted', 'screening', 'interviewing', 'offered']);
const pad = (n: number) => String(n).padStart(2, '0');
const hm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Everything the overview shows, computed from the recruiter's scoped data. */
async function loadOverview() {
  const [apps, interviews, offers] = await Promise.all([
    apiRequest<Array<ApiApplication & { stage_entered_at?: string | null }>>('/applications'),
    interviewService.getInterviews(),
    offerService.getOffers().catch(() => []),
  ]);
  const now = Date.now();
  const today = new Date(now).toDateString();
  const weekAgo = now - 7 * DAY_MS;
  const open = apps.filter((a) => OPEN.has(a.status));
  const daysIn = (a: { stage_entered_at?: string | null; created_at?: string | null }) => {
    const t = a.stage_entered_at || a.created_at;
    return t ? Math.floor((now - new Date(t).getTime()) / DAY_MS) : 0;
  };
  const newThisWeek = apps.filter((a) => a.created_at && new Date(a.created_at).getTime() >= weekAgo).length;
  const newCount = apps.filter((a) => a.status === 'submitted').length;
  const screening = apps.filter((a) => a.status === 'screening').length;
  const upcoming = interviews.filter((i) => i.status === 'scheduled');
  const weekEnd = now + 7 * DAY_MS;
  const thisWeek = upcoming.filter((i) => { const t = new Date(i.scheduled_time).getTime(); return t >= now - DAY_MS && t <= weekEnd; });
  const todayRows = upcoming.filter((i) => new Date(i.scheduled_time).toDateString() === today)
    .sort((x, y) => x.scheduled_time.localeCompare(y.scheduled_time));
  const answered = offers.filter((o) => ['accepted', 'declined', 'expired'].includes(o.status));
  const accepted = answered.filter((o) => o.status === 'accepted').length;
  return {
    newCount, newThisWeek, openCount: open.length, screening,
    weekInterviews: thisWeek.length,
    acceptRate: answered.length ? `${((accepted / answered.length) * 100).toFixed(1)}%` : '—',
    answeredOffers: answered.length,
    urgent: [...open].sort((a, b) => daysIn(b) - daysIn(a)).slice(0, 4).map((a) => ({
      id: String(a.id), name: a.full_name, position: a.job_title || '', stage: STAGE_LABEL[a.status] || a.status,
      slaHours: `${daysIn(a)} ngày ở giai đoạn này`, matchScore: Math.round(a.match_score ?? 0), source: a.source || 'Không rõ', avatar: '',
    })),
    today: todayRows.map((i) => {
      const start = new Date(i.scheduled_time);
      const end = new Date(start.getTime() + i.duration_minutes * 60_000);
      const panel = (i.interviewers || []) as Array<{ interviewer_name?: string | null }>;
      return {
        time: `${hm(start)} - ${hm(end)}`, candidate: i.candidate_name || '', position: i.job_title || '', round: i.round_name,
        interviewer: panel.map((x) => x.interviewer_name).filter(Boolean).join(', ') || '—',
        status: i.candidate_response === 'confirmed' ? 'Đã xác nhận' : i.candidate_response === 'reschedule_requested' ? 'Xin đổi lịch' : 'Chờ xác nhận',
      };
    }),
  };
}

export default function RecruiterOverviewPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const { user } = useAuth();
  const { data: ov, error, loading, reload } = useApiData(loadOverview, []);
  if (loading) return <LoadingState />;
  if (error || !ov) return <ErrorState error={error} onRetry={reload} />;

  // 4 KPI Stats Cards
  const stats = [
    {
      label: 'CV Mới Tiếp Nhận',
      value: String(ov.newCount),
      change: `${ov.newThisWeek} hồ sơ trong 7 ngày qua`,
      trend: 'up',
      icon: Users,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      label: 'Đang Trong Pipeline',
      value: String(ov.openCount),
      change: `${ov.screening} đang sàng lọc`,
      trend: 'neutral',
      icon: Kanban,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    },
    {
      label: 'Lịch Phỏng Vấn Tuần',
      value: String(ov.weekInterviews),
      change: `${ov.today.length} lịch hôm nay`,
      trend: 'up',
      icon: Calendar,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    {
      label: 'Tỷ Lệ Nhận Offer',
      value: ov.acceptRate,
      change: `trên ${ov.answeredOffers} offer đã có phản hồi`,
      trend: 'up',
      icon: Award,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
  ];

  // Open applications that have waited longest in their current stage
  const urgentCandidates = ov.urgent;

  // Today's interviews
  const todayInterviews = ov.today;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[10px] uppercase tracking-wider">
              Recruiter Control Center
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Xin chào, {user?.full_name || 'bạn'}! 👋
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Hôm nay bạn có <strong className="text-slate-800">{ov.newCount} ứng viên mới</strong> cần sàng lọc và <strong className="text-slate-800">{ov.today.length} buổi phỏng vấn</strong> được xếp lịch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/recruiter/pipeline"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Kanban className="w-4 h-4" />
            <span>Mở Kanban Pipeline</span>
          </Link>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{stat.label}</span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold border ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</div>
                <div className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{stat.change}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column (2/3): Urgent Candidates List */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Hồ Sơ Cần Xử Lý Gấp (SLA Cảnh Báo)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Các ứng viên sắp quá thời hạn phản hồi quy định (SLA 24h - 48h)
              </p>
            </div>
            <Link
              href="/recruiter/pipeline"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Xem tất cả trên Pipeline</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {urgentCandidates.map((cand) => (
              <div
                key={cand.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  {cand.avatar ? (
                    <img
                      src={cand.avatar}
                      alt={cand.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-sky-100 text-[#0284C7] font-extrabold text-sm flex items-center justify-center border border-sky-200 shrink-0 select-none">
                      {(cand.name || "U").trim().split(" ").slice(-1)[0][0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-slate-900">{cand.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">({cand.id})</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[10px] border border-emerald-100">
                        {cand.matchScore}% Match
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {cand.position} &bull; Nguồn: {cand.source}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold block">
                      {cand.stage}
                    </span>
                    <span className="text-[10px] font-bold text-rose-600 flex items-center justify-end gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{cand.slaHours}</span>
                    </span>
                  </div>

                  <Link
                    href={`/recruiter/candidates/${cand.id}`}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                  >
                    Xử lý
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (1/3): Today's Schedule & Funnel Summary */}
        <div className="space-y-6">
          {/* Today's Interviews Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Lịch Phỏng Vấn Hôm Nay</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[10px]">
                {todayInterviews.length} Lịch
              </span>
            </div>

            <div className="space-y-3">
              {todayInterviews.map((iv, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span className="text-blue-600">{iv.time}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {iv.status}
                    </span>
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-slate-900">{iv.candidate}</div>
                    <div className="text-[11px] text-slate-500">{iv.position}</div>
                  </div>
                  <div className="pt-1 border-t border-slate-200/60 text-[10px] text-slate-500 flex items-center justify-between">
                    <span>{iv.round}</span>
                    <span className="font-semibold text-slate-700">PV: {iv.interviewer}</span>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/recruiter/interviews"
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold text-center block transition-colors"
            >
              Xem toàn bộ lịch phỏng vấn &rarr;
            </Link>
          </div>

          {/* Pipeline Conversion Widget */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-md p-6 text-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-100 uppercase tracking-wider">
                Hiệu suất tuần
              </span>
              <Sparkles className="w-4 h-4 text-yellow-300" />
            </div>
            <div className="text-xl font-black">{ov.openCount} Ứng viên đang điều phối</div>
            <p className="text-xs text-blue-100/90 leading-relaxed font-medium">
              {ov.newThisWeek} hồ sơ mới trong 7 ngày qua · {ov.weekInterviews} buổi phỏng vấn trong tuần.
            </p>
            <div className="pt-2">
              <Link
                href="/recruiter/pipeline"
                className="w-full py-2.5 px-4 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-extrabold text-xs text-center block transition-all shadow-xs"
              >
                Mở Bảng Điều Phối Kanban &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
