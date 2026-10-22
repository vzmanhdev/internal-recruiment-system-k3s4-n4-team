'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Pagination } from '@/components/ui/Pagination';
import { 
  ShieldCheck, CheckCircle2, XCircle, Clock, AlertCircle, Eye, 
  MessageSquare, UserCheck, ArrowRight, Building2, DollarSign, Calendar,
  RotateCcw, Check, X, AlertTriangle, Info
} from 'lucide-react';
import clsx from 'clsx';
import { apiRequest, ApiError } from '@/lib/api-client';
import { requisitionService, type RequisitionItem, type RequisitionApprovalLog } from '@/services/requisition.service';
import { offerService, type OfferItem } from '@/services/offer.service';
import { useApiData } from '@/hooks/useApiData';
import { ErrorState, LoadingState } from '@/components/ui/DataStates';

const STEP_NAME: Record<string, string> = {
  manager: 'Trưởng phòng chuyên môn', hr: 'Trưởng phòng Nhân sự (HR Manager)', executive: 'Ban Giám Đốc',
};
const M = 1_000_000;
const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('vi-VN') : undefined);

/** Requisition waiting in the approval chain -> step timeline (from the real approval history). */
function requisitionItem(r: RequisitionItem & { approval_chain?: string[]; approval_step_index?: number; approval_logs?: RequisitionApprovalLog[] }): ApprovalItem {
  const chain = r.approval_chain?.length ? r.approval_chain : ['manager', 'hr'];
  const current = Math.min(chain.length, (r.approval_step_index ?? 0) + 1);
  const decisions = (r.approval_logs || []).filter((l) => l.action === 'approved' || l.action === 'rejected');
  return {
    id: `req-${r.id}`,
    code: r.code,
    type: 'requisition',
    title: `Tờ trình tuyển dụng ${r.title}`,
    department: r.department_name || '',
    requester: r.creator_name || '',
    amount_or_headcount: `${r.quantity} chỉ tiêu (${r.min_salary ? Math.round(r.min_salary / M) : '?'} - ${r.max_salary ? Math.round(r.max_salary / M) : '?'} TR VNĐ)`,
    current_step: current,
    total_steps: chain.length,
    steps: chain.map((code, i) => {
      const log = i < current - 1 ? decisions[i] : undefined;
      return {
        step_num: i + 1, role_name: STEP_NAME[code] || code, approver_name: log?.approver_name || undefined,
        status: i < current - 1 ? 'approved' : 'pending', updated_at: when(log?.created_at), comment: log?.comment || undefined,
      };
    }),
    created_at: r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN') : '',
  };
}

/** Offer waiting for approval: HR Manager level, plus the executive level when out of band. */
function offerItem(o: OfferItem): ApprovalItem {
  const levels = o.requires_escalation ? ['hr', 'executive'] : ['hr'];
  const current = o.approval_level === 'executive' ? 2 : 1;
  const hrLog = (o.approval_logs || []).find((l) => l.action === 'approved' && (l.level || 'hr_manager') !== 'executive');
  const over = o.band_max && o.offered_salary > o.band_max ? Math.round(((o.offered_salary - o.band_max) / o.band_max) * 100) : 0;
  return {
    id: `offer-${o.id}`,
    code: `OFFER-${o.id}`,
    type: 'offer',
    title: `Thư mời nhận việc (Offer) — Ứng viên ${o.candidate_name || ''}`,
    department: o.department || '',
    requester: o.created_by_name || '',
    amount_or_headcount: `Lương ${Math.round(o.offered_salary / M)} TR VNĐ${over ? ` (Vượt dải ${over}%)` : ''}`,
    current_step: current,
    total_steps: levels.length,
    steps: levels.map((code, i) => ({
      step_num: i + 1, role_name: STEP_NAME[code], status: i < current - 1 ? 'approved' : 'pending',
      approver_name: i < current - 1 ? hrLog?.actor_name || undefined : undefined,
      updated_at: i < current - 1 ? when(hrLog?.created_at) : undefined, comment: i < current - 1 ? hrLog?.comment || undefined : undefined,
    })),
    created_at: o.created_at ? new Date(o.created_at).toLocaleDateString('vi-VN') : '',
  };
}

