'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Filter,
  Clock,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  XCircle,
  HelpCircle,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Download,
  X,
  ExternalLink,
  Briefcase,
  User,
  ShieldAlert,
  MessageSquare,
  Check,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import clsx from 'clsx';

// ========================================================
// 1. DATA TYPES & STATUS DEFINITIONS
// ========================================================

export type ApplicationStage = 'SUBMITTED' | 'REVIEWING' | 'INTERVIEW' | 'OFFER' | 'WITHDRAWN';

export interface TimelineStep {
  id: string;
  label: string;
  description: string;
  date?: string;
  status: 'completed' | 'current' | 'upcoming';
}

export interface CandidateApplication {
  id: string; // Mã hồ sơ: APP-2026-001
  jobId: string;
  jobCode: string;
  jobTitle: string;
  department: string;
  appliedDate: string;
  salaryExpectation: string;
  resumeFileName: string;
  resumeFileSize: string;
  currentStage: ApplicationStage;
  statusBadge: {
    text: string;
    variant: 'emerald' | 'amber' | 'blue' | 'slate' | 'rose';
  };
  stageNote: string;
  withdrawReason?: string;
  withdrawnDate?: string;
  timeline: TimelineStep[];
  nextAction?: {
    text: string;
    href?: string;
    actionType?: 'view_interview' | 'view_offer';
  };
}

// ========================================================
// 2. MOCK APPLICATIONS DATA
// ========================================================

