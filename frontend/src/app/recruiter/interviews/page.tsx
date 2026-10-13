'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  Video,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Edit3,
  Trash2,
  Copy,
  ExternalLink,
  Layers,
  Send,
  Sparkles,
  X,
  Building2,
  UserCheck,
  RefreshCw,
  LayoutGrid,
  List,
  Mail,
  User,
  Info,
} from 'lucide-react';
import clsx from 'clsx';

// ==========================================
// 1. DATA TYPES & ENUMS
// ==========================================

export type InterviewType = 'online' | 'offline';
export type InterviewStatus = 'confirmed' | 'pending' | 'rescheduled' | 'cancelled' | 'completed';

export interface InterviewSession {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  candidateAvatar: string;
  position: string;
  date: string; // YYYY-MM-DD
  dayLabel: string; // Thứ 2, Thứ 3, ...
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  round: string;
  interviewers: string[]; // Tên người phỏng vấn
  type: InterviewType; // 'online' | 'offline'
  roomOrLink: string; // Tên phòng họp hoặc Link Google Meet
  status: InterviewStatus;
  notes?: string;
  rescheduleReason?: string;
  cancelReason?: string;
}

// ==========================================
// 2. MOCK INTERVIEWS DATA
// ==========================================

const INITIAL_INTERVIEWS: InterviewSession[] = [
  {
    id: 'IV-2026-01',
    candidateName: 'Nguyễn Văn An',
    candidateEmail: 'an.nguyen@gmail.com',
    candidatePhone: '0912 345 678',
    candidateAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=120&auto=format&fit=crop',
    position: 'Senior Backend Engineer (Go/Python)',
    date: '2026-10-12', // Thứ 2
    dayLabel: 'Thứ 2',
    startTime: '09:30',
    endTime: '10:30',
    round: 'Vòng 2: Kỹ thuật chuyên sâu (System Design)',
    interviewers: ['Nguyễn Tiến Dũng (Engineering Director)', 'Trần Thị Recruiter'],
    type: 'online',
    roomOrLink: 'https://meet.google.com/dng-bgfd-rth',
    status: 'confirmed',
    notes: 'Phỏng vấn trực tuyến qua Google Meet, kiểm tra kiến thức Kafka & Microservices.',
  },
  {
    id: 'IV-2026-02',
    candidateName: 'Đỗ Thùy Trang',
    candidateEmail: 'thuytrang.design@gmail.com',
    candidatePhone: '0934 567 890',
    candidateAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop',
    position: 'UI/UX Designer Senior',
    date: '2026-10-12', // Thứ 2
    dayLabel: 'Thứ 2',
    startTime: '14:00',
    endTime: '15:00',
    round: 'Vòng 1: Đánh giá Portfolio & Văn hóa',
    interviewers: ['Phạm Văn Tuấn (Tech Lead)', 'Trần Thị Recruiter'],
    type: 'offline',
    roomOrLink: 'Phòng Họp Sáng Tạo - Tầng 8 (Keangnam)',
    status: 'confirmed',
    notes: 'Ứng viên sẽ trình bày trực tiếp case study thiết kế Design System.',
  },
  {
    id: 'IV-2026-03',
    candidateName: 'Lê Hoàng Yến',
    candidateEmail: 'hoangyen.po@gmail.com',
    candidatePhone: '0978 123 456',
    candidateAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=120&auto=format&fit=crop',
    position: 'Product Owner / BA Lead',
    date: '2026-10-13', // Thứ 3
    dayLabel: 'Thứ 3',
    startTime: '10:00',
    endTime: '11:00',
    round: 'Vòng 2: Phỏng vấn Case Study Sản Phẩm',
    interviewers: ['Lê Thị Bích Ngọc (CPO)', 'Trần Thị Recruiter'],
    type: 'online',
    roomOrLink: 'https://meet.google.com/xyz-uvw-rst',
    status: 'confirmed',
  },
  {
    id: 'IV-2026-04',
    candidateName: 'Lê Thảo My',
    candidateEmail: 'thaomy.fe@gmail.com',
    candidatePhone: '0933 221 100',
    candidateAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=120&auto=format&fit=crop',
    position: 'Frontend React Lead',
    date: '2026-10-13', // Thứ 3
    dayLabel: 'Thứ 3',
    startTime: '14:30',
    endTime: '15:30',
    round: 'Vòng 2: Kỹ thuật chuyên sâu React 19',
    interviewers: ['Phạm Văn Tuấn (Tech Lead)', 'Trần Thị Recruiter'],
    type: 'online',
    roomOrLink: 'https://meet.google.com/abc-fe-lead',
    status: 'confirmed',
  },
  {
    id: 'IV-2026-05',
    candidateName: 'Vũ Đức Thịnh',
    candidateEmail: 'thinh.vuduc@gmail.com',
    candidatePhone: '0988 123 456',
    candidateAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop',
    position: 'Senior Backend Engineer (Go/Python)',
    date: '2026-10-14', // Thứ 4
    dayLabel: 'Thứ 4',
    startTime: '10:00',
    endTime: '11:00',
    round: 'Vòng 1: Sơ vấn năng lực chuyên môn',
    interviewers: ['Nguyễn Tiến Dũng (Engineering Director)'],
    type: 'online',
    roomOrLink: 'https://meet.google.com/vud-thinh-meet',
    status: 'pending',
  },
  {
    id: 'IV-2026-06',
    candidateName: 'Hoàng Kim Ngân',
    candidateEmail: 'ngan.hoang@gmail.com',
    candidatePhone: '0933 888 999',
    candidateAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=120&auto=format&fit=crop',
    position: 'Product Owner / BA Lead',
    date: '2026-10-15', // Thứ 5
    dayLabel: 'Thứ 5',
    startTime: '14:00',
    endTime: '15:00',
    round: 'Vòng 3: Phỏng vấn Ban Giám Đốc',
    interviewers: ['Lê Thị Bích Ngọc (CPO)', 'Nguyễn Tiến Dũng (Engineering Director)'],
    type: 'offline',
    roomOrLink: 'Phòng Hội Thảo VIP - Tầng 10',
    status: 'confirmed',
  },
  {
    id: 'IV-2026-07',
    candidateName: 'Lê Hoàng Cường',
    candidateEmail: 'cuong.le@gmail.com',
    candidatePhone: '0908 765 432',
    candidateAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=120&auto=format&fit=crop',
    position: 'Senior Backend Engineer (Go/Python)',
    date: '2026-10-16', // Thứ 6
    dayLabel: 'Thứ 6',
    startTime: '15:00',
    endTime: '16:00',
    round: 'Vòng Trao đổi Offer & Lộ trình phát triển',
    interviewers: ['Trần Thị Recruiter', 'Nguyễn Tiến Dũng (Engineering Director)'],
    type: 'online',
    roomOrLink: 'https://meet.google.com/offer-cuong-le',
    status: 'confirmed',
  },
];

