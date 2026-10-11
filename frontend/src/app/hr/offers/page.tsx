'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Send, XCircle, MessageSquareWarning } from 'lucide-react';
import { offerService, type OfferItem, type OfferDecisionAction } from '@/services/offer.service';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/api-client';

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Nháp', cls: 'bg-slate-50 text-slate-600 border-slate-200' },
  pending_approval: { label: 'Chờ Phê Duyệt', cls: 'bg-amber-50 text-amber-700 border-amber-100' },
  approved: { label: 'Đã Duyệt — Chờ Gửi', cls: 'bg-blue-50 text-blue-700 border-blue-100' },
  rejected: { label: 'Bị Từ Chối', cls: 'bg-rose-50 text-rose-700 border-rose-100' },
  sent: { label: 'Đã Gửi Ứng Viên', cls: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  accepted: { label: 'Ứng Viên Đã Đồng Ý', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  declined: { label: 'Ứng Viên Từ Chối', cls: 'bg-rose-50 text-rose-700 border-rose-100' },
  expired: { label: 'Hết Hạn', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
};

function formatMoney(value: number, currency: string) {
  return `${value.toLocaleString('vi-VN')} ${currency}`;
}

export default function HROffersPage() {
  const { showSuccess, showError } = useToast();
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [commentFor, setCommentFor] = useState<{ id: number; action: OfferDecisionAction } | null>(null);
  const [comment, setComment] = useState('');

  const load = useCallback(async () => {
    try {
      setOffers(await offerService.getOffers());
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Không tải được danh sách offer.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const reload = () => {
    setLoading(true);
    setLoadError(null);
    void load();
  };

  const replace = (updated: OfferItem) => setOffers((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));

  const run = async (id: number, fn: () => Promise<OfferItem>, success: string) => {
    setBusyId(id);
    try {
      replace(await fn()); // reflect the persisted server state, not a local guess
      showSuccess(success);
    } catch (err) {
      showError(err instanceof ApiError ? err.message : 'Thao tác thất bại.');
    } finally {
      setBusyId(null);
    }
  };

  const decide = (offer: OfferItem, action: OfferDecisionAction) => {
    if (action !== 'approved') {
      setCommentFor({ id: offer.id, action });
      setComment('');
      return;
    }
    run(offer.id, () => offerService.decide(offer.id, 'approved'), 'Đã phê duyệt offer.');
  };

  const confirmComment = () => {
    if (!commentFor) return;
    if (!comment.trim()) {
      showError('Từ chối hoặc Yêu cầu sửa bắt buộc phải nhập ý kiến.');
      return;
    }
    const { id, action } = commentFor;
    setCommentFor(null);
    run(id, () => offerService.decide(id, action, comment.trim()),
      action === 'rejected' ? 'Đã từ chối offer.' : 'Đã yêu cầu chỉnh sửa offer.');
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quản Lý Thư Mời Nhận Việc (Offer Letters)</h1>
            <span className="bg-amber-50 text-amber-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200">
              [S7-04 / S7-05] Duyệt theo dải lương
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Offer trong dải chuẩn do Trưởng phòng Nhân sự duyệt; offer vượt dải tự động chuyển thêm cấp Người duyệt.</p>
        </div>
        <button onClick={reload} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">
          <RefreshCw className="w-4 h-4" /> Tải lại
        </button>
      </div>

      {commentFor && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-4 space-y-3">
          <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
            <MessageSquareWarning className="w-4 h-4 text-amber-600" />
            {commentFor.action === 'rejected' ? 'Lý do từ chối offer' : 'Nội dung yêu cầu chỉnh sửa'} (bắt buộc)
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
            className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setCommentFor(null)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">Huỷ</button>
            <button onClick={confirmComment} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer">Xác nhận</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 flex items-center justify-center gap-2 text-xs text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải dữ liệu offer...</div>
        ) : loadError ? (
          <div className="p-10 text-center text-xs text-rose-600">{loadError}</div>
        ) : offers.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">Chưa có offer nào trong phạm vi bạn được xem.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Ứng Viên</th>
                  <th className="p-4">Vị Trí</th>
                  <th className="p-4 text-center">Lương Đề Xuất</th>
                  <th className="p-4">Dải Lương</th>
                  <th className="p-4 text-center">Ngày Đi Làm</th>
                  <th className="p-4 text-center">Trạng Thái</th>
                  <th className="p-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {offers.map((off) => {
                  const st = STATUS_LABELS[off.status] || { label: off.status, cls: 'bg-slate-50 text-slate-600 border-slate-200' };
                  const busy = busyId === off.id;
                  return (
                    <tr key={off.id} className="hover:bg-slate-50/70 transition-colors align-top">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{off.candidate_name}</div>
                        <div className="text-[11px] text-slate-400">{off.candidate_email}</div>
                        <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">OFFER #{off.id} · v{off.revision ?? 1}</span>
                      </td>
                      <td className="p-4 font-bold text-slate-800">{off.job_title}</td>
                      <td className="p-4 text-center font-extrabold text-slate-900 font-mono">{formatMoney(off.offered_salary, off.currency)}</td>
                      <td className="p-4">
                        {off.requires_escalation ? (
                          <span className="bg-rose-50 text-rose-600 border border-rose-200 px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Ngoài dải chuẩn — cần Người duyệt
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Trong dải lương
                          </span>
                        )}
                        {off.salary_justification && <div className="text-[11px] text-slate-500 mt-1">Giải trình: {off.salary_justification}</div>}
                      </td>
                      <td className="p-4 text-center font-semibold text-slate-800">{off.start_date}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${st.cls}`}>{st.label}</span>
                        {off.status === 'pending_approval' && (
                          <div className="text-[10px] text-slate-400 mt-1">Cấp: {off.approval_level === 'approver' ? 'Người duyệt' : 'Trưởng phòng Nhân sự'}</div>
                        )}
                        {off.status === 'accepted' && (
                          <div className="text-[10px] text-slate-500 mt-1">Onboarding {off.onboarding_progress ?? 0}%</div>
                        )}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        {busy && <Loader2 className="w-4 h-4 animate-spin inline text-slate-400" />}
                        {!busy && off.status === 'pending_approval' && (
                          <div className="inline-flex gap-1.5">
                            <button onClick={() => decide(off, 'approved')} className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 cursor-pointer">Duyệt</button>
                            <button onClick={() => decide(off, 'changes_requested')} className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold cursor-pointer">Yêu cầu sửa</button>
                            <button onClick={() => decide(off, 'rejected')} className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold cursor-pointer inline-flex items-center gap-1"><XCircle className="w-3 h-3" />Từ chối</button>
                          </div>
                        )}
                        {!busy && off.status === 'approved' && (
                          <button onClick={() => run(off.id, () => offerService.sendOffer(off.id), 'Đã gửi offer cho ứng viên.')}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700 cursor-pointer inline-flex items-center gap-1">
                            <Send className="w-3 h-3" /> Gửi ứng viên
                          </button>
                        )}
                        {!busy && off.status === 'draft' && (
                          <button onClick={() => run(off.id, () => offerService.submitOffer(off.id), 'Đã gửi duyệt offer.')}
                            className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700 cursor-pointer">Gửi duyệt</button>
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
    </div>
  );
}
