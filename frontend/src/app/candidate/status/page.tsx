'use client';

import React, { useState } from 'react';
import { CandidateFrame, candidateBtn, candidateInput } from '@/components/candidate/CandidateFrame';
import { apiRequest, ApiError } from '@/lib/api-client';

type Result = { tracking_code: string; job_title: string; status: string; applied_date: string };

export default function CandidateStatusPage() {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setResult(null);
    try {
      setResult(await apiRequest<Result>('/public/applications/status', { method: 'POST', body: JSON.stringify({ tracking_code: code.trim(), email: email.trim() }) }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không tra cứu được.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CandidateFrame title="Tra cứu trạng thái hồ sơ" subtitle="Nhập mã tra cứu trong email xác nhận và email bạn đã dùng khi nộp hồ sơ.">
      <form onSubmit={submit} className="space-y-3">
        <input required placeholder="Mã tra cứu (ví dụ APP-ABC12345)" value={code} onChange={(e) => setCode(e.target.value)} className={candidateInput} />
        <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={candidateInput} />
        <button disabled={loading} className={candidateBtn}>{loading ? 'Đang tra cứu...' : 'Tra cứu'}</button>
      </form>
      {error && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</div>}
      {result && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 space-y-1 text-sm">
          <div className="text-slate-600">Vị trí: <strong className="text-slate-900">{result.job_title}</strong></div>
          <div className="text-slate-600">Ngày nộp: {result.applied_date}</div>
          <div className="text-lg font-bold text-blue-700 pt-1">{result.status}</div>
        </div>
      )}
    </CandidateFrame>
  );
}
