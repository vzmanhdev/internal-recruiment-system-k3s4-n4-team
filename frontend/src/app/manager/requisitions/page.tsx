'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Pagination } from '@/components/ui/Pagination';
import { managerApi, type ManagerRequisitionItem } from '@/features/manager/api';
import { getLocalTodayDateString, isPastDate } from '@/utils/dateUtils';
import { useApiData } from '@/hooks/useApiData';
import { ErrorState, LoadingState } from '@/components/ui/DataStates';
import { ApiError } from '@/lib/api-client';
import { masterDataService } from '@/services/master-data.service';
import { requisitionService } from '@/services/requisition.service';
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
  TrendingUp,
  Briefcase,
  Calendar,
  DollarSign,
  Send,
  Building2,
  Sparkles,
  Edit3,
  Layers,
  ArrowRight,
  ShieldCheck,
  Save,
  Check,
  Info,
  RotateCcw,
} from 'lucide-react';
import clsx from 'clsx';

export type { ManagerRequisitionItem } from '@/features/manager/api';

const formatVNDDisplay = (amount?: number | string | null): string => {
  if (amount === '' || amount === undefined || amount === null) return '';
  const num = typeof amount === 'number' ? amount : Number(String(amount).replace(/\D/g, ''));
  if (isNaN(num) || num === 0) return '';
  return new Intl.NumberFormat('vi-VN').format(num) + ' đ';
};

const parseVND = (val?: string | number | null): number | undefined => {
  if (val === '' || val === undefined || val === null) return undefined;
  const clean = String(val).replace(/\D/g, '');
  if (!clean) return undefined;
  const num = Number(clean);
  return isNaN(num) ? undefined : num;
};

function RequisitionsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, error, loading, reload, setData } = useApiData(() => managerApi.requisitions());
  const requisitions = data || [];
  const [submitting, setSubmitting] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Master Data: Departments & Active Job Titles
  const { data: masterData } = useApiData(async () => {
    const [titles, depts] = await Promise.all([
      masterDataService.jobTitles(),
      masterDataService.departments(false),
    ]);
    return { titles: titles.filter((t) => t.is_active), depts: depts.filter((d) => d.is_active) };
  }, []);

  // Modal State: Create, Edit Draft, or Duplicate
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit_draft' | 'duplicate'>('create');
  const [editingReqId, setEditingReqId] = useState<number | null>(null);

  // Helper: Default future date (today + 30 days)
  const getDefaultFutureDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };

  // Form State
  const [form, setForm] = useState({
    title: '',
    departmentId: '',
    jobTitleId: '',
    quantity: 1,
    reason: 'expansion' as 'replacement' | 'expansion' | 'seasonal',
    reasonDetail: '',
    minSalary: '' as number | string,
    maxSalary: '' as number | string,
    isSalaryNegotiable: false,
    salaryJustification: '',
    targetDate: getDefaultFutureDate(),
    description: '',
    requirements: '',
    benefits: '',
  });

  // Real-time Salary Band Check State
  const [isSalaryOutsideBand, setIsSalaryOutsideBand] = useState(false);
  const [checkingBand, setCheckingBand] = useState(false);

  // Feedback Toast & Error State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Currently selected Job Title object
  const chosenTitle = useMemo(() => {
    return masterData?.titles.find((t) => String(t.id) === String(form.jobTitleId));
  }, [masterData?.titles, form.jobTitleId]);

  // Filtered job titles according to selected department (supporting direct match, parent department match, or safe fallback)
  const availableTitles = useMemo(() => {
    if (!masterData?.titles || masterData.titles.length === 0) return [];
    if (!form.departmentId) return masterData.titles;

    const deptId = Number(form.departmentId);
    const chosenDept = masterData.depts?.find((d) => d.id === deptId);
    const parentDeptId = chosenDept?.parent_id;

    // 1. Direct department match
    const directMatches = masterData.titles.filter((t) => t.department_id === deptId);

    // 2. Parent department match (e.g. HR titles for HR-TA subdepartment)
    const parentMatches = parentDeptId
      ? masterData.titles.filter((t) => t.department_id === parentDeptId)
      : [];

    // 3. Global titles (titles without specific department)
    const globalMatches = masterData.titles.filter((t) => !t.department_id);

    const matches = [...directMatches, ...parentMatches, ...globalMatches];
    if (matches.length > 0) {
      return matches;
    }

    // Fallback: If this sub-department has no specialized titles, show all active titles so user can still choose
    return masterData.titles;
  }, [masterData?.titles, masterData?.depts, form.departmentId]);

  // Real-time checking if proposed salary is outside the standard band
  useEffect(() => {
    if (!form.jobTitleId || form.isSalaryNegotiable) {
      setIsSalaryOutsideBand(false);
      return;
    }

    const minVal = parseVND(form.minSalary);
    const maxVal = parseVND(form.maxSalary);

    if (minVal === undefined && maxVal === undefined) {
      setIsSalaryOutsideBand(false);
      return;
    }

    let active = true;
    setCheckingBand(true);

    // Call real-time check API
    requisitionService
      .checkSalaryBand(Number(form.jobTitleId), minVal, maxVal)
      .then((res) => {
        if (active) {
          setIsSalaryOutsideBand(Boolean(res.outside));
        }
      })
      .catch(() => {
        // Fallback: evaluate locally if title has min_salary / max_salary
        if (active && chosenTitle && (chosenTitle.min_salary || chosenTitle.max_salary)) {
          const low = minVal !== undefined ? minVal : maxVal;
          const high = maxVal !== undefined ? maxVal : minVal;
          const outside =
            (low !== undefined && chosenTitle.min_salary !== undefined && low < chosenTitle.min_salary) ||
            (high !== undefined && chosenTitle.max_salary !== undefined && high > chosenTitle.max_salary);
          setIsSalaryOutsideBand(Boolean(outside));
        }
      })
      .finally(() => {
        if (active) setCheckingBand(false);
      });

    return () => {
      active = false;
    };
  }, [form.jobTitleId, form.minSalary, form.maxSalary, form.isSalaryNegotiable, chosenTitle]);

  // Action: Open Modal in CREATE Mode (Từ đầu)
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingReqId(null);
    setFormError(null);
    const defaultDept = masterData?.depts[0]?.id ? String(masterData.depts[0].id) : '';
    setForm({
      title: '',
      departmentId: defaultDept,
      jobTitleId: '',
      quantity: 1,
      reason: 'expansion',
      reasonDetail: '',
      minSalary: '',
      maxSalary: '',
      isSalaryNegotiable: false,
      salaryJustification: '',
      targetDate: getDefaultFutureDate(),
      description: '',
      requirements: '',
      benefits: '',
    });
    setIsModalOpen(true);
  };

  // Action: Open Modal in EDIT DRAFT Mode (Sửa bản nháp)
  const handleOpenEditDraftModal = async (req: ManagerRequisitionItem) => {
    setModalMode('edit_draft');
    setEditingReqId(req.dbId);
    setFormError(null);
    try {
      const fullReq = await requisitionService.getRequisitionById(req.dbId);
      setForm({
        title: fullReq.title || '',
        departmentId: fullReq.department_id ? String(fullReq.department_id) : '',
        jobTitleId: fullReq.job_title_id ? String(fullReq.job_title_id) : '',
        quantity: fullReq.quantity || 1,
        reason: (fullReq.reason as 'replacement' | 'expansion' | 'seasonal') || 'replacement',
        reasonDetail: fullReq.reason_detail || '',
        minSalary: fullReq.min_salary ? String(fullReq.min_salary) : '',
        maxSalary: fullReq.max_salary ? String(fullReq.max_salary) : '',
        isSalaryNegotiable: Boolean(fullReq.is_salary_negotiable),
        salaryJustification: fullReq.salary_justification || '',
        targetDate: fullReq.target_onboard_date || getDefaultFutureDate(),
        description: fullReq.job_description || '',
        requirements: fullReq.requirements || '',
        benefits: fullReq.benefits || '',
      });
      setIsModalOpen(true);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Không tải được chi tiết bản nháp.');
    }
  };

  // Action: Open Modal in DUPLICATE Mode (Sao chép yêu cầu cũ - S3-05)
  const handleOpenDuplicateModal = async (req: ManagerRequisitionItem) => {
    setModalMode('duplicate');
    setEditingReqId(null);
    setFormError(null);
    try {
      const fullReq = await requisitionService.getRequisitionById(req.dbId);
      const validTargetDate = !fullReq.target_onboard_date || isPastDate(fullReq.target_onboard_date)
        ? getDefaultFutureDate()
        : fullReq.target_onboard_date;

      setForm({
        title: `${fullReq.title} (Bản sao)`,
        departmentId: fullReq.department_id ? String(fullReq.department_id) : '',
        jobTitleId: fullReq.job_title_id ? String(fullReq.job_title_id) : '',
        quantity: fullReq.quantity || 1,
        reason: (fullReq.reason as 'replacement' | 'expansion' | 'seasonal') || 'expansion',
        reasonDetail: `Sao chép từ yêu cầu ${fullReq.code}`,
        minSalary: fullReq.min_salary ? String(fullReq.min_salary) : '',
        maxSalary: fullReq.max_salary ? String(fullReq.max_salary) : '',
        isSalaryNegotiable: Boolean(fullReq.is_salary_negotiable),
        salaryJustification: fullReq.salary_justification || '',
        targetDate: validTargetDate,
        description: fullReq.job_description || '',
        requirements: fullReq.requirements || '',
        benefits: fullReq.benefits || '',
      });
      setIsModalOpen(true);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Không tải được thông tin yêu cầu cần sao chép.');
    }
  };

  // Check URL query param ?cloneId=...
  useEffect(() => {
    const cloneId = searchParams.get('cloneId');
    if (cloneId && requisitions.length > 0) {
      const target = requisitions.find((r) => r.id === cloneId);
      if (target) {
        handleOpenDuplicateModal(target);
      }
    }
  }, [searchParams, requisitions.length]);

  // Form Submit Handler: Supports both "Save as Draft" and "Submit for Approval"
  const handleSubmitForm = async (e: React.FormEvent, submitForApproval: boolean) => {
    e.preventDefault();
    setFormError(null);

    // AC04: Validate Target Date (Không được ở quá khứ)
    if (form.targetDate && isPastDate(form.targetDate)) {
      setFormError('Ngày cần người không được ở trong quá khứ. Vui lòng chọn ngày trong tương lai.');
      return;
    }

    if (!form.title.trim()) {
      setFormError('Vui lòng nhập chức danh / tiêu đề yêu cầu tuyển dụng.');
      return;
    }

    if (!form.departmentId) {
      setFormError('Vui lòng chọn phòng ban.');
      return;
    }

    const minSalNum = parseVND(form.minSalary);
    const maxSalNum = parseVND(form.maxSalary);

    if (minSalNum !== undefined && maxSalNum !== undefined && minSalNum > maxSalNum) {
      setFormError('Mức lương tối thiểu không được lớn hơn mức lương tối đa.');
      return;
    }

    // AC03: Dải lương đề xuất nằm ngoài dải chuẩn thì bắt buộc nhập giải trình
    if (isSalaryOutsideBand && !form.salaryJustification.trim()) {
      setFormError('Dải lương đề xuất nằm ngoài dải chuẩn của chức danh — bắt buộc nhập giải trình.');
      return;
    }

    const payload = {
      title: form.title.trim(),
      department_id: Number(form.departmentId),
      job_title_id: form.jobTitleId ? Number(form.jobTitleId) : undefined,
      quantity: Math.max(1, Number(form.quantity) || 1),
      reason: form.reason,
      reason_detail: form.reasonDetail.trim() || undefined,
      min_salary: minSalNum,
      max_salary: maxSalNum,
      is_salary_negotiable: form.isSalaryNegotiable,
      salary_justification: form.salaryJustification.trim() || undefined,
      target_onboard_date: form.targetDate || undefined,
      job_description: form.description.trim() || undefined,
      requirements: form.requirements.trim() || undefined,
      benefits: form.benefits.trim() || undefined,
    };

    setSubmitting(true);
    try {
      const actorLabel = user?.full_name || user?.email || 'Trưởng bộ phận';

      if (modalMode === 'edit_draft' && editingReqId) {
        // Cập nhật bản nháp đã có
        const updated = await managerApi.updateRequisition(editingReqId, payload);
        if (submitForApproval) {
          const submitted = await managerApi.submitRequisition(editingReqId);
          setData((prev) => (prev || []).map((r) => (r.dbId === editingReqId ? submitted : r)));
          showToast(`🚀 [Trình Duyệt Thành Công] Yêu cầu ${submitted.id} (${submitted.title}) đã được trình duyệt cho Trưởng bộ phận ${actorLabel}.`);
        } else {
          setData((prev) => (prev || []).map((r) => (r.dbId === editingReqId ? updated : r)));
          showToast(`✅ [Lưu Nháp Thành Công] Đã cập nhật bản nháp yêu cầu ${updated.id} cho Trưởng bộ phận ${actorLabel}.`);
        }
      } else {
        // Tạo mới từ đầu hoặc tạo từ bản sao
        const result = await managerApi.createRequisition({
          ...payload,
          save_as_draft: !submitForApproval,
        });
        setData((prev) => [result, ...(prev || [])]);
        if (submitForApproval) {
          showToast(`🚀 [Trình Duyệt Thành Công] Yêu cầu ${result.id} (${result.title}) đã được tạo và trình duyệt cho Trưởng bộ phận ${actorLabel}.`);
        } else {
          showToast(`✅ [Lưu Nháp Thành Công] Yêu cầu ${result.id} (${result.title}) đã được lưu bản nháp cho Trưởng bộ phận ${actorLabel}.`);
        }
      }

      setIsModalOpen(false);
      await reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Đã có lỗi xảy ra khi xử lý yêu cầu.');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick submit for draft rows in table
  const handleQuickSubmitDraft = async (req: ManagerRequisitionItem) => {
    if (!confirm(`Bạn có chắc chắn muốn gửi trình duyệt yêu cầu ${req.id} (${req.title})?`)) return;
    try {
      const submitted = await managerApi.submitRequisition(req.dbId);
      setData((prev) => (prev || []).map((r) => (r.dbId === req.dbId ? submitted : r)));
      const actorLabel = user?.full_name || user?.email || 'Trưởng bộ phận';
      showToast(`🚀 [Trình Duyệt Thành Công] Yêu cầu ${submitted.id} đã được gửi phê duyệt cho Trưởng bộ phận ${actorLabel}.`);
      await reload();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Không thể gửi duyệt yêu cầu.');
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
  const draftCount = requisitions.filter((r) => r.status === 'Draft').length;
  const closedCount = requisitions.filter((r) => r.status === 'Closed').length;

  return (
    <div className="space-y-6">
      {/* Toast Alert với thông tin User chi tiết */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-60 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs font-semibold leading-relaxed">{toastMessage}</div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-slate-800 rounded-lg ml-auto text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileCheck className="w-7 h-7 text-blue-600" />
            Yêu Cầu Tuyển Dụng (Requisitions)
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-2">
            <span>Quản lý danh sách tờ trình xin định biên nhân sự của bộ phận</span>
            {user && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-blue-600 font-bold">Trưởng bộ phận: {user.full_name || user.email}</span>
              </>
            )}
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-[8px] bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tạo Yêu Cầu Mới</span>
        </button>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng tờ trình</span>
          <div className="text-2xl font-black text-slate-900">{totalCount}</div>
          <p className="text-[11px] text-slate-500">Toàn bộ yêu cầu</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-blue-500 uppercase tracking-wider">Bản nháp</span>
          <div className="text-2xl font-black text-blue-600">{draftCount}</div>
          <p className="text-[11px] text-blue-600/80">Chờ hoàn thiện</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">Chờ duyệt</span>
          <div className="text-2xl font-black text-amber-600">{pendingCount}</div>
          <p className="text-[11px] text-amber-600/80">Đang luân chuyển</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">Đang mở tuyển</span>
          <div className="text-2xl font-black text-emerald-600">{activeCount}</div>
          <p className="text-[11px] text-emerald-600/80">Đã duyệt & nhận CV</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đã đóng</span>
          <div className="text-2xl font-black text-slate-600">{closedCount}</div>
          <p className="text-[11px] text-slate-500">Đã đủ / Hủy</p>
        </div>
      </div>

      {/* 3. SEARCH & FILTER TOOLBAR */}
      <div className="bg-white rounded-[8px] shadow-sm border border-slate-100 p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Tìm theo chức danh, mã REQ hoặc phòng ban..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-[8px] text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-[8px] text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-600"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="Draft">Bản nháp (Draft)</option>
            <option value="Pending">Chờ duyệt (Pending)</option>
            <option value="Active">Đang mở tuyển (Active)</option>
            <option value="Closed">Đã đóng (Closed)</option>
          </select>
        </div>
      </div>

      {/* 4. DATA TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-xs text-slate-500 font-semibold tracking-wider uppercase">
                <th className="py-4 px-6">Mã & Chức Danh</th>
                <th className="py-4 px-6">Phòng Ban</th>
                <th className="py-4 px-6 text-center">Tiến Độ Tuyển</th>
                <th className="py-4 px-6">Dải Lương Đề Xuất</th>
                <th className="py-4 px-6">Ngày Cần Người</th>
                <th className="py-4 px-6">Trạng Thái</th>
                <th className="py-4 px-6 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8"><LoadingState /></td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="py-8"><ErrorState error={error} onRetry={reload} /></td>
                </tr>
              ) : paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {requisitions.length === 0
                      ? 'Chưa có yêu cầu tuyển dụng nào. Nhấn "+ Tạo Yêu Cầu Mới" để bắt đầu.'
                      : 'Không tìm thấy yêu cầu tuyển dụng nào phù hợp với bộ lọc tìm kiếm.'}
                  </td>
                </tr>
              ) : (
                paginatedList.map((req) => (
                  <tr
                    key={req.dbId}
                    onClick={() => router.push(`/manager/requisitions/${req.dbId}`)}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                  >
                    {/* Title & Code */}
                    <td className="py-4 px-6">
                      <Link
                        href={`/manager/requisitions/${req.dbId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="group/link font-bold text-slate-900 hover:text-blue-600 transition-colors block"
                      >
                        <div className="text-sm font-extrabold group-hover/link:underline">{req.title}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{req.id} • {req.level}</div>
                      </Link>
                    </td>

                    {/* Department */}
                    <td className="py-4 px-6">
                      <span className="font-semibold text-slate-700">{req.department}</span>
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
                      <div>{req.salaryRange}</div>
                      {req.salaryJustification && (
                        <div className="text-[10px] text-amber-600 font-medium flex items-center gap-1 mt-0.5" title={req.salaryJustification}>
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>Đã có giải trình</span>
                        </div>
                      )}
                    </td>

                    {/* Deadline */}
                    <td className="py-4 px-6 text-slate-600 font-medium">
                      {req.targetDate}
                    </td>

                    {/* Status Badges */}
                    <td className="py-4 px-6">
                      {req.status === 'Draft' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          Bản nháp
                        </span>
                      )}
                      {req.status === 'Pending' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Chờ phê duyệt
                        </span>
                      )}
                      {req.status === 'Active' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Đang mở tuyển
                        </span>
                      )}
                      {req.status === 'Closed' && (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          Đã đóng
                        </span>
                      )}
                    </td>

                    {/* Action Column */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit Draft Action (S2-10 AC02) */}
                        {req.status === 'Draft' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditDraftModal(req);
                              }}
                              className="p-2 rounded-[8px] text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Sửa bản nháp"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickSubmitDraft(req);
                              }}
                              className="p-2 rounded-[8px] text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="Gửi duyệt ngay"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {/* View Detail Button with text & icon */}
                        <Link
                          href={`/manager/requisitions/${req.dbId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 font-bold text-xs transition-all cursor-pointer shadow-2xs group active:scale-95 shrink-0"
                          title="Xem chi tiết & Lịch sử duyệt"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem chi tiết</span>
                        </Link>

                        {/* Duplicate Action (S3-05) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDuplicateModal(req);
                          }}
                          className="p-2 rounded-[8px] text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="Sao chép yêu cầu (Duplicate)"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Thanh Phân Trang */}
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
      {/* 5. MODAL FORM: TẠO MỚI / CHỈNH SỬA BẢN NHÁP / SAO CHÉP                    */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl p-6 md:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 space-y-6 my-8 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[8px] bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  {modalMode === 'create' ? <Plus className="w-5 h-5" /> : modalMode === 'edit_draft' ? <Edit3 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 tracking-tight">
                    {modalMode === 'create'
                      ? 'Tạo Yêu Cầu Tuyển Dụng Mới (Headcount Requisition)'
                      : modalMode === 'edit_draft'
                      ? 'Chỉnh Sửa Bản Nháp Yêu Cầu Tuyển Dụng'
                      : 'Tạo Yêu Cầu Tuyển Dụng (Bản Sao)'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {modalMode === 'create'
                      ? 'Khai báo thông số tuyển dụng để xin headcount có hồ sơ rõ ràng'
                      : modalMode === 'edit_draft'
                      ? 'Hoàn thiện thông tin trước khi gửi lên luồng phê duyệt'
                      : 'Kế thừa tiêu chuẩn công việc từ yêu cầu trước đó'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-[8px] text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner */}
            {formError && (
              <div className="p-4 rounded-[8px] bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                <span className="flex-1">{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={(e) => handleSubmitForm(e, true)} className="space-y-5 text-xs">
              {/* SECTION 1: CƠ CẤU & CHỨC DANH */}
              <div className="space-y-3">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>1. Cơ Cấu Tổ Chức & Chức Danh Tuyển Dụng</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Department */}
                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-700">Phòng ban đề xuất *</label>
                    <select
                      required
                      value={form.departmentId}
                      onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[8px] font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    >
                      <option value="">-- Chọn phòng ban --</option>
                      {(masterData?.depts || []).map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Standard Job Title */}
                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-700">Chức danh chuẩn (Master Data) *</label>
                    <select
                      required
                      value={form.jobTitleId}
                      onChange={(e) => {
                        const tId = e.target.value;
                        const tObj = masterData?.titles.find((t) => String(t.id) === tId);
                        setForm({
                          ...form,
                          jobTitleId: tId,
                          title: form.title || tObj?.name || '',
                        });
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[8px] font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    >
                      <option value="">-- Chọn chức danh tiêu chuẩn --</option>
                      {availableTitles.map((t) => {
                        const dept = masterData?.depts.find((d) => d.id === t.department_id);
                        return (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.level}){dept ? ` • ${dept.code}` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Job Title / Requisition Title */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">Tiêu đề tờ trình tuyển dụng *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Kỹ Sư Backend Senior (Python / FastAPI)..."
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[8px] font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* SECTION 2: ĐỊNH BIÊN & LÝ DO TUYỂN DỤNG (AC01) */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-amber-600" />
                  <span>2. Số Lượng Headcount & Lý Do Tuyển Dụng (AC01)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  {/* Quantity */}
                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-700">Số lượng cần tuyển (Headcount) *</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      required
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: Math.max(1, Number(e.target.value)) })}
                      className="w-full h-[42px] px-3.5 bg-slate-50 border border-slate-200 rounded-[8px] font-black text-blue-700 focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-xs"
                    />
                  </div>

                  {/* Reason Type (Standalone Equal Cards) */}
                  <div className="space-y-1.5 col-span-1 md:col-span-2">
                    <label className="block font-bold text-slate-700">Lý do tuyển dụng *</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, reason: 'replacement' })}
                        className={clsx(
                          'w-full h-[42px] px-2.5 rounded-[8px] border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5',
                          form.reason === 'replacement'
                            ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        )}
                      >
                        <RotateCcw className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                        <span className="truncate">Tuyển thay thế</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setForm({ ...form, reason: 'expansion' })}
                        className={clsx(
                          'w-full h-[42px] px-2.5 rounded-[8px] border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5',
                          form.reason === 'expansion'
                            ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        )}
                      >
                        <TrendingUp className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                        <span className="truncate">Tăng mới định biên</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setForm({ ...form, reason: 'seasonal' })}
                        className={clsx(
                          'w-full h-[42px] px-2.5 rounded-[8px] border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5',
                          form.reason === 'seasonal'
                            ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        )}
                      >
                        <Clock className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                        <span className="truncate">Thời vụ / Dự án</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Reason Detail */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">Chi tiết lý do đề xuất tuyển</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Thay thế nhân sự nghỉ việc từ tháng 11; hoặc Bổ sung 2 dev cho dự án Core ATS..."
                    value={form.reasonDetail}
                    onChange={(e) => setForm({ ...form, reasonDetail: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[8px] font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* SECTION 3: DẢI LƯƠNG ĐỀ XUẤT & KIỂM TRA DẢI CHUẨN (AC01 & AC03) */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>3. Dải Lương Đề Xuất & Thẩm Định Khung Chuẩn (AC03)</span>
                  </div>
                  {chosenTitle?.min_salary && chosenTitle?.max_salary ? (
                    <span className="text-[11px] font-bold text-slate-500">
                      Khung chuẩn chức danh: {formatVNDDisplay(chosenTitle.min_salary)} – {formatVNDDisplay(chosenTitle.max_salary)}
                    </span>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Min Salary */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-slate-700">Lương tối thiểu (VNĐ) *</label>
                      {parseVND(form.minSalary) ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[6px] border border-emerald-200">
                          {formatVNDDisplay(form.minSalary)}
                        </span>
                      ) : null}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        disabled={form.isSalaryNegotiable}
                        placeholder="Ví dụ: 20.000.000"
                        value={form.minSalary ? Number(String(form.minSalary).replace(/\D/g, '')).toLocaleString('vi-VN') : ''}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '');
                          setForm({ ...form, minSalary: raw });
                        }}
                        className="w-full pl-8 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-[8px] font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white disabled:opacity-50 text-xs"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold select-none text-xs">
                        ₫
                      </span>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold select-none text-xs">
                        đ
                      </span>
                    </div>
                  </div>

                  {/* Max Salary */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-slate-700">Lương tối đa (VNĐ) *</label>
                      {parseVND(form.maxSalary) ? (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-[6px] border border-emerald-200">
                          {formatVNDDisplay(form.maxSalary)}
                        </span>
                      ) : null}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        disabled={form.isSalaryNegotiable}
                        placeholder="Ví dụ: 30.000.000"
                        value={form.maxSalary ? Number(String(form.maxSalary).replace(/\D/g, '')).toLocaleString('vi-VN') : ''}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '');
                          setForm({ ...form, maxSalary: raw });
                        }}
                        className="w-full pl-8 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-[8px] font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white disabled:opacity-50 text-xs"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold select-none text-xs">
                        ₫
                      </span>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold select-none text-xs">
                        đ
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                {!form.isSalaryNegotiable && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[11px] font-medium text-slate-400 mr-1">Gợi ý nhanh:</span>
                    {[
                      { label: '15 triệu', min: 15_000_000, max: 20_000_000 },
                      { label: '20 triệu', min: 20_000_000, max: 25_000_000 },
                      { label: '25 triệu', min: 25_000_000, max: 30_000_000 },
                      { label: '30 triệu', min: 30_000_000, max: 35_000_000 },
                      { label: '40 triệu', min: 40_000_000, max: 50_000_000 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            minSalary: String(preset.min),
                            maxSalary: String(preset.max),
                          })
                        }
                        className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-[6px] border border-slate-200/80 transition-all cursor-pointer"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Checkbox Thỏa thuận */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="negotiable"
                    checked={form.isSalaryNegotiable}
                    onChange={(e) => setForm({ ...form, isSalaryNegotiable: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="negotiable" className="font-semibold text-slate-700 cursor-pointer">
                    Mức lương thỏa thuận theo năng lực ứng viên
                  </label>
                </div>

                {/* Dynamic Status Pill / Alert for Salary Band */}
                {isSalaryOutsideBand ? (
                  <div className="p-3.5 rounded-[8px] bg-amber-50 border border-amber-200/90 text-amber-900 text-xs space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2 font-bold text-amber-800">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>Cảnh báo: Dải lương đề xuất nằm ngoài khung chuẩn của chức danh</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                      Theo tiêu chí <strong>S2-10-AC03</strong>, mức lương đề xuất nằm ngoài dải chuẩn công ty bắt buộc phải nhập giải trình để Hội đồng / Ban Giám đốc thẩm định.
                    </p>
                    <div className="space-y-1 pt-1">
                      <label className="block font-bold text-amber-950">Giải trình lý do mức lương đề xuất *</label>
                      <textarea
                        required
                        rows={2}
                        value={form.salaryJustification}
                        onChange={(e) => setForm({ ...form, salaryJustification: e.target.value })}
                        placeholder="Nhập giải trình lý do (ví dụ: Yêu cầu chuyên gia công nghệ cao, thị trường cạnh tranh gay gắt...)"
                        className="w-full px-3 py-2 bg-white border border-amber-300 rounded-[8px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>
                ) : (form.minSalary || form.maxSalary) && !checkingBand ? (
                  <div className="p-2.5 rounded-[8px] bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>✓ Dải lương đề xuất nằm trong khung tiêu chuẩn quy định của chức danh.</span>
                  </div>
                ) : null}
              </div>

              {/* SECTION 4: NGÀY CẦN NGƯỜI (AC04) */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span>4. Thời Hạn & Ngày Cần Người (AC04)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-700">Ngày cần nhân sự nhận việc (Target Onboard Date) *</label>
                    <input
                      type="date"
                      required
                      min={getLocalTodayDateString()}
                      value={form.targetDate}
                      onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[8px] font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                    />
                    {form.targetDate && isPastDate(form.targetDate) && (
                      <p className="text-[11px] text-rose-600 font-bold mt-1">⚠️ Ngày cần người không được ở quá khứ (S2-10-AC04).</p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 5: MÔ TẢ CÔNG VIỆC & YÊU CẦU ỨNG VIÊN (AC02) */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-blue-600" />
                  <span>5. Hồ Sơ Chuyên Môn & Yêu Cầu Ứng Viên (AC02)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Job Description */}
                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-700">Mô tả công việc (JD)</label>
                    <textarea
                      rows={5}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Mô tả mục tiêu vị trí, trách nhiệm công việc chính..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[8px] font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white resize-y"
                    />
                  </div>

                  {/* Requirements */}
                  <div className="space-y-1.5">
                    <label className="block font-bold text-slate-700">Yêu cầu ứng viên</label>
                    <textarea
                      rows={5}
                      value={form.requirements}
                      onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                      placeholder="Yêu cầu về kinh nghiệm, kỹ năng, ngoại ngữ và trình độ học vấn..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[8px] font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white resize-y"
                    />
                  </div>
                </div>

                {/* Benefits */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">Quyền lợi & đãi ngộ</label>
                  <textarea
                    rows={2}
                    value={form.benefits}
                    onChange={(e) => setForm({ ...form, benefits: e.target.value })}
                    placeholder="Chế độ thưởng, phụ cấp, bảo hiểm chăm sóc sức khỏe, đào tạo..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-[8px] font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white resize-y"
                  />
                </div>
              </div>

              {/* MODAL ACTIONS: LƯU NHÁP & TRÌNH DUYỆT NGAY */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-[8px] text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Hủy
                </button>

                <div className="flex items-center gap-3">
                  {/* Action 1: Lưu Bản Nháp (AC02) */}
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={(e) => handleSubmitForm(e, false)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-[8px] border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 text-slate-500" />
                    <span>Lưu Bản Nháp</span>
                  </button>

                  {/* Action 2: Trình Duyệt Ngay */}
                  <button
                    type="button"
                    disabled={submitting || (Boolean(form.targetDate) && isPastDate(form.targetDate))}
                    onClick={(e) => handleSubmitForm(e, true)}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-[8px] bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md shadow-blue-500/25 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>Trình Duyệt Ngay</span>
                  </button>
                </div>
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
