'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ManagerAppShell } from '@/components/layout/ManagerAppShell';
import { Pagination } from '@/components/ui/Pagination';
import { managerApi, type ManagerRequisitionItem } from '@/features/manager/api';
import { useApiData } from '@/hooks/useApiData';
import { ErrorState, LoadingState } from '@/components/ui/DataStates';
import { ApiError } from '@/lib/api-client';
import {
  FileCheck,
  Search,
  Filter,
  Plus,
  Copy,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  ChevronRight,
  TrendingUp,
  Briefcase,
  Calendar,
  DollarSign,
  Send,
  Building,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import clsx from 'clsx';

export type { ManagerRequisitionItem } from '@/features/manager/api';


function RequisitionsContent() {
  const searchParams = useSearchParams();
  const { data, error, loading, reload, setData } = useApiData(() => managerApi.requisitions());
  const requisitions = data || [];
  const [submitting, setSubmitting] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal: Duplicate Requisition State
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [selectedReqForDuplicate, setSelectedReqForDuplicate] = useState<ManagerRequisitionItem | null>(null);

  // Duplicate Form State
  const [duplicateForm, setDuplicateForm] = useState({
    title: '',
    department: '',
    level: '',
    salaryRange: '',
    targetCount: 1,
    targetDate: '',
    description: '',
    requirements: '',
    reason: 'Bổ sung định biên sprint mới',
  });

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Open modal with pre-filled requisition data
  const handleOpenDuplicateModal = (req: ManagerRequisitionItem) => {
    setSelectedReqForDuplicate(req);
    setDuplicateForm({
      title: `${req.title} (Bản sao)`,
      department: req.department,
      level: req.level,
      salaryRange: req.salaryRange,
      targetCount: 1,
      targetDate: req.targetDate,
      description: req.description,
      requirements: req.requirements,
      reason: 'Bổ sung định biên sprint mới (Sao chép từ ' + req.id + ')',
    });
    setIsDuplicateModalOpen(true);
  };

  // Check URL query param ?cloneId=...
  useEffect(() => {
    const cloneId = searchParams.get('cloneId');
    if (cloneId) {
      const target = requisitions.find((r) => r.id === cloneId);
      if (target) {
        handleOpenDuplicateModal(target);
      }
    }
  }, [searchParams, requisitions.length]); // re-run once the real list has loaded

  // Submit Duplicate Requisition (Trình duyệt)
  const handleSubmitDuplicate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReqForDuplicate) return;
    setSubmitting(true);
    try {
      const result = await managerApi.copyAndSubmit(selectedReqForDuplicate.dbId, {
        title: duplicateForm.title,
        quantity: Number(duplicateForm.targetCount) || 1,
        target_onboard_date: duplicateForm.targetDate || undefined,
        job_description: duplicateForm.description,
        requirements: duplicateForm.requirements,
        reason_detail: duplicateForm.reason,
      });
      setData((prev) => [result.requisition, ...(prev || [])]);
      setIsDuplicateModalOpen(false);
      showToast(
        result.submitted
          ? `Đã tạo và trình duyệt yêu cầu ${result.requisition.id}: ${result.requisition.title}`
          : `Đã tạo bản nháp ${result.requisition.id} nhưng chưa trình duyệt được: ${result.error instanceof ApiError ? result.error.message : 'lỗi không xác định'}`,
      );
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Không tạo được yêu cầu từ bản sao.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return requisitions.filter((req) => {
      const matchSearch =
        req.title.toLowerCase().includes(search.toLowerCase()) ||
        req.id.toLowerCase().includes(search.toLowerCase()) ||
        req.department.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || req.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [requisitions, search, statusFilter]);

  // Pagination Configuration (20 items per page)
  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / ITEMS_PER_PAGE));

  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredList.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredList, currentPage]);

  // Counts
  const totalCount = requisitions.length;
  const activeCount = requisitions.filter((r) => r.status === 'Active').length;
  const pendingCount = requisitions.filter((r) => r.status === 'Pending').length;
  const closedCount = requisitions.filter((r) => r.status === 'Closed').length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileCheck className="w-7 h-7 text-blue-600" />
            Yêu Cầu Tuyển Dụng (Requisitions)
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Quản lý danh sách tờ trình tuyển dụng của bộ phận, theo dõi phê duyệt và tái sử dụng mẫu yêu cầu cũ
          </p>
        </div>

        <button
          onClick={() => handleOpenDuplicateModal(requisitions[0])}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tạo Yêu Cầu Mới</span>
        </button>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng yêu cầu</span>
          <div className="text-2xl font-black text-slate-900">{totalCount}</div>
          <p className="text-[11px] text-slate-500">Toàn bộ tờ trình</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đang tuyển (Active)</span>
          <div className="text-2xl font-black text-emerald-600">{activeCount}</div>
          <p className="text-[11px] text-emerald-600/80">Đang nhận CV & PV</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chờ duyệt (Pending)</span>
          <div className="text-2xl font-black text-amber-600">{pendingCount}</div>
          <p className="text-[11px] text-amber-600/80">Đang luân chuyển 4 cấp</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đã hoàn thành</span>
          <div className="text-2xl font-black text-slate-600">{closedCount}</div>
          <p className="text-[11px] text-slate-500">Đủ chỉ tiêu hoặc đóng</p>
        </div>
      </div>

      {/* 3. SEARCH & FILTER TOOLBAR */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Tìm theo chức danh, mã REQ hoặc phòng ban..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="Active">Đang mở (Active)</option>
            <option value="Pending">Chờ duyệt (Pending)</option>
            <option value="Closed">Đã đóng (Closed)</option>
          </select>
        </div>
      </div>

      {/* 4. DATA TABLE WITH "SAO CHÉP" (COPY) ACTION BUTTON */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-xs text-slate-500 font-semibold tracking-wider uppercase">
                <th className="py-4 px-6">Mã & Chức Danh</th>
                <th className="py-4 px-6">Cấp Bậc</th>
                <th className="py-4 px-6 text-center">Tiến Độ Tuyển</th>
                <th className="py-4 px-6">Dải Lương</th>
                <th className="py-4 px-6">Ngày Cần Người</th>
                <th className="py-4 px-6">Trạng Thái</th>
                <th className="py-4 px-6 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7}><LoadingState /></td></tr>
              ) : error ? (
                <tr><td colSpan={7}><ErrorState error={error} onRetry={reload} /></td></tr>
              ) : paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {requisitions.length === 0 ? 'Chưa có dữ liệu.' : 'Không tìm thấy yêu cầu tuyển dụng nào phù hợp với bộ lọc tìm kiếm.'}
                  </td>
                </tr>
              ) : (
                paginatedList.map((req) => (
                  <tr key={req.dbId} className="hover:bg-slate-50/60 transition-colors">
                    {/* Title & Code */}
                    <td className="py-4 px-6">
                      <Link
                        href={`/manager/requisitions/${req.dbId}`}
                        className="group font-bold text-slate-900 hover:text-blue-600 transition-colors block"
                      >
                        <div className="text-sm font-extrabold group-hover:underline">{req.title}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{req.id} • {req.department}</div>
                      </Link>
                    </td>

                    {/* Level */}
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-700">{req.level}</span>
                    </td>

                    {/* Progress: Hired / Target */}
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="font-extrabold text-slate-900">
                          {req.hiredCount}/{req.targetCount} vị trí
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {Math.round((req.hiredCount / req.targetCount) * 100)}% chỉ tiêu
                        </span>
                      </div>
                    </td>

                    {/* Salary */}
                    <td className="py-4 px-6 text-slate-700 font-semibold">
                      {req.salaryRange}
                    </td>

                    {/* Deadline */}
                    <td className="py-4 px-6 text-slate-600 font-medium">
                      {req.targetDate}
                    </td>

                    {/* Status Badges */}
                    <td className="py-4 px-6">
                      {req.status === 'Active' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Đang mở tuyển
                        </span>
                      )}
                      {req.status === 'Pending' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Chờ phê duyệt
                        </span>
                      )}
                      {req.status === 'Closed' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          Đã đóng
                        </span>
                      )}
                    </td>

                    {/* Action Column with COPY & VIEW */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Detail Link */}
                        <Link
                          href={`/manager/requisitions/${req.dbId}`}
                          className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Xem chi tiết & Lịch sử duyệt"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {/* FEATURE 1: SAO CHÉP (COPY) ACTION BUTTON */}
                        <button
                          onClick={() => handleOpenDuplicateModal(req)}
                          className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer group"
                          title="Sao chép yêu cầu (Duplicate)"
                        >
                          <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Thanh Phân Trang (Pagination) */}
        <div className="px-6 pb-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredList.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={(page) => setCurrentPage(page)}
            itemLabel="yêu cầu tuyển dụng"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL: "TẠO YÊU CẦU MỚI (BẢN SAO)" - PRE-FILLED FORM                  */}
      {/* ========================================================================= */}
      {isDuplicateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl p-6 md:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 tracking-tight">
                    Tạo yêu cầu mới (Bản sao)
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Sao chép toàn bộ tiêu chuẩn từ yêu cầu {selectedReqForDuplicate?.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDuplicateModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notification hint */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-blue-900 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Dữ liệu chuyên môn đã được điền sẵn (Pre-filled):</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                Chức danh, Mô tả công việc, Yêu cầu kỹ năng và Dải lương đã tự động sao chép. Manager chỉ cần cập nhật <strong>Số lượng</strong> và <strong>Ngày cần người</strong> trước khi bấm Trình duyệt.
              </p>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmitDuplicate} className="space-y-4 text-xs">
              {/* Title & Department */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">Chức danh tuyển dụng *</label>
                <input
                  type="text"
                  required
                  value={duplicateForm.title}
                  onChange={(e) => setDuplicateForm({ ...duplicateForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              {/* Two Column Grid for Key Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Level */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">Chức danh <span className="font-normal text-slate-400">(kế thừa)</span></label>
                  <input
                    type="text"
                    value={duplicateForm.level}
                    readOnly
                    title="Kế thừa từ tờ trình gốc; sửa trong bản nháp sau khi tạo nếu cần."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* Salary Range */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">Dải lương đề xuất <span className="font-normal text-slate-400">(kế thừa)</span></label>
                  <input
                    type="text"
                    value={duplicateForm.salaryRange}
                    readOnly
                    title="Kế thừa từ tờ trình gốc; sửa trong bản nháp sau khi tạo nếu cần."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-emerald-700 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* KEY EDITABLE FIELDS: TARGET COUNT & TARGET DATE */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/90 space-y-3">
                <div className="text-[11px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-amber-700" />
                  <span>Các thông số cần xác nhận điều chỉnh:</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Target Count (Số lượng cần tuyển) */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-800">
                      Số lượng cần tuyển (Headcount) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      required
                      value={duplicateForm.targetCount}
                      onChange={(e) => setDuplicateForm({ ...duplicateForm, targetCount: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl font-black text-blue-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  {/* Target Date (Ngày cần người) */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-800">
                      Ngày cần người (Target Date) *
                    </label>
                    <input
                      type="date"
                      required
                      value={duplicateForm.targetDate}
                      onChange={(e) => setDuplicateForm({ ...duplicateForm, targetDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  {/* Reason (Lý do tuyển dụng bổ sung - col-span-2) */}
                  <div className="space-y-1 col-span-1 md:col-span-2">
                    <label className="block font-bold text-slate-800">Lý do tuyển dụng bổ sung *</label>
                    <input
                      type="text"
                      required
                      value={duplicateForm.reason}
                      onChange={(e) => setDuplicateForm({ ...duplicateForm, reason: e.target.value })}
                      placeholder="Ví dụ: Dự án mở rộng, bổ sung nhân sự thay thế..."
                      className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Description & Requirements (Pre-filled) - 2 Column Grid for optimal screen usage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Description (Pre-filled) */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">Mô tả công việc (JD)</label>
                  <textarea
                    rows={5}
                    value={duplicateForm.description}
                    onChange={(e) => setDuplicateForm({ ...duplicateForm, description: e.target.value })}
                    placeholder="Mô tả công việc và trách nhiệm chính..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all resize-y"
                  />
                </div>

                {/* Requirements (Pre-filled) */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">Yêu cầu chuyên môn</label>
                  <textarea
                    rows={5}
                    value={duplicateForm.requirements}
                    onChange={(e) => setDuplicateForm({ ...duplicateForm, requirements: e.target.value })}
                    placeholder="Yêu cầu kinh nghiệm, kỹ năng và học vấn..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all resize-y"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDuplicateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md shadow-blue-500/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>Trình Duyệt Ngay</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ManagerRequisitionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Đang tải danh sách yêu cầu...</div>}>
      <RequisitionsContent />
    </Suspense>
  );
}
