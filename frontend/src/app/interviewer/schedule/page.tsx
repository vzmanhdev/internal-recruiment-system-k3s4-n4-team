'use client';

import React, { useState, useMemo } from 'react';
import { interviewerApi } from '@/features/interviewer/api';
import { type InterviewItem as ApiInterview } from '@/services/interview.service';
import { referralService } from '@/services/referral.service';
import { useApiData } from '@/hooks/useApiData';
import { useAuth } from '@/providers/auth-provider';
import { ErrorState, LoadingState } from '@/components/ui/DataStates';
import { ApiError } from '@/lib/api-client';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Search,
  Filter,
  Eye,
  ChevronRight,
  User,
  Users,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileText,
  Star,
  Award,
  ShieldCheck,
  Info,
  X,
  Check,
  Send,
  Building,
  Briefcase,
  Copy,
  Download,
} from 'lucide-react';
import clsx from 'clsx';

// Interface kiểu dữ liệu buổi phỏng vấn
export interface InterviewScheduleItem {
  id: number;
  interviewId: number;
  applicationId: number;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  position: string;
  department: string;
  round: string;
  dateStr: string; // VD: 2026-10-12
  displayDate: string; // VD: 12/10/2026
  timeRange: string; // VD: 14:00 - 15:00
  relativeTimeTag: 'Hôm nay' | 'Ngày mai' | 'Sắp tới' | 'Đã kết thúc';
  format: 'online' | 'offline';
  meetingPlatform?: string;
  meetingUrl?: string;
  offlineRoom?: string;
  offlineAddress?: string;
  councilMembers: { name: string; role: string; isCurrentUser?: boolean }[];
  status: 'in_progress' | 'upcoming' | 'completed_pending_scorecard' | 'completed_evaluated';
  scorecardSubmitted: boolean;
  scorecardScore?: number; // 1-5
  cvSummary: {
    experienceYears: string;
    currentCompany: string;
    education: string;
    skills: string[];
    summaryBio: string;
  };
}

/** Map my real interviews (GET /interviews?mine=true) onto the schedule cards. */
function toScheduleItem(i: ApiInterview, me: number | undefined): InterviewScheduleItem {
  const start = new Date(i.scheduled_time);
  const end = new Date(start.getTime() + (i.duration_minutes || 60) * 60000);
  const now = Date.now();
  const hm = (d: Date) => d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const today = new Date().toDateString();
  const tomorrow = new Date(Date.now() + 86_400_000).toDateString();
  const finished = end.getTime() < now || i.status === "completed";
  const running = !finished && start.getTime() <= now;
  const relative: InterviewScheduleItem["relativeTimeTag"] = finished ? "Đã kết thúc"
    : start.toDateString() === today ? "Hôm nay" : start.toDateString() === tomorrow ? "Ngày mai" : "Sắp tới";
  return {
    id: i.id,
    interviewId: i.id,
    applicationId: i.application_id,
    candidateName: i.candidate_name || "—",
    candidateEmail: i.candidate_email || "",
    candidatePhone: "",
    position: i.job_title || "",
    department: "",
    round: i.round_name || `Vòng ${i.round_number}`,
    dateStr: i.scheduled_time.slice(0, 10),
    displayDate: start.toLocaleDateString("vi-VN"),
    timeRange: `${hm(start)} - ${hm(end)}`,
    relativeTimeTag: relative,
    format: i.meeting_link ? "online" : "offline",
    meetingPlatform: i.meeting_link ? "Trực tuyến" : undefined,
    meetingUrl: i.meeting_link || undefined,
    offlineRoom: i.meeting_link ? undefined : i.location || undefined,
    offlineAddress: undefined,
    councilMembers: (i.interviewers || []).map((x: { interviewer_id?: number; interviewer_name?: string; role_in_interview?: string }) => ({
      name: x.interviewer_name || "—", role: x.role_in_interview || "", isCurrentUser: x.interviewer_id === me,
    })),
    status: running ? "in_progress" : !finished ? "upcoming" : i.my_evaluation_submitted ? "completed_evaluated" : "completed_pending_scorecard",
    scorecardSubmitted: !!i.my_evaluation_submitted,
    cvSummary: { experienceYears: "—", currentCompany: "—", education: "—", skills: [], summaryBio: "" },
  } as InterviewScheduleItem;
}

