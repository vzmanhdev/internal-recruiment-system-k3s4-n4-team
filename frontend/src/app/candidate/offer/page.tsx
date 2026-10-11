'use client';

import React, { useEffect, useState } from 'react';
import { CandidateFrame, candidateBtn, candidateInput, useLinkToken } from '@/components/candidate/CandidateFrame';
import { apiRequest, ApiError } from '@/lib/api-client';

type Offer = {
  candidate_name: string; job_title: string; offered_salary: number; allowance: number; currency: string; start_date: string;
  work_location: string; probation_duration_months: number; probation_salary_percentage: number; response_deadline?: string;
};
const REASONS: Array<[string, string]> = [['salary', 'Mức lương'], ['location', 'Địa điểm'], ['other_offer', 'Đã nhận việc nơi khác'], ['personal', 'Lý do cá nhân'], ['other', 'Khác']];

export default function CandidateOfferPage() {
  const token = useLinkToken();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [decline, setDecline] = useState(false);
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [fetchError, setError] = useState<string | null>(null);
  const error = token === null ? 'Liên kết không hợp lệ.' : fetchError;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token === undefined) return;
    if (!token) return;
    apiRequest<Offer>(`/public/offers?token=${encodeURIComponent(token)}`)
      .then(setOffer)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Liên kết không hợp lệ hoặc đã hết hạn.'));
  }, [token]);

  const respond = async (decision: 'accepted' | 'declined') => {
    if (decision === 'declined' && !reason) { setError('Vui lòng chọn lý do từ chối.'); return; }
    setLoading(true); setError(null);
    try {
      const r = await apiRequest<{ status: string }>('/public/offers/respond', {
        method: 'POST', body: JSON.stringify({ token, decision, reason_category: reason || undefined, comment: comment || undefined }),
      });
      setResult(r.status);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Không gửi được phản hồi.');
    } finally {
      setLoading(false);
    }
  };

  const money = (n: number, c: string) => `${n.toLocaleString('vi-VN')} ${c}`;

  return (
    <CandidateFrame title="Thư mời nhận việc" subtitle={offer?.response_deadline ? `Vui lòng phản hồi trước ngày ${offer.response_deadline}.` : undefined}>
      {result ? (
        <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-3">
          {result === 'accepted' ? 'Cảm ơn bạn đã chấp nhận offer! Bộ phận Nhân sự sẽ liên hệ để chuẩn bị ngày đầu đi làm.' : 'Chúng tôi đã ghi nhận phản hồi của bạn. Cảm ơn bạn đã dành thời gian.'}
        </div>
      ) : error && !offer ? <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</div>
        : !offer ? <div className="text-sm text-slate-500">Đang tải thư mời...</div>
        : (
          <div className="space-y-3 text-sm">
            <div className="rounded-2xl border border-slate-100 p-4 space-y-1.5">
              <div>Kính gửi <strong>{offer.candidate_name}</strong>,</div>
              <div>Vị trí: <strong>{offer.job_title}</strong></div>
              <div>Lương chính thức: <strong>{money(offer.offered_salary, offer.currency)}</strong>{offer.allowance ? ` · Phụ cấp ${money(offer.allowance, offer.currency)}` : ''}</div>
              <div>Thử việc: {offer.probation_duration_months} tháng ({offer.probation_salary_percentage}% lương)</div>
              <div>Ngày bắt đầu: {offer.start_date} · Địa điểm: {offer.work_location}</div>
            </div>
            {error && <div className="text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</div>}
            <textarea placeholder="Ý kiến của bạn (không bắt buộc)" value={comment} onChange={(e) => setComment(e.target.value)} rows={2} className={candidateInput} />
            {!decline ? (
              <>
                <button disabled={loading} onClick={() => respond('accepted')} className={candidateBtn}>Chấp nhận offer</button>
                <button onClick={() => setDecline(true)} className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold cursor-pointer">Từ chối</button>
              </>
            ) : (
              <>
                <select value={reason} onChange={(e) => setReason(e.target.value)} className={candidateInput}>
                  <option value="">— Lý do từ chối —</option>{REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <button disabled={loading} onClick={() => respond('declined')} className={`${candidateBtn} bg-rose-600 hover:bg-rose-700`}>Xác nhận từ chối</button>
              </>
            )}
          </div>
        )}
    </CandidateFrame>
  );
}
