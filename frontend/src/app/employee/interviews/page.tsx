'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { EmployeeAppShell } from '@/components/layout/EmployeeAppShell';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Search,
  Filter,
  CheckCircle2,
  Users,
  ExternalLink,
  Copy,
  Check,
  Info,
  AlertCircle,
  X,
  User,
  Briefcase,
  Sparkles,
  Building,
  FileText,
  Phone,
  Mail,
  ChevronRight,
  ArrowRight,
  Share2,
} from 'lucide-react';
import clsx from 'clsx';
import { interviewService, type InterviewItem } from '@/services/interview.service';
import { openProtectedFile } from '@/services/file.service';
import { useApiData } from '@/hooks/useApiData';
import { ErrorState, LoadingState } from '@/components/ui/DataStates';
import { useAuth } from '@/providers/auth-provider';

export interface EmployeeInterview {
  id: string;
  roleType: 'interviewer' | 'referral' | 'internal_applicant';
  roleLabel: string;
  position: string;
  department: string;
  round: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  candidateAvatar?: string;
  dateStr: string;
  displayDate: string;
  timeRange: string;
  duration: string;
  status: 'today' | 'upcoming' | 'completed';
  statusLabel: string;
  format: 'online' | 'offline';
  meetUrl?: string;
  platform?: string;
  offlineRoom?: string;
  offlineAddress?: string;
  panelMembers: { name: string; title: string; isSelf?: boolean }[];
  note: string;
  cvFileName?: string;
  referralBonus?: string;
  cvUrl?: string | null;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** My interview sessions: as a panel member, and as an internal applicant (own application, limited view). */
function toEmployeeInterview(i: InterviewItem, myId: number | undefined, selfName: string, now: number): EmployeeInterview {
  const start = new Date(i.scheduled_time);
  const end = new Date(start.getTime() + i.duration_minutes * 60_000);
  const own = !!i.is_own_application;
  const done = i.status === 'completed' || i.status === 'cancelled' || end.getTime() < now;
  const isToday = start.toDateString() === new Date(now).toDateString();
  const status: EmployeeInterview['status'] = done ? 'completed' : isToday ? 'today' : 'upcoming';
  const panel = ((i.interviewers || []) as Array<{ interviewer_id: number; interviewer_name?: string | null; role_in_interview?: string }>)
    .map((x) => ({ name: x.interviewer_id === myId ? `${x.interviewer_name || 'Bạn'} (Bạn)` : x.interviewer_name || '—', title: x.role_in_interview || '', isSelf: x.interviewer_id === myId }));
  return {
    id: `IV-${i.id}`,
    roleType: own ? 'internal_applicant' : 'interviewer',
    roleLabel: own ? 'Bạn là ứng viên nội bộ' : 'Hội đồng phỏng vấn',
    position: i.job_title || '',
    department: '',
    round: i.round_name,
    candidateName: own ? selfName : i.candidate_name || '',
    candidateEmail: own ? '' : i.candidate_email || '',
    candidatePhone: '',
    dateStr: start.toISOString().slice(0, 10),
    displayDate: start.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }),
    timeRange: `${pad(start.getHours())}:${pad(start.getMinutes())} - ${pad(end.getHours())}:${pad(end.getMinutes())}`,
    duration: `${i.duration_minutes} phút`,
    status,
    statusLabel: i.status === 'cancelled' ? 'Đã hủy' : status === 'completed' ? 'Đã hoàn thành' : status === 'today' ? 'Hôm nay' : 'Sắp diễn ra',
    format: i.meeting_link ? 'online' : 'offline',
    meetUrl: i.meeting_link || undefined,
    platform: i.meeting_link ? 'trực tuyến' : undefined,
    offlineRoom: i.meeting_link ? undefined : i.location,
    offlineAddress: i.meeting_link ? undefined : '',
    panelMembers: panel,
    note: own ? 'Lịch phỏng vấn cho hồ sơ ứng tuyển nội bộ của bạn.' : i.my_evaluation_submitted ? 'Bạn đã nộp phiếu đánh giá cho buổi này.' : 'Bạn tham gia với vai trò người phỏng vấn — nhớ nộp phiếu đánh giá sau buổi phỏng vấn.',
    cvFileName: !own && i.cv_url ? i.cv_url.split('/').pop() : undefined,
    cvUrl: own ? null : i.cv_url || null,
  };
}

