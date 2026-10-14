"use client";

import React, { useState, useMemo } from "react";
import { masterDataService, type Framework } from "@/services/master-data.service";
import { useApiData } from "@/hooks/useApiData";
import { ErrorState, LoadingState } from "@/components/ui/DataStates";
import { ApiError } from "@/lib/api-client";
import {
  UserCheck,
  Award,
  HelpCircle,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Star,
  FileSpreadsheet,
  Filter,
  Layers,
  Sparkles,
  Edit2,
  Trash2,
  ChevronRight,
  Eye,
  X,
  BookOpen,
  Briefcase,
  Check,
  Tag,
  ThumbsUp,
  ThumbsDown,
  Building2,
  BadgeCheck,
  TrendingUp,
  MessageSquare,
  ClipboardList,
} from "lucide-react";

// =============================================================================
// TYPES & DATA STRUCTURES
// =============================================================================

export interface JobPosition {
  id: string;
  title: string;
  code: string;
  department: string;
  level: "Junior" | "Middle" | "Senior" | "Lead" | "Manager";
}

export interface CompetencyCriterion {
  id: string;
  positionId: string;
  name: string;
  category: "Chuyên môn" | "Kỹ năng mềm" | "Văn hóa & Thái độ";
  weight: number; // 1 to 5
  description: string;
  benchmark1: string; // Kém / Chưa đạt
  benchmark3: string; // Đạt kỳ vọng
  benchmark5: string; // Xuất sắc / Vượt trội
}

export interface InterviewQuestion {
  id: string;
  content: string;
  criterionId: string;
  criterionName: string;
  type: "Kỹ thuật (Technical)" | "Hành vi (Behavioral)" | "Tình huống (Situational)";
  difficulty: "Cơ bản" | "Trung cấp" | "Nâng cao";
  evaluationRubric: string; // Gợi ý đánh giá & Red flags
}

// =============================================================================
// REAL FRAMEWORKS / QUESTION BANK -> PAGE MODELS
// =============================================================================

const LEVELS: JobPosition["level"][] = ["Junior", "Middle", "Senior", "Lead", "Manager"];
const codeOf = (description?: string | null) => /^\[([^\]]+)\]/.exec(description || "")?.[1] || "";
const DIFF_TO_API: Record<InterviewQuestion["difficulty"], string> = { "Cơ bản": "easy", "Trung cấp": "medium", "Nâng cao": "hard" };
const DIFF_FROM_API: Record<string, InterviewQuestion["difficulty"]> = { easy: "Cơ bản", medium: "Trung cấp", hard: "Nâng cao" };
// the question type is carried by the question code prefix (TECH-/BEH-/SIT-)
const TYPE_PREFIX: Record<InterviewQuestion["type"], string> = { "Kỹ thuật (Technical)": "TECH", "Hành vi (Behavioral)": "BEH", "Tình huống (Situational)": "SIT" };
const typeOf = (code: string): InterviewQuestion["type"] =>
  code.startsWith("BEH") ? "Hành vi (Behavioral)" : code.startsWith("SIT") ? "Tình huống (Situational)" : "Kỹ thuật (Technical)";

/** Relative 1–5 weights <-> framework percentages (the server requires a total of exactly 100%). */
function toPercents(weights: number[]): number[] {
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const pct = weights.map((w) => Math.max(1, Math.floor((w / total) * 100)));
  let rest = 100 - pct.reduce((a, b) => a + b, 0);
  for (let i = 0; rest !== 0 && pct.length; i = (i + 1) % pct.length) {
    const step = rest > 0 ? 1 : -1;
    if (pct[i] + step >= 1) { pct[i] += step; rest -= step; }
  }
  return pct;
}
const toScale = (percent: number, n: number) => Math.min(5, Math.max(1, Math.round(((percent * n) / 100) * 3)));

async function loadCompetencyData() {
  const [titles, depts, frameworks, questions] = await Promise.all([
    masterDataService.jobTitles(), masterDataService.departments(false), masterDataService.frameworks(), masterDataService.questions(),
  ]);
  return { titles: titles.filter((t) => t.is_active), depts, frameworks: frameworks.filter((f) => f.status === "active"), questions };
}

