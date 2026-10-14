'use client';

import React from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Calendar,
  FileCheck2,
  Clock,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Building2,
  MapPin,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { interviewService } from '@/services/interview.service';
import { offerService } from '@/services/offer.service';
import { careerApi } from '@/features/candidate/api';
import { useApiData } from '@/hooks/useApiData';
import { ErrorState, LoadingState } from '@/components/ui/DataStates';
import { useAuth } from '@/providers/auth-provider';

interface MyApplication {
  id: number; tracking_code: string; job_title: string | null; department: string | null; status: string;
  public_status: string; applied_date: string | null;
}
const pad = (n: number) => String(n).padStart(2, '0');

/** The signed-in applicant's own applications, interviews and offers (candidate views only) + open jobs. */
async function loadCandidateHome() {
  const [apps, interviews, offers, jobs] = await Promise.all([
    apiRequest<MyApplication[]>('/applications'),
    interviewService.getInterviews().catch(() => []),
    offerService.getOffers().catch(() => []),
    careerApi.list().catch(() => []),
  ]);
  const now = Date.now();
  const mine = interviews.filter((i) => i.is_own_application && i.status === 'scheduled' && new Date(i.scheduled_time).getTime() > now)
    .sort((x, y) => x.scheduled_time.localeCompare(y.scheduled_time));
  const pendingOffers = offers.filter((o) => o.status === 'sent');
  const nextDeadline = pendingOffers.map((o) => o.response_deadline).filter(Boolean).sort()[0] || null;
  return { apps, mine, offers, pendingOffers, nextDeadline, jobs: jobs.slice(0, 2), now };
}