export default function EmployeeInterviewsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'referrals' | 'completed'>('all');
  const [formatFilter, setFormatFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [selectedInterview, setSelectedInterview] = useState<EmployeeInterview | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const { user } = useAuth();
  const { data, error, loading, reload } = useApiData(async () => {
    const [mine, all] = await Promise.all([
      interviewService.getMine(),
      interviewService.getInterviews(),
    ]);
    const rows = [...mine, ...all.filter((i) => i.is_own_application && !mine.some((m) => m.id === i.id))];
    return { rows, now: Date.now() };
  }, []);
  const interviews = useMemo(
    () => (data?.rows || []).map((i) => toEmployeeInterview(i, user?.id, user?.full_name || 'Bạn', data?.now || 0))
      .sort((x, y) => x.dateStr.localeCompare(y.dateStr)),
    [data, user?.id, user?.full_name],
  );

  const stats = useMemo(() => {
    return {
      total: interviews.length,
      upcoming: interviews.filter((i) => i.status === 'upcoming' || i.status === 'today').length,
      referrals: interviews.filter((i) => i.roleType === 'referral').length,
      online: interviews.filter((i) => i.format === 'online').length,
    };
  }, [interviews]);

  const filteredInterviews = useMemo(() => {
    return interviews.filter((item) => {
      // Tab filter
      if (activeTab === 'upcoming' && item.status !== 'upcoming' && item.status !== 'today') return false;
      if (activeTab === 'referrals' && item.roleType !== 'referral') return false;
      if (activeTab === 'completed' && item.status !== 'completed') return false;

      // Format filter
      if (formatFilter !== 'all' && item.format !== formatFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = item.candidateName.toLowerCase().includes(query);
        const matchPos = item.position.toLowerCase().includes(query);
        const matchDept = item.department.toLowerCase().includes(query);
        const matchRound = item.round.toLowerCase().includes(query);
        if (!matchName && !matchPos && !matchDept && !matchRound) return false;
      }

      return true;
    });
  }, [interviews, activeTab, formatFilter, searchQuery]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Đã sao chép liên kết vào clipboard!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  if (loading) return <EmployeeAppShell activeTab="interviews"><LoadingState /></EmployeeAppShell>;
  if (error) return <EmployeeAppShell activeTab="interviews"><ErrorState error={error} onRetry={reload} /></EmployeeAppShell>;

  return (
    <EmployeeAppShell activeTab="interviews">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="space-y-6 w-full pb-10">
        {/* 1. TOP HERO BANNER */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 md:p-8 text-white shadow-lg">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-bold border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Không gian Lịch Phỏng Vấn Nội Bộ</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Lịch Phỏng Vấn & Đánh Giá Tuyển Dụng
              </h1>
              <p className="text-blue-100 text-xs md:text-sm font-normal leading-relaxed">
                Theo dõi toàn diện các phiên phỏng vấn với vai trò thành viên Hội đồng đánh giá, tiến độ phỏng vấn của ứng viên được giới thiệu và lịch ứng tuyển nội bộ của bạn.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/employee/referrals"
                className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all border border-white/30 flex items-center gap-2 backdrop-blur-sm"
              >
                <Users className="w-4 h-4" />
                <span>Ứng viên giới thiệu</span>
              </Link>
              <Link
                href="/employee/jobs"
                className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all border border-white/30 flex items-center gap-2 backdrop-blur-sm"
              >
                <Briefcase className="w-4 h-4" />
                <span>Vị trí đang tuyển</span>
              </Link>
            </div>
          </div>

          {/* Background Decorative Circles */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* 2. STATS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">{stats.total}</div>
              <div className="text-xs text-slate-500 font-medium">Tổng lịch phỏng vấn</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">{stats.upcoming}</div>
              <div className="text-xs text-slate-500 font-medium">Lịch sắp tới</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">{stats.referrals}</div>
              <div className="text-xs text-slate-500 font-medium">Ứng viên đã giới thiệu</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">{stats.online}</div>
              <div className="text-xs text-slate-500 font-medium">Phỏng vấn Trực tuyến</div>
            </div>
          </div>
        </div>

        {/* 3. FILTER & SEARCH CONTROLS */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Tab navigation */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              <button
                onClick={() => setActiveTab('all')}
                className={clsx(
                  'px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
                  activeTab === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                Tất cả ({interviews.length})
              </button>
              <button
                onClick={() => setActiveTab('upcoming')}
                className={clsx(
                  'px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
                  activeTab === 'upcoming'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                Sắp tới ({stats.upcoming})
              </button>
              <button
                onClick={() => setActiveTab('referrals')}
                className={clsx(
                  'px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
                  activeTab === 'referrals'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                Ứng viên giới thiệu ({stats.referrals})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={clsx(
                  'px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
                  activeTab === 'completed'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                Đã hoàn thành ({interviews.length - stats.upcoming})
              </button>
            </div>

            {/* Format & Search controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Format Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
                <button
                  onClick={() => setFormatFilter('all')}
                  className={clsx(
                    'px-2.5 py-1.5 rounded-lg transition-all cursor-pointer',
                    formatFilter === 'all' ? 'bg-white font-bold text-slate-800 shadow-xs' : 'text-slate-500'
                  )}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setFormatFilter('online')}
                  className={clsx(
                    'px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer',
                    formatFilter === 'online' ? 'bg-white font-bold text-slate-800 shadow-xs' : 'text-slate-500'
                  )}
                >
                  <Video className="w-3 h-3 text-blue-600" />
                  <span>Online</span>
                </button>
                <button
                  onClick={() => setFormatFilter('offline')}
                  className={clsx(
                    'px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer',
                    formatFilter === 'offline' ? 'bg-white font-bold text-slate-800 shadow-xs' : 'text-slate-500'
                  )}
                >
                  <MapPin className="w-3 h-3 text-amber-600" />
                  <span>Trực tiếp</span>
                </button>
              </div>

              {/* Search Box */}
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm ứng viên, vị trí, vòng PV..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. INTERVIEWS GRID */}
        {filteredInterviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
            {filteredInterviews.map((item) => {
              const isOnline = item.format === 'online';
              const isCompleted = item.status === 'completed';

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col p-5 relative group"
                >
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={clsx(
                        'text-[11px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5',
                        item.roleType === 'interviewer' && 'bg-blue-50 text-blue-700 border-blue-200',
                        item.roleType === 'referral' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                        item.roleType === 'internal_applicant' && 'bg-purple-50 text-purple-700 border-purple-200'
                      )}
                    >
                      {item.roleType === 'interviewer' && <Briefcase className="w-3 h-3 text-blue-600" />}
                      {item.roleType === 'referral' && <Users className="w-3 h-3 text-emerald-600" />}
                      {item.roleType === 'internal_applicant' && <User className="w-3 h-3 text-purple-600" />}
                      {item.roleLabel}
                    </span>

                    <span
                      className={clsx(
                        'text-[11px] font-bold px-2 py-0.5 rounded-full',
                        isCompleted
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-amber-100 text-amber-800'
                      )}
                    >
                      {item.statusLabel}
                    </span>
                  </div>

                  {/* Position Title & Department */}
                  <div className="mb-3">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {item.position}
                    </h3>
                    <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.department}</span>
                    </div>
                  </div>

                  {/* Candidate / Self Box */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 mb-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500">Ứng viên:</span>
                      <span className="font-bold text-slate-900">{item.candidateName}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500">Vòng đánh giá:</span>
                      <span className="font-medium text-slate-800 text-right truncate max-w-[180px]">{item.round}</span>
                    </div>
                    {item.referralBonus && (
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                        <span className="font-semibold text-emerald-600">Thưởng Referral:</span>
                        <span className="font-bold text-emerald-700">{item.referralBonus}</span>
                      </div>
                    )}
                  </div>

                  {/* Date, Time & Format */}
                  <div className="space-y-2 text-xs text-slate-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="font-bold text-slate-800">{item.displayDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{item.timeRange}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 font-medium">{item.duration}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      {isOnline ? (
                        <>
                          <Video className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                          <div className="flex-1 flex items-center justify-between">
                            <span className="font-medium text-indigo-700">Online ({item.platform})</span>
                            {item.meetUrl && (
                              <button
                                onClick={() => copyToClipboard(item.meetUrl!, item.id)}
                                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                                title="Sao chép link họp"
                              >
                                {copiedId === item.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-600">Đã copy</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy link</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <div className="font-medium text-slate-700 leading-snug">
                            {item.offlineRoom}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Council Member Avatars */}
                  <div className="mb-4 pt-3 border-t border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      <span>Hội đồng đánh giá ({item.panelMembers.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.panelMembers.map((member, idx) => (
                        <span
                          key={idx}
                          className={clsx(
                            'text-[10px] font-medium px-2 py-0.5 rounded-md border',
                            member.isSelf
                              ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          )}
                        >
                          {member.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions in Card Footer */}
                  <div className="mt-auto pt-3 border-t border-slate-100 flex items-center gap-2">
                    {isOnline && item.meetUrl && !isCompleted ? (
                      <a
                        href={item.meetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/20"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Vào phòng</span>
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </a>
                    ) : null}

                    <button
                      onClick={() => setSelectedInterview(item)}
                      className={clsx(
                        'py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer border',
                        isOnline && item.meetUrl && !isCompleted
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-transparent'
                          : 'flex-1 bg-blue-600 hover:bg-blue-700 text-white border-transparent shadow-sm'
                      )}
                    >
                      <span>Xem chi tiết</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">
              Không tìm thấy lịch phỏng vấn phù hợp
            </h3>
            <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto">
              Không có buổi phỏng vấn nào khớp với bộ lọc hoặc từ khóa tìm kiếm hiện tại của bạn.
            </p>
            <button
              onClick={() => {
                setActiveTab('all');
                setFormatFilter('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        )}

        {/* 5. HELPFUL GUIDELINES FOR EMPLOYEES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Box 1 */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 rounded-2xl p-5 border border-blue-100 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-slate-900">Dành cho Thành viên Hội đồng phỏng vấn</h4>
              <p className="text-slate-600 leading-relaxed">
                Vui lòng xem trước CV và tiêu chí đánh giá kỹ năng của ứng viên trước giờ phỏng vấn 15 phút. Bạn có thể ghi chú và chấm điểm sau buổi trao đổi.
              </p>
            </div>
          </div>

          {/* Box 2 */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 rounded-2xl p-5 border border-emerald-100 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-slate-900">Tiến độ Ứng viên được bạn giới thiệu</h4>
              <p className="text-slate-600 leading-relaxed">
                Bạn có thể đồng hành, động viên ứng viên tự tin tham gia phỏng vấn. Hệ thống sẽ tự động cập nhật kết quả và thông báo tiền thưởng Referral cho bạn!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: INTERVIEW DETAILS */}
      {selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 md:p-8 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 mb-2">
                  {selectedInterview.roleLabel}
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 leading-snug">
                  {selectedInterview.position}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {selectedInterview.department} • Mã: {selectedInterview.id}
                </p>
              </div>

              <button
                onClick={() => setSelectedInterview(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Info */}
            <div className="space-y-4 text-xs">
              {/* Candidate Info */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>Thông tin ứng viên</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 pt-1">
                  <div>
                    <span className="font-medium text-slate-400 block text-[11px]">Họ và tên:</span>
                    <span className="font-bold text-slate-800">{selectedInterview.candidateName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-400 block text-[11px]">Email liên hệ:</span>
                    <span className="font-semibold text-slate-800">{selectedInterview.candidateEmail}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-400 block text-[11px]">Số điện thoại:</span>
                    <span className="font-semibold text-slate-800">{selectedInterview.candidatePhone}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-400 block text-[11px]">Vòng đánh giá:</span>
                    <span className="font-semibold text-blue-700">{selectedInterview.round}</span>
                  </div>
                </div>

                {selectedInterview.cvFileName && (
                  <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Hồ sơ CV đính kèm:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => selectedInterview.cvUrl && openProtectedFile(selectedInterview.cvUrl).catch(() => showToast('Không mở được CV.'))}
                      className="font-bold text-blue-600 underline cursor-pointer"
                    >
                      {selectedInterview.cvFileName}
                    </button>
                  </div>
                )}
              </div>

              {/* Time & Venue */}
              <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 space-y-2.5">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Thời gian & Hình thức phỏng vấn</span>
                </div>

                <div className="space-y-1.5 text-slate-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-bold">{selectedInterview.displayDate}</span>
                    <span className="text-slate-400">•</span>
                    <span>{selectedInterview.timeRange}</span>
                    <span className="text-slate-500 font-medium">({selectedInterview.duration})</span>
                  </div>

                  {selectedInterview.format === 'online' ? (
                    <div className="pt-2 border-t border-blue-100 space-y-2">
                      <div className="flex items-center gap-2 text-indigo-700 font-bold">
                        <Video className="w-4 h-4 shrink-0" />
                        <span>Phỏng vấn Trực tuyến qua {selectedInterview.platform}</span>
                      </div>
                      {selectedInterview.meetUrl && (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={selectedInterview.meetUrl}
                            className="flex-1 bg-white border border-blue-200 rounded-xl px-3 py-1.5 text-xs text-blue-700 select-all"
                          />
                          <button
                            onClick={() => copyToClipboard(selectedInterview.meetUrl!, 'modal')}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-blue-100 space-y-1">
                      <div className="flex items-center gap-2 text-amber-700 font-bold">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span>Phỏng vấn Trực tiếp tại văn phòng</span>
                      </div>
                      <div className="text-slate-700 pl-6 space-y-0.5">
                        <p className="font-semibold">{selectedInterview.offlineRoom}</p>
                        <p className="text-slate-500">{selectedInterview.offlineAddress}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Panel Members */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Thành viên Hội đồng phỏng vấn</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  {selectedInterview.panelMembers.map((member, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className={clsx('font-semibold', member.isSelf ? 'text-blue-700' : 'text-slate-800')}>
                        {member.name} {member.isSelf && '(Bạn)'}
                      </span>
                      <span className="text-slate-500">{member.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Note */}
              {selectedInterview.note && (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-900 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed font-medium">
                    <strong className="font-bold block mb-0.5">Lưu ý quan trọng:</strong>
                    {selectedInterview.note}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedInterview(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
              >
                Đóng
              </button>

              {selectedInterview.format === 'online' && selectedInterview.meetUrl && (
                <a
                  href={selectedInterview.meetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
                >
                  <Video className="w-4 h-4" />
                  <span>Tham gia phỏng vấn</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </EmployeeAppShell>
  );
}
