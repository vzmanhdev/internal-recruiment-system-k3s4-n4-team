'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle2,
  Users,
  Send,
  ExternalLink,
  AlertTriangle,
  X,
} from 'lucide-react';
import { apiRequest, ApiError } from '@/lib/api-client';
import { interviewService, type InterviewItem as ApiInterview } from '@/services/interview.service';
import { getLocalTodayDateString, isPastDate } from '@/utils/dateUtils';
import { useApiData } from '@/hooks/useApiData';
import { ErrorState, LoadingState } from '@/components/ui/DataStates';

const pad = (n: number) => String(n).padStart(2, '0');

interface InterviewItem {
  id: string;
  position: string;
  department: string;
  round: string;
  dateDisplay: string;
  timeDisplay: string;
  duration: string;
  type: 'online' | 'offline';
  locationOrUrl: string;
  meetUrl?: string;
  address?: string;
  interviewers: { name: string; role: string }[];
  status: 'pending_confirmation' | 'confirmed' | 'completed';
  note: string;
  interviewId: number;
  preparationNotes?: string | null;
}

/** The applicant's own interviews (limited view from the API: no panel feedback or interviewer contacts). */
function toItem(i: ApiInterview, now: number): InterviewItem {
  const start = new Date(i.scheduled_time);
  const end = new Date(start.getTime() + i.duration_minutes * 60_000);
  const finished = i.status !== 'scheduled' || end.getTime() < now;
  return {
    id: `IV-${i.id}`,
    interviewId: i.id,
    position: i.job_title || '',
    department: i.department || '',
    round: i.round_name,
    dateDisplay: start.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }),
    timeDisplay: `${pad(start.getHours())}:${pad(start.getMinutes())} - ${pad(end.getHours())}:${pad(end.getMinutes())} (GMT+7)`,
    duration: `${i.duration_minutes} phút`,
    type: i.meeting_link ? 'online' : 'offline',
    locationOrUrl: i.meeting_link ? 'Phỏng vấn trực tuyến' : i.location,
    meetUrl: i.meeting_link || undefined,
    address: i.meeting_link ? undefined : i.location,
    interviewers: [],
    status: finished ? 'completed' : i.candidate_response === 'confirmed' ? 'confirmed' : 'pending_confirmation',
    preparationNotes: i.preparation_notes || null,
    note: i.status === 'cancelled' ? 'Buổi phỏng vấn đã bị hủy.'
      : i.candidate_response === 'reschedule_requested' ? 'Bạn đã gửi đề nghị đổi lịch — bộ phận tuyển dụng sẽ liên hệ lại.' : '',
  };
}

