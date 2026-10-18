'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiRequest, ApiError } from '@/lib/api-client';
import { getLocalTodayDateString, isPastDate } from '@/utils/dateUtils';
import { useApiData } from '@/hooks/useApiData';
import { ErrorState, LoadingState } from '@/components/ui/DataStates';

interface LinkInterview {
  job_title: string | null; round_name: string; scheduled_time: string; duration_minutes: number;
  location: string; meeting_link: string | null; candidate_response: string | null;
}
const pad = (n: number) => String(n).padStart(2, '0');
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  Building2,
  ExternalLink,
  Users,
  Send,
  RotateCcw,
  Sparkles,
  Info,
  CalendarPlus,
  ArrowRight,
  ChevronLeft,
  Mail,
  Phone,
  FileText,
} from 'lucide-react';

function CandidateInterviewAction() {
  // The e-mail link carries a single-use token bound to exactly this interview (S6-05)
  const token = useSearchParams().get('token') || '';
  const { data: raw, error, loading, reload } = useApiData(
    () => apiRequest<LinkInterview>(`/public/interviews?token=${encodeURIComponent(token)}`),
    [token],
  );

  // Page interaction states: 'pending' | 'confirmed' | 'rescheduling' | 'rescheduled_success'
  const [actionState, setActionState] = useState<
    'pending' | 'confirmed' | 'rescheduling' | 'rescheduled_success'
  >('pending');

  // Form Xin đổi lịch / Hủy
  const [rescheduleType, setRescheduleType] = useState<'reschedule' | 'cancel'>('reschedule');
  const [proposedDate, setProposedDate] = useState('');
  const [proposedTime, setProposedTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const interview = raw ? (() => {
    const start = new Date(raw.scheduled_time);
    const end = new Date(start.getTime() + raw.duration_minutes * 60_000);
    return {
      id: raw.round_name,
      position: raw.job_title || '',
      department: '',
      round: raw.round_name,
      dateDisplay: start.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }),
      timeDisplay: `${pad(start.getHours())}:${pad(start.getMinutes())} - ${pad(end.getHours())}:${pad(end.getMinutes())} (GMT+7)`,
      duration: `${raw.duration_minutes} phút`,
      format: raw.meeting_link ? 'Phỏng vấn trực tuyến' : `Trực tiếp tại ${raw.location}`,
      meetUrl: raw.meeting_link || '',
      interviewers: [] as Array<{ name: string; role: string }>,
      note: raw.candidate_response === 'confirmed'
        ? 'Bạn đã xác nhận tham dự buổi phỏng vấn này.'
        : raw.candidate_response === 'reschedule_requested'
          ? 'Bạn đã gửi đề nghị đổi lịch — bộ phận tuyển dụng sẽ liên hệ lại.'
          : 'Vui lòng xác nhận tham dự hoặc đề nghị đổi lịch bên dưới.',
    };
  })() : null;

  const reply = async (response: 'confirmed' | 'reschedule_requested', note?: string) => {
    await apiRequest('/public/interviews/respond', { method: 'POST', body: JSON.stringify({ token, response, note }) });
  };

  const handleConfirmAttendance = async () => {
    setIsSubmitting(true);
    setFormError('');
    try {
      await reply('confirmed');
      setActionState('confirmed');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Không gửi được xác nhận.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!rescheduleReason.trim()) {
      setFormError('Vui lòng nêu rõ lý do để Bộ phận Nhân sự hỗ trợ sắp xếp.');
      return;
    }

    if (rescheduleType === 'reschedule' && (!proposedDate || !proposedTime)) {
      setFormError('Vui lòng chọn ngày và khung giờ bạn có thể tham gia thuận tiện.');
      return;
    }

    if (rescheduleType === 'reschedule' && proposedDate && isPastDate(proposedDate)) {
      setFormError('Ngày bạn chọn không được ở trong quá khứ.');
      return;
    }

    setIsSubmitting(true);
    try {
      const note = rescheduleType === 'cancel'
        ? `Ứng viên xin hủy tham dự: ${rescheduleReason.trim()}`
        : `Đề nghị đổi sang ${proposedDate} ${proposedTime}: ${rescheduleReason.trim()}`;
      await reply('reschedule_requested', note);
      setActionState('rescheduled_success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Không gửi được đề nghị.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) return <ErrorState error={new ApiError(404, 'Liên kết không hợp lệ hoặc đã hết hiệu lực.')} />;
  if (loading) return <LoadingState />;
  if (error || !interview) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6 pb-12 antialiased">
      {/* Breadcrumb quay về trang chủ ứng viên */}
      <nav className="flex items-center justify-between text-xs text-slate-500 font-medium">
        <Link
          href="/candidate/track"
          className="hover:text-blue-600 transition-colors flex items-center gap-1.5 py-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Theo dõi tiến độ hồ sơ</span>
        </Link>
        <span className="font-mono text-slate-400">Mã lịch PV: {interview.id}</span>
      </nav>

      {/* ========================================================================= */}
      {/* 1. MÀN HÌNH ĐÃ XÁC NHẬN THAM DỰ (CONFIRMED SUCCESS)                        */}
      {/* ========================================================================= */}
      {actionState === 'confirmed' ? (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Đã Xác Nhận Tham Dự
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Cảm ơn bạn đã xác nhận!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Hội đồng phỏng vấn đã nhận được phản hồi của bạn. Lịch hẹn và link tham gia đã được đồng bộ vào hệ thống.
            </p>
          </div>

          {/* Hộp tóm tắt lịch đã chốt */}
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-5 text-left text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2.5">
              <span className="text-slate-500 font-medium">Thời gian:</span>
              <span className="font-extrabold text-emerald-900 text-sm">
                {interview.dateDisplay} ({interview.timeDisplay})
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2.5">
              <span className="text-slate-500 font-medium">Hình thức:</span>
              <span className="font-bold text-slate-800">{interview.format}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Vị trí:</span>
              <span className="font-bold text-slate-800">{interview.position}</span>
            </div>
          </div>

          {/* Dải nút hỗ trợ tiện ích */}
          <div className="space-y-3 pt-2">
            <a
              href={interview.meetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/25 active:scale-98"
            >
              <Video className="w-5 h-5" />
              <span>Kiểm tra & Vào phòng Google Meet</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              type="button"
              onClick={() => {
                const title = encodeURIComponent(`Phỏng vấn: ${interview.position}`);
                const details = encodeURIComponent(`Phỏng vấn cùng ${interview.department}\nLink Meet: ${interview.meetUrl}`);
                const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
                window.open(googleCalUrl, '_blank');
              }}
              className="w-full py-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <CalendarPlus className="w-4 h-4 text-blue-600" />
              <span>Thêm vào Google Calendar / Apple Calendar</span>
            </button>
          </div>
        </div>
      ) : actionState === 'rescheduled_success' ? (
        /* ========================================================================= */
        /* 2. MÀN HÌNH ĐÃ GỬI YÊU CẦU ĐỔI LỊCH / HỦY THÀNH CÔNG                       */
        /* ========================================================================= */
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-full bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mx-auto shadow-inner">
            <Clock className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-extrabold border border-amber-200">
              Đã Tiếp Nhận Yêu Cầu
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {rescheduleType === 'reschedule'
                ? 'Đã gửi đề xuất đổi lịch phỏng vấn'
                : 'Đã gửi thông báo hủy tham dự'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Bộ phận Nhân sự (Recruiter) đã nhận được phản hồi và sẽ liên hệ lại với bạn qua Email hoặc Số điện thoại trong vòng 24h làm việc.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Vị trí:</span>
              <span className="font-bold text-slate-800">{interview.position}</span>
            </div>
            {rescheduleType === 'reschedule' && proposedDate && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Khung giờ đề xuất:</span>
                <span className="font-bold text-blue-700">{proposedDate} ({proposedTime})</span>
              </div>
            )}
            <div className="flex items-start justify-between gap-3 pt-1 border-t border-slate-200/60">
              <span className="text-slate-500 font-medium shrink-0">Lý do:</span>
              <span className="text-slate-700 italic text-right truncate max-w-xs">{rescheduleReason}</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/candidate/track"
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <span>Quay về trang tra cứu tiến độ</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : actionState === 'rescheduling' ? (
        /* ========================================================================= */
        /* 3. FORM XIN ĐỔI LỊCH / HỦY THAM DỰ                                         */
        /* ========================================================================= */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-slate-900">
                Xin đổi lịch hoặc Hủy tham dự
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setActionState('pending')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Quay lại
            </button>
          </div>

          {formError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleRescheduleSubmit} className="space-y-4">
            {/* Lựa chọn loại yêu cầu */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Bạn muốn thực hiện thao tác nào? <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRescheduleType('reschedule')}
                  className={`p-3.5 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    rescheduleType === 'reschedule'
                      ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Xin đổi lịch khác</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRescheduleType('cancel')}
                  className={`p-3.5 rounded-2xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    rescheduleType === 'cancel'
                      ? 'bg-rose-50 border-rose-600 text-rose-700 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>Hủy tham dự PV</span>
                </button>
              </div>
            </div>

            {/* Nếu chọn xin đổi lịch: Cho chọn thời gian thuận tiện */}
            {rescheduleType === 'reschedule' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Ngày thuận tiện cho bạn <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={getLocalTodayDateString()}
                    value={proposedDate}
                    onChange={(e) => setProposedDate(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-base font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Khung giờ phù hợp <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={proposedTime}
                    onChange={(e) => setProposedTime(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-base font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="">-- Chọn khung giờ --</option>
                    <option value="09:00 - 10:30 (Sáng)">09:00 - 10:30 (Buổi sáng)</option>
                    <option value="10:30 - 12:00 (Sáng)">10:30 - 12:00 (Buổi sáng)</option>
                    <option value="14:00 - 15:30 (Chiều)">14:00 - 15:30 (Buổi chiều)</option>
                    <option value="15:30 - 17:00 (Chiều)">15:30 - 17:00 (Buổi chiều)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Lý do chi tiết */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Lý do chi tiết <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder={
                  rescheduleType === 'reschedule'
                    ? 'Ví dụ: Em có lịch bận đột xuất tại công ty hiện tại vào chiều thứ Sáu, mong anh/chị hỗ trợ dời sang đầu tuần sau...'
                    : 'Ví dụ: Em vừa nhận được cơ hội việc làm khác phù hợp hơn nên xin phép dừng quy trình tuyển dụng...'
                }
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-base font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
              />
            </div>

            {/* Nút gửi yêu cầu */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-70"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Đang gửi yêu cầu...'
                    : rescheduleType === 'reschedule'
                    ? 'Gửi đề xuất đổi lịch phỏng vấn'
                    : 'Xác nhận hủy buổi phỏng vấn'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActionState('pending')}
                className="px-6 py-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ========================================================================= */
        /* 4. MÀN HÌNH CHÍNH: CHI TIẾT LỊCH PHỎNG VẤN & DẢI NÚT HÀNH ĐỘNG            */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Card chính hiển thị thông tin phỏng vấn */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-extrabold border border-blue-100">
                  Lời Mời Phỏng Vấn Chính Thức
                </span>
                <span className="text-xs text-slate-400 font-medium">{interview.department}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                {interview.position}
              </h1>
              <p className="text-xs font-bold text-blue-600">
                {interview.round}
              </p>
            </div>

            {/* KHỐI THỜI GIAN TO, IN ĐẬM RÕ RÀNG */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50/50 to-blue-50/80 border-2 border-blue-200 rounded-3xl p-6 text-center space-y-2 shadow-2xs">
              <span className="text-[11px] font-extrabold text-blue-600 uppercase tracking-wider block">
                THỜI GIAN PHỎNG VẤN
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {interview.dateDisplay}
              </div>
              <div className="text-lg sm:text-xl font-extrabold text-blue-700 flex items-center justify-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span>{interview.timeDisplay}</span>
              </div>
            </div>

            {/* KHỐI HÌNH THỨC & NÚT THAM GIA THỬ */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-500">Hình thức phỏng vấn:</span>
                  <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Video className="w-4 h-4 text-blue-600" />
                    <span>{interview.format}</span>
                  </div>
                </div>

                {/* Nút tham gia thử */}
                <a
                  href={interview.meetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 text-xs font-extrabold inline-flex items-center gap-1.5 shadow-2xs self-start sm:self-auto transition-colors"
                >
                  <span>Kiểm tra link Meet</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed pt-1 border-t border-slate-200/60">
                {interview.note}
              </p>
            </div>

            {/* KHỐI NGƯỜI PHỎNG VẤN */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                <span>Hội đồng phỏng vấn</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {interview.interviewers.map((iv, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1"
                  >
                    <div className="font-extrabold text-xs text-slate-900">{iv.name}</div>
                    <div className="text-[10px] text-slate-500 leading-tight">{iv.role}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* DẢI NÚT HÀNH ĐỘNG (ACTION BUTTONS - NGANG TRÊN PC, XẾP DỌC TRÊN MOBILE)   */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-3">
            <div className="text-xs font-bold text-slate-500 text-center sm:text-left">
              Vui lòng phản hồi sớm để chúng tôi chuẩn bị đón tiếp bạn chu đáo nhất:
            </div>
            {formError && <p className="text-xs font-semibold text-rose-600">{formError}</p>}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Nút 1: Primary Green (Xác nhận tham dự) */}
              <button
                type="button"
                onClick={handleConfirmAttendance}
                disabled={isSubmitting}
                className="flex-1 py-4 sm:py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-70"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Xác nhận tham dự</span>
              </button>

              {/* Nút 2: Outline Red/Gray (Xin đổi lịch / Hủy tham dự) */}
              <button
                type="button"
                onClick={() => setActionState('rescheduling')}
                className="py-4 sm:py-3.5 px-6 rounded-2xl border-2 border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Xin đổi lịch / Hủy tham dự</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// useSearchParams (?token=) needs a Suspense boundary for static rendering
export default function CandidateInterviewActionPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CandidateInterviewAction />
    </Suspense>
  );
}
