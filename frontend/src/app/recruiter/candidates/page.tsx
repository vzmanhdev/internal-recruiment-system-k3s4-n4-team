'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Pagination } from '@/components/ui/Pagination';
import { getSearchScore } from '@/utils/vietnameseSearch';
import { SearchAutocompleteInput } from '@/components/ui/SearchAutocompleteInput';
import {
  Users,
  Search,
  Filter,
  Plus,
  ChevronRight,
  GraduationCap,
  Briefcase,
  Sparkles,
  ExternalLink,
  Download,
  Upload,
  FileSpreadsheet,
  X,
  Tag,
  CheckCircle2,
  Clock,
  DollarSign,
  Building2,
  Calendar,
  Layers,
  RotateCcw,
  Check,
  FileText,
  AlertCircle,
  AlertTriangle,
  MoreVertical,
  Mail,
  Phone,
  Eye,
  UserCheck,
  Send,
  Linkedin,
  XCircle,
  ArrowLeft,
} from 'lucide-react';
import clsx from 'clsx';
import type { UnifiedCandidate } from '@/features/candidates/types';
import { candidatesApi, type DuplicateCheckResult } from '@/features/candidates/api';
import { jobService } from '@/services/job.service';
import { masterDataService } from '@/services/master-data.service';
import { uploadFile as uploadCvFile } from '@/services/file.service';
import { useApiData } from '@/hooks/useApiData';
import { ErrorState, LoadingState } from '@/components/ui/DataStates';
import { ApiError } from '@/lib/api-client';

export interface RichToast {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  candidateName?: string;
  trackingCode?: string;
  jobTitle?: string;
  source?: string;
  details?: string;
}

