'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Layers, Plus, CheckCircle2, ArrowRight, Edit2, 
  Check, Search, MoreHorizontal, Lightbulb, AlertTriangle, 
  Eye, ChevronLeft, ChevronRight, ChevronDown, Trash2, 
  ShieldAlert
} from 'lucide-react';
import { CreateApprovalFlowModal, ApprovalFlowFormData } from '@/features/hr/components/CreateApprovalFlowModal';
import { masterDataService, ApprovalFlow, Department, ApprovalTypeOption, ApprovalRoleOption } from '@/services/master-data.service';
import { useApiData } from '@/hooks/useApiData';
import { ErrorState, LoadingState } from '@/components/ui/DataStates';
import { ApiError } from '@/lib/api-client';
import { formatVND } from '@/lib/currency';

export default function HRApprovalFlowsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedFlow, setSelectedFlow] = useState<ApprovalFlow | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Filters & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all'); // 'all', 'company', or dept ID
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all'); // 'all', 'active', 'draft', 'inactive'
  const [sortBy, setSortBy] = useState<string>('updated_desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Active action menu row ID
  const [activeMenuFlowId, setActiveMenuFlowId] = useState<number | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Delete modal state
  const [flowToDelete, setFlowToDelete] = useState<ApprovalFlow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Searchable Dept Combobox in Filter Bar State
  const [isDeptFilterOpen, setIsDeptFilterOpen] = useState(false);
  const [deptFilterSearch, setDeptFilterSearch] = useState('');
  const deptFilterRef = useRef<HTMLDivElement>(null);

  // Click outside listener for menus
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setActiveMenuFlowId(null);
      }
      if (deptFilterRef.current && !deptFilterRef.current.contains(event.target as Node)) {
        setIsDeptFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch real data from APIs
  const { data, error, loading, reload } = useApiData(async () => {
    const [flows, depts, types, roles] = await Promise.all([
      masterDataService.approvalFlows(),
      masterDataService.departments(false),
      masterDataService.approvalTypes(),
      masterDataService.approvalRoles(),
    ]);
    return { flows, depts, types, roles };
  }, []);

  const departments = data?.depts || [];
  const approvalTypes = useMemo(() => {
    const raw = data?.types || [];
    const seen = new Set<string>();
    return raw.filter((t) => {
      if (seen.has(t.code)) return false;
      seen.add(t.code);
      return true;
    });
  }, [data?.types]);
  const approvalRoles = data?.roles || [];
  const rawFlows = data?.flows || [];

  // Filtered & Sorted list
  const filteredFlows = useMemo(() => {
    return rawFlows.filter((flow) => {
      // 1. Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = flow.name.toLowerCase().includes(term);
        const matchesDept = (flow.department_name || '').toLowerCase().includes(term);
        if (!matchesName && !matchesDept) return false;
      }

      // 2. Department filter
      if (selectedDeptFilter !== 'all') {
        if (selectedDeptFilter === 'company') {
          if (flow.department_id !== null) return false;
        } else {
          if (flow.department_id !== Number(selectedDeptFilter)) return false;
        }
      }

      // 3. Approval Type filter
      if (selectedTypeFilter !== 'all') {
        if (flow.approval_type !== selectedTypeFilter) return false;
      }

      // 4. Status filter
      if (selectedStatusFilter !== 'all') {
        if (flow.status !== selectedStatusFilter) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
      if (sortBy === 'updated_asc') {
        return new Date(a.updated_at || a.created_at || 0).getTime() - new Date(b.updated_at || b.created_at || 0).getTime();
      }
      if (sortBy === 'threshold_asc') {
        return a.min_salary_threshold - b.min_salary_threshold;
      }
      if (sortBy === 'threshold_desc') {
        return b.max_salary_threshold - a.max_salary_threshold;
      }
      // default: updated_desc
      return new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime();
    });
  }, [rawFlows, searchTerm, selectedDeptFilter, selectedTypeFilter, selectedStatusFilter, sortBy]);

  // Pagination calculation
  const totalItems = filteredFlows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedFlows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFlows.slice(start, start + pageSize);
  }, [filteredFlows, currentPage, pageSize]);

  // Adjust page if out of bounds
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Actions
  const handleOpenCreate = () => {
    setSelectedFlow(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (flow: ApprovalFlow) => {
    setSelectedFlow(flow);
    setModalMode('edit');
    setIsModalOpen(true);
    setActiveMenuFlowId(null);
  };

  const handleOpenView = (flow: ApprovalFlow) => {
    setSelectedFlow(flow);
    setModalMode('view');
    setIsModalOpen(true);
    setActiveMenuFlowId(null);
  };

  const handleToggleStatus = async (flow: ApprovalFlow) => {
    try {
      setActiveMenuFlowId(null);
      if (flow.status === 'active') {
        await masterDataService.deactivateApprovalFlow(flow.id);
        showToast(`Đã ngừng áp dụng luồng "${flow.name}"!`);
      } else {
        await masterDataService.activateApprovalFlow(flow.id);
        showToast(`Đã kích hoạt áp dụng luồng "${flow.name}" thành công!`);
      }
      reload();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Không thể thay đổi trạng thái luồng', 'error');
    }
  };

  const handleDuplicate = async (flow: ApprovalFlow) => {
    try {
      setActiveMenuFlowId(null);
      await masterDataService.saveApprovalFlow({
        name: `${flow.name} (Bản sao)`,
        department_id: flow.department_id,
        approval_type: flow.approval_type,
        min_salary_threshold: flow.min_salary_threshold,
        max_salary_threshold: flow.max_salary_threshold,
        steps: (flow.steps_detail && flow.steps_detail.length > 0 ? flow.steps_detail : flow.steps) as any,
        status: 'draft',
        description: flow.description ? `${flow.description} (Nhân bản)` : '',
      });
      showToast(`Đã nhân bản thành công "${flow.name}" thành bản nháp mới!`);
      reload();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Không thể nhân bản luồng duyệt', 'error');
    }
  };

  const handleSaveModal = async (form: ApprovalFlowFormData) => {
    try {
      if (modalMode === 'edit' && selectedFlow) {
        await masterDataService.saveApprovalFlow({
          name: form.name,
          department_id: form.department_id,
          approval_type: form.approval_type,
          min_salary_threshold: form.min_salary_threshold,
          max_salary_threshold: form.max_salary_threshold,
          steps: form.steps as any,
          status: form.status,
          description: form.description,
        }, selectedFlow.id);
        showToast(`Đã cập nhật luồng phê duyệt "${form.name}" (phiên bản mới đã được lưu)!`);
      } else {
        await masterDataService.saveApprovalFlow({
          name: form.name,
          department_id: form.department_id,
          approval_type: form.approval_type,
          min_salary_threshold: form.min_salary_threshold,
          max_salary_threshold: form.max_salary_threshold,
          steps: form.steps as any,
          status: form.status,
          description: form.description,
        });
        showToast(`Đã tạo luồng phê duyệt "${form.name}" thành công!`);
      }
      setIsModalOpen(false);
      reload();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Không thể lưu luồng phê duyệt', 'error');
    }
  };

  const handleDeleteFlow = async () => {
    if (!flowToDelete) return;
    try {
      setIsDeleting(true);
      await masterDataService.deleteApprovalFlow(flowToDelete.id);
      showToast(`Đã xóa luồng phê duyệt "${flowToDelete.name}" thành công!`);
      setFlowToDelete(null);
      await reload();
      if (paginatedFlows.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      }
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Không thể xóa luồng phê duyệt', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper labels
  const getApprovalTypeBadge = (rawCode: string) => {
    const TYPE_LABELS: Record<string, { label: string; colorClass: string }> = {
      job_requisition: { label: 'Tuyển dụng', colorClass: 'bg-blue-50 text-blue-700 border-blue-200' },
      offer: { label: 'Thư mời nhận việc (Offer)', colorClass: 'bg-purple-50 text-purple-700 border-purple-200' },
      headcount: { label: 'Ngân sách (Headcount)', colorClass: 'bg-amber-50 text-amber-700 border-amber-200' },
      salary_exception: { label: 'Ngoại lệ lương', colorClass: 'bg-rose-50 text-rose-700 border-rose-200' },
    };

    // Normalize raw legacy strings (e.g. 'tuyển_dụng_(job_requisition)')
    let normalized = (rawCode || '').toLowerCase().trim();
    if (normalized.includes('job_requisition') || normalized.includes('tuyển')) normalized = 'job_requisition';
    else if (normalized.includes('offer') || normalized.includes('thư mời')) normalized = 'offer';
    else if (normalized.includes('headcount') || normalized.includes('ngân sách')) normalized = 'headcount';
    else if (normalized.includes('salary_exception') || normalized.includes('ngoại lệ')) normalized = 'salary_exception';

    const found = approvalTypes.find((t) => t.code === rawCode || t.code === normalized);
    const meta = TYPE_LABELS[normalized] || TYPE_LABELS[rawCode];
    const label = meta ? meta.label : (found ? found.name.split(' (')[0] : rawCode);
    const colorClass = meta ? meta.colorClass : 'bg-slate-100 text-slate-700 border-slate-200';

    return (
      <span className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${colorClass} whitespace-nowrap`}>
        {label}
      </span>
    );
  };

  const getStatusDisplay = (status: string) => {
    if (status === 'active') {
      return {
        dotClass: 'bg-emerald-500',
        badge: (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
            Đang áp dụng
          </span>
        ),
      };
    }
    if (status === 'draft') {
      return {
        dotClass: 'bg-slate-400',
        badge: (
          <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
            Bản nháp
          </span>
        ),
      };
    }
    return {
      dotClass: 'bg-rose-400',
      badge: (
        <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
          Ngừng áp dụng
        </span>
      ),
    };
  };

  const getRoleDisplayName = (role: string) => {
    const roleKey = (role || '').toUpperCase();
    if (roleKey.includes('HIRING') || roleKey === 'MANAGER') return 'Trưởng phòng';
    if (roleKey.includes('HR') || roleKey === 'HR_MANAGER') return 'HR Manager';
    if (roleKey.includes('EXECUTIVE') || roleKey === 'APPROVER') return 'Ban Giám Đốc';
    if (roleKey.includes('RECRUITER')) return 'Chuyên viên TD';
    if (roleKey.includes('ADMIN')) return 'Admin';
    if (roleKey.includes('INTERVIEWER')) return 'Người PV';
    return role;
  };

  const selectedDeptFilterLabel = useMemo(() => {
    if (selectedDeptFilter === 'all') return 'Tất cả phòng ban';
    if (selectedDeptFilter === 'company') return 'Toàn doanh nghiệp';
    const found = departments.find((d) => d.id === Number(selectedDeptFilter));
    return found ? found.name : 'Tất cả phòng ban';
  }, [selectedDeptFilter, departments]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-6 pt-1">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-sm animate-fadeIn ${
            toastMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs underline font-medium hover:opacity-80 cursor-pointer ml-4"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-normal pt-1">
          Cấu hình luồng phê duyệt động
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Thiết lập quy trình duyệt 2–3 cấp theo phòng ban, loại phê duyệt và ngưỡng áp dụng.
        </p>
      </div>

      {/* Nguyên tắc hoạt động Callout Card */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3.5 shadow-2xs">
        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xs font-bold text-slate-900">Nguyên tắc hoạt động</h2>
          <ul className="text-[11px] text-slate-600 space-y-1">
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
              <span>Áp dụng theo phòng ban hoặc toàn doanh nghiệp</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
              <span>Kích hoạt theo loại phê duyệt và ngưỡng lương/ngân sách</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
              <span>Không ảnh hưởng các tờ trình đang chạy</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
        <div className="flex flex-wrap lg:flex-nowrap items-end gap-3">
          {/* Search by Name / Department */}
          <div className="flex-1 min-w-[220px]">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Tìm kiếm</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo tên luồng duyệt..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              />
            </div>
          </div>

          {/* Phòng ban Combobox (Searchable) */}
          <div className="relative min-w-[180px]" ref={deptFilterRef}>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Phòng ban</label>
            <button
              type="button"
              onClick={() => setIsDeptFilterOpen(!isDeptFilterOpen)}
              className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium hover:bg-slate-100 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <span className="truncate">{selectedDeptFilterLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1.5" />
            </button>

            {isDeptFilterOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-2 text-xs animate-fadeIn">
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm nhanh phòng ban..."
                    value={deptFilterSearch}
                    onChange={(e) => setDeptFilterSearch(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:bg-white"
                    autoFocus
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-0.5 custom-sidebar-scroll">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDeptFilter('all');
                      setIsDeptFilterOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                      selectedDeptFilter === 'all' ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>Tất cả phòng ban</span>
                    {selectedDeptFilter === 'all' && <Check className="w-3 h-3 text-blue-600 shrink-0" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDeptFilter('company');
                      setIsDeptFilterOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                      selectedDeptFilter === 'company' ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>Toàn doanh nghiệp</span>
                    {selectedDeptFilter === 'company' && <Check className="w-3 h-3 text-blue-600 shrink-0" />}
                  </button>

                  {departments
                    .filter((d) => d.name.toLowerCase().includes(deptFilterSearch.toLowerCase()))
                    .map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setSelectedDeptFilter(String(d.id));
                          setIsDeptFilterOpen(false);
                          setCurrentPage(1);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                          selectedDeptFilter === String(d.id) ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="truncate">{d.name}</span>
                        {selectedDeptFilter === String(d.id) && <Check className="w-3 h-3 text-blue-600 shrink-0" />}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Loại phê duyệt Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Loại phê duyệt</label>
            <select
              value={selectedTypeFilter}
              onChange={(e) => {
                setSelectedTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium hover:bg-slate-100 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">Tất cả loại phê duyệt</option>
              {approvalTypes.map((t, idx) => (
                <option key={`${t.code}-${idx}`} value={t.code}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Trạng thái Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Trạng thái</label>
            <select
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium hover:bg-slate-100 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang áp dụng</option>
              <option value="draft">Bản nháp</option>
              <option value="inactive">Ngừng áp dụng</option>
            </select>
          </div>

          {/* Sắp xếp theo */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Sắp xếp theo</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium hover:bg-slate-100 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="updated_desc">Cập nhật mới nhất</option>
              <option value="updated_asc">Cũ nhất</option>
              <option value="name_asc">Tên A-Z</option>
              <option value="name_desc">Tên Z-A</option>
              <option value="threshold_asc">Hạn mức tăng dần</option>
              <option value="threshold_desc">Hạn mức giảm dần</option>
            </select>
          </div>

          {/* Nút Tạo luồng mới */}
          <div>
            <label className="block text-[11px] font-bold text-transparent mb-1">Tạo mới</label>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tạo luồng mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-5 w-[24%] min-w-[220px]">Tên luồng duyệt</th>
                <th className="py-3.5 px-4 w-[14%] min-w-[140px]">Loại phê duyệt</th>
                <th className="py-3.5 px-4 w-[15%] min-w-[150px]">Phòng ban áp dụng</th>
                <th className="py-3.5 px-4 w-[17%] min-w-[190px] whitespace-nowrap">Ngưỡng áp dụng (VND)</th>
                <th className="py-3.5 px-4 w-[18%] min-w-[220px]">Cấp duyệt</th>
                <th className="py-3.5 px-4 w-[12%] min-w-[130px] whitespace-nowrap">Cập nhật gần nhất</th>
                <th className="py-3.5 px-5 min-w-[140px] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedFlows.map((flow) => {
                const statusMeta = getStatusDisplay(flow.status);
                const isMenuOpen = activeMenuFlowId === flow.id;
                const formattedDate = flow.updated_at
                  ? new Date(flow.updated_at).toLocaleString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—';

                const stepDetails = flow.steps_detail && flow.steps_detail.length > 0 
                  ? flow.steps_detail 
                  : (flow.steps || []).map((s: any, idx: number) => ({
                      step_num: idx + 1,
                      role: typeof s === 'string' ? s : s.role,
                      description: `Cấp phê duyệt số ${idx + 1}`
                    }));

                return (
                  <tr key={flow.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Tên luồng duyệt & Status Dot & Version */}
                    <td className="py-4 px-5 align-top">
                      <div className="flex items-start gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${statusMeta.dotClass}`}></span>
                        <div>
                          <div className="font-bold text-slate-900 text-[13px] leading-snug">
                            {flow.name}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="font-mono bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap">
                              {flow.version || 'v1.0'}
                            </span>
                            {statusMeta.badge}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Loại phê duyệt */}
                    <td className="py-4 px-4 align-top">
                      {getApprovalTypeBadge(flow.approval_type)}
                    </td>

                    {/* Phòng ban áp dụng */}
                    <td className="py-4 px-4 align-top font-medium text-slate-700">
                      <span className="inline-block leading-snug">
                        {flow.department_name || 'Toàn doanh nghiệp'}
                      </span>
                    </td>

                    {/* Ngưỡng áp dụng (VND) - whitespace-nowrap */}
                    <td className="py-4 px-4 align-top whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-800 text-xs">
                        {flow.min_salary_threshold === 0 && flow.max_salary_threshold >= 1e11 ? (
                          'Tất cả các mức'
                        ) : flow.min_salary_threshold === 0 ? (
                          `Dưới ${formatVND(flow.max_salary_threshold)}`
                        ) : flow.max_salary_threshold >= 1e11 ? (
                          `Trên ${formatVND(flow.min_salary_threshold)}`
                        ) : (
                          `${formatVND(flow.min_salary_threshold)} – ${formatVND(flow.max_salary_threshold)}`
                        )}
                      </div>
                    </td>

                    {/* Cấp duyệt - Structured Pills with Arrow */}
                    <td className="py-4 px-4 align-top">
                      <div className="space-y-1.5">
                        <span className="inline-block font-bold text-slate-700 text-[11px] bg-slate-100 px-2 py-0.5 rounded-md whitespace-nowrap">
                          {flow.max_levels || stepDetails.length || 2} cấp duyệt
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          {stepDetails.map((st, idx) => (
                            <React.Fragment key={idx}>
                              <span
                                title={st.description || st.role}
                                className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/70 px-2 py-0.5 rounded text-[11px] whitespace-nowrap transition-colors"
                              >
                                <span className="w-3.5 h-3.5 rounded-full bg-slate-300 text-slate-700 text-[9px] font-bold flex items-center justify-center">
                                  {st.step_num || idx + 1}
                                </span>
                                <span>{getRoleDisplayName(st.role)}</span>
                              </span>
                              {idx < stepDetails.length - 1 && (
                                <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </td>

                    {/* Cập nhật gần nhất */}
                    <td className="py-4 px-4 align-top whitespace-nowrap">
                      <div className="text-slate-800 font-medium">{formattedDate}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[140px]">
                        {flow.updated_by_name || 'Quản Trị Viên'}
                      </div>
                    </td>

                    {/* Thao tác */}
                    <td className="py-4 px-5 align-top text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 relative">
                        {/* Nút Xem */}
                        <button
                          type="button"
                          onClick={() => handleOpenView(flow)}
                          className="h-8 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem</span>
                        </button>

                        {/* Nút Chỉnh sửa */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(flow)}
                          className="h-8 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1 border border-blue-200 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Chỉnh sửa</span>
                        </button>

                        {/* Menu ... */}
                        <button
                          type="button"
                          onClick={() => setActiveMenuFlowId(isMenuOpen ? null : flow.id)}
                          className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                          <div
                            ref={actionMenuRef}
                            className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-20 py-1.5 text-left text-xs overflow-hidden animate-fadeIn"
                          >
                            <button
                              type="button"
                              onClick={() => handleOpenView(flow)}
                              className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 font-medium text-slate-700 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>Xem chi tiết</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(flow)}
                              className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 font-medium text-slate-700 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                              <span>Chỉnh sửa luồng</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleStatus(flow)}
                              className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                            >
                              <span className={`w-2 h-2 rounded-full ${flow.status === 'active' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                              <span>{flow.status === 'active' ? 'Ngừng áp dụng' : 'Kích hoạt ngay'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDuplicate(flow)}
                              className="w-full px-3.5 py-2 text-left hover:bg-slate-50 flex items-center gap-2 font-medium text-slate-700 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5 text-slate-500" />
                              <span>Nhân bản luồng</span>
                            </button>

                            <div className="my-1 border-t border-slate-100" />

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuFlowId(null);
                                setFlowToDelete(flow);
                              }}
                              className="w-full px-3.5 py-2 text-left hover:bg-rose-50 flex items-center gap-2 font-medium text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Xóa luồng</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedFlows.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Layers className="w-8 h-8 text-slate-300 stroke-1" />
                      <p className="font-semibold text-slate-600 text-sm">Không tìm thấy luồng phê duyệt</p>
                      <p className="text-xs text-slate-400">Thử thay đổi từ khóa hoặc điều kiện bộ lọc của bạn.</p>
                      {(searchTerm || selectedDeptFilter !== 'all' || selectedTypeFilter !== 'all' || selectedStatusFilter !== 'all') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedDeptFilter('all');
                            setSelectedTypeFilter('all');
                            setSelectedStatusFilter('all');
                            setCurrentPage(1);
                          }}
                          className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Xóa bộ lọc
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Page Size Selector & Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-slate-100 bg-slate-50/50 text-xs">
          {/* Left: Records count & Page Size Dropdown */}
          <div className="flex flex-wrap items-center gap-4 text-slate-500 font-medium">
            <span>
              {totalItems > 0 ? (
                <>
                  Hiển thị{' '}
                  <strong className="text-slate-800">
                    {(currentPage - 1) * pageSize + 1}
                  </strong>{' '}
                  –{' '}
                  <strong className="text-slate-800">
                    {Math.min(currentPage * pageSize, totalItems)}
                  </strong>{' '}
                  của <strong className="text-slate-800">{totalItems}</strong> luồng phê duyệt
                </>
              ) : (
                '0 luồng phê duyệt'
              )}
            </span>

            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Số dòng mỗi trang:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-2xs"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Right: Page Navigation Buttons */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentPage === page
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Trang sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {flowToDelete && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => !isDeleting && setFlowToDelete(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  Xác nhận xóa luồng phê duyệt
                </h3>
                <p className="text-xs text-slate-500">
                  Bạn có chắc chắn muốn xóa luồng phê duyệt{' '}
                  <strong className="text-slate-900">&quot;{flowToDelete.name}&quot;</strong>?
                </p>
              </div>
            </div>

            {flowToDelete.status === 'active' ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Luồng này đang ở trạng thái <strong>&quot;Đang áp dụng&quot;</strong>. Để bảo toàn quy trình các tờ trình đang xử lý, bạn cần chuyển sang <strong>&quot;Ngừng áp dụng&quot;</strong> trước khi có thể xóa.
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Thao tác này sẽ gỡ bỏ luồng khỏi hệ thống. Lịch sử các phiên bản và nhật ký kiểm toán vẫn được lưu trữ bảo toàn.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setFlowToDelete(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy
              </button>

              {flowToDelete.status === 'active' ? (
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={async () => {
                    await handleToggleStatus(flowToDelete);
                    setFlowToDelete(null);
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-600/20 cursor-pointer disabled:opacity-50"
                >
                  Chuyển sang Ngừng áp dụng
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteFlow}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/20 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <span>Đang xóa...</span>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xác nhận xóa</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5-Step Create/Edit Modal */}
      <CreateApprovalFlowModal
        isOpen={isModalOpen}
        mode={modalMode}
        initialData={selectedFlow}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveModal}
        departments={departments}
        approvalTypes={approvalTypes}
        approvalRoles={approvalRoles}
      />
    </div>
  );
}