const INITIAL_APPLICATIONS: CandidateApplication[] = [
  {
    id: 'APP-2026-001',
    jobId: 'job-01',
    jobCode: 'JOB-2026-01',
    jobTitle: 'Senior Backend Engineer (Go/Python)',
    department: 'Khối Công Nghệ & Phần Mềm',
    appliedDate: '08/10/2026 - 14:30',
    salaryExpectation: '45 - 55 Triệu VNĐ',
    resumeFileName: 'Nguyen_Van_An_Backend_Senior_CV.pdf',
    resumeFileSize: '2.4 MB • PDF',
    currentStage: 'INTERVIEW',
    statusBadge: {
      text: 'Vòng Phỏng Vấn Kỹ Thuật',
      variant: 'amber',
    },
    stageNote: 'Đã xếp lịch phỏng vấn Kỹ thuật trực tuyến cùng Tech Director lúc 14:00, Thứ Tư ngày 14/10/2026.',
    timeline: [
      {
        id: 'step-1',
        label: 'Đã nộp',
        description: 'Đã tiếp nhận CV qua cổng tuyển dụng',
        date: '08/10/2026',
        status: 'completed',
      },
      {
        id: 'step-2',
        label: 'Đang xem xét',
        description: 'CV vượt qua vòng sàng lọc chuyên môn',
        date: '09/10/2026',
        status: 'completed',
      },
      {
        id: 'step-3',
        label: 'Phỏng vấn',
        description: 'Vòng 2: Kỹ thuật & System Design (14/10)',
        date: '14/10/2026',
        status: 'current',
      },
      {
        id: 'step-4',
        label: 'Offer',
        description: 'Thư mời làm việc chính thức',
        status: 'upcoming',
      },
    ],
    nextAction: {
      text: 'Xem chi tiết lịch phỏng vấn',
      href: '/candidate/interviews',
      actionType: 'view_interview',
    },
  },
  {
    id: 'APP-2026-002',
    jobId: 'job-02',
    jobCode: 'JOB-2026-02',
    jobTitle: 'Frontend React Lead (Next.js 16/React 19)',
    department: 'Khối Công Nghệ & Phần Mềm',
    appliedDate: '02/10/2026 - 09:15',
    salaryExpectation: '40 - 50 Triệu VNĐ',
    resumeFileName: 'Nguyen_Van_An_Frontend_Lead_CV.pdf',
    resumeFileSize: '2.1 MB • PDF',
    currentStage: 'OFFER',
    statusBadge: {
      text: 'Đã Nhận Thư Mời (Offer)',
      variant: 'emerald',
    },
    stageNote: 'Chúc mừng bạn! Ban Giám Đốc đã phát hành Thư mời nhận việc chính thức với mức lương 48 Triệu VNĐ.',
    timeline: [
      {
        id: 'step-1',
        label: 'Đã nộp',
        description: 'Hồ sơ ứng tuyển trực tuyến',
        date: '02/10/2026',
        status: 'completed',
      },
      {
        id: 'step-2',
        label: 'Đang xem xét',
        description: 'Phê duyệt hồ sơ bởi Hiring Manager',
        date: '04/10/2026',
        status: 'completed',
      },
      {
        id: 'step-3',
        label: 'Phỏng vấn',
        description: 'Đạt yêu cầu vòng Kỹ thuật & Văn hóa',
        date: '07/10/2026',
        status: 'completed',
      },
      {
        id: 'step-4',
        label: 'Offer',
        description: 'Đề xuất đãi ngộ: 48 Triệu VNĐ + Thưởng',
        date: '10/10/2026',
        status: 'completed',
      },
    ],
    nextAction: {
      text: 'Xem và phản hồi Thư mời Offer',
      href: '/candidate/offers',
      actionType: 'view_offer',
    },
  },
  {
    id: 'APP-2026-003',
    jobId: 'job-04',
    jobCode: 'JOB-2026-04',
    jobTitle: 'DevOps / Cloud Solutions Architect',
    department: 'Khối Vận Hành & Hạ Tầng',
    appliedDate: '05/10/2026 - 16:45',
    salaryExpectation: '38 - 48 Triệu VNĐ',
    resumeFileName: 'Nguyen_Van_An_Cloud_DevOps_CV.pdf',
    resumeFileSize: '1.9 MB • PDF',
    currentStage: 'REVIEWING',
    statusBadge: {
      text: 'Đang Xem Xét Hồ Sơ',
      variant: 'blue',
    },
    stageNote: 'Trưởng bộ phận Hạ tầng đang thẩm định các chứng chỉ AWS Solutions Architect & kinh nghiệm Kubernetes.',
    timeline: [
      {
        id: 'step-1',
        label: 'Đã nộp',
        description: 'Hệ thống đã ghi nhận hồ sơ',
        date: '05/10/2026',
        status: 'completed',
      },
      {
        id: 'step-2',
        label: 'Đang xem xét',
        description: 'Hiring Manager đang đối soát tiêu chí',
        date: '06/10/2026',
        status: 'current',
      },
      {
        id: 'step-3',
        label: 'Phỏng vấn',
        description: 'Dự kiến xếp lịch tuần tới',
        status: 'upcoming',
      },
      {
        id: 'step-4',
        label: 'Offer',
        description: 'Đề xuất đãi ngộ chính thức',
        status: 'upcoming',
      },
    ],
  },
  {
    id: 'APP-2026-004',
    jobId: 'job-03',
    jobCode: 'JOB-2026-03',
    jobTitle: 'Product Owner / BA Lead',
    department: 'Khối Phát Triển Sản Phẩm',
    appliedDate: '25/09/2026 - 11:20',
    salaryExpectation: '32 - 42 Triệu VNĐ',
    resumeFileName: 'Nguyen_Van_An_PO_CV.pdf',
    resumeFileSize: '2.0 MB • PDF',
    currentStage: 'WITHDRAWN',
    withdrawReason: 'Đã nhận việc tại một công ty công nghệ khác và ưu tiên lĩnh vực FinTech.',
    withdrawnDate: '28/09/2026',
    statusBadge: {
      text: 'Đã Rút Hồ Sơ',
      variant: 'slate',
    },
    stageNote: 'Ứng viên đã chủ động rút hồ sơ. Toàn bộ tiến trình xét duyệt đã kết thúc an toàn.',
    timeline: [
      {
        id: 'step-1',
        label: 'Đã nộp',
        description: 'Đã nộp ngày 25/09/2026',
        date: '25/09/2026',
        status: 'completed',
      },
      {
        id: 'step-2',
        label: 'Đang xem xét',
        description: 'Đã bắt đầu thẩm định',
        date: '26/09/2026',
        status: 'completed',
      },
      {
        id: 'step-3',
        label: 'Phỏng vấn',
        description: 'Đã hủy do rút hồ sơ',
        status: 'upcoming',
      },
      {
        id: 'step-4',
        label: 'Offer',
        description: 'Đã dừng xét duyệt',
        status: 'upcoming',
      },
    ],
  },
];