export default function RecruiterCandidatesPage() {
  const { data, error, loading, reload } = useApiData(() => candidatesApi.list());
  const candidates: UnifiedCandidate[] = useMemo(() => data || [], [data]);
  // Published postings a sourced candidate can be added to (S5-08).
  const { data: openJobs } = useApiData(() => jobService.getJobs());
  const { data: sourceCategories } = useApiData(() => masterDataService.categories('candidate_source'));
  const [targetJobId, setTargetJobId] = useState<string>('');
  const [uploadedCvUrl, setUploadedCvUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedSalaryRange, setSelectedSalaryRange] = useState<string>('all');
  const [selectedSkill, setSelectedSkill] = useState<string>('all');
  const [toast, setToast] = useState<string | RichToast | null>(null);

  // Modal State: Thêm ứng viên thủ công / Sourcing (LinkedIn) (S5-08)
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualJobId, setManualJobId] = useState('');
  const [manualCvUrl, setManualCvUrl] = useState<string | null>(null);
  const [manualCvFileName, setManualCvFileName] = useState('');
  const [manualCvUploading, setManualCvUploading] = useState(false);
  const [manualSaving, setManualSaving] = useState(false);
  const [manualDupCheck, setManualDupCheck] = useState<DuplicateCheckResult | null>(null);
  const [manualDupChecking, setManualDupChecking] = useState(false);
  const [manualConfirmDuplicate, setManualConfirmDuplicate] = useState(false);
  const [manualForm, setManualForm] = useState({
    name: '',
    email: '',
    phone: '',
    linkedInUrl: '',
    company: '',
    position: '',
    university: '',
    experience: '',
    source: 'LinkedIn Sourcing',
    notes: '',
  });

  // Modal State: Tải CV lên & Tự động bóc tách (AI Resume Parser)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [parseStageText, setParseStageText] = useState('');
  const [parsedData, setParsedData] = useState<{
    name: string;
    email: string;
    phone: string;
    position: string;
    university: string;
    skills: string[];
    experience: string;
  } | null>(null);

  const showToast = (msg: string | RichToast) => {
    setToast(msg);
    setTimeout(() => setToast(null), 5000);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedTag('all');
    setSelectedStatus('all');
    setSelectedSource('all');
    setSelectedSalaryRange('all');
    setSelectedSkill('all');
    showToast('Đã đặt lại toàn bộ bộ lọc!');
  };

  // ==========================================
  // XUẤT EXCEL (Export to Excel)
  // ==========================================
  const handleExportExcel = async () => {
    try {
      // Server-side export: only candidates in scope, no internal notes, formula-safe (S6-01).
      const name = await candidatesApi.downloadExport();
      showToast(`Đã xuất danh sách ứng viên (${name}).`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Có lỗi xảy ra khi xuất file Excel. Vui lòng thử lại.');
    }
  };

  // ==========================================
  // TẢI CV MẪU CHUẨN ATS (.PDF)
  // ==========================================
  const handleDownloadSampleCv = () => {
    const link = document.createElement('a');
    link.href = '/templates/Mau_CV_Chuan_ATS.pdf';
    link.download = 'Mau_CV_Chuan_ATS.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast({
      type: 'success',
      title: 'Đã Tải Xuống CV Mẫu Thành Công!',
      message: 'Tệp "Mau_CV_Chuan_ATS.pdf" đã được tải về máy tính của bạn.',
      candidateName: 'Nguyễn Văn Hoàng',
      details: 'Cấu trúc mẫu chuẩn: Họ tên, Email, SĐT, Học vấn (ĐH Bách Khoa) & Kỹ năng (Python, FastAPI, React, Docker). Bạn có thể kéo thả tệp này vào ô tải lên để trải nghiệm bóc tách tự động!',
    });
  };

  // ==========================================
  // BÓC TÁCH CV THẬT (server: PDF/DOCX ≤ 10MB, S4-03/S4-04)
  // ==========================================
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setIsParsing(true);
    setParseProgress(30);
    setParseStageText('Đang tải CV lên máy chủ và phân tích bóc tách...');
    try {
      const stored = await uploadCvFile('cv', file);
      setUploadedCvUrl(stored.url);
      setParseProgress(100);

      const parsed = stored.parsed;
      const isSuccess = parsed && parsed.status === 'parsed';

      // AC2: Giữ nguyên dữ liệu recruiter đã nhập trước đó (nếu có), không tự ghi đè
      setParsedData((prev) => ({
        name: prev?.name?.trim() ? prev.name : (parsed?.full_name || ''),
        email: prev?.email?.trim() ? prev.email : (parsed?.email || ''),
        phone: prev?.phone?.trim() ? prev.phone : (parsed?.phone || ''),
        position: prev?.position?.trim() ? prev.position : '',
        university: prev?.university?.trim() ? prev.university : (parsed?.education || ''),
        skills: prev?.skills && prev.skills.length > 0 ? prev.skills : (parsed?.skills || []),
        experience: prev?.experience || '',
      }));

      setParseStageText(
        isSuccess
          ? 'Đã bóc tách thành công họ tên, email, số điện thoại từ CV.'
          : 'Tệp CV scan/ảnh không chứa văn bản. Hồ sơ gốc đã lưu an toàn, vui lòng nhập tay.'
      );

      if (isSuccess) {
        showToast({
          type: 'success',
          title: 'Bóc Tách CV Thành Công (AC1/AC2)',
          message: `Hệ thống đã tự động trích xuất thông tin ứng viên từ tệp "${file.name}".`,
          candidateName: parsed?.full_name || 'Đã trích xuất',
          details: `Email: ${parsed?.email || 'Chưa nhận diện'} • SĐT: ${parsed?.phone || 'Chưa nhận diện'}${parsed?.education ? ` • Học vấn: ${parsed.education}` : ''}${parsed?.skills?.length ? ` • Kỹ năng: ${parsed.skills.join(', ')}` : ''}`,
        });
      } else {
        // AC3: Bóc tách thất bại không làm hỏng việc nộp hồ sơ
        showToast({
          type: 'warning',
          title: 'CV Đã Tải Lên Thành Công (Cần Nhập Tay - AC3)',
          message: `Tệp "${file.name}" đã được lưu an toàn. Tuy nhiên tệp scan/ảnh không chứa văn bản bóc tách được.`,
          details: 'Tiêu chí AC3: Quá trình nộp hồ sơ không bị gián đoạn. Bạn có thể tự nhập tay thông tin ứng viên bên dưới.',
        });
      }
    } catch (err) {
      setUploadFile(null);
      setParseProgress(0);
      showToast({
        type: 'error',
        title: 'Tải CV Thất Bại',
        message: err instanceof ApiError ? err.message : 'Không tải được CV lên máy chủ.',
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleSaveParsedCandidate = async () => {
    if (!parsedData) return;
    if (!targetJobId) {
      showToast({
        type: 'warning',
        title: 'Chưa Chọn Tin Tuyển Dụng',
        message: 'Vui lòng chọn tin tuyển dụng mục tiêu cho ứng viên trước khi lưu.',
      });
      return;
    }
    if (!parsedData.name.trim() || !parsedData.email.trim() || !parsedData.phone.trim()) {
      showToast({
        type: 'error',
        title: 'Thiếu Thông Tin Bắt Buộc',
        message: 'Vui lòng nhập đủ họ tên, email và số điện thoại của ứng viên.',
      });
      return;
    }
    setSaving(true);
    try {
      const created = await candidatesApi.addManual({
        job_posting_id: Number(targetJobId),
        full_name: parsedData.name.trim(),
        email: parsedData.email.trim(),
        phone: parsedData.phone.trim(),
        cv_url: uploadedCvUrl || undefined,
      });
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadedCvUrl(null);
      setParsedData(null);
      setTargetJobId('');
      reload();
      showToast({
        type: 'success',
        title: 'Thêm Ứng Viên Thành Công!',
        message: `Hồ sơ đã được lưu vào pipeline vị trí tuyển dụng với thông tin recruiter đã xác nhận/sửa.`,
        candidateName: created.full_name,
        trackingCode: created.tracking_code || undefined,
        jobTitle: created.job_title || undefined,
        details: `Email: ${created.email} • SĐT: ${created.phone} • Tệp CV gốc liên kết: ${uploadedCvUrl ? 'Đã lưu' : 'Không có'}.`,
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Không Thêm Được Ứng Viên',
        message: err instanceof ApiError ? err.message : 'Có lỗi xảy ra khi lưu ứng viên.',
      });
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // THÊM ỨNG VIÊN SOURCING (LINKEDIN) - S5-08
  // ==========================================
  const runManualDuplicateCheck = useCallback(async (email?: string, phone?: string, jobId?: string) => {
    const targetEmail = (email !== undefined ? email : manualForm.email).trim();
    const targetPhone = (phone !== undefined ? phone : manualForm.phone).trim();
    const targetJob = jobId !== undefined ? jobId : manualJobId;
    if (!targetEmail && !targetPhone) {
      setManualDupCheck(null);
      return;
    }
    setManualDupChecking(true);
    try {
      const res = await candidatesApi.checkDuplicate(
        targetEmail || undefined,
        targetPhone || undefined,
        targetJob ? Number(targetJob) : undefined
      );
      setManualDupCheck(res);
    } catch {
      // ignore check failure on network errors
    } finally {
      setManualDupChecking(false);
    }
  }, [manualForm.email, manualForm.phone, manualJobId]);

  const handleManualCvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast({
        type: 'error',
        title: 'File quá lớn',
        message: 'Dung lượng file CV vượt quá 10MB cho phép.',
      });
      return;
    }
    setManualCvUploading(true);
    try {
      const res = await uploadCvFile('cv', file);
      setManualCvUrl(res.url);
      setManualCvFileName(file.name);
      const parsed = res.parsed;
      const isSuccess = parsed && parsed.status === 'parsed';

      // AC2: Tự động điền các trường còn trống, tuyệt đối không tự ý ghi đè những gì recruiter đã nhập trước đó
      setManualForm((prev) => ({
        ...prev,
        name: prev.name.trim() ? prev.name : (parsed?.full_name || ''),
        email: prev.email.trim() ? prev.email : (parsed?.email || ''),
        phone: prev.phone.trim() ? prev.phone : (parsed?.phone || ''),
        university: prev.university.trim() ? prev.university : (parsed?.education || ''),
      }));

      if (isSuccess) {
        showToast({
          type: 'success',
          title: 'Đã Bóc Tách CV Thành Công!',
          message: `Đã trích xuất thông tin liên hệ từ tệp ${file.name}. Các ô chưa điền đã được tự động điền sẵn.`,
          candidateName: parsed?.full_name || undefined,
          details: `Email: ${parsed?.email || 'N/A'} • SĐT: ${parsed?.phone || 'N/A'}${parsed?.skills?.length ? ` • Kỹ năng: ${parsed.skills.join(', ')}` : ''}`,
        });
      } else {
        showToast({
          type: 'info',
          title: 'Tải CV Thành Công',
          message: `Đã đính kèm tệp ${file.name}. (CV dạng scan/ảnh không chứa văn bản để bóc tách).`,
        });
      }
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Tải CV Thất Bại',
        message: err instanceof ApiError ? err.message : 'Không tải được file CV.',
      });
    } finally {
      setManualCvUploading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualJobId) {
      showToast({
        type: 'error',
        title: 'Thiếu Vị Trí Tuyển Dụng',
        message: 'Vui lòng chọn vị trí tuyển dụng cho ứng viên sourcing.',
      });
      return;
    }
    if (!manualForm.name.trim() || !manualForm.email.trim() || !manualForm.phone.trim()) {
      showToast({
        type: 'error',
        title: 'Thiếu Thông Tin Bắt Buộc',
        message: 'Vui lòng điền đủ họ tên, email và số điện thoại ứng viên.',
      });
      return;
    }
    if (manualDupCheck?.same_job_conflict) {
      showToast({
        type: 'error',
        title: 'Trùng Lặp Hồ Sơ Đang Active',
        message: `Ứng viên này đã có hồ sơ đang xử lý tại vị trí này (${manualDupCheck.active_application_in_job?.tracking_code || ''}). Hệ thống chặn tạo mới để bảo đảm chất lượng dữ liệu pipeline.`,
      });
      return;
    }
    if (manualDupCheck?.is_duplicate && !manualConfirmDuplicate) {
      showToast({
        type: 'warning',
        title: 'Cần Xác Nhận Liên Kết',
        message: 'Vui lòng tick xác nhận liên kết với hồ sơ cũ để bảo lưu lịch sử ứng viên.',
      });
      return;
    }

    setManualSaving(true);
    try {
      const created = await candidatesApi.addManual({
        job_posting_id: Number(manualJobId),
        full_name: manualForm.name.trim(),
        email: manualForm.email.trim(),
        phone: manualForm.phone.trim(),
        linkedin_url: manualForm.linkedInUrl.trim() || undefined,
        cv_url: manualCvUrl || undefined,
        source: manualForm.source,
        current_company: manualForm.company.trim() || undefined,
        current_position: manualForm.position.trim() || undefined,
        years_of_experience: Number(manualForm.experience) || 0,
        notes: manualForm.notes.trim() || undefined,
        confirm_duplicate: manualConfirmDuplicate,
      });

      const extra = [
        manualForm.notes.trim(),
        manualForm.linkedInUrl.trim() && `LinkedIn: ${manualForm.linkedInUrl.trim()}`,
      ].filter(Boolean).join('\n');
      if (extra) await candidatesApi.addNote(created.id, extra).catch(() => undefined);

      setIsManualModalOpen(false);
      reload();

      showToast({
        type: 'success',
        title: 'Thêm Ứng Viên Sourcing Thành Công!',
        message: `Đã đưa ứng viên vào vị trí ${created.job_title || ''} từ nguồn ${created.source || manualForm.source}`,
        candidateName: created.full_name,
        trackingCode: created.tracking_code || undefined,
        jobTitle: created.job_title || undefined,
        source: created.source || manualForm.source,
        details: (created.related_applications && created.related_applications.length > 0)
          ? `Hệ thống đã tự động liên kết với ${created.related_applications.length} hồ sơ trước đó của ứng viên (bảo lưu dữ liệu cũ).`
          : undefined,
      });

      setManualJobId('');
      setManualCvUrl(null);
      setManualCvFileName('');
      setManualDupCheck(null);
      setManualConfirmDuplicate(false);
      setManualForm({
        name: '',
        email: '',
        phone: '',
        linkedInUrl: '',
        company: '',
        position: '',
        university: '',
        experience: '',
        source: 'LinkedIn Sourcing',
        notes: '',
      });
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Không Thêm Được Ứng Viên',
        message: err instanceof ApiError ? err.message : 'Có lỗi xảy ra khi lưu ứng viên.',
      });
    } finally {
      setManualSaving(false);
    }
  };

  // ==========================================
  // FILTERING LOGIC
  // ==========================================
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      // 1. Search keyword (case-insensitive & accent-insensitive)
      if (searchTerm.trim()) {
        const s = Math.max(
          getSearchScore(c.name, searchTerm),
          getSearchScore(c.id, searchTerm),
          getSearchScore(c.email, searchTerm),
          getSearchScore(c.phone, searchTerm),
          getSearchScore(c.latestPosition, searchTerm),
          getSearchScore(c.university, searchTerm)
        );
        if (s === 0) return false;
      }

      // 2. Tag filter
      if (selectedTag !== 'all' && !c.tags.includes(selectedTag)) {
        return false;
      }

      // 3. Status filter
      if (selectedStatus !== 'all') {
        const matchesStatus =
          c.latestStatus === selectedStatus ||
          (selectedStatus === 'Phỏng vấn' && (c.latestStatus === 'Đang phỏng vấn' || c.latestStatusCode === 'interviewing')) ||
          (selectedStatus === 'Đề xuất Offer' && (c.latestStatus === 'Đề xuất offer' || c.latestStatusCode === 'offered')) ||
          (selectedStatus === 'Hồ sơ mới' && c.latestStatusCode === 'submitted') ||
          (selectedStatus === 'Sàng lọc' && c.latestStatusCode === 'screening') ||
          (selectedStatus === 'Đã nhận việc' && (c.latestStatus === 'Đã onboard' || c.latestStatusCode === 'hired' || c.latestStatusCode === 'onboarded')) ||
          (selectedStatus === 'Đã từ chối' && (c.latestStatus === 'Đã loại' || c.latestStatusCode === 'rejected')) ||
          (selectedStatus === 'Ứng viên rút' && c.latestStatusCode === 'withdrawn');
        if (!matchesStatus) {
          return false;
        }
      }

      // 4. Source filter
      if (selectedSource !== 'all' && c.source !== selectedSource) {
        return false;
      }

      // 5. Salary Range filter
      if (selectedSalaryRange !== 'all' && c.salaryRange !== selectedSalaryRange) {
        return false;
      }

      // 6. Skill filter
      if (selectedSkill !== 'all' && !c.skills.some((s) => s.toLowerCase() === selectedSkill.toLowerCase())) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (searchTerm.trim()) {
        const scoreA = Math.max(
          getSearchScore(a.name, searchTerm),
          getSearchScore(a.id, searchTerm),
          getSearchScore(a.email, searchTerm),
          getSearchScore(a.phone, searchTerm),
          getSearchScore(a.latestPosition, searchTerm),
          getSearchScore(a.university, searchTerm)
        );
        const scoreB = Math.max(
          getSearchScore(b.name, searchTerm),
          getSearchScore(b.id, searchTerm),
          getSearchScore(b.email, searchTerm),
          getSearchScore(b.phone, searchTerm),
          getSearchScore(b.latestPosition, searchTerm),
          getSearchScore(b.university, searchTerm)
        );
        if (scoreA !== scoreB) return scoreB - scoreA;
      }
      return 0;
    });
  }, [candidates, searchTerm, selectedTag, selectedStatus, selectedSource, selectedSalaryRange, selectedSkill]);

  // Danh sách tags & skills duy nhất phục vụ filter dropdown
  const allUniqueTags = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => c.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [candidates]);

  const allUniqueSkills = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => c.skills.forEach((s) => set.add(s)));
    return Array.from(set);
  }, [candidates]);

  // ==========================================
  // PHÂN TRANG (PAGINATION: 20 DÒNG / TRANG)
  // ==========================================
  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const tableTopRef = useRef<HTMLDivElement>(null);

  // Tự động trở về trang 1 khi thay đổi điều kiện lọc hoặc tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedTag, selectedStatus, selectedSource, selectedSalaryRange, selectedSkill]);

  const totalPages = Math.max(1, Math.ceil(filteredCandidates.length / ITEMS_PER_PAGE));

  const currentCandidates = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCandidates.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCandidates, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    tableTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-6 antialiased font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={clsx(
            'fixed bottom-6 right-6 z-50 p-4 rounded-3xl border shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-md w-full',
            typeof toast === 'string'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : toast.type === 'error'
              ? 'bg-rose-50/95 text-rose-900 border-rose-200 backdrop-blur-xs'
              : toast.type === 'warning'
              ? 'bg-amber-50/95 text-amber-900 border-amber-200 backdrop-blur-xs'
              : 'bg-white/95 text-slate-800 border-emerald-200 ring-2 ring-emerald-500/15 backdrop-blur-xs'
          )}
        >
          {typeof toast === 'string' ? (
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold">{toast}</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 font-black text-xs text-slate-900">
                  {toast.type === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : toast.type === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span>{toast.title}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setToast(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer font-bold px-1"
                >
                  ✕
                </button>
              </div>
              <p className="text-slate-600 font-medium text-[11px] leading-relaxed">{toast.message}</p>
              {(toast.candidateName || toast.trackingCode || toast.jobTitle) && (
                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-2 text-[10px]">
                  {toast.candidateName && (
                    <div>
                      <span className="text-slate-400 font-medium block">Ứng viên:</span>
                      <strong className="text-slate-900 font-bold truncate block">{toast.candidateName}</strong>
                    </div>
                  )}
                  {toast.trackingCode && (
                    <div>
                      <span className="text-slate-400 font-medium block">Mã hồ sơ:</span>
                      <strong className="font-mono text-blue-700 bg-blue-50 px-1 py-0.5 rounded block truncate">{toast.trackingCode}</strong>
                    </div>
                  )}
                  {toast.jobTitle && (
                    <div className="col-span-2">
                      <span className="text-slate-400 font-medium block">Vị trí:</span>
                      <strong className="text-slate-800 truncate block">{toast.jobTitle}</strong>
                    </div>
                  )}
                  {toast.source && (
                    <div className="col-span-2">
                      <span className="text-slate-400 font-medium block">Nguồn Sourcing:</span>
                      <strong className="text-indigo-700">{toast.source}</strong>
                    </div>
                  )}
                </div>
              )}
              {toast.details && (
                <p className="text-[10px] text-emerald-800 bg-emerald-50/80 p-2 rounded-xl font-semibold border border-emerald-100">
                  {toast.details}
                </p>
              )}
            </div>
          )}
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
            <span className="text-slate-700 font-bold">Hồ sơ ứng viên hợp nhất</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-8 h-8 text-blue-600" />
            <span>Quản Lý Hồ Sơ Ứng Viên Hợp Nhất</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Toàn bộ cơ sở dữ liệu Talent Pool lưu trữ lịch sử nhiều lần nộp, hỗ trợ tìm lại hồ sơ cũ và tự động bóc tách CV.
          </p>
        </div>

        {/* Nút Hành Động Header (S5-08 & S4-03) */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setManualJobId('');
              setManualCvUrl(null);
              setManualCvFileName('');
              setManualDupCheck(null);
              setManualConfirmDuplicate(false);
              setManualForm({
                name: '', email: '', phone: '', linkedInUrl: '', company: '', position: '', university: '',
                experience: '', source: 'LinkedIn Sourcing', notes: '',
              });
              setIsManualModalOpen(true);
            }}
            className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
          >
            <Linkedin className="w-4 h-4 fill-current" />
            <span>+ Thêm Ứng Viên Sourcing (LinkedIn)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setUploadFile(null);
              setParsedData(null);
              setIsUploadModalOpen(true);
            }}
            className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-black text-white font-extrabold text-xs shadow-lg shadow-slate-900/20 flex items-center gap-2 transition-all transform active:scale-95 cursor-pointer"
          >
            <Upload className="w-4 h-4 stroke-[2.5]" />
            <span>+ Tải CV Lên (Tự Động Bóc Tách)</span>
          </button>
        </div>
      </div>

      {/* 2. STATS KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
          <div className="text-slate-400 text-xs font-bold flex items-center justify-between">
            <span>Tổng hồ sơ Talent Pool</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{candidates.length}</div>
          <p className="text-[11px] text-slate-400">Đã hợp nhất lịch sử ứng tuyển</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
          <div className="text-emerald-600 text-xs font-bold flex items-center justify-between">
            <span>Đang trong Pipeline</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700">
            {candidates.filter((c) =>
              ['submitted', 'screening', 'interviewing', 'offered'].includes(c.latestStatusCode || '') ||
              ['Hồ sơ mới', 'Sàng lọc', 'Phỏng vấn', 'Đang phỏng vấn', 'Đề xuất Offer', 'Đề xuất offer'].includes(c.latestStatus)
            ).length}
          </div>
          <p className="text-[11px] text-emerald-600/80">Đang xử lý trong quy trình tuyển dụng</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
          <div className="text-teal-600 text-xs font-bold flex items-center justify-between">
            <span>Đã nhận việc thành công</span>
            <UserCheck className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-700">
            {candidates.filter((c) =>
              ['hired', 'onboarded'].includes(c.latestStatusCode || '') ||
              ['Đã nhận việc', 'Đã onboard'].includes(c.latestStatus)
            ).length}
          </div>
          <p className="text-[11px] text-teal-600/80">Nhân sự nội bộ chính thức</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
          <div className="text-amber-600 text-xs font-bold flex items-center justify-between">
            <span>Hồ sơ lưu trữ / Đã rút</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700">
            {candidates.filter((c) =>
              ['rejected', 'withdrawn'].includes(c.latestStatusCode || '') ||
              ['Đã từ chối', 'Đã loại', 'Ứng viên rút', 'Lưu trữ tiềm năng'].includes(c.latestStatus)
            ).length}
          </div>
          <p className="text-[11px] text-amber-600/80">Sẵn sàng Re-engage cho vị trí mới</p>
        </div>
      </div>

      {/* 3. TÌM KIẾM & LỌC NÂNG CAO (ADVANCED FILTER BAR - User Story 2 & 3) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        {/* Row 1: Search box & Export Excel Button (User Story 3) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-lg">
            <SearchAutocompleteInput
              value={searchTerm}
              onChange={(val) => setSearchTerm(val)}
              onSelectSuggestion={(item) => setSearchTerm(item.title)}
              placeholder="Tìm theo tên, email, SĐT, vị trí, trường (có dấu hoặc không dấu)..."
              scope="candidates"
              size="sm"
              localSuggestions={candidates.map((c) => ({
                id: c.id,
                title: c.name,
                subtitle: `${c.email} • ${c.phone} • ${c.latestPosition}`,
                category: "candidate",
                category_label: "Ứng viên",
              }))}
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Nút Xuất Excel (Export) đặt cạnh ô tìm kiếm theo đúng User Story 3 */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-4 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Xuất danh sách hồ sơ ra tệp Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Xuất Excel ({filteredCandidates.length})</span>
            </button>

            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3.5 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Đặt lại toàn bộ bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đặt lại</span>
            </button>
          </div>
        </div>

        {/* Row 2: Bộ lọc đa điều kiện (Tag, Trạng thái cũ, Nguồn, Khoảng lương, Kỹ năng) */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          {/* Lọc theo Tag */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-500 mb-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-purple-600" />
              <span>Nhãn (Tag)</span>
            </label>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              <option value="all">Tất cả nhãn</option>
              {allUniqueTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc theo Trạng thái cũ/gần nhất */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-500 mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-600" />
              <span>Trạng thái gần nhất</span>
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Hồ sơ mới">Hồ sơ mới</option>
              <option value="Sàng lọc">Sàng lọc</option>
              <option value="Phỏng vấn">Phỏng vấn</option>
              <option value="Đề xuất Offer">Đề xuất Offer</option>
              <option value="Đã nhận việc">Đã nhận việc</option>
              <option value="Ứng viên rút">Ứng viên rút</option>
              <option value="Đã từ chối">Đã từ chối</option>
              <option value="Lưu trữ tiềm năng">Lưu trữ tiềm năng</option>
            </select>
          </div>

          {/* Lọc theo Nguồn ứng viên */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-500 mb-1 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-blue-600" />
              <span>Nguồn ứng viên</span>
            </label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              <option value="all">Tất cả nguồn</option>
              {(sourceCategories && sourceCategories.length > 0) ? (
                sourceCategories.filter((c) => c.is_active).map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))
              ) : (
                <>
                  <option value="LinkedIn Sourcing">LinkedIn Sourcing</option>
                  <option value="TopCV">TopCV</option>
                  <option value="VietnamWorks">VietnamWorks</option>
                  <option value="Referral Nội Bộ">Referral Nội Bộ</option>
                  <option value="Headhunter Agency">Headhunter Agency</option>
                  <option value="Website Công Ty">Website Công Ty</option>
                </>
              )}
            </select>
          </div>

          {/* Lọc theo Khoảng lương */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-500 mb-1 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-emerald-600" />
              <span>Khoảng lương</span>
            </label>
            <select
              value={selectedSalaryRange}
              onChange={(e) => setSelectedSalaryRange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              <option value="all">Tất cả mức lương</option>
              <option value="under_20">Dưới 20 Triệu VNĐ</option>
              <option value="20_35">20 - 35 Triệu VNĐ</option>
              <option value="35_50">35 - 50 Triệu VNĐ</option>
              <option value="above_50">Trên 50 Triệu VNĐ</option>
            </select>
          </div>

          {/* Lọc theo Kỹ năng */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-500 mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-600" />
              <span>Kỹ năng cốt lõi</span>
            </label>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
            >
              <option value="all">Tất cả kỹ năng</option>
              {allUniqueSkills.map((skill) => (
                <option key={skill} value={skill}>
                  {skill}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. DATA TABLE: TOÀN BỘ LỊCH SỬ ỨNG VIÊN (User Story 1) */}
      <div ref={tableTopRef} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Ứng Viên</th>
                <th className="py-4 px-4">Vị Trí & Lịch Sử Nộp</th>
                <th className="py-4 px-4">Kỹ Năng & Nhãn (Tags)</th>
                <th className="py-4 px-4 text-center">Trạng Thái</th>
                <th className="py-4 px-4">Mức Lương & Nguồn</th>
                <th className="py-4 px-6 text-right">Chi Tiết Hồ Sơ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {currentCandidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="space-y-2">
                      <Users className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
                      <p className="font-bold text-slate-600">Không tìm thấy ứng viên phù hợp</p>
                      <p className="text-xs text-slate-400">
                        Vui lòng nới lỏng các điều kiện lọc nâng cao hoặc tải thêm CV mới.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentCandidates.map((cand) => (
                  <tr key={cand.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Cột 1: Thông tin ứng viên */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {cand.avatar ? (
                          <img
                            src={cand.avatar}
                            alt={cand.name}
                            className="w-10 h-10 rounded-2xl object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-2xl bg-sky-100 text-[#0284C7] font-extrabold text-sm flex items-center justify-center border border-sky-200 shrink-0 select-none shadow-2xs">
                            {(cand.name || "U").trim().split(" ").slice(-1)[0][0]?.toUpperCase() || "U"}
                          </div>
                        )}
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/recruiter/candidates/${cand.id}`}
                              className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 cursor-pointer"
                            >
                              {cand.name}
                            </Link>
                            {cand.linkedInUrl && (
                              <a
                                href={cand.linkedInUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title={`Mở trang cá nhân LinkedIn: ${cand.linkedInUrl}`}
                                className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[#0077b5]/10 text-[#0077b5] hover:bg-[#0077b5] hover:text-white transition-all shadow-2xs shrink-0"
                              >
                                <Linkedin className="w-3 h-3 fill-current" />
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span className="font-mono font-bold text-slate-500">{cand.id}</span>
                            <span>&bull;</span>
                            <span>{cand.phone}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                            {cand.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Cột 2: Vị trí & Lịch sử nộp */}
                    <td className="py-4 px-4 max-w-xs">
                      <div className="space-y-1">
                        <div className="font-extrabold text-slate-800 line-clamp-1">
                          {cand.latestPosition}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{cand.university}</span>
                        </div>
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold">
                          <span>{cand.applications.length} lần ứng tuyển</span>
                        </div>
                      </div>
                    </td>

                    {/* Cột 3: Kỹ năng & Nhãn */}
                    <td className="py-4 px-4 max-w-xs">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap gap-1">
                          {cand.tags.map((tag, tIdx) => (
                            <span
                              key={tIdx}
                              className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {cand.skills.slice(0, 3).map((skill, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[9px] font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                          {cand.skills.length > 3 && (
                            <span className="text-[9px] text-slate-400 font-bold">
                              +{cand.skills.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Cột 4: Trạng thái gần nhất */}
                    <td className="py-4 px-4 text-center">
                      {(() => {
                        const code = cand.latestStatusCode || '';
                        const st = cand.latestStatus;

                        if (code === 'interviewing' || st === 'Phỏng vấn' || st === 'Đang phỏng vấn') {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-extrabold shadow-2xs">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Phỏng vấn
                            </span>
                          );
                        }
                        if (code === 'offered' || st === 'Đề xuất Offer' || st === 'Đề xuất offer') {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold shadow-2xs">
                              <Check className="w-3 h-3 text-emerald-600" />
                              Đề xuất Offer
                            </span>
                          );
                        }
                        if (code === 'hired' || code === 'onboarded' || st === 'Đã nhận việc' || st === 'Đã onboard') {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-extrabold shadow-2xs">
                              <CheckCircle2 className="w-3 h-3 text-teal-600" />
                              {st === 'Đã onboard' ? 'Đã onboard' : 'Đã nhận việc'}
                            </span>
                          );
                        }
                        if (code === 'screening' || st === 'Sàng lọc') {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-extrabold shadow-2xs">
                              <Filter className="w-3 h-3 text-purple-600" />
                              Sàng lọc
                            </span>
                          );
                        }
                        if (code === 'submitted' || st === 'Hồ sơ mới') {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-extrabold shadow-2xs">
                              <FileText className="w-3 h-3 text-blue-600" />
                              Hồ sơ mới
                            </span>
                          );
                        }
                        if (code === 'withdrawn' || st === 'Ứng viên rút') {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-[11px] font-extrabold shadow-2xs">
                              <ArrowLeft className="w-3 h-3 text-orange-600" />
                              Ứng viên rút
                            </span>
                          );
                        }
                        if (code === 'rejected' || st === 'Đã từ chối' || st === 'Đã loại') {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-extrabold shadow-2xs">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              Đã từ chối
                            </span>
                          );
                        }
                        if (st === 'Lưu trữ tiềm năng') {
                          return (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-extrabold shadow-2xs">
                              <Sparkles className="w-3 h-3 text-blue-600" />
                              Lưu trữ tiềm năng
                            </span>
                          );
                        }
                        return (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-extrabold">
                            {st || 'Chưa cập nhật'}
                          </span>
                        );
                      })()}
                    </td>

                    {/* Cột 5: Mức lương & Nguồn */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="font-extrabold text-blue-600 flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>{cand.expectedSalary}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 flex-wrap">
                          <span>Nguồn:</span>
                          <strong className="text-slate-700">{cand.source}</strong>
                          {cand.source?.includes('LinkedIn') && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#0077b5]/10 text-[#0077b5] text-[9px] font-bold">
                              <Linkedin className="w-2.5 h-2.5 fill-current" /> Sourced
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Cập nhật: {cand.updatedAt}
                        </div>
                      </div>
                    </td>

                    {/* Cột 6: Nút Xem chi tiết hồ sơ */}
                    <td className="py-4 px-6 text-right">
                      <Link
                        href={`/recruiter/candidates/${cand.id}`}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs inline-flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <span>Hồ sơ hợp nhất</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
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
            totalItems={filteredCandidates.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={handlePageChange}
            itemLabel="hồ sơ"
          />
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. MODAL: TỰ ĐỘNG BÓC TÁCH CV (AI RESUME PARSER - User Story 3) */}
      {/* ======================================================== */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 p-6 sm:p-7 space-y-6 animate-in zoom-in-95 duration-200 text-xs">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900">
                    Bóc Tách CV Thông Minh (AI Resume Parser)
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Tải lên file CV PDF/DOCX, hệ thống tự động trích xuất Tên, SĐT, Email và Kỹ năng.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Vùng Dropzone Upload */}
            {!parsedData && !isParsing && (
              <div className="space-y-4">
                <label className="block border-2 border-dashed border-blue-200 hover:border-blue-400 rounded-3xl p-8 bg-blue-50/30 hover:bg-blue-50/60 transition-all text-center cursor-pointer group">
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-white border border-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform">
                    <Upload className="w-7 h-7" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Kéo thả file CV vào đây hoặc bấm để chọn tệp
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Hỗ trợ tệp định dạng .PDF, .DOCX (Dung lượng tối đa 10MB)
                  </p>
                </label>

                {/* Nút Tải CV Mẫu theo yêu cầu User */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <span>Chưa có tệp CV để thử nghiệm?</span>
                        <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full font-bold">Khuyên dùng</span>
                      </h5>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Tải tệp CV mẫu chuẩn PDF (đầy đủ Họ tên, SĐT, Kỹ năng, Học vấn) để trải nghiệm tính năng bóc tách tự động
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadSampleCv}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-blue-50 border border-blue-200 hover:border-blue-300 text-blue-700 font-extrabold text-xs flex items-center gap-2 shadow-xs transition-all shrink-0 cursor-pointer active:scale-95"
                    title="Tải tệp CV mẫu định dạng .PDF về máy tính"
                  >
                    <Download className="w-4 h-4 stroke-[2.5]" />
                    <span>Tải CV Mẫu (.PDF)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Progress Bar: Đang quét dữ liệu... (User Story 3) */}
            {isParsing && (
              <div className="py-8 space-y-4 text-center">
                <div className="w-14 h-14 rounded-3xl bg-blue-600 text-white flex items-center justify-center mx-auto animate-bounce shadow-lg shadow-blue-500/30">
                  <Sparkles className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <h4 className="font-black text-sm text-slate-900">
                    Đang Quét & Bóc Tách Dữ Liệu CV...
                  </h4>
                  <p className="text-xs text-blue-600 font-bold">{parseStageText}</p>
                </div>

                {/* Progress bar visual */}
                <div className="max-w-md mx-auto w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${parseProgress}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-400">
                  {parseProgress}% hoàn thành
                </span>
              </div>
            )}

            {/* Kết quả bóc tách tự động (Pre-fill Form - AC1/AC2/AC3) */}
            {parsedData && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {(parsedData.name || parsedData.email || parsedData.phone) ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Hệ thống đã tự động bóc tách thông tin từ CV (AC1/AC2)</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full font-semibold">
                      Recruiter có thể sửa đổi • Không tự ghi đè
                    </span>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Tệp scan/ảnh không có văn bản. Vui lòng nhập tay thông tin (AC3)</span>
                    </div>
                    <span className="text-[10px] text-amber-800 bg-amber-100/70 px-2.5 py-0.5 rounded-full font-semibold">
                      Tệp gốc lưu an toàn • Quy trình không bị gián đoạn
                    </span>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-1 flex items-center justify-between">
                        <span>Họ và tên ứng viên <strong className="text-rose-500">*</strong></span>
                        {parsedData.name && <span className="text-[9px] text-blue-600 bg-blue-50 px-1 rounded">Điền sẵn từ CV</span>}
                      </label>
                      <input
                        type="text"
                        placeholder="Nhập hoặc chỉnh sửa họ tên..."
                        value={parsedData.name}
                        onChange={(e) => setParsedData({ ...parsedData, name: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-1 flex items-center justify-between">
                        <span>Số điện thoại <strong className="text-rose-500">*</strong></span>
                        {parsedData.phone && <span className="text-[9px] text-blue-600 bg-blue-50 px-1 rounded">Điền sẵn từ CV</span>}
                      </label>
                      <input
                        type="text"
                        placeholder="Nhập hoặc chỉnh sửa số điện thoại..."
                        value={parsedData.phone}
                        onChange={(e) => setParsedData({ ...parsedData, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-1 flex items-center justify-between">
                        <span>Email liên hệ <strong className="text-rose-500">*</strong></span>
                        {parsedData.email && <span className="text-[9px] text-blue-600 bg-blue-50 px-1 rounded">Điền sẵn từ CV</span>}
                      </label>
                      <input
                        type="email"
                        placeholder="Nhập hoặc chỉnh sửa email..."
                        value={parsedData.email}
                        onChange={(e) => setParsedData({ ...parsedData, email: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-bold mb-1">
                        Học vấn / Trường đào tạo
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Đại học Bách Khoa..."
                        value={parsedData.university}
                        onChange={(e) =>
                          setParsedData({ ...parsedData, university: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {parsedData.skills && parsedData.skills.length > 0 && (
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">
                        Kỹ năng bóc tách từ CV ({parsedData.skills.length})
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {parsedData.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 text-[11px] font-bold"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 font-bold mb-1">
                    Ứng tuyển vào tin tuyển dụng <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={targetJobId}
                    onChange={(e) => setTargetJobId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">— Chọn tin đang đăng tuyển —</option>
                    {(openJobs || []).map((j) => (
                      <option key={j.id} value={j.id}>{j.title}{j.department_name ? ` — ${j.department_name}` : ''}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setParsedData(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs cursor-pointer hover:bg-slate-50"
                  >
                    Quét Lại Tệp Khác
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveParsedCandidate}
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>{saving ? 'Đang Lưu Hồ Sơ...' : 'Xác Nhận & Thêm Vào Pipeline'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL: THÊM ỨNG VIÊN SOURCING (LINKEDIN) - S5-08 */}
      {/* ======================================================== */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200 text-xs max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Linkedin className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900">
                    Thêm Ứng Viên Sourcing (LinkedIn)
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Nhập tay thông tin ứng viên tìm được từ LinkedIn hoặc nguồn ngoài vào pipeline tuyển dụng.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Họ và tên ứng viên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Hoàng Đình Trọng"
                  value={manualForm.name}
                  onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              {/* Link LinkedIn - Yêu cầu cốt lõi của User Story S5-08 */}
              <div>
                <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Linkedin className="w-3.5 h-3.5 text-[#0077b5] fill-current" />
                  <span>Đường dẫn LinkedIn (Profile Link)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://www.linkedin.com/in/username"
                  value={manualForm.linkedInUrl}
                  onChange={(e) => setManualForm({ ...manualForm, linkedInUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Email liên hệ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ungvien@gmail.com"
                    value={manualForm.email}
                    onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                    onBlur={() => runManualDuplicateCheck()}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Số điện thoại <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0987654321"
                    value={manualForm.phone}
                    onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                    onBlur={() => runManualDuplicateCheck()}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Vị trí ứng tuyển */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Vị trí ứng tuyển <span className="text-rose-500">*</span>
                </label>
                <select
                  value={manualJobId}
                  onChange={(e) => {
                    const newJobId = e.target.value;
                    setManualJobId(newJobId);
                    runManualDuplicateCheck(undefined, undefined, newJobId);
                  }}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
                >
                  <option value="">-- Chọn tin tuyển dụng đang mở --</option>
                  {(openJobs || []).map((j) => (
                    <option key={j.id} value={j.id}>{j.title}{j.department_name ? ` — ${j.department_name}` : ''}</option>
                  ))}
                </select>
              </div>

              {/* Duplicate check status indicator */}
              {manualDupChecking && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-[11px] flex items-center gap-2 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                  <span>Đang kiểm tra trùng lặp hồ sơ thời gian thực...</span>
                </div>
              )}

              {/* AC2: Duplicate Warning / Block Banners */}
              {manualDupCheck?.same_job_conflict && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-rose-900">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Ứng viên đã có hồ sơ đang xử lý tại vị trí này!</span>
                  </div>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    Mã hồ sơ: <strong className="font-mono bg-rose-100 px-1 py-0.5 rounded">{manualDupCheck.active_application_in_job?.tracking_code}</strong> (Trạng thái: <strong>{manualDupCheck.active_application_in_job?.status}</strong>). Hệ thống chặn tạo trùng lặp trong cùng một đợt tuyển dụng.
                  </p>
                </div>
              )}

              {manualDupCheck?.is_duplicate && !manualDupCheck.same_job_conflict && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Phát hiện ứng viên đã có {manualDupCheck.existing_applications.length} hồ sơ trong hệ thống</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Ứng viên đã từng nộp hồ sơ ở vị trí khác. Hệ thống sẽ tự động liên kết hồ sơ của ứng viên theo mã cá nhân (person_key) mà không làm mất lịch sử và CV cũ.
                  </p>
                  <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                    {manualDupCheck.existing_applications.map((app) => (
                      <div key={app.id} className="flex items-center justify-between bg-white/80 p-2 rounded-xl border border-amber-200/60 text-[11px]">
                        <span className="font-bold text-slate-800">{app.job_title}</span>
                        <span className="font-mono text-[10px] text-slate-500">{app.tracking_code}</span>
                      </div>
                    ))}
                  </div>
                  <label className="flex items-center gap-2 text-[11px] font-bold text-amber-950 cursor-pointer pt-2 border-t border-amber-200/80">
                    <input
                      type="checkbox"
                      checked={manualConfirmDuplicate}
                      onChange={(e) => setManualConfirmDuplicate(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-amber-300 cursor-pointer"
                    />
                    <span>Xác nhận tiếp tục thêm ứng viên vào pipeline vị trí này (bảo lưu dữ liệu cũ)</span>
                  </label>
                </div>
              )}

              {/* Thông tin công ty & Kinh nghiệm */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Công ty hiện tại</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: VNG, FPT..."
                    value={manualForm.company}
                    onChange={(e) => setManualForm({ ...manualForm, company: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Số năm kinh nghiệm</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ví dụ: 3"
                    value={manualForm.experience}
                    onChange={(e) => setManualForm({ ...manualForm, experience: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Kênh Sourcing */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">Kênh Sourcing</label>
                <select
                  value={manualForm.source}
                  onChange={(e) => setManualForm({ ...manualForm, source: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
                >
                  <option value="LinkedIn Sourcing">LinkedIn Sourcing (Mặc định)</option>
                  <option value="Headhunter Agency">Headhunter Agency</option>
                  <option value="TopCV Chủ động">TopCV Chủ động</option>
                  <option value="VietnamWorks Chủ động">VietnamWorks Chủ động</option>
                  <option value="Referral Nội Bộ">Referral Nội Bộ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              {/* Upload CV - Yêu cầu User Story S5-08 */}
              <div>
                <label className="block font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Upload hồ sơ CV (PDF / DOCX)</span>
                  </div>
                  {manualCvFileName && (
                    <button
                      type="button"
                      onClick={() => {
                        setManualCvUrl(null);
                        setManualCvFileName('');
                      }}
                      className="text-[10px] text-rose-600 hover:underline cursor-pointer font-bold"
                    >
                      Xóa CV
                    </button>
                  )}
                </label>
                <label className="block p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition-colors text-center cursor-pointer">
                  <input type="file" accept=".pdf,.docx,.doc" className="hidden" onChange={handleManualCvFileChange} />
                  <FileText className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs font-bold text-slate-700">{manualCvFileName || (manualCvUploading ? 'Đang tải tệp lên...' : 'Kéo thả CV hoặc bấm để chọn tệp')}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Hỗ trợ định dạng PDF, DOCX (Dung lượng tối đa 10MB)
                  </p>
                </label>
              </div>

              {/* Ghi chú ban đầu */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">Ghi chú Sourcing ban đầu</label>
                <textarea
                  rows={2}
                  placeholder="Ứng viên chủ động tiếp cận qua LinkedIn InMail, profile mạnh về kiến trúc hệ thống..."
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={manualSaving || Boolean(manualDupCheck?.same_job_conflict) || (Boolean(manualDupCheck?.is_duplicate) && !manualConfirmDuplicate)}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {manualSaving ? 'Đang Lưu...' : 'Thêm Ứng Viên Vào Pipeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
