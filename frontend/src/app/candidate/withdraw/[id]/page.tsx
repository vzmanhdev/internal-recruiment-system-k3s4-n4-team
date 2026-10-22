'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Clock,
  HelpCircle,
  Info,
  Loader2,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { apiRequest, ApiError } from '@/lib/api-client';
import { useApiData } from '@/hooks/useApiData';
import { LoadingState } from '@/components/ui/DataStates';

interface WithdrawPreview {
  confirm_required: boolean;
  job_title: string | null;
  department: string | null;
  status: string;
  current_status: string;
  tracking_code: string;
  candidate_name: string;
  full_name: string;
  email?: string;
  phone?: string;
  applied_date?: string;
  can_withdraw: boolean;
}

interface WithdrawResponse {
  withdrawn: boolean;
  status: string;
  current_status: string;
  tracking_code: string;
  job_title: string | null;
  candidate_name: string;
  withdrawn_at: string;
  reason: string;
  message: string;
}

interface ToastNotification {
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  metadata?: { label: string; value: string }[];
}

const STANDARD_REASONS = [
  'Đã nhận được việc làm / offer tại nơi khác',
  'Thay đổi định hướng sự nghiệp cá nhân',
  'Mức đãi ngộ hoặc địa điểm làm việc chưa phù hợp',
  'Lý do cá nhân hoặc gia đình',
  'Khác (nhập thêm mô tả chi tiết)',
];

/**
 * User Story S4-06 (SCRUM-102):
 * Rút hồ sơ ứng tuyển qua liên kết email có xác nhận lại (AC1).
 * Chuyển trạng thái sang "withdrawn" và biến mất khỏi pipeline active (AC2).
 * Recruiter phụ trách nhận thông báo (AC3).
 * Bảo mật liên kết dùng lại (TC-X01) & Rich Toast phản hồi chi tiết.
 */
