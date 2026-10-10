'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  Video,
  FileText,
  User,
  Users,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Plus,
} from 'lucide-react';
import clsx from 'clsx';

interface InterviewItem {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  positionTitle: string;
  department: string;
  round: string;
  dateLabel: string;
  time: string;
  meetingPlatform: string;
  meetingUrl: string;
  interviewers: { name: string; role: string }[];
  cvUrl: string;
  status: 'UPCOMING' | 'TODAY' | 'COMPLETED';
}

const MOCK_INTERVIEWS: InterviewItem[] = [
  {
    id: 'INT-001',
    candidateName: 'Nguyễn Quốc Bảo',
    candidateEmail: 'bao.nguyen@devtech.io',
    candidatePhone: '0912 345 678',
    positionTitle: 'Senior Frontend Engineer (React/Next.js)',
    department: 'Khối Công Nghệ & Phần Mềm',
    round: 'Vòng 2: Chuyên Sâu Kiến Trúc Frontend & System Design',
    dateLabel: 'Hôm nay - Thứ Bảy, 10/01/2026',
    time: '14:30 - 15:30',
    meetingPlatform: 'Microsoft Teams',
    meetingUrl: 'https://teams.microsoft.com/l/meetup-join/int001',
    interviewers: [
      { name: 'Lê Trưởng Nhóm', role: 'Hiring Manager (Lead)' },
      { name: 'Nguyễn Thị Thu Hà', role: 'HR Manager' },
    ],
    cvUrl: '#',
    status: 'TODAY',
  },
  {
    id: 'INT-002',
    candidateName: 'Trần Văn Hoàng',
    candidateEmail: 'hoang.tran@cloudinfra.com',
    candidatePhone: '0933 887 665',
    positionTitle: 'DevOps / Site Reliability Engineer (SRE)',
    department: 'Khối Công Nghệ & Phần Mềm',
    round: 'Vòng 1: Kỹ Năng Kubernetes & CI/CD Pipeline',
    dateLabel: 'Hôm nay - Thứ Bảy, 10/01/2026',
    time: '16:00 - 17:00',
    meetingPlatform: 'Google Meet',
    meetingUrl: 'https://meet.google.com/xyz-tech-ats',
    interviewers: [
      { name: 'Lê Trưởng Nhóm', role: 'Hiring Manager' },
      { name: 'Phan Văn Hải', role: 'DevOps Lead' },
    ],
    cvUrl: '#',
    status: 'TODAY',
  },
  {
    id: 'INT-003',
    candidateName: 'Vũ Hải Đăng',
    candidateEmail: 'dang.vu@techhub.vn',
    candidatePhone: '0988 776 554',
    positionTitle: 'Senior Backend Engineer (Golang/FastAPI)',
    department: 'Khối Công Nghệ & Phần Mềm',
    round: 'Vòng 2: Văn Hóa Làm Việc & Trao Đổi Đãi Ngộ',
    dateLabel: 'Thứ Hai, 12/01/2026',
    time: '10:00 - 11:00',
    meetingPlatform: 'Microsoft Teams',
    meetingUrl: 'https://teams.microsoft.com/l/meetup-join/int003',
    interviewers: [
      { name: 'Lê Trưởng Nhóm', role: 'Hiring Manager' },
      { name: 'Trần Văn Đức', role: 'CTO' },
    ],
    cvUrl: '#',
    status: 'UPCOMING',
  },
  {
    id: 'INT-004',
    candidateName: 'Phạm Thu Thảo',
    candidateEmail: 'thao.pham@designlab.co',
    candidatePhone: '0903 221 443',
    positionTitle: 'Chuyên viên Thiết Kế Trải Nghiệm (UI/UX Designer)',
    department: 'Khối Công Nghệ & Phần Mềm',
    round: 'Vòng 1: Đánh Giá Portfolio & Design System',
    dateLabel: '08/01/2026',
    time: '09:00 - 10:00',
    meetingPlatform: 'Microsoft Teams',
    meetingUrl: 'https://teams.microsoft.com/l/meetup-join/int004',
    interviewers: [
      { name: 'Lê Trưởng Nhóm', role: 'Hiring Manager' },
    ],
    cvUrl: '#',
    status: 'COMPLETED',
  },
];

