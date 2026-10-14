'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Pagination } from '@/components/ui/Pagination';
import { approvalSteps } from '@/features/manager/api';
import { requisitionService, type RequisitionItem } from '@/services/requisition.service';
import { useAuth } from '@/providers/auth-provider';
import { useApiData } from '@/hooks/useApiData';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/DataStates';
import { ApiError } from '@/lib/api-client';
import {
  GitMerge,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  User,
  Bell,
  ArrowUpRight,
  Search,
  Filter,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import clsx from 'clsx';

interface ApprovalStep {
  stepNumber: number;
  title: string;
  approverName: string;
  approverRole: string;
  department: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'REJECTED';
  timestamp?: string;
  note?: string;
  waitingTime?: string;
  isOverdue?: boolean;
}

interface ApprovalItem {
  id: string;
  dbId: number;
  code: string;
  type: 'REQUISITION' | 'OFFER';
  title: string;
  targetCount?: number;
  salary?: string;
  candidateName?: string;
  department: string;
  creatorName: string;
  createdAt: string;
  overallStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  currentApprover: string;
  currentApproverRole: string;
  slaStatus: 'ON_TIME' | 'WARNING' | 'OVERDUE';
  slaHoursLeft?: number;
  steps: ApprovalStep[];
}

/** Approval progress of requisitions I created (admin: all), from real chains and approval logs. */
function toApprovalItems(reqs: RequisitionItem[]): ApprovalItem[] {
  return reqs
    .filter((r) => r.status !== "draft")
    .map((r) => {
      const steps = approvalSteps(r);
      const current = steps.find((st) => st.status === "IN_PROGRESS");
      const rejected = r.status === "rejected" || r.status === "changes_requested";
      const done = !r.status.startsWith("pending_") && !rejected;
      return {
        id: String(r.id),
        dbId: r.id,
        code: r.code,
        type: "REQUISITION" as const,
        title: r.title,
        targetCount: r.quantity,
        department: r.department_name || "",
        creatorName: r.creator_name || "—",
        createdAt: r.created_at ? new Date(r.created_at).toLocaleDateString("vi-VN") : "—",
        overallStatus: rejected ? ("REJECTED" as const) : done ? ("APPROVED" as const) : ("PENDING" as const),
        currentApprover: current?.approverName || "—",
        currentApproverRole: current?.approverRole || "",
        slaStatus: current?.isOverdue ? ("OVERDUE" as const) : ("ON_TIME" as const),
        steps: steps.map((st) => ({
          stepNumber: st.stepNumber,
          title: st.stepName,
          approverName: st.approverName,
          approverRole: st.approverRole,
          department: st.department,
          status: st.status === "APPROVED" ? ("COMPLETED" as const) : st.status,
          timestamp: st.timestamp,
          note: st.comment,
          waitingTime: st.waitingTime,
          isOverdue: st.isOverdue,
        })),
      };
    });
}

export default function ApprovalsPage() {
  const [selectedType, setSelectedType] = useState<'ALL' | 'REQUISITION' | 'OFFER'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL');
  const { user, isAdmin } = useAuth();
  const { data, error, loading, reload } = useApiData(
    async () => toApprovalItems((await requisitionService.getRequisitions()).filter((r) => isAdmin || r.created_by_id === user?.id)),
    [user?.id, isAdmin],
  );
  const approvalItems: ApprovalItem[] = data || [];
  const [activeItemId, setActiveItemId] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredItems = approvalItems.filter((item) => {
    if (selectedType !== 'ALL' && item.type !== selectedType) return false;
    if (selectedStatus !== 'ALL' && item.overallStatus !== selectedStatus) return false;
    return true;
  });

  // Pagination State (20 items per page)
  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedType, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));

  const paginatedApprovals = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  const activeItem = approvalItems.find((i) => i.id === activeItemId) || approvalItems[0] || null;
  const pendingCount = approvalItems.filter((i) => i.overallStatus === 'PENDING').length;
  const overdueCount = approvalItems.filter((i) => i.slaStatus === 'OVERDUE').length;

  const handleSendReminder = async (approverName: string) => {
    if (!activeItem) return;
    try {
      const r = await requisitionService.remind(activeItem.dbId);
      setToastMessage(r.sent ? `Đã gửi nhắc nhở tới ${r.sent} người phụ trách (${approverName}).` : 'Không có người nhận phù hợp cho bước duyệt hiện tại.');
    } catch (err) {
      setToastMessage(err instanceof ApiError ? err.message : 'Không gửi được nhắc nhở.');
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!activeItem) return <EmptyState hint="Bạn chưa có tờ trình nào đã gửi duyệt." />;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[10px] uppercase tracking-wider">
              Audit Trail & SLA
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Chuỗi Cấp Duyệt & Nhật Ký Thẩm Định
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi trực quan hồ sơ Yêu cầu tuyển dụng và Đề xuất lương đang nằm ở bàn ai duyệt.
          </p>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">Đang chờ duyệt</span>
            <span className="text-lg font-black text-amber-800">{pendingCount} hồ sơ</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-900 text-xs">
            <span className="text-[10px] uppercase font-bold text-rose-700 block">Quá hạn SLA</span>
            <span className="text-lg font-black text-rose-700">{overdueCount} hồ sơ</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setSelectedType('ALL')}
            className={clsx(
              'px-3.5 py-1.5 rounded-lg transition-all cursor-pointer',
              selectedType === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Tất cả loại
          </button>
          <button
            onClick={() => setSelectedType('REQUISITION')}
            className={clsx(
              'px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5',
              selectedType === 'REQUISITION'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Yêu cầu tuyển dụng</span>
          </button>
          <button
            onClick={() => setSelectedType('OFFER')}
            className={clsx(
              'px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5',
              selectedType === 'OFFER'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Đề xuất Offer</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedStatus(selectedStatus === 'PENDING' ? 'ALL' : 'PENDING')}
            className={clsx(
              'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer',
              selectedStatus === 'PENDING'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            )}
          >
            Chỉ xem đang chờ duyệt
          </button>
        </div>
      </div>

      {/* 2-Column Layout: Left List + Right Vertical Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: List of items (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Danh sách hồ sơ cần theo dõi ({filteredItems.length})
          </h2>

          <div className="space-y-3">
            {paginatedApprovals.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-100 shadow-xs">
                Không tìm thấy hồ sơ nào phù hợp.
              </div>
            ) : (
              paginatedApprovals.map((item) => {
                const isSelected = item.id === activeItemId;
                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveItemId(item.id)}
                    className={clsx(
                      'p-5 rounded-2xl transition-all cursor-pointer border text-left',
                      isSelected
                        ? 'bg-white border-blue-500 ring-2 ring-blue-500/10 shadow-md'
                        : 'bg-white border-slate-100 hover:border-slate-200 shadow-xs hover:shadow-sm'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        {item.code}
                      </span>
                      <span
                        className={clsx(
                          'text-[10px] font-extrabold px-2 py-0.5 rounded-full',
                          item.overallStatus === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.slaStatus === 'OVERDUE'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        )}
                      >
                        {item.overallStatus === 'APPROVED'
                          ? 'Đã Duyệt Xong'
                          : item.slaStatus === 'OVERDUE'
                          ? 'Quá SLA'
                          : 'Đang Duyệt'}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1">
                      {item.title}
                    </h3>

                    <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                      <span>{item.department}</span>
                      <span>{item.createdAt}</span>
                    </div>

                    {/* Current Approver Highlight */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="text-[11px] text-slate-600 truncate max-w-[220px]">
                        <span className="text-slate-400">Đang ở bàn: </span>
                        <strong className="text-slate-800">{item.currentApprover}</strong>
                      </div>
                      <ChevronRight
                        className={clsx(
                          'w-4 h-4 transition-transform shrink-0',
                          isSelected ? 'text-blue-600 translate-x-0.5' : 'text-slate-300'
                        )}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Thanh Phân Trang (Pagination) */}
          <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-xs">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredItems.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={(page) => setCurrentPage(page)}
              itemLabel="hồ sơ"
            />
          </div>
        </div>

        {/* Right Column: Detailed Vertical Timeline Component (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
          {/* Header of Active Item */}
          <div className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md">
                  {activeItem.code}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-bold text-slate-600">
                  {activeItem.type === 'REQUISITION' ? 'Yêu Cầu Tuyển Dụng' : 'Đề Xuất Offer'}
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight mt-1">
                {activeItem.title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Người khởi tạo: <strong>{activeItem.creatorName}</strong> ngày {activeItem.createdAt}
              </p>
            </div>

            {activeItem.type === 'REQUISITION' && (
              <Link
                href={`/manager/requisitions/${activeItem.dbId}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
              >
                <span>Xem tờ trình gốc</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* VERTICAL TIMELINE COMPONENT */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Tiến Trình Phê Duyệt 4 Cấp (Vertical Timeline)
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">SLA chuẩn: 48h/cấp</span>
            </div>

            <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {activeItem.steps.map((step) => {
                const isCompleted = step.status === 'COMPLETED';
                const isInProgress = step.status === 'IN_PROGRESS';
                const isPending = step.status === 'PENDING';

                return (
                  <div key={step.stepNumber} className="relative">
                    {/* Timeline Node Dot */}
                    <div
                      className={clsx(
                        'absolute -left-6 top-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-xs',
                        isCompleted
                          ? 'bg-emerald-500 text-white'
                          : isInProgress
                          ? step.isOverdue
                            ? 'bg-rose-500 text-white animate-pulse'
                            : 'bg-amber-500 text-white'
                          : 'bg-slate-200 text-slate-500'
                      )}
                    >
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : isInProgress ? (
                        <Clock className="w-3.5 h-3.5" />
                      ) : (
                        step.stepNumber
                      )}
                    </div>

                    {/* Step Card Content */}
                    <div
                      className={clsx(
                        'p-4 rounded-2xl border transition-all space-y-2',
                        isCompleted
                          ? 'bg-slate-50/70 border-slate-100'
                          : isInProgress
                          ? step.isOverdue
                            ? 'bg-rose-50/80 border-rose-200 text-rose-950 shadow-sm'
                            : 'bg-amber-50/80 border-amber-200 text-amber-950 shadow-sm'
                          : 'bg-white border-slate-100 opacity-60'
                      )}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="font-bold text-sm text-slate-900">{step.title}</div>
                        <span
                          className={clsx(
                            'text-[10px] font-extrabold px-2 py-0.5 rounded-full w-fit',
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : isInProgress
                              ? step.isOverdue
                                ? 'bg-rose-600 text-white'
                                : 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-500'
                          )}
                        >
                          {isCompleted
                            ? 'Đã Duyệt Xong'
                            : isInProgress
                            ? step.isOverdue
                              ? 'Đang Quá Hạn SLA'
                              : 'Đang Xử Lý'
                            : 'Chờ Đến Lượt'}
                        </span>
                      </div>

                      {/* Approver Details */}
                      <div className="flex items-center gap-2.5 text-xs text-slate-600">
                        <div className="w-7 h-7 rounded-full bg-slate-200 font-bold text-[10px] text-slate-700 flex items-center justify-center shrink-0">
                          {step.approverName.slice(-2)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{step.approverName}</div>
                          <div className="text-[11px] text-slate-400">
                            {step.approverRole} — {step.department}
                          </div>
                        </div>
                      </div>

                      {/* Timestamp & Notes */}
                      {step.timestamp && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span>Thời gian ký duyệt: {step.timestamp}</span>
                        </div>
                      )}

                      {step.note && (
                        <p className="text-xs text-slate-600 italic bg-white/70 p-2.5 rounded-xl border border-slate-200/50">
                          "{step.note}"
                        </p>
                      )}

                      {/* In-Progress Alert & Action Button */}
                      {isInProgress && (
                        <div className="pt-2 border-t border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>{step.waitingTime}</span>
                          </div>

                          <button
                            onClick={() => handleSendReminder(step.approverName)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 w-fit"
                          >
                            <Bell className="w-3.5 h-3.5" />
                            <span>Đốc Thúc Duyệt Ngay</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
