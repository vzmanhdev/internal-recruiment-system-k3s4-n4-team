'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Kanban,
  Search,
  Filter,
  Plus,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  GraduationCap,
  Briefcase,
  ChevronRight,
  ChevronLeft,
  X,
  User,
  Star,
  ExternalLink,
  Tag,
  MessageSquare,
  FileText,
  Upload,
  Linkedin,
  Phone,
  Mail,
  Send,
  MoreVertical,
  Check,
  AlertCircle,
  ArrowRight,
  Award,
  Layers,
  FileCheck,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Eye,
  Download,
} from 'lucide-react';
import clsx from 'clsx';
import { apiRequest, ApiError } from '@/lib/api-client';
import { candidatesApi, type ApiApplication } from '@/features/candidates/api';
import { jobService } from '@/services/job.service';
import { uploadFile as uploadCvFile, openProtectedFile } from '@/services/file.service';
import { useApiData } from '@/hooks/useApiData';
import { ErrorState, LoadingState } from '@/components/ui/DataStates';

// ==========================================
// 1. DATA TYPES & ENUMS
// ==========================================

export type ColumnId = 'new' | 'screening' | 'interview' | 'offer' | 'hired';

export interface QuickNote {
  id: string;
  author: string;
  createdAt: string;
  content: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  linkedInUrl: string;
  position: string;
  university: string;
  experience: string;
  matchScore: number; // 0 - 100
  appliedDate: string;
  source: string;
  avatar: string;
  columnId: ColumnId;
  daysInStage: number; // Số ngày nằm ở cột này (Nghiệp vụ SLA: > 3 ngày => Quá hạn)
  tags: string[];
  evaluation?: 'pass' | 'review' | 'fail' | null;
  cvSummary: {
    education: string;
    recentCompany: string;
    skills: string[];
    summary: string;
  };
  notes: QuickNote[];
  cvFileName?: string;
  cvUrl?: string | null;
}

// 5 CỘT CỐ ĐỊNH THEO ĐÚNG YÊU CẦU:
// 1. CV Mới
// 2. Sàng lọc
// 3. Phỏng vấn
// 4. Offer
// 5. Đã nhận việc
export const KANBAN_COLUMNS: {
  id: ColumnId;
  title: string;
  accentColor: string;
  badgeColor: string;
  dotColor: string;
  headerBg: string;
}[] = [
  {
    id: 'new',
    title: 'CV Mới',
    accentColor: 'border-t-blue-500',
    badgeColor: 'bg-blue-100 text-blue-800',
    dotColor: 'bg-blue-500',
    headerBg: 'bg-blue-50/50',
  },
  {
    id: 'screening',
    title: 'Sàng lọc',
    accentColor: 'border-t-purple-500',
    badgeColor: 'bg-purple-100 text-purple-800',
    dotColor: 'bg-purple-500',
    headerBg: 'bg-purple-50/50',
  },
  {
    id: 'interview',
    title: 'Phỏng vấn',
    accentColor: 'border-t-amber-500',
    badgeColor: 'bg-amber-100 text-amber-800',
    dotColor: 'bg-amber-500',
    headerBg: 'bg-amber-50/50',
  },
  {
    id: 'offer',
    title: 'Offer',
    accentColor: 'border-t-emerald-500',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    dotColor: 'bg-emerald-500',
    headerBg: 'bg-emerald-50/50',
  },
  {
    id: 'hired',
    title: 'Đã nhận việc',
    accentColor: 'border-t-teal-500',
    badgeColor: 'bg-teal-100 text-teal-800',
    dotColor: 'bg-teal-500',
    headerBg: 'bg-teal-50/50',
  },
];