const STANDARD_DICTIONARY_TEMPLATES = [
  { name: "Chuyên môn kỹ thuật sâu (Technical Expertise)", category: "Chuyên môn" as const, weight: 5, description: "Nắm vững lý thuyết cốt lõi, ngôn ngữ lập trình và các Best Practices hiện đại." },
  { name: "Kiến trúc hệ thống & Khả năng mở rộng", category: "Chuyên môn" as const, weight: 5, description: "Thiết kế kiến trúc module hóa, microservices, tối ưu hiệu năng hạ tầng." },
  { name: "Tư duy logic & Giải quyết vấn đề phức tạp", category: "Kỹ năng mềm" as const, weight: 4, description: "Khả năng phân tích cấu trúc vấn đề, tư duy phản biện và tiếp cận nguyên nhân gốc rễ." },
  { name: "Giao tiếp & Trình bày ý tưởng kỹ thuật", category: "Kỹ năng mềm" as const, weight: 3, description: "Truyền đạt mạch lạc, lắng nghe phản hồi và thuyết phục các bên liên quan." },
  { name: "Làm việc nhóm & Tinh thần đồng đội (Collaboration)", category: "Kỹ năng mềm" as const, weight: 4, description: "Hợp tác hiệu quả, tương trợ đồng đội và chia sẻ tri thức công nghệ." },
  { name: "Tinh thần chịu trách nhiệm & Tự chủ (Ownership)", category: "Văn hóa & Thái độ" as const, weight: 4, description: "Chủ động nhận việc, theo sát đến kết quả cuối cùng và giữ chữ tín." },
  { name: "Khả năng học hỏi & Thích ứng nhanh (Agility)", category: "Văn hóa & Thái độ" as const, weight: 4, description: "Đón nhận công nghệ mới nhanh chóng, linh hoạt trước sự thay đổi của dự án." },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function HRCompetenciesPage() {
  const [activeTab, setActiveTab] = useState<"framework" | "questions">("framework");

  // State: Positions & Criteria
  const { data: cd, error, loading, reload } = useApiData(loadCompetencyData, []);
  const positions: JobPosition[] = useMemo(() => (cd?.titles || []).map((t) => ({
    id: String(t.id),
    title: t.name,
    code: codeOf(t.description) || `JT-${t.id}`,
    department: cd?.depts.find((d) => d.id === t.department_id)?.name || "Tất cả phòng ban",
    level: LEVELS.find((l) => t.level.toLowerCase().includes(l.toLowerCase())) || "Middle",
  })), [cd]);
  const [selectedPositionId, setSelectedPositionId] = useState<string>("");
  // the framework applied to a job title (by title name, S2-06)
  const frameworkFor = (positionId: string): Framework | undefined => {
    const title = positions.find((p) => p.id === positionId)?.title;
    return title ? cd?.frameworks.find((f) => f.applied_job_titles.includes(title)) : undefined;
  };
  const criteria: CompetencyCriterion[] = useMemo(() => positions.flatMap((pos) => {
    const fw = cd?.frameworks.find((f) => f.applied_job_titles.includes(pos.title));
    if (!fw) return [];
    return fw.criteria.map((c) => ({
      id: c.id || c.code,
      positionId: pos.id,
      name: c.name,
      category: (c.category as CompetencyCriterion["category"]) || "Chuyên môn",
      weight: toScale(c.weight, fw.criteria.length),
      description: c.description || "",
      benchmark1: c.benchmark_low || "",
      benchmark3: c.benchmark_mid || "",
      benchmark5: c.benchmark_high || "",
    }));
  }), [cd, positions]);
  const [saving, setSaving] = useState(false);
  const [posSearch, setPosSearch] = useState("");

  // State: Questions
  const questions: InterviewQuestion[] = useMemo(() => (cd?.questions || []).map((q) => ({
    id: q.id,
    content: q.content,
    criterionId: q.criteria_id,
    criterionName: q.criteria_name || "",
    type: typeOf(q.code),
    difficulty: DIFF_FROM_API[q.difficulty] || "Trung cấp",
    evaluationRubric: q.suggested_answer || "",
  })), [cd]);
  const [questionSearch, setQuestionSearch] = useState("");
  const [filterCriterionId, setFilterCriterionId] = useState("all");
  const [filterDifficulty, setFilterDifficulty] = useState("all");

  // State: Modals
  const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState(false);
  const [criteriaModalMode, setCriteriaModalMode] = useState<"create" | "edit">("create");
  const [editingCriterion, setEditingCriterion] = useState<CompetencyCriterion | null>(null);
  const [criteriaFormData, setCriteriaFormData] = useState({
    name: "",
    category: "Chuyên môn" as CompetencyCriterion["category"],
    weight: 4,
    description: "",
    benchmark1: "",
    benchmark3: "",
    benchmark5: "",
  });

  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [questionModalMode, setQuestionModalMode] = useState<"create" | "edit">("create");
  const [editingQuestion, setEditingQuestion] = useState<InterviewQuestion | null>(null);
  const [questionFormData, setQuestionFormData] = useState({
    content: "",
    criterionId: "",
    type: "Kỹ thuật (Technical)" as InterviewQuestion["type"],
    difficulty: "Trung cấp" as InterviewQuestion["difficulty"],
    evaluationRubric: "",
  });

  // State: Scorecard Preview Modal
  const [isScorecardOpen, setIsScorecardOpen] = useState(false);
  const mockCandidateName = "Ứng viên mẫu (xem trước phiếu chấm)";
  const [scorecardRatings, setScorecardRatings] = useState<Record<string, number>>({});
  const [scorecardNotes, setScorecardNotes] = useState<Record<string, string>>({});
  const [recommendation, setRecommendation] = useState<"Strong Hire" | "Hire" | "Hold" | "No Hire">("Hire");

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Filtered positions on left column
  const filteredPositions = useMemo(() => {
    const q = posSearch.trim().toLowerCase();
    return positions.filter(
      (p) =>
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q)
    );
  }, [positions, posSearch]);

  const selectedPosition = useMemo(() => {
    return positions.find((p) => p.id === selectedPositionId) || positions[0] || { id: "", title: "", code: "", department: "", level: "Middle" as const };
  }, [positions, selectedPositionId]);

  // Criteria for selected position
  const currentPositionCriteria = useMemo(() => {
    return criteria.filter((c) => c.positionId === selectedPosition.id);
  }, [criteria, selectedPosition.id]);

  // Total weight indicator (1-5 scale)
  const averageWeight = useMemo(() => {
    if (currentPositionCriteria.length === 0) return 0;
    const sum = currentPositionCriteria.reduce((acc, c) => acc + c.weight, 0);
    return (sum / currentPositionCriteria.length).toFixed(1);
  }, [currentPositionCriteria]);

  // Filtered questions in Tab 2
  const filteredQuestions = useMemo(() => {
    const q = questionSearch.trim().toLowerCase();
    return questions.filter((item) => {
      const matchSearch =
        !q ||
        item.content.toLowerCase().includes(q) ||
        item.criterionName.toLowerCase().includes(q) ||
        item.evaluationRubric.toLowerCase().includes(q);
      const matchCrit =
        filterCriterionId === "all" || item.criterionId === filterCriterionId;
      const matchDiff =
        filterDifficulty === "all" || item.difficulty === filterDifficulty;
      return matchSearch && matchCrit && matchDiff;
    });
  }, [questions, questionSearch, filterCriterionId, filterDifficulty]);

  // Persist the selected title's criteria as its framework (created on first criterion)
  const saveCriteria = async (list: CompetencyCriterion[]) => {
    const pos = selectedPosition;
    const fw = frameworkFor(pos.id);
    if (!list.length) throw new ApiError(422, "Khung năng lực phải có ít nhất một tiêu chí.");
    const pct = toPercents(list.map((c) => c.weight));
    const payload = {
      code: fw?.code || `FW-${pos.code}`.slice(0, 50),
      name: fw?.name || `Khung năng lực - ${pos.title}`,
      department: fw?.department || pos.department,
      applied_job_titles: fw?.applied_job_titles || [pos.title],
      criteria: list.map((c, i) => ({
        id: fw?.criteria.some((x) => x.id === c.id) ? c.id : undefined,
        code: fw?.criteria.find((x) => x.id === c.id)?.code || `C${i + 1}-${Date.now() % 100000}`,
        name: c.name, description: c.description, weight: pct[i], category: c.category,
        benchmark_low: c.benchmark1, benchmark_mid: c.benchmark3, benchmark_high: c.benchmark5,
      })),
    };
    await masterDataService.saveFramework(payload, fw?.id);
    reload();
  };

  // Handle Save Criterion
  const handleSaveCriterion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!criteriaFormData.name.trim()) {
      showToast("Vui lòng nhập tên tiêu chí đánh giá", "error");
      return;
    }
    const edited: CompetencyCriterion = {
      id: criteriaModalMode === "edit" && editingCriterion ? editingCriterion.id : `new-${Date.now()}`,
      positionId: selectedPosition.id,
      name: criteriaFormData.name.trim(),
      category: criteriaFormData.category,
      weight: Number(criteriaFormData.weight),
      description: criteriaFormData.description.trim(),
      benchmark1: criteriaFormData.benchmark1.trim(),
      benchmark3: criteriaFormData.benchmark3.trim(),
      benchmark5: criteriaFormData.benchmark5.trim(),
    };
    const list = criteriaModalMode === "edit" && editingCriterion
      ? currentPositionCriteria.map((c) => (c.id === editingCriterion.id ? edited : c))
      : [...currentPositionCriteria, edited];
    setSaving(true);
    try {
      await saveCriteria(list);
      showToast(criteriaModalMode === "edit" ? "Cập nhật tiêu chí đánh giá thành công!" : `Đã thêm tiêu chí "${edited.name}" cho ${selectedPosition.title}!`);
      setIsCriteriaModalOpen(false);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Không lưu được tiêu chí.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Handle Delete Criterion (blocked by the server while questions reference it)
  const handleDeleteCriterion = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa tiêu chí "${name}"? Các câu hỏi gắn với tiêu chí này sẽ cần cập nhật lại.`)) return;
    try {
      await saveCriteria(currentPositionCriteria.filter((c) => c.id !== id));
      showToast(`Đã xóa tiêu chí "${name}"!`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Không xóa được tiêu chí.", "error");
    }
  };

  // Handle Save Question
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionFormData.content.trim() || !questionFormData.criterionId) {
      showToast("Vui lòng điền nội dung câu hỏi và chọn tiêu chí năng lực gắn kết", "error");
      return;
    }
    const prefix = TYPE_PREFIX[questionFormData.type];
    const existingCode = editingQuestion ? cd?.questions.find((q) => q.id === editingQuestion.id)?.code : undefined;
    const code = existingCode && existingCode.startsWith(prefix) ? existingCode : `${prefix}-${Date.now() % 1000000}`;
    setSaving(true);
    try {
      await masterDataService.saveQuestion({
        code,
        content: questionFormData.content.trim(),
        criteria_id: questionFormData.criterionId,
        job_title: selectedPosition.title || undefined,
        difficulty: DIFF_TO_API[questionFormData.difficulty],
        suggested_answer: questionFormData.evaluationRubric.trim() || undefined,
      }, questionModalMode === "edit" && editingQuestion ? editingQuestion.id : undefined);
      showToast(questionModalMode === "edit" ? "Cập nhật câu hỏi phỏng vấn thành công!" : "Đã bổ sung câu hỏi mới vào Ngân hàng phỏng vấn!");
      setIsQuestionModalOpen(false);
      reload();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Không lưu được câu hỏi.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Scorecard Weighted Score calculation
  const weightedScorecardAverage = useMemo(() => {
    if (currentPositionCriteria.length === 0) return 0;
    let totalScore = 0;
    let totalWeight = 0;

    currentPositionCriteria.forEach((crit) => {
      const rating = scorecardRatings[crit.id] || 3;
      totalScore += rating * crit.weight;
      totalWeight += crit.weight;
    });

    return totalWeight > 0 ? (totalScore / totalWeight).toFixed(2) : "0.00";
  }, [currentPositionCriteria, scorecardRatings]);

  if (loading) return <LoadingState />;
  if (error || !cd) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="w-full space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Container Card: bg-white rounded-2xl shadow-sm border border-slate-100 */}
      <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-6">
        {/* Header Tiêu đề phân hệ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-extrabold text-[10px] tracking-wider uppercase border border-indigo-100">
                HR Competency & Scorecard Hub
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Chuẩn hóa đánh giá phỏng vấn
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 mt-1 tracking-tight">
              Khung Năng Lực & Đánh Giá Phỏng Vấn
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Thiết lập bộ tiêu chí năng lực trọng số cho từng chức danh, ngân hàng câu hỏi gắn tag và tạo tự động Phiếu đánh giá Scorecard.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            {/* Nút Xem trước Scorecard Template */}
            <button
              type="button"
              onClick={() => {
                // Initialize default ratings for preview
                const initialRatings: Record<string, number> = {};
                currentPositionCriteria.forEach((c) => {
                  initialRatings[c.id] = 4;
                });
                setScorecardRatings(initialRatings);
                setIsScorecardOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md shadow-slate-900/15 transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Xem trước Scorecard</span>
            </button>

            {activeTab === "questions" && (
              <button
                type="button"
                onClick={() => {
                  setQuestionFormData({
                    content: "",
                    criterionId: currentPositionCriteria[0]?.id || criteria[0]?.id || "",
                    type: "Kỹ thuật (Technical)",
                    difficulty: "Trung cấp",
                    evaluationRubric: "",
                  });
                  setQuestionModalMode("create");
                  setIsQuestionModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm câu hỏi mới</span>
              </button>
            )}
          </div>
        </div>

        {/* 2 TABS SWITCHER */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/60 max-w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("framework")}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "framework"
                ? "bg-white text-blue-600 shadow-sm shadow-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Khung năng lực theo Chức danh</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-600 font-extrabold border border-blue-100">
              Giao diện 2 cột
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("questions")}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "questions"
                ? "bg-white text-blue-600 shadow-sm shadow-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Ngân hàng câu hỏi phỏng vấn</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 font-extrabold border border-indigo-100">
              Gắn Tag tiêu chí
            </span>
          </button>
        </div>

        {/* =================================================================== */}
        {/* TAB 1: KHUNG NĂNG LỰC THEO CHỨC DANH (GIAO DIỆN 2 CỘT) */}
        {/* =================================================================== */}
        {activeTab === "framework" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* CỘT TRÁI (4 COLUMNS): DANH SÁCH CHỨC DANH */}
            <div className="lg:col-span-4 bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                  Chọn Chức Danh ({positions.length})
                </span>
                <span className="text-[10px] font-bold text-slate-500">Click để cấu hình</span>
              </div>

              {/* Tìm kiếm chức danh */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm chức danh, mã vị trí..."
                  value={posSearch}
                  onChange={(e) => setPosSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
                />
              </div>

              {/* Danh sách các nút chức danh */}
              <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                {filteredPositions.map((pos) => {
                  const isSelected = pos.id === selectedPosition.id;
                  const critCount = criteria.filter((c) => c.positionId === pos.id).length;

                  return (
                    <div
                      key={pos.id}
                      onClick={() => setSelectedPositionId(pos.id)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 ring-2 ring-blue-500/20"
                          : "bg-white border-slate-200/90 text-slate-800 hover:border-blue-300 hover:bg-blue-50/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-extrabold text-xs tracking-tight leading-snug">
                          {pos.title}
                        </div>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase shrink-0 ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {pos.level}
                        </span>
                      </div>

                      <div
                        className={`text-[10px] font-mono mt-1 ${
                          isSelected ? "text-blue-100" : "text-slate-400"
                        }`}
                      >
                        {pos.code}
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/40 text-[10px] font-medium">
                        <span className={isSelected ? "text-blue-100" : "text-slate-500"}>
                          {pos.department}
                        </span>
                        <span
                          className={`font-bold px-1.5 py-0.2 rounded-full ${
                            isSelected
                              ? "bg-white text-blue-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {critCount} tiêu chí
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CỘT PHẢI (8 COLUMNS): DANH SÁCH TIÊU CHÍ ĐÁNH GIÁ CỦA CHỨC DANH */}
            <div className="lg:col-span-8 space-y-4">
              {/* Header Cột phải */}
              <div className="p-4 bg-linear-to-r from-blue-50/70 to-indigo-50/50 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-600 text-white">
                      Đang cấu hình
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Mã: {selectedPosition.code}
                    </span>
                  </div>
                  <h2 className="text-base font-black text-slate-900 mt-1">
                    {selectedPosition.title}
                  </h2>
                  <div className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-3">
                    <span>Phòng: {selectedPosition.department}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-bold text-amber-600">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      Trọng số TB: {averageWeight}/5
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCriteriaFormData({
                        name: "",
                        category: "Chuyên môn",
                        weight: 4,
                        description: "",
                        benchmark1: "",
                        benchmark3: "",
                        benchmark5: "",
                      });
                      setCriteriaModalMode("create");
                      setIsCriteriaModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm tiêu chí</span>
                  </button>
                </div>
              </div>

              {/* Danh sách các card Tiêu chí */}
              {currentPositionCriteria.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-3">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                  <div className="text-sm font-bold text-slate-600">
                    Chưa có tiêu chí đánh giá nào cho chức danh này
                  </div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Bấm nút &quot;Thêm tiêu chí&quot; để chọn từ bộ từ điển chuẩn hoặc tạo tiêu chí đánh giá mới.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentPositionCriteria.map((crit, index) => {
                    const linkedQuestions = questions.filter(
                      (q) => q.criterionId === crit.id
                    );

                    return (
                      <div
                        key={crit.id}
                        className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-2xs space-y-3 group"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-black text-xs">
                              {index + 1}
                            </span>
                            <span className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                              {crit.name}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                crit.category === "Chuyên môn"
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : crit.category === "Kỹ năng mềm"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }`}
                            >
                              {crit.category}
                            </span>
                          </div>

                          {/* Trọng số & Actions */}
                          <div className="flex items-center justify-between sm:justify-end gap-3">
                            <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                              <span className="text-[10px] font-black text-amber-800">
                                Trọng số:
                              </span>
                              <div className="flex items-center text-amber-500">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-3 h-3 ${
                                      star <= crit.weight
                                        ? "fill-amber-400 text-amber-500"
                                        : "text-slate-200"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCriterion(crit);
                                  setCriteriaFormData({
                                    name: crit.name,
                                    category: crit.category,
                                    weight: crit.weight,
                                    description: crit.description,
                                    benchmark1: crit.benchmark1,
                                    benchmark3: crit.benchmark3,
                                    benchmark5: crit.benchmark5,
                                  });
                                  setCriteriaModalMode("edit");
                                  setIsCriteriaModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Chỉnh sửa tiêu chí"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCriterion(crit.id, crit.name)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Xóa tiêu chí"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Mô tả kỳ vọng */}
                        <p className="text-xs text-slate-600 leading-relaxed font-normal">
                          {crit.description}
                        </p>

                        {/* Thang Rubric Điểm 1-3-5 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-[11px]">
                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                            <span className="font-bold text-rose-700 block text-[10px]">
                              ● Điểm 1 (Chưa đạt):
                            </span>
                            <span className="text-slate-500 text-[10px]">
                              {crit.benchmark1}
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                            <span className="font-bold text-amber-700 block text-[10px]">
                              ● Điểm 3 (Đạt chuẩn):
                            </span>
                            <span className="text-slate-500 text-[10px]">
                              {crit.benchmark3}
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                            <span className="font-bold text-emerald-700 block text-[10px]">
                              ● Điểm 5 (Xuất sắc):
                            </span>
                            <span className="text-slate-500 text-[10px]">
                              {crit.benchmark5}
                            </span>
                          </div>
                        </div>

                        {/* Câu hỏi phỏng vấn liên kết */}
                        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1.5 font-medium">
                            <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                            Đã map <strong className="text-slate-800">{linkedQuestions.length}</strong> câu hỏi phỏng vấn
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setQuestionFormData({
                                content: "",
                                criterionId: crit.id,
                                type: "Kỹ thuật (Technical)",
                                difficulty: "Trung cấp",
                                evaluationRubric: "",
                              });
                              setQuestionModalMode("create");
                              setIsQuestionModalOpen(true);
                            }}
                            className="text-blue-600 font-bold hover:underline cursor-pointer"
                          >
                            + Thêm câu hỏi cho tiêu chí này
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: NGÂN HÀNG CÂU HỎI PHỎNG VẤN (GẮN TAG TIÊU CHÍ) */}
        {/* =================================================================== */}
        {activeTab === "questions" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm nội dung câu hỏi, gợi ý rubric..."
                    value={questionSearch}
                    onChange={(e) => setQuestionSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={filterCriterionId}
                    onChange={(e) => setFilterCriterionId(e.target.value)}
                    className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 focus:outline-hidden"
                  >
                    <option value="all">Tất cả tiêu chí năng lực</option>
                    {criteria.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 focus:outline-hidden"
                  >
                    <option value="all">Tất cả độ khó</option>
                    <option value="Cơ bản">Cơ bản</option>
                    <option value="Trung cấp">Trung cấp</option>
                    <option value="Nâng cao">Nâng cao</option>
                  </select>
                </div>
              </div>

              <div className="text-xs text-slate-500 font-bold">
                Có <strong className="text-slate-900">{filteredQuestions.length}</strong> câu hỏi trong ngân hàng
              </div>
            </div>

            {/* Questions Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-3.5 px-4 w-5/12">Câu hỏi phỏng vấn</th>
                      <th className="py-3.5 px-3 w-3/12">Tiêu chí năng lực được Map</th>
                      <th className="py-3.5 px-3">Phân loại & Độ khó</th>
                      <th className="py-3.5 px-4">Gợi ý đánh giá (Rubric)</th>
                      <th className="py-3.5 px-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-medium">
                    {filteredQuestions.map((q) => (
                      <tr key={q.id} className="hover:bg-blue-50/20 transition-colors">
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-extrabold text-slate-900 text-xs leading-relaxed">
                            {q.content}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 align-top">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                            <Tag className="w-3 h-3 text-blue-500" />
                            {q.criterionName}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 align-top">
                          <div className="space-y-1">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700">
                              {q.type}
                            </span>
                            <div>
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  q.difficulty === "Nâng cao"
                                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                                    : q.difficulty === "Trung cấp"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                }`}
                              >
                                {q.difficulty}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 align-top text-slate-500 text-[11px] leading-relaxed">
                          {q.evaluationRubric}
                        </td>
                        <td className="py-3.5 px-3 text-right align-top">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingQuestion(q);
                                setQuestionFormData({
                                  content: q.content,
                                  criterionId: q.criterionId,
                                  type: q.type,
                                  difficulty: q.difficulty,
                                  evaluationRubric: q.evaluationRubric,
                                });
                                setQuestionModalMode("edit");
                                setIsQuestionModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Sửa câu hỏi"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm("Bạn có chắc chắn muốn ngừng sử dụng câu hỏi này?")) {
                                  masterDataService.deactivateQuestion(q.id)
                                    .then(() => { showToast("Đã ngừng sử dụng câu hỏi!"); reload(); })
                                    .catch((err) => showToast(err instanceof ApiError ? err.message : "Không cập nhật được câu hỏi.", "error"));
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Xóa câu hỏi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* MODAL 1: THÊM / SỬA TIÊU CHÍ ĐÁNH GIÁ (TAB 1) */}
      {/* =================================================================== */}
      {isCriteriaModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-900/50 backdrop-blur-xs transition-all"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCriteriaModalOpen(false);
          }}
        >
          {/* 1. Modal Wrapper siêu rộng: w-full max-w-6xl xl:max-w-7xl (~1152px - 1280px) */}
          <div 
            className="w-full max-w-6xl xl:max-w-7xl bg-white rounded-2xl shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 md:px-8 lg:px-10 py-5 border-b border-slate-100 bg-slate-50/70 sticky top-0 z-10 backdrop-blur-md">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shadow-xs">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">
                    {criteriaModalMode === "create"
                      ? `Thêm Tiêu Chí Năng Lực cho: ${selectedPosition.title}`
                      : "Chỉnh Sửa Tiêu Chí Năng Lực"}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Cấu hình trọng số và chuẩn mực hành vi (Rubric chuẩn ATS)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCriteriaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body với padding rộng rãi p-6 md:p-8 lg:p-10 */}
            <form onSubmit={handleSaveCriterion} className="p-6 md:p-8 lg:p-10 space-y-6 text-xs">
              {/* Chọn nhanh từ template từ điển: Dàn trải toàn bộ chiều rộng lớn */}
              {criteriaModalMode === "create" && (
                <div className="p-4 md:p-5 bg-blue-50/60 rounded-xl border border-blue-100 space-y-3">
                  <span className="text-xs font-extrabold text-blue-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    Hoặc chọn nhanh từ Từ điển năng lực chuẩn doanh nghiệp:
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {STANDARD_DICTIONARY_TEMPLATES.map((tpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setCriteriaFormData({
                            name: tpl.name,
                            category: tpl.category,
                            weight: tpl.weight,
                            description: tpl.description,
                            benchmark1: "Chưa đạt yêu cầu tối thiểu",
                            benchmark3: "Đáp ứng đầy đủ chuẩn mực công việc",
                            benchmark5: "Đột phá, dẫn dắt các thành viên khác",
                          });
                        }}
                        className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                      >
                        + {tpl.name.split("(")[0]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dòng 1: Phân bố 12 cột tận dụng bề ngang rộng lớn */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Tên tiêu chí năng lực (6 cột) */}
                <div className="lg:col-span-6">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                    Tên tiêu chí năng lực <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Kiến trúc Microservices & CSDL phân tán"
                    value={criteriaFormData.name}
                    onChange={(e) => setCriteriaFormData({ ...criteriaFormData, name: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium transition-all"
                  />
                </div>

                {/* Nhóm năng lực (3 cột) */}
                <div className="lg:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                    Nhóm năng lực
                  </label>
                  <select
                    value={criteriaFormData.category}
                    onChange={(e) =>
                      setCriteriaFormData({
                        ...criteriaFormData,
                        category: e.target.value as CompetencyCriterion["category"],
                      })
                    }
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium transition-all cursor-pointer"
                  >
                    <option value="Chuyên môn">Chuyên môn (Technical / Domain)</option>
                    <option value="Kỹ năng mềm">Kỹ năng mềm (Soft Skills)</option>
                    <option value="Văn hóa & Thái độ">Văn hóa & Thái độ (Culture Fit)</option>
                  </select>
                </div>

                {/* Trọng số (3 cột) */}
                <div className="lg:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                    Trọng số (1 - 5 sao) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={criteriaFormData.weight}
                    onChange={(e) =>
                      setCriteriaFormData({
                        ...criteriaFormData,
                        weight: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800 transition-all cursor-pointer"
                  >
                    <option value="1">1 sao - Bổ trợ nhỏ (Trọng số 1)</option>
                    <option value="2">2 sao - Thứ yếu (Trọng số 2)</option>
                    <option value="3">3 sao - Tiêu chuẩn (Trọng số 3)</option>
                    <option value="4">4 sao - Rất quan trọng (Trọng số 4)</option>
                    <option value="5">5 sao - Bắt buộc cốt lõi (Trọng số 5)</option>
                  </select>
                </div>
              </div>

              {/* Mô tả hành vi mong đợi & Yêu cầu chi tiết (w-full) */}
              <div className="w-full">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                  Mô tả hành vi mong đợi & Yêu cầu chi tiết
                </label>
                <textarea
                  rows={3}
                  placeholder="Mô tả cụ thể ứng viên cần thể hiện được những kỹ năng gì..."
                  value={criteriaFormData.description}
                  onChange={(e) =>
                    setCriteriaFormData({ ...criteriaFormData, description: e.target.value })
                  }
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium transition-all resize-none leading-relaxed"
                />
              </div>

              {/* Thang đo chuẩn mực đánh giá (Rubric) với 3 cột rộng rãi */}
              <div className="w-full p-5 md:p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">
                    Thang đo chuẩn mực đánh giá (Rubric)
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Cung cấp gợi ý chuẩn mực giúp người phỏng vấn chấm điểm đồng nhất
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Điểm 1 */}
                  <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-2xs">
                    <label className="block text-[11px] font-bold text-rose-700 mb-2 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-rose-50 text-rose-700 flex items-center justify-center text-[10px] font-extrabold">1</span>
                      Điểm 1 (Chưa đạt / Dưới chuẩn)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Mô tả biểu hiện của ứng viên chưa đạt..."
                      value={criteriaFormData.benchmark1}
                      onChange={(e) =>
                        setCriteriaFormData({ ...criteriaFormData, benchmark1: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-rose-400 font-medium resize-none leading-relaxed"
                    />
                  </div>

                  {/* Điểm 3 */}
                  <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-2xs">
                    <label className="block text-[11px] font-bold text-amber-700 mb-2 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center text-[10px] font-extrabold">3</span>
                      Điểm 3 (Đạt chuẩn kỳ vọng)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Mô tả biểu hiện của ứng viên đạt chuẩn..."
                      value={criteriaFormData.benchmark3}
                      onChange={(e) =>
                        setCriteriaFormData({ ...criteriaFormData, benchmark3: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-amber-400 font-medium resize-none leading-relaxed"
                    />
                  </div>

                  {/* Điểm 5 */}
                  <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-2xs">
                    <label className="block text-[11px] font-bold text-emerald-700 mb-2 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center text-[10px] font-extrabold">5</span>
                      Điểm 5 (Xuất sắc / Vượt trội)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Mô tả biểu hiện của ứng viên vượt trội..."
                      value={criteriaFormData.benchmark5}
                      onChange={(e) =>
                        setCriteriaFormData({ ...criteriaFormData, benchmark5: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-emerald-400 font-medium resize-none leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCriteriaModalOpen(false)}
                  className="px-6 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-7 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
                >
                  {criteriaModalMode === "create" ? "Xác nhận thêm tiêu chí" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: THÊM / SỬA CÂU HỎI PHỎNG VẤN (TAB 2) */}
      {/* =================================================================== */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    {questionModalMode === "create"
                      ? "Bổ sung câu hỏi vào Ngân hàng phỏng vấn"
                      : "Chỉnh sửa câu hỏi phỏng vấn"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Map câu hỏi vào tiêu chí năng lực để người phỏng vấn dễ chọn
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuestionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nội dung câu hỏi phỏng vấn <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="VD: Hãy mô tả cách bạn tối ưu hóa truy vấn SQL khi bảng dữ liệu đạt hơn 10 triệu bản ghi?"
                  value={questionFormData.content}
                  onChange={(e) =>
                    setQuestionFormData({ ...questionFormData, content: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Gắn kết vào Tiêu chí năng lực <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={questionFormData.criterionId}
                  onChange={(e) =>
                    setQuestionFormData({ ...questionFormData, criterionId: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
                >
                  <option value="">-- Chọn tiêu chí năng lực --</option>
                  {criteria.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.category}] {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Loại câu hỏi
                  </label>
                  <select
                    value={questionFormData.type}
                    onChange={(e) =>
                      setQuestionFormData({
                        ...questionFormData,
                        type: e.target.value as InterviewQuestion["type"],
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
                  >
                    <option value="Kỹ thuật (Technical)">Kỹ thuật (Technical)</option>
                    <option value="Hành vi (Behavioral)">Hành vi (Behavioral - STAR)</option>
                    <option value="Tình huống (Situational)">Tình huống (Situational)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Độ khó
                  </label>
                  <select
                    value={questionFormData.difficulty}
                    onChange={(e) =>
                      setQuestionFormData({
                        ...questionFormData,
                        difficulty: e.target.value as InterviewQuestion["difficulty"],
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
                  >
                    <option value="Cơ bản">Cơ bản (Junior/Entry)</option>
                    <option value="Trung cấp">Trung cấp (Middle)</option>
                    <option value="Nâng cao">Nâng cao (Senior/Lead)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Gợi ý đánh giá & Dấu hiệu nhận biết (Rubric & Red flags)
                </label>
                <textarea
                  rows={2}
                  placeholder="Gợi ý câu trả lời tốt cần nhắc tới điểm gì, và những dấu hiệu cảnh báo là gì..."
                  value={questionFormData.evaluationRubric}
                  onChange={(e) =>
                    setQuestionFormData({
                      ...questionFormData,
                      evaluationRubric: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  {questionModalMode === "create" ? "Thêm câu hỏi" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: MÔ PHỎNG PHIẾU ĐÁNH GIÁ (SCORECARD TEMPLATE PREVIEW) */}
      {/* =================================================================== */}
      {isScorecardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Scorecard Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                  <ClipboardList className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Live Scorecard Preview
                    </span>
                    <span className="text-xs text-slate-400">
                      Mẫu phiếu phỏng vấn tự động
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold tracking-tight mt-0.5">
                    Phiếu Đánh Giá Ứng Viên: {selectedPosition.title}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsScorecardOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scorecard Info Bar */}
            <div className="px-6 py-3 bg-slate-100/90 border-b border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-700">
              <div className="flex items-center gap-3">
                <span>
                  Ứng viên: <strong className="text-slate-900">{mockCandidateName}</strong>
                </span>
                <span>•</span>
                <span>
                  Vòng: <strong className="text-blue-700">Chuyên môn & System Architecture</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-bold">Điểm trọng số tính toán:</span>
                <span className="text-sm font-black text-blue-700 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-2xs font-mono">
                  {weightedScorecardAverage} / 5.0
                </span>
              </div>
            </div>

            {/* Scorecard Body Scrollable */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <p className="text-xs text-slate-500">
                Form đánh giá này được hệ thống tự động biên soạn từ{" "}
                <strong>{currentPositionCriteria.length} tiêu chí năng lực</strong> và các câu hỏi phỏng vấn đã map tương ứng.
              </p>

              {currentPositionCriteria.map((crit, idx) => {
                const currentRating = scorecardRatings[crit.id] || 3;
                const relevantQuestions = questions.filter((q) => q.criterionId === crit.id);

                return (
                  <div
                    key={crit.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4 shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">
                            Tiêu chí {idx + 1}: {crit.name}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                            Trọng số x{crit.weight}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {crit.description}
                        </p>
                      </div>

                      {/* 1 to 5 Score Radio Buttons */}
                      <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                        {[1, 2, 3, 4, 5].map((point) => (
                          <button
                            key={point}
                            type="button"
                            onClick={() =>
                              setScorecardRatings({
                                ...scorecardRatings,
                                [crit.id]: point,
                              })
                            }
                            className={`w-8 h-8 rounded-lg text-xs font-extrabold flex items-center justify-center transition-all cursor-pointer ${
                              currentRating === point
                                ? point >= 4
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : point === 3
                                  ? "bg-blue-600 text-white shadow-xs"
                                  : "bg-rose-600 text-white shadow-xs"
                                : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {point}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Câu hỏi gợi ý từ ngân hàng */}
                    {relevantQuestions.length > 0 && (
                      <div className="bg-white p-3 rounded-xl border border-slate-200/90 space-y-2">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                          <HelpCircle className="w-3 h-3 text-blue-500" />
                          Câu hỏi phỏng vấn trọng tâm:
                        </span>
                        <ul className="space-y-1.5 text-xs text-slate-700 pl-4 list-disc font-medium">
                          {relevantQuestions.map((q) => (
                            <li key={q.id}>
                              <span>{q.content}</span>
                              <span className="text-[10px] text-slate-400 block font-normal">
                                ↳ Gợi ý: {q.evaluationRubric}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Ô ghi chú của phỏng vấn viên */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Bằng chứng & Nhận xét của phỏng vấn viên (Evidence / Notes):
                      </label>
                      <input
                        type="text"
                        placeholder="Nhập dẫn chứng câu trả lời của ứng viên..."
                        value={scorecardNotes[crit.id] || ""}
                        onChange={(e) =>
                          setScorecardNotes({
                            ...scorecardNotes,
                            [crit.id]: e.target.value,
                          })
                        }
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                );
              })}

              {/* Khuyến nghị tuyển dụng cuối cùng (Overall Recommendation) */}
              <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-black text-white">
                      Quyết định đề xuất (Hiring Recommendation)
                    </h4>
                    <p className="text-xs text-slate-400">
                      Tổng hợp ý kiến phỏng vấn viên trước khi chuyển lên HR & BOD
                    </p>
                  </div>

                  {/* 4 Nút Lựa chọn Quyết định */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRecommendation("Strong Hire")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        recommendation === "Strong Hire"
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      Strong Hire (Xuất sắc)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecommendation("Hire")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        recommendation === "Hire"
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      Hire (Đạt yêu cầu)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecommendation("Hold")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        recommendation === "Hold"
                          ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30 ring-2 ring-amber-400"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      Hold (Cân nhắc)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecommendation("No Hire")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        recommendation === "No Hire"
                          ? "bg-rose-600 text-white shadow-lg shadow-rose-500/30 ring-2 ring-rose-400"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      No Hire (Loại)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Scorecard Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  showToast("Đã tải xuống bản mẫu phiếu đánh giá Scorecard PDF!");
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Xuất file PDF / In mẫu phiếu</span>
              </button>

              <button
                type="button"
                onClick={() => setIsScorecardOpen(false)}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Đóng xem trước
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
