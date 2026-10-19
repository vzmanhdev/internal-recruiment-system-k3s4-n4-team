'use client';

import React, { useState, useMemo } from 'react';
import { masterDataService, type Question } from '@/services/master-data.service';
import { useApiData } from '@/hooks/useApiData';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/DataStates';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  Filter,
  Tag,
  Lightbulb,
  Flag,
  Copy,
  Check,
  Briefcase,
  Code2,
  Database,
  Layers,
  LineChart,
  Compass,
  ChevronRight,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  HelpCircle,
  Video,
} from 'lucide-react';
import clsx from 'clsx';

// Interface kiểu dữ liệu Ngân Hàng Câu Hỏi
export interface QuestionItem {
  id: string;
  criterion: string;
  criterionBadgeClass: string;
  level: string;
  question: string;
  hints: string[];
  redFlags: string[];
}

export interface JobRoleQuestionBank {
  id: string;
  roleTitle: string;
  department: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  questions: QuestionItem[];
}

// 1. DỮ LIỆU MOCK DATA CỰC KỲ CHI TIẾT THEO YÊU CẦU NGHIỆP VỤ
const BADGES = [
  "bg-blue-50 text-blue-700 border-blue-200", "bg-emerald-50 text-emerald-700 border-emerald-200",
  "bg-amber-50 text-amber-700 border-amber-200", "bg-violet-50 text-violet-700 border-violet-200",
  "bg-rose-50 text-rose-700 border-rose-200",
];
const DIFFICULTY: Record<string, string> = { easy: "Cơ bản", medium: "Trung bình", hard: "Nâng cao" };

/** Real question bank (S2-07) grouped by job title; hints come from the stored suggested answer. */
function toBanks(questions: Question[]): JobRoleQuestionBank[] {
  const groups = new Map<string, Question[]>();
  for (const q of questions) {
    const key = q.job_title || "Câu hỏi chung";
    groups.set(key, [...(groups.get(key) || []), q]);
  }
  const criteria = Array.from(new Set(questions.map((q) => q.criteria_name || "Chung")));
  return Array.from(groups.entries()).map(([title, list]) => ({
    id: title,
    roleTitle: title,
    department: "",
    category: "",
    icon: Briefcase,
    description: `${list.length} câu hỏi trong ngân hàng`,
    questions: list.map((q) => ({
      id: q.id,
      criterion: q.criteria_name || "Chung",
      criterionBadgeClass: BADGES[Math.max(0, criteria.indexOf(q.criteria_name || "Chung")) % BADGES.length],
      level: DIFFICULTY[q.difficulty] || q.difficulty || "",
      question: q.content,
      hints: (q.suggested_answer || "").split(/\r?\n/).map((x) => x.trim()).filter(Boolean),
      redFlags: [],
    })),
  }));
}

