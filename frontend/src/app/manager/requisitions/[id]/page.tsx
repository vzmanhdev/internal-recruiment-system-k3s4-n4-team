'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ManagerAppShell } from '@/components/layout/ManagerAppShell';
import {
  ChevronLeft,
  Copy,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Users,
  Briefcase,
  DollarSign,
  Calendar,
  Send,
  Building,
  ArrowRight,
  ShieldCheck,
  Check,
  ExternalLink,
  Award,
  TrendingUp,
  FileText,
  Bell,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';

// =============================================================================
// MOCK DATA: REQUISITION DETAILS & PIPELINE
// =============================================================================
const MOCK_REQUISITION_DATA: Record<
  string,
  {
    id: string;
    title: string;
    department: string;
    level: string;
    workType: string;
    targetCount: number;
    hiredCount: number;
    salaryRange: string;
    createdAt: string;
    targetDate: string;
    reason: string;
    status: 'Pending' | 'Active' | 'Closed';
    description: string;
    requirements: string;
    pipeline: {
      submitted: number;
      screening: number;
      interview: number;
      offered: number;
      hired: number;
    };
    approvalSteps: Array<{
      stepNumber: number;
      stepName: string;
      approverName: string;
      approverRole: string;
      department: string;
      status: 'APPROVED' | 'IN_PROGRESS' | 'PENDING';
      timestamp?: string;
      waitingTime?: string;
      isOverdue?: boolean;
      comment?: string;
      avatarColor: string;
      initials: string;
    }>;
  }
> = {
  'REQ-2026-003': {
    id: 'REQ-2026-003',
    title: 'Senior Backend Engineer (Golang/Python)',
    department: 'Phòng Phát Triển Công Nghệ & Phần Mềm',
    level: 'Senior',
    workType: 'Toàn thời gian (Full-time)',
    targetCount: 2,
    hiredCount: 1,
    salaryRange: '35.000.000 - 50.000.000 VNĐ',
    createdAt: '15/01/2026',
    targetDate: '28/02/2026',
    reason: 'Bổ sung định biên sprint Q1 mở rộng Core Services',
    status: 'Pending',
    description:
      'Chịu trách nhiệm thiết kế và triển khai kiến trúc vi dịch vụ (Microservices) chịu tải cao với Golang và Python FastAPI. Tối ưu hóa truy vấn cơ sở dữ liệu phân tán, tích hợp Kafka message queue và đảm bảo SLA 99.99% cho nền tảng tuyển dụng nội bộ.',
    requirements:
      '- Tối thiểu 4 năm kinh nghiệm phát triển phần mềm với Golang hoặc Python.\n- Hiểu sâu về Database (PostgreSQL, Redis), caching strategies, distributed transaction.\n- Thành thạo Docker, Kubernetes, CI/CD pipeline và monitoring (Prometheus, Grafana).\n- Tư duy giải quyết vấn đề hệ thống tốt, tinh thần trách nhiệm cao và khả năng mentoring đồng nghiệp.',
    pipeline: {
      submitted: 120,
      screening: 15,
      interview: 5,
      offered: 2,
      hired: 1,
    },
    approvalSteps: [
      {
        stepNumber: 1,
        stepName: 'Trưởng bộ phận tạo đề xuất',
        approverName: 'Lê Trưởng Nhóm',
        approverRole: 'Hiring Manager (Người đề xuất)',
        department: 'Khối Công Nghệ',
        status: 'APPROVED',
        timestamp: '15/01/2026 - 09:30',
        comment: 'Đã hoàn tất JD chuẩn và cân đối định mức dự án Core Services.',
        avatarColor: 'bg-blue-600',
        initials: 'LT',
      },
      {
        stepNumber: 2,
        stepName: 'Giám đốc khối phê duyệt định biên',
        approverName: 'Trần Văn Giám Đốc',
        approverRole: 'Giám Đốc Khối Công Nghệ (Head of Tech)',
        department: 'Khối Công Nghệ',
        status: 'APPROVED',
        timestamp: '16/01/2026 - 14:15',
        comment: 'Đồng ý bổ sung 2 headcount cho team Backend theo kế hoạch Q1.',
        avatarColor: 'bg-indigo-600',
        initials: 'TG',
      },
      {
        stepNumber: 3,
        stepName: 'Trưởng phòng HR thẩm định & cấp dải lương',
        approverName: 'Nguyễn Thị Thu Hà',
        approverRole: 'Trưởng phòng Nhân sự (HR Manager)',
        department: 'Phòng Quản Trị Nhân Sự (HR)',
        status: 'IN_PROGRESS',
        waitingTime: 'Đang chờ xử lý: 3 ngày 6 giờ (Quá SLA 1 ngày)',
        isOverdue: true,
        comment: 'Đang thẩm định dải lương 35-50 triệu so với khung quy chế công ty.',
        avatarColor: 'bg-amber-600',
        initials: 'TH',
      },
      {
        stepNumber: 4,
        stepName: 'Tổng Giám đốc ký duyệt ban hành (BOD)',
        approverName: 'Phạm Hoàng Nam',
        approverRole: 'Tổng Giám Đốc (CEO)',
        department: 'Ban Giám Đốc',
        status: 'PENDING',
        comment: 'Chờ kết quả thẩm định từ Trưởng phòng HR trước khi phê duyệt cuối.',
        avatarColor: 'bg-slate-400',
        initials: 'PN',
      },
    ],
  },
};

export default function RequisitionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reqId = (params?.id as string) || 'REQ-2026-003';

  // Get data or fallback to default
  const requisition = MOCK_REQUISITION_DATA[reqId] || MOCK_REQUISITION_DATA['REQ-2026-003'];

  // State: Reminder Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isReminderSent, setIsReminderSent] = useState(false);

  const handleSendReminder = () => {
    setIsReminderSent(true);
    setToastMessage('Đã gửi thông báo nhắc nhở đôn đốc duyệt đến Trưởng phòng HR (Thu Hà)!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDuplicate = () => {
    // Navigate to Requisitions list with clone modal trigger
    router.push(`/manager/requisitions?cloneId=${requisition.id}`);
  };

  // Pipeline Metrics
  const pipeline = requisition.pipeline;
  const progressPercent = Math.round((requisition.hiredCount / requisition.targetCount) * 100);

  return (
    <>
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Navigation Breadcrumb & Back */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/manager/requisitions"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Quay lại danh sách"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-600">{requisition.id}</span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-500">{requisition.department}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {requisition.title}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleDuplicate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100/80 text-blue-700 text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Copy className="w-4 h-4 text-blue-600" />
            <span>Sao Chép Yêu Cầu Này</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. KHỐI "TIẾN ĐỘ TUYỂN DỤNG" (RECRUITMENT PIPELINE FUNNEL)               */}
      {/* ========================================================================= */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Tiến Độ Tuyển Dụng & Phễu Ứng Viên (Pipeline Funnel)
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Theo dõi trực tiếp ứng viên theo từng chặng mà không cần chat hỏi HR
            </p>
          </div>

          {/* Overall Progress Stat */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-slate-400 font-medium">Tiến độ chỉ tiêu:</div>
              <div className="text-sm font-black text-slate-900">
                Đã tuyển {requisition.hiredCount}/{requisition.targetCount} vị trí ({progressPercent}%)
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm border border-blue-100">
              {progressPercent}%
            </div>
          </div>
        </div>

        {/* Overall Linear Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-slate-600">
            <span>Tiến độ lấp đầy Headcount</span>
            <span className="text-emerald-600">
              {requisition.hiredCount === requisition.targetCount ? 'Đã hoàn thành' : `Còn thiếu ${requisition.targetCount - requisition.hiredCount} nhân sự`}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Sequential Pipeline Cards: [120 CV] -> [15 Sàng lọc] -> [5 PV] -> [2 Offer] -> [1 Nhận việc] */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {/* Stage 1: CV Nộp */}
          <div className="relative p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-blue-300 hover:shadow-xs transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">1. Hồ sơ nộp</span>
              <span className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">{pipeline.submitted} CV</div>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200/60">
                HR đang xử lý
              </span>
            </div>
          </div>

          {/* Stage 2: Sàng lọc */}
          <div className="relative p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-purple-300 hover:shadow-xs transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">2. Đã sàng lọc</span>
              <span className="w-2 h-2 rounded-full bg-purple-500" />
            </div>
            <div className="text-2xl font-black text-purple-700">{pipeline.screening} CV</div>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200/60">
                HR đã sơ loại
              </span>
            </div>
          </div>

          {/* Stage 3: Phỏng vấn (Đợi Manager) */}
          <div className="relative p-4 rounded-2xl bg-amber-50/50 border border-amber-200/90 shadow-xs space-y-2 ring-1 ring-amber-300/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800">3. Phỏng vấn</span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            </div>
            <div className="text-2xl font-black text-amber-700">{pipeline.interview} PV</div>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold border border-amber-300/80 shadow-xs">
                Đợi Manager phỏng vấn
              </span>
            </div>
          </div>

          {/* Stage 4: Offer */}
          <div className="relative p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:border-emerald-300 hover:shadow-xs transition-all space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">4. Đề xuất Offer</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600">{pipeline.offered} Offer</div>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/60">
                HR gửi thư mời
              </span>
            </div>
          </div>

          {/* Stage 5: Nhận việc (Hired) */}
          <div className="relative p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800">5. Đã nhận việc</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700">{pipeline.hired} Onboard</div>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold shadow-xs">
                Onboarding hoàn tất
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. KHỐI THEO DÕI "TRẠNG THÁI & LỊCH SỬ PHÊ DUYỆT" (APPROVAL TRACKER)    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Vertical Timeline Component (7 cols) */}
        <section className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                Lịch Sử & Trạng Thái Phê Duyệt 4 Cấp (Approval Timeline)
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Minh bạch dòng luân chuyển hồ sơ và thời gian phản hồi theo SLA
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
              Đang Chờ Cấp 3
            </span>
          </div>

          {/* Vertical Timeline Structure */}
          <div className="relative pl-6 space-y-8 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {requisition.approvalSteps.map((step) => {
              const isApproved = step.status === 'APPROVED';
              const isInProgress = step.status === 'IN_PROGRESS';
              const isPending = step.status === 'PENDING';

              return (
                <div key={step.stepNumber} className="relative group">
                  {/* Step Marker Icon */}
                  <div
                    className={clsx(
                      'absolute -left-6 top-0 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-xs z-10 transition-transform group-hover:scale-110',
                      isApproved && 'bg-emerald-500 text-white',
                      isInProgress && 'bg-amber-500 text-white ring-amber-100 animate-pulse',
                      isPending && 'bg-slate-200 text-slate-500'
                    )}
                  >
                    {isApproved ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : isInProgress ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <span>{step.stepNumber}</span>
                    )}
                  </div>

                  {/* Step Content Card */}
                  <div
                    className={clsx(
                      'p-4 sm:p-5 rounded-2xl border transition-all space-y-3',
                      isInProgress
                        ? 'bg-amber-50/50 border-amber-200 shadow-md shadow-amber-900/5 ring-1 ring-amber-300/40'
                        : isApproved
                        ? 'bg-slate-50/60 border-slate-200/80'
                        : 'bg-white border-slate-200/50 opacity-70'
                    )}
                  >
                    {/* Header of step */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                          Cấp {step.stepNumber}
                        </span>
                        <span className="text-slate-300">•</span>
                        <h3 className="text-sm font-black text-slate-900">{step.stepName}</h3>
                      </div>

                      {/* Status Badges */}
                      <div>
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                            <Check className="w-3 h-3" /> Đã xong
                          </span>
                        )}
                        {isInProgress && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold shadow-xs">
                            Đang chờ duyệt
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium">
                            Chưa tới lượt
                          </span>
                        )}
                      </div>
                    </div>

                    {/* POINT OF HIGHLIGHT: "HỒ SƠ ĐANG NẰM Ở BÀN CỦA AI" */}
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/90 border border-slate-200/70 shadow-xs">
                      <div
                        className={clsx(
                          'w-10 h-10 rounded-xl text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs',
                          step.avatarColor
                        )}
                      >
                        {step.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold text-slate-900 text-xs truncate">
                            {step.approverName}
                          </span>
                          {step.timestamp && (
                            <span className="text-[11px] text-slate-400 font-medium shrink-0">
                              {step.timestamp}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {step.approverRole} — {step.department}
                        </div>
                      </div>
                    </div>

                    {/* Highlight Box if IN_PROGRESS & OVERDUE */}
                    {isInProgress && step.isOverdue && (
                      <div className="p-3.5 rounded-xl bg-amber-100/70 border border-amber-300 text-amber-900 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-extrabold">
                            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                            <span>{step.waitingTime}</span>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded-full shadow-xs">
                            Quá SLA 24h
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                          Hồ sơ đang dừng tại bước này quá 48 giờ cam kết. Manager có thể gửi thông báo đốc thúc trực tiếp tới HR.
                        </p>

                        <div className="pt-1 flex justify-end">
                          <button
                            onClick={handleSendReminder}
                            disabled={isReminderSent}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-[11px] font-extrabold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            <Bell className="w-3.5 h-3.5" />
                            <span>{isReminderSent ? 'Đã Gửi Nhắc Nhở' : 'Đốc Thúc HR Duyệt Ngay'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Comment text */}
                    {step.comment && !isInProgress && (
                      <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        &ldquo;{step.comment}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: Requisition Specifications (5 cols) */}
        <section className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Thông Tin Chi Tiết Yêu Cầu
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Các chỉ tiêu kỹ thuật đã thiết lập cho vị trí
              </p>
            </div>

            {/* Key Specs Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Cấp Bậc</span>
                <p className="font-extrabold text-slate-800">{requisition.level}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Chỉ Tiêu Tuyển</span>
                <p className="font-extrabold text-blue-700">{requisition.targetCount} nhân sự</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Dải Lương Đề Xuất</span>
                <p className="font-extrabold text-emerald-700">{requisition.salaryRange}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Ngày Cần Người</span>
                <p className="font-extrabold text-slate-800">{requisition.targetDate}</p>
              </div>
            </div>

            {/* Reason */}
            <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 text-xs space-y-1">
              <span className="font-extrabold text-blue-900 text-[11px] uppercase tracking-wider">
                Lý Do Tuyển Dụng
              </span>
              <p className="text-slate-700 font-medium">{requisition.reason}</p>
            </div>

            {/* Description Preview */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-700">Mô tả công việc:</span>
              <p className="text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-[11px]">
                {requisition.description}
              </p>
            </div>

            {/* Requirements Preview */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-700">Yêu cầu ứng viên:</span>
              <div className="text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-[11px] whitespace-pre-line font-medium">
                {requisition.requirements}
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <Link
              href="/manager/requisitions"
              className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
              ← Quay lại danh sách
            </Link>

            <button
              onClick={handleDuplicate}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Tạo Bản Sao Mới</span>
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