export default function CandidateApplicationsPage() {
  const [applications, setApplications] = useState<CandidateApplication[]>(INITIAL_APPLICATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState<string>('ALL');

  // State cho Modal Rút hồ sơ (Withdraw Modal)
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectedAppToWithdraw, setSelectedAppToWithdraw] = useState<CandidateApplication | null>(null);
  const [withdrawReasonInput, setWithdrawReasonInput] = useState('');
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Lọc và Tìm kiếm theo Mã tra cứu (APP-2026-001) hoặc Tên vị trí
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        app.id.toLowerCase().includes(q) ||
        app.jobTitle.toLowerCase().includes(q) ||
        app.jobCode.toLowerCase().includes(q) ||
        app.department.toLowerCase().includes(q);

      const matchStage =
        filterStage === 'ALL' ||
        (filterStage === 'ACTIVE' && app.currentStage !== 'WITHDRAWN') ||
        app.currentStage === filterStage;

      return matchSearch && matchStage;
    });
  }, [applications, searchQuery, filterStage]);

  // Xử lý mở Modal rút hồ sơ
  const handleOpenWithdrawModal = (app: CandidateApplication) => {
    setSelectedAppToWithdraw(app);
    setWithdrawReasonInput('');
    setWithdrawModalOpen(true);
  };

  // Xác nhận rút hồ sơ
  const handleConfirmWithdraw = () => {
    if (!selectedAppToWithdraw) return;

    setIsSubmittingWithdraw(true);
    setTimeout(() => {
      const reason = withdrawReasonInput.trim() || 'Ứng viên chủ động rút hồ sơ tuyển dụng.';
      const todayStr = '11/10/2026';

      setApplications((prev) =>
        prev.map((app) => {
          if (app.id === selectedAppToWithdraw.id) {
            return {
              ...app,
              currentStage: 'WITHDRAWN',
              withdrawReason: reason,
              withdrawnDate: todayStr,
              statusBadge: {
                text: 'Đã Rút Hồ Sơ',
                variant: 'slate',
              },
              stageNote: `Bạn đã rút hồ sơ vào ngày ${todayStr}. Lý do: "${reason}".`,
            };
          }
          return app;
        })
      );

      setIsSubmittingWithdraw(false);
      setWithdrawModalOpen(false);
      setToastMessage(`Đã rút hồ sơ "${selectedAppToWithdraw.id} - ${selectedAppToWithdraw.jobTitle}" thành công!`);

      setTimeout(() => {
        setToastMessage(null);
      }, 5000);
    }, 800);
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
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

      {/* Header & Tiêu đề trang */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
            <Link href="/candidate/jobs" className="hover:text-blue-600 transition-colors">
              Candidate Workspace
            </Link>
            <span>&rsaquo;</span>
            <span className="text-slate-700 font-bold">Hồ sơ của tôi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-blue-600" />
            <span>Theo Dõi Tiến Trình Ứng Tuyển</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Tra cứu mã hồ sơ minh bạch, theo dõi từng chặng phỏng vấn và quản lý các hồ sơ đã nộp.
          </p>
        </div>

        <Link
          href="/candidate/jobs"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Briefcase className="w-4 h-4" />
          <span>Tìm Thêm Việc Mới</span>
        </Link>
      </div>

      {/* 1. THANH TRA CỨU HỒ SƠ LỚN (TRACKING SEARCH BAR) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Large Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 text-blue-600 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nhập Mã tra cứu hồ sơ (VD: APP-2026-001) hoặc Tên vị trí..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-3.5 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Status Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="w-full md:w-auto px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Tất cả hồ sơ ({applications.length})</option>
              <option value="ACTIVE">Hồ sơ đang xử lý</option>
              <option value="REVIEWING">Đang xem xét</option>
              <option value="INTERVIEW">Đang phỏng vấn</option>
              <option value="OFFER">Đã có Offer</option>
              <option value="WITHDRAWN">Đã rút hồ sơ</option>
            </select>
          </div>
        </div>

        {/* Quick Search Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 text-[11px] text-slate-500">
          <span className="font-bold text-slate-400 shrink-0">Gợi ý mã tra cứu:</span>
          {['APP-2026-001', 'APP-2026-002', 'APP-2026-003'].map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setSearchQuery(code)}
              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 font-mono font-bold transition-colors cursor-pointer shrink-0"
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* 2. DANH SÁCH HỒ SƠ ỨNG TUYỂN DẠNG THẺ (APPLICATION CARDS) */}
      <div className="space-y-5">
        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-slate-800">Không tìm thấy hồ sơ nào phù hợp</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Vui lòng kiểm tra lại mã tra cứu hồ sơ hoặc xóa bộ lọc để hiển thị toàn bộ lịch sử ứng tuyển.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterStage('ALL');
              }}
              className="px-4 py-2 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs hover:bg-blue-100 cursor-pointer"
            >
              Đặt lại tìm kiếm
            </button>
          </div>
        ) : (
          filteredApplications.map((app) => {
            const isWithdrawn = app.currentStage === 'WITHDRAWN';
            // Điều kiện hiển thị nút "Rút hồ sơ": Đang ở vòng REVIEWING hoặc INTERVIEW
            const canWithdraw = app.currentStage === 'REVIEWING' || app.currentStage === 'INTERVIEW';

            return (
              <div
                key={app.id}
                className={clsx(
                  'rounded-3xl border transition-all duration-200 overflow-hidden shadow-xs',
                  isWithdrawn
                    ? 'bg-slate-50/70 border-slate-200/60 opacity-90'
                    : 'bg-white border-slate-200/80 hover:border-blue-400/80 hover:shadow-lg'
                )}
              >
                {/* Header Thẻ Hồ Sơ */}
                <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Mã tra cứu hồ sơ */}
                      <span className="px-3 py-1 rounded-xl bg-blue-600 text-white font-mono font-black text-xs shadow-sm shadow-blue-500/20">
                        {app.id}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 font-bold">
                        {app.jobCode}
                      </span>
                      <span
                        className={clsx(
                          'px-2.5 py-0.5 rounded-full text-[11px] font-extrabold',
                          app.statusBadge.variant === 'amber' && 'bg-amber-100 text-amber-800',
                          app.statusBadge.variant === 'emerald' && 'bg-emerald-100 text-emerald-800',
                          app.statusBadge.variant === 'blue' && 'bg-blue-100 text-blue-800',
                          app.statusBadge.variant === 'slate' && 'bg-slate-200 text-slate-600'
                        )}
                      >
                        {app.statusBadge.text}
                      </span>
                    </div>

                    <h2
                      className={clsx(
                        'text-lg sm:text-xl font-black leading-tight',
                        isWithdrawn ? 'text-slate-600' : 'text-slate-900'
                      )}
                    >
                      {app.jobTitle}
                    </h2>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {app.department}
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Nộp ngày: <strong className="text-slate-700">{app.appliedDate}</strong>
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-semibold text-slate-700">{app.resumeFileName}</span>
                      </span>
                    </div>
                  </div>

                  {/* Nút Hành Động Ở Góc Phải */}
                  <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                    {/* Nút Rút hồ sơ (Chỉ hiện khi Đang xem xét hoặc Phỏng vấn) */}
                    {canWithdraw && (
                      <button
                        type="button"
                        onClick={() => handleOpenWithdrawModal(app)}
                        className="px-3.5 py-2 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 hover:border-rose-400 text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Rút hồ sơ</span>
                      </button>
                    )}

                    {/* Nút hành động nhanh tới Phỏng vấn hoặc Offer */}
                    {app.nextAction && (
                      <Link
                        href={app.nextAction.href || '#'}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{app.nextAction.text}</span>
                        <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* 2. TRẠNG THÁI TIẾN TRÌNH (HORIZONTAL TIMELINE / STEPPER) */}
                <div className="p-5 sm:p-6 bg-slate-50/50">
                  <div className="mb-4 flex items-center justify-between text-xs">
                    <span className="font-black text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      Tiến Trình Xử Lý Hồ Sơ
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Cập nhật tự động theo thời gian thực
                    </span>
                  </div>

                  {/* Thanh Stepper 4 bước: Đã nộp -> Đang xem xét -> Phỏng vấn -> Offer */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
                    {app.timeline.map((step, idx) => {
                      const isCompleted = !isWithdrawn && step.status === 'completed';
                      const isCurrent = !isWithdrawn && step.status === 'current';
                      const isUpcoming = isWithdrawn || step.status === 'upcoming';

                      return (
                        <div
                          key={step.id}
                          className={clsx(
                            'p-3.5 rounded-2xl border transition-all flex flex-col justify-between relative',
                            isCompleted && 'bg-white border-emerald-200 shadow-xs',
                            isCurrent && 'bg-white border-amber-300 ring-2 ring-amber-100 shadow-md',
                            isUpcoming && !isWithdrawn && 'bg-slate-100/70 border-slate-200/70',
                            isWithdrawn && 'bg-slate-100/50 border-slate-200 text-slate-400'
                          )}
                        >
                          <div>
                            {/* Icon & Số thứ tự bước */}
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-black uppercase font-mono tracking-wider text-slate-400">
                                BƯỚC 0{idx + 1}
                              </span>

                              {isCompleted && (
                                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </span>
                              )}
                              {isCurrent && (
                                <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs animate-pulse">
                                  <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                                </span>
                              )}
                              {isUpcoming && (
                                <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-[10px] font-bold">
                                  {idx + 1}
                                </span>
                              )}
                            </div>

                            {/* Tên bước */}
                            <h4
                              className={clsx(
                                'text-xs sm:text-sm font-black leading-tight',
                                isCompleted && 'text-emerald-800',
                                isCurrent && 'text-amber-800',
                                isUpcoming && 'text-slate-500'
                              )}
                            >
                              {step.label}
                            </h4>

                            {/* Mô tả bước */}
                            <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-2">
                              {step.description}
                            </p>
                          </div>

                          {/* Ngày hoàn thành / dự kiến */}
                          {step.date && (
                            <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] font-mono font-bold text-slate-400">
                              {step.date}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Khối Ghi chú tiến độ hoặc Lý do rút hồ sơ */}
                  <div className="mt-4 p-3.5 rounded-2xl bg-white border border-slate-200 text-xs flex items-start gap-2.5">
                    {isWithdrawn ? (
                      <>
                        <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-700 font-bold">Trạng thái hồ sơ: </strong>
                          <span className="text-slate-500">
                            Hồ sơ đã được rút vào ngày {app.withdrawnDate}. Lý do: &ldquo;{app.withdrawReason}&rdquo;
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-800 font-bold">Ghi chú từ HR: </strong>
                          <span className="text-slate-600">{app.stageNote}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ======================================================== */}
      {/* 3. MODAL XÁC NHẬN RÚT HỒ SƠ ỨNG TUYỂN (WITHDRAW CONFIRMATION) */}
      {/* ======================================================== */}
      {withdrawModalOpen && selectedAppToWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Icon & Header */}
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  Xác Nhận Rút Hồ Sơ Ứng Tuyển
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Bạn có chắc chắn muốn rút hồ sơ cho vị trí{' '}
                  <strong className="text-slate-800">
                    {selectedAppToWithdraw.jobTitle}
                  </strong>{' '}
                  (Mã: {selectedAppToWithdraw.id})?
                </p>
              </div>
            </div>

            {/* Cảnh báo không thể hoàn tác */}
            <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200 text-xs text-rose-800 leading-relaxed space-y-1">
              <div className="font-extrabold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Lưu ý quan trọng:</span>
              </div>
              <p className="text-[11px] text-rose-700">
                Quá trình rút hồ sơ không thể hoàn tác. Hội đồng tuyển dụng sẽ lập tức ngừng xét duyệt và hủy mọi lịch hẹn phỏng vấn liên quan.
              </p>
            </div>

            {/* Textarea: Lý do rút hồ sơ (Không bắt buộc) */}
            <div className="space-y-1.5 text-xs">
              <label className="block font-extrabold text-slate-800">
                Lý do rút hồ sơ (Không bắt buộc):
              </label>
              <textarea
                rows={3}
                value={withdrawReasonInput}
                onChange={(e) => setWithdrawReasonInput(e.target.value)}
                placeholder="Ví dụ: Đã nhận việc nơi khác, thay đổi định hướng cá nhân hoặc kế hoạch gia đình..."
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:border-rose-400 focus:bg-white transition-all resize-none"
              />
              <span className="text-[10px] text-slate-400">
                Thông tin này giúp chúng tôi hoàn thiện hơn chất lượng trải nghiệm tuyển dụng.
              </span>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 text-xs">
              <button
                type="button"
                onClick={() => setWithdrawModalOpen(false)}
                className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 font-extrabold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Hủy bỏ (Giữ hồ sơ)
              </button>

              <button
                type="button"
                disabled={isSubmittingWithdraw}
                onClick={handleConfirmWithdraw}
                className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-extrabold shadow-lg shadow-rose-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                {isSubmittingWithdraw ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Xác Nhận Rút Hồ Sơ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
