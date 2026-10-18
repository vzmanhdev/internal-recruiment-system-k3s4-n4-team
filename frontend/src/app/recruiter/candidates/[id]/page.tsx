'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Briefcase,
  DollarSign,
  Linkedin,
  Download,
  FileText,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  Tag,
  Star,
  MessageSquare,
  Send,
  Plus,
  X,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Building2,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Printer,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ShieldCheck,
  AlertCircle,
  Award,
} from 'lucide-react';
import clsx from 'clsx';
import type { UnifiedCandidate, CandidateEmailLog } from '@/features/candidates/types';
import { candidatesApi } from '@/features/candidates/api';
import { fileUrl } from '@/services/file.service';
import { useApiData } from '@/hooks/useApiData';
import { ErrorState, LoadingState } from '@/components/ui/DataStates';
import { ApiError } from '@/lib/api-client';

export interface UnifiedCandidateDetailViewProps {
  backHref?: string;
  backLabel?: string;
}

export function UnifiedCandidateDetailView({
  backHref = '/recruiter/candidates',
  backLabel = 'Hồ sơ hợp nhất',
}: UnifiedCandidateDetailViewProps) {
  const params = useParams();
  const router = useRouter();
  const appId = Number(params?.id);

  // Unified profile of the person behind this application (S4-09): real notes, tags, history, CV.
  const { data, error, loading, reload, setData } = useApiData(() => candidatesApi.profile(appId), [appId]);
  const candidate = data as (UnifiedCandidate & { cvUrl: string | null; applicationId: number }) | null;
  const setCandidate = (fn: (prev: UnifiedCandidate) => UnifiedCandidate) =>
    setData((prev) => (prev ? ({ ...prev, ...fn(prev) } as typeof prev) : prev));
  const [toast, setToast] = useState<string | null>(null);

  // Tab switch in Center column: Timeline vs Email Logs
  const [centerTab, setCenterTab] = useState<'timeline' | 'emails'>('timeline');

  // Modal Email Log detail & Compose state
  const [selectedEmail, setSelectedEmail] = useState<CandidateEmailLog | null>(null);
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [composeForm, setComposeForm] = useState({
    subject: '',
    template: 'offer' as 'offer' | 'interview' | 'rejection' | 'reminder',
    content: '',
  });
  const [sending, setSending] = useState(false);
  const openCompose = (kind: 'contact' | 'reengage' = 'contact') => {
    if (!candidate) return;
    setComposeForm({
      subject: kind === 'reengage' ? `Mời ứng tuyển vị trí mới — ${candidate.name}` : `[Thông báo tuyển dụng] Trao đổi cơ hội việc làm cùng ${candidate.name}`,
      template: kind === 'reengage' ? 'reminder' : 'offer',
      content: kind === 'reengage'
        ? `Kính gửi ${candidate.name},\n\nChúng tôi có vị trí mới phù hợp với hồ sơ của bạn và trân trọng mời bạn ứng tuyển.`
        : `Kính gửi ${candidate.name},\n\n`,
    });
    setIsComposeModalOpen(true);
  };

  // Tag state
  const [newTagInput, setNewTagInput] = useState('');

  // Internal Note state
  const [newNoteText, setNewNoteText] = useState('');

  // PDF Viewer zoom + the real CV file loaded through the authorised download endpoint
  const [zoomLevel, setZoomLevel] = useState(100);
  const [cvBlobUrl, setCvBlobUrl] = useState<string | null>(null);
  const [cvError, setCvError] = useState<string | null>(null);
  const cvPath = candidate?.cvUrl || null;
  useEffect(() => {
    if (!cvPath) return;
    let revoked: string | null = null;
    let active = true;
    const token = localStorage.getItem('access_token');
    fetch(fileUrl(cvPath), { headers: token ? { Authorization: `Bearer ${token}` } : {}, credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Không tìm thấy tệp CV hoặc bạn không có quyền xem.' : 'Không tải được CV.');
        const url = URL.createObjectURL(await res.blob());
        revoked = url;
        if (active) setCvBlobUrl(url);
      })
      .catch((e: Error) => active && setCvError(e.message));
    return () => { active = false; if (revoked) URL.revokeObjectURL(revoked); };
  }, [cvPath]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // ==========================================
  // TAG ACTIONS
  // ==========================================
  const saveTags = async (next: string[], message: string) => {
    if (!candidate) return;
    try {
      await candidatesApi.setTags(candidate.applicationId, next);
      setCandidate((prev) => ({ ...prev, tags: next }));
      showToast(message);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Không lưu được nhãn.');
    }
  };

  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim();
    if (!candidate || !clean || candidate.tags.includes(clean)) return;
    setNewTagInput('');
    void saveTags([...candidate.tags, clean], `Đã gắn thêm nhãn "${clean}" cho ứng viên.`);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!candidate) return;
    void saveTags(candidate.tags.filter((t) => t !== tagToRemove), `Đã xóa nhãn "${tagToRemove}".`);
  };

  // ==========================================
  // NOTE ACTIONS
  // ==========================================
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidate || !newNoteText.trim()) return;
    try {
      const n = await candidatesApi.addNote(candidate.applicationId, newNoteText.trim());
      setCandidate((prev) => ({
        ...prev,
        notes: [{ id: String(n.id), author: n.author_name || '—', role: '', createdAt: n.created_at ? new Date(n.created_at).toLocaleString('vi-VN') : '', content: n.content }, ...prev.notes],
      }));
      setNewNoteText('');
      showToast('Đã thêm ghi chú nội bộ.');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Không lưu được ghi chú.');
    }
  };

  const handleSendDirectEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidate || !composeForm.subject.trim() || !composeForm.content.trim()) return;
    setSending(true);
    try {
      const log = await candidatesApi.sendEmail(candidate.applicationId, composeForm.subject.trim(), composeForm.content);
      const entry: CandidateEmailLog = {
        id: String(log.id), subject: log.subject, templateType: composeForm.template, sentAt: new Date().toLocaleString('vi-VN'),
        sender: 'Bạn', recipientEmail: candidate.email, status: log.status, contentSnippet: composeForm.content.slice(0, 160),
      };
      setCandidate((prev) => ({ ...prev, emailLogs: [entry, ...(prev.emailLogs || [])] }));
      setIsComposeModalOpen(false);
      showToast(`Email "${log.subject}" đã được đưa vào hàng đợi gửi (trạng thái: ${log.status}).`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Không gửi được email.');
    } finally {
      setSending(false);
    }
  };

  // Re-engage = invite the candidate to apply again (real e-mail, pre-filled message)
  const handleReEngage = () => openCompose('reengage');

  if (loading) return <LoadingState />;
  if (error || !candidate) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-6 antialiased font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* 1. TOP NAVIGATION & ACTIONS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(backHref)}
            className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            title="Quay lại danh sách hồ sơ"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-0.5">
              <Link href={backHref} className="hover:text-blue-600 transition-colors">
                {backLabel}
              </Link>
              <span>&rsaquo;</span>
              <span className="font-mono text-slate-700 font-bold">{candidate.id}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>{candidate.name}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                {candidate.latestPosition}
              </span>
            </h1>
          </div>
        </div>

        {/* Quick actions top bar */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleReEngage}
            className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Mời Ứng Tuyển Lại (Re-engage)</span>
          </button>

          <a
            href={`mailto:${candidate.email}`}
            className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            title="Gửi Email trực tiếp"
          >
            <Mail className="w-4 h-4" />
          </a>

          <a
            href={candidate.linkedInUrl}
            target="_blank"
            rel="noreferrer"
            className="p-2.5 rounded-2xl bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 transition-colors shadow-xs"
            title="Mở hồ sơ LinkedIn"
          >
            <Linkedin className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* 2. CẤU TRÚC 3 CỘT (3-COLUMN LAYOUT THEO ĐÚNG YÊU CẦU CỦA USER STORY 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================= */}
        {/* CỘT 1: TRÁI (3.5 COLS) - AVATAR, THÔNG TIN CƠ BẢN & CV VIEWER */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card Thông tin cơ bản */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5 text-center">
            {/* Avatar & Badges */}
            <div className="relative inline-block mx-auto">
              {candidate.avatar ? (
                <img
                  src={candidate.avatar}
                  alt={candidate.name}
                  className="w-24 h-24 rounded-3xl object-cover border-4 border-blue-50 shadow-md mx-auto"
                />
              ) : (
                <div className="w-24 h-24 rounded-3xl bg-sky-100 text-[#0284C7] font-black text-2xl flex items-center justify-center border-4 border-blue-50 shadow-md mx-auto select-none">
                  {(candidate.name || "U").trim().split(" ").slice(-1)[0][0]?.toUpperCase() || "U"}
                </div>
              )}
              <span className="absolute bottom-0 right-0 p-1.5 rounded-xl bg-emerald-500 text-white shadow-md">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900">{candidate.name}</h2>
              <p className="text-xs font-mono font-bold text-slate-400">{candidate.id}</p>
              <div className="pt-1 flex items-center justify-center gap-1.5 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-extrabold border border-emerald-200">
                  {candidate.latestStatus}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                  {candidate.experienceYears}
                </span>
              </div>
            </div>

            {/* Chi tiết liên hệ */}
            <div className="border-t border-slate-100 pt-4 text-left space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  Email
                </span>
                <span className="font-bold text-slate-800 truncate max-w-[170px]">
                  {candidate.email}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" />
                  Điện thoại
                </span>
                <span className="font-bold text-slate-800">{candidate.phone}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />
                  Khu vực
                </span>
                <span className="font-bold text-slate-800">{candidate.address}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-2">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Học vấn
                </span>
                <span className="font-bold text-slate-800 truncate max-w-[170px]">
                  {candidate.university}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5" />
                  Lương mong muốn
                </span>
                <span className="font-extrabold text-blue-600">{candidate.expectedSalary}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5" />
                  Nguồn tuyển dụng
                </span>
                <span className="font-bold text-slate-800">{candidate.source}</span>
              </div>
            </div>
          </div>

          {/* CV PDF Viewer / Preview (User Story 4) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs text-slate-900">CV PDF Viewer</h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {candidate.cvFileName}
                  </span>
                </div>
              </div>

              {/* Toolbar Viewer */}
              <div className="flex items-center gap-1 text-slate-500">
                <button
                  type="button"
                  onClick={() => setZoomLevel((prev) => Math.max(prev - 10, 80))}
                  className="p-1 rounded hover:bg-slate-100"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-bold px-1">{zoomLevel}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((prev) => Math.min(prev + 10, 130))}
                  className="p-1 rounded hover:bg-slate-100"
                  title="Phóng to"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <a
                  href={cvBlobUrl || undefined}
                  download={candidate.cvFileName || 'cv'}
                  aria-disabled={!cvBlobUrl}
                  className="p-1 rounded hover:bg-slate-100 text-blue-600 ml-1"
                  title="Tải xuống CV"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Real CV file (PDF embedded; other formats downloadable) */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
              {!cvPath ? (
                <p className="p-6 text-center text-[11px] text-slate-500">Ứng viên chưa có CV đính kèm.</p>
              ) : cvError ? (
                <p className="p-6 text-center text-[11px] text-rose-600">{cvError}</p>
              ) : !cvBlobUrl ? (
                <p className="p-6 text-center text-[11px] text-slate-500">Đang tải CV...</p>
              ) : candidate.cvFileName.toLowerCase().endsWith('.pdf') ? (
                <iframe title={`CV ${candidate.name}`} src={cvBlobUrl} className="w-full h-[520px] bg-white"
                  style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }} />
              ) : (
                <p className="p-6 text-center text-[11px] text-slate-500">Định dạng này không xem trước được — hãy tải xuống để xem.</p>
              )}
              {cvBlobUrl && (
                <div className="py-2 text-center border-t border-slate-200 bg-white">
                  <a href={cvBlobUrl} target="_blank" rel="noopener" className="text-xs font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1">
                    <span>Mở xem toàn màn hình</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CỘT 2: GIỮA (5 COLS) - LỊCH SỬ ỨNG TUYỂN & NHẬT KÝ GIAO TIẾP */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
            {/* Tab Switcher: Lịch sử ứng tuyển vs Nhật ký giao tiếp */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCenterTab('timeline')}
                  className={clsx(
                    'font-black text-sm pb-2 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer',
                    centerTab === 'timeline'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-400 hover:text-slate-700'
                  )}
                >
                  <Clock className="w-4 h-4" />
                  <span>Lịch Sử Ứng Tuyển</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                    {candidate.applications.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCenterTab('emails')}
                  className={clsx(
                    'font-black text-sm pb-2 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer',
                    centerTab === 'emails'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-400 hover:text-slate-700'
                  )}
                >
                  <Mail className="w-4 h-4" />
                  <span>Nhật Ký Giao Tiếp</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                    {candidate.emailLogs?.length || 0}
                  </span>
                </button>
              </div>

              {centerTab === 'emails' && (
                <button
                  type="button"
                  onClick={() => openCompose()}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Soạn Thư</span>
                </button>
              )}
            </div>

            {/* CONTENT 1: LỊCH SỬ ỨNG TUYỂN (TIMELINE VIEW) */}
            {centerTab === 'timeline' && (
              <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {candidate.applications.map((app) => {
                  const isCurrent = app.status === 'active';

                  return (
                    <div key={app.id} className="relative space-y-3 group">
                      {/* Timeline Node Dot */}
                      <div
                        className={clsx(
                          'absolute -left-6 top-1 w-5 h-5 rounded-full border-4 border-white shadow-sm transition-transform group-hover:scale-125',
                          isCurrent ? 'bg-blue-600' : 'bg-slate-400'
                        )}
                      />

                      {/* Timeline Card */}
                      <div
                        className={clsx(
                          'p-5 rounded-2xl border transition-all space-y-3',
                          isCurrent
                            ? 'bg-gradient-to-br from-blue-50/50 via-white to-slate-50 border-blue-200 shadow-xs'
                            : 'bg-white border-slate-200/80 hover:bg-slate-50'
                        )}
                      >
                        {/* Header of Application */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-slate-900">
                                {app.jobTitle}
                              </span>
                              <span className="font-mono text-[10px] text-slate-400">
                                ({app.jobCode})
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{app.department}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={clsx(
                                'text-[10px] font-black px-2.5 py-0.5 rounded-full border',
                                app.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : app.status === 'hired'
                                  ? 'bg-teal-50 text-teal-800 border-teal-300'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                              )}
                            >
                              {app.stage}
                            </span>
                          </div>
                        </div>

                        {/* Detail Metrics */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 rounded-xl bg-slate-50">
                            <span className="text-[10px] text-slate-400 font-bold block">Ngày nộp</span>
                            <span className="font-extrabold text-slate-800">{app.appliedDate}</span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-50">
                            <span className="text-[10px] text-slate-400 font-bold block">
                              Độ phù hợp (Match)
                            </span>
                            <span className="font-black text-blue-600">{app.matchScore}% Phù hợp</span>
                          </div>
                        </div>

                        {/* Lương đề xuất vs Lương mong muốn */}
                        {(app.salaryProposed || app.salaryExpected) && (
                          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs space-y-1">
                            <div className="font-bold text-blue-900 flex items-center justify-between">
                              <span>Lương công ty đề xuất:</span>
                              <strong className="text-blue-700">{app.salaryProposed || '--'}</strong>
                            </div>
                            <div className="font-bold text-blue-900 flex items-center justify-between">
                              <span>Lương ứng viên mong muốn:</span>
                              <strong className="text-blue-700">{app.salaryExpected || '--'}</strong>
                            </div>
                          </div>
                        )}

                        {/* Nhận xét của Interviewer */}
                        {app.interviewerFeedback && (
                          <div className="space-y-1 text-xs">
                            <span className="font-extrabold text-slate-700 text-[11px] block">
                              Đánh giá từ Hội đồng phỏng vấn:
                            </span>
                            <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed font-normal italic">
                              &ldquo;{app.interviewerFeedback}&rdquo;
                            </p>
                          </div>
                        )}

                        {/* Ghi chú từng vòng */}
                        {app.roundNotes && app.roundNotes.length > 0 && (
                          <div className="space-y-1 text-xs">
                            <span className="font-extrabold text-slate-700 text-[11px] block">
                              Nhật ký các vòng:
                            </span>
                            <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                              {app.roundNotes.map((rn, rIdx) => (
                                <li key={rIdx}>{rn}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                          <span>Recruiter phụ trách: {app.recruiter}</span>
                          <span className="font-mono">ID: {app.id}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* CONTENT 2: NHẬT KÝ GIAO TIẾP & EMAIL LOGS (User Story 3) */}
            {centerTab === 'emails' && (
              <div className="space-y-4">
                {(!candidate.emailLogs || candidate.emailLogs.length === 0) ? (
                  <div className="py-12 text-center text-slate-400 text-xs space-y-2 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <Mail className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
                    <p className="font-bold text-slate-700">Chưa có lịch sử email nào được gửi</p>
                    <button
                      type="button"
                      onClick={() => openCompose()}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white font-extrabold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Gửi email đầu tiên</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {candidate.emailLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-4 rounded-2xl border border-slate-200/90 hover:border-blue-200 bg-white hover:bg-slate-50/60 transition-all space-y-2.5 text-xs shadow-2xs"
                      >
                        {/* Header: Subject, Type Badge & Timestamp */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={clsx(
                                  'px-2 py-0.5 rounded-full text-[10px] font-extrabold border',
                                  log.templateType === 'offer'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : log.templateType === 'interview'
                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                    : log.templateType === 'rejection'
                                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                )}
                              >
                                {log.templateType === 'offer'
                                  ? 'Thư Mời Nhận Việc (Offer)'
                                  : log.templateType === 'interview'
                                  ? 'Thư Mời Phỏng Vấn'
                                  : log.templateType === 'rejection'
                                  ? 'Thư Từ Chối & Cảm Ơn'
                                  : 'Thư Nhắc Nhở Phản Hồi'}
                              </span>
                              <span className="font-black text-slate-900 text-xs">
                                {log.subject}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Từ: <strong className="text-slate-600">{log.sender}</strong> &rarr; Đến: <strong className="text-slate-600">{log.recipientEmail}</strong>
                            </div>
                          </div>

                          {/* Status Badge: Sent vs Read Receipt */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {log.status === 'read' ? (
                              <span
                                title={`Đã mở xem lúc ${log.readAt}`}
                                className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Đã xem {log.readAt ? `(${log.readAt})` : ''}</span>
                              </span>
                            ) : log.status === 'replied' ? (
                              <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold flex items-center gap-1">
                                <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                                <span>Đã phản hồi</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold flex items-center gap-1">
                                <Send className="w-3.5 h-3.5 text-blue-600" />
                                <span>Đã gửi (SMTP)</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Content Snippet */}
                        <p className="text-slate-600 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2 leading-relaxed">
                          {log.contentSnippet}
                        </p>

                        {/* Footer Details & Quick Action */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Gửi lúc: <strong className="text-slate-600">{log.sentAt}</strong>
                          </span>

                          <button
                            type="button"
                            onClick={() => setSelectedEmail(log)}
                            className="text-blue-600 hover:text-blue-800 font-extrabold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>Xem nội dung thư</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* CỘT 3: PHẢI (3.5 COLS) - NHÃN (TAGS), ĐÁNH GIÁ & GHI CHÚ NỘI BỘ */}
        {/* ========================================================= */}
        <div className="lg:col-span-3 space-y-6">
          {/* Card 1: NHÃN (TAGS) - User Story 4 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-purple-600" />
                <span>Nhãn Phân Loại (Tags)</span>
              </h3>
              <span className="text-[10px] text-slate-400">{candidate.tags.length} nhãn</span>
            </div>

            {/* Danh sách Tags */}
            <div className="flex flex-wrap gap-1.5">
              {candidate.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 font-extrabold inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-600 cursor-pointer"
                    title="Xóa nhãn này"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Input thêm tag */}
            <div className="flex items-center gap-2 pt-1">
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
                placeholder="Gõ nhãn & Enter..."
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-500 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => handleAddTag(newTagInput)}
                className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Card 2: ĐÁNH GIÁ TỔNG QUAN (EVALUATION) - User Story 4 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Đánh Giá Của Hội Đồng</span>
              </h3>

              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-black text-[10px]">
                {candidate.evaluation.recommendationLevel}
              </span>
            </div>

            {/* Ratings 5 sao */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Chuyên môn kỹ thuật</span>
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={clsx(
                        'w-3.5 h-3.5',
                        i < candidate.evaluation.technicalSkill
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-200'
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Kỹ năng mềm & Giao tiếp</span>
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={clsx(
                        'w-3.5 h-3.5',
                        i < candidate.evaluation.softSkill
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-200'
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Độ phù hợp văn hóa</span>
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={clsx(
                        'w-3.5 h-3.5',
                        i < candidate.evaluation.cultureFit
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-200'
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Summary text */}
            <p className="text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[11px] leading-relaxed">
              {candidate.evaluation.summary}
            </p>
          </div>

          {/* Card 3: GHI CHÚ NỘI BỘ (INTERNAL NOTES) - User Story 4 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>Ghi Chú Nội Bộ</span>
              </h3>
              <span className="text-[10px] text-slate-400">{candidate.notes.length} trao đổi</span>
            </div>

            {/* Form thêm ghi chú */}
            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                rows={2}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Ghi chú nội bộ cho Hiring Manager / Recruiter..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
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
            <div className="space-y-2.5 max-h-64 overflow-y-auto">
              {candidate.notes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-extrabold text-slate-900">
                      {note.author} ({note.role})
                    </span>
                    <span className="text-slate-400">{note.createdAt}</span>
                  </div>
                  <p className="text-slate-700 text-xs leading-relaxed font-medium">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: XEM CHI TIẾT EMAIL (EMAIL DETAIL POPUP)          */}
      {/* ========================================================= */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 p-6 space-y-4 animate-in zoom-in-95 duration-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Chi Tiết Email Đã Gửi</h3>
                  <p className="text-[10px] font-mono text-slate-400">Mã thư: {selectedEmail.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metadata Table */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">Tiêu đề:</span>
                <span className="font-extrabold text-slate-900 text-right max-w-xs truncate">
                  {selectedEmail.subject}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">Người gửi:</span>
                <span className="text-slate-700">{selectedEmail.sender}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">Người nhận:</span>
                <span className="text-slate-700">{selectedEmail.recipientEmail}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">Thời gian gửi:</span>
                <span className="text-slate-700 font-mono">{selectedEmail.sentAt}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200/60 pt-1.5">
                <span className="text-slate-400 font-bold">Trạng thái đọc:</span>
                {selectedEmail.status === 'read' ? (
                  <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Đã xem biên nhận lúc {selectedEmail.readAt || 'Hôm nay'}
                  </span>
                ) : (
                  <span className="text-blue-700 font-bold flex items-center gap-1">
                    <Send className="w-3.5 h-3.5 text-blue-600" />
                    Đã gửi thành công (Chờ ứng viên mở)
                  </span>
                )}
              </div>
            </div>

            {/* Email Body */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                Nội dung thư
              </span>
              <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                {selectedEmail.contentSnippet}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedEmail(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: SOẠN EMAIL CHO ỨNG VIÊN (COMPOSE DIRECT EMAIL)   */}
      {/* ========================================================= */}
      {isComposeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 p-6 space-y-4 animate-in zoom-in-95 duration-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Soạn Email Cho Ứng Viên</h3>
                  <p className="text-[10px] text-slate-400">
                    Gửi tới: <strong className="text-slate-700">{candidate.name} ({candidate.email})</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsComposeModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendDirectEmail} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mẫu thư (Template)</label>
                <select
                  value={composeForm.template}
                  onChange={(e) => {
                    const t = e.target.value as typeof composeForm.template;
                    let s = composeForm.subject;
                    let c = composeForm.content;
                    if (t === 'offer') {
                      s = `[Thư mời nhận việc] Chúc mừng bạn gia nhập công ty - Vị trí ${candidate.latestPosition}`;
                      c = `Kính gửi bạn ${candidate.name},\n\nBan Giám đốc và Phòng Tuyển dụng trân trọng gửi tới bạn Thư mời nhận việc chính thức cho vị trí ${candidate.latestPosition}. Vui lòng xem tài liệu đính kèm và xác nhận trước hạn định.`;
                    } else if (t === 'interview') {
                      s = `[Thư mời phỏng vấn] Lịch phỏng vấn tiếp theo - Vị trí ${candidate.latestPosition}`;
                      c = `Chào bạn ${candidate.name},\n\nBộ phận Tuyển dụng trân trọng kính mời bạn tham gia buổi phỏng vấn cùng Hội đồng chuyên môn...`;
                    } else if (t === 'rejection') {
                      s = `[Thư cảm ơn] Cập nhật kết quả ứng tuyển vị trí ${candidate.latestPosition}`;
                      c = `Chào bạn ${candidate.name},\n\nCảm ơn bạn đã dành thời gian tham gia quy trình phỏng vấn tại công ty. Mặc dù rất ấn tượng với hồ sơ của bạn, hiện tại chúng tôi đã lựa chọn được ứng viên phù hợp hơn với giai đoạn này...`;
                    } else {
                      s = `[Nhắc nhở phản hồi] Thư mời nhận việc vị trí ${candidate.latestPosition}`;
                      c = `Chào bạn ${candidate.name},\n\nBộ phận Tuyển dụng xin phép nhắc lại về thời hạn phản hồi Thư mời nhận việc sắp kết thúc...`;
                    }
                    setComposeForm({ subject: s, template: t, content: c });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="offer">Thư Mời Nhận Việc (Offer Letter)</option>
                  <option value="interview">Thư Mời Phỏng Vấn (Interview Invitation)</option>
                  <option value="rejection">Thư Cảm Ơn & Từ Chối Lịch Sự (Rejection)</option>
                  <option value="reminder">Thư Nhắc Nhở Hạn Phản Hồi (Reminder)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tiêu đề email *</label>
                <input
                  type="text"
                  required
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nội dung email *</label>
                <textarea
                  required
                  rows={4}
                  value={composeForm.content}
                  onChange={(e) => setComposeForm({ ...composeForm, content: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsComposeModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sending ? 'Đang gửi...' : 'Gửi Email Ngay'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UnifiedCandidateDetailPage() {
  return <UnifiedCandidateDetailView />;
}
