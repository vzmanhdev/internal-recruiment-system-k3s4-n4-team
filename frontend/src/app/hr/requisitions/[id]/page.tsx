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
  ArrowLeft,
} from 'lucide-react';
import clsx from 'clsx';

export default function HRRequisitionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reqId = Number(params?.id);
  const { data: requisition, error, loading, reload } = useApiData(() => managerRequisitionDetail(reqId), [reqId]);

  // State: Reminder Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isReminderSent, setIsReminderSent] = useState(false);

  const handleSendReminder = async () => {
    if (!requisition) return;
    try {
      const r = await requisitionService.remind(requisition.dbId);
      setIsReminderSent(true);
      setToastMessage(r.sent ? `Đã gửi nhắc nhở tới ${r.sent} người phụ trách bước duyệt hiện tại.` : 'Không có người nhận phù hợp cho bước duyệt hiện tại.');
    } catch (err) {
      setToastMessage(err instanceof ApiError ? err.message : 'Không gửi được nhắc nhở.');
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  if (loading) return <LoadingState />;
  if (error || !requisition) return <ErrorState error={error} onRetry={reload} />;

  // Pipeline Metrics
  const pipeline = requisition.pipeline;
  const progressPercent = requisition.targetCount ? Math.round((requisition.hiredCount / requisition.targetCount) * 100) : 0;

  return (
    <div className="space-y-6">
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
            href="/hr/requisitions"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Quay lại danh sách yêu cầu"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                {requisition.id}
              </span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-500">{requisition.department}</span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-xs font-medium text-slate-400">{requisition.createdAt}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
              {requisition.title}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/hr/requisitions"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Danh Sách Tờ Trình</span>
          </Link>
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
              Theo dõi trực tiếp ứng viên theo từng chặng tuyển dụng thực tế
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

        {/* Sequential Pipeline Cards */}
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

          {/* Stage 3: Phỏng vấn */}
          <div className="relative p-4 rounded-2xl bg-amber-50/50 border border-amber-200/90 shadow-xs space-y-2 ring-1 ring-amber-300/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800">3. Phỏng vấn</span>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            </div>
            <div className="text-2xl font-black text-amber-700">{pipeline.interview} PV</div>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold border border-amber-300/80 shadow-xs">
                Chuyên môn & HR
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
      {/* 2. KHỐI THEO DÕI "TRẠNG THÁI & LỊCH SỬ PHÊ DUYỆT" + SPECIFICATIONS       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Vertical Timeline Component (7 cols) */}
        <section className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                Lịch Sử & Trạng Thái Phê Duyệt (Approval Timeline)
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Minh bạch dòng luân chuyển hồ sơ và thời gian phản hồi theo SLA
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
              Quy Trình Chuẩn
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

                      <div className="flex items-center gap-2">
                        {isApproved && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" />
                            ĐÃ DUYỆT
                          </span>
                        )}
                        {isInProgress && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            ĐANG CHỜ DUYỆT
                          </span>
                        )}
                        {isPending && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-500">
                            CHƯA ĐẾN LƯỢT
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Step Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Người duyệt: <strong>{step.approverName}</strong> ({step.approverRole})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Thời gian: {step.timestamp || 'Chờ xử lý'}</span>
                      </div>
                    </div>

                    {/* Comment */}
                    {step.comment && (
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
              href="/hr/requisitions"
              className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
            >
              ← Quay lại danh sách
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
