'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, ClipboardCheck, Loader2, MessageSquareWarning, RefreshCw, XCircle } from 'lucide-react';
import { requisitionService, type RequisitionItem } from '@/services/requisition.service';
import { useToast } from '@/components/ui/Toast';
import { ApiError } from '@/lib/api-client';

type Action = 'approved' | 'rejected' | 'changes_requested';

export default function HRApprovalsPage() {
  const { showSuccess, showError } = useToast();
  const [items, setItems] = useState<RequisitionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [pending, setPending] = useState<{ id: number; action: Action } | null>(null);
  const [comment, setComment] = useState('');

  const load = useCallback(async () => {
    try {
      const [step1, step2] = await Promise.all([
        requisitionService.getRequisitions('pending_manager'),
        requisitionService.getRequisitions('pending_hr'),
      ]);
      setItems([...step1, ...step2]);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Không tải được danh sách chờ duyệt.');
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

  const submit = async (id: number, action: Action, text?: string) => {
    setBusyId(id);
    try {
      const updated = await requisitionService.approveRequisition(id, action, text);
      // Remove from the queue only when the server confirms the new state left the pending steps.
      setItems((prev) => (['pending_manager', 'pending_hr'].includes(updated.status)
        ? prev.map((r) => (r.id === id ? updated : r))
        : prev.filter((r) => r.id !== id)));
      showSuccess(action === 'approved' ? 'Đã duyệt yêu cầu.' : action === 'rejected' ? 'Đã từ chối yêu cầu.' : 'Đã trả hồ sơ yêu cầu bổ sung.');
    } catch (err) {
      showError(err instanceof ApiError ? err.message : 'Thao tác thất bại.');
    } finally {
      setBusyId(null);
    }
  };

  const confirm = () => {
    if (!pending) return;
    if (!comment.trim()) {
      showError('Từ chối hoặc Yêu cầu bổ sung bắt buộc phải nhập ý kiến.');
      return;
    }
    const { id, action } = pending;
    setPending(null);
    submit(id, action, comment.trim());
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hàng Chờ Phê Duyệt Yêu Cầu Tuyển Dụng</h1>
            <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">[S3-02]</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Duyệt, Từ chối hoặc Yêu cầu bổ sung — hai hành động sau bắt buộc nhập ý kiến; lịch sử được ghi lại và không sửa được.</p>
        </div>
        <button onClick={reload} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">
          <RefreshCw className="w-4 h-4" /> Tải lại
        </button>
      </div>

      {pending && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-4 space-y-3">
          <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
            <MessageSquareWarning className="w-4 h-4 text-amber-600" />
            {pending.action === 'rejected' ? 'Lý do từ chối' : 'Nội dung cần bổ sung'} (bắt buộc)
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
            className="w-full border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setPending(null)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer">Huỷ</button>
            <button onClick={confirm} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer">Xác nhận</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 flex items-center justify-center gap-2 text-xs text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải...</div>
        ) : loadError ? (
          <div className="p-10 text-center text-xs text-rose-600">{loadError}</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500 flex flex-col items-center gap-2"><ClipboardCheck className="w-6 h-6 text-slate-300" />Không có yêu cầu nào đang chờ bạn duyệt.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Yêu cầu</th>
                <th className="p-4 text-center">Số lượng</th>
                <th className="p-4 text-center">Dải lương</th>
                <th className="p-4 text-center">Ngày cần người</th>
                <th className="p-4 text-center">Cấp duyệt</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {items.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 align-top">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{r.title}</div>
                    <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">{r.code}</span>
                    {r.department_name && <span className="ml-2 text-[11px] text-slate-400">{r.department_name}</span>}
                  </td>
                  <td className="p-4 text-center font-bold">{r.quantity}</td>
                  <td className="p-4 text-center font-mono">
                    {r.min_salary || r.max_salary ? `${(r.min_salary ?? 0).toLocaleString('vi-VN')} – ${(r.max_salary ?? 0).toLocaleString('vi-VN')}` : 'Thỏa thuận'}
                  </td>
                  <td className="p-4 text-center">{r.target_onboard_date || '—'}</td>
                  <td className="p-4 text-center">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold border bg-amber-50 text-amber-700 border-amber-100">
                      {r.status === 'pending_manager' ? 'Cấp 1 · Trưởng khối' : 'Cấp 2 · HR Manager'}
                    </span>
                  </td>
                  <td className="p-4 text-right whitespace-nowrap">
                    {busyId === r.id ? <Loader2 className="w-4 h-4 animate-spin inline text-slate-400" /> : (
                      <div className="inline-flex gap-1.5">
                        <button onClick={() => submit(r.id, 'approved')} className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"><CheckCircle2 className="w-3 h-3" />Duyệt</button>
                        <button onClick={() => { setPending({ id: r.id, action: 'changes_requested' }); setComment(''); }} className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold cursor-pointer">Yêu cầu bổ sung</button>
                        <button onClick={() => { setPending({ id: r.id, action: 'rejected' }); setComment(''); }} className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"><XCircle className="w-3 h-3" />Từ chối</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
