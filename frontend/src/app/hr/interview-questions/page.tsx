'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { apiRequest, ApiError } from '@/lib/api-client';
import { masterDataService, type Question, type Framework, type Criterion } from '@/services/master-data.service';
import { useApiData } from '@/hooks/useApiData';
import { ErrorState, LoadingState } from '@/components/ui/DataStates';
import { 
  BookOpen, Plus, Search, Filter, Edit3, Trash2, CheckCircle2, 
  XCircle, AlertCircle, HelpCircle, ArrowLeft, RefreshCw, Sparkles, X, Check,
  Lightbulb, Tag, Award
} from 'lucide-react';

export default function HRInterviewQuestionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [jobTitleFilter, setJobTitleFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formJobTitle, setFormJobTitle] = useState('Senior Python Backend Engineer');
  const [formCriteriaId, setFormCriteriaId] = useState('');
  const [formDifficulty, setFormDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [formSuggestedAnswer, setFormSuggestedAnswer] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load questions and competency frameworks
  const { data, error, loading, reload } = useApiData(async () => {
    const [questions, frameworks] = await Promise.all([
      masterDataService.questions(),
      masterDataService.frameworks().catch(() => [] as Framework[]),
    ]);

    // Flatten criteria
    const allCriteria = (frameworks || []).flatMap((fw: Framework) => fw.criteria || []);
    return { questions, frameworks, criteria: allCriteria };
  }, []);

  const questions: Question[] = data?.questions || [];
  const criteria: Criterion[] = data?.criteria || [];

  // Unique job titles for filter
  const jobTitles = useMemo(() => {
    const set = new Set(questions.map((q: Question) => q.job_title).filter(Boolean));
    return Array.from(set) as string[];
  }, [questions]);

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q: Question) => {
      if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false;
      if (jobTitleFilter !== 'all' && q.job_title !== jobTitleFilter) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchCode = (q.code || '').toLowerCase().includes(query);
        const matchContent = (q.content || '').toLowerCase().includes(query);
        const matchCrit = (q.criteria_name || '').toLowerCase().includes(query);
        const matchJob = (q.job_title || '').toLowerCase().includes(query);
        if (!matchCode && !matchContent && !matchCrit && !matchJob) return false;
      }
      return true;
    });
  }, [questions, difficultyFilter, jobTitleFilter, searchTerm]);

  // Open Create/Edit modal
  const handleOpenModal = (q?: Question) => {
    if (q) {
      setEditingQuestion(q);
      setFormCode(q.code);
      setFormContent(q.content);
      setFormJobTitle(q.job_title || 'Senior Python Backend Engineer');
      setFormCriteriaId(q.criteria_id || (criteria[0]?.id || ''));
      setFormDifficulty((q.difficulty as any) || 'medium');
      setFormSuggestedAnswer(q.suggested_answer || '');
    } else {
      setEditingQuestion(null);
      setFormCode(`Q-${Date.now().toString().slice(-4)}`);
      setFormContent('');
      setFormJobTitle(jobTitles[0] || 'Senior Python Backend Engineer');
      setFormCriteriaId(criteria[0]?.id || '');
      setFormDifficulty('medium');
      setFormSuggestedAnswer('');
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim()) { setFormError('Vui lòng nhập mã câu hỏi!'); return; }
    if (!formContent.trim()) { setFormError('Vui lòng nhập nội dung câu hỏi!'); return; }
    if (!formCriteriaId) { setFormError('Vui lòng chọn tiêu chí năng lực gắn với câu hỏi!'); return; }

    try {
      setFormSubmitting(true);
      await masterDataService.saveQuestion({
        code: formCode.trim(),
        content: formContent.trim(),
        job_title: formJobTitle.trim(),
        criteria_id: formCriteriaId,
        difficulty: formDifficulty,
        suggested_answer: formSuggestedAnswer.trim(),
      }, editingQuestion?.id);

      setIsModalOpen(false);
      reload();
      showToast(editingQuestion ? 'Đã cập nhật câu hỏi thành công!' : 'Đã thêm câu hỏi mới vào ngân hàng!');
    } catch (err: any) {
      setFormError(err instanceof ApiError ? err.message : 'Không lưu được câu hỏi.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string, code: string) => {
    if (!window.confirm(`Bạn có chắc muốn đóng/hủy kích hoạt câu hỏi [${code}]?`)) return;
    try {
      await masterDataService.deactivateQuestion(id);
      reload();
      showToast(`Đã đóng câu hỏi [${code}] thành công!`);
    } catch (err: any) {
      showToast(err instanceof ApiError ? err.message : 'Không thể đóng câu hỏi này.');
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[10001] px-4 py-3 rounded-2xl shadow-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[10px] tracking-wider uppercase border border-blue-200">
                [S2-07 • S7-02] Question Bank
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Ngân Hàng Câu Hỏi Chuẩn Hóa Theo Chức Danh & Khung Năng Lực
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 mt-1 tracking-tight">
              Ngân Hàng Câu Hỏi Phỏng Vấn Tuyển Dụng
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Quản lý danh mục câu hỏi phỏng vấn chuẩn hóa, gợi ý câu trả lời và liên kết trực tiếp với tiêu chí đánh giá năng lực.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/hr/interviews"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
              <span>Lịch Phỏng Vấn</span>
            </Link>
            <button
              type="button"
              onClick={() => handleOpenModal()}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Thêm Câu Hỏi Mới</span>
            </button>
          </div>
        </div>

        {/* 3 Metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-blue-700">Tổng Số Câu Hỏi</span>
            <div className="text-xl font-black text-blue-900 mt-0.5">{questions.length} câu hỏi</div>
          </div>
          <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-emerald-700">Vị Trí Áp Dụng</span>
            <div className="text-xl font-black text-emerald-900 mt-0.5">{jobTitles.length || 1} chức danh</div>
          </div>
          <div className="p-3.5 bg-amber-50/60 border border-amber-100 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-amber-700">Tiêu Chí Khung Năng Lực</span>
            <div className="text-xl font-black text-amber-900 mt-0.5">{criteria.length} tiêu chí gắn kèm</div>
          </div>
        </div>
      </div>

      {/* Toolbar: Tìm kiếm & Lọc */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo nội dung câu hỏi, mã Q-, tiêu chí năng lực..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Difficulty filter */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setDifficultyFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all ${difficultyFilter === 'all' ? 'bg-white text-blue-600 shadow-2xs' : 'hover:text-slate-900'}`}
            >
              Tất Cả Độ Khó
            </button>
            <button
              type="button"
              onClick={() => setDifficultyFilter('easy')}
              className={`px-3 py-1 rounded-lg transition-all ${difficultyFilter === 'easy' ? 'bg-white text-emerald-600 shadow-2xs' : 'hover:text-slate-900'}`}
            >
              Cơ Bản
            </button>
            <button
              type="button"
              onClick={() => setDifficultyFilter('medium')}
              className={`px-3 py-1 rounded-lg transition-all ${difficultyFilter === 'medium' ? 'bg-white text-amber-600 shadow-2xs' : 'hover:text-slate-900'}`}
            >
              Trung Bình
            </button>
            <button
              type="button"
              onClick={() => setDifficultyFilter('hard')}
              className={`px-3 py-1 rounded-lg transition-all ${difficultyFilter === 'hard' ? 'bg-white text-rose-600 shadow-2xs' : 'hover:text-slate-900'}`}
            >
              Nâng Cao
            </button>
          </div>

          {/* Job title filter */}
          <select
            value={jobTitleFilter}
            onChange={(e) => setJobTitleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-hidden"
          >
            <option value="all">Mọi chức danh</option>
            {jobTitles.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Danh sách Câu hỏi */}
      <div className="space-y-3.5">
        {filteredQuestions.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-slate-800 text-sm">Chưa có câu hỏi nào phù hợp</h3>
            <p className="text-xs text-slate-500 mt-1">Bấm "+ Thêm Câu Hỏi Mới" để bổ sung vào ngân hàng câu hỏi.</p>
          </div>
        ) : (
          filteredQuestions.map((q) => (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-md transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-bold">
                      {q.code}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                      q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      q.difficulty === 'hard' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {q.difficulty === 'easy' ? 'Cơ Bản' : q.difficulty === 'hard' ? 'Nâng Cao' : 'Trung Bình'}
                    </span>
                    <span className="text-xs font-bold text-slate-500">• {q.job_title}</span>
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 pt-1 leading-relaxed">{q.content}</h2>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenModal(q)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Chỉnh sửa câu hỏi"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeactivate(q.id, q.code)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Đóng câu hỏi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Criteria badge & Suggested answer */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Tiêu chí năng lực:</span>
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                    {q.criteria_name || 'Chung'}
                  </span>
                  <span className="text-slate-400">• Đã sử dụng {q.times_used || 0} lần</span>
                </div>

                {q.suggested_answer && (
                  <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-blue-900 font-bold text-[11px]">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      <span>Gợi ý câu trả lời & Dấu hiệu nhận biết (Guidance):</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{q.suggested_answer}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Thêm / Sửa Câu Hỏi */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-base font-bold text-slate-900">
                {editingQuestion ? `Chỉnh Sửa Câu Hỏi [${editingQuestion.code}]` : 'Thêm Câu Hỏi Phỏng Vấn Mới'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã Câu Hỏi *</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mức Độ Khó *</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                  >
                    <option value="easy">Cơ Bản (Easy)</option>
                    <option value="medium">Trung Bình (Medium)</option>
                    <option value="hard">Nâng Cao (Hard)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Chức Danh Tuyển Dụng *</label>
                <input
                  type="text"
                  placeholder="Senior Python Backend Engineer, Frontend Developer..."
                  value={formJobTitle}
                  onChange={(e) => setFormJobTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Gắn Với Tiêu Chí Khung Năng Lực *</label>
                <select
                  value={formCriteriaId}
                  onChange={(e) => setFormCriteriaId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                >
                  <option value="">-- Chọn tiêu chí năng lực --</option>
                  {criteria.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.category || 'Chung'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nội Dung Câu Hỏi *</label>
                <textarea
                  rows={3}
                  placeholder="Nhập nội dung câu hỏi chi tiết..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Gợi Ý Câu Trả Lời & Tiêu Chuẩn Đánh Giá</label>
                <textarea
                  rows={3}
                  placeholder="Các điểm chính ứng viên cần trả lời, dấu hiệu tích cực hoặc cờ đỏ (red flags)..."
                  value={formSuggestedAnswer}
                  onChange={(e) => setFormSuggestedAnswer(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={formSubmitting}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl font-bold shadow-md shadow-blue-500/20"
                >
                  {formSubmitting ? 'Đang lưu...' : 'Lưu Câu Hỏi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