async function loadApprovals(): Promise<ApprovalItem[]> {
  const [reqs, offers] = await Promise.all([
    requisitionService.getRequisitions(),
    offerService.getOffers('pending_approval').catch(() => []),
  ]);
  const pending = reqs.filter((r) => r.status.startsWith('pending_'));
  const detailed = await Promise.all(pending.map((r) => apiRequest<RequisitionItem & { approval_logs?: RequisitionApprovalLog[] }>(`/requisitions/${r.id}`)));
  return [...detailed.map(requisitionItem), ...offers.map(offerItem)];
}

interface ApprovalItem {
  id: string;
  code: string;
  type: 'requisition' | 'offer';
  title: string;
  department: string;
  requester: string;
  amount_or_headcount: string;
  current_step: number;
  total_steps: number;
  steps: Array<{
    step_num: number;
    role_name: string;
    approver_name?: string;
    status: 'approved' | 'pending' | 'rejected';
    updated_at?: string;
    comment?: string;
  }>;
  created_at: string;
}

export default function HRApprovalsPage() {
  const { data, error, loading, reload } = useApiData(loadApprovals, []);
  const approvals = data || [];
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [actionError, setActionError] = useState('');
  const [selectedApp, setSelectedApp] = useState<ApprovalItem | null>(null);
  const [actionComment, setActionComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalPages = Math.max(1, Math.ceil(approvals.length / pageSize));
  const paginatedApprovals = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return approvals.slice(start, start + pageSize);
  }, [approvals, currentPage, pageSize]);

  // Toast notification state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Decisions go through the approval engine; the server checks that it is really this user's step
  const handleDecision = async (decision: 'approved' | 'rejected' | 'changes_requested') => {
    if (!selectedApp) return;
    if ((decision === 'rejected' || decision === 'changes_requested') && !actionComment.trim()) {
      const msg = decision === 'rejected' ? 'Từ chối bắt buộc phải nhập lý do.' : 'Yêu cầu bổ sung bắt buộc phải nhập ý kiến chỉ đạo.';
      setActionError(msg);
      showToast(msg, 'warning');
      return;
    }
    const [kind, rawId] = selectedApp.id.split('-');
    setIsSubmitting(true);
    try {
      if (kind === 'req') {
        await requisitionService.approveRequisition(Number(rawId), decision, actionComment.trim() || undefined);
      } else {
        await offerService.decide(Number(rawId), decision, actionComment.trim() || undefined);
      }
      const actionText =
        decision === 'approved'
          ? `Đã phê duyệt ${selectedApp.code}.`
          : decision === 'rejected'
            ? `Đã từ chối ${selectedApp.code}.`
            : `Đã yêu cầu người lập bổ sung ${selectedApp.code}.`;
      showToast(actionText, decision === 'approved' ? 'success' : decision === 'rejected' ? 'error' : 'warning');
      setActionError('');
      setSelectedApp(null);
      setActionComment('');
      reload();
    } catch (err) {
      if (err instanceof ApiError && (err.status === 409 || (err.status === 400 && err.message.includes('trạng thái')))) {
        showToast(err.message || 'Hồ sơ đã thay đổi trạng thái. Đang cập nhật dữ liệu mới...', 'warning');
        setActionError('');
        setSelectedApp(null);
        setActionComment('');
        reload();
      } else {
        const msg = err instanceof ApiError ? err.message : 'Không ghi nhận được quyết định.';
        setActionError(msg);
        showToast(msg, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Trung Tâm Phê Duyệt Tuyển Dụng 3 Cấp</h1>
          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
            [S3-01] Approval Engine
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">Duyệt tờ trình tuyển dụng & offer vượt dải lương theo luồng phê duyệt 3 cấp động</p>
      </div>

      {/* Main Queue List */}
      {approvals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Hàng đợi trống</h3>
          <p className="text-xs text-slate-400 mt-1">Hiện không có tờ trình hoặc đề xuất offer nào đang chờ HR duyệt.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedApprovals.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4 hover:shadow-md transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${
                    item.type === 'requisition' ? 'bg-blue-600' : 'bg-emerald-600'
                  }`}>
                    {item.type === 'requisition' ? <Building2 className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-slate-100 text-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded">
                        {item.code}
                      </span>
                      <h2 className="text-base font-bold text-slate-900">{item.title}</h2>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Phòng ban: <strong>{item.department}</strong> | Người yêu cầu: <strong>{item.requester}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setSelectedApp(item)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Xử Lý Phê Duyệt</span>
                  </button>
                </div>
              </div>

              {/* 3-Step Dynamic Approval Timeline */}
              <div>
                <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-3">
                  Tiến Độ Luồng Phê Duyệt (Cấp {item.current_step}/{item.total_steps})
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {item.steps.map((step) => (
                    <div 
                      key={step.step_num}
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        step.status === 'approved' 
                          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' 
                          : step.status === 'pending' && step.step_num === item.current_step
                          ? 'bg-amber-50/70 border-amber-200 text-amber-900 shadow-sm animate-pulse'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>Cấp {step.step_num}: {step.role_name}</span>
                        {step.status === 'approved' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        {step.status === 'pending' && <Clock className="w-4 h-4 text-amber-600" />}
                      </div>
                      {step.approver_name && (
                        <div className="text-[11px]">Người duyệt: <strong>{step.approver_name}</strong></div>
                      )}
                      {step.comment && (
                        <p className="text-[11px] italic text-slate-600">&ldquo;{step.comment}&rdquo;</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ))}

          {/* Pagination bar */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={approvals.length}
              pageSize={pageSize}
              pageSizeOptions={[5, 10, 20, 50]}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              onPageChange={(page) => setCurrentPage(page)}
              itemLabel="hồ sơ chờ duyệt"
            />
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Phê Duyệt: {selectedApp.code}</h3>
              <button onClick={() => setSelectedApp(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="font-bold text-slate-900">{selectedApp.title}</div>
                <div className="text-slate-600">Chi tiết: {selectedApp.amount_or_headcount}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ý Kiến Phê Duyệt / Nhận Xét (Không bắt buộc)</label>
                <textarea 
                  rows={3}
                  placeholder="Ghi nhận xét của Trưởng phòng HR..."
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              {actionError && <p className="text-xs font-semibold text-rose-600">{actionError}</p>}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button 
                  disabled={isSubmitting}
                  onClick={() => handleDecision('rejected')}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Từ Chối</span>
                </button>
                {selectedApp.type === 'requisition' && (
                  <button 
                    disabled={isSubmitting}
                    onClick={() => handleDecision('changes_requested')}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Yêu Cầu Bổ Sung</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  disabled={isSubmitting}
                  onClick={() => { setSelectedApp(null); setActionError(''); setActionComment(''); }} 
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button 
                  disabled={isSubmitting}
                  onClick={() => handleDecision('approved')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Phê Duyệt (Approve)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback Notification (Always on top of modals via createPortal onto document.body with z-[99999]) */}
      {mounted && toast && createPortal(
        <div
          className={clsx(
            'fixed bottom-6 right-6 z-[99999] px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-bold animate-in slide-in-from-bottom-5 duration-200 backdrop-blur-md pointer-events-auto',
            toast.type === 'success' && 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20',
            toast.type === 'error' && 'bg-rose-600 text-white border-rose-500 shadow-rose-500/20',
            toast.type === 'warning' && 'bg-amber-500 text-white border-amber-400 shadow-amber-500/20',
            toast.type === 'info' && 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20'
          )}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
          {toast.type === 'error' && <XCircle className="w-4 h-4 shrink-0" />}
          {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 shrink-0" />}
          {toast.type === 'info' && <Info className="w-4 h-4 shrink-0" />}
          <span>{toast.message}</span>
        </div>,
        document.body
      )}
    </div>
  );
}
