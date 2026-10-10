'use client';

import React, { useState } from 'react';
import {
  Star,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Search,
  Filter,
  Check,
  X,
  Send,
  Award,
  Calendar,
  Briefcase,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';

interface CandidateCardItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  positionId: string;
  positionTitle: string;
  interviewRound: string;
  interviewDate: string;
  status: 'PENDING_EVAL' | 'EVALUATED' | 'OFFERED';
  isOverdue?: boolean;
  score?: number;
  recommendation?: 'HIRE' | 'CONSIDER' | 'REJECT';
  skills: string[];
  comment?: string;
  initials: string;
}

const INITIAL_CANDIDATES: CandidateCardItem[] = [
  {
    id: 'CAN-001',
    name: 'Nguyễn Quốc Bảo',
    email: 'bao.nguyen@devtech.io',
    phone: '0912 345 678',
    positionId: 'REQ-2026-001',
    positionTitle: 'Senior Frontend Engineer (React/Next.js)',
    interviewRound: 'Vòng 2: Chuyên Sâu Kiến Trúc Frontend',
    interviewDate: 'Hôm nay, 10:00 - 11:00',
    status: 'PENDING_EVAL',
    isOverdue: false,
    skills: ['Next.js 15', 'TypeScript', 'Tailwind CSS', 'Micro-frontends'],
    initials: 'QB',
  },
  {
    id: 'CAN-002',
    name: 'Vũ Hải Đăng',
    email: 'dang.vu@techhub.vn',
    phone: '0988 776 554',
    positionId: 'REQ-2026-003',
    positionTitle: 'Senior Backend Engineer (Golang/FastAPI)',
    interviewRound: 'Vòng 1: Kỹ Năng Kỹ Thuật & Giải Thuật',
    interviewDate: 'Hôm qua, 14:00 - 15:00',
    status: 'PENDING_EVAL',
    isOverdue: true,
    skills: ['Golang', 'FastAPI', 'Redis', 'PostgreSQL', 'Docker'],
    initials: 'HĐ',
  },
  {
    id: 'CAN-003',
    name: 'Phạm Thu Thảo',
    email: 'thao.pham@designlab.co',
    phone: '0903 221 443',
    positionId: 'REQ-2026-004',
    positionTitle: 'Chuyên viên Thiết Kế Trải Nghiệm (UI/UX Designer)',
    interviewRound: 'Vòng 1: Đánh Giá Portfolio & Design System',
    interviewDate: '08/01/2026',
    status: 'EVALUATED',
    score: 4.8,
    recommendation: 'HIRE',
    skills: ['Figma Tokens', 'B2B SaaS', 'Prototyping', 'User Research'],
    comment: 'Tư duy sản phẩm rất chắc, hiểu sâu design tokens và nguyên lý thiết kế ứng dụng doanh nghiệp.',
    initials: 'TT',
  },
  {
    id: 'CAN-004',
    name: 'Lê Minh Khang',
    email: 'khang.le@systemops.com',
    phone: '0934 112 889',
    positionId: 'REQ-2026-003',
    positionTitle: 'Senior Backend Engineer (Golang/FastAPI)',
    interviewRound: 'Vòng 2: Văn Hóa Làm Việc & Team Fit',
    interviewDate: '07/01/2026',
    status: 'EVALUATED',
    score: 4.2,
    recommendation: 'HIRE',
    skills: ['Golang', 'Kafka', 'System Architecture', 'CI/CD'],
    comment: 'Kỹ năng giao tiếp và teamwork tốt, có năng lực lead nhóm nhỏ 3-4 bạn.',
    initials: 'MK',
  },
  {
    id: 'CAN-005',
    name: 'Đặng Tuấn Kiệt',
    email: 'kiet.dang@qualityhub.com',
    phone: '0977 443 221',
    positionId: 'REQ-2026-005',
    positionTitle: 'QA Automation Engineer Lead',
    interviewRound: 'Vòng 1: Automation Framework Test',
    interviewDate: '06/01/2026',
    status: 'EVALUATED',
    score: 3.2,
    recommendation: 'CONSIDER',
    skills: ['Playwright', 'Selenium', 'Python', 'JMeter'],
    comment: 'Framework chưa tối ưu cho song song kiểm thử, cần cân nhắc thêm vòng phụ.',
    initials: 'TK',
  },
];

