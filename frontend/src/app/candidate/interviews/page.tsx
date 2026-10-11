'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Building2,
  CalendarDays,
  Sparkles,
  Phone,
  Mail,
  ShieldCheck,
  MessageSquare,
  AlertTriangle,
  X,
  ChevronRight,
  Info,
} from 'lucide-react';
import clsx from 'clsx';

// ========================================================
// 1. DATA TYPES
// ========================================================

export type InterviewStatus = 'INVITED' | 'CONFIRMED' | 'RESCHEDULE_REQUESTED' | 'COMPLETED' | 'CANCELLED';

export interface CandidateInterview {
  id: string; // INT-2026-01
  applicationId: string;
  jobCode: string;
  jobTitle: string;
  department: string;
  roundName: string;
  roundNumber: number;
  dateStr: string; // Thứ Tư, 14/10/2026
  timeStr: string; // 14:00 - 15:15 (75 phút)
  countdownDays: number;
  format: 'ONLINE' | 'OFFLINE';
  meetUrl?: string;
  offlineAddress?: string;
  offlineRoom?: string;
  mapsUrl?: string;
  interviewers: {
    name: string;
    title: string;
    avatarUrl?: string;
  }[];
  notes: string[];
  status: InterviewStatus;
  rescheduleReason?: string;
  proposedNewTime?: string;
}

// ========================================================
// 2. MOCK INTERVIEWS DATA
// ========================================================

const INITIAL_INTERVIEWS: CandidateInterview[] = [
  {
    id: 'INT-2026-01',
    applicationId: 'APP-2026-001',
    jobCode: 'JOB-2026-01',
    jobTitle: 'Senior Backend Engineer (Go/Python)',
    department: 'Khối Công Nghệ & Phần Mềm',
    roundName: 'Vòng 2: Phỏng Vấn Kỹ Thuật Chuyên Sâu & System Design',
    roundNumber: 2,
    dateStr: 'Thứ Tư, 14/10/2026',
    timeStr: '14:00 - 15:15 (75 phút)',
    countdownDays: 3,
    format: 'ONLINE',
    meetUrl: 'https://meet.google.com/dng-bgfd-rth',
    interviewers: [
      {
        name: 'Nguyễn Tiến Dũng',
        title: 'Engineering Director / Chuyên gia Hệ thống',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=240&auto=format&fit=crop',
      },
      {
        name: 'Trần Thị Mai',
        title: 'Lead Architect (Cloud & Microservices)',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=240&auto=format&fit=crop',
      },
    ],
    notes: [
      'Phỏng vấn trực tuyến qua Google Meet, vui lòng chuẩn bị máy tính có Camera và Micro hoạt động tốt.',
      'Sẽ có phần trao đổi về kiến trúc Microservices và bài tập Live System Design trên công cụ vẽ sơ đồ.',
      'Ứng viên nên tham gia phòng họp trước 5 phút để kiểm tra đường truyền kết nối mạng.',
    ],
    status: 'INVITED',
  },
  {
    id: 'INT-2026-02',
    applicationId: 'APP-2026-002',
    jobCode: 'JOB-2026-02',
    jobTitle: 'Frontend React Lead (Next.js 16/React 19)',
    department: 'Khối Công Nghệ & Phần Mềm',
    roundName: 'Vòng 3: Gặp Gỡ Ban Giám Đốc & Định Hướng Văn Hóa',
    roundNumber: 3,
    dateStr: 'Thứ Sáu, 16/10/2026',
    timeStr: '10:00 - 11:00 (60 phút)',
    countdownDays: 5,
    format: 'OFFLINE',
    offlineAddress: 'Tầng 24, Tòa nhà Keangnam Landmark 72, Phạm Hùng, Nam Từ Liêm, Hà Nội',
    offlineRoom: 'Phòng Hội Nghị VIP Polaris (Tầng 24)',
    mapsUrl: 'https://maps.google.com/?q=Keangnam+Landmark+72+Hanoi',
    interviewers: [
      {
        name: 'Lê Hoàng Nam',
        title: 'Phó Tổng Giám Đốc Công Nghệ (VP of Engineering)',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=240&auto=format&fit=crop',
      },
      {
        name: 'Phạm Thu Trang',
        title: 'Head of People & Culture (HR Director)',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=240&auto=format&fit=crop',
      },
    ],
    notes: [
      'Phỏng vấn trực tiếp tại trụ sở chính. Khi đến sảnh lễ tân tầng 1, vui lòng xuất trình CCCD để nhận thẻ thang máy lên tầng 24.',
      'Trang phục lịch sự, tác phong chuyên nghiệp.',
      'HR Hotline đón tiếp tại sảnh: 0912 345 678 (Ms. Thu Trang).',
    ],
    status: 'CONFIRMED',
  },
];

