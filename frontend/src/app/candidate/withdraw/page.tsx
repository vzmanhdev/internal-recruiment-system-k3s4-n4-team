'use client';

import React, { useEffect, useState } from 'react';
import { CandidateFrame, candidateBtn, candidateInput, useLinkToken } from '@/components/candidate/CandidateFrame';
import { apiRequest, ApiError } from '@/lib/api-client';

export default function CandidateWithdrawPage() {
  const token = useLinkToken();
  const [info, setInfo] = useState<{ job_title: string; status: string } | null>(null);
  const [reason, setReason] = useState('');
  const [done, setDone] = useState(false);
  const [fetchError, setError] = useState<string | null>(null);
  const error = token === null ? 'Liên kết không hợp lệ.' : fetchError;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token === undefined) return;
    if (!token) return;
    apiRequest<{ job_title: string; status: string }>('/public/applications/withdraw', { method: 'POST', body: JSON.stringify({ token }) })
      .then(setInfo)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Liên kết không hợp lệ.'));
  }, [token]);

  const confirm = async () => {
    setLoading(true);
    try {
      await apiRequest('/public/applications/withdraw', { method: 'POST', body: JSON.stringify({ token, confirm: true, reason: reason || undefined }) });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không rút được hồ sơ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CandidateFrame title="Rút hồ sơ ứng tuyển" subtitle="Hồ sơ sẽ chuyển sang trạng thái 'Ứng viên rút' và không được xử lý tiếp.">
      {error ? <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</div>
        : done ? <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-3">Bạn đã rút hồ sơ thành công. Cảm ơn bạn đã quan tâm.</div>
        : !info ? <div className="text-sm text-slate-500">Đang kiểm tra liên kết...</div>
        : (
          <div className="space-y-3">
            <div className="text-sm text-slate-700">Vị trí: <strong>{info.job_title}</strong> · Trạng thái hiện tại: {info.status}</div>
            <textarea placeholder="Lý do (không bắt buộc)" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className={candidateInput} />
            <button onClick={confirm} disabled={loading} className={`${candidateBtn} bg-rose-600 hover:bg-rose-700`}>{loading ? 'Đang xử lý...' : 'Xác nhận rút hồ sơ'}</button>
          </div>
        )}
    </CandidateFrame>
  );
}
