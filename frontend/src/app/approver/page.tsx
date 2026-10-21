'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Pagination } from '@/components/ui/Pagination';
import {
  FileText,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  Eye,
  Clock,
  Building,
  User,
  Users,
  Calendar,
  Briefcase,
  AlertCircle,
  Check,
  X,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Flame,
  Award,
  Sparkles,
  Info,
  Layers,
  ArrowUpRight,
  Send,
} from 'lucide-react';
import clsx from 'clsx';
import { ApprovalTimeline } from '@/features/approver/components/ApprovalTimeline';
import type { RequisitionApprovalItem, OfferApprovalItem, ApprovalTimelineItem } from '@/features/approver/types';
import { ApiError } from '@/lib/api-client';
import { approverApi, isPendingRequisition } from '@/features/approver/api';
import { useApiData } from '@/hooks/useApiData';
import { useAuth } from '@/providers/auth-provider';
import { ErrorState, LoadingState } from '@/components/ui/DataStates';

// Initial Mock Data cho Requisitions Chờ Duyệt

export default function ApproverWorkspacePage() {
  const { user } = useAuth();
  // 1. Tab State: 'requisitions' | 'offers'
  const [activeTab, setActiveTab] = useState<'requisitions' | 'offers'>('requisitions');

  // 2. Data State
  // Real data (requisitions + offers visible to this user); KPIs below are computed from them.
  const reqData = useApiData(() => approverApi.requisitions());
  const offerData = useApiData(() => approverApi.offers());
  const requisitions = reqData.data || [];
  const offers = offerData.data || [];
  const setRequisitions = (fn: (prev: RequisitionApprovalItem[]) => RequisitionApprovalItem[]) => reqData.setData((prev) => fn(prev || []));
  const setOffers = (fn: (prev: OfferApprovalItem[]) => OfferApprovalItem[]) => offerData.setData((prev) => fn(prev || []));

  // 3. Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');

  // 4. Modal / Slide-over State
  const [selectedReq, setSelectedReq] = useState<RequisitionApprovalItem | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<OfferApprovalItem | null>(null);

  // 5. Action Bar & Mandatory Reason State
  // Chosen action inside modal: null | 'approved' | 'rejected' | 'changes_requested' | 'renegotiate'
  const [modalAction, setModalAction] = useState<string | null>(null);
  const [actionComment, setActionComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // 6. Toast Feedback Notification
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

  // Filtered lists
  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((item) => {
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = selectedDept === 'ALL' || item.department.includes(selectedDept);
      const matchPriority = selectedPriority === 'ALL' || item.priority === selectedPriority;
      return matchSearch && matchDept && matchPriority;
    });
  }, [requisitions, searchQuery, selectedDept, selectedPriority]);

  const filteredOffers = useMemo(() => {
    return offers.filter((item) => {
      const matchSearch =
        item.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = selectedDept === 'ALL' || item.department.includes(selectedDept);
      const matchOverBudget =
        selectedPriority === 'ALL' ||
        (selectedPriority === 'OVER_BUDGET' && item.is_over_budget) ||
        (selectedPriority === 'NORMAL' && !item.is_over_budget);
      return matchSearch && matchDept && matchOverBudget;
    });
  }, [offers, searchQuery, selectedDept, selectedPriority]);

  // Pagination states & slices
  const [reqPage, setReqPage] = useState(1);
  const [reqPageSize, setReqPageSize] = useState(10);
  const [offerPage, setOfferPage] = useState(1);
  const [offerPageSize, setOfferPageSize] = useState(10);

  useEffect(() => {
    setReqPage(1);
    setOfferPage(1);
  }, [searchQuery, selectedDept, selectedPriority, activeTab]);

  const reqTotalPages = Math.max(1, Math.ceil(filteredRequisitions.length / reqPageSize));
  const paginatedRequisitions = useMemo(() => {
    const start = (reqPage - 1) * reqPageSize;
    return filteredRequisitions.slice(start, start + reqPageSize);
  }, [filteredRequisitions, reqPage, reqPageSize]);

  const offerTotalPages = Math.max(1, Math.ceil(filteredOffers.length / offerPageSize));
  const paginatedOffers = useMemo(() => {
    const start = (offerPage - 1) * offerPageSize;
    return filteredOffers.slice(start, start + offerPageSize);
  }, [filteredOffers, offerPage, offerPageSize]);

  // KPIs
  const pendingReqCount = requisitions.filter(isPendingRequisition).length;
  const pendingOfferCount = offers.filter((o) => o.status === 'pending').length;
  const overBudgetOfferCount = offers.filter((o) => o.is_over_budget && o.status === 'pending').length;
  const totalPending = pendingReqCount + pendingOfferCount;

  // Xử lý mở Modal Requisition
  const handleOpenReqModal = (req: RequisitionApprovalItem) => {
    setSelectedReq(req);
    setSelectedOffer(null);
    setModalAction(null);
    setActionComment('');
  };

  // Xử lý mở Modal Offer
  const handleOpenOfferModal = (offer: OfferApprovalItem) => {
    setSelectedOffer(offer);
    setSelectedReq(null);
    setModalAction(null);
    setActionComment('');
  };

  // Đóng Modal
  const handleCloseModal = () => {
    setSelectedReq(null);
    setSelectedOffer(null);
    setModalAction(null);
    setActionComment('');
  };

  // Xử lý Phê duyệt / Từ chối / Yêu cầu bổ sung cho REQUISITION
  const handleSubmitReqAction = async (action: 'approved' | 'rejected' | 'changes_requested') => {
    if (!selectedReq) return;

    // Logic Bắt buộc: Nếu là rejected hoặc changes_requested thì bắt buộc phải có ý kiến
    if ((action === 'rejected' || action === 'changes_requested') && !actionComment.trim()) {
      showToast('Vui lòng nhập lý do thẩm định cụ thể trước khi xác nhận!', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await approverApi.decideRequisition(selectedReq.id, action, actionComment.trim() || undefined);
      setRequisitions((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      const actionText =
        action === 'approved'
          ? isPendingRequisition(updated)
            ? `Đã duyệt tờ trình ${updated.code}; tờ trình chuyển sang cấp duyệt kế tiếp.`
            : `Đã duyệt hoàn tất tờ trình ${updated.code}.`
          : action === 'rejected'
            ? `Đã từ chối tờ trình ${updated.code}.`
            : `Đã trả tờ trình ${updated.code} về người lập để bổ sung.`;
      showToast(actionText, action === 'approved' ? 'success' : action === 'rejected' ? 'error' : 'warning');
      handleCloseModal();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Có lỗi xảy ra trong quá trình xử lý phê duyệt.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý Phê duyệt / Từ chối / Yêu cầu sửa cho OFFER
  const handleSubmitOfferAction = async (action: 'approved' | 'rejected' | 'renegotiate') => {
    if (!selectedOffer) return;

    // Logic Bắt buộc: Nếu là rejected hoặc renegotiate thì bắt buộc phải có ý kiến
    if ((action === 'rejected' || action === 'renegotiate') && !actionComment.trim()) {
      showToast('Vui lòng nhập lý do cụ thể trước khi xác nhận!', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const apiAction = action === 'renegotiate' ? 'changes_requested' : action;
      const updated = await approverApi.decideOffer(selectedOffer.id, apiAction, actionComment.trim() || undefined);
      setOffers((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      const actionText =
        action === 'approved'
          ? `Đã duyệt offer của ứng viên ${updated.candidate_name}.`
          : action === 'rejected'
            ? `Đã từ chối offer của ứng viên ${updated.candidate_name}.`
            : `Đã yêu cầu điều chỉnh offer của ứng viên ${updated.candidate_name}.`;
      showToast(actionText, action === 'approved' ? 'success' : action === 'rejected' ? 'error' : 'warning');
      handleCloseModal();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Có lỗi xảy ra trong quá trình xử lý phê duyệt.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 1. Header Banner & Quick Summary */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-100/40 via-amber-100/20 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200/80">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Cổng Thẩm Định Tối Cao</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>{totalPending} Hồ Sơ Chờ Bạn Quyết Định</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Trung Tâm Phê Duyệt Tuyển Dụng
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Thẩm định các Tờ trình Tuyển dụng (REQ) mở mới định biên và Đề xuất Offer ứng viên vượt hạn mức dải lương chuẩn của công ty.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-right">
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Người thẩm định</span>
              <span className="text-sm font-extrabold text-slate-900 block">{user?.full_name || '—'}</span>
              <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">{totalPending} mục đang chờ duyệt</span>
            </div>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
          {/* Card 1: Tổng hồ sơ chờ duyệt */}
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">Tổng Chờ Duyệt</span>
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{totalPending}</div>
            <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1 mt-1">
              <Flame className="w-3 h-3 text-amber-500" />
              Cần xử lý trong tuần
            </span>
          </div>

          {/* Card 2: REQ chờ duyệt */}
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">REQ Chờ Duyệt</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{pendingReqCount}</div>
            <span className="text-[11px] text-slate-500 font-medium">Tờ trình định biên</span>
          </div>

          {/* Card 3: Offer chờ duyệt */}
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">Offer Chờ Duyệt</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{pendingOfferCount}</div>
            <span className="text-[11px] text-slate-500 font-medium">Đề xuất lương ứng viên</span>
          </div>

          {/* Card 4: Offer vượt khung lương */}
          <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-700">Vượt Khung Lương</span>
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold animate-pulse">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-700">{overBudgetOfferCount}</div>
            <span className="text-[11px] text-rose-600 font-bold">Cần Ban Giám Đốc lưu ý</span>
          </div>
        </div>
      </div>

      {/* 2. Main Workspace: Tabs, Filters, Content */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Tab Navigation Header */}
        <div className="border-b border-slate-100 px-6 pt-5 pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* Tab 1: Yêu Cầu Tuyển Dụng */}
            <button
              onClick={() => setActiveTab('requisitions')}
              className={clsx(
                'relative flex items-center gap-2.5 px-5 py-3.5 text-xs sm:text-sm font-bold transition-all cursor-pointer rounded-t-xl active:scale-95',
                activeTab === 'requisitions'
                  ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              )}
            >
              <FileText className="w-4 h-4" />
              <span>Yêu Cầu Tuyển Dụng (REQ)</span>
              <span
                className={clsx(
                  'px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-colors',
                  activeTab === 'requisitions' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                )}
              >
                {pendingReqCount}
              </span>
            </button>

            {/* Tab 2: Đề Xuất Offer */}
            <button
              onClick={() => setActiveTab('offers')}
              className={clsx(
                'relative flex items-center gap-2.5 px-5 py-3.5 text-xs sm:text-sm font-bold transition-all cursor-pointer rounded-t-xl active:scale-95',
                activeTab === 'offers'
                  ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              )}
            >
              <DollarSign className="w-4 h-4" />
              <span>Đề Xuất Offer Lương</span>
              <span
                className={clsx(
                  'px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-colors flex items-center gap-1',
                  activeTab === 'offers' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                )}
              >
                <span>{pendingOfferCount}</span>
                {overBudgetOfferCount > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                )}
              </span>
            </button>
          </div>

          <div className="pb-3 flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:inline">
              Hiển thị các hồ sơ ở trạng thái <span className="font-bold text-amber-600">Chờ Duyệt</span>
            </span>
            <Link
              href={activeTab === 'requisitions' ? '/approver/requisitions' : '/approver/offers'}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200/60"
            >
              <span>Xem trang chuyên biệt</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/40 flex flex-col md:flex-row items-center gap-4">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'requisitions'
                  ? 'Tìm kiếm theo mã REQ, vị trí tuyển dụng, phòng ban...'
                  : 'Tìm kiếm theo mã Offer, tên ứng viên, vị trí, phòng ban...'
              }
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
              {Array.from(new Set([...requisitions.map((r) => r.department), ...offers.map((o) => o.department)].filter(Boolean))).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Filter Priority / Budget */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              {activeTab === 'requisitions' ? (
                <>
                  <option value="ALL">Mọi Mức Ưu Tiên</option>
                  <option value="urgent">Khẩn Cấp (Urgent)</option>
                  <option value="high">Cao (High)</option>
                  <option value="medium">Trung Bình (Medium)</option>
                </>
              ) : (
                <>
                  <option value="ALL">Mọi Khung Lương</option>
                  <option value="OVER_BUDGET">⚠️ Vượt Dải Lương Chuẩn</option>
                  <option value="NORMAL">✅ Trong Dải Lương Chuẩn</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* 3. TAB 1: REQUISITIONS LIST */}
        {activeTab === 'requisitions' && (
          <div className="p-6">
            {reqData.loading ? (
              <LoadingState />
            ) : reqData.error ? (
              <ErrorState error={reqData.error} onRetry={reqData.reload} />
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
                  currentPage={reqPage}
                  totalPages={reqTotalPages}
                  totalItems={filteredRequisitions.length}
                  pageSize={reqPageSize}
                  pageSizeOptions={[5, 10, 20, 50]}
                  onPageSizeChange={(sz) => {
                    setReqPageSize(sz);
                    setReqPage(1);
                  }}
                  onPageChange={(p) => setReqPage(p)}
                  itemLabel="yêu cầu tuyển dụng"
                />
              </div>
              </>
            )}
          </div>
        )}

        {/* 4. TAB 2: OFFERS LIST */}
        {activeTab === 'offers' && (
          <div className="p-6">
            {offerData.loading ? (
              <LoadingState />
            ) : offerData.error ? (
              <ErrorState error={offerData.error} onRetry={offerData.reload} />
            ) : filteredOffers.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <DollarSign className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-[1.5]" />
                <p className="text-sm font-bold text-slate-700">Không có đề xuất offer nào phù hợp</p>
                <p className="text-xs text-slate-400 mt-1">
                  Tất cả các thư mời nhận việc đã được phê duyệt hoặc không khớp bộ lọc tìm kiếm.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      <th className="pb-3.5 pl-2">Mã & Ứng Viên Nhận Offer</th>
                      <th className="pb-3.5 px-4">Vị Trí & Phòng Ban</th>
                      <th className="pb-3.5 px-4">Lương Đề Xuất</th>
                      <th className="pb-3.5 px-4">Dải Lương Chuẩn</th>
                      <th className="pb-3.5 px-4">Cảnh Báo Hạn Mức</th>
                      <th className="pb-3.5 px-4">Trạng Thái</th>
                      <th className="pb-3.5 pr-2 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {paginatedOffers.map((offer) => {
                      return (
                        <tr
                          key={offer.id}
                          className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                          onClick={() => handleOpenOfferModal(offer)}
                        >
                          {/* Mã & Ứng viên */}
                          <td className="py-4 pl-2">
                            <div className="flex items-start gap-3">
                              <div
                                className={clsx(
                                  'w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors',
                                  offer.is_over_budget
                                    ? 'bg-rose-100 text-rose-700 group-hover:bg-rose-600 group-hover:text-white'
                                    : 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white'
                                )}
                              >
                                <User className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block group-hover:text-blue-600 transition-colors">
                                  {offer.candidate_name}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[11px] font-mono text-slate-400 font-semibold">{offer.code}</span>
                                  <span className="text-[10px] text-slate-400">• {offer.candidate_email}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Vị trí & Phòng ban */}
                          <td className="py-4 px-4">
                            <span className="font-semibold text-slate-800 block">{offer.job_title}</span>
                            <span className="text-[11px] text-slate-400">{offer.department}</span>
                          </td>

                          {/* Lương đề xuất */}
                          <td className="py-4 px-4 font-black text-slate-900 text-sm">
                            {offer.offered_salary.toLocaleString('vi-VN')} VNĐ
                          </td>

                          {/* Dải chuẩn vị trí */}
                          <td className="py-4 px-4 text-slate-500 font-medium">
                            {offer.standard_salary_min.toLocaleString('vi-VN')} -{' '}
                            {offer.standard_salary_max.toLocaleString('vi-VN')} VNĐ
                          </td>

                          {/* Cảnh báo động (Dải chuẩn / Vượt dải) */}
                          <td className="py-4 px-4">
                            {offer.is_over_budget ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-300 animate-pulse shadow-xs">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Vượt dải chuẩn (+{offer.over_percentage}%)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Trong dải chuẩn</span>
                              </span>
                            )}
                          </td>

                          {/* Trạng thái */}
                          <td className="py-4 px-4">
                            {offer.status === 'pending' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                Chờ Bạn Duyệt
                              </span>
                            ) : offer.status === 'sent' || offer.status === 'accepted' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                Đã Thông Qua
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
                                handleOpenOfferModal(offer);
                              }}
                              className={clsx(
                                'px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-xs',
                                offer.is_over_budget
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200'
                                  : 'bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white'
                              )}
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

              {/* Phân Trang Offers */}
              <div className="pt-4 border-t border-slate-100">
                <Pagination
                  currentPage={offerPage}
                  totalPages={offerTotalPages}
                  totalItems={filteredOffers.length}
                  pageSize={offerPageSize}
                  pageSizeOptions={[5, 10, 20, 50]}
                  onPageSizeChange={(sz) => {
                    setOfferPageSize(sz);
                    setOfferPage(1);
                  }}
                  onPageChange={(p) => setOfferPage(p)}
                  itemLabel="đề xuất offer"
                />
              </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL 2 CỘT CHO REQUISITION (SLIDE-OVER / DIALOG)                       */}
      {/* ========================================================================= */}
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
              {/* CỘT TRÁI: CHI TIẾT YÊU CẦU TUYỂN DỤNG (7 Cột) */}
              <div className="lg:col-span-7 p-6 space-y-6">
                {/* Title & Badge */}
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
                    <span className="font-bold text-slate-800 text-[11px]">
                      {selectedReq.reason === 'expansion' ? 'Mở rộng quy mô khối' : 'Bổ sung nhân sự thay thế'} ({selectedReq.reason_detail})
                    </span>
                  </div>
                </div>

                {/* Mô tả công việc (JD) */}
                {selectedReq.job_description && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                      Mô Tả Công Việc (Job Description)
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200/80">
                      {selectedReq.job_description}
                    </p>
                  </div>
                )}

                {/* Yêu cầu chuyên môn */}
                {selectedReq.requirements && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Yêu Cầu Năng Lực & Kinh Nghiệm
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200/80">
                      {selectedReq.requirements}
                    </p>
                  </div>
                )}

                {/* Quyền lợi */}
                {selectedReq.benefits && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      Chế Độ Đãi Ngộ & Phúc Lợi
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200/80">
                      {selectedReq.benefits}
                    </p>
                  </div>
                )}
              </div>

              {/* CỘT PHẢI: LỊCH SỬ DUYỆT (TIMELINE) & KHUNG Ý KIẾN HÀNH ĐỘNG (5 Cột) */}
              <div className="lg:col-span-5 p-6 flex flex-col justify-between space-y-6 bg-slate-50/30">
                <div className="space-y-5">
                  {/* Lịch sử duyệt bất biến */}
                  <ApprovalTimeline items={selectedReq.timeline} />

                  {/* Khu vực chọn hình thức & nhập lý do */}
                  <div className="pt-4 border-t border-slate-200/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Ý Kiến Thẩm Định Của Bạn</span>
                        {(modalAction === 'rejected' || modalAction === 'changes_requested') && (
                          <span className="text-rose-600 text-[11px] font-extrabold">* (Bắt buộc)</span>
                        )}
                      </label>
                      <span className="text-[10px] text-slate-400">
                        {actionComment.length}/500 ký tự
                      </span>
                    </div>

                    <textarea
                      value={actionComment}
                      onChange={(e) => setActionComment(e.target.value)}
                      rows={3}
                      placeholder={
                        modalAction === 'rejected'
                          ? 'Nhập lý do từ chối tờ trình (Bắt buộc để người tạo nắm rõ nguyên nhân)...'
                          : modalAction === 'changes_requested'
                          ? 'Nhập các nội dung cần bổ sung, chỉnh sửa lại trước khi trình duyệt tiếp...'
                          : 'Nhập ghi chú hoặc ý kiến chỉ đạo (Tùy chọn khi phê duyệt)...'
                      }
                      className={clsx(
                        'w-full p-3 text-xs rounded-xl border bg-white focus:outline-none transition-all placeholder-slate-400',
                        (modalAction === 'rejected' || modalAction === 'changes_requested') && !actionComment.trim()
                          ? 'border-amber-300 ring-2 ring-amber-100'
                          : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                      )}
                    />

                    {/* Cảnh báo nếu chưa nhập lý do khi chọn từ chối/bổ sung */}
                    {(modalAction === 'rejected' || modalAction === 'changes_requested') && !actionComment.trim() && (
                      <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        Bạn phải nhập ý kiến/lý do để nút Xác Nhận có hiệu lực!
                      </p>
                    )}
                  </div>
                </div>

                {/* DẢI NÚT HÀNH ĐỘNG DÍNH Ở ĐÁY (ACTION BAR STICKY) */}
                <div className="pt-4 border-t border-slate-200/80 space-y-2.5">
                  {modalAction ? (
                    // Trạng thái đang xác nhận một hành động cụ thể
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl text-xs font-bold flex items-center justify-between bg-slate-100">
                        <span>
                          {modalAction === 'approved' && 'Xác nhận: DUYỆT TỜ TRÌNH HOÀN TẤT'}
                          {modalAction === 'rejected' && 'Xác nhận: TỪ CHỐI TỜ TRÌNH NÀY'}
                          {modalAction === 'changes_requested' && 'Xác nhận: YÊU CẦU BỔ SUNG TỜ TRÌNH'}
                        </span>
                        <button
                          onClick={() => setModalAction(null)}
                          className="text-slate-500 hover:text-slate-800 text-[11px] underline cursor-pointer"
                        >
                          Hủy chọn
                        </button>
                      </div>

                      <button
                        onClick={() => handleSubmitReqAction(modalAction as any)}
                        disabled={
                          isSubmitting ||
                          ((modalAction === 'rejected' || modalAction === 'changes_requested') && !actionComment.trim())
                        }
                        className={clsx(
                          'w-full py-3 px-4 rounded-xl font-extrabold text-xs text-white shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2',
                          modalAction === 'approved' && 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20',
                          modalAction === 'rejected' && 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20',
                          modalAction === 'changes_requested' && 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20',
                          (isSubmitting ||
                            ((modalAction === 'rejected' || modalAction === 'changes_requested') && !actionComment.trim())) &&
                            'opacity-50 cursor-not-allowed active:scale-100'
                        )}
                      >
                        {isSubmitting ? (
                          <span>Đang xử lý thẩm định...</span>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Xác Nhận Quyết Định</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    // 3 Nút hành động chính
                    <div className="grid grid-cols-3 gap-2">
                      {/* Nút 1: Duyệt (Xanh lá) */}
                      <button
                        onClick={() => setModalAction('approved')}
                        className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Duyệt REQ</span>
                      </button>

                      {/* Nút 2: Yêu cầu bổ sung (Vàng/Cam) */}
                      <button
                        onClick={() => setModalAction('changes_requested')}
                        className="py-2.5 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>YC Bổ Sung</span>
                      </button>

                      {/* Nút 3: Từ chối (Đỏ) */}
                      <button
                        onClick={() => setModalAction('rejected')}
                        className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Từ Chối</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL 2 CỘT CHO OFFER (SLIDE-OVER / DIALOG VỚI CẢNH BÁO ĐỘNG)          */}
      {/* ========================================================================= */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl w-full max-w-5xl max-h-[92vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={clsx(
                    'w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-md',
                    selectedOffer.is_over_budget ? 'bg-rose-600 shadow-rose-500/20' : 'bg-emerald-600 shadow-emerald-500/20'
                  )}
                >
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-slate-900">
                      Thẩm Định Đề Xuất Offer Lương
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-200 text-slate-800">
                      {selectedOffer.code}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Ứng viên: <strong className="text-slate-800">{selectedOffer.candidate_name}</strong> • Đề xuất bởi {selectedOffer.created_by}
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
              {/* CỘT TRÁI: CHI TIẾT OFFER & CẢNH BÁO ĐỘNG (7 Cột) */}
              <div className="lg:col-span-7 p-6 space-y-6">
                {/* 1. CẢNH BÁO ĐỘNG HẠN MỨC LƯƠNG */}
                {selectedOffer.is_over_budget ? (
                  <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 shadow-sm animate-pulse flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-rose-700">
                          Cảnh Báo: Vượt Dải Lương Chuẩn Vị Trí (+{selectedOffer.over_percentage}%)
                        </span>
                        <span className="bg-rose-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                          Cần BOD Phê Chuẩn
                        </span>
                      </div>
                      <p className="text-xs text-rose-700/90 mt-1 leading-relaxed">
                        Mức đề xuất <strong>{selectedOffer.offered_salary.toLocaleString('vi-VN')} VNĐ</strong> đã vượt trần ngân sách chuẩn{' '}
                        <strong>{selectedOffer.standard_salary_max.toLocaleString('vi-VN')} VNĐ</strong> thêm{' '}
                        <strong>{(selectedOffer.offered_salary - selectedOffer.standard_salary_max).toLocaleString('vi-VN')} VNĐ</strong>.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div className="text-xs">
                      <span className="font-extrabold block text-emerald-800">Mức lương nằm trong dải chuẩn phê duyệt</span>
                      <span className="text-emerald-700 text-[11px]">
                        Không phát sinh vượt trần định biên phòng ban.
                      </span>
                    </div>
                  </div>
                )}

                {/* Candidate & Position Identity */}
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                    {selectedOffer.department}
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-1.5 leading-snug">
                    {selectedOffer.job_title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                    <span>Email: <strong>{selectedOffer.candidate_email}</strong></span>
                    <span>• SĐT: <strong>{selectedOffer.candidate_phone}</strong></span>
                  </div>
                </div>

                {/* Salary Comparison Grid */}
                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    So Sánh & Định Mức Lương Thẩm Định
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Lương Đề Xuất (Offer)</span>
                      <span className="text-base font-black text-blue-700 mt-0.5 block">
                        {selectedOffer.offered_salary.toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Khung Chuẩn Vị Trí</span>
                      <span className="text-xs font-extrabold text-slate-800 mt-0.5 block">
                        {selectedOffer.standard_salary_min.toLocaleString('vi-VN')} - {selectedOffer.standard_salary_max.toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Lương Thử Việc ({selectedOffer.probation_salary_percentage}%)</span>
                      <span className="text-xs font-extrabold text-slate-800 mt-0.5 block">
                        {((selectedOffer.offered_salary * selectedOffer.probation_salary_percentage) / 100).toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/60 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Thời gian thử việc:</span>
                      <span className="font-bold text-slate-800">{selectedOffer.probation_duration_months} tháng</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Ngày nhận việc dự kiến:</span>
                      <span className="font-bold text-slate-800">{selectedOffer.start_date}</span>
                    </div>
                  </div>
                </div>

                {/* Ghi chú & Đề xuất từ HR Manager */}
                {selectedOffer.notes && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-blue-600" />
                      Lý Do & Giải Trình Từ Ban Nhân Sự
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200/80 whitespace-pre-wrap">
                      {selectedOffer.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* CỘT PHẢI: LỊCH SỬ DUYỆT (TIMELINE) & DẢI NÚT HÀNH ĐỘNG OFFER (5 Cột) */}
              <div className="lg:col-span-5 p-6 flex flex-col justify-between space-y-6 bg-slate-50/30">
                <div className="space-y-5">
                  {/* Timeline bất biến */}
                  <ApprovalTimeline items={selectedOffer.timeline} />

                  {/* Khu vực ý kiến */}
                  <div className="pt-4 border-t border-slate-200/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Ý Kiến Thẩm Định Của Bạn</span>
                        {(modalAction === 'rejected' || modalAction === 'renegotiate') && (
                          <span className="text-rose-600 text-[11px] font-extrabold">* (Bắt buộc)</span>
                        )}
                      </label>
                      <span className="text-[10px] text-slate-400">
                        {actionComment.length}/500 ký tự
                      </span>
                    </div>

                    <textarea
                      value={actionComment}
                      onChange={(e) => setActionComment(e.target.value)}
                      rows={3}
                      placeholder={
                        modalAction === 'rejected'
                          ? 'Nhập lý do không phê chuẩn mức lương offer này (Bắt buộc)...'
                          : modalAction === 'renegotiate'
                          ? 'Ghi rõ mức trần tối đa chấp nhận để HR Manager đàm phán lại với ứng viên...'
                          : 'Nhập ghi chú hoặc phê duyệt hạn mức đặc biệt...'
                      }
                      className={clsx(
                        'w-full p-3 text-xs rounded-xl border bg-white focus:outline-none transition-all placeholder-slate-400',
                        (modalAction === 'rejected' || modalAction === 'renegotiate') && !actionComment.trim()
                          ? 'border-amber-300 ring-2 ring-amber-100'
                          : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                      )}
                    />

                    {(modalAction === 'rejected' || modalAction === 'renegotiate') && !actionComment.trim() && (
                      <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        Bạn phải nhập ý kiến/lý do để nút Xác Nhận có hiệu lực!
                      </p>
                    )}
                  </div>
                </div>

                {/* DẢI NÚT HÀNH ĐỘNG OFFER (STICKY BOTTOM) */}
                <div className="pt-4 border-t border-slate-200/80 space-y-2.5">
                  {modalAction ? (
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl text-xs font-bold flex items-center justify-between bg-slate-100">
                        <span>
                          {modalAction === 'approved' && 'Xác nhận: DUYỆT OFFER LƯƠNG'}
                          {modalAction === 'rejected' && 'Xác nhận: TỪ CHỐI MỨC OFFER'}
                          {modalAction === 'renegotiate' && 'Xác nhận: YÊU CẦU ĐÀM PHÁN LẠI'}
                        </span>
                        <button
                          onClick={() => setModalAction(null)}
                          className="text-slate-500 hover:text-slate-800 text-[11px] underline cursor-pointer"
                        >
                          Hủy chọn
                        </button>
                      </div>

                      <button
                        onClick={() => handleSubmitOfferAction(modalAction as any)}
                        disabled={
                          isSubmitting ||
                          ((modalAction === 'rejected' || modalAction === 'renegotiate') && !actionComment.trim())
                        }
                        className={clsx(
                          'w-full py-3 px-4 rounded-xl font-extrabold text-xs text-white shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2',
                          modalAction === 'approved' && 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20',
                          modalAction === 'rejected' && 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20',
                          modalAction === 'renegotiate' && 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20',
                          (isSubmitting ||
                            ((modalAction === 'rejected' || modalAction === 'renegotiate') && !actionComment.trim())) &&
                            'opacity-50 cursor-not-allowed active:scale-100'
                        )}
                      >
                        {isSubmitting ? (
                          <span>Đang xử lý phê duyệt...</span>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Xác Nhận Quyết Định</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {/* 1. Duyệt (Nút Xanh) */}
                      <button
                        onClick={() => setModalAction('approved')}
                        className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Duyệt Offer</span>
                      </button>

                      {/* 2. Yêu cầu sửa / Đàm phán lại (Nút Vàng) */}
                      <button
                        onClick={() => setModalAction('renegotiate')}
                        className="py-2.5 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Yêu Cầu Sửa</span>
                      </button>

                      {/* 3. Từ chối (Nút Đỏ) */}
                      <button
                        onClick={() => setModalAction('rejected')}
                        className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Từ Chối</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification (Rendered via createPortal directly to document.body with z-[99999]) */}
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