export default function InterviewsPage() {
  const [tabFilter, setTabFilter] = useState<'ALL' | 'TODAY' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filtered = MOCK_INTERVIEWS.filter((item) => {
    if (tabFilter === 'TODAY' && item.status !== 'TODAY') return false;
    if (tabFilter === 'UPCOMING' && item.status !== 'UPCOMING') return false;
    if (tabFilter === 'COMPLETED' && item.status !== 'COMPLETED') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.candidateName.toLowerCase().includes(q) ||
        item.positionTitle.toLowerCase().includes(q) ||
        item.round.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const todayCount = MOCK_INTERVIEWS.filter((i) => i.status === 'TODAY').length;
  const upcomingCount = MOCK_INTERVIEWS.filter((i) => i.status === 'UPCOMING').length;

  const handleJoinMeeting = (meetingUrl: string, candidateName: string) => {
    setToastMessage(`Đang mở liên kết phòng họp cho ứng viên ${candidateName}...`);
    window.open(meetingUrl, '_blank');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[10px] uppercase tracking-wider">
              Lịch Phỏng Vấn Trực Tiếp
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Lịch Phỏng Vấn Của Trưởng Bộ Phận
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý các buổi phỏng vấn trực tuyến và trực tiếp, liên kết phòng họp MS Teams/Google Meet.
          </p>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-900 text-xs">
            <span className="text-[10px] uppercase font-bold text-blue-700 block">Hôm nay</span>
            <span className="text-xl font-black text-blue-700">{todayCount} buổi</span>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-900 text-xs">
            <span className="text-[10px] uppercase font-bold text-indigo-700 block">Sắp diễn ra</span>
            <span className="text-xl font-black text-indigo-700">{upcomingCount} buổi</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên ứng viên, vị trí tuyển..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
          <button
            onClick={() => setTabFilter('ALL')}
            className={clsx(
              'px-3 py-1.5 rounded-lg transition-all cursor-pointer',
              tabFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Tất cả ({MOCK_INTERVIEWS.length})
          </button>
          <button
            onClick={() => setTabFilter('TODAY')}
            className={clsx(
              'px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5',
              tabFilter === 'TODAY'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Hôm nay ({todayCount})</span>
          </button>
          <button
            onClick={() => setTabFilter('UPCOMING')}
            className={clsx(
              'px-3 py-1.5 rounded-lg transition-all cursor-pointer',
              tabFilter === 'UPCOMING'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Sắp tới ({upcomingCount})
          </button>
          <button
            onClick={() => setTabFilter('COMPLETED')}
            className={clsx(
              'px-3 py-1.5 rounded-lg transition-all cursor-pointer',
              tabFilter === 'COMPLETED'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Đã hoàn thành
          </button>
        </div>
      </div>

      {/* INTERVIEWS LIST CARDS */}
      <div className="space-y-4">
        {filtered.map((item) => {
          const isToday = item.status === 'TODAY';
          const isCompleted = item.status === 'COMPLETED';

          return (
            <div
              key={item.id}
              className={clsx(
                'bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-5',
                isToday
                  ? 'border-blue-200 ring-2 ring-blue-500/10 shadow-sm'
                  : 'border-slate-100 hover:border-slate-200'
              )}
            >
              {/* Left Info */}
              <div className="flex items-start gap-4">
                <div
                  className={clsx(
                    'w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold shrink-0 shadow-xs',
                    isToday
                      ? 'bg-blue-600 text-white shadow-blue-500/20'
                      : isCompleted
                      ? 'bg-slate-100 text-slate-500'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  )}
                >
                  <Calendar className="w-4 h-4 mb-0.5" />
                  <span className="text-[10px] uppercase font-black">
                    {isToday ? 'Hôm nay' : 'Sắp tới'}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{item.candidateName}</span>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="text-xs text-slate-500">{item.candidateEmail}</span>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="text-xs text-slate-500">{item.candidatePhone}</span>
                  </div>

                  <div className="font-bold text-xs text-slate-800">
                    {item.positionTitle}
                  </div>

                  <div className="text-xs text-blue-600 font-medium">
                    {item.round}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1 font-semibold text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.dateLabel} ({item.time})</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Hội đồng: {item.interviewers.map((i) => i.name).join(', ')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                <Link
                  href="/manager/evaluations"
                  className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Phiếu Đánh Giá</span>
                </Link>

                {!isCompleted && (
                  <button
                    onClick={() => handleJoinMeeting(item.meetingUrl, item.candidateName)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
                  >
                    <Video className="w-4 h-4" />
                    <span>Tham Gia Họp ({item.meetingPlatform})</span>
                  </button>
                )}

                {isCompleted && (
                  <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Đã phỏng vấn xong</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