export default function CandidateInterviewsPage() {
  const [interviews, setInterviews] = useState<CandidateInterview[]>(INITIAL_INTERVIEWS);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // State cho Modal Từ chối / Xin dời lịch
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<CandidateInterview | null>(null);
  const [actionType, setActionType] = useState<'RESCHEDULE' | 'CANCEL'>('RESCHEDULE');
  const [reasonInput, setReasonInput] = useState('');
  const [proposedDateInput, setProposedDateInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Xử lý sao chép Link Google Meet
  const handleCopyMeetUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(url);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  // Hành động: Xác nhận tham dự (Primary Green)
  const handleConfirmAttendance = (interviewId: string) => {
    setInterviews((prev) =>
      prev.map((item) =>
        item.id === interviewId ? { ...item, status: 'CONFIRMED' } : item
      )
    );
    setToastMessage('Bạn đã xác nhận tham dự phỏng vấn thành công! Lịch hẹn đã được đồng bộ tới Hội đồng tuyển dụng.');
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Mở modal Từ chối / Xin dời lịch
  const handleOpenRescheduleModal = (interview: CandidateInterview) => {
    setSelectedInterview(interview);
    setActionType('RESCHEDULE');
    setReasonInput('');
    setProposedDateInput('');
    setRescheduleModalOpen(true);
  };

  // Gửi xác nhận Dời lịch / Từ chối
  const handleSubmitReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInterview) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const isReschedule = actionType === 'RESCHEDULE';
      const finalStatus: InterviewStatus = isReschedule ? 'RESCHEDULE_REQUESTED' : 'CANCELLED';

      setInterviews((prev) =>
        prev.map((item) => {
          if (item.id === selectedInterview.id) {
            return {
              ...item,
              status: finalStatus,
              rescheduleReason: reasonInput.trim() || (isReschedule ? 'Ứng viên đề xuất đổi ngày khác do lịch trình.' : 'Ứng viên từ chối tham gia.'),
              proposedNewTime: proposedDateInput.trim() || undefined,
            };
          }
          return item;
        })
      );

      setIsSubmitting(false);
      setRescheduleModalOpen(false);

      if (isReschedule) {
        setToastMessage(`Đã gửi yêu cầu dời lịch phỏng vấn cho mã "${selectedInterview.id}". HR sẽ liên hệ sắp xếp lại trong 24h.`);
      } else {
        setToastMessage(`Đã ghi nhận bạn từ chối ca phỏng vấn "${selectedInterview.id}".`);
      }

      setTimeout(() => setToastMessage(null), 5000);
    }, 800);
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Toast thông báo */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-extrabold text-xs sm:text-sm">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
          <Link href="/candidate/jobs" className="hover:text-blue-600 transition-colors">
            Candidate Workspace
          </Link>
          <span>&rsaquo;</span>
          <span className="text-slate-700 font-bold">Lịch phỏng vấn</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <CalendarDays className="w-7 h-7 text-blue-600" />
          <span>Lịch Hẹn Phỏng Vấn Tuyển Dụng</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Xác nhận tham dự, nhận link phòng họp trực tuyến Google Meet hoặc bản đồ vị trí văn phòng phỏng vấn.
        </p>
      </div>

      {/* DANH SÁCH CÁC THẺ LỜI MỜI PHỎNG VẤN NỔI BẬT */}
      <div className="space-y-6">
        {interviews.map((item) => {
          const isConfirmed = item.status === 'CONFIRMED';
          const isRescheduleRequested = item.status === 'RESCHEDULE_REQUESTED';
          const isCancelled = item.status === 'CANCELLED';

          return (
            <div
              key={item.id}
              className={clsx(
                'bg-white rounded-3xl border shadow-xs transition-all duration-200 overflow-hidden',
                isConfirmed && 'border-emerald-300 ring-2 ring-emerald-100 shadow-md',
                isRescheduleRequested && 'border-amber-300 bg-amber-50/20',
                isCancelled && 'border-slate-200 opacity-80 bg-slate-50',
                item.status === 'INVITED' && 'border-blue-200 hover:border-blue-400 hover:shadow-lg'
              )}
            >
              {/* Header Thẻ: Vị trí & Trạng thái Badge */}
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-50/80 to-white">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-xl bg-blue-600 text-white font-mono font-black text-xs">
                      {item.id}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {item.jobCode}
                    </span>
                    {item.format === 'ONLINE' ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-black uppercase flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        <span>Online (Google Meet)</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>Trực Tiếp Tại Văn Phòng</span>
                      </span>
                    )}

                    {/* Badge Trạng thái */}
                    {isConfirmed && (
                      <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-black flex items-center gap-1 shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Đã xác nhận tham dự</span>
                      </span>
                    )}
                    {isRescheduleRequested && (
                      <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-[11px] font-black flex items-center gap-1">
                        <Clock className="w-3 h-3 stroke-[3]" />
                        <span>Đang chờ HR dời lịch</span>
                      </span>
                    )}
                    {isCancelled && (
                      <span className="px-3 py-1 rounded-full bg-slate-400 text-white text-[11px] font-black flex items-center gap-1">
                        <X className="w-3 h-3 stroke-[3]" />
                        <span>Đã từ chối tham gia</span>
                      </span>
                    )}
                    {item.status === 'INVITED' && (
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] font-black flex items-center gap-1 animate-pulse">
                        <Sparkles className="w-3 h-3" />
                        <span>Lời mời mới &bull; Còn {item.countdownDays} ngày</span>
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl font-black text-slate-900 leading-snug">
                    {item.jobTitle}
                  </h2>
                  <p className="text-xs text-blue-700 font-extrabold">
                    {item.roundName}
                  </p>
                </div>

                {/* Hộp đếm ngày */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3 shrink-0 self-start md:self-auto">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Thời gian hẹn
                    </span>
                    <span className="text-xs font-black text-slate-900 block">
                      {item.dateStr}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-blue-600">
                      {item.timeStr}
                    </span>
                  </div>
                </div>
              </div>

              {/* Body Thẻ: Địa điểm, Link Meet/Bản đồ & Hội đồng phỏng vấn */}
              <div className="p-6 space-y-6 text-xs">
                {/* 1. KHỐI THÔNG TIN ĐỊA ĐIỂM HOẶC GOOGLE MEET */}
                {item.format === 'ONLINE' ? (
                  <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-indigo-950 font-black text-sm">
                        <Video className="w-4 h-4 text-indigo-600" />
                        <span>Phòng họp trực tuyến Google Meet</span>
                      </div>
                      <p className="text-indigo-800 font-mono text-xs">
                        {item.meetUrl}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => item.meetUrl && handleCopyMeetUrl(item.meetUrl)}
                        className="px-3.5 py-2.5 rounded-xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        {copiedLink === item.meetUrl ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                            <span className="text-emerald-700">Đã chép link</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Sao chép link</span>
                          </>
                        )}
                      </button>

                      <a
                        href={item.meetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <span>Vào Phòng Họp</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-emerald-950 font-black text-sm">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <span>{item.offlineRoom}</span>
                      </div>
                      <p className="text-emerald-800 text-xs">
                        {item.offlineAddress}
                      </p>
                    </div>

                    <a
                      href={item.mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-extrabold text-xs shadow-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                    >
                      <span>Mở Bản Đồ Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {/* 2. HỘI ĐỒNG PHỎNG VẤN */}
                <div className="space-y-2.5">
                  <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Hội Đồng Phỏng Vấn (Interviewers)</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {item.interviewers.map((intvw, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3"
                      >
                        {intvw.avatarUrl ? (
                          <img
                            src={intvw.avatarUrl}
                            alt={intvw.name}
                            className="w-10 h-10 rounded-xl object-cover ring-2 ring-white shadow-xs shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                            {intvw.name.slice(-2)}
                          </div>
                        )}
                        <div>
                          <div className="font-extrabold text-slate-900 text-xs">
                            {intvw.name}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {intvw.title}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. LƯU Ý & CHUẨN BỊ */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100/80 space-y-2">
                  <span className="font-extrabold text-slate-800 block text-xs flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-600" />
                    <span>Lưu ý chuẩn bị trước buổi phỏng vấn:</span>
                  </span>
                  <ul className="space-y-1.5 text-slate-600 text-[11px] leading-relaxed">
                    {item.notes.map((note, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Ghi chú khi dời lịch */}
                {isRescheduleRequested && item.rescheduleReason && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                    <strong className="font-black block">Yêu cầu dời lịch đã gửi:</strong>
                    <p>Lý do: &ldquo;{item.rescheduleReason}&rdquo;</p>
                    {item.proposedNewTime && (
                      <p>Khung giờ đề xuất: <strong className="font-mono">{item.proposedNewTime}</strong></p>
                    )}
                  </div>
                )}
              </div>

              {/* FOOTER: 2 NÚT HÀNH ĐỘNG TO RÕ RÀNG */}
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Vui lòng phản hồi sớm để HR hoàn tất thủ tục mở phòng họp.</span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  {/* NÚT 1: TỪ CHỐI / XIN DỜI LỊCH (OUTLINE RED) */}
                  {!isCancelled && (
                    <button
                      type="button"
                      onClick={() => handleOpenRescheduleModal(item)}
                      className="px-5 py-3 rounded-2xl border-2 border-rose-300 hover:border-rose-500 hover:bg-rose-50 text-rose-600 font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>{isRescheduleRequested ? 'Sửa Yêu Cầu Dời Lịch' : 'Từ Chối / Xin Dời Lịch'}</span>
                    </button>
                  )}

                  {/* NÚT 2: XÁC NHẬN THAM DỰ (PRIMARY GREEN / EMERALD) */}
                  {!isCancelled && (
                    <button
                      type="button"
                      disabled={isConfirmed}
                      onClick={() => handleConfirmAttendance(item.id)}
                      className={clsx(
                        'px-6 py-3 rounded-2xl font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer w-full sm:w-auto',
                        isConfirmed
                          ? 'bg-emerald-600 text-white opacity-95 cursor-default'
                          : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-emerald-500/25'
                      )}
                    >
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>{isConfirmed ? 'Đã Xác Nhận Tham Dự' : 'Xác Nhận Tham Dự Ngay'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 3. MODAL TỪ CHỐI / XIN DỜI LỊCH PHỎNG VẤN */}
      {/* ======================================================== */}
      {rescheduleModalOpen && selectedInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Phản Hồi Lịch Hẹn Phỏng Vấn
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {selectedInterview.jobTitle} &bull; {selectedInterview.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReschedule} className="space-y-4 text-xs">
              {/* Lựa chọn loại hành động */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setActionType('RESCHEDULE')}
                  className={clsx(
                    'p-3 rounded-2xl border font-black text-center transition-all cursor-pointer',
                    actionType === 'RESCHEDULE'
                      ? 'bg-amber-50 border-amber-400 text-amber-800 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  )}
                >
                  Xin Dời Lịch Khác
                </button>
                <button
                  type="button"
                  onClick={() => setActionType('CANCEL')}
                  className={clsx(
                    'p-3 rounded-2xl border font-black text-center transition-all cursor-pointer',
                    actionType === 'CANCEL'
                      ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  )}
                >
                  Từ Chối Phỏng Vấn
                </button>
              </div>

              {/* Ô nhập lý do báo trước cho HR */}
              <div className="space-y-1">
                <label className="block font-extrabold text-slate-800">
                  Lý do {actionType === 'RESCHEDULE' ? 'xin dời lịch' : 'từ chối'} (Báo trước cho HR) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder={
                    actionType === 'RESCHEDULE'
                      ? 'Ví dụ: Tôi có lịch công tác đột xuất vào chiều 14/10, mong muốn được dời sang ngày khác...'
                      : 'Ví dụ: Tôi đã nhận được công việc phù hợp hơn hoặc thay đổi định hướng cá nhân...'
                  }
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:border-amber-400 focus:bg-white resize-none"
                />
              </div>

              {/* Đề xuất khung giờ mới (chỉ hiện khi chọn dời lịch) */}
              {actionType === 'RESCHEDULE' && (
                <div className="space-y-1">
                  <label className="block font-extrabold text-slate-800">
                    Khung giờ bạn có thể tham gia (Gợi ý cho HR):
                  </label>
                  <input
                    type="text"
                    value={proposedDateInput}
                    onChange={(e) => setProposedDateInput(e.target.value)}
                    placeholder="Ví dụ: Sáng thứ Năm (15/10) lúc 09:30 hoặc chiều thứ Sáu..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:border-amber-400 focus:bg-white"
                  />
                </div>
              )}

              {/* Footer actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRescheduleModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={clsx(
                    'px-6 py-2.5 rounded-2xl font-black text-white shadow-md transition-all cursor-pointer flex items-center gap-2',
                    actionType === 'RESCHEDULE'
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                  )}
                >
                  {isSubmitting ? (
                    <span>Đang gửi thông tin...</span>
                  ) : (
                    <span>Xác Nhận Gửi HR</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
