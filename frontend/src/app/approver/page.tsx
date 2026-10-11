'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Loader2, MessageSquareWarning, RefreshCw } from 'lucide-react';
import { RoleWorkspaceShell } from '@/components/layout/RoleWorkspaceShell';
import { requisitionService, type RequisitionItem } from '@/services/requisition.service';
import { offerService, type OfferItem } from '@/services/offer.service';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/api-client';

type Action = 'approved' | 'rejected' | 'changes_requested';
type Pending = { kind: 'REQ'; item: RequisitionItem } | { kind: 'OFFER'; item: OfferItem };

const money = (n?: number | null) => (n ? n.toLocaleString('vi-VN') + ' VNĐ' : 'Thỏa thuận');

export default function ApproverWorkspacePage() {
  const { showSuccess, showError } = useToast();
  const [items, setItems] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [commentFor, setCommentFor] = useState<{ key: string; action: Action } | null>(null);
  const [comment, setComment] = useState('');

  const load = useCallback(async () => {
    try {
      const [step1, exec, offers] = await Promise.all([
        requisitionService.getRequisitions('pending_manager'),
        requisitionService.getRequisitions('pending_executive'),
        offerService.getOffers('pending_approval'),
      ]);
      setItems([
        ...[...step1, ...exec].map((item) => ({ kind: 'REQ' as const, item })),
        ...offers.filter((o) => o.approval_level === 'approver').map((item) => ({ kind: 'OFFER' as const, item })),
      ]);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Không tải được danh sách chờ duyệt.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const keyOf = (p: Pending) => `${p.kind}-${p.item.id}`;

  const decide = async (p: Pending, action: Action, text?: string) => {
    setBusy(keyOf(p));
    try {
      if (p.kind === 'REQ') await requisitionService.approveRequisition(p.item.id, action, text);
      else await offerService.decide(p.item.id, action, text);
      showSuccess(action === 'approved' ? 'Đã phê duyệt.' : action === 'rejected' ? 'Đã từ chối.' : 'Đã yêu cầu bổ sung.');
      await load(); // reflect the persisted state
    } catch (err) {
      showError(err instanceof ApiError ? err.message : 'Thao tác thất bại.');
    } finally {
      setBusy(null);
    }
  };

  const confirmComment = () => {
    const target = items.find((p) => keyOf(p) === commentFor?.key);
    if (!commentFor || !target) return;
    if (!comment.trim()) {
      showError('Từ chối hoặc Yêu cầu bổ sung bắt buộc phải nhập ý kiến.');
      return;
    }
    const { action } = commentFor;
    setCommentFor(null);
    void decide(target, action, comment.trim());
  };

  return (
    <RoleWorkspaceShell title="Approver Workspace" badge="Người duyệt" subtitle="Phê duyệt yêu cầu tuyển dụng và offer vượt hạn mức lương"
      icon={<ShieldCheck className="w-6 h-6" />} accent="from-amber-500 to-orange-500">
      <div className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Hồ sơ chờ bạn duyệt ({items.length})</h2>
            <p className="text-xs text-slate-500">Tờ trình đang ở cấp duyệt của bạn và offer vượt dải lương chuẩn đã qua Trưởng phòng Nhân sự.</p>
          </div>
          <button onClick={() => { setLoading(true); void load(); }} className="p-2 rounded-xl border border-gray-200 hover:bg-slate-50 cursor-pointer" title="Tải lại">
            <RefreshCw className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {commentFor && (
          <div className="rounded-2xl border border-amber-200 p-4 space-y-3 bg-amber-50/40">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-2"><MessageSquareWarning className="w-4 h-4 text-amber-600" />Ý kiến (bắt buộc)</div>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="w-full border border-slate-200 rounded-xl p-3 text-xs bg-white" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setCommentFor(null)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">Huỷ</button>
              <button onClick={confirmComment} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white cursor-pointer">Xác nhận</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-10 flex justify-center gap-2 text-xs text-slate-500"><Loader2 className="w-4 h-4 animate-spin" />Đang tải...</div>
        ) : loadError ? (
          <div className="py-10 text-center text-xs text-rose-600">{loadError}</div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500">Không có hồ sơ nào đang chờ bạn duyệt.</div>
        ) : (
          <div className="space-y-3">
            {items.map((p) => {
              const k = keyOf(p);
              const isReq = p.kind === 'REQ';
              const title = isReq ? `${p.item.code} · ${p.item.title}` : `Offer: ${p.item.candidate_name} — ${p.item.job_title}`;
              const detail = isReq
                ? `${p.item.department_name || ''} · SL ${p.item.quantity} · ${money(p.item.max_salary)} · Cấp: ${p.item.status === 'pending_executive' ? 'Ban Giám đốc' : 'Trưởng khối'}`
                : `${money(p.item.offered_salary)} · Giải trình: ${p.item.salary_justification || '—'}`;
              return (
                <div key={k} className="border border-gray-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      {!isReq && <AlertTriangle className="w-4 h-4 text-rose-500" />}{title}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{detail}</div>
                  </div>
                  {busy === k ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : (
                    <div className="flex gap-1.5">
                      <button onClick={() => decide(p, 'approved')} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"><CheckCircle2 className="w-3.5 h-3.5" />Duyệt</button>
                      <button onClick={() => { setCommentFor({ key: k, action: 'changes_requested' }); setComment(''); }} className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold cursor-pointer">Yêu cầu bổ sung</button>
                      <button onClick={() => { setCommentFor({ key: k, action: 'rejected' }); setComment(''); }} className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"><XCircle className="w-3.5 h-3.5" />Từ chối</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RoleWorkspaceShell>
  );
}
