'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { getSearchScore } from '@/utils/vietnameseSearch';
import { getLocalTodayDateString, isPastDate } from '@/utils/dateUtils';
import { SearchAutocompleteInput } from '@/components/ui/SearchAutocompleteInput';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  ChevronRight,
  Briefcase,
  AlertTriangle,
  Calendar,
  DollarSign,
  Check,
  X,
  MoreVertical,
  Sparkles,
  EyeOff,
  Eye,
  Share2,
  Copy,
  Edit3,
  AlertCircle,
  LayoutGrid,
  List,
  Building2,
  ChevronDown,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { apiRequest, ApiError } from '@/lib/api-client';
import { jobService, type JobPostingItem } from '@/services/job.service';
import { requisitionService, type RequisitionItem } from '@/services/requisition.service';
import { useApiData } from '@/hooks/useApiData';
import { ErrorState, LoadingState } from '@/components/ui/DataStates';
import clsx from 'clsx';

// ==========================================
// 1. DATA TYPES & ENUMS
// ==========================================

export type JobStatus = 'active' | 'expired' | 'draft';

export interface ApprovedRequisition {
  id: string;
  departmentId: number;
  code: string;
  title: string;
  department: string;
  location: string;
  salary: string;
  headcount: number;
  level: string;
  employmentType: string;
  hiringManager: string;
  approvedDate: string;
  description: string;
  requirements: string;
  benefits: string;
}

export interface JobPosting {
  id: string;
  requisitionCode?: string;
  title: string;
  department: string;
  location: string;
  salary: string;
  headcount: number;
  level: string;
  employmentType: string;
  applicantsCount: number;
  status: JobStatus;
  postedDate: string;
  expiryDate: string; // YYYY-MM-DD
  daysLeft: number;
  isExpiringSoon: boolean; // true nếu còn <= 5 ngày hoặc đã hết hạn
  autoUnpublish: boolean;
  description: string;
  requirements: string;
  benefits: string;
  raw: JobPostingItem & { is_expired?: boolean };
}

// ==========================================
// 2. REAL DATA MAPPING (job postings + approved requisitions)
// ==========================================

const DAY_MS = 86_400_000;
const money = (n?: number | null) => (n ? `${Math.round(n / 1_000_000)}` : '');

function salaryText(r: RequisitionItem) {
  if (r.is_salary_negotiable) return 'Thỏa thuận';
  const lo = money(r.min_salary), hi = money(r.max_salary);
  return lo || hi ? `${lo || '?'} - ${hi || '?'} Triệu VNĐ` : 'Thỏa thuận';
}

function toRequisition(r: RequisitionItem): ApprovedRequisition {
  return {
    id: String(r.id),
    departmentId: r.department_id,
    code: r.code || `REQ-${r.id}`,
    title: r.title,
    department: r.department_name || '',
    location: r.work_location || '',
    salary: salaryText(r),
    headcount: r.quantity || 1,
    level: r.job_title_name || '',
    employmentType: r.employment_type || '',
    hiringManager: r.creator_name || '',
    approvedDate: '',
    description: r.job_description || '',
    requirements: r.requirements || '',
    benefits: r.benefits || '',
  };
}

function toJob(j: JobPostingItem & { is_expired?: boolean; openings?: number | null }, reqCodes: Map<number, string>, now: number): JobPosting {
  const daysLeft = j.deadline ? Math.ceil((new Date(j.deadline.slice(0, 10)).getTime() - now) / DAY_MS) : 999;
  const status: JobStatus =
    j.status === 'draft' || j.status === 'pending_review' ? 'draft'
      : j.status === 'closed' || j.is_expired ? 'expired' : 'active';
  return {
    id: String(j.id),
    requisitionCode: j.requisition_id ? reqCodes.get(j.requisition_id) || `REQ-${j.requisition_id}` : undefined,
    title: j.title,
    department: j.department_name || j.department || '',
    location: j.location,
    salary: j.salary_range || 'Thỏa thuận',
    headcount: j.openings || 1,
    level: j.level,
    employmentType: j.type,
    applicantsCount: j.applications_count || 0,
    status,
    postedDate: (j.published_at || j.created_at || '').slice(0, 10),
    expiryDate: j.deadline ? j.deadline.slice(0, 10) : '',
    daysLeft: Math.max(0, daysLeft),
    isExpiringSoon: status !== 'draft' && daysLeft <= 5,
    autoUnpublish: true, // expired postings are always hidden from the public portal (S4-01 AC4)
    description: j.description,
    requirements: j.requirements || '',
    benefits: j.benefits || '',
    raw: j,
  };
}