export default function InterviewerQuestionsBankPage() {
  // State: Chức danh đang được chọn
  const { data, error, loading, reload } = useApiData(() => masterDataService.questions());
  const questionBankData = useMemo(() => toBanks(data || []), [data]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  // State: Ô tìm kiếm câu hỏi
  const [searchQuery, setSearchQuery] = useState<string>('');

  // State: Bộ lọc tiêu chí trong chức danh
  const [selectedCriterion, setSelectedCriterion] = useState<string>('all');

  // State: Thông báo copy
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Chức danh hiện tại
  const currentRole = useMemo(() => {
    return (
      questionBankData.find((role) => role.id === selectedRoleId) ||
      questionBankData[0] ||
      { id: '', roleTitle: '', department: '', category: '', icon: Briefcase, description: '', questions: [] as QuestionItem[] }
    );
  }, [selectedRoleId, questionBankData]);

  // Danh sách các tiêu chí của chức danh hiện tại
  const roleCriteriaList = useMemo(() => {
    const list = Array.from(new Set(currentRole.questions.map((q) => q.criterion)));
    return ['all', ...list];
  }, [currentRole]);

  // Bộ câu hỏi sau khi lọc qua Search và Criterion
  const filteredQuestions = useMemo(() => {
    let result = currentRole.questions;

    // Lọc theo tiêu chí
    if (selectedCriterion !== 'all') {
      result = result.filter((q) => q.criterion === selectedCriterion);
    }

    // Lọc theo Search Query
    if (searchQuery.trim() !== '') {
      const qLower = searchQuery.toLowerCase();
      result = result.filter(
        (q) =>
          q.question.toLowerCase().includes(qLower) ||
          q.criterion.toLowerCase().includes(qLower) ||
          q.hints.some((h) => h.toLowerCase().includes(qLower)) ||
          q.redFlags.some((rf) => rf.toLowerCase().includes(qLower))
      );
    }

    return result;
  }, [currentRole, selectedCriterion, searchQuery]);

  // Tổng số câu hỏi trong toàn bộ ngân hàng
  const totalQuestionsAllRoles = useMemo(() => {
    return questionBankData.reduce((acc, r) => acc + r.questions.length, 0);
  }, [questionBankData]);

  // Xử lý sao chép câu hỏi
  const handleCopyQuestion = (q: QuestionItem) => {
    const textToCopy = `[CÂU HỎI PHỎNG VẤN - ${q.criterion}]\n${q.question}\n\n💡 Gợi ý trả lời:\n${q.hints
      .map((h) => `- ${h}`)
      .join('\n')}\n\n🚩 Dấu hiệu đánh trượt (Red flags):\n${q.redFlags
      .map((rf) => `- ${rf}`)
      .join('\n')}`;

    navigator.clipboard.writeText(textToCopy).catch(() => undefined);
    setCopiedId(q.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!questionBankData.length) return <EmptyState hint="Ngân hàng câu hỏi chưa có câu hỏi nào." />;

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. HEADER TRANG: TIÊU ĐỀ & Ô TÌM KIẾM CÂU HỎI THÔNG MINH */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Ngân Hàng Câu Hỏi Gợi Ý
              </h1>
              <span className="bg-blue-50 text-blue-700 border border-blue-200/80 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                {totalQuestionsAllRoles} Câu Hỏi Chuẩn Hóa
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Hệ thống câu hỏi phỏng vấn phân loại theo chức danh, kèm tiêu chí đánh giá xuất sắc và dấu hiệu đánh trượt (Red Flags)
            </p>
          </div>
        </div>

        {/* Ô Tìm Kiếm Nhanh (Search Input) */}
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo từ khóa câu hỏi, gợi ý, red flags..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-800 placeholder:text-slate-400 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BỐ CỤC CHÍNH (SPLIT SCREEN: CỘT TRÁI 3 PHẦN - CỘT PHẢI 9 PHẦN) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ======================================================================= */}
        {/* CỘT TRÁI (MENU CHỨC DANH - lg:col-span-4 hoặc 3): DANH SÁCH VỊ TRÍ */}
        {/* ======================================================================= */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3 sticky top-20">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Chọn Chức Danh Chuyên Môn
                </h2>
              </div>
              <span className="text-[11px] text-slate-400 font-bold">
                {questionBankData.length} vị trí
              </span>
            </div>

            {/* Danh sách các chức danh */}
            <div className="space-y-2">
              {questionBankData.map((role) => {
                const isSelected = role.id === selectedRoleId;
                const IconComponent = role.icon;

                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => {
                      setSelectedRoleId(role.id);
                      setSelectedCriterion('all');
                    }}
                    className={clsx(
                      'w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer group',
                      isSelected
                        ? 'bg-blue-50/90 border-blue-600 text-blue-900 shadow-sm ring-1 ring-blue-500/20'
                        : 'bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 text-slate-700'
                    )}
                  >
                    <div
                      className={clsx(
                        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                      )}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={clsx(
                            'text-xs font-extrabold truncate block',
                            isSelected ? 'text-blue-900' : 'text-slate-800'
                          )}
                        >
                          {role.roleTitle}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {role.department}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className={clsx(
                            'text-[10px] font-bold px-2 py-0.5 rounded-md',
                            isSelected
                              ? 'bg-blue-200/80 text-blue-800'
                              : 'bg-slate-100 text-slate-600'
                          )}
                        >
                          {role.questions.length} câu hỏi
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {role.category}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Mẹo ôn tập nhanh trước giờ G */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs mt-4">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Mẹo Phỏng Vấn Nhanh</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Nhấn nút <strong>"Sao chép"</strong> trên từng câu hỏi để dán nhanh vào khung chat hoặc mở đồng thời tab <strong>Chế Độ Phỏng Vấn Trực Tiếp</strong> khi đang call.
              </p>
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* CỘT PHẢI (DANH SÁCH CÂU HỎI - lg:col-span-8): CARD CÂU HỎI CHI TIẾT */}
        {/* ======================================================================= */}
        <div className="lg:col-span-8 space-y-5">
          {/* Header Thông tin chức danh được chọn */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-extrabold border border-blue-200/60">
                    {currentRole.category}
                  </span>
                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    {currentRole.roleTitle}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {currentRole.description}
                </p>
              </div>

              {/* Nút link nhanh vào Live Call */}
              <Link
                href="/interviewer/schedule"
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Video className="w-3.5 h-3.5 text-blue-600" />
                <span>Lịch Phỏng Vấn</span>
              </Link>
            </div>

            {/* Thanh Filter Pills theo Tiêu chí năng lực */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Lọc tiêu chí:
              </span>
              {roleCriteriaList.map((crit) => (
                <button
                  key={crit}
                  type="button"
                  onClick={() => setSelectedCriterion(crit)}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                    selectedCriterion === crit
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                  )}
                >
                  {crit === 'all' ? 'Tất cả tiêu chí' : crit}
                </button>
              ))}
            </div>
          </div>

          {/* Danh sách các Cards câu hỏi */}
          <div className="space-y-4">
            {filteredQuestions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-2">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700">
                  Không tìm thấy câu hỏi phù hợp
                </h3>
                <p className="text-xs text-slate-400">
                  Vui lòng thử tìm với từ khóa khác hoặc bỏ chọn bộ lọc tiêu chí.
                </p>
              </div>
            ) : (
              filteredQuestions.map((q, index) => (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-5 space-y-4 hover:border-blue-300 transition-all duration-200"
                >
                  {/* Hàng Header Card: Tiêu chí, Cấp bậc, Nút Copy */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={clsx(
                          'px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border',
                          q.criterionBadgeClass
                        )}
                      >
                        {q.criterion}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                        Cấp độ: {q.level}
                      </span>
                    </div>

                    {/* Nút Sao Chép Câu Hỏi */}
                    <button
                      type="button"
                      onClick={() => handleCopyQuestion(q)}
                      className={clsx(
                        'px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer',
                        copiedId === q.id
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                      )}
                      title="Sao chép câu hỏi và gợi ý"
                    >
                      {copiedId === q.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Nội dung câu hỏi (Chữ to, in đậm) */}
                  <div>
                    <h3 className="text-sm font-black text-slate-900 leading-relaxed">
                      <span className="text-blue-600 mr-1.5">Q{index + 1}.</span>
                      {q.question}
                    </h3>
                  </div>

                  {/* Hai Khối Màu: Gợi Ý Trả Lời Tốt (Xanh) vs Dấu Hiệu Đánh Trượt (Đỏ) */}
                  <div className="space-y-3 pt-1">
                    {/* KHỐI 1: 💡 GỢI Ý TRẢ LỜI TỐT (NỀN XANH NHẠT, CHỮ XANH LỤC) */}
                    <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 text-emerald-900 font-extrabold text-[11px] uppercase tracking-wider">
                        <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>💡 Gợi ý câu trả lời tốt (Tiêu chuẩn đạt điểm cao)</span>
                      </div>
                      <ul className="space-y-1.5 text-emerald-950 text-xs leading-relaxed pl-1">
                        {q.hints.map((hint, hIdx) => (
                          <li key={hIdx} className="flex items-start gap-2">
                            <span className="text-emerald-600 font-bold mt-0.5">•</span>
                            <span>{hint}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* KHỐI 2: 🚩 DẤU HIỆU ĐÁNH TRƯỢT (RED FLAGS) (NỀN ĐỎ NHẠT, CHỮ ĐỎ) */}
                    <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/80 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 text-rose-900 font-extrabold text-[11px] uppercase tracking-wider">
                        <Flag className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>🚩 Dấu hiệu đánh trượt (Red Flags cần cảnh giác)</span>
                      </div>
                      <ul className="space-y-1.5 text-rose-950 text-xs leading-relaxed pl-1">
                        {q.redFlags.map((rf, rfIdx) => (
                          <li key={rfIdx} className="flex items-start gap-2">
                            <span className="text-rose-600 font-bold mt-0.5">✕</span>
                            <span>{rf}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
