'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, ChevronLeft } from 'lucide-react';
import { apiRequest, ApiError } from '@/lib/api-client';
import { useApiData } from '@/hooks/useApiData';
import { ErrorState, LoadingState } from '@/components/ui/DataStates';

/** S4-06: withdraw an application from the confirmation e-mail link (preview first, then confirm; single use). */
function WithdrawByLink() {
  const token = useSearchParams().get('token') || '';
  const { data, error, loading, reload } = useApiData(
    () => apiRequest<{ job_title: string | null; status: string }>('/public/applications/withdraw', {
      method: 'POST', body: JSON.stringify({ token, confirm: false }),
    }),
    [token],
  );
  const [reason, setReason] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const confirm = async () => {
    setSubmitting(true);
    setFormError('');
    try {
      await apiRequest('/public/applications/withdraw', {
        method: 'POST', body: JSON.stringify({ token, confirm: true, reason: reason.trim() || undefined }),
      });
      setDone(true);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Không rút được hồ sơ. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) return <ErrorState error={new ApiError(404, 'Liên kết không hợp lệ hoặc đã hết hiệu lực.')} />;
  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="max-w-xl mx-auto mt-6 sm:mt-10 space-y-6 pb-12 antialiased">
      <Link href="/candidate/jobs" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-blue-600">
        <ChevronLeft className="w-4 h-4" />
        Quay lại Cổng tuyển dụng
      </Link>
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
        {done ? (
          <div className="text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h1 className="text-xl font-black text-slate-900">Đã rút hồ sơ</h1>
            <p className="text-sm text-slate-500">Hồ sơ ứng tuyển vị trí <strong>{data.job_title}</strong> đã được rút. Cảm ơn bạn đã quan tâm.</p>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <h1 className="text-xl font-black text-slate-900">Rút hồ sơ ứng tuyển</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Vị trí: <strong className="text-slate-800">{data.job_title}</strong> · Trạng thái hiện tại: <strong>{data.status}</strong>
                </p>
                <p className="text-xs text-slate-500 mt-2">Sau khi rút, hồ sơ sẽ không được xem xét tiếp và liên kết này hết hiệu lực.</p>
              </div>
            </div>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Lý do rút hồ sơ (không bắt buộc)"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
            />
            {formError && <p className="text-sm font-semibold text-rose-600">{formError}</p>}
            <button
              type="button"
              onClick={confirm}
              disabled={submitting}
              className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Đang xử lý...' : 'Xác nhận rút hồ sơ'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function WithdrawByLinkPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <WithdrawByLink />
    </Suspense>
  );
}