// Danh sách nhãn gợi ý có sẵn
const PRESET_TAGS = [
  { name: 'Giao tiếp tốt', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { name: 'Tiếng Anh lưu loát', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { name: 'Deal lương cao', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { name: 'Phù hợp văn hóa', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { name: 'Senior Golang', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { name: 'Ưu tiên cao', color: 'bg-rose-50 text-rose-700 border-rose-200' },
];

// ==========================================
// 2. REAL APPLICATIONS -> KANBAN CARDS
// ==========================================

// Backend application status <-> Kanban column (rejected / withdrawn are not on the board)
const STATUS_TO_COLUMN: Record<string, ColumnId> = {
  submitted: 'new', screening: 'screening', interviewing: 'interview', offered: 'offer', hired: 'hired', onboarded: 'hired',
};
const COLUMN_TO_STATUS: Record<ColumnId, string> = {
  new: 'submitted', screening: 'screening', interview: 'interviewing', offer: 'offered', hired: 'hired',
};
// Quick screening verdict is stored as the application rating (1–5)
const EVAL_TO_RATING = { pass: 5, review: 3, fail: 1 } as const;
const ratingToEval = (r?: number | null): Candidate['evaluation'] =>
  r == null ? null : r >= 4 ? 'pass' : r === 3 ? 'review' : 'fail';
const DAY_MS = 86_400_000;

function toCard(a: ApiApplication & { stage_entered_at?: string | null }): Candidate | null {
  const columnId = STATUS_TO_COLUMN[a.status];
  if (!columnId) return null;
  const since = a.stage_entered_at || a.created_at;
  return {
    id: String(a.id),
    name: a.full_name,
    email: a.email,
    phone: a.phone || '',
    linkedInUrl: '',
    position: a.job_title || '',
    university: a.parsed_cv?.education || '',
    experience: a.years_of_experience != null ? `${a.years_of_experience} năm kinh nghiệm` : '',
    matchScore: Math.round(a.match_score ?? 0),
    appliedDate: a.created_at ? new Date(a.created_at).toLocaleDateString('vi-VN') : '',
    source: a.source || 'Không rõ',
    avatar: '',
    columnId,
    daysInStage: since ? Math.max(0, Math.floor((Date.now() - new Date(since).getTime()) / DAY_MS)) : 0,
    tags: a.tags || [],
    evaluation: ratingToEval(a.rating),
    cvSummary: {
      education: a.parsed_cv?.education || '',
      recentCompany: [a.current_position, a.current_company].filter(Boolean).join(' - '),
      skills: a.parsed_cv?.skills || [],
      summary: '',
    },
    notes: [],
    cvFileName: a.cv_url ? a.cv_url.split('/').pop() || 'CV' : '',
    cvUrl: a.cv_url || null,
  };
}

// ==========================================
// 3. MAIN PIPELINE COMPONENT
// ==========================================

export default function RecruiterPipelinePage() {
  const { data, error, loading, reload, setData } = useApiData(
    () => apiRequest<ApiApplication[]>('/applications').then((rows) => rows.map(toCard).filter((c): c is Candidate => c !== null)),
    [],
  );
  const candidates = useMemo(() => data || [], [data]);
  const setCandidates = (fn: (prev: Candidate[]) => Candidate[]) => setData((prev) => fn(prev || []));
  const { data: openJobs } = useApiData(() => jobService.getJobs(), []);
  const [addJobId, setAddJobId] = useState('');
  const [addCvUrl, setAddCvUrl] = useState<string | null>(null);
  const [addSaving, setAddSaving] = useState(false);
  const positions = useMemo(() => Array.from(new Set(candidates.map((c) => c.position).filter(Boolean))).sort(), [candidates]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [slaFilterOnly, setSlaFilterOnly] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Drag and Drop state
  const [draggedCandidateId, setDraggedCandidateId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<ColumnId | null>(null);

  // Quick View Slide-over Panel state (User Story 4)
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [quickNoteInput, setQuickNoteInput] = useState('');

  // Modal 2: Form Thêm ứng viên thủ công (User Story 2)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    phone: '',
    linkedInUrl: '',
    position: '',
    university: '',
    experience: '',
    matchScore: 0,
    source: 'LinkedIn Sourcing',
    notes: '',
    cvFileName: '',
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // The open quick-view always reflects the latest board data
  const selectedCandidate = candidates.find((c) => c.id === selectedId) || null;

  // Handle open Quick View Panel
  const handleOpenQuickView = (candidate: Candidate) => {
    setSelectedId(candidate.id);
    setIsSlideOverOpen(true);
    setQuickNoteInput('');
    setNewTagInput('');
    apiRequest<Array<{ id: number; content: string; author_name?: string | null; created_at?: string | null }>>(`/applications/${candidate.id}/notes`)
      .then((rows) => {
        const notes: QuickNote[] = rows.map((n) => ({
          id: String(n.id), author: n.author_name || '—', content: n.content,
          createdAt: n.created_at ? new Date(n.created_at).toLocaleString('vi-VN') : '',
        }));
        setCandidates((prev) => prev.map((c) => (c.id === candidate.id ? { ...c, notes } : c)));
      })
      .catch(() => undefined);
  };

  // ==========================================
  // DRAG & DROP LOGIC (HTML5 Native Drag & Drop)
  // ==========================================

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedCandidateId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colId: ColumnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumnId !== colId) {
      setDragOverColumnId(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Real stage transition (PUT /applications/{id}/status); the board only changes when the server accepts it
  const moveCandidate = async (candidateId: string, targetColId: ColumnId) => {
    const cand = candidates.find((c) => c.id === candidateId);
    if (!cand || cand.columnId === targetColId) return;
    const colInfo = KANBAN_COLUMNS.find((col) => col.id === targetColId);
    try {
      await apiRequest(`/applications/${candidateId}/status`, {
        method: 'PUT', body: JSON.stringify({ status: COLUMN_TO_STATUS[targetColId] }),
      });
      setCandidates((prev) => prev.map((c) => (c.id === candidateId ? { ...c, columnId: targetColId, daysInStage: 0 } : c)));
      showToast(`Đã chuyển ứng viên ${cand.name} sang cột "${colInfo?.title}"!`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Không chuyển được giai đoạn.');
    }
  };

  const handleDrop = (e: React.DragEvent, targetColId: ColumnId) => {
    e.preventDefault();
    setDragOverColumnId(null);
    const candidateId = e.dataTransfer.getData('text/plain') || draggedCandidateId;
    setDraggedCandidateId(null);
    if (candidateId) void moveCandidate(candidateId, targetColId);
  };

  const handleDragEnd = () => {
    setDraggedCandidateId(null);
    setDragOverColumnId(null);
  };

  // Di chuyển bằng nút bấm mũi tên nhanh
  const handleMoveStage = (candidateId: string, targetColId: ColumnId) => {
    void moveCandidate(candidateId, targetColId);
  };

  // ==========================================
  // QUICK VIEW PANEL ACTIONS (Sàng lọc nhanh)
  // ==========================================

  // Đánh giá Pass / Fail / Review
  const saveTagsAndRating = async (cand: Candidate, tags: string[], evaluation: Candidate['evaluation']) => {
    await candidatesApi.setTags(Number(cand.id), tags, evaluation ? EVAL_TO_RATING[evaluation] : null);
    setCandidates((prev) => prev.map((c) => (c.id === cand.id ? { ...c, tags, evaluation } : c)));
  };

  const handleSetEvaluation = async (evalType: 'pass' | 'review' | 'fail') => {
    if (!selectedCandidate) return;
    const labelMap = { pass: 'Đạt (Pass)', review: 'Cân nhắc', fail: 'Không đạt (Fail)' };
    try {
      await saveTagsAndRating(selectedCandidate, selectedCandidate.tags, evalType);
      showToast(`Đã đánh giá "${labelMap[evalType]}" cho ứng viên ${selectedCandidate.name}.`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Không lưu được đánh giá.');
    }
  };

  const handleAddTag = async (tagName: string) => {
    if (!selectedCandidate || !tagName.trim()) return;
    const cleanTag = tagName.trim();
    if (selectedCandidate.tags.includes(cleanTag)) return;
    try {
      await saveTagsAndRating(selectedCandidate, [...selectedCandidate.tags, cleanTag], selectedCandidate.evaluation);
      setNewTagInput('');
      showToast(`Đã thêm nhãn "${cleanTag}".`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Không lưu được nhãn.');
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!selectedCandidate) return;
    try {
      await saveTagsAndRating(selectedCandidate, selectedCandidate.tags.filter((t) => t !== tagToRemove), selectedCandidate.evaluation);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Không xóa được nhãn.');
    }
  };

  const handleAddQuickNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate || !quickNoteInput.trim()) return;
    try {
      const n = await candidatesApi.addNote(Number(selectedCandidate.id), quickNoteInput.trim());
      const newNote: QuickNote = {
        id: String(n.id), author: n.author_name || '—', content: n.content,
        createdAt: n.created_at ? new Date(n.created_at).toLocaleString('vi-VN') : '',
      };
      setCandidates((prev) => prev.map((c) => (c.id === selectedCandidate.id ? { ...c, notes: [newNote, ...c.notes] } : c)));
      setQuickNoteInput('');
      showToast('Đã lưu ghi chú nhanh thành công!');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Không lưu được ghi chú.');
    }
  };

  // ==========================================
  // THÊM ỨNG VIÊN THỦ CÔNG (User Story 2)
  // ==========================================

  const handleAddCvFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const stored = await uploadCvFile('cv', file);
      setAddCvUrl(stored.url);
      setAddForm((f) => ({
        ...f, cvFileName: file.name,
        name: f.name || stored.parsed?.full_name || '', email: f.email || stored.parsed?.email || '', phone: f.phone || stored.parsed?.phone || '',
      }));
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Không tải được CV lên.');
    }
  };

  const handleAddManualCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.email.trim() || !addForm.phone.trim()) {
      showToast('Vui lòng nhập đủ họ tên, email và số điện thoại.');
      return;
    }
    if (!addJobId) {
      showToast('Vui lòng chọn tin tuyển dụng cho ứng viên.');
      return;
    }
    setAddSaving(true);
    try {
      const created = await candidatesApi.addManual({
        job_posting_id: Number(addJobId),
        full_name: addForm.name.trim(),
        email: addForm.email.trim(),
        phone: addForm.phone.trim(),
        cv_url: addCvUrl || undefined,
        source: addForm.source,
      });
      const extra = [addForm.notes.trim(), addForm.linkedInUrl.trim() && `LinkedIn: ${addForm.linkedInUrl.trim()}`].filter(Boolean).join('\n');
      if (extra) await candidatesApi.addNote(created.id, extra).catch(() => undefined);
      setIsAddModalOpen(false);
      reload();
      showToast(`Đã thêm ứng viên "${created.full_name}" vào cột "CV Mới"!`);
      setAddJobId('');
      setAddCvUrl(null);
      setAddForm({
        name: '', email: '', phone: '', linkedInUrl: '', position: '', university: '',
        experience: '', matchScore: 0, source: 'LinkedIn Sourcing', notes: '', cvFileName: '',
      });
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Không thêm được ứng viên.');
    } finally {
      setAddSaving(false);
    }
  };

  // ==========================================
  // FILTERING & STATS
  // ==========================================

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchPos = selectedPosition === 'all' || c.position === selectedPosition;
      const matchSla = slaFilterOnly ? c.daysInStage > 3 : true;

      return matchSearch && matchPos && matchSla;
    });
  }, [candidates, searchQuery, selectedPosition, slaFilterOnly]);

  // Đếm số lượng quá hạn SLA (> 3 ngày)
  const overdueCount = useMemo(() => {
    return candidates.filter((c) => c.daysInStage > 3).length;
  }, [candidates]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="flex-1 overflow-hidden flex flex-col space-y-4 antialiased font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* 1. TOP HEADER & BREADCRUMBS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
            <Link href="/recruiter" className="hover:text-blue-600 transition-colors">
              Recruiter Workspace
            </Link>
            <span>&rsaquo;</span>
            <span className="text-slate-700 font-bold">Kanban Pipeline</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Kanban className="w-8 h-8 text-blue-600" />
            <span>Kanban Pipeline Điều Phối Ứng Viên</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Quản lý vòng đời ứng viên 5 giai đoạn, kéo thả phân loại, giám sát vi phạm SLA và sàng lọc nhanh CV.
          </p>
        </div>

        {/* Nút Thêm ứng viên thủ công (User Story 2) */}
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 flex items-center gap-2.5 transition-all transform active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Thêm Ứng Viên Thủ Công</span>
        </button>
      </div>

      {/* 2. FILTER & TOOLBAR */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search & Position Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, mã hồ sơ, kỹ năng..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              <option value="all">🎯 Tất cả vị trí tuyển dụng</option>
              {positions.map((pos) => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>
        </div>

        {/* SLA Status Widget & Action Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSlaFilterOnly(!slaFilterOnly)}
            className={clsx(
              'px-3.5 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer border',
              slaFilterOnly
                ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/20'
                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
            )}
          >
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            <span>Quá hạn SLA (&gt; 3 ngày): {overdueCount} hồ sơ</span>
          </button>

          <span className="text-xs text-slate-400 font-bold hidden lg:inline">
            Tổng số: <strong className="text-slate-800">{filteredCandidates.length}</strong> ứng viên
          </span>
        </div>
      </div>

      {/* 3. KANBAN BOARD (CUỘN NGANG: overflow-x-auto flex gap-4) */}
      <div className="flex-1 overflow-x-auto pb-4 pt-1">
        <div className="flex gap-4 min-w-[1360px] h-full items-start">
          {KANBAN_COLUMNS.map((col) => {
            const colCandidates = filteredCandidates.filter((c) => c.columnId === col.id);
            const isDragTarget = dragOverColumnId === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
                className={clsx(
                  'w-72 sm:w-80 shrink-0 rounded-3xl border flex flex-col max-h-[calc(100vh-14rem)] transition-all duration-150 border-t-4 shadow-xs',
                  col.accentColor,
                  isDragTarget
                    ? 'border-blue-400 bg-blue-50/50 ring-2 ring-blue-400/40'
                    : 'bg-slate-100/70 border-slate-200/80'
                )}
              >
                {/* Column Header */}
                <div
                  className={clsx(
                    'p-4 flex items-center justify-between border-b border-slate-200/60 rounded-t-2xl',
                    col.headerBg
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={clsx('w-2.5 h-2.5 rounded-full', col.dotColor)} />
                    <h3 className="font-black text-xs text-slate-900 tracking-tight uppercase">
                      {col.title}
                    </h3>
                  </div>

                  <span
                    className={clsx(
                      'text-[10px] font-black px-2.5 py-0.5 rounded-full border',
                      col.badgeColor
                    )}
                  >
                    {colCandidates.length}
                  </span>
                </div>

                {/* Candidate Cards List */}
                <div className="p-3 space-y-3 overflow-y-auto flex-1 min-h-[300px]">
                  {colCandidates.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-2xl bg-white/40 flex flex-col items-center justify-center space-y-1">
                      <Layers className="w-5 h-5 opacity-40" />
                      <span className="font-medium text-[11px]">Kéo thẻ thả vào đây</span>
                    </div>
                  ) : (
                    colCandidates.map((cand) => {
                      const isSlaBreached = cand.daysInStage > 3;

                      return (
                        <div
                          key={cand.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, cand.id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => handleOpenQuickView(cand)}
                          className={clsx(
                            'rounded-2xl p-4 shadow-xs hover:shadow-md transition-all space-y-3 cursor-grab active:cursor-grabbing group border relative select-none',
                            // CẢNH BÁO SLA QUÁ HẠN: Viền đỏ nhạt, nền đỏ-50 nếu ở 1 cột > 3 ngày (User Story 3)
                            isSlaBreached
                              ? 'border-red-400 bg-red-50/70 ring-1 ring-red-400/40'
                              : 'bg-white border-slate-200/90 hover:border-blue-300'
                          )}
                        >
                          {/* Top: Avatar, Name & Match Score Badge (User Story 3) */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              {cand.avatar ? (
                                <img
                                  src={cand.avatar}
                                  alt={cand.name}
                                  className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-sky-100 text-[#0284C7] font-extrabold text-xs flex items-center justify-center border border-sky-200 shrink-0 select-none">
                                  {(cand.name || "U").trim().split(" ").slice(-1)[0][0]?.toUpperCase() || "U"}
                                </div>
                              )}
                              <div>
                                <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                  {cand.name}
                                </h4>
                                <span className="text-[10px] font-mono text-slate-400 block">
                                  {cand.id}
                                </span>
                              </div>
                            </div>

                            {/* Match Score Badge (85% Xanh, 40% Đỏ theo User Story) */}
                            <div className="flex flex-col items-end gap-1">
                              <span
                                className={clsx(
                                  'text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 border flex items-center gap-1 shadow-2xs',
                                  cand.matchScore >= 80
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                    : cand.matchScore >= 50
                                    ? 'bg-amber-50 text-amber-700 border-amber-300'
                                    : 'bg-rose-50 text-rose-700 border-rose-300'
                                )}
                              >
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>{cand.matchScore}% Match</span>
                              </span>

                              {/* Evaluation Status Badge if available */}
                              {cand.evaluation === 'pass' && (
                                <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-100/60 px-1.5 py-0.2 rounded">
                                  ✓ Đạt
                                </span>
                              )}
                              {cand.evaluation === 'fail' && (
                                <span className="text-[9px] font-extrabold text-rose-600 bg-rose-100/60 px-1.5 py-0.2 rounded">
                                  ✕ Loại
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Position */}
                          <div className="text-[11px] font-extrabold text-slate-800 line-clamp-1">
                            {cand.position}
                          </div>

                          {/* University & Experience */}
                          <div className="space-y-1 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                            <div className="flex items-center gap-1.5 truncate">
                              <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{cand.university}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{cand.experience}</span>
                            </div>
                          </div>

                          {/* Tags Preview */}
                          {cand.tags && cand.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {cand.tags.map((tag, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/50"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Cảnh báo SLA Quá hạn (> 3 ngày): Icon Đồng hồ đỏ nhấp nháy (User Story 3) */}
                          {isSlaBreached && (
                            <div className="p-2 rounded-xl bg-rose-100/80 border border-rose-300 text-rose-800 text-[10px] font-extrabold flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-rose-600 animate-pulse shrink-0" />
                                <span>Quá hạn SLA ({cand.daysInStage} ngày ở cột này)</span>
                              </div>
                              <span className="text-[9px] bg-rose-200 text-rose-900 px-1.5 py-0.5 rounded font-black">
                                &gt; 3 ngày
                              </span>
                            </div>
                          )}

                          {/* Footer Card: Ngày nộp + Nút di chuyển nhanh */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                            <span>{cand.appliedDate}</span>

                            {/* Stage quick move buttons */}
                            <div
                              className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {col.id !== 'new' && (
                                <button
                                  type="button"
                                  title="Lùi về vòng trước"
                                  onClick={() => {
                                    const colIds: ColumnId[] = [
                                      'new',
                                      'screening',
                                      'interview',
                                      'offer',
                                      'hired',
                                    ];
                                    const currIdx = colIds.indexOf(col.id);
                                    if (currIdx > 0) {
                                      handleMoveStage(cand.id, colIds[currIdx - 1]);
                                    }
                                  }}
                                  className="p-1 rounded-md hover:bg-slate-200 text-slate-600 cursor-pointer"
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {col.id !== 'hired' && (
                                <button
                                  type="button"
                                  title="Chuyển sang vòng kế tiếp"
                                  onClick={() => {
                                    const colIds: ColumnId[] = [
                                      'new',
                                      'screening',
                                      'interview',
                                      'offer',
                                      'hired',
                                    ];
                                    const currIdx = colIds.indexOf(col.id);
                                    if (currIdx < colIds.length - 1) {
                                      handleMoveStage(cand.id, colIds[currIdx + 1]);
                                    }
                                  }}
                                  className="p-1 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer"
                                >
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. QUICK VIEW SLIDE-OVER PANEL (CẠNH PHẢI - User Story 4) */}
      {/* ======================================================== */}
      {isSlideOverOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop mờ */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsSlideOverOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-250">
              {/* Header Panel */}
              <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
                <div className="flex items-center gap-3">
                  {selectedCandidate.avatar ? (
                    <img
                      src={selectedCandidate.avatar}
                      alt={selectedCandidate.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-200 shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-sky-100 text-[#0284C7] font-extrabold text-xl flex items-center justify-center border-2 border-blue-200 shadow-sm shrink-0 select-none">
                      {(selectedCandidate.name || "U").trim().split(" ").slice(-1)[0][0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">
                      {selectedCandidate.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="font-mono font-bold text-slate-600">
                        {selectedCandidate.id}
                      </span>
                      <span>&bull;</span>
                      <span>{selectedCandidate.source}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedCandidate.linkedInUrl && <a
                    href={selectedCandidate.linkedInUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                    title="Mở hồ sơ LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>}
                  <button
                    type="button"
                    onClick={() => setIsSlideOverOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body Panel (Scrollable) */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                {/* 1. MỨC ĐỘ PHÙ HỢP (MATCH SCORE) & ĐÁNH GIÁ (PASS/FAIL) */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/60 to-indigo-50/40 border border-blue-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      Điểm phù hợp tiêu chí JD
                    </span>
                    <span
                      className={clsx(
                        'text-xs font-black px-2.5 py-0.5 rounded-full border',
                        selectedCandidate.matchScore >= 80
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : selectedCandidate.matchScore >= 50
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-rose-50 text-rose-800 border-rose-300'
                      )}
                    >
                      {selectedCandidate.matchScore}% Phù hợp
                    </span>
                  </div>

                  {/* Bộ đánh giá nhanh Pass / Review / Fail */}
                  <div className="space-y-1.5 pt-2 border-t border-blue-100/80">
                    <div className="font-bold text-slate-600 text-[11px]">
                      Sàng lọc nhanh (Quyết định):
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSetEvaluation('pass')}
                        className={clsx(
                          'py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border',
                          selectedCandidate.evaluation === 'pass'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                            : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200'
                        )}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Pass</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetEvaluation('review')}
                        className={clsx(
                          'py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border',
                          selectedCandidate.evaluation === 'review'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20'
                            : 'bg-white hover:bg-amber-50 text-amber-700 border-amber-200'
                        )}
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Cân nhắc</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetEvaluation('fail')}
                        className={clsx(
                          'py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border',
                          selectedCandidate.evaluation === 'fail'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-500/20'
                            : 'bg-white hover:bg-rose-50 text-rose-700 border-rose-200'
                        )}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        <span>Fail</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. CHUYỂN GIAI ĐOẠN TRỰC TIẾP (STAGE SWITCHER) */}
                <div className="space-y-2">
                  <div className="font-extrabold text-slate-800 flex items-center justify-between">
                    <span>Giai đoạn hiện tại:</span>
                    <span className="text-blue-600 font-black">
                      {KANBAN_COLUMNS.find((c) => c.id === selectedCandidate.columnId)?.title}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 bg-slate-100 p-1 rounded-2xl">
                    {KANBAN_COLUMNS.map((col) => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => handleMoveStage(selectedCandidate.id, col.id)}
                        className={clsx(
                          'py-2 px-1 rounded-xl text-[10px] font-black transition-all cursor-pointer text-center',
                          selectedCandidate.columnId === col.id
                            ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                            : 'text-slate-600 hover:text-slate-900'
                        )}
                      >
                        {col.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. TÓM TẮT CV & NÚT XEM CV GỐC */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/70 pb-2">
                    <span className="font-extrabold text-slate-800 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Trích yếu hồ sơ ứng viên (CV)
                    </span>
                    <button
                      type="button"
                      disabled={!selectedCandidate.cvUrl}
                      onClick={() =>
                        selectedCandidate.cvUrl &&
                        openProtectedFile(selectedCandidate.cvUrl).catch(() => showToast('Không mở được CV.'))
                      }
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Xem file PDF</span>
                    </button>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 font-medium">Học vấn: </span>
                      <span className="font-bold text-slate-800">
                        {selectedCandidate.cvSummary.education}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Gần nhất: </span>
                      <span className="font-bold text-slate-800">
                        {selectedCandidate.cvSummary.recentCompany}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed font-normal bg-white p-3 rounded-xl border border-slate-200/60">
                      {selectedCandidate.cvSummary.summary}
                    </p>
                  </div>

                  {/* Kỹ năng cốt lõi */}
                  <div className="pt-1">
                    <span className="text-[10px] text-slate-400 font-bold block mb-1.5 uppercase">
                      Kỹ năng trích xuất:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCandidate.cvSummary.skills.map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. GẮN NHÃN MÀU (TAGGING SYSTEM - User Story 4) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-slate-800 flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-purple-600" />
                      Nhãn phân loại (Tags)
                    </label>
                  </div>

                  {/* Danh sách Tags hiện tại */}
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCandidate.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-rose-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Input thêm tag mới */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag(newTagInput);
                        }
                      }}
                      placeholder="Gõ nhãn mới & bấm Enter..."
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-500 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTag(newTagInput)}
                      className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer"
                    >
                      + Thêm
                    </button>
                  </div>

                  {/* Preset Tags gợi ý */}
                  <div className="pt-1">
                    <span className="text-[10px] text-slate-400 font-semibold block mb-1">
                      Nhãn mẫu gợi ý:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {PRESET_TAGS.map((pt, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => handleAddTag(pt.name)}
                          className={clsx(
                            'px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-transform hover:scale-105 cursor-pointer',
                            pt.color
                          )}
                        >
                          + {pt.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 5. GHI CHÚ NHANH (QUICK NOTES) */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-slate-800 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      Ghi chú nhanh của Recruiter
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {selectedCandidate.notes.length} ghi chú
                    </span>
                  </div>

                  {/* Form nhập note */}
                  <form onSubmit={handleAddQuickNote} className="space-y-2">
                    <textarea
                      rows={2}
                      value={quickNoteInput}
                      onChange={(e) => setQuickNoteInput(e.target.value)}
                      placeholder="Ghi lại ấn tượng, mức lương mong muốn, hoặc câu hỏi cho Hiring Manager..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-normal text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>Lưu Ghi Chú</span>
                      </button>
                    </div>
                  </form>

                  {/* Danh sách ghi chú */}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedCandidate.notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-slate-800">{note.author}</span>
                          <span className="text-slate-400">{note.createdAt}</span>
                        </div>
                        <p className="text-slate-700 text-xs leading-relaxed">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Panel */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedCandidate.phone}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSlideOverOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-white text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Đóng Panel
                  </button>
                  <a
                    href={`mailto:${selectedCandidate.email}`}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs inline-flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Gửi Thư</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL: THÊM ỨNG VIÊN THỦ CÔNG (User Story 2)           */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 p-6 space-y-5 animate-in zoom-in-95 duration-200 text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    Thêm Ứng Viên Thủ Công Vào Pipeline
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Đẩy ứng viên tìm từ nguồn ngoài (LinkedIn/Sourcing) trực tiếp vào cột &quot;CV Mới&quot;.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddManualCandidate} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Họ và tên ứng viên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Đình Trọng"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              {/* Link LinkedIn - Yêu cầu cốt lõi của User Story 2 */}
              <div>
                <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Linkedin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Đường dẫn LinkedIn (Profile Link)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={addForm.linkedInUrl}
                  onChange={(e) => setAddForm({ ...addForm, linkedInUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Email liên hệ</label>
                  <input
                    type="email"
                    placeholder="ungvien@gmail.com"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    placeholder="0987654321"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Vị trí ứng tuyển */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">Vị trí đẩy vào Pipeline</label>
                <select
                  value={addJobId}
                  onChange={(e) => setAddJobId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
                >
                  <option value="">-- Chọn tin tuyển dụng --</option>
                  {(openJobs || []).map((j) => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
              </div>

              {/* Upload CV - Yêu cầu User Story 2 */}
              <div>
                <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>Upload hồ sơ CV (PDF / DOCX)</span>
                </label>
                <label className="block p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition-colors text-center cursor-pointer">
                  <input type="file" accept=".pdf,.docx" className="hidden" onChange={handleAddCvFile} />
                  <FileText className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-700">{addForm.cvFileName || 'Kéo thả CV hoặc bấm để chọn tệp'}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Hỗ trợ định dạng PDF, DOCX (Dung lượng tối đa 10MB)
                  </p>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Nguồn tìm kiếm</label>
                  <select
                    value={addForm.source}
                    onChange={(e) => setAddForm({ ...addForm, source: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
                  >
                    <option value="LinkedIn Sourcing">LinkedIn Sourcing</option>
                    <option value="Headhunter Agency">Headhunter Agency</option>
                    <option value="TopCV Chủ động">TopCV Chủ động</option>
                    <option value="Giới thiệu trực tiếp">Giới thiệu trực tiếp</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Điểm Match tự tính</label>
                  <input
                    type="text"
                    disabled
                    value="Hệ thống tự tính"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Ghi chú ban đầu</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú về ứng viên..."
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={addSaving}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-60"
                >
                  {addSaving ? 'Đang lưu...' : 'Thêm Vào Pipeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
