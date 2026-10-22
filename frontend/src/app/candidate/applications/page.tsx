'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  RotateCcw,
  Search,
  UserX,
  X,
} from 'lucide-react';
import { apiRequest, ApiError } from '@/lib/api-client';
import { useApiData } from '@/hooks/useApiData';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/DataStates';

/** What the API returns to an applicant about their own applications (candidate view, no internal notes). */
interface MyApplication {
  id: number;
  job_posting_id: number;
  job_title?: string | null;
  department?: string | null;
  status: string;
  public_status?: string;
  tracking_code?: string | null;
  applied_date?: string | null;
}

interface ToastNotification {
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  metadata?: { label: string; value: string }[];
}

const TERMINAL_STATUSES = new Set(['hired', 'rejected', 'withdrawn', 'onboarded', 'offered']);

const STANDARD_REASONS = [
  'Đã nhận được việc làm / offer tại nơi khác',
  'Thay đổi định hướng sự nghiệp cá nhân',
  'Mức đãi ngộ hoặc địa điểm làm việc chưa phù hợp',
  'Lý do cá nhân hoặc gia đình',
  'Khác (nhập thêm mô tả chi tiết)',
];

export default function CandidateApplicationsPage() {
  const { data, error, loading, reload } = useApiData<MyApplication[]>(
    () => apiRequest<MyApplication[]>('/applications?mine=true'),
  );

  // Rich Toast state
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
    const timer = setTimeout(() => setToast(null), 5500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Withdraw Modal State
  const [withdrawTarget, setWithdrawTarget] = useState<MyApplication | null>(null);
  const [selectedReason, setSelectedReason] = useState(STANDARD_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const finalReason = selectedReason === 'Khác (nhập thêm mô tả chi tiết)'
    ? (customReason.trim() || 'Lý do khác')
    : (customReason.trim() ? `${selectedReason} - ${customReason.trim()}` : selectedReason);

  const handleOpenWithdraw = (app: MyApplication) => {
    setWithdrawTarget(app);
    setSelectedReason(STANDARD_REASONS[0]);
    setCustomReason('');
    setModalError('');
  };

  const handleConfirmWithdraw = async () => {
    if (!withdrawTarget) return;
    setSubmitting(true);
    setModalError('');
    try {
      await apiRequest(`/applications/${withdrawTarget.id}/withdraw`, {
        method: 'POST',
        body: JSON.stringify({ reason: finalReason }),
      });

      const code = withdrawTarget.tracking_code || `APP-${String(withdrawTarget.id).padStart(8, '0')}`;
      const jobName = withdrawTarget.job_title || 'N/A';

      // Trigger Rich Toast
      showToast(
        'Đã rút hồ sơ thành công!',
        `Hồ sơ cho vị trí ${jobName} đã được cập nhật sang trạng thái dừng xét duyệt.`,
        'success',
        [
          { label: 'Mã hồ sơ', value: code },
          { label: 'Vị trí', value: jobName },
          { label: 'Thời gian', value: new Date().toLocaleTimeString('vi-VN') },
          { label: 'Lý do', value: finalReason },
        ],
      );

      setWithdrawTarget(null);
      await reload();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Không thể rút hồ sơ. Vui lòng thử lại sau.';
      setModalError(msg);
      showToast('Không rút được hồ sơ', msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 antialiased pb-12">
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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hồ sơ đã nộp của tôi</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi tiến trình xét duyệt và quản lý các hồ sơ ứng tuyển cá nhân của bạn.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => reload()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Làm mới
          </button>
          <Link
            href="/candidate/jobs"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-sm"
          >
            Tìm việc mới
          </Link>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-12 text-center">
            <LoadingState />
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !data?.length ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <UserX className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-slate-700">Bạn chưa nộp hồ sơ ứng tuyển nào</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Các vị trí việc làm mới nhất đang chờ bạn khám phá. Hãy nộp hồ sơ ngay hôm nay để không bỏ lỡ cơ hội!
            </p>
            <Link
              href="/candidate/jobs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-sm"
            >
              Khám phá cơ hội việc làm
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/70">
                <tr>
                  <th className="px-5 py-3.5">Vị trí ứng tuyển</th>
                  <th className="px-4 py-3.5">Phòng ban</th>
                  <th className="px-4 py-3.5">Mã tra cứu</th>
                  <th className="px-4 py-3.5">Ngày nộp</th>
                  <th className="px-4 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {data.map((a) => {
                  const code = a.tracking_code || `APP-${String(a.id).padStart(8, '0')}`;
                  const isWithdrawn = a.status === 'withdrawn';
                  const isTerminal = TERMINAL_STATUSES.has(a.status);
                  const canWithdraw = !isTerminal;

                  return (
                    <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <Link
                          href={`/candidate/jobs/${a.job_posting_id}`}
                          className="font-bold text-slate-900 hover:text-blue-600 transition-colors block"
                        >
                          {a.job_title || '—'}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{a.department || '—'}</td>
                      <td className="px-4 py-4">
                        <span className="font-mono text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {code}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-500 text-xs">{a.applied_date || '—'}</td>
                      <td className="px-4 py-4">
                        {isWithdrawn ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                            <UserX className="w-3 h-3 text-slate-400" />
                            Ứng viên rút
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                            {a.public_status || a.status}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right space-x-2">
                        <Link
                          href={`/candidate/track?code=${code}`}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1"
                        >
                          <Search className="w-3 h-3" />
                          Tra cứu
                        </Link>
                        {canWithdraw && (
                          <button
                            type="button"
                            onClick={() => handleOpenWithdraw(a)}
                            className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors inline-flex items-center gap-1 ml-2 cursor-pointer"
                          >
                            <UserX className="w-3 h-3" />
                            Rút hồ sơ
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* WITHDRAW MODAL (DOUBLE CONFIRMATION)                                      */}
      {/* ========================================================================= */}
      {withdrawTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Xác nhận rút hồ sơ ứng tuyển</h3>
                <p className="text-xs text-slate-500 mt-0.5">Dừng quá trình xét duyệt cho vị trí này.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Mã hồ sơ:</span>
                <span className="font-mono font-bold text-slate-800">
                  {withdrawTarget.tracking_code || `APP-${String(withdrawTarget.id).padStart(8, '0')}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vị trí:</span>
                <span className="font-bold text-slate-800">{withdrawTarget.job_title}</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Lý do rút hồ sơ <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {STANDARD_REASONS.map((r, i) => (
                  <option key={i} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <textarea
                rows={2}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Nhập thêm chi tiết (không bắt buộc)..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {modalError}
              </div>
            )}

            <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setWithdrawTarget(null)}
                disabled={submitting}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmWithdraw}
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