// Danh sách các ngày trong tuần (Thứ 2 đến Thứ 7)
const WEEK_DAYS = [
  { key: '2026-10-12', label: 'Thứ 2', dateDisplay: '12/10' },
  { key: '2026-10-13', label: 'Thứ 3', dateDisplay: '13/10' },
  { key: '2026-10-14', label: 'Thứ 4', dateDisplay: '14/10' },
  { key: '2026-10-15', label: 'Thứ 5', dateDisplay: '15/10' },
  { key: '2026-10-16', label: 'Thứ 6', dateDisplay: '16/10' },
  { key: '2026-10-17', label: 'Thứ 7', dateDisplay: '17/10' },
];

export default function RecruiterInterviewsPage() {
  const [interviews, setInterviews] = useState<InterviewSession[]>(INITIAL_INTERVIEWS);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [toast, setToast] = useState<string | null>(null);

  // Modal 1: Đặt lịch phỏng vấn thông minh (2 Tab: 1-1 & Hàng loạt)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleTab, setScheduleTab] = useState<'individual' | 'bulk'>('individual');

  // Form Đặt lịch cá nhân 1-1 State
  const [individualForm, setIndividualForm] = useState({
    candidateName: '',
    candidateEmail: '',
    candidatePhone: '',
    position: 'Senior Backend Engineer (Go/Python)',
    round: 'Vòng 2: Kỹ thuật chuyên sâu',
    date: '2026-10-12',
    startTime: '14:00',
    endTime: '15:00',
    interviewer: 'Nguyễn Tiến Dũng (Engineering Director)',
    type: 'offline' as InterviewType,
    room: 'Phòng Họp Sáng Tạo - Tầng 8 (Keangnam)',
    meetLink: 'https://meet.google.com/new-interview-link',
    notes: '',
  });

  // Form Đặt lịch hàng loạt (Bulk) State
  const [bulkForm, setBulkForm] = useState({
    date: '2026-10-16',
    sessionTime: 'afternoon', // afternoon: 13:30 - 17:30
    slotDurationMinutes: 30,
    interviewer: 'Trần Thị Recruiter & Phạm Văn Tuấn (Tech Lead)',
    type: 'online' as InterviewType,
    selectedCandidates: ['Vũ Đức Thịnh', 'Đỗ Thùy Trang', 'Nguyễn Tuấn Kiệt', 'Đặng Quốc Huy'],
  });

  // Modal 2: Dời lịch (Reschedule Modal)
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedSessionForReschedule, setSelectedSessionForReschedule] = useState<InterviewSession | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('2026-10-14');
  const [rescheduleStartTime, setRescheduleStartTime] = useState('15:30');
  const [rescheduleEndTime, setRescheduleEndTime] = useState('16:30');
  const [rescheduleReason, setRescheduleReason] = useState('Người phỏng vấn trùng lịch họp khẩn cấp từ Ban Giám Đốc');

  // Modal 3: Hủy lịch (Cancel Modal)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedSessionForCancel, setSelectedSessionForCancel] = useState<InterviewSession | null>(null);
  const [cancelReason, setCancelReason] = useState('Ứng viên thông báo rút hồ sơ do đã nhận việc tại đối tác');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // ==========================================
  // SMART CONFLICT DETECTION (User Story 3)
  // ==========================================
  // Phát hiện xung đột lịch họp nếu người phỏng vấn hoặc phòng họp đã có lịch lúc đó
  const conflictDetection = useMemo(() => {
    if (scheduleTab !== 'individual') return null;

    const { date, startTime, endTime, interviewer, type, room } = individualForm;

    // Tìm xem interviewer đã có ca nào trong khung giờ này chưa
    const interviewerConflict = interviews.find((session) => {
      if (session.status === 'cancelled') return false;
      if (session.date !== date) return false;
      const isInterviewerBusy = session.interviewers.some((i) => i.includes(interviewer.split(' ')[0]));
      // Đơn giản hóa so sánh khung giờ trùng
      const isTimeOverlapping = session.startTime === startTime || session.endTime === endTime;
      return isInterviewerBusy && isTimeOverlapping;
    });

    // Tìm xem phòng họp offline đã có ai đặt chưa
    const roomConflict =
      type === 'offline'
        ? interviews.find((session) => {
            if (session.status === 'cancelled') return false;
            if (session.date !== date) return false;
            return session.type === 'offline' && session.roomOrLink === room && session.startTime === startTime;
          })
        : null;

    if (interviewerConflict) {
      return {
        type: 'interviewer',
        message: `⚠️ Cảnh báo trùng lịch: Người phỏng vấn "${interviewer}" đã có lịch phỏng vấn (${interviewerConflict.candidateName} - ${interviewerConflict.position}) lúc ${interviewerConflict.startTime} - ${interviewerConflict.endTime} ngày ${date}!`,
        suggestedTime: '15:30 - 16:30',
      };
    }

    if (roomConflict) {
      return {
        type: 'room',
        message: `⚠️ Cảnh báo phòng họp bận: "${room}" đã được đặt trước lúc ${roomConflict.startTime} cho ca khác!`,
        suggestedRoom: 'Phòng Hội Thảo VIP - Tầng 10',
      };
    }

    return null;
  }, [individualForm, interviews, scheduleTab]);

  // ==========================================
  // HANDLERS
  // ==========================================

  // Submit Đặt lịch cá nhân 1-1
  const handleSaveIndividualSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!individualForm.candidateName.trim()) {
      alert('Vui lòng nhập tên ứng viên');
      return;
    }

    const newSession: InterviewSession = {
      id: `IV-${Date.now().toString().slice(-4)}`,
      candidateName: individualForm.candidateName,
      candidateEmail: individualForm.candidateEmail || 'candidate@gmail.com',
      candidatePhone: individualForm.candidatePhone || '0900 123 456',
      candidateAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop',
      position: individualForm.position,
      date: individualForm.date,
      dayLabel: 'Thứ 2',
      startTime: individualForm.startTime,
      endTime: individualForm.endTime,
      round: individualForm.round,
      interviewers: [individualForm.interviewer, 'Trần Thị Recruiter'],
      type: individualForm.type,
      roomOrLink: individualForm.type === 'offline' ? individualForm.room : individualForm.meetLink,
      status: 'confirmed',
      notes: individualForm.notes,
    };

    setInterviews([newSession, ...interviews]);
    setIsScheduleModalOpen(false);
    showToast(
      `Đã đặt lịch phỏng vấn cho ứng viên "${newSession.candidateName}". Hệ thống đã tự động gửi email thư mời (kèm file .ics) cho các bên!`
    );
  };

  // Submit Đặt lịch hàng loạt (Bulk Scheduling)
  const handleSaveBulkSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const count = bulkForm.selectedCandidates.length;

    // Giả lập tạo các ca phỏng vấn liên tiếp
    const newSessions: InterviewSession[] = bulkForm.selectedCandidates.map((cand, idx) => {
      const startHour = 13 + Math.floor((30 + idx * 30) / 60);
      const startMin = (30 + idx * 30) % 60;
      const endHour = 13 + Math.floor((60 + idx * 30) / 60);
      const endMin = (60 + idx * 30) % 60;

      const formatTime = (h: number, m: number) =>
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

      return {
        id: `IV-BULK-${idx + 1}`,
        candidateName: cand,
        candidateEmail: `${cand.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
        candidatePhone: '0988 000 111',
        candidateAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop',
        position: 'Senior Backend Engineer (Go/Python)',
        date: bulkForm.date,
        dayLabel: 'Thứ 6',
        startTime: formatTime(startHour, startMin),
        endTime: formatTime(endHour, endMin),
        round: 'Vòng 1: Phỏng vấn nhanh (Batch Speed Interview)',
        interviewers: [bulkForm.interviewer],
        type: bulkForm.type,
        roomOrLink: 'https://meet.google.com/batch-interview-room',
        status: 'confirmed',
        notes: `Ca số ${idx + 1} trong đợt phỏng vấn hàng loạt chiều ngày ${bulkForm.date}`,
      };
    });

    setInterviews([...newSessions, ...interviews]);
    setIsScheduleModalOpen(false);
    showToast(
      `Đã tự động chia ca và đặt lịch thành công cho ${count} ứng viên! Email lịch hẹn đã được gửi tới từng ứng viên.`
    );
  };

  // Mở popup Dời lịch (Reschedule)
  const handleOpenReschedule = (session: InterviewSession) => {
    setSelectedSessionForReschedule(session);
    setRescheduleDate(session.date);
    setRescheduleStartTime(session.startTime);
    setRescheduleEndTime(session.endTime);
    setIsRescheduleModalOpen(true);
  };

  // Xác nhận Dời lịch
  const handleConfirmReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionForReschedule) return;

    setInterviews((prev) =>
      prev.map((s) => {
        if (s.id === selectedSessionForReschedule.id) {
          return {
            ...s,
            date: rescheduleDate,
            startTime: rescheduleStartTime,
            endTime: rescheduleEndTime,
            status: 'rescheduled',
            rescheduleReason: rescheduleReason,
          };
        }
        return s;
      })
    );

    setIsRescheduleModalOpen(false);
    showToast(
      `Đã dời lịch phỏng vấn của "${selectedSessionForReschedule.candidateName}". Đã gửi email cập nhật thời gian mới cho Ứng viên và Hội đồng phỏng vấn!`
    );
  };

  // Mở popup Hủy lịch (Cancel)
  const handleOpenCancel = (session: InterviewSession) => {
    setSelectedSessionForCancel(session);
    setIsCancelModalOpen(true);
  };

  // Xác nhận Hủy lịch
  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionForCancel) return;

    setInterviews((prev) =>
      prev.map((s) => {
        if (s.id === selectedSessionForCancel.id) {
          return {
            ...s,
            status: 'cancelled',
            cancelReason: cancelReason,
          };
        }
        return s;
      })
    );

    setIsCancelModalOpen(false);
    showToast(
      `Đã hủy ca phỏng vấn của "${selectedSessionForCancel.candidateName}". Đã gửi email thông báo hủy và thư cảm ơn cho các bên!`
    );
  };

  // ==========================================
  // FILTERING LOGIC
  // ==========================================
  const filteredInterviews = useMemo(() => {
    return interviews.filter((s) => {
      const matchSearch =
        s.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.interviewers.some((i) => i.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchType = typeFilter === 'all' || s.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [interviews, searchTerm, typeFilter]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = interviews.length;
    const confirmed = interviews.filter((s) => s.status === 'confirmed').length;
    const online = interviews.filter((s) => s.type === 'online').length;
    const offline = interviews.filter((s) => s.type === 'offline').length;
    const rescheduled = interviews.filter((s) => s.status === 'rescheduled').length;
    return { total, confirmed, online, offline, rescheduled };
  }, [interviews]);

  return (
    <div className="space-y-6 antialiased font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* 1. TOP HEADER & PRIMARY ACTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
            <Link href="/recruiter" className="hover:text-blue-600 transition-colors">
              Recruiter Workspace
            </Link>
            <span>&rsaquo;</span>
            <span className="text-slate-700 font-bold">Lịch phỏng vấn</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="w-8 h-8 text-blue-600" />
            <span>Lịch Phỏng Vấn Tuyển Dụng</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Điều phối hội đồng phỏng vấn, tạo link Google Meet, xếp lịch 1-1 hoặc hàng loạt và cảnh báo trùng lịch.
          </p>
        </div>

        {/* Nút Đặt lịch phỏng vấn (User Story 2) */}
        <button
          type="button"
          onClick={() => {
            setScheduleTab('individual');
            setIsScheduleModalOpen(true);
          }}
          className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 flex items-center gap-2.5 transition-all transform active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Đặt Lịch Phỏng Vấn</span>
        </button>
      </div>

      {/* 2. STATS KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
          <div className="text-slate-400 text-xs font-bold flex items-center justify-between">
            <span>Tổng ca tuần này</span>
            <CalendarIcon className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{stats.total} ca</div>
          <p className="text-[11px] text-slate-400">{stats.confirmed} ca đã xác nhận tham gia</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
          <div className="text-blue-600 text-xs font-bold flex items-center justify-between">
            <span>Phỏng vấn Online (Meet)</span>
            <Video className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-700">{stats.online} ca</div>
          <p className="text-[11px] text-blue-600/80">Google Meet tự động tạo link</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
          <div className="text-emerald-600 text-xs font-bold flex items-center justify-between">
            <span>Trực tiếp tại văn phòng</span>
            <MapPin className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700">{stats.offline} ca</div>
          <p className="text-[11px] text-emerald-600/80">Keangnam Landmark 72</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
          <div className="text-amber-600 text-xs font-bold flex items-center justify-between">
            <span>Đã dời / Thay đổi</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700">{stats.rescheduled} ca</div>
          <p className="text-[11px] text-amber-600/80">Đã cập nhật email cho các bên</p>
        </div>
      </div>

      {/* 3. TOOLBAR & VIEW SWITCHER (CALENDAR VIEW / LIST VIEW - User Story 1) */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search & Type filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo ứng viên, vị trí, interviewer..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              <option value="all">Tất cả hình thức</option>
              <option value="online">🎥 Online (Google Meet)</option>
              <option value="offline">🏢 Trực tiếp tại văn phòng</option>
            </select>
          </div>
        </div>

        {/* View Switcher: Calendar View vs List View (User Story 1) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={clsx(
                'px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer',
                viewMode === 'calendar'
                  ? 'bg-white text-blue-600 shadow-xs font-extrabold'
                  : 'hover:text-slate-900'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Xem theo Tuần (Calendar)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={clsx(
                'px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer',
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-xs font-extrabold'
                  : 'hover:text-slate-900'
              )}
            >
              <List className="w-4 h-4" />
              <span>Dạng Danh Sách (List)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. MAIN CONTENT: CALENDAR VIEW OR LIST VIEW */}
      {viewMode === 'calendar' ? (
        /* CALENDAR VIEW (LƯỚI LỊCH TUẦN THỨ 2 -> THỨ 7) */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-sm">
                Tuần: 12/10/2026 &mdash; 17/10/2026
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                Tuần hiện tại
              </span>
            </div>
            <div className="flex items-center gap-1 text-slate-400 text-xs">
              <span>* Giờ làm việc phỏng vấn: 08:30 - 17:30</span>
            </div>
          </div>

          {/* Lưới 6 ngày trong tuần */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            {WEEK_DAYS.map((day) => {
              const daySessions = filteredInterviews.filter((s) => s.date === day.key);

              return (
                <div
                  key={day.key}
                  className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-3 flex flex-col min-h-[420px] space-y-2.5"
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
                    <div>
                      <span className="font-black text-slate-900 block">{day.label}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{day.dateDisplay}</span>
                    </div>
                    <span
                      className={clsx(
                        'text-[10px] font-black px-2 py-0.5 rounded-full',
                        daySessions.length > 0
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-200/60 text-slate-500'
                      )}
                    >
                      {daySessions.length} ca
                    </span>
                  </div>

                  {/* Sessions in day */}
                  <div className="space-y-2.5 flex-1">
                    {daySessions.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-[11px] border border-dashed border-slate-200 rounded-xl bg-white/40">
                        Trống lịch
                      </div>
                    ) : (
                      daySessions.map((session) => (
                        <div
                          key={session.id}
                          className={clsx(
                            'p-3 rounded-2xl border shadow-xs transition-all space-y-2 text-xs relative group',
                            session.status === 'cancelled'
                              ? 'bg-slate-100 border-slate-200 opacity-60'
                              : session.status === 'rescheduled'
                              ? 'bg-amber-50/60 border-amber-200'
                              : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                          )}
                        >
                          {/* Time & Type icon */}
                          <div className="flex items-center justify-between">
                            <span className="font-black text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {session.startTime} - {session.endTime}
                            </span>
                            {session.type === 'online' ? (
                              <span title="Phỏng vấn Google Meet" className="text-blue-600">
                                <Video className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span title="Phỏng vấn tại văn phòng" className="text-emerald-600">
                                <MapPin className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>

                          {/* Candidate Name & Position */}
                          <div>
                            <h4 className="font-extrabold text-xs text-slate-900 line-clamp-1">
                              {session.candidateName}
                            </h4>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">
                              {session.position}
                            </p>
                          </div>

                          {/* Room or Link snippet */}
                          <div className="text-[10px] text-slate-600 font-medium truncate bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                            {session.type === 'online' ? (
                              <span className="text-blue-600 truncate block">Google Meet Link</span>
                            ) : (
                              <span className="truncate block">{session.roomOrLink}</span>
                            )}
                          </div>

                          {/* Interviewers */}
                          <div className="text-[10px] text-slate-400 truncate">
                            Hội đồng: <strong className="text-slate-700">{session.interviewers[0]?.split(' ')[0]}</strong>
                          </div>

                          {/* Action Buttons: Dời lịch & Hủy lịch (User Story 4) */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenReschedule(session)}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-600 text-[10px] font-bold transition-colors cursor-pointer"
                              title="Dời lịch phỏng vấn"
                            >
                              Dời lịch
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenCancel(session)}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-[10px] font-bold transition-colors cursor-pointer"
                              title="Hủy lịch phỏng vấn"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* LIST VIEW (DANH SÁCH CHI TIẾT TỪNG CA PHỎNG VẤN) */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {filteredInterviews.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs space-y-2">
              <CalendarIcon className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
              <p className="font-bold text-slate-700">Không có ca phỏng vấn nào phù hợp</p>
            </div>
          ) : (
            filteredInterviews.map((session) => (
              <div
                key={session.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
              >
                {/* Left: Time & Candidate info */}
                <div className="flex items-start gap-4">
                  <div className="w-14 text-center shrink-0">
                    <span className="font-black text-sm text-slate-900 block">{session.startTime}</span>
                    <span className="text-[11px] text-slate-400 block">{session.endTime}</span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[9px] font-black uppercase mt-1 inline-block">
                      {session.dayLabel}
                    </span>
                  </div>

                  {session.candidateAvatar ? (
                    <img
                      src={session.candidateAvatar}
                      alt={session.candidateName}
                      className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-2xl bg-sky-100 text-[#0284C7] font-extrabold text-base flex items-center justify-center border border-slate-200 shrink-0 select-none">
                      {(session.candidateName || "U").trim().split(" ").slice(-1)[0][0]?.toUpperCase() || "U"}
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-900">{session.candidateName}</h4>
                      <span className="text-[10px] font-mono text-slate-400">({session.id})</span>
                      {session.status === 'rescheduled' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                          Đã dời lịch
                        </span>
                      )}
                      {session.status === 'cancelled' && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                          Đã hủy
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-700">{session.position}</div>
                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3">
                      <span>Vòng: <strong>{session.round}</strong></span>
                      <span>&bull;</span>
                      <span>Hội đồng: <strong>{session.interviewers.join(', ')}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right: Room/Meet link & Action Buttons */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-end md:self-auto">
                  <div className="text-xs text-slate-600 space-y-1">
                    {session.type === 'online' ? (
                      <a
                        href={session.roomOrLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs inline-flex items-center gap-1.5 border border-blue-200 transition-colors"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Mở Google Meet</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{session.roomOrLink}</span>
                      </div>
                    )}
                  </div>

                  {/* Hành động nhanh: Dời lịch & Hủy lịch (User Story 4) */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenReschedule(session)}
                      className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-amber-50 hover:border-amber-200 text-slate-700 hover:text-amber-800 text-xs font-bold transition-all cursor-pointer"
                    >
                      Dời lịch
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenCancel(session)}
                      className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-700 hover:text-rose-700 text-xs font-bold transition-all cursor-pointer"
                    >
                      Hủy lịch
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: ĐẶT LỊCH PHỎNG VẤN THÔNG MINH (2 TAB: 1-1 & BULK) */}
      {/* ======================================================== */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col animate-in zoom-in-95 duration-200 text-xs">
            {/* Header Modal */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    Đặt Lịch Phỏng Vấn Tuyển Dụng
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Chọn đặt lịch cá nhân 1-1 hoặc xếp lịch hàng loạt cho nhiều ứng viên.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2 Tabs: Cá nhân (1-1) vs Hàng loạt (Bulk Scheduling) - User Story 2 */}
            <div className="px-6 pt-4 border-b border-slate-100 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setScheduleTab('individual')}
                className={clsx(
                  'pb-3 font-extrabold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2',
                  scheduleTab === 'individual'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                )}
              >
                <User className="w-4 h-4" />
                <span>Phỏng Vấn Cá Nhân (1 - 1)</span>
              </button>

              <button
                type="button"
                onClick={() => setScheduleTab('bulk')}
                className={clsx(
                  'pb-3 font-extrabold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2',
                  scheduleTab === 'bulk'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                )}
              >
                <Users className="w-4 h-4" />
                <span>Phỏng Vấn Hàng Loạt (Bulk Scheduling)</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {scheduleTab === 'individual' ? (
                /* TAB 1: CÁ NHÂN (1-1) */
                <form onSubmit={handleSaveIndividualSchedule} className="space-y-4">
                  {/* CẢNH BÁO TRÙNG LỊCH MÀU VÀNG/ĐỎ (User Story 3) */}
                  {conflictDetection && (
                    <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 space-y-2 animate-in fade-in duration-200">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-extrabold text-xs text-amber-900">
                            Cảnh Báo Xung Đột Lịch Phỏng Vấn!
                          </h4>
                          <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                            {conflictDetection.message}
                          </p>
                        </div>
                      </div>

                      {/* Nút đổi sang khung giờ gợi ý */}
                      {conflictDetection.suggestedTime && (
                        <div className="pt-1 flex items-center justify-between border-t border-amber-200 text-[11px]">
                          <span className="font-medium text-amber-800">
                            Gợi ý khung giờ còn trống tiếp theo:
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const [st, et] = conflictDetection.suggestedTime.split(' - ');
                              setIndividualForm({
                                ...individualForm,
                                startTime: st,
                                endTime: et,
                              });
                            }}
                            className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-extrabold cursor-pointer"
                          >
                            Đổi sang {conflictDetection.suggestedTime}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Ứng viên & Vị trí */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        Họ và tên ứng viên *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Hoàng Đình Trọng"
                        value={individualForm.candidateName}
                        onChange={(e) =>
                          setIndividualForm({ ...individualForm, candidateName: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Vị trí ứng tuyển</label>
                      <select
                        value={individualForm.position}
                        onChange={(e) =>
                          setIndividualForm({ ...individualForm, position: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="Senior Backend Engineer (Go/Python)">
                          Senior Backend Engineer (Go/Python)
                        </option>
                        <option value="Frontend React Lead">Frontend React Lead</option>
                        <option value="Product Owner / BA Lead">Product Owner / BA Lead</option>
                        <option value="UI/UX Designer Senior">UI/UX Designer Senior</option>
                      </select>
                    </div>
                  </div>

                  {/* Người phỏng vấn (Interviewer) */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Hội đồng phỏng vấn (Interviewer) *
                    </label>
                    <select
                      value={individualForm.interviewer}
                      onChange={(e) =>
                        setIndividualForm({ ...individualForm, interviewer: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Nguyễn Tiến Dũng (Engineering Director)">
                        Nguyễn Tiến Dũng (Engineering Director)
                      </option>
                      <option value="Phạm Văn Tuấn (Tech Lead)">Phạm Văn Tuấn (Tech Lead)</option>
                      <option value="Lê Thị Bích Ngọc (CPO)">Lê Thị Bích Ngọc (CPO)</option>
                      <option value="TS. Hoàng Minh Quân (Head of AI)">
                        TS. Hoàng Minh Quân (Head of AI)
                      </option>
                    </select>
                  </div>

                  {/* Ngày & Giờ phỏng vấn */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Ngày phỏng vấn</label>
                      <input
                        type="date"
                        required
                        value={individualForm.date}
                        onChange={(e) =>
                          setIndividualForm({ ...individualForm, date: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Giờ bắt đầu</label>
                      <input
                        type="time"
                        required
                        value={individualForm.startTime}
                        onChange={(e) =>
                          setIndividualForm({ ...individualForm, startTime: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Giờ kết thúc</label>
                      <input
                        type="time"
                        required
                        value={individualForm.endTime}
                        onChange={(e) =>
                          setIndividualForm({ ...individualForm, endTime: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Hình thức: Trực tiếp hay Online */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                        <input
                          type="radio"
                          name="interviewType"
                          checked={individualForm.type === 'offline'}
                          onChange={() =>
                            setIndividualForm({ ...individualForm, type: 'offline' })
                          }
                          className="w-4 h-4 text-blue-600"
                        />
                        <span>Trực tiếp tại văn phòng</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                        <input
                          type="radio"
                          name="interviewType"
                          checked={individualForm.type === 'online'}
                          onChange={() =>
                            setIndividualForm({ ...individualForm, type: 'online' })
                          }
                          className="w-4 h-4 text-blue-600"
                        />
                        <span>Trực tuyến (Google Meet)</span>
                      </label>
                    </div>

                    {individualForm.type === 'offline' ? (
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Chọn phòng họp</label>
                        <select
                          value={individualForm.room}
                          onChange={(e) =>
                            setIndividualForm({ ...individualForm, room: e.target.value })
                          }
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                        >
                          <option value="Phòng Họp Sáng Tạo - Tầng 8 (Keangnam)">
                            Phòng Họp Sáng Tạo - Tầng 8 (Keangnam)
                          </option>
                          <option value="Phòng Hội Thảo VIP - Tầng 10">
                            Phòng Hội Thảo VIP - Tầng 10
                          </option>
                          <option value="Phòng Phỏng Vấn 102 - Tầng 5">
                            Phòng Phỏng Vấn 102 - Tầng 5
                          </option>
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Đường link Google Meet (Tự động tạo)
                        </label>
                        <input
                          type="text"
                          value={individualForm.meetLink}
                          onChange={(e) =>
                            setIndividualForm({ ...individualForm, meetLink: e.target.value })
                          }
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-blue-600"
                        />
                      </div>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsScheduleModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 cursor-pointer"
                    >
                      Xác Nhận Đặt Lịch & Gửi Thư Mời
                    </button>
                  </div>
                </form>
              ) : (
                /* TAB 2: HÀNG LOẠT (BULK SCHEDULING - User Story 2) */
                <form onSubmit={handleSaveBulkSchedule} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-900 space-y-1">
                    <h4 className="font-extrabold text-xs flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span>Xếp Lịch Phỏng Vấn Tự Động Cho Nhiều Ứng Viên</span>
                    </h4>
                    <p className="text-[11px] text-blue-800 leading-relaxed">
                      Hệ thống sẽ tự động chia đều các ca phỏng vấn (30 - 45 phút/ca) trong một buổi chiều và gửi email thông báo giờ hẹn chính xác cho từng người.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">Ngày phỏng vấn</label>
                      <input
                        type="date"
                        value={bulkForm.date}
                        onChange={(e) => setBulkForm({ ...bulkForm, date: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        Thời lượng mỗi ca
                      </label>
                      <select
                        value={bulkForm.slotDurationMinutes}
                        onChange={(e) =>
                          setBulkForm({
                            ...bulkForm,
                            slotDurationMinutes: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      >
                        <option value="30">30 phút / ứng viên</option>
                        <option value="45">45 phút / ứng viên</option>
                        <option value="60">60 phút / ứng viên</option>
                      </select>
                    </div>
                  </div>

                  {/* Danh sách ứng viên cần xếp lịch */}
                  <div className="space-y-2">
                    <label className="block font-bold text-slate-800">
                      Chọn danh sách ứng viên ({bulkForm.selectedCandidates.length} người được chọn)
                    </label>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 max-h-40 overflow-y-auto">
                      {[
                        'Vũ Đức Thịnh',
                        'Đỗ Thùy Trang',
                        'Nguyễn Tuấn Kiệt',
                        'Đặng Quốc Huy',
                        'Trần Minh Quân',
                        'Lê Thảo My',
                        'Hoàng Kim Ngân',
                      ].map((name) => {
                        const isChecked = bulkForm.selectedCandidates.includes(name);
                        return (
                          <label
                            key={name}
                            className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-slate-200/80 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setBulkForm({
                                    ...bulkForm,
                                    selectedCandidates: [...bulkForm.selectedCandidates, name],
                                  });
                                } else {
                                  setBulkForm({
                                    ...bulkForm,
                                    selectedCandidates: bulkForm.selectedCandidates.filter(
                                      (n) => n !== name
                                    ),
                                  });
                                }
                              }}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="font-bold text-slate-800 text-xs">{name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsScheduleModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 cursor-pointer"
                    >
                      Tự Động Chia Ca & Gửi Thư Mời Hàng Loạt
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: DỜI LỊCH (RESCHEDULE MODAL - User Story 4)        */}
      {/* ======================================================== */}
      {isRescheduleModalOpen && selectedSessionForReschedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-4 animate-in zoom-in-95 duration-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Dời Lịch Phỏng Vấn</h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Mã ca: {selectedSessionForReschedule.id}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRescheduleModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-extrabold text-slate-900 text-xs">
                {selectedSessionForReschedule.candidateName}
              </div>
              <div className="text-[11px] text-slate-500">
                Lịch hiện tại:{' '}
                <strong className="text-slate-800">
                  {selectedSessionForReschedule.startTime} -{' '}
                  {selectedSessionForReschedule.endTime} ({selectedSessionForReschedule.date})
                </strong>
              </div>
            </div>

            <form onSubmit={handleConfirmReschedule} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Chọn ngày mới:</label>
                <input
                  type="date"
                  required
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giờ bắt đầu mới:</label>
                  <input
                    type="time"
                    required
                    value={rescheduleStartTime}
                    onChange={(e) => setRescheduleStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giờ kết thúc mới:</label>
                  <input
                    type="time"
                    required
                    value={rescheduleEndTime}
                    onChange={(e) => setRescheduleEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Lý do dời lịch (Bắt buộc) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="Nhập lý do dời lịch..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-800 text-[11px] flex items-center gap-2 font-medium">
                <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Hệ thống sẽ tự động gửi email thông báo lịch mới tới Ứng viên & Interviewer.</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRescheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Xác Nhận Dời Lịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: HỦY LỊCH (CANCEL MODAL - User Story 4)            */}
      {/* ======================================================== */}
      {isCancelModalOpen && selectedSessionForCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-4 animate-in zoom-in-95 duration-200 text-xs">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
              <XCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-black text-base text-slate-900">Hủy Lịch Phỏng Vấn?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bạn có chắc chắn muốn hủy ca phỏng vấn của ứng viên{' '}
                <strong>{selectedSessionForCancel.candidateName}</strong>?
              </p>
            </div>

            <form onSubmit={handleConfirmCancel} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Lý do hủy lịch (Bắt buộc) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ví dụ: Ứng viên xin rút hồ sơ, Vị trí đã tuyển đủ..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-800 text-[11px] leading-relaxed">
                ⚠️ Thao tác này sẽ hủy lịch họp và tự động gửi email thông báo hủy ca cho Ứng viên và Hội đồng phỏng vấn.
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-500/20 cursor-pointer"
                >
                  Xác Nhận Hủy Lịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
