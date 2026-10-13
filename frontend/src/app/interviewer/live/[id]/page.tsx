'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { interviewerApi } from '@/features/interviewer/api';
import { interviewService } from '@/services/interview.service';
import { useApiData } from '@/hooks/useApiData';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/DataStates';
import { ApiError } from '@/lib/api-client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Video,
  Clock,
  User,
  Building,
  Briefcase,
  FileText,
  Star,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Download,
  CheckSquare,
  Square,
  Sparkles,
  Lightbulb,
  Award,
  Send,
  Eye,
  Maximize2,
  Copy,
  BookOpen,
  HelpCircle,
  MessageSquare,
  Play,
  Pause,
  RotateCcw,
  Tag,
  Check,
  ShieldCheck,
} from 'lucide-react';
import clsx from 'clsx';

// Interface Câu hỏi phỏng vấn thông minh
interface SmartQuestion {
  id: string;
  category: string;
  level: string;
  question: string;
  isAsked: boolean;
  scoringCriteria: string[]; // Các ý gạch đầu dòng ứng viên cần nói được
  bonusPoints?: string; // Điểm cộng đặc biệt
  pitfallWarning?: string; // Bẫy kiến thức cần tránh
}

export default function LiveInterviewModePage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || '');
  const interviewId = Number(id);

  // Real interview + question suggestions for its job title / scorecard criteria (S7-02).
  const { data, error, loading, reload } = useApiData(async () => {
    const [mine, suggestions] = await Promise.all([interviewerApi.mine(), interviewService.questionSuggestions(interviewId)]);
    return { interview: mine.find((i) => i.id === interviewId) || null, suggestions };
  }, [interviewId]);

  const candidate = useMemo(() => {
    const i = data?.interview;
    const start = i ? new Date(i.scheduled_time) : null;
    const end = start ? new Date(start.getTime() + (i?.duration_minutes || 60) * 60000) : null;
    const hm = (d: Date) => d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return {
      id: interviewId,
      name: i?.candidate_name || '—',
      position: i?.job_title || '',
      department: '',
      round: i?.round_name || '',
      time: start && end ? `${hm(start)} - ${hm(end)}, ${start.toLocaleDateString('vi-VN')}` : '',
      format: i?.meeting_link ? 'Trực tuyến' : i?.location ? `Trực tiếp (${i.location})` : 'Trực tiếp',
      meetingUrl: i?.meeting_link || '',
      experience: '—',
      education: '—',
      skills: [] as string[],
      currentCompany: '—',
      cvUrl: i?.cv_url || null,
    };
  }, [data, interviewId]);

  const initialQuestions: SmartQuestion[] = useMemo(
    () =>
      (data?.suggestions || []).map((q) => ({
        id: q.id,
        category: q.criteria_name || 'Chung',
        level: q.difficulty || '',
        question: q.content,
        isAsked: q.already_asked,
        scoringCriteria: (q.suggested_answer || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean),
      })),
    [data],
  );

  const [questions, setQuestions] = useState<SmartQuestion[]>([]);
  useEffect(() => { queueMicrotask(() => setQuestions(initialQuestions)); }, [initialQuestions]);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({});
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Ghi chú & Đánh giá nhanh
  const [quickScore, setQuickScore] = useState<number>(0);
  const [quickNotes, setQuickNotes] = useState<string>('');
  const [prosNotes, setProsNotes] = useState<string>('');
  const [consNotes, setConsNotes] = useState<string>('');
  const [autoSavedTime, setAutoSavedTime] = useState<string>('chưa lưu');

  // Đồng hồ bấm giờ phỏng vấn
  const [seconds, setSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  // CV Tab: Document View vs Summary
  const [cvViewMode, setCvViewMode] = useState<'preview' | 'summary'>('preview');

  // Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle Checkbox Đã hỏi
  // "Đã hỏi" is recorded on the server so later rounds do not repeat it (S7-02 AC2); it cannot be undone.
  const [markError, setMarkError] = useState<string | null>(null);
  const toggleQuestionAsked = async (questionId: string) => {
    const q = questions.find((x) => x.id === questionId);
    if (!q || q.isAsked) return;
    setQuestions((prev) => prev.map((x) => (x.id === questionId ? { ...x, isAsked: true } : x)));
    try {
      await interviewService.markAsked(interviewId, questionId);
      setMarkError(null);
    } catch (err) {
      setQuestions((prev) => prev.map((x) => (x.id === questionId ? { ...x, isAsked: false } : x)));
      setMarkError(err instanceof ApiError ? err.message : 'Không lưu được trạng thái câu hỏi.');
    }
  };

  // Quick notes are a per-browser draft only (the scorecard is the official record).
  const draftKey = `interview-notes:${interviewId}`;
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(draftKey);
      if (raw) {
        const d = JSON.parse(raw);
        queueMicrotask(() => {
          setQuickScore(d.quickScore || 0); setQuickNotes(d.quickNotes || ''); setProsNotes(d.prosNotes || ''); setConsNotes(d.consNotes || '');
          setAutoSavedTime(d.savedAt || 'chưa lưu');
        });
      }
    } catch { /* storage unavailable */ }
  }, [draftKey]);
  useEffect(() => {
    if (!quickScore && !quickNotes && !prosNotes && !consNotes) return;
    try {
      const savedAt = new Date().toLocaleTimeString('vi-VN');
      sessionStorage.setItem(draftKey, JSON.stringify({ quickScore, quickNotes, prosNotes, consNotes, savedAt }));
    } catch { /* storage unavailable */ }
  }, [draftKey, quickScore, quickNotes, prosNotes, consNotes]);

  // Toggle Accordion Tiêu chí câu trả lời tốt
  const toggleAccordion = (questionId: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Thống kê tiến độ hỏi
  const askedCount = useMemo(() => {
    return questions.filter((q) => q.isAsked).length;
  }, [questions]);

  // Bộ lọc câu hỏi
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (filterCategory === 'all') return true;
      if (filterCategory === 'unasked') return !q.isAsked;
      if (filterCategory === 'asked') return q.isAsked;
      return q.category === filterCategory;
    });
  }, [questions, filterCategory]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data?.interview) return <EmptyState title="Không tìm thấy buổi phỏng vấn" hint="Bạn chỉ mở được buổi phỏng vấn mình được mời." />;

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-16">
      {markError && <div className="text-sm rounded-xl px-4 py-3 border bg-red-50 border-red-200 text-red-700">{markError}</div>}
      {/* 1. TOP CONTROL BAR (Thanh Điều Khiển Song Song Cố Định) */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-16 z-30 backdrop-blur-md bg-white/95">
        <div className="flex items-center gap-3">
          <Link
            href="/interviewer/schedule"
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Quay lại Lịch phỏng vấn"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Chế Độ Phỏng Vấn Trực Tiếp (Live Interview Mode)</span>
                <span className="bg-rose-50 text-rose-700 border border-rose-200/80 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                  Live Session
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ứng viên: <strong className="text-slate-800">{candidate.name}</strong> • Vị trí:{' '}
              <strong className="text-blue-600">{candidate.position}</strong>
            </p>
          </div>
        </div>

        {/* Đồng hồ Timer & Nút Chuyển Sang Điền Phiếu Đánh Giá */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          {/* Live Stopwatch Timer */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-mono font-bold shadow-xs">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 text-sm tracking-wider">{formatTimer(seconds)}</span>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
              title={isTimerRunning ? 'Tạm dừng đếm giờ' : 'Tiếp tục đếm giờ'}
            >
              {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* NÚT NỔI BẬT: CHUYỂN SANG ĐIỀN PHIẾU ĐÁNH GIÁ */}
          <Link
            href={`/interviewer/evaluations/${id}`}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/25 flex items-center gap-2 transition-all active:scale-95 cursor-pointer ring-2 ring-blue-500/20"
          >
            <Award className="w-4 h-4" />
            <span>Chuyển Sang Điền Phiếu Đánh Giá</span>
          </Link>
        </div>
      </div>

      {/* 2. SPLIT SCREEN (CHIA ĐÔI MÀN HÌNH CHUYÊN NGHIỆP) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* CỘT TRÁI (6 CỘT): THÔNG TIN ỨNG VIÊN, RENDER CV & Ô GHI CHÚ NHANH */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 space-y-5">
          {/* A. THẺ TÓM TẮT THÔNG TIN ỨNG VIÊN */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                  {candidate.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">{candidate.name}</h2>
                  <p className="text-xs font-semibold text-blue-700">{candidate.position}</p>
                  <span className="text-[11px] text-slate-500">{candidate.department}</span>
                </div>
              </div>

              {/* Link họp trực tuyến */}
              {candidate.meetingUrl && (
                <a
                  href={candidate.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Mở Google Meet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* Thông số nhanh */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Kinh nghiệm</span>
                <strong className="text-slate-800 text-[11px]">{candidate.experience}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Công ty gần nhất</span>
                <strong className="text-slate-800 text-[11px] truncate block">{candidate.currentCompany}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Vòng tuyển dụng</span>
                <strong className="text-slate-800 text-[11px] truncate block">{candidate.round.split(' - ')[0]}</strong>
              </div>
            </div>

            {/* Tags Kỹ Năng */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {candidate.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200/60"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* B. KHU VỰC RENDER CV (CV DOCUMENT VIEWER) */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            {/* Header thanh công cụ CV Viewer */}
            <div className="p-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">Tài Liệu Hồ Sơ CV Ứng Viên</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-slate-200/80 p-0.5 rounded-lg flex text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setCvViewMode('preview')}
                    className={clsx(
                      'px-2.5 py-1 rounded-md transition-colors cursor-pointer',
                      cvViewMode === 'preview' ? 'bg-white text-blue-600 font-bold shadow-xs' : 'text-slate-600'
                    )}
                  >
                    Bản Xem Tài Liệu
                  </button>
                  <button
                    type="button"
                    onClick={() => setCvViewMode('summary')}
                    className={clsx(
                      'px-2.5 py-1 rounded-md transition-colors cursor-pointer',
                      cvViewMode === 'summary' ? 'bg-white text-blue-600 font-bold shadow-xs' : 'text-slate-600'
                    )}
                  >
                    Tóm Tắt Quá Trình
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => alert('Đang mở file CV PDF gốc sang tab trình xem toàn màn hình...')}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  title="Phóng to toàn màn hình"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Nội dung CV Render Box (Iframe / Document Canvas) */}
            <div className="h-96 overflow-y-auto p-5 bg-white text-xs space-y-4 border-b border-slate-100 select-text">
              {cvViewMode === 'preview' ? (
                /* Mô phỏng Iframe Render CV chuyên nghiệp */
                <div className="space-y-4 text-slate-700 leading-relaxed max-w-xl mx-auto">
                  <div className="border-b border-slate-200 pb-3">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">{candidate.name}</h3>
                    <p className="text-xs font-bold text-blue-600 uppercase">{candidate.position}</p>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Email: candidate.cv@example.com • Điện thoại: 0912 345 678 • Hà Nội, Việt Nam
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                      Mục Tiêu Nghề Nghiệp & Tóm Tắt Năng Lực
                    </h4>
                    <p className="text-slate-600 text-[11px]">
                      Hơn 6 năm kinh nghiệm phát triển phần mềm kiến trúc Microservices và SPA/SSR quy mô lớn. Am hiểu
                      sâu về tối ưu hiệu năng web, thiết kế API RESTful, CI/CD và dẫn dắt đội ngũ kỹ thuật đạt mục tiêu tiến độ.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                      Kinh Nghiệm Làm Việc Chi Tiết
                    </h4>

                    <div className="border-l-2 border-blue-500 pl-3 space-y-1">
                      <div className="flex justify-between items-center">
                        <strong className="text-slate-900">Senior Software Engineer — {candidate.currentCompany}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">2022 - Hiện tại</span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        • Xây dựng hệ thống giao dịch thanh toán trực tuyến, xử lý hơn 15,000 yêu cầu/giây.<br />
                        • Tối ưu hóa thời gian phản hồi API giảm 35% qua chiến lược Caching Redis phân tầng.<br />
                        • Đào tạo và hướng dẫn kỹ thuật cho 5 kỹ sư cấp Middle & Junior.
                      </p>
                    </div>

                    <div className="border-l-2 border-slate-300 pl-3 space-y-1">
                      <div className="flex justify-between items-center">
                        <strong className="text-slate-900">Software Engineer — Global Tech JSC</strong>
                        <span className="text-[10px] text-slate-400 font-mono">2019 - 2022</span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        • Phát triển các tính năng cốt lõi cho nền tảng quản trị nhân sự SaaS trên nền tảng React & Node.js.<br />
                        • Tích hợp hệ thống CI/CD tự động trên GitLab CI và hạ tầng Docker container.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                      Học Vấn & Bằng Cấp
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      • {candidate.education} — Tốt nghiệp loại Giỏi (GPA 3.6/4.0)<br />
                      • Chứng chỉ Quốc Tế: AWS Certified Solutions Architect Associate (2024)
                    </p>
                  </div>
                </div>
              ) : (
                /* Tab Tóm tắt nhanh quá trình */
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <strong className="text-slate-800 block text-xs">Điểm nổi bật trong hồ sơ:</strong>
                    <ul className="list-disc list-inside text-[11px] text-slate-600 mt-1 space-y-1">
                      <li>Đã có kinh nghiệm dẫn dắt kỹ thuật và trực tiếp phỏng vấn ứng viên trước đây.</li>
                      <li>Có khả năng live coding tốt và tư duy thuật toán chặt chẽ.</li>
                      <li>Kỳ vọng mức lương trong dải ngân sách phê duyệt của REQ.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Footer CV: Nút tải file */}
            <div className="p-2.5 bg-slate-50 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500">Định dạng file: PDF (2.4 MB)</span>
              <button
                type="button"
                onClick={() => alert(`Đang tải file CV bản gốc của ${candidate.name}...`)}
                className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải Bản Gốc (.PDF)</span>
              </button>
            </div>
          </div>

          {/* C. CÁC Ô INPUT NHANH ĐỂ NOTE Ý CHÍNH TRONG LÚC NGHE */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Ghi Chú Nhanh Trong Buổi Phỏng Vấn (Live Scratchpad)
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Nháp trên trình duyệt này: {autoSavedTime}</span>
            </div>

            {/* Điểm chấm nhanh sơ bộ */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-bold text-slate-700">Điểm sơ bộ hiện tại:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setQuickScore(star);
                      setAutoSavedTime(new Date().toLocaleTimeString('vi-VN'));
                    }}
                    className="p-1 text-xs hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star
                      className={clsx(
                        'w-5 h-5 transition-colors',
                        quickScore >= star ? 'text-amber-500 fill-amber-400' : 'text-slate-300'
                      )}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-amber-700 ml-1">{quickScore}/5 ★</span>
              </div>
            </div>

            {/* 2 Ô Ghi chú: Điểm cộng vs Điểm cần lưu ý */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-emerald-700 mb-1">
                  ✓ Điểm cộng / Ấn tượng nổi bật:
                </label>
                <textarea
                  rows={3}
                  value={prosNotes}
                  onChange={(e) => {
                    setProsNotes(e.target.value);
                    setAutoSavedTime(new Date().toLocaleTimeString('vi-VN'));
                  }}
                  placeholder="Ứng viên giải thích xuất sắc phần Event Loop, tư duy thuật toán nhanh..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-700 mb-1">
                  ⚠️ Điểm cần đào sâu / Còn nghi vấn:
                </label>
                <textarea
                  rows={3}
                  value={consNotes}
                  onChange={(e) => {
                    setConsNotes(e.target.value);
                    setAutoSavedTime(new Date().toLocaleTimeString('vi-VN'));
                  }}
                  placeholder="Kinh nghiệm Kubernetes còn ở mức cơ bản, cần hỏi thêm phần CI/CD..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800"
                />
              </div>
            </div>

            {/* Ô ghi chú tự do toàn văn */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Ghi chép diễn biến cuộc gọi (Scratchpad):
              </label>
              <textarea
                rows={3}
                value={quickNotes}
                onChange={(e) => {
                  setQuickNotes(e.target.value);
                  setAutoSavedTime(new Date().toLocaleTimeString('vi-VN'));
                }}
                placeholder="Ghi lại các đoạn mã, câu trả lời trực tiếp hoặc các số liệu ứng viên cung cấp..."
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CỘT PHẢI (6 CỘT): NGÂN HÀNG CÂU HỎI THÔNG MINH MAP THEO CHỨC DANH */}
        {/* ========================================================================= */}
        <div className="lg:col-span-6 space-y-4">
          {/* Header Ngân Hàng Câu Hỏi */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-extrabold text-slate-900">
                    Ngân Hàng Câu Hỏi Gợi Ý Theo Chức Danh
                  </h2>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tự động ánh xạ cho vị trí: <strong className="text-blue-600">{candidate.position}</strong>
                </p>
              </div>

              {/* Tiến độ hỏi */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">
                  Đã hỏi: <strong className="text-blue-600">{askedCount}</strong>/{questions.length}
                </span>
                <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${(askedCount / questions.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Thanh Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterCategory('all')}
                className={clsx(
                  'px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer',
                  filterCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                )}
              >
                Tất cả ({questions.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('unasked')}
                className={clsx(
                  'px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer',
                  filterCategory === 'unasked'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                )}
              >
                Chưa hỏi ({questions.filter((q) => !q.isAsked).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('asked')}
                className={clsx(
                  'px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer',
                  filterCategory === 'asked' ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                )}
              >
                Đã hỏi ({askedCount})
              </button>
            </div>
          </div>

          {/* Danh Sách Các Thẻ Câu Hỏi */}
          <div className="space-y-3.5">
            {filteredQuestions.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 text-slate-400 text-xs">
                Không tìm thấy câu hỏi nào phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              filteredQuestions.map((q, idx) => {
                const isOpen = !!openAccordions[q.id];

                return (
                  <div
                    key={q.id}
                    className={clsx(
                      'rounded-2xl border p-4.5 transition-all duration-200 space-y-3',
                      q.isAsked
                        ? 'opacity-50 bg-slate-50/80 border-dashed border-slate-200'
                        : 'bg-white border-slate-200/80 shadow-xs hover:border-blue-300'
                    )}
                  >
                    {/* Header Thẻ: Category, Level & Checkbox Đã Hỏi */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-extrabold border border-blue-100">
                          {q.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                          {q.level}
                        </span>
                      </div>

                      {/* CHECKBOX ĐÃ HỎI */}
                      <button
                        type="button"
                        onClick={() => toggleQuestionAsked(q.id)}
                        className={clsx(
                          'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                          q.isAsked
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        )}
                        title="Đánh dấu câu hỏi đã được hỏi để tránh trùng lặp"
                      >
                        {q.isAsked ? (
                          <>
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Đã hỏi</span>
                          </>
                        ) : (
                          <>
                            <Square className="w-3.5 h-3.5 text-slate-400" />
                            <span>Chưa hỏi</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Nội dung câu hỏi chính */}
                    <div className="text-xs font-extrabold text-slate-900 leading-relaxed">
                      <span className="text-blue-600 mr-1.5">Q{idx + 1}:</span>
                      <span className={clsx(q.isAsked && 'line-through text-slate-600')}>{q.question}</span>
                    </div>

                    {/* ACCORDION (NÚT XỔ XUỐNG): 💡 TIÊU CHÍ CÂU TRẢ LỜI TỐT */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => toggleAccordion(q.id)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/70 text-amber-900 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                          <span>💡 Tiêu chí câu trả lời tốt (Xem gợi ý chấm điểm)</span>
                        </span>
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {/* Nội dung accordion mở ra */}
                      {isOpen && (
                        <div className="mt-2 p-3.5 rounded-xl bg-amber-50/40 border border-amber-200/60 text-xs space-y-2 animate-in fade-in duration-150">
                          <span className="font-bold text-amber-950 block text-[11px] uppercase tracking-wider">
                            Các ý ứng viên cần nói được để đạt điểm cao:
                          </span>
                          <ul className="space-y-1.5 text-slate-700 text-[11px] leading-relaxed">
                            {q.scoringCriteria.map((criterion, cIdx) => (
                              <li key={cIdx} className="flex items-start gap-1.5">
                                <span className="text-amber-600 font-bold">•</span>
                                <span>{criterion}</span>
                              </li>
                            ))}
                          </ul>

                          {/* Điểm cộng nếu có */}
                          {q.bonusPoints && (
                            <div className="pt-1 border-t border-amber-200/60 text-[11px] text-emerald-800">
                              <strong className="text-emerald-900">⭐ Điểm cộng:</strong> {q.bonusPoints}
                            </div>
                          )}

                          {/* Cảnh báo bẫy kiến thức */}
                          {q.pitfallWarning && (
                            <div className="pt-1 text-[11px] text-rose-800">
                              <strong className="text-rose-900">⚠️ Bẫy kiến thức:</strong> {q.pitfallWarning}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Sticky Bottom Call to Action Card */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
            <div className="text-xs">
              <strong className="text-blue-900 block font-bold">Đã hoàn thành buổi phỏng vấn?</strong>
              <span className="text-slate-600 text-[11px]">
                Chuyển ngay sang form Rubric chính thức để chốt điểm và nộp phiếu đánh giá.
              </span>
            </div>

            <Link
              href={`/interviewer/evaluations/${id}`}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 shrink-0 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <span>Điền Phiếu Ngay</span>
              <Award className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