export default function CandidateDashboardPage() {
  const { user } = useAuth();
  const { data: home, error, loading, reload } = useApiData(loadCandidateHome, []);
  if (loading) return <LoadingState />;
  if (error || !home) return <ErrorState error={error} onRetry={reload} />;

  const open = home.apps.filter((a) => a.public_status !== 'Kết thúc');
  const profileFields = [user?.full_name, user?.phone, user?.avatar_url, user?.job_title];
  const completeness = Math.round((profileFields.filter(Boolean).length / profileFields.length) * 100);
  const next = home.mine[0];
  const daysToDeadline = home.nextDeadline
    ? Math.max(0, Math.ceil((new Date(`${home.nextDeadline.slice(0, 10)}T23:59:59`).getTime() - home.now) / 86_400_000))
    : null;
  const quickStats = [
    {
      title: 'Hồ sơ đã nộp',
      value: String(home.apps.length),
      unit: 'vị trí',
      desc: `${open.length} hồ sơ đang trong quy trình xét duyệt`,
      icon: FileText,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Lịch phỏng vấn',
      value: String(home.mine.length),
      unit: 'buổi sắp tới',
      desc: next ? next.round_name : 'Chưa có lịch phỏng vấn',
      icon: Calendar,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    {
      title: 'Thư mời nhận việc (Offer)',
      value: String(home.pendingOffers.length),
      unit: 'đang chờ phản hồi',
      desc: daysToDeadline === null ? 'Không có thư mời chờ phản hồi' : `Hạn phản hồi: ${daysToDeadline} ngày tới`,
      icon: FileCheck2,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      title: 'Độ hoàn thiện hồ sơ',
      value: `${completeness}%`,
      unit: 'thông tin cá nhân',
      desc: completeness < 100 ? 'Cập nhật hồ sơ cá nhân để hoàn thiện' : 'Hồ sơ cá nhân đã đầy đủ',
      icon: Sparkles,
      color: 'bg-purple-50 text-purple-600 border-purple-100',
    },
  ];

  const ongoingApplications = open.map((a) => {
    const iv = home.mine.find((i) => i.application_id === a.id);
    const offer = home.offers.find((o) => o.application_id === a.id && o.status === 'sent');
    const at = iv ? new Date(iv.scheduled_time) : null;
    return {
      id: a.tracking_code,
      jobTitle: a.job_title || '',
      department: a.department || '',
      location: '',
      appliedDate: a.applied_date ? new Date(`${a.applied_date}T00:00:00`).toLocaleDateString('vi-VN') : '',
      stage: a.public_status,
      status: offer ? 'Đã nhận Offer' : 'Đang xử lý',
      statusColor: offer ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200',
      nextAction: offer
        ? 'Xem chi tiết thư mời nhận việc'
        : at ? `Lịch PV: ${pad(at.getHours())}:${pad(at.getMinutes())} ngày ${at.toLocaleDateString('vi-VN')}` : 'Chờ bộ phận tuyển dụng phản hồi',
    };
  });

  const featuredJobs = home.jobs.map((j) => ({
    id: j.slug || j.id,
    title: j.title,
    department: j.department,
    location: j.location,
    salary: j.salary,
    type: j.employmentType,
  }));

  return (
    <div className="space-y-8">
      {/* 1. Hero Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10">
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-blue-100 text-xs font-extrabold border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Chào mừng trở lại!</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
            Cổng Tra Cứu Tuyển Dụng & Hồ Sơ Ứng Viên
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-medium">
            Theo dõi tiến độ xét duyệt hồ sơ minh bạch, tham gia các buổi phỏng vấn trực tuyến và cập nhật cơ hội nghề nghiệp phù hợp với kỹ năng của bạn.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/candidate/jobs"
              className="px-4 py-2.5 rounded-xl bg-blue-500/30 hover:bg-blue-500/40 text-white font-extrabold text-xs flex items-center gap-2 transition-all border border-white/20 active:scale-95"
            >
              <Briefcase className="w-4 h-4" />
              <span>Xem vị trí đang tuyển</span>
            </Link>
            <Link
              href="/candidate/tracking"
              className="px-4 py-2.5 rounded-xl bg-blue-500/30 hover:bg-blue-500/40 text-white font-extrabold text-xs flex items-center gap-2 transition-all border border-white/20 active:scale-95"
            >
              <Clock className="w-4 h-4" />
              <span>Tra cứu hồ sơ của tôi</span>
            </Link>
          </div>
        </div>

        {/* Background decorative circles */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute right-24 -top-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
      </div>

      {/* 2. Quick KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-sm transition-shadow space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">{stat.title}</span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${stat.color}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</span>
                  <span className="text-xs font-semibold text-slate-500">{stat.unit}</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-1">{stat.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Hồ sơ đang xử lý (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-blue-600" />
              <span>Hồ sơ đang ứng tuyển</span>
            </h2>
            <Link
              href="/candidate/track"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Xem chi tiết</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {ongoingApplications.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:border-blue-200 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-slate-400 block">{app.id}</span>
                    <h3 className="font-extrabold text-sm text-slate-900">{app.jobTitle}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{[app.department, app.location].filter(Boolean).join(' • ')}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border self-start sm:self-auto ${app.statusColor}`}>
                    {app.status}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-1">
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    <span>Giai đoạn: <strong className="text-slate-800">{app.stage}</strong></span>
                  </div>
                  <div className="text-xs font-bold text-blue-600 bg-blue-50/80 px-3 py-1 rounded-lg">
                    {app.nextAction}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Vị trí mới nổi bật (1/3) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-amber-500" />
              <span>Cơ hội mới phù hợp</span>
            </h2>
            <Link
              href="/candidate/jobs"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {featuredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow space-y-2.5"
              >
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 line-clamp-1">{job.title}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{job.department}</p>
                </div>
                <div className="text-[11px] text-slate-500 space-y-1">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-blue-600">
                    <DollarSign className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>{job.salary}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    {job.type}
                  </span>
                  <Link
                    href={`/candidate/jobs/${job.id}`}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                  >
                    <span>Ứng tuyển</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