export default function EvaluationsPage() {
  const [candidates, setCandidates] = useState<CandidateCardItem[]>(INITIAL_CANDIDATES);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'EVALUATED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCandidateForEval, setActiveCandidateForEval] = useState<CandidateCardItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Scorecard Form states
  const [technicalScore, setTechnicalScore] = useState<number>(5);
  const [problemSolvingScore, setProblemSolvingScore] = useState<number>(4);
  const [cultureScore, setCultureScore] = useState<number>(5);
  const [recommendation, setRecommendation] = useState<'HIRE' | 'CONSIDER' | 'REJECT'>('HIRE');
  const [evalComment, setEvalComment] = useState<string>('');

  const filteredCandidates = candidates.filter((c) => {
    if (statusFilter === 'PENDING' && c.status !== 'PENDING_EVAL') return false;
    if (statusFilter === 'EVALUATED' && c.status !== 'EVALUATED') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.positionTitle.toLowerCase().includes(q) ||
        c.skills.some((s) => s.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const pendingCount = candidates.filter((c) => c.status === 'PENDING_EVAL').length;
  const evaluatedCount = candidates.filter((c) => c.status === 'EVALUATED').length;

  const handleOpenScorecard = (candidate: CandidateCardItem) => {
    setActiveCandidateForEval(candidate);
    setTechnicalScore(candidate.score ? Math.round(candidate.score) : 4);
    setProblemSolvingScore(4);
    setCultureScore(5);
    setRecommendation(candidate.recommendation || 'HIRE');
    setEvalComment(candidate.comment || '');
  };

  const handleSaveScorecard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCandidateForEval) return;

    const avgScore = Number(((technicalScore + problemSolvingScore + cultureScore) / 3).toFixed(1));

    setCandidates((prev) =>
      prev.map((c) =>
        c.id === activeCandidateForEval.id
          ? {
              ...c,
              status: 'EVALUATED',
              score: avgScore,
              recommendation,
              comment: evalComment || 'Đã hoàn tất đánh giá chuyên môn và đồng ý đề xuất.',
              isOverdue: false,
            }
          : c
      )
    );

    setActiveCandidateForEval(null);
    setToastMessage(`Đã lưu phiếu đánh giá cho ứng viên ${activeCandidateForEval.name} thành công!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[10px] uppercase tracking-wider">
              Interview Scorecard
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Đánh Giá & Chấm Điểm Ứng Viên
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Điền phiếu đánh giá năng lực chuyên môn sau các buổi phỏng vấn trực tiếp của Trưởng bộ phận.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">Cần chấm điểm</span>
            <span className="text-xl font-black text-amber-800">{pendingCount} ứng viên</span>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Đã hoàn tất</span>
            <span className="text-xl font-black text-emerald-700">{evaluatedCount} ứng viên</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên ứng viên, vị trí tuyển, kỹ năng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={clsx(
              'px-3 py-1.5 rounded-lg transition-all cursor-pointer',
              statusFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Tất cả ({candidates.length})
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={clsx(
              'px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5',
              statusFilter === 'PENDING'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Chờ đánh giá ({pendingCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('EVALUATED')}
            className={clsx(
              'px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5',
              statusFilter === 'EVALUATED'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Đã chấm điểm ({evaluatedCount})</span>
          </button>
        </div>
      </div>

      {/* CANDIDATE SCORECARD CARDS GRID (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCandidates.map((candidate) => {
          const isPending = candidate.status === 'PENDING_EVAL';

          return (
            <div
              key={candidate.id}
              className={clsx(
                'bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4',
                isPending && candidate.isOverdue
                  ? 'border-amber-300 ring-2 ring-amber-100'
                  : 'border-slate-100 hover:border-slate-200'
              )}
            >
              <div className="space-y-3">
                {/* Card Header: Avatar + Status Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                      {candidate.initials}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        {candidate.name}
                      </h3>
                      <p className="text-[11px] text-slate-400">{candidate.email}</p>
                    </div>
                  </div>

                  <span
                    className={clsx(
                      'text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0',
                      isPending
                        ? candidate.isOverdue
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    )}
                  >
                    {isPending
                      ? candidate.isOverdue
                        ? 'Quá SLA 24h'
                        : 'Chờ đánh giá'
                      : `Đạt ${candidate.score}★`}
                  </span>
                </div>

                {/* Position & Round */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <div className="font-bold text-slate-800 line-clamp-1">
                    {candidate.positionTitle}
                  </div>
                  <div className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 shrink-0" />
                    <span className="line-clamp-1">{candidate.interviewRound}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>{candidate.interviewDate}</span>
                  </div>
                </div>

                {/* Skills tags */}
                <div className="flex flex-wrap gap-1.5">
                  {candidate.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Comment summary if evaluated */}
                {candidate.comment && (
                  <p className="text-xs text-slate-600 italic bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 line-clamp-2">
                    "{candidate.comment}"
                  </p>
                )}
              </div>

              {/* Card Action Button */}
              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleOpenScorecard(candidate)}
                  className={clsx(
                    'w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs',
                    isPending
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-98'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  )}
                >
                  <Star className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isPending ? 'Mở Phiếu Chấm Điểm' : 'Xem & Chỉnh Sửa Đánh Giá'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* SCORECARD MODAL POPUP */}
      {activeCandidateForEval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                  {activeCandidateForEval.initials}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Phiếu Chấm Điểm: {activeCandidateForEval.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeCandidateForEval.positionTitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveCandidateForEval(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveScorecard} className="p-6 space-y-5">
              {/* Scorecard criteria */}
              <div className="space-y-4">
                {/* 1. Năng lực kỹ thuật & chuyên môn */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block">
                      1. Kiến thức chuyên môn & Công nghệ cốt lõi
                    </label>
                    <span className="text-[11px] text-slate-500">Mức độ am hiểu kiến trúc, giải thuật, frameworks</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setTechnicalScore(star)}
                        className="p-1 cursor-pointer"
                      >
                        <Star
                          className={clsx(
                            'w-5 h-5',
                            star <= technicalScore ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Kỹ năng giải quyết sự cố */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block">
                      2. Tư duy phân tích & Giải quyết sự cố
                    </label>
                    <span className="text-[11px] text-slate-500">Khả năng phản xạ và debug bài toán thực tế</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setProblemSolvingScore(star)}
                        className="p-1 cursor-pointer"
                      >
                        <Star
                          className={clsx(
                            'w-5 h-5',
                            star <= problemSolvingScore ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Phù hợp văn hóa */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <label className="text-xs font-bold text-slate-800 block">
                      3. Kỹ năng giao tiếp & Văn hóa làm việc (Culture Fit)
                    </label>
                    <span className="text-[11px] text-slate-500">Tinh thần hợp tác, cởi mở, trách nhiệm</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setCultureScore(star)}
                        className="p-1 cursor-pointer"
                      >
                        <Star
                          className={clsx(
                            'w-5 h-5',
                            star <= cultureScore ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommendation selection */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-2">
                  Quyết Định Cuối Cùng Của Hiring Manager
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setRecommendation('HIRE')}
                    className={clsx(
                      'p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center',
                      recommendation === 'HIRE'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    ✓ Đề Xuất Tuyển (Hire)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecommendation('CONSIDER')}
                    className={clsx(
                      'p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center',
                      recommendation === 'CONSIDER'
                        ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    ⏳ Cân Nhắc / Dự Phòng
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecommendation('REJECT')}
                    className={clsx(
                      'p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center',
                      recommendation === 'REJECT'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    ✗ Không Đạt (Reject)
                  </button>
                </div>
              </div>

              {/* Detailed Feedback Note */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Nhận Xét Đánh Giá Chi Tiết & Gợi Ý Mức Lương
                </label>
                <textarea
                  rows={3}
                  value={evalComment}
                  onChange={(e) => setEvalComment(e.target.value)}
                  placeholder="Ghi chú cụ thể điểm mạnh, điểm yếu của ứng viên và đề xuất mức đãi ngộ..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none leading-relaxed"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveCandidateForEval(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lưu Kết Quả Đánh Giá</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
