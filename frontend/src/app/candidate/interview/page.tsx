'use client';

import React, { useEffect, useState } from 'react';
import { CandidateFrame, candidateBtn, candidateInput, useLinkToken } from '@/components/candidate/CandidateFrame';
import { apiRequest, ApiError } from '@/lib/api-client';

type Info = { job_title: string; round_name: string; scheduled_time: string; duration_minutes: number; location: string; meeting_link?: string | null; candidate_response?: string | null };

export default function CandidateInterviewPage() {
  const token = useLinkToken();
  const [info, setInfo] = useState<Info | null>(null);
  const [note, setNote] = useState('');
  const [answered, setAnswered] = useState<string | null>(null);
  const [fetchError, setError] = useState<string | null>(null);
  const error = token === null ? 'Liên kết không hợp lệ.' : fetchError;

  useEffect(() => {
    if (token === undefined) return;
    if (!token) return;
    apiRequest<Info>(`/public/interviews?token=${encodeURIComponent(token)}`)
      .then((i) => { setInfo(i); setAnswered(i.candidate_response || null); })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Liên kết không hợp lệ.'));
  }, [token]);

  const reply = async (response: 'confirmed' | 'reschedule_requested') => {
    try {
      const r = await apiRequest<{ candidate_response: string }>('/public/interviews/respond', { method: 'POST', body: JSON.stringify({ token, response, note: note || undefined }) });
      setAnswered(r.candidate_response);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không gửi được phản hồi.');
    }
  };

  return (
    <CandidateFrame title="Xác nhận lịch phỏng vấn">
      {error ? <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</div>
        : !info ? <div className="text-sm text-slate-500">Đang tải thông tin...</div>
        : (
          <div className="space-y-3 text-sm">
            <div className="rounded-2xl border border-slate-100 p-4 space-y-1">
              <div><strong>{info.job_title}</strong> · {info.round_name}</div>
              <div>{new Date(info.scheduled_time).toLocaleString('vi-VN', { dateStyle: 'full', timeStyle: 'short' })} · {info.duration_minutes} phút</div>
              <div>{info.meeting_link ? <a href={info.meeting_link} className="text-blue-600 font-semibold" target="_blank" rel="noreferrer">Link phỏng vấn trực tuyến</a> : info.location}</div>
            </div>
            {answered ? (
              <div className="text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                {answered === 'confirmed' ? 'Bạn đã xác nhận tham dự. Hẹn gặp bạn!' : 'Đã gửi đề nghị đổi lịch. Bộ phận tuyển dụng sẽ liên hệ lại.'}
              </div>
            ) : (
              <>
                <textarea placeholder="Ghi chú (ví dụ khung giờ thuận tiện nếu cần đổi lịch)" value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={candidateInput} />
                <button onClick={() => reply('confirmed')} className={candidateBtn}>Xác nhận tham dự</button>
                <button onClick={() => reply('reschedule_requested')} className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold cursor-pointer">Đề nghị đổi lịch</button>
              </>
            )}
          </div>
        )}
    </CandidateFrame>
  );
}
