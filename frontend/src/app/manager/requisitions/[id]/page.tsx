'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { managerRequisitionDetail } from '@/features/manager/api';
import { requisitionService } from '@/services/requisition.service';
import { useApiData } from '@/hooks/useApiData';
import { ErrorState, LoadingState } from '@/components/ui/DataStates';
import { ApiError } from '@/lib/api-client';
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
  X,
  AlertCircle,
  RotateCcw,
  Mail,
  Info,
} from 'lucide-react';
import clsx from 'clsx';

export default function RequisitionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const reqId = rawId ? Number(rawId) : NaN;

  const { data: requisition, error, loading, reload } = useApiData(
    () => {
      if (!rawId) {
        return new Promise<import('@/features/manager/api').ManagerRequisitionDetail>(() => {});
      }
      if (isNaN(reqId) || reqId <= 0) {
        return Promise.reject(new Error('Mã yêu cầu tuyển dụng không hợp lệ'));
      }
      return managerRequisitionDetail(reqId);
    },
    [reqId, rawId]
  );

  // State: Rich Toast Feedback
  const [toast, setToast] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    message: string;
  } | null>(null);

  const showToast = (
    title: string,
    message: string,
    type: 'success' | 'warning' | 'error' | 'info' = 'success'
  ) => {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const [isReminderSent, setIsReminderSent] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Action: Gửi nhắc nhở duyệt SLA
  const handleSendReminder = async () => {
    if (!requisition) return;
    try {
      const r = await requisitionService.remind(requisition.dbId);
      setIsReminderSent(true);
      const recipientNames =
        r.recipients && r.recipients.length > 0
          ? r.recipients.map((u) => `${u.name} (${u.email})`).join(', ')
          : 'người phê duyệt phụ trách';

      showToast(
        'Đã gửi nhắc nhở duyệt SLA thành công',
        `Thông báo đốc thúc xử lý tờ trình ${requisition.id} đã được gửi trực tiếp tới: ${recipientNames}.`,
        'success'
      );
    } catch (err) {
      showToast(
        'Không thể gửi nhắc nhở',
        err instanceof ApiError ? err.message : 'Có lỗi xảy ra khi gửi nhắc nhở.',
        'error'
      );
    }
  };

  // Action: Làm mới dữ liệu luồng duyệt
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await reload();
      showToast(
        'Đã làm mới dữ liệu',
        `Cập nhật tiến độ và lịch sử phê duyệt mới nhất của tờ trình ${requisition?.id || ''}.`,
        'info'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  // Action: Sao chép mã tờ trình
  const handleCopyCode = () => {
    if (!requisition) return;
    navigator.clipboard.writeText(requisition.id);
    showToast(
      'Đã sao chép mã tờ trình',
      `Mã ${requisition.id} đã được lưu vào bộ nhớ tạm. Bạn có thể dán vào tin nhắn hoặc email trao đổi.`,
      'info'
    );
  };

  // Action: Sao chép yêu cầu này (Duplicate)
  const handleDuplicate = () => {
    if (!requisition) return;
    showToast(
      'Chuyển sang bản sao tờ trình',
      `Đang sao chép thông tin từ tờ trình ${requisition.id}...`,
      'info'
    );
    router.push(`/manager/requisitions?cloneId=${requisition.id}`);
  };

  if (loading) return <LoadingState />;
  if (error || !requisition) return <ErrorState error={error} onRetry={reload} />;

  // Pipeline Metrics
  const pipeline = requisition.pipeline;
  const progressPercent = requisition.targetCount ? Math.round((requisition.hiredCount / requisition.targetCount) * 100) : 0;

  // Current Pending Step Info
  const currentPendingStep = requisition.approvalSteps.find((s) => s.status === 'IN_PROGRESS');
  const isApprovedAll = requisition.rawStatus === 'approved';
  const isRejected = requisition.rawStatus === 'rejected';
  const isChangesRequested = requisition.rawStatus === 'changes_requested';

  return (
    <>
      {/* ========================================================================= */}
      {/* RICH TOAST NOTIFICATION                                                   */}
      {/* ========================================================================= */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3.5 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700/80 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
          </div>
          <div className="flex-1 min-w-0 pr-2">
            <div className="text-xs font-black tracking-tight text-white mb-0.5">
              {toast.title}
            </div>
            <div className="text-[11px] text-slate-300 leading-relaxed font-medium">
              {toast.message}
            </div>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
            title="Đóng"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Navigation Breadcrumb & Back */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/manager/requisitions"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shadow-2xs"
            title="Quay lại danh sách"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-600 font-mono">{requisition.id}</span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-500">{requisition.department}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {requisition.title}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Copy Code */}
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
            title="Sao chép mã yêu cầu"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>Sao chép mã</span>
          </button>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            title="Làm mới trạng thái"
          >
            <RotateCcw className={clsx('w-3.5 h-3.5 text-slate-500', isRefreshing && 'animate-spin')} />
            <span>Làm mới</span>
          </button>

          {/* Duplicate Requisition */}
          <button
            onClick={handleDuplicate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-200 bg-blue-50/80 hover:bg-blue-600 hover:text-white text-blue-700 text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95 group"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600 group-hover:text-white transition-colors" />
            <span>Sao chép yêu cầu này</span>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                Lịch Sử & Trạng Thái Phê Duyệt (Approval Timeline)
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Minh bạch dòng luân chuyển hồ sơ, biết đích danh người đang thụ lý
              </p>
            </div>
            <div>
              {isApprovedAll && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã duyệt toàn bộ
                </span>
              )}
              {isRejected && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
                  <X className="w-3.5 h-3.5" /> Đã từ chối
                </span>
              )}
              {isChangesRequested && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
                  <RotateCcw className="w-3.5 h-3.5" /> Yêu cầu sửa đổi
                </span>
              )}
              {!isApprovedAll && !isRejected && !isChangesRequested && currentPendingStep && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock className="w-3.5 h-3.5 animate-spin" /> Đang chờ: {currentPendingStep.stepName}
                </span>
              )}
              {!isApprovedAll && !isRejected && !isChangesRequested && !currentPendingStep && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-600 border border-slate-200">
                  Chờ gửi duyệt
                </span>
              )}
            </div>
          </div>

          {/* Audit trail indicator */}
          <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] font-semibold text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Sổ cái kiểm toán bất biến (Immutable Audit Trail) • Lịch sử không thể sửa hoặc xoá</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 font-mono">APPEND-ONLY</span>
          </div>

          {/* Vertical Timeline Structure */}
          <div className="relative pl-6 space-y-8 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {requisition.approvalSteps.map((step) => {
              const isApproved = step.status === 'APPROVED';
              const isInProgress = step.status === 'IN_PROGRESS';
              const isStepRejected = step.status === 'REJECTED';
              const isStepChangesRequested = step.status === 'CHANGES_REQUESTED';
              const isPending = step.status === 'PENDING';

              return (
                <div key={step.stepNumber} className="relative group">
                  {/* Step Marker Icon */}
                  <div
                    className={clsx(
                      'absolute -left-6 top-0 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-xs z-10 transition-transform group-hover:scale-110',
                      isApproved && 'bg-emerald-500 text-white',
                      isInProgress && 'bg-amber-500 text-white ring-amber-100 animate-pulse',
                      isStepRejected && 'bg-rose-600 text-white ring-rose-100',
                      isStepChangesRequested && 'bg-amber-600 text-white ring-amber-100',
                      isPending && 'bg-slate-200 text-slate-500'
                    )}
                  >
                    {isApproved ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : isInProgress ? (
                      <Clock className="w-4 h-4" />
                    ) : isStepRejected ? (
                      <X className="w-4 h-4" />
                    ) : isStepChangesRequested ? (
                      <RotateCcw className="w-4 h-4" />
                    ) : (
                      <span>{step.stepNumber}</span>
                    )}
                  </div>

                  {/* Step Content Card */}
                  <div
                    className={clsx(
                      'p-4 sm:p-5 rounded-2xl border transition-all space-y-3.5',
                      isInProgress
                        ? 'bg-amber-50/50 border-amber-200 shadow-md shadow-amber-900/5 ring-1 ring-amber-300/40'
                        : isApproved
                        ? 'bg-slate-50/60 border-slate-200/80 hover:bg-white'
                        : isStepRejected
                        ? 'bg-rose-50/50 border-rose-200'
                        : isStepChangesRequested
                        ? 'bg-amber-50/30 border-amber-200'
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
                            <Check className="w-3 h-3" /> Đã phê duyệt
                          </span>
                        )}
                        {isInProgress && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold shadow-xs animate-pulse">
                            <Clock className="w-3 h-3" /> Đang chờ duyệt
                          </span>
                        )}
                        {isStepRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                            <X className="w-3 h-3" /> Từ chối
                          </span>
                        )}
                        {isStepChangesRequested && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                            <RotateCcw className="w-3 h-3" /> Yêu cầu sửa
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium">
                            Chưa tới lượt
                          </span>
                        )}
                      </div>
                    </div>

                    {/* AC1: ĐÍCH DANH AI - HIỂN THỊ THÔNG TIN NGƯỜI DUYỆT HOẶC ĐANG CHỜ AI */}
                    {isApproved && (
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
                              <span className="text-[11px] text-slate-500 font-medium shrink-0">
                                {step.timestamp}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {step.approverRole} {step.approverEmail ? `(${step.approverEmail})` : ''} • {step.department}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AC1 & AC2: NẾU IN_PROGRESS -> "HỒ SƠ ĐANG NẰM Ở BÀN CỦA AI" */}
                    {isInProgress && (
                      <div className="p-3.5 rounded-xl bg-white border border-amber-200/80 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-amber-600" />
                            Hồ sơ đang nằm ở bàn ai:
                          </span>
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                            {step.waitingTime || 'Đang chờ xử lý'}
                          </span>
                        </div>

                        {/* List candidate approvers if available */}
                        {step.candidateApprovers && step.candidateApprovers.length > 0 ? (
                          <div className="space-y-2">
                            {step.candidateApprovers.map((cand, idx) => (
                              <div
                                key={idx}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-amber-50/60 border border-amber-100 hover:bg-amber-50 transition-colors"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-amber-200 text-amber-800 font-black text-xs flex items-center justify-center shrink-0">
                                    {cand.fullName
                                      .split(' ')
                                      .map((n) => n[0])
                                      .slice(-2)
                                      .join('')
                                      .toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-black text-slate-900 truncate">
                                      {cand.fullName}
                                    </div>
                                    <div className="text-[11px] text-slate-500 font-medium truncate">
                                      {cand.role} {cand.department ? `• ${cand.department}` : ''}
                                    </div>
                                  </div>
                                </div>
                                <a
                                  href={`mailto:${cand.email}?subject=Nhắc nhở phê duyệt yêu cầu tuyển dụng ${requisition.id}`}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-white hover:bg-amber-100 px-2.5 py-1 rounded-md border border-amber-200 shadow-2xs transition-colors shrink-0"
                                  title={`Gửi email trực tiếp tới ${cand.fullName}`}
                                >
                                  <Mail className="w-3 h-3 text-amber-600" />
                                  <span>{cand.email}</span>
                                </a>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-start gap-3 p-2.5 rounded-lg bg-amber-50/60 border border-amber-100">
                            <div className="w-8 h-8 rounded-lg bg-amber-200 text-amber-800 font-bold flex items-center justify-center text-xs shrink-0">
                              {step.initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-black text-slate-900">{step.approverName}</div>
                              <div className="text-[11px] text-slate-500 font-medium">
                                {step.approverRole} {step.approverEmail ? `(${step.approverEmail})` : ''} • {step.department}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SLA Waiting & Overdue Alert Box */}
                    {isInProgress && (
                      <div className="p-3.5 rounded-xl bg-amber-100/70 border border-amber-300 text-amber-900 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-extrabold">
                            <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                            <span>{step.waitingTime || 'Thời gian đã lưu hồ sơ: Đang tính toán'}</span>
                          </div>
                          {step.isOverdue && (
                            <span className="text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded-full shadow-xs">
                              Quá hạn SLA 24h
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                          Hồ sơ đang dừng tại bước này. Bạn có thể gửi thông báo đốc thúc trực tiếp tới người phê duyệt phụ trách.
                        </p>

                        <div className="pt-1 flex justify-end">
                          <button
                            onClick={handleSendReminder}
                            disabled={isReminderSent}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-[11px] font-extrabold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            <Bell className="w-3.5 h-3.5" />
                            <span>{isReminderSent ? 'Đã Gửi Nhắc Nhở' : 'Đốc Thúc Phê Duyệt (Gửi Nhắc Nhở SLA)'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* AC2: Ý KIẾN / COMMENT NẾU CÓ */}
                    {step.comment && (isApproved || isStepRejected || isStepChangesRequested) && (
                      <div
                        className={clsx(
                          'p-3 rounded-xl text-xs space-y-1',
                          isApproved && 'bg-emerald-50/70 border border-emerald-100 text-emerald-900',
                          isStepRejected && 'bg-rose-50 border border-rose-200 text-rose-900',
                          isStepChangesRequested && 'bg-amber-50 border border-amber-200 text-amber-900'
                        )}
                      >
                        <div className="text-[10px] font-extrabold uppercase tracking-wider">
                          {isApproved
                            ? 'Ý kiến phê duyệt:'
                            : isStepRejected
                            ? 'Lý do từ chối:'
                            : 'Yêu cầu chỉnh sửa:'}
                        </div>
                        <p className="italic font-medium leading-relaxed">&ldquo;{step.comment}&rdquo;</p>
                      </div>
                    )}

                    {/* Pending explanation */}
                    {isPending && (
                      <div className="text-xs text-slate-400 font-medium">
                        Cấp duyệt này sẽ tự động kích hoạt ngay khi cấp trước hoàn tất phê duyệt.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* AC3 Immutability Footer Banner */}
          <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Toàn bộ lịch sử phê duyệt được lưu vết bất biến, không sửa và không xoá được.
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400">TC-S3-03-X01</span>
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