export default function InterviewerSchedulePage() {
  const { user } = useAuth();
  const { data, error, loading, reload, setData } = useApiData(
    async () => (await interviewerApi.mine()).map((i) => toScheduleItem(i, user?.id)), [user?.id]);
  const interviews = useMemo(() => data || [], [data]);
  const setInterviews = (fn: (prev: InterviewScheduleItem[]) => InterviewScheduleItem[]) => setData((prev) => fn(prev || []));
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'upcoming' | 'pending_scorecard' | 'completed'>('all');

  // Modal State
  const [selectedCvCandidate, setSelectedCvCandidate] = useState<InterviewScheduleItem | null>(null);
  const [selectedScorecardInterview, setSelectedScorecardInterview] = useState<InterviewScheduleItem | null>(null);

  // Form chấm điểm
  const [scoreTechnical, setScoreTechnical] = useState(3);
  const [scoreCommunication, setScoreCommunication] = useState(3);
  const [scoreCulture, setScoreCulture] = useState(3);
  const [scoreProblemSolving, setScoreProblemSolving] = useState(3);
  const [scorecardRecommendation, setScorecardRecommendation] = useState<'pass' | 'consider' | 'fail'>('consider');
  const [scorecardComment, setScorecardComment] = useState('');
  const [isSubmittingScorecard, setIsSubmittingScorecard] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Lọc và tìm kiếm theo thứ tự thời gian gần nhất
  const filteredInterviews = useMemo(() => {
    return interviews.filter((item) => {
      const matchSearch =
        item.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (activeFilter === 'today') {
        return item.relativeTimeTag === 'Hôm nay';
      }
      if (activeFilter === 'upcoming') {
        return item.status === 'upcoming' || item.status === 'in_progress';
      }
      if (activeFilter === 'pending_scorecard') {
        return item.status === 'completed_pending_scorecard';
      }
      if (activeFilter === 'completed') {
        return item.status === 'completed_evaluated';
      }
      return true;
    });
  }, [interviews, searchQuery, activeFilter]);

  // Xử lý nộp phiếu đánh giá
  const handleScorecardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScorecardInterview) return;
    setIsSubmittingScorecard(true);
    const avg = (scoreTechnical + scoreCommunication + scoreCulture + scoreProblemSolving) / 4;
    try {
      // UI 1–5 → API 1–10; the conclusion is mandatory and the scorecard is locked once submitted (S6-08).
      await referralService.submitEvaluation({
        application_id: selectedScorecardInterview.applicationId,
        interview_id: selectedScorecardInterview.interviewId,
        technical_score: scoreTechnical * 2,
        communication_score: scoreCommunication * 2,
        culture_fit_score: scoreCulture * 2,
        overall_score: Math.max(1, Math.round(avg * 2)),
        recommendation: scorecardRecommendation === 'pass' ? 'hire' : scorecardRecommendation === 'consider' ? 'hold' : 'reject',
        comments: scorecardComment.trim() || undefined,
      });
      setInterviews((prev) =>
        prev.map((item) =>
          item.id === selectedScorecardInterview.id
            ? { ...item, status: 'completed_evaluated', scorecardSubmitted: true, scorecardScore: Number(avg.toFixed(1)) }
            : item
        )
      );
      showToast(`Đã nộp phiếu đánh giá cho ứng viên ${selectedScorecardInterview.candidateName}.`);
      setSelectedScorecardInterview(null);
      setScorecardComment('');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Không nộp được phiếu đánh giá.');
    } finally {
      setIsSubmittingScorecard(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => undefined);
    showToast('Đã sao chép link phòng họp vào clipboard!');
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-800 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Page Header & Tiêu đề */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-xs">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Lịch Phỏng Vấn Của Tôi</h1>
              <span className="bg-blue-50 text-blue-600 border border-blue-200/60 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Hội Đồng Chuyên Môn
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi lịch phỏng vấn được gán, kiểm tra hồ sơ ứng viên và nộp phiếu đánh giá sau mỗi buổi phỏng vấn.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">
            Tổng cộng <span className="font-bold text-slate-900">{interviews.length}</span> buổi phỏng vấn
          </span>
        </div>
      </div>

      {/* 2. Logic ảo & Alert Banner: Quyền xem lịch của hội đồng */}
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-blue-50/90 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-blue-500/20">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="text-xs space-y-0.5 flex-1">
          <span className="font-bold text-blue-900 block text-[13px]">
            Phạm vi hiển thị & Phân quyền bảo mật Hội đồng:
          </span>
          <p className="text-slate-600 leading-relaxed">
            Hệ thống chỉ hiển thị các buổi phỏng vấn mà bạn được HR hoặc Hiring Manager chính thức mời tham gia Hội đồng chuyên môn (Interviewer Council). Mọi thông tin ứng viên, kết quả live coding và phiếu đánh giá đều được bảo mật tuyệt đối.
          </p>
        </div>
      </div>

      {/* 3. Thanh Tìm Kiếm & Bộ Lọc Trạng Thái */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên ứng viên, vị trí tuyển dụng, phòng ban..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-800"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={clsx(
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
              activeFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            )}
          >
            Tất cả ({interviews.length})
          </button>

          <button
            onClick={() => setActiveFilter('today')}
            className={clsx(
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
              activeFilter === 'today'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            )}
          >
            Hôm nay ({interviews.filter((i) => i.relativeTimeTag === 'Hôm nay').length})
          </button>

          <button
            onClick={() => setActiveFilter('upcoming')}
            className={clsx(
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
              activeFilter === 'upcoming'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            )}
          >
            Sắp tới ({interviews.filter((i) => i.status === 'upcoming' || i.status === 'in_progress').length})
          </button>

          <button
            onClick={() => setActiveFilter('pending_scorecard')}
            className={clsx(
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1',
              activeFilter === 'pending_scorecard'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
            )}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Chưa nộp phiếu ({interviews.filter((i) => i.status === 'completed_pending_scorecard').length})</span>
          </button>

          <button
            onClick={() => setActiveFilter('completed')}
            className={clsx(
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
              activeFilter === 'completed'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            )}
          >
            Đã hoàn thành ({interviews.filter((i) => i.status === 'completed_evaluated').length})
          </button>
        </div>
      </div>

      {/* 4. GIAO DIỆN DANH SÁCH: CÁC CARD BUỔI PHỎNG VẤN (LIST VIEW) */}
      <div className="space-y-4">
        {filteredInterviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Không tìm thấy buổi phỏng vấn nào</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc trạng thái khác để xem lịch phỏng vấn.
            </p>
          </div>
        ) : (
          filteredInterviews.map((item) => {
            const isPendingScorecard = item.status === 'completed_pending_scorecard';
            const isInProgress = item.status === 'in_progress';
            const isCompleted = item.status === 'completed_evaluated';

            return (
              <div
                key={item.id}
                className={clsx(
                  'bg-white rounded-2xl border p-6 transition-all duration-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 group hover:shadow-md',
                  isPendingScorecard
                    ? 'border-rose-300 ring-2 ring-rose-500/10 bg-gradient-to-br from-white to-rose-50/20'
                    : isInProgress
                    ? 'border-blue-300 ring-2 ring-blue-500/10'
                    : 'border-slate-100 hover:border-blue-200/70'
                )}
              >
                {/* Khối Thông Tin Chính Của Card */}
                <div className="flex flex-col sm:flex-row items-start gap-5 flex-1">
                  {/* Hộp Ngày Tháng / Time Box (Cột Ngày) */}
                  <div className="flex sm:flex-col items-center justify-center w-full sm:w-28 p-3 rounded-2xl bg-slate-50 border border-slate-100 shrink-0 text-center gap-2 sm:gap-0 group-hover:bg-blue-50/40 transition-colors">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      {item.displayDate}
                    </span>
                    <span className="text-lg font-black text-slate-900 block sm:my-0.5">
                      {item.timeRange.split(' - ')[0]}
                    </span>
                    <span
                      className={clsx(
                        'text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-block mt-0.5',
                        item.relativeTimeTag === 'Hôm nay'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : item.relativeTimeTag === 'Ngày mai'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : item.relativeTimeTag === 'Đã kết thúc'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {item.relativeTimeTag}
                    </span>
                  </div>

                  {/* Chi tiết Ứng viên & Buổi phỏng vấn */}
                  <div className="space-y-2.5 flex-1 min-w-0">
                    {/* Header thông tin ứng viên & Badge trạng thái */}
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {item.candidateName}
                      </h3>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                        {item.position}
                      </span>
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                        {item.round}
                      </span>
                    </div>

                    {/* Vị trí, Phòng ban & Địa điểm/Link họp */}
                    <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-700">{item.department}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Thời lượng: <strong className="text-slate-700">{item.timeRange}</strong></span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.format === 'online' ? (
                          <>
                            <Video className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="font-semibold text-blue-700">Online ({item.meetingPlatform})</span>
                            {item.meetingUrl && (
                              <button
                                onClick={() => copyToClipboard(item.meetingUrl!)}
                                className="text-slate-400 hover:text-slate-600 p-0.5 ml-0.5"
                                title="Sao chép link họp"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="font-semibold text-slate-800">{item.offlineRoom}</span>
                            <span className="text-[11px] text-slate-400">({item.offlineAddress})</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Hội đồng phỏng vấn (Interviewer Council) */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>Hội đồng:</span>
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.councilMembers.map((member, idx) => (
                          <span
                            key={idx}
                            className={clsx(
                              'text-[11px] px-2 py-0.5 rounded-full font-medium',
                              member.isCurrentUser
                                ? 'bg-blue-100/70 text-blue-800 font-bold border border-blue-200'
                                : 'bg-slate-100 text-slate-600'
                            )}
                          >
                            {member.name} {member.isCurrentUser && '(Bạn)'}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* ⚠️ CẢNH BÁO NỔI BẬT: CHƯA NỘP PHIẾU ĐÁNH GIÁ (NẾU BUỔI PV ĐÃ KẾT THÚC) */}
                    {isPendingScorecard && (
                      <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-xs text-rose-800 flex items-start sm:items-center justify-between gap-3 animate-in fade-in">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded-lg bg-rose-200/80 text-rose-700">
                            <AlertTriangle className="w-4 h-4" />
                          </span>
                          <div>
                            <strong className="font-bold text-rose-900 block">
                              ⚠️ Chưa nộp phiếu đánh giá
                            </strong>
                            <p className="text-[11px] text-rose-700">
                              Buổi phỏng vấn đã kết thúc nhưng bạn chưa chấm điểm. Vui lòng nộp phiếu để HR hoàn tất đánh giá ứng viên.
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedScorecardInterview(item)}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs shrink-0 transition-all shadow-sm shadow-rose-600/20 active:scale-95 cursor-pointer"
                        >
                          Nộp phiếu ngay
                        </button>
                      </div>
                    )}

                    {/* THÔNG BÁO: ĐÃ HOÀN THÀNH & ĐÃ NỘP PHIẾU */}
                    {isCompleted && (
                      <div className="mt-2 text-[11px] text-emerald-700 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          Đã hoàn thành đánh giá • Điểm chấm: <strong className="font-bold text-emerald-800">{item.scorecardScore} / 5.0 ★</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Các Nút Hành Động (Action Buttons) Phía Phải */}
                <div className="flex items-center lg:flex-col justify-end gap-2.5 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  {/* Nút 1: Xem CV (Outline button) */}
                  <button
                    onClick={() => setSelectedCvCandidate(item)}
                    className="flex-1 lg:flex-initial lg:w-44 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Xem CV Ứng Viên</span>
                  </button>

                  {/* Nút 2: Vào phòng phỏng vấn (Primary button màu xanh) */}
                  <Link
                    href={`/interviewer/live/${item.id}`}
                    className={clsx(
                      'flex-1 lg:flex-initial lg:w-44 px-4 py-2 rounded-xl text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-md',
                      isInProgress
                        ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25 ring-2 ring-blue-500/30 animate-pulse'
                        : isPendingScorecard
                        ? 'bg-slate-800 hover:bg-slate-900 shadow-slate-800/20'
                        : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                    )}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>{isInProgress ? 'Tham Gia Ngay' : 'Vào Phòng Phỏng Vấn'}</span>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. MODAL XEM CV ỨNG VIÊN CHI TIẾT */}
      {selectedCvCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedCvCandidate.candidateName}</h3>
                  <p className="text-xs text-slate-500">
                    Ứng tuyển vị trí: <span className="font-semibold text-slate-700">{selectedCvCandidate.position}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCvCandidate(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
              {/* Thông tin liên hệ nhanh */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-400 block">Kinh nghiệm:</span>
                  <strong className="text-slate-800">{selectedCvCandidate.cvSummary.experienceYears}</strong>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Công ty gần nhất:</span>
                  <strong className="text-slate-800">{selectedCvCandidate.cvSummary.currentCompany}</strong>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Email:</span>
                  <strong className="text-slate-800 truncate block">{selectedCvCandidate.candidateEmail}</strong>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Điện thoại:</span>
                  <strong className="text-slate-800">{selectedCvCandidate.candidatePhone}</strong>
                </div>
              </div>

              {/* Tóm tắt kinh nghiệm & Năng lực */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-800 block text-xs">Tóm tắt tiểu sử chuyên môn:</span>
                <p className="p-3.5 bg-white border border-slate-200 rounded-xl text-slate-700 leading-relaxed">
                  {selectedCvCandidate.cvSummary.summaryBio}
                </p>
              </div>

              {/* Kỹ năng chuyên môn */}
              <div className="space-y-2">
                <span className="font-bold text-slate-800 block text-xs">Bộ kỹ năng & Công nghệ chính:</span>
                <div className="flex flex-wrap gap-2">
                  {selectedCvCandidate.cvSummary.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60 font-semibold text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Học vấn & Bằng cấp */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-800 block text-xs">Học vấn & Trình độ:</span>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700">
                  {selectedCvCandidate.cvSummary.education}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  alert(`Đang tải file CV bản gốc định dạng PDF của ứng viên ${selectedCvCandidate.candidateName}...`);
                }}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải CV Gốc (.PDF)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCvCandidate(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <Link
                  href={`/interviewer/live/${selectedCvCandidate.id}`}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/20 flex items-center gap-1.5"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Vào Phòng Phỏng Vấn</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL NỘP PHIẾU ĐÁNH GIÁ (SCORECARD MODAL) */}
      {selectedScorecardInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm shadow-blue-500/20">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Phiếu Đánh Giá Ứng Viên: {selectedScorecardInterview.candidateName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Vị trí: {selectedScorecardInterview.position} • {selectedScorecardInterview.round}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedScorecardInterview(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleScorecardSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    1. Kiến thức chuyên môn (Thang 1-5):
                  </label>
                  <select
                    value={scoreTechnical}
                    onChange={(e) => setScoreTechnical(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="5">5 - Xuất sắc (Vượt chuẩn vị trí)</option>
                    <option value="4">4 - Tốt (Đáp ứng đầy đủ yêu cầu)</option>
                    <option value="3">3 - Đạt yêu cầu (Cần đào tạo thêm)</option>
                    <option value="2">2 - Yếu (Chưa đạt chuẩn)</option>
                    <option value="1">1 - Không đạt</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    2. Giao tiếp & Làm việc nhóm (Thang 1-5):
                  </label>
                  <select
                    value={scoreCommunication}
                    onChange={(e) => setScoreCommunication(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="5">5 - Xuất sắc</option>
                    <option value="4">4 - Tốt</option>
                    <option value="3">3 - Đạt yêu cầu</option>
                    <option value="2">2 - Cần cải thiện</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    3. Độ phù hợp văn hóa doanh nghiệp:
                  </label>
                  <select
                    value={scoreCulture}
                    onChange={(e) => setScoreCulture(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="5">5 - Rất phù hợp</option>
                    <option value="4">4 - Phù hợp</option>
                    <option value="3">3 - Bình thường</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    4. Tư duy giải quyết vấn đề (Logic):
                  </label>
                  <select
                    value={scoreProblemSolving}
                    onChange={(e) => setScoreProblemSolving(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="5">5 - Rất sắc bén</option>
                    <option value="4">4 - Tốt</option>
                    <option value="3">3 - Trung bình</option>
                  </select>
                </div>
              </div>

              {/* Khuyến nghị tuyển dụng */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Khuyến nghị quyết định của bạn:
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setScorecardRecommendation('pass')}
                    className={clsx(
                      'p-2.5 rounded-xl border text-xs font-bold transition-all text-center',
                      scorecardRecommendation === 'pass'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    ✓ Đề Xuất Tuyển (Pass)
                  </button>

                  <button
                    type="button"
                    onClick={() => setScorecardRecommendation('consider')}
                    className={clsx(
                      'p-2.5 rounded-xl border text-xs font-bold transition-all text-center',
                      scorecardRecommendation === 'consider'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    ⚖️ Cân Nhắc Thêm
                  </button>

                  <button
                    type="button"
                    onClick={() => setScorecardRecommendation('fail')}
                    className={clsx(
                      'p-2.5 rounded-xl border text-xs font-bold transition-all text-center',
                      scorecardRecommendation === 'fail'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    ✕ Không Đạt (Fail)
                  </button>
                </div>
              </div>

              {/* Nhận xét chi tiết */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nhận xét chi tiết (Ưu điểm, nhược điểm, lưu ý cho vòng tiếp theo):
                </label>
                <textarea
                  rows={4}
                  required
                  value={scorecardComment}
                  onChange={(e) => setScorecardComment(e.target.value)}
                  placeholder="Ghi nhận rõ ràng căn cứ đánh giá: khả năng live coding, kinh nghiệm xử lý lỗi, thái độ trong buổi phỏng vấn..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedScorecardInterview(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingScorecard || !scorecardComment.trim()}
                  className={clsx(
                    'px-6 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md',
                    isSubmittingScorecard || !scorecardComment.trim()
                      ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 active:scale-95 cursor-pointer'
                  )}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingScorecard ? 'Đang lưu...' : 'Lưu & Nộp Phiếu Đánh Giá'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