/** PUT /jobs/{id} needs the whole posting; build it from the server copy with the given overrides. */
function jobPayload(j: JobPostingItem, overrides: Partial<Record<'deadline' | 'status', string>>) {
  return {
    title: j.title, requisition_id: j.requisition_id, department_id: j.department_id, department_name: j.department_name || j.department,
    location: j.location, type: j.type, level: j.level, salary_range: j.salary_range, experience_level: j.experience_level,
    deadline: j.deadline, description: j.description, requirements: j.requirements, benefits: j.benefits, status: j.status,
    ...overrides,
  };
}

const isoDaysFromToday = (days: number) => new Date(Date.now() + days * DAY_MS).toISOString().slice(0, 10);
const errorText = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback);

// ==========================================
// 3. MAIN COMPONENT
// ==========================================

export default function RecruiterJobsPage() {
  const { data: reqRows } = useApiData(() => requisitionService.getRequisitions(), []);
  const APPROVED_REQUISITIONS = useMemo(
    () => (reqRows || []).filter((r) => r.status === 'approved').map(toRequisition),
    [reqRows],
  );
  const reqCodes = useMemo(() => new Map((reqRows || []).map((r) => [r.id, r.code])), [reqRows]);
  const { data: jobRows, error, loading, reload, setData: setJobRows } = useApiData(() => jobService.getAdminJobs(), []);
  // reference time for 'days left', taken when the list was loaded (render must stay pure)
  const [loadedAt] = useState(() => Date.now());
  const jobs = useMemo(() => (jobRows || []).map((j) => toJob(j, reqCodes, loadedAt)), [jobRows, reqCodes, loadedAt]);
  const putJobRow = (row: JobPostingItem) =>
    setJobRows((prev) => (prev || []).some((x) => x.id === row.id) ? (prev || []).map((x) => (x.id === row.id ? row : x)) : [row, ...(prev || [])]);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | JobStatus | 'expiring'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Modal 1: Form Tạo tin tuyển dụng
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState<string>('');
  const [createForm, setCreateForm] = useState({
    title: '',
    department: '',
    location: '',
    salary: '',
    headcount: 1,
    level: 'Senior',
    employmentType: 'Toàn thời gian',
    expiryDate: '',
    autoUnpublish: true,
    description: '',
    requirements: '',
    benefits: '',
    status: 'active' as JobStatus,
    requisitionCode: '',
  });
  const [prefillNotice, setPrefillNotice] = useState<string | null>(null);

  // Modal 2: Cài đặt tự động hết hạn (Set Expiry Date)
  const [isExpiryModalOpen, setIsExpiryModalOpen] = useState(false);
  const [jobToSetExpiry, setJobToSetExpiry] = useState<JobPosting | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [newAutoUnpublish, setNewAutoUnpublish] = useState(true);

  // Modal 3: Xác nhận Gỡ tin ngay (Unpublish Confirmation)
  const [isUnpublishModalOpen, setIsUnpublishModalOpen] = useState(false);
  const [jobToUnpublish, setJobToUnpublish] = useState<JobPosting | null>(null);

  // Dropdown 3 chấm (Actions Menu) state
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Toast feedback helper
  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ==========================================
  // HANDLERS
  // ==========================================

  // 1. Khi chọn Yêu cầu tuyển dụng đã duyệt -> Tự động pre-fill Form!
  const handleSelectRequisition = (reqId: string) => {
    setSelectedReqId(reqId);
    if (!reqId) {
      setPrefillNotice(null);
      return;
    }

    const req = APPROVED_REQUISITIONS.find((r) => r.id === reqId);
    if (req) {
      setCreateForm({
        title: req.title,
        department: req.department,
        location: req.location,
        salary: req.salary,
        headcount: req.headcount,
        level: req.level,
        employmentType: req.employmentType,
        expiryDate: createForm.expiryDate,
        autoUnpublish: true,
        description: req.description,
        requirements: req.requirements,
        benefits: req.benefits,
        status: 'active',
        requisitionCode: req.code,
      });

      setPrefillNotice(
        `✅ Đã tự động điền thông tin từ Yêu cầu tuyển dụng đã duyệt ${req.code}${req.hiringManager ? ` (${req.hiringManager})` : ''}.`
      );
    }
  };

  // 2. Submit form tạo tin tuyển dụng mới
  const handleCreateJob = async (e: React.FormEvent, asStatus: JobStatus = createForm.status) => {
    e.preventDefault();
    const req = APPROVED_REQUISITIONS.find((r) => r.id === selectedReqId);
    if (!req) {
      showToast('Tin tuyển dụng phải được tạo từ một yêu cầu tuyển dụng đã duyệt.', 'info');
      return;
    }
    if (!createForm.title.trim() || !createForm.description.trim()) {
      showToast('Vui lòng nhập tiêu đề và mô tả công việc.', 'info');
      return;
    }
    if (createForm.expiryDate && isPastDate(createForm.expiryDate)) {
      showToast('Hạn nộp hồ sơ không được ở trong quá khứ.', 'info');
      return;
    }
    setSaving(true);
    try {
      const created = await jobService.createJob({
        title: createForm.title.trim(),
        requisition_id: Number(req.id),
        department_id: req.departmentId,
        department_name: createForm.department || req.department,
        location: createForm.location || 'Hà Nội',
        type: createForm.employmentType || 'Full-time',
        level: createForm.level || 'Mid-Level',
        salary_range: createForm.salary || 'Thỏa thuận',
        deadline: createForm.expiryDate || undefined,
        description: createForm.description,
        requirements: createForm.requirements,
        benefits: createForm.benefits,
        status: asStatus === 'draft' ? 'draft' : 'published',
      });
      putJobRow(created);
      setIsCreateModalOpen(false);
      showToast(
        created.status === 'published'
          ? `Đã đăng tin tuyển dụng "${created.title}".`
          : created.status === 'pending_review'
            ? `Đã gửi tin "${created.title}" cho Trưởng phòng Nhân sự duyệt trước khi đăng.`
            : `Đã lưu bản nháp "${created.title}".`,
      );
      setSelectedReqId('');
      setPrefillNotice(null);
    } catch (err) {
      showToast(errorText(err, 'Không tạo được tin tuyển dụng.'), 'info');
    } finally {
      setSaving(false);
    }
  };

  // 3. Mở Modal Cài đặt tự động hết hạn
  const handleOpenSetExpiry = (job: JobPosting) => {
    setJobToSetExpiry(job);
    setNewExpiryDate(job.expiryDate);
    setNewAutoUnpublish(job.autoUnpublish);
    setOpenActionMenuId(null);
    setIsExpiryModalOpen(true);
  };

  // 4. Lưu cài đặt tự động hết hạn
  const handleSaveExpiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobToSetExpiry || !newExpiryDate) return;
    if (isPastDate(newExpiryDate)) {
      showToast('Hạn nộp hồ sơ mới không được ở trong quá khứ.', 'info');
      return;
    }
    setSaving(true);
    try {
      const updated = await apiRequest<JobPostingItem>(`/jobs/${jobToSetExpiry.raw.id}`, {
        method: 'PUT', body: JSON.stringify(jobPayload(jobToSetExpiry.raw, { deadline: newExpiryDate })),
      });
      putJobRow(updated);
      setIsExpiryModalOpen(false);
      showToast(
        updated.status === 'pending_review'
          ? `Đã cập nhật hạn nộp đến ${newExpiryDate}; tin cần Trưởng phòng Nhân sự duyệt lại.`
          : `Đã cập nhật ngày hết hạn cho tin #${jobToSetExpiry.id} đến ngày ${newExpiryDate}.`,
      );
    } catch (err) {
      showToast(errorText(err, 'Không cập nhật được ngày hết hạn.'), 'info');
    } finally {
      setSaving(false);
    }
  };

  // 5. Mở Modal xác nhận Gỡ tin ngay (Unpublish)
  const handleOpenUnpublish = (job: JobPosting) => {
    setJobToUnpublish(job);
    setOpenActionMenuId(null);
    setIsUnpublishModalOpen(true);
  };

  // 6. Xác nhận Gỡ tin ngay
  const handleConfirmUnpublish = async () => {
    if (!jobToUnpublish) return;
    setSaving(true);
    try {
      putJobRow(await jobService.closeJob(jobToUnpublish.raw.id));
      setIsUnpublishModalOpen(false);
      showToast(`Đã gỡ tin tuyển dụng #${jobToUnpublish.id} khỏi cổng việc làm công khai.`);
    } catch (err) {
      showToast(errorText(err, 'Không gỡ được tin.'), 'info');
    } finally {
      setSaving(false);
    }
  };

  // 7. Đăng lại tin tuyển dụng đã hết hạn
  // Re-open an expired posting = move its deadline 30 days ahead (a closed posting cannot be reopened)
  const handleRepublish = async (job: JobPosting) => {
    setOpenActionMenuId(null);
    if (job.raw.status === 'closed') {
      showToast('Tin đã đóng không thể đăng lại — hãy tạo tin mới từ yêu cầu tuyển dụng.', 'info');
      return;
    }
    const next = isoDaysFromToday(30);
    try {
      const updated = await apiRequest<JobPostingItem>(`/jobs/${job.raw.id}`, {
        method: 'PUT', body: JSON.stringify(jobPayload(job.raw, { deadline: next })),
      });
      putJobRow(updated);
      showToast(`Đã gia hạn tin tuyển dụng #${job.id} đến ${next}.`);
    } catch (err) {
      showToast(errorText(err, 'Không đăng lại được tin.'), 'info');
    }
  };

  // ==========================================
  // FILTERED JOBS & KPI STATS
  // ==========================================

  const filteredJobs = useMemo(() => {
    const q = searchTerm.trim();
    return jobs.filter((job) => {
      // 1. Search term (accent & case-insensitive)
      if (q) {
        const score = Math.max(
          getSearchScore(job.title, q),
          getSearchScore(job.id, q),
          getSearchScore(job.department, q)
        );
        if (score === 0) return false;
      }

      // 2. Status filter
      if (statusFilter === 'all') return true;
      if (statusFilter === 'expiring') return job.isExpiringSoon && job.status === 'active';
      return job.status === statusFilter;
    }).sort((a, b) => {
      if (q) {
        const scoreA = Math.max(
          getSearchScore(a.title, q),
          getSearchScore(a.id, q),
          getSearchScore(a.department, q)
        );
        const scoreB = Math.max(
          getSearchScore(b.title, q),
          getSearchScore(b.id, q),
          getSearchScore(b.department, q)
        );
        if (scoreA !== scoreB) return scoreB - scoreA;
      }
      return 0;
    });
  }, [jobs, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = jobs.length;
    const active = jobs.filter((j) => j.status === 'active').length;
    const expired = jobs.filter((j) => j.status === 'expired').length;
    const draft = jobs.filter((j) => j.status === 'draft').length;
    const expiringSoon = jobs.filter((j) => j.status === 'active' && j.isExpiringSoon).length;
    const totalApplicants = jobs.reduce((acc, cur) => acc + cur.applicantsCount, 0);

    return { total, active, expired, draft, expiringSoon, totalApplicants };
  }, [jobs]);

  // Format date display: YYYY-MM-DD -> DD/MM/YYYY
  const formatDateDisplay = (isoStr: string) => {
    if (!isoStr) return '--';
    const parts = isoStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return isoStr;
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-6 antialiased font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={clsx(
            'fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200',
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-blue-50 text-blue-800 border-blue-200'
          )}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. TOP HEADER & PRIMARY ACTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
            <Link href="/recruiter" className="hover:text-blue-600 transition-colors">
              Recruiter Workspace
            </Link>
            <span>&rsaquo;</span>
            <span className="text-slate-700 font-bold">Quản lý tin tuyển dụng</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-8 h-8 text-blue-600" />
            <span>Quản Lý Tin Tuyển Dụng</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Soạn thảo tin từ Yêu cầu đã duyệt, kiểm soát hạn nộp hồ sơ và thiết lập tự động hết hạn tin đăng.
          </p>
        </div>

        {/* Nút Tạo tin tuyển dụng (User Story 1) */}
        <button
          type="button"
          onClick={() => {
            setSelectedReqId('');
            setPrefillNotice(null);
            setIsCreateModalOpen(true);
          }}
          className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 flex items-center gap-2.5 transition-all transform active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Tạo Tin Tuyển Dụng Mới</span>
        </button>
      </div>

      {/* 2. KPI METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng số tin */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Tổng số tin</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-400 font-semibold">vị trí</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Thu hút tổng cộng <strong className="text-slate-700">{stats.totalApplicants} hồ sơ</strong>
          </p>
        </div>

        {/* Card 2: Đang đăng (Active) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-600 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Đang đăng tuyển
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700">{stats.active}</span>
            <span className="text-xs text-emerald-600 font-semibold">tin mở</span>
          </div>
          <p className="text-[11px] text-emerald-600/90 font-medium">Hiển thị công khai trên cổng Job</p>
        </div>

        {/* Card 3: Sắp hết hạn (Expiring Soon - Cảnh báo đỏ) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-rose-600 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Sắp hết hạn
            </span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-600">
              {stats.expiringSoon}
            </span>
            <span className="text-xs text-rose-500 font-semibold">tin &le; 5 ngày</span>
          </div>
          <p className="text-[11px] text-rose-500 font-medium">Cần gia hạn hoặc đóng ứng tuyển</p>
        </div>

        {/* Card 4: Bản nháp & Hết hạn */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Bản nháp / Hết hạn</span>
            <Briefcase className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-700">
              {stats.draft + stats.expired}
            </span>
            <span className="text-xs text-slate-400 font-semibold">tin lưu</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            {stats.draft} bản nháp &bull; {stats.expired} đã đóng
          </p>
        </div>
      </div>

      {/* 3. FILTER BAR & VIEW TOGGLE */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Left: Search box với Autocomplete Suggestions */}
        <div className="relative flex-1 max-w-md">
          <SearchAutocompleteInput
            value={searchTerm}
            onChange={(val) => setSearchTerm(val)}
            onSelectSuggestion={(item) => setSearchTerm(item.title)}
            placeholder="Tìm theo tiêu đề tin, mã JOB hoặc phòng ban..."
            scope="jobs"
            size="sm"
            localSuggestions={jobs.map((j) => ({
              id: j.id,
              title: j.title,
              subtitle: `${j.department} • Mã: ${j.id} • ${j.status}`,
              category: "job",
              category_label: "Việc làm",
            }))}
          />
        </div>

        {/* Right: Status Filters & View Mode */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={clsx(
                'px-3 py-1.5 rounded-xl transition-all cursor-pointer',
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              )}
            >
              Tất cả ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={clsx(
                'px-3 py-1.5 rounded-xl transition-all cursor-pointer',
                statusFilter === 'active'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'hover:text-slate-900'
              )}
            >
              Đang đăng ({stats.active})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('expiring')}
              className={clsx(
                'px-3 py-1.5 rounded-xl transition-all cursor-pointer',
                statusFilter === 'expiring'
                  ? 'bg-white text-rose-600 shadow-xs'
                  : 'hover:text-slate-900'
              )}
            >
              Sắp hết hạn ({stats.expiringSoon})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('expired')}
              className={clsx(
                'px-3 py-1.5 rounded-xl transition-all cursor-pointer',
                statusFilter === 'expired'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'hover:text-slate-900'
              )}
            >
              Hết hạn ({stats.expired})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('draft')}
              className={clsx(
                'px-3 py-1.5 rounded-xl transition-all cursor-pointer',
                statusFilter === 'draft' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              )}
            >
              Bản nháp ({stats.draft})
            </button>
          </div>

          {/* Table / Grid View switch */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl text-slate-500">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={clsx(
                'p-1.5 rounded-xl transition-colors cursor-pointer',
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'
              )}
              title="Xem dạng Bảng (Table)"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={clsx(
                'p-1.5 rounded-xl transition-colors cursor-pointer',
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'
              )}
              title="Xem dạng Thẻ (Grid Cards)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. MAIN JOB LISTINGS (TABLE OR GRID) */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="font-extrabold text-base text-slate-800">Không tìm thấy tin tuyển dụng nào</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Không có kết quả phù hợp với bộ lọc hiện tại. Vui lòng thử tìm kiếm với từ khóa khác hoặc tạo tin mới.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Tin Tuyển Dụng</th>
                  <th className="py-4 px-4">Phòng Ban & Đãi Ngộ</th>
                  <th className="py-4 px-4 text-center">Trạng Thái</th>
                  <th className="py-4 px-4">Ngày Hết Hạn</th>
                  <th className="py-4 px-4 text-center">Hồ Sơ Nộp</th>
                  <th className="py-4 px-6 text-right">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredJobs.map((job) => {
                  return (
                    <tr
                      key={job.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Cột 1: Thông tin tin đăng */}
                      <td className="py-4 px-6 max-w-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                              {job.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span className="font-mono font-semibold text-slate-500">{job.id}</span>
                            {job.requisitionCode && (
                              <>
                                <span>&bull;</span>
                                <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold">
                                  {job.requisitionCode}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Phòng ban & Đãi ngộ */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{job.department}</span>
                          </div>
                          <div className="text-[11px] font-bold text-blue-600 flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>{job.salary}</span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 3: Badge Trạng thái chuẩn (Đang đăng - Xanh, Hết hạn - Đỏ, Bản nháp - Xám) */}
                      <td className="py-4 px-4 text-center">
                        {job.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Đang đăng
                          </span>
                        ) : job.status === 'expired' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-extrabold shadow-xs">
                            <AlertCircle className="w-3 h-3 text-rose-500" />
                            Hết hạn
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-extrabold">
                            Bản nháp
                          </span>
                        )}
                      </td>

                      {/* Cột 4: Ngày hết hạn (Hiển thị MÀU ĐỎ nếu sắp hết hạn <= 5 ngày hoặc đã quá hạn) */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div
                            className={clsx(
                              'font-extrabold flex items-center gap-1.5',
                              job.isExpiringSoon || job.status === 'expired'
                                ? 'text-rose-600'
                                : 'text-slate-700'
                            )}
                          >
                            <Calendar
                              className={clsx(
                                'w-3.5 h-3.5',
                                job.isExpiringSoon || job.status === 'expired'
                                  ? 'text-rose-600'
                                  : 'text-slate-400'
                              )}
                            />
                            <span>{formatDateDisplay(job.expiryDate)}</span>
                          </div>

                          {/* Dòng cảnh báo thời gian */}
                          {job.status === 'active' && job.isExpiringSoon && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-black border border-rose-200">
                              <AlertTriangle className="w-3 h-3" />
                              Sắp hết hạn: còn {job.daysLeft} ngày
                            </span>
                          )}

                          {job.status === 'active' && !job.isExpiringSoon && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              Còn {job.daysLeft} ngày
                            </span>
                          )}

                          {job.status === 'expired' && (
                            <span className="text-[10px] text-rose-500 font-bold">
                              Đã đóng tuyển dụng
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cột 5: Số hồ sơ nộp */}
                      <td className="py-4 px-4 text-center">
                        <div className="space-y-0.5">
                          <span className="font-black text-sm text-slate-900">
                            {job.applicantsCount} CV
                          </span>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            Chỉ tiêu: {job.headcount}
                          </span>
                        </div>
                      </td>

                      {/* Cột 6: Menu hành động (3 chấm) */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2 relative">
                          <Link
                            href="/recruiter/pipeline"
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] inline-flex items-center gap-1 transition-colors"
                          >
                            <span>Pipeline</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>

                          {/* Nút 3 chấm mở Dropdown menu */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenActionMenuId(
                                  openActionMenuId === job.id ? null : job.id
                                )
                              }
                              className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition-colors"
                              title="Tùy chọn thao tác"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu của từng dòng */}
                            {openActionMenuId === job.id && (
                              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-30 animate-in fade-in zoom-in-95 duration-100 text-left">
                                <div className="px-3 py-1 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                  Hành động tin #{job.id}
                                </div>

                                {/* Tính năng 1: Gỡ tin ngay (Unpublish) */}
                                {job.status === 'active' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenUnpublish(job)}
                                    className="w-full px-3.5 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition-colors"
                                  >
                                    <EyeOff className="w-4 h-4" />
                                    <span>Gỡ tin ngay (Unpublish)</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleRepublish(job)}
                                    className="w-full px-3.5 py-2.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer transition-colors"
                                  >
                                    <Eye className="w-4 h-4" />
                                    <span>Đăng lại tin này</span>
                                  </button>
                                )}

                                {/* Tính năng 2: Cài đặt tự động hết hạn (Set Expiry Date) */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenSetExpiry(job)}
                                  className="w-full px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <Clock className="w-4 h-4 text-blue-600" />
                                  <span>Cài đặt tự động hết hạn</span>
                                </button>

                                <div className="border-t border-slate-100 my-1" />

                                <Link
                                  href="/recruiter/pipeline"
                                  className="w-full px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                  onClick={() => setOpenActionMenuId(null)}
                                >
                                  <Users className="w-4 h-4 text-slate-400" />
                                  <span>Xem hồ sơ ứng viên</span>
                                </Link>

                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      `${window.location.origin}/candidate/jobs/${job.raw.slug || job.id}`
                                    );
                                    showToast('Đã sao chép liên kết tuyển dụng vào bộ nhớ tạm!');
                                    setOpenActionMenuId(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <Share2 className="w-4 h-4 text-slate-400" />
                                  <span>Sao chép link công khai</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group relative"
            >
              <div className="space-y-3">
                {/* Header Card: ID, Badges & 3-dot menu */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[11px] text-slate-400">
                      {job.id}
                    </span>
                    {job.requisitionCode && (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold">
                        {job.requisitionCode}
                      </span>
                    )}
                  </div>

                  {/* Status Badge */}
                  {job.status === 'active' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Đang đăng
                    </span>
                  ) : job.status === 'expired' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-extrabold">
                      <AlertCircle className="w-3 h-3 text-rose-500" />
                      Hết hạn
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-extrabold">
                      Bản nháp
                    </span>
                  )}
                </div>

                {/* Job Title */}
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {job.title}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{job.department}</span>
                  </p>
                </div>

                {/* Details snippet */}
                <div className="p-3.5 rounded-2xl bg-slate-50 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-400">Đãi ngộ:</span>
                    <span className="text-blue-600 font-extrabold">{job.salary}</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-400">Địa điểm:</span>
                    <span className="text-slate-700 truncate max-w-[170px]">{job.location}</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-400">Hạn nộp:</span>
                    <span
                      className={clsx(
                        'font-black flex items-center gap-1',
                        job.isExpiringSoon || job.status === 'expired'
                          ? 'text-rose-600'
                          : 'text-slate-700'
                      )}
                    >
                      <Calendar className="w-3 h-3" />
                      {formatDateDisplay(job.expiryDate)}
                    </span>
                  </div>
                </div>

                {/* Expiring Soon alert badge for Card view */}
                {job.status === 'active' && job.isExpiringSoon && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Sắp hết hạn: Chỉ còn {job.daysLeft} ngày nữa!</span>
                  </div>
                )}
              </div>

              {/* Card Footer: Applicants count & Action buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-black text-slate-900">
                    {job.applicantsCount} hồ sơ
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Chỉ tiêu: {job.headcount}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenSetExpiry(job)}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                    title="Cài đặt tự động hết hạn"
                  >
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                  </button>

                  {job.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => handleOpenUnpublish(job)}
                      className="p-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold transition-colors cursor-pointer"
                      title="Gỡ tin ngay"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <Link
                    href="/recruiter/pipeline"
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1 transition-colors"
                  >
                    <span>Pipeline</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: TẠO TIN TUYỂN DỤNG MỚI (User Story 1 & Form)      */}
      {/* ======================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Soạn Thảo Tin Tuyển Dụng Mới
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Chọn yêu cầu đã duyệt để tự động điền sẵn thông tin hoặc tự soạn thảo.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreateJob} className="p-6 sm:p-7 space-y-6 text-xs flex-1">
              {/* PHẦN TRỌNG TÂM: Chọn Yêu Cầu Tuyển Dụng Đã Duyệt (Pre-fill) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 border-2 border-blue-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 animate-spin" />
                    <label className="font-extrabold text-sm text-slate-900">
                      Chọn Yêu cầu tuyển dụng đã duyệt (Tự động điền dữ liệu)
                    </label>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider">
                    Tính năng thông minh
                  </span>
                </div>

                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Hệ thống sẽ tự động điền Tiêu đề, Phòng ban, Mức lương, JD, Yêu cầu và Quyền lợi từ Yêu cầu đã được Ban Giám Đốc và HR duyệt.
                </p>

                {/* Dropdown Requisitions */}
                <div className="relative">
                  <select
                    value={selectedReqId}
                    onChange={(e) => handleSelectRequisition(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-blue-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer shadow-xs appearance-none pr-10"
                  >
                    <option value="">-- Bấm để chọn Yêu cầu tuyển dụng đã duyệt --</option>
                    {APPROVED_REQUISITIONS.map((req) => (
                      <option key={req.id} value={req.id}>
                        [{req.code}] {req.title} - {req.department} ({req.salary})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-blue-600 absolute right-3.5 top-3 pointer-events-none" />
                </div>

                {/* Notice thông báo đã pre-fill */}
                {prefillNotice && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{prefillNotice}</span>
                  </div>
                )}
              </div>

              {/* Thông tin cốt lõi của Tin Tuyển Dụng */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">
                  Thông Tin Chung Tin Tuyển Dụng
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tiêu đề tin */}
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-800 mb-1">
                      Tiêu đề tin tuyển dụng <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={createForm.title}
                      onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                      placeholder="Ví dụ: Senior Backend Engineer (Go/Python)"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>

                  {/* Phòng ban */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Phòng ban</label>
                    <input
                      type="text"
                      value={createForm.department}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, department: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  {/* Mức lương đãi ngộ */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Mức lương đãi ngộ (Công khai)
                    </label>
                    <input
                      type="text"
                      value={createForm.salary}
                      onChange={(e) => setCreateForm({ ...createForm, salary: e.target.value })}
                      placeholder="Ví dụ: 35 - 55 Triệu VNĐ hoặc Thỏa thuận"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  {/* Địa điểm làm việc */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Địa điểm làm việc</label>
                    <input
                      type="text"
                      value={createForm.location}
                      onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  {/* Chỉ tiêu số lượng */}
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Số lượng cần tuyển</label>
                    <input
                      type="number"
                      min="1"
                      value={createForm.headcount}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, headcount: Number(e.target.value) })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Cài đặt thời hạn & Tự động hết hạn (User Story 2) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Thời Hạn & Cài Đặt Tự Động Hết Hạn</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ngày hết hạn tin</label>
                    <input
                      type="date"
                      min={getLocalTodayDateString()}
                      value={createForm.expiryDate}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, expiryDate: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                    {createForm.expiryDate && isPastDate(createForm.expiryDate) && (
                      <p className="text-[10px] text-rose-500 mt-1 font-medium">⚠️ Ngày hết hạn không được ở quá khứ</p>
                    )}
                  </div>

                  <div className="pt-2 sm:pt-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createForm.autoUnpublish}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, autoUnpublish: e.target.checked })
                        }
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <span className="font-bold text-slate-800 text-xs">
                        Tự động gỡ tin (Unpublish) khi đến ngày hết hạn
                      </span>
                    </label>
                    <p className="text-[10px] text-slate-400 mt-0.5 ml-6">
                      Hệ thống sẽ tự động chuyển tin về trạng thái Hết hạn để tránh ứng viên nộp trễ.
                    </p>
                  </div>
                </div>
              </div>

              {/* Nội dung JD, Yêu cầu & Quyền lợi */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">
                  Nội Dung Chi Tiết (JD)
                </h3>

                {/* Mô tả công việc */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Mô tả công việc (JD)</label>
                  <textarea
                    rows={4}
                    value={createForm.description}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, description: e.target.value })
                    }
                    placeholder="Mô tả trách nhiệm công việc..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white leading-relaxed"
                  />
                </div>

                {/* Yêu cầu ứng viên */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Yêu cầu ứng viên</label>
                  <textarea
                    rows={4}
                    value={createForm.requirements}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, requirements: e.target.value })
                    }
                    placeholder="Kinh nghiệm, kỹ năng cần thiết..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white leading-relaxed"
                  />
                </div>

                {/* Quyền lợi */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Chế độ đãi ngộ & Quyền lợi</label>
                  <textarea
                    rows={3}
                    value={createForm.benefits}
                    onChange={(e) => setCreateForm({ ...createForm, benefits: e.target.value })}
                    placeholder="Chế độ bảo hiểm, thưởng, phúc lợi..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white leading-relaxed"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3 sticky bottom-0 bg-white py-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={(e) => handleCreateJob(e, 'draft')}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold transition-colors cursor-pointer"
                >
                  Lưu bản nháp
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Xuất Bản & Đăng Tin Ngay</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: CÀI ĐẶT TỰ ĐỘNG HẾT HẠN (Set Expiry Date Modal)   */}
      {/* ======================================================== */}
      {isExpiryModalOpen && jobToSetExpiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-5 animate-in zoom-in-95 duration-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Cài Đặt Tự Động Hết Hạn</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Mã tin: {jobToSetExpiry.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExpiryModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Job Info */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="font-extrabold text-slate-900 text-xs">{jobToSetExpiry.title}</div>
              <div className="text-[11px] text-slate-500">
                Ngày hết hạn hiện tại:{' '}
                <strong className="text-slate-800">{formatDateDisplay(jobToSetExpiry.expiryDate)}</strong>
              </div>
            </div>

            <form onSubmit={handleSaveExpiry} className="space-y-4">
              {/* Preset buttons */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Gia hạn nhanh:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date('2026-10-11');
                      d.setDate(d.getDate() + 7);
                      setNewExpiryDate(d.toISOString().split('T')[0]);
                    }}
                    className="py-1.5 px-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-xl font-bold text-[11px] transition-colors cursor-pointer text-center"
                  >
                    + 7 Ngày
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date('2026-10-11');
                      d.setDate(d.getDate() + 15);
                      setNewExpiryDate(d.toISOString().split('T')[0]);
                    }}
                    className="py-1.5 px-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-xl font-bold text-[11px] transition-colors cursor-pointer text-center"
                  >
                    + 15 Ngày
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date('2026-10-11');
                      d.setDate(d.getDate() + 30);
                      setNewExpiryDate(d.toISOString().split('T')[0]);
                    }}
                    className="py-1.5 px-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-xl font-bold text-[11px] transition-colors cursor-pointer text-center"
                  >
                    + 30 Ngày
                  </button>
                </div>
              </div>

              {/* Custom Date Input */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Chọn ngày hết hạn mới:</label>
                <input
                  type="date"
                  required
                  min={getLocalTodayDateString()}
                  value={newExpiryDate}
                  onChange={(e) => setNewExpiryDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                />
                {newExpiryDate && isPastDate(newExpiryDate) && (
                  <p className="text-[10px] text-rose-500 mt-1 font-medium">⚠️ Ngày hết hạn mới không được ở quá khứ</p>
                )}
              </div>

              {/* Auto Unpublish checkbox */}
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newAutoUnpublish}
                    onChange={(e) => setNewAutoUnpublish(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                  <span className="font-extrabold text-blue-900 text-xs">
                    Tự động gỡ tin ngay khi chạm mốc thời gian
                  </span>
                </label>
                <p className="text-[10px] text-blue-700 ml-6">
                  Tin sẽ tự động chuyển sang trạng thái &quot;Hết hạn&quot; và ẩn khỏi website công khai.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsExpiryModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  Lưu Cài Đặt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: XÁC NHẬN GỠ TIN NGAY (Unpublish Confirmation)    */}
      {/* ======================================================== */}
      {isUnpublishModalOpen && jobToUnpublish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-4 animate-in zoom-in-95 duration-200 text-xs">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
              <EyeOff className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-black text-base text-slate-900">Gỡ Tin Tuyển Dụng Ngay?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bạn có chắc chắn muốn gỡ tin <strong>{jobToUnpublish.title}</strong> (
                {jobToUnpublish.id}) khỏi cổng việc làm công khai không?
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100 text-rose-800 text-[11px] leading-relaxed">
              ⚠️ Ứng viên sẽ không thể tìm thấy hoặc nộp thêm CV vào vị trí này nữa. Các hồ sơ đã nộp vẫn sẽ được bảo lưu trong Pipeline.
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsUnpublishModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmUnpublish}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-md shadow-rose-500/20 transition-all cursor-pointer"
              >
                Gỡ Tin Ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