export default function CandidateInterviewsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'confirmed'>('all');
  const [rescheduleModalItem, setRescheduleModalItem] = useState<InterviewItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastData, setToastData] = useState<{ title: string; message: string; details?: string; type?: 'success' | 'warning' | 'error' } | null>(null);

  const { data, error, loading, reload } = useApiData(async () => {
    const rows = await interviewService.getInterviews();
    const now = Date.now();
    return rows.filter((i) => i.is_own_application).map((i) => toItem(i, now));
  }, []);
  const [answered, setAnswered] = useState<Record<number, InterviewItem['status']>>({});
  const interviews = (data || []).map((i) => (answered[i.interviewId] ? { ...i, status: answered[i.interviewId] } : i));
  const showToast = (title: string, message: string, details?: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToastData({ title, message, details, type });
    setTimeout(() => setToastData(null), 5000);
  };

  const filteredInterviews = interviews.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return item.status === 'pending_confirmation';
    if (activeTab === 'confirmed') return item.status === 'confirmed';
    return true;
  });

  const answer = (interviewId: number, response: 'confirmed' | 'reschedule_requested', note?: string) =>
    apiRequest(`/interviews/${interviewId}/candidate-response`, { method: 'POST', body: JSON.stringify({ response, note }) });

  const handleConfirmAttendance = async (id: string) => {
    const item = interviews.find((x) => x.id === id);
    if (!item) return;
    try {
      await answer(item.interviewId, 'confirmed');
      setAnswered((prev) => ({ ...prev, [item.interviewId]: 'confirmed' }));
      showToast(
        'Xác Nhận Tham Dự Thành Công!',
        `Bạn đã xác nhận tham gia buổi phỏng vấn vị trí ${item.position}.`,
        `${item.dateDisplay} (${item.timeDisplay}) • ${item.locationOrUrl}`,
        'success'
      );
    } catch (err) {
      showToast('Lỗi Xác Nhận', err instanceof ApiError ? err.message : 'Không gửi được xác nhận.', undefined, 'error');
    }
  };

  const handleSubmitReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleReason.trim() || !rescheduleModalItem) return;
    if (rescheduleDate && isPastDate(rescheduleDate)) {
      showToast('Ngày Không Hợp Lệ', 'Ngày bạn chọn không được ở trong quá khứ.', undefined, 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const when = [rescheduleDate, rescheduleTime].filter(Boolean).join(' ');
      const note = `${when ? `Đề nghị đổi sang ${when}: ` : ''}${rescheduleReason.trim()}`;
      await answer(rescheduleModalItem.interviewId, 'reschedule_requested', note);
      showToast(
        'Đã Gửi Đề Xuất Đổi Lịch!',
        `Đã gửi yêu cầu đổi lịch cho buổi phỏng vấn ${rescheduleModalItem.round}.`,
        note,
        'warning'
      );
      setRescheduleModalItem(null);
      setRescheduleDate('');
      setRescheduleTime('');
      setRescheduleReason('');
      reload();
    } catch (err) {
      showToast('Lỗi Đổi Lịch', err instanceof ApiError ? err.message : 'Không gửi được yêu cầu đổi lịch.', undefined, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="w-full space-y-8 pb-12">
      {/* Rich Toast Notification */}
      {toastData && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-4 z-50 max-w-md w-full bg-white border-2 rounded-2xl shadow-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-200"
          style={{
            borderColor:
              toastData.type === 'success' ? '#10b981' :
              toastData.type === 'warning' ? '#f59e0b' : '#ef4444',
          }}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              toastData.type === 'success' ? 'bg-emerald-100 text-emerald-700' :
              toastData.type === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
            }`}
          >
            {toastData.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
             toastData.type === 'warning' ? <Clock className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div className="space-y-1 flex-1">
            <h4 className="font-extrabold text-sm text-slate-900 leading-tight">{toastData.title}</h4>
            <p className="text-xs text-slate-600 leading-snug">{toastData.message}</p>
            {toastData.details && (
              <p className="text-[11px] font-semibold text-blue-700 bg-blue-50/80 p-2 rounded-lg border border-blue-100">
                {toastData.details}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setToastData(null)}
            className="text-slate-400 hover:text-slate-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Khối Banner Trực Quan (Top Hero Banner trải ngang toàn bộ chiều rộng) */}
      <div className="w-full rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 shadow-md">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-16 w-56 h-56 bg-blue-400/20 rounded-full blur-xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff18_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold text-blue-100 border border-white/10">
              <Calendar className="w-3.5 h-3.5 text-yellow-300" />
              <span>HỘI ĐỒNG TUYỂN DỤNG • LỊCH PHỎNG VẤN</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Lịch Phỏng Vấn Tuyển Dụng
            </h1>
            <p className="text-blue-100 text-sm leading-relaxed">
              Quản lý, xác nhận tham dự hoặc gửi yêu cầu đổi lịch hẹn trực tuyến với Hội đồng Tuyển dụng.
            </p>
          </div>

          {/* Tab Filters đặt gọn gàng trong Banner */}
          <div className="flex items-center gap-1.5 p-1 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20 text-xs font-bold shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-blue-100 hover:text-white hover:bg-white/10'
              }`}
            >
              Tất cả ({interviews.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-blue-100 hover:text-white hover:bg-white/10'
              }`}
            >
              Chờ xác nhận (1)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('confirmed')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'confirmed'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-blue-100 hover:text-white hover:bg-white/10'
              }`}
            >
              Đã xác nhận (1)
            </button>
          </div>
        </div>
      </div>

      {/* Grid Cards (Đồng bộ chiều cao thẻ bằng flex-col h-full và mt-auto, mở rộng 3 cột trên 2xl) */}
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 items-stretch w-full">
        {filteredInterviews.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full"
          >
            {/* Top header badge */}
            <div className="flex justify-between items-start mb-4">
              <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                {item.round}
              </span>
              {item.status === 'confirmed' ? (
                <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Đã xác nhận
                </span>
              ) : (
                <span className="bg-amber-50 text-amber-600 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Chờ bạn xác nhận
                </span>
              )}
            </div>

            {/* Position & Code */}
            <h2 className="text-lg font-bold text-slate-800 mb-1">{item.position}</h2>
            <p className="text-sm text-slate-500 mb-6">
              Mã: <span className="font-semibold text-slate-700">{item.id}</span> • {item.department}
            </p>

            {/* Khối thời gian bắt đầu */}
            <div className="bg-slate-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-slate-500 mb-1">THỜI GIAN BẮT ĐẦU</p>
              <p className="text-xl font-bold text-blue-700 mb-2">{item.dateDisplay}</p>
              <p className="text-sm font-medium text-slate-700">
                {item.timeDisplay} ({item.duration})
              </p>
            </div>

            {/* Thông tin hình thức & Hội đồng */}
            <div className="space-y-2 mb-6 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Hình thức:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  {item.type === 'online' ? (
                    <>
                      <Video className="w-3.5 h-3.5 text-blue-600" />
                      Online qua Google Meet
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      Trực tiếp tại Trụ sở
                    </>
                  )}
                </span>
              </div>

              {item.type === 'online' && item.meetUrl && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Đường link:</span>
                  <a
                    href={item.meetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Mở phòng Meet
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {item.type === 'offline' && item.address && (
                <div className="text-slate-600 leading-relaxed">
                  Địa điểm: {item.address}
                </div>
              )}

              <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-100">
                <span className="text-slate-500 shrink-0">Hội đồng:</span>
                <span className="font-medium text-slate-700 text-right">
                  {item.interviewers.map((iv) => iv.name).join(' • ')}
                </span>
              </div>
            </div>

            {/* Dùng mt-auto để đẩy dải nút xuống đáy, giúp các card bằng nhau */}
            <div className="mt-auto pt-4 border-t border-slate-100 flex gap-3">
              {item.status === 'confirmed' ? (
                <button
                  type="button"
                  disabled
                  className="flex-1 bg-emerald-100 text-emerald-800 font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-default text-xs sm:text-sm"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Đã xác nhận
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleConfirmAttendance(item.id)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg transition-colors text-xs sm:text-sm cursor-pointer"
                >
                  Xác nhận tham dự
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setRescheduleModalItem(item);
                  setRescheduleReason('');
                }}
                className="flex-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 rounded-lg transition-colors text-xs sm:text-sm cursor-pointer"
              >
                Yêu cầu đổi lịch
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal xin đổi lịch */}
      {rescheduleModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Yêu Cầu Đổi Lịch Phỏng Vấn ({rescheduleModalItem.id})
              </h3>
              <button
                type="button"
                onClick={() => setRescheduleModalItem(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700"
              >
                Đóng
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <p className="font-bold text-slate-800">{rescheduleModalItem.position}</p>
              <p className="text-slate-500">
                Lịch hiện tại: {rescheduleModalItem.dateDisplay} ({rescheduleModalItem.timeDisplay})
              </p>
            </div>

            <form onSubmit={handleSubmitReschedule} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Ngày bạn thuận tiện
                  </label>
                  <input
                    type="date"
                    min={getLocalTodayDateString()}
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Khung giờ phù hợp
                  </label>
                  <select
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                  >
                    <option value="">-- Chọn khung giờ --</option>
                    <option value="09:00 - 10:00">09:00 - 10:00 Sáng</option>
                    <option value="10:30 - 11:30">10:30 - 11:30 Sáng</option>
                    <option value="14:00 - 15:00">14:00 - 15:00 Chiều</option>
                    <option value="16:00 - 17:00">16:00 - 17:00 Chiều</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Lý do xin đổi lịch <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="Vui lòng nêu rõ lý do để HR hỗ trợ sắp xếp..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRescheduleModalItem(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Gửi yêu cầu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
