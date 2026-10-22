'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Pagination } from '@/components/ui/Pagination';
import {
  FileText,
  Search,
  Filter,
  Users,
  Flame,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  X,
  Check,
  RotateCcw,
  Info,
  Calendar,
  Briefcase,
  Building,
  ArrowLeft,
  ShieldCheck,
  Send
} from 'lucide-react';
import clsx from 'clsx';
import { ApprovalTimeline } from '@/features/approver/components/ApprovalTimeline';
import type { RequisitionApprovalItem, ApprovalTimelineItem } from '@/features/approver/types';
import { approverApi, isPendingRequisition } from '@/features/approver/api';
import { useApiData } from '@/hooks/useApiData';
import { useAuth } from '@/providers/auth-provider';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/DataStates';
import { ApiError } from '@/lib/api-client';

export default function ApproverRequisitionsPage() {
  const { user } = useAuth();
  // Real approval queue: requisitions waiting on an approval step (backend decides who may act on it).
  const { data, error, loading, reload, setData } = useApiData(async () => (await approverApi.requisitions()).filter(isPendingRequisition));
  const requisitions = data || [];
  const setRequisitions = (fn: (prev: RequisitionApprovalItem[]) => RequisitionApprovalItem[]) => setData((prev) => fn(prev || []));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');

  // Modal State
  const [selectedReq, setSelectedReq] = useState<RequisitionApprovalItem | null>(null);
  const [modalAction, setModalAction] = useState<string | null>(null);
  const [actionComment, setActionComment] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Toast Feedback Notification
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 6000);
  };

  // Filtered List
  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((req) => {
      const matchSearch =
        req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.created_by.toLowerCase().includes(searchQuery.toLowerCase());

      const matchDept =
        selectedDept === 'ALL' || req.department.toLowerCase().includes(selectedDept.toLowerCase());

      const matchPriority = selectedPriority === 'ALL' || req.priority === selectedPriority;

      return matchSearch && matchDept && matchPriority;
    });
  }, [requisitions, searchQuery, selectedDept, selectedPriority]);

  // Pagination states & slices
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDept, selectedPriority]);

  const totalPages = Math.max(1, Math.ceil(filteredRequisitions.length / pageSize));
  const paginatedRequisitions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequisitions.slice(start, start + pageSize);
  }, [filteredRequisitions, currentPage, pageSize]);

  const handleOpenReqModal = (req: RequisitionApprovalItem) => {
    setSelectedReq(req);
    setModalAction(null);
    setActionComment('');
    setCommentError(null);
  };

  const handleCloseModal = () => {
    setSelectedReq(null);
    setModalAction(null);
    setActionComment('');
    setCommentError(null);
  };

  const handleSubmitReqAction = async (action: 'approved' | 'rejected' | 'changes_requested') => {
    if (!selectedReq) return;

    if ((action === 'rejected' || action === 'changes_requested') && !actionComment.trim()) {
      setCommentError('Bắt buộc nhập ý kiến chỉ đạo / lý do cho hành động này!');
      showToast('Vui lòng nhập lý do / ý kiến chỉ đạo để các phòng ban thực hiện!', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await approverApi.decideRequisition(selectedReq.id, action, actionComment.trim() || undefined);
      // Still pending (moved to the next level) stays in the queue; otherwise it leaves the queue.
      setRequisitions((prev) =>
        isPendingRequisition(updated) && updated.current_approval_step !== selectedReq.current_approval_step
          ? prev.map((r) => (r.id === updated.id ? updated : r))
          : prev.filter((r) => r.id !== updated.id),
      );
      const actionText =
        action === 'approved'
          ? `Đã phê duyệt tờ trình ${updated.code}.${isPendingRequisition(updated) ? ' Tờ trình chuyển sang cấp duyệt kế tiếp.' : ''}`
          : action === 'rejected'
            ? `Đã từ chối tờ trình ${updated.code}.`
            : `Đã yêu cầu người lập bổ sung tờ trình ${updated.code}.`;
      showToast(actionText, action === 'approved' ? 'success' : action === 'rejected' ? 'error' : 'warning');
      handleCloseModal();
    } catch (err) {
      if (err instanceof ApiError && (err.status === 409 || (err.status === 400 && err.message.includes('trạng thái')))) {
        showToast(err.message || 'Tờ trình đã thay đổi trạng thái. Đang cập nhật lại hàng đợi...', 'warning');
        handleCloseModal();
        reload();
      } else {
        showToast(err instanceof ApiError ? err.message : 'Có lỗi xảy ra khi xử lý tờ trình.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      {/* 1. Header Trang Chuyên Biệt (Không còn 4 cards lớn ở trên) */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/approver"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Trung tâm phê duyệt</span>
            </Link>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80">
              <Clock className="w-3 h-3 text-amber-600" />
              {requisitions.filter((r) => r.status.startsWith('pending')).length} Tờ Trình Cần Duyệt
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <span>Danh Sách Yêu Cầu Tuyển Dụng (REQ) Cần Thẩm Định</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Thẩm định chỉ tiêu, định biên nhân sự và hạn mức ngân sách các tờ trình mở mới được chuyển lên từ HR Manager.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <div className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-right">
            <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Người thẩm định</span>
            <span className="text-sm font-extrabold text-slate-900 block">{user?.full_name || '—'}</span>
            <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">{requisitions.length} tờ trình đang chờ duyệt</span>
          </div>
        </div>
      </div>

      {/* 2. Thanh Tìm Kiếm & Bộ Lọc */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/40 flex flex-col md:flex-row items-center gap-4">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo mã REQ, vị trí tuyển dụng, phòng ban, người tạo..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Phòng ban */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="ALL">Tất Cả Phòng Ban</option>
              {Array.from(new Set(requisitions.map((r) => r.department).filter(Boolean))).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Filter Priority */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="ALL">Mọi Mức Ưu Tiên</option>
              <option value="urgent">Khẩn Cấp (Urgent)</option>
              <option value="high">Ưu Tiên Cao (High)</option>
              <option value="medium">Tiêu Chuẩn (Medium)</option>
            </select>
          </div>
        </div>

        {/* 3. Bảng REQ Full Màn Hình */}
        <div className="p-6">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState error={error} onRetry={reload} />
          ) : filteredRequisitions.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-[1.5]" />
              <p className="text-sm font-bold text-slate-700">Không có yêu cầu tuyển dụng nào phù hợp</p>
              <p className="text-xs text-slate-400 mt-1">
                Tất cả các tờ trình tuyển dụng đã được xử lý hoặc không khớp bộ lọc tìm kiếm.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="pb-3.5 pl-2">Mã & Vị Trí Tuyển Dụng</th>
                    <th className="pb-3.5 px-4">Phòng Ban</th>
                    <th className="pb-3.5 px-4">Định Biên</th>
                    <th className="pb-3.5 px-4">Dải Ngân Sách</th>
                    <th className="pb-3.5 px-4">Ưu Tiên</th>
                    <th className="pb-3.5 px-4">Cấp Hiện Tại</th>
                    <th className="pb-3.5 pr-2 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {paginatedRequisitions.map((req) => {
                    const isPending = req.status.startsWith('pending');
                    return (
                      <tr
                        key={req.id}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => handleOpenReqModal(req)}
                      >
                        {/* Mã & Vị trí */}
                        <td className="py-4 pl-2">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block group-hover:text-blue-600 transition-colors">
                                {req.title}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] font-mono text-slate-400 font-semibold">{req.code}</span>
                                <span className="text-[10px] text-slate-400">• Gửi bởi {req.created_by}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Phòng ban */}
                        <td className="py-4 px-4 font-medium text-slate-700">
                          {req.department}
                        </td>

                        {/* Định biên */}
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1 font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                            <Users className="w-3 h-3 text-slate-500" />
                            {req.quantity} nhân sự
                          </span>
                        </td>

                        {/* Dải ngân sách */}
                        <td className="py-4 px-4 font-semibold text-slate-700">
                          {req.salary_range}
                        </td>

                        {/* Mức độ ưu tiên */}
                        <td className="py-4 px-4">
                          {req.priority === 'urgent' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                              <Flame className="w-3 h-3" />
                              Khẩn cấp
                            </span>
                          )}
                          {req.priority === 'high' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                              Ưu tiên cao
                            </span>
                          )}
                          {req.priority === 'medium' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600">
                              Tiêu chuẩn
                            </span>
                          )}
                        </td>

                        {/* Cấp hiện tại */}
                        <td className="py-4 px-4">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Chờ Bạn Duyệt
                            </span>
                          ) : req.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Đã Duyệt
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3" />
                              Đã Từ Chối
                            </span>
                          )}
                        </td>

                        {/* Nút thao tác */}
                        <td className="py-4 pr-2 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenReqModal(req);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-xs"
                          >
                            Xem & Thẩm Định
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Phân Trang Requisitions */}
            <div className="pt-4 border-t border-slate-100">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredRequisitions.length}
                pageSize={pageSize}
                pageSizeOptions={[5, 10, 20, 50]}
                onPageSizeChange={(sz) => {
                  setPageSize(sz);
                  setCurrentPage(1);
                }}
                onPageChange={(p) => setCurrentPage(p)}
                itemLabel="yêu cầu tuyển dụng"
              />
            </div>
            </>
          )}
        </div>
      </div>

      {/* 4. Modal 2 Cột Chi Tiết Requisition */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl w-full max-w-5xl max-h-[92vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-slate-900">
                      Thẩm Định Tờ Trình Tuyển Dụng
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
                      {selectedReq.code}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Người tạo: {selectedReq.created_by} ({selectedReq.created_by_role}) • Gửi lúc {selectedReq.created_at}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseModal}
                className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: 2 Columns */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
              {/* CỘT TRÁI: CHI TIẾT REQ (7 Cột) */}
              <div className="lg:col-span-7 p-6 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                      {selectedReq.department}
                    </span>
                    {selectedReq.priority === 'urgent' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                        Khẩn cấp
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {selectedReq.employment_type}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 leading-snug">
                    {selectedReq.title}
                  </h3>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">Số lượng cần tuyển</span>
                    <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                      {selectedReq.quantity} nhân sự
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">Dải ngân sách dự kiến</span>
                    <span className="text-sm font-extrabold text-emerald-700 mt-0.5 block">
                      {selectedReq.salary_range}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">Onboard mục tiêu</span>
                    <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                      {selectedReq.target_onboard_date || 'Càng sớm càng tốt'}
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">Lý do đề xuất:</span>
                    <span className="text-[11px] font-bold text-slate-800">
                      {selectedReq.reason === 'expansion' ? 'Mở rộng quy mô kinh doanh' : 'Thay thế nhân sự'}
                    </span>
                  </div>
                </div>

                {/* Chi tiết lý do */}
                {selectedReq.reason_detail && (
                  <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 text-xs">
                    <span className="font-bold text-blue-900 block mb-1">Ghi chú & Căn cứ thẩm định:</span>
                    <p className="text-slate-600 leading-relaxed">{selectedReq.reason_detail}</p>
                  </div>
                )}

                {/* Job Description */}
                {selectedReq.job_description && (
                  <div className="space-y-1.5 text-xs">
                    <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                      <span>Mô tả công việc (JD)</span>
                    </h4>
                    <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      {selectedReq.job_description}
                    </p>
                  </div>
                )}

                {/* Requirements */}
                {selectedReq.requirements && (
                  <div className="space-y-1.5 text-xs">
                    <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <span>Yêu cầu ứng viên</span>
                    </h4>
                    <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      {selectedReq.requirements}
                    </p>
                  </div>
                )}

                {/* Benefits */}
                {selectedReq.benefits && (
                  <div className="space-y-1.5 text-xs">
                    <h4 className="font-extrabold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Chế độ đãi ngộ & Quyền lợi</span>
                    </h4>
                    <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      {selectedReq.benefits}
                    </p>
                  </div>
                )}
              </div>

              {/* CỘT PHẢI: TIMELINE & ACTION BAR (5 Cột) */}
              <div className="lg:col-span-5 p-6 bg-slate-50/40 flex flex-col justify-between space-y-6">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>Tiến Trình Thẩm Định Hồ Sơ</span>
                  </h4>
                  <ApprovalTimeline items={selectedReq.timeline} />
                </div>

                {/* Action Box */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ý kiến phê duyệt & Chỉ đạo của Ban Giám Đốc
                    </label>
                    <textarea
                      rows={3}
                      value={actionComment}
                      onChange={(e) => {
                        setActionComment(e.target.value);
                        if (commentError && e.target.value.trim()) setCommentError(null);
                      }}
                      placeholder="Nhập ý kiến chỉ đạo, căn cứ duyệt hoặc lý do yêu cầu hiệu chỉnh..."
                      className={clsx(
                        "w-full p-3 rounded-xl border text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition-all resize-none",
                        commentError
                          ? "border-rose-400 ring-2 ring-rose-500/20 bg-rose-50/30"
                          : "border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      )}
                    />
                    {commentError && (
                      <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1 animate-in fade-in duration-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>{commentError}</span>
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      disabled={isSubmitting}
                      onClick={() => handleSubmitReqAction('approved')}
                      className="px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Duyệt</span>
                    </button>

                    <button
                      disabled={isSubmitting}
                      onClick={() => handleSubmitReqAction('changes_requested')}
                      className="px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Yêu Cầu Bổ Sung</span>
                    </button>

                    <button
                      disabled={isSubmitting}
                      onClick={() => handleSubmitReqAction('rejected')}
                      className="px-3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      <span>Từ Chối</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback Notification (Always on top via createPortal directly to document.body with z-[99999]) */}
      {mounted && toast && createPortal(
        <div className="fixed top-6 right-6 z-[99999] max-w-md animate-in slide-in-from-top-3 fade-in duration-300 pointer-events-auto shadow-2xl">
          <div
            className={clsx(
              'rounded-2xl p-4 shadow-2xl border flex items-start gap-3 backdrop-blur-md',
              toast.type === 'success' && 'bg-emerald-50/95 border-emerald-200 text-emerald-900',
              toast.type === 'error' && 'bg-rose-50/95 border-rose-200 text-rose-900',
              toast.type === 'warning' && 'bg-amber-50/95 border-amber-200 text-amber-900',
              toast.type === 'info' && 'bg-blue-50/95 border-blue-200 text-blue-900'
            )}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />}
            <div className="flex-1 text-xs font-semibold leading-relaxed">{toast.message}</div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