function WithdrawByLink() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  // Rich Toast State
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const showToast = (
    title: string,
    message: string,
    type: 'success' | 'warning' | 'error' | 'info' = 'info',
    metadata?: { label: string; value: string }[],
  ) => {
    setToast({ title, message, type, metadata });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Load Preview from API (confirm: false)
  const { data, error, loading, reload } = useApiData<WithdrawPreview>(
    async () => {
      if (!token) throw new ApiError(400, 'Thiếu mã xác thực (token) trong liên kết.');
      return await apiRequest<WithdrawPreview>('/public/applications/withdraw', {
        method: 'POST',
        body: JSON.stringify({ token, confirm: false }),
      });
    },
    [token],
  );

  // Form & Workflow States
  const [selectedReason, setSelectedReason] = useState(STANDARD_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [doneData, setDoneData] = useState<WithdrawResponse | null>(null);
  const [formError, setFormError] = useState('');

  const finalReason = selectedReason === 'Khác (nhập thêm mô tả chi tiết)'
    ? (customReason.trim() || 'Lý do khác')
    : (customReason.trim() ? `${selectedReason} - ${customReason.trim()}` : selectedReason);

  // Handle Double Confirmation (AC1)
  const handleOpenConfirm = () => {
    setFormError('');
    setShowConfirmModal(true);
  };

  const handleExecuteWithdraw = async () => {
    setSubmitting(true);
    setFormError('');
    try {
      const res = await apiRequest<WithdrawResponse>('/public/applications/withdraw', {
        method: 'POST',
        body: JSON.stringify({
          token,
          confirm: true,
          reason: finalReason,
        }),
      });

      setDoneData(res);
      setShowConfirmModal(false);

      // Trigger Rich Toast with detailed data
      showToast(
        'Đã rút hồ sơ thành công!',
        `Hồ sơ ứng tuyển vị trí ${res.job_title || ''} đã được chuyển sang trạng thái Ứng viên rút.`,
        'success',
        [
          { label: 'Mã hồ sơ', value: res.tracking_code },
          { label: 'Vị trí', value: res.job_title || 'N/A' },
          { label: 'Thời gian', value: new Date(res.withdrawn_at).toLocaleString('vi-VN') },
          { label: 'Lý do', value: res.reason },
        ],
      );
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Không thể thực hiện rút hồ sơ. Vui lòng thử lại sau.';
      setFormError(msg);
      showToast('Thao tác không thành công', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Missing token state
  if (!token) {
    return (
      <div className="max-w-xl mx-auto mt-8 sm:mt-16 px-4 pb-16">
        <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Liên kết không hợp lệ</h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Đường dẫn rút hồ sơ không chứa mã xác thực hợp lệ. Vui lòng kiểm tra lại liên kết trong email xác nhận nộp hồ sơ.
          </p>
          <div className="pt-2">
            <Link
              href="/candidate/jobs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Quay lại Cổng việc làm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="max-w-xl mx-auto mt-12 px-4 pb-16 text-center">
        <LoadingState />
      </div>
    );
  }

  // Error state (expired or reused token - TC-S4-06-X01)
  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto mt-8 sm:mt-16 px-4 pb-16">
        <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Liên kết đã hết hiệu lực hoặc hồ sơ đã rút</h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Liên kết này chỉ có hiệu lực một lần duy nhất vì lý do bảo mật. Hồ sơ của bạn có thể đã được rút trước đó hoặc liên kết đã quá hạn sử dụng.
          </p>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 text-left space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-700">
              <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
              Bạn cần kiểm tra lại tình trạng hồ sơ?
            </div>
            <p className="text-slate-500 leading-normal">
              Bạn có thể sử dụng tính năng tra cứu hồ sơ công khai bằng mã hồ sơ và địa chỉ email đã đăng ký ứng tuyển.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/candidate/track"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors shadow-sm"
            >
              Tra cứu hồ sơ ứng tuyển
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/candidate/jobs"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-sm transition-colors"
            >
              Xem cơ hội nghề nghiệp
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-6 sm:mt-10 px-4 pb-16 antialiased space-y-6">
      {/* ========================================================================= */}
      {/* FLOATING RICH TOAST NOTIFICATION                                         */}
      {/* ========================================================================= */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3.5 bg-slate-900 text-white p-5 rounded-2xl shadow-2xl border border-slate-700/80 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="shrink-0 mt-0.5">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
          </div>
          <div className="flex-1 min-w-0 pr-2">
            <div className="text-sm font-black tracking-tight text-white mb-1">
              {toast.title}
            </div>
            <div className="text-xs text-slate-300 leading-relaxed font-medium mb-2.5">
              {toast.message}
            </div>
            {toast.metadata && toast.metadata.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800 text-[11px]">
                {toast.metadata.map((item, idx) => (
                  <div key={idx} className="flex flex-col">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">{item.label}</span>
                    <span className="text-slate-200 font-bold truncate">{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
            title="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/candidate/jobs"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Quay lại Cổng tuyển dụng
        </Link>
        <span className="text-xs text-slate-400 font-medium">Xác thực ứng viên tự do</span>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        {doneData ? (
          /* ========================================================================= */
          /* SUCCESS STATE VIEW                                                        */
          /* ========================================================================= */
          <div className="text-center space-y-6 py-4 animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner ring-8 ring-emerald-50/50">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Đã rút hồ sơ ứng tuyển</h1>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Hồ sơ của bạn đã được cập nhật trạng thái dừng xét duyệt trên hệ thống tuyển dụng.
              </p>
            </div>

            {/* Application Summary Box */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 text-left space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
                <span className="text-xs font-semibold text-slate-500">Mã hồ sơ:</span>
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/70">
                  {doneData.tracking_code}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Vị trí ứng tuyển</span>
                  <span className="font-bold text-slate-800">{doneData.job_title || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Trạng thái mới</span>
                  <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md mt-0.5">
                    <Clock className="w-3 h-3" />
                    Ứng viên rút (Kết thúc)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Thời điểm thực hiện</span>
                  <span className="font-semibold text-slate-700">
                    {new Date(doneData.withdrawn_at).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Lý do đã chọn</span>
                  <span className="font-semibold text-slate-700 truncate block" title={doneData.reason}>
                    {doneData.reason}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Cảm ơn bạn đã chủ động thông báo cho đội ngũ tuyển dụng. Chúc bạn luôn gặt hái nhiều thành công trên con đường phát triển sự nghiệp!
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/candidate/jobs"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm transition-all shadow-md shadow-blue-500/20"
              >
                Khám phá các vị trí khác
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={`/candidate/track?code=${doneData.tracking_code}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-sm transition-colors"
              >
                Tra cứu chi tiết
              </Link>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* PRE-FLIGHT / PREVIEW & FORM VIEW (AC1)                                    */
          /* ========================================================================= */
          <div className="space-y-6">
            {/* Header Title */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold mb-3">
                <AlertCircle className="w-3.5 h-3.5" />
                Yêu cầu xác nhận rút hồ sơ
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Rút hồ sơ ứng tuyển</h1>
              <p className="text-sm text-slate-500 mt-1">
                Dừng quá trình ứng tuyển khi bạn đã nhận việc nơi khác hoặc có định hướng mới.
              </p>
            </div>

            {/* Application Detail Card (Context Card) */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/90 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Mã tra cứu:</span>
                  <span className="font-mono text-xs font-extrabold text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                    {data.tracking_code}
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  Trạng thái: {data.status}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
                <div className="flex items-start gap-2.5">
                  <Briefcase className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Vị trí</span>
                    <span className="font-bold text-slate-800">{data.job_title || 'Chưa cập nhật'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Phòng ban</span>
                    <span className="font-bold text-slate-800">{data.department || 'Phòng Tuyển dụng'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Ứng viên</span>
                    <span className="font-bold text-slate-800">{data.candidate_name || data.full_name}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Ngày nộp hồ sơ</span>
                    <span className="font-bold text-slate-800">{data.applied_date || 'Gần đây'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Warning Callout */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200/80 text-amber-900 text-xs leading-relaxed">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Lưu ý quan trọng:</strong> Sau khi xác nhận rút hồ sơ, hệ thống sẽ dừng toàn bộ quy trình xét duyệt/phỏng vấn hiện tại. Liên kết email này sẽ hết hiệu lực ngay lập tức và không thể hoàn tác.
              </div>
            </div>

            {/* Reason Selection Form */}
            <div className="space-y-3.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Lý do rút hồ sơ <span className="text-rose-500">*</span>
              </label>

              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors cursor-pointer"
              >
                {STANDARD_REASONS.map((r, i) => (
                  <option key={i} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <textarea
                rows={3}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Nhập thêm chi tiết hoặc lời nhắn gửi tới phòng tuyển dụng (không bắt buộc)..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
              />
            </div>

            {formError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {formError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleOpenConfirm}
                disabled={submitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <AlertCircle className="w-4 h-4" />
                Tiến hành rút hồ sơ
              </button>
              <Link
                href="/candidate/jobs"
                className="w-full sm:w-auto py-3.5 px-6 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-colors text-center"
              >
                Giữ lại hồ sơ
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* DOUBLE CONFIRMATION MODAL (AC1)                                           */}
      {/* ========================================================================= */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Xác nhận rút hồ sơ ứng tuyển</h3>
                <p className="text-xs text-slate-500 mt-0.5">Vui lòng kiểm tra lại trước khi xác nhận lần cuối.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Mã hồ sơ:</span>
                <span className="font-mono font-bold text-slate-800">{data.tracking_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vị trí:</span>
                <span className="font-bold text-slate-800">{data.job_title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lý do rút:</span>
                <span className="font-bold text-rose-700 text-right truncate max-w-[240px]">
                  {finalReason}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn rút hồ sơ ứng tuyển này? Sau khi hoàn tất, nhà tuyển dụng sẽ nhận được thông báo và bạn sẽ dừng toàn bộ quá trình tuyển dụng cho vị trí này.
            </p>

            <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteWithdraw}
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition-all shadow-sm shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Đồng ý rút hồ sơ'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WithdrawByLinkPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-xl mx-auto mt-12 px-4 pb-16 text-center">
          <LoadingState />
        </div>
      }
    >
      <WithdrawByLink />
    </Suspense>
  );
}
