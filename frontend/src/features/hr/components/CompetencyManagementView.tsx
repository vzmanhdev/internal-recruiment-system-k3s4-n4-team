"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Award,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit3,
  Copy,
  Trash2,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Layers,
  HelpCircle,
  Briefcase,
  ChevronRight,
  Info,
  X,
  Sparkles,
  Sliders,
  Check,
  Star,
  ExternalLink,
  Printer,
  ChevronDown
} from "lucide-react";
import {
  competencyService,
  CompetencyFramework,
  CompetencyCriteria,
  JobTitleItem,
  InterviewScorecardPreview,
  CreateFrameworkInput,
  RubricScale
} from "../services/competency.service";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ApiError } from "@/lib/api-client";

// Danh mục chuyên môn chuẩn
const CATEGORY_OPTIONS = [
  "Công nghệ & Kỹ thuật",
  "Kiểm thử & Chất lượng",
  "Quản lý & Sản phẩm",
  "Nhân sự & Tuyển dụng",
  "Kinh doanh & Vận hành",
  "Chung toàn công ty"
];

// Phân loại tiêu chí
const CRITERIA_CATEGORIES = [
  "Chuyên môn",
  "Tư duy & Kỹ năng",
  "Văn hóa & Thái độ"
];

interface FormCriterion {
  id?: number;
  code: string;
  name: string;
  category: string;
  weight: number;
  required_level: number;
  description: string;
  rubric_1: string;
  rubric_3: string;
  rubric_5: string;
  questions: string[];
}

export function CompetencyManagementView() {
  // State dữ liệu chính
  const [frameworks, setFrameworks] = useState<CompetencyFramework[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitleItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Bộ lọc & Tìm kiếm
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJobFilter, setSelectedJobFilter] = useState("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");

  // Modal Form (Tạo / Sửa / Nhân bản)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit" | "clone">("create");
  const [editingFrameworkId, setEditingFrameworkId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Công nghệ & Kỹ thuật");
  const [formDescription, setFormDescription] = useState("");
  const [formJobTitles, setFormJobTitles] = useState<string[]>([]);
  const [customJobInput, setCustomJobInput] = useState("");
  const [formCriteria, setFormCriteria] = useState<FormCriterion[]>([]);

  // Modal Xóa
  const [deletingFramework, setDeletingFramework] = useState<CompetencyFramework | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal Xem trước Phiếu Phỏng Vấn Sprint 6 (S2-06-AC04)
  const [scorecardModalOpen, setScorecardModalOpen] = useState(false);
  const [activeScorecard, setActiveScorecard] = useState<InterviewScorecardPreview | null>(null);
  const [scorecardLoading, setScorecardLoading] = useState(false);
  const [simulatedScores, setSimulatedScores] = useState<Record<number, number>>({});
  const [selectedScorecardJob, setSelectedScorecardJob] = useState("");
  const [candidateNameInput, setCandidateNameInput] = useState("Nguyễn Văn Ứng Viên");

  // Fetch initial data
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fws, titles] = await Promise.all([
        competencyService.getCompetencies(),
        competencyService.getJobTitles().catch(() => [])
      ]);
      setFrameworks(fws);
      setJobTitles(titles);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : "Không thể tải danh sách khung năng lực từ máy chủ.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Tính tổng trọng số hiện tại của form
  const totalWeight = useMemo(() => {
    return Math.round(formCriteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0) * 100) / 100;
  }, [formCriteria]);

  // Lọc danh sách khung năng lực
  const filteredFrameworks = useMemo(() => {
    return frameworks.filter((fw) => {
      const matchSearch =
        searchQuery === "" ||
        fw.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fw.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fw.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fw.job_titles.some((j) => j.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchJob =
        selectedJobFilter === "all" ||
        fw.job_titles.some((j) => j.toLowerCase() === selectedJobFilter.toLowerCase());

      const matchCategory =
        selectedCategoryFilter === "all" || fw.category === selectedCategoryFilter;

      return matchSearch && matchJob && matchCategory;
    });
  }, [frameworks, searchQuery, selectedJobFilter, selectedCategoryFilter]);

  // Thống kê tổng quan
  const stats = useMemo(() => {
    const totalFrameworks = frameworks.length;
    const uniqueJobTitles = new Set(frameworks.flatMap((f) => f.job_titles)).size;
    const totalCriteriaCount = frameworks.reduce((sum, f) => sum + f.criteria.length, 0);
    const validRate = frameworks.length > 0 ? "100%" : "0%";
    return { totalFrameworks, uniqueJobTitles, totalCriteriaCount, validRate };
  }, [frameworks]);

  // Mở modal tạo mới
  const handleOpenCreateModal = () => {
    setFormMode("create");
    setEditingFrameworkId(null);
    setFormCode("");
    setFormName("");
    setFormCategory("Công nghệ & Kỹ thuật");
    setFormDescription("");
    setFormJobTitles(["Backend Developer"]);
    setCustomJobInput("");
    setFormError(null);
    setFormCriteria([
      {
        code: "TECH-01",
        name: "Kiến thức chuyên môn & Thiết kế hệ thống",
        category: "Chuyên môn",
        weight: 60,
        required_level: 4,
        description: "Khả năng làm chủ công nghệ, thiết kế API và kiến trúc mã nguồn.",
        rubric_1: "Hiểu biết cơ bản, cần hướng dẫn từng bước",
        rubric_3: "Đạt chuẩn, xử lý độc lập các module",
        rubric_5: "Xuất sắc, dẫn dắt kiến trúc và tối ưu hiệu năng",
        questions: ["Bạn thiết kế một API an toàn và chịu tải như thế nào?"]
      },
      {
        code: "SKILL-02",
        name: "Kỹ năng phân tích & Giải quyết sự cố",
        category: "Tư duy & Kỹ năng",
        weight: 40,
        required_level: 3,
        description: "Tư duy logic, tìm nguyên nhân gốc rễ và xử lý sự cố.",
        rubric_1: "Cần trợ giúp khi gặp sự cố phức tạp",
        rubric_3: "Tự chủ phân tích log và khắc phục",
        rubric_5: "Dự đoán rủi ro và ngăn ngừa triệt để",
        questions: ["Kể về một bug khó nhất bạn từng xử lý thành công?"]
      }
    ]);
    setIsFormOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = (fw: CompetencyFramework) => {
    setFormMode("edit");
    setEditingFrameworkId(fw.id);
    setFormCode(fw.code);
    setFormName(fw.name);
    setFormCategory(fw.category);
    setFormDescription(fw.description);
    setFormJobTitles([...fw.job_titles]);
    setCustomJobInput("");
    setFormError(null);
    setFormCriteria(
      fw.criteria.map((c, idx) => ({
        id: c.id,
        code: c.code || `${fw.code}-C${idx + 1}`,
        name: c.name,
        category: c.category || "Chuyên môn",
        weight: c.weight,
        required_level: c.required_level || 3,
        description: c.description || "",
        rubric_1: c.rubric_scale?.["1"] || "",
        rubric_3: c.rubric_scale?.["3"] || "",
        rubric_5: c.rubric_scale?.["5"] || "",
        questions: c.interview_questions ? [...c.interview_questions] : []
      }))
    );
    setIsFormOpen(true);
  };

  // Mở modal nhân bản (Clone - AC03: Dùng lại khung năng lực cho chức danh khác)
  const handleOpenCloneModal = (fw: CompetencyFramework) => {
    setFormMode("clone");
    setEditingFrameworkId(null);
    setFormCode(`${fw.code}-COPY`);
    setFormName(`${fw.name} (Bản sao)`);
    setFormCategory(fw.category);
    setFormDescription(fw.description);
    setFormJobTitles([]); // Để người dùng chọn chức danh mới áp dụng
    setCustomJobInput("");
    setFormError(null);
    setFormCriteria(
      fw.criteria.map((c, idx) => ({
        code: `${c.code || "C"}-${idx + 1}`,
        name: c.name,
        category: c.category || "Chuyên môn",
        weight: c.weight,
        required_level: c.required_level || 3,
        description: c.description || "",
        rubric_1: c.rubric_scale?.["1"] || "",
        rubric_3: c.rubric_scale?.["3"] || "",
        rubric_5: c.rubric_scale?.["5"] || "",
        questions: c.interview_questions ? [...c.interview_questions] : []
      }))
    );
    setIsFormOpen(true);
  };

  // Thêm tiêu chí mới trong form
  const handleAddCriterion = () => {
    const nextIdx = formCriteria.length + 1;
    // Gợi ý trọng số còn lại tới 100%
    const remaining = Math.max(0, 100 - totalWeight);
    setFormCriteria([
      ...formCriteria,
      {
        code: `CRIT-${String(nextIdx).padStart(2, "0")}`,
        name: "",
        category: "Chuyên môn",
        weight: remaining > 0 ? remaining : 10,
        required_level: 3,
        description: "",
        rubric_1: "Mức cơ bản, cần hỗ trợ",
        rubric_3: "Đạt chuẩn yêu cầu vị trí",
        rubric_5: "Xuất sắc, có khả năng hướng dẫn người khác",
        questions: []
      }
    ]);
  };

  // Xóa tiêu chí
  const handleRemoveCriterion = (index: number) => {
    if (formCriteria.length <= 1) {
      setFormError("Khung năng lực phải có ít nhất 1 tiêu chí đánh giá.");
      return;
    }
    setFormCriteria(formCriteria.filter((_, idx) => idx !== index));
  };

  // Cập nhật trường tiêu chí
  const handleUpdateCriterion = (
    index: number,
    field: keyof FormCriterion,
    value: unknown
  ) => {
    setFormCriteria(
      formCriteria.map((c, idx) => {
        if (idx === index) {
          return { ...c, [field]: value };
        }
        return c;
      })
    );
  };

  // Thêm câu hỏi gợi ý cho tiêu chí
  const handleAddQuestion = (critIndex: number, questionText: string) => {
    if (!questionText.trim()) return;
    setFormCriteria(
      formCriteria.map((c, idx) => {
        if (idx === critIndex) {
          return { ...c, questions: [...c.questions, questionText.trim()] };
        }
        return c;
      })
    );
  };

  // Xóa câu hỏi gợi ý
  const handleRemoveQuestion = (critIndex: number, qIdx: number) => {
    setFormCriteria(
      formCriteria.map((c, idx) => {
        if (idx === critIndex) {
          return {
            ...c,
            questions: c.questions.filter((_, i) => i !== qIdx)
          };
        }
        return c;
      })
    );
  };

  // Tự động cân đối trọng số thành 100%
  const handleAutoBalanceWeights = () => {
    if (formCriteria.length === 0) return;
    const count = formCriteria.length;
    const baseWeight = Math.floor(100 / count);
    const remainder = 100 - baseWeight * count;

    setFormCriteria(
      formCriteria.map((c, idx) => ({
        ...c,
        weight: idx === 0 ? baseWeight + remainder : baseWeight
      }))
    );
    setFormError(null);
  };

  // Thêm chức danh vào danh sách áp dụng
  const handleToggleJobTitle = (title: string) => {
    if (formJobTitles.includes(title)) {
      setFormJobTitles(formJobTitles.filter((t) => t !== title));
    } else {
      setFormJobTitles([...formJobTitles, title]);
    }
  };

  // Thêm chức danh tùy biến
  const handleAddCustomJob = () => {
    if (!customJobInput.trim()) return;
    const title = customJobInput.trim();
    if (!formJobTitles.includes(title)) {
      setFormJobTitles([...formJobTitles, title]);
    }
    setCustomJobInput("");
  };

  // Submit Form (Validation chặt chẽ - S2-06-AC01 & S2-06-AC02)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // 1. Kiểm tra tên khung
    if (!formName.trim() || formName.trim().length < 3) {
      setFormError("Vui lòng nhập tên khung năng lực (tối thiểu 3 ký tự).");
      return;
    }

    // 2. Kiểm tra chức danh áp dụng (AC01 & AC03)
    if (formJobTitles.length === 0) {
      setFormError("Vui lòng gắn ít nhất một chức danh áp dụng cho khung năng lực (Đáp ứng tiêu chí AC01 & AC03).");
      return;
    }

    // 3. Kiểm tra danh sách tiêu chí
    if (formCriteria.length === 0) {
      setFormError("Khung năng lực phải chứa ít nhất một tiêu chí đánh giá.");
      return;
    }

    for (let i = 0; i < formCriteria.length; i++) {
      const c = formCriteria[i];
      if (!c.name.trim()) {
        setFormError(`Tiêu chí số ${i + 1} chưa có tên tiêu chí. Vui lòng điền đầy đủ.`);
        return;
      }
      if (Number(c.weight) <= 0) {
        setFormError(`Trọng số của tiêu chí "${c.name}" phải lớn hơn 0%.`);
        return;
      }
    }

    // 4. KIỂM TRA TỔNG TRỌNG SỐ BẮT BUỘC BẰNG ĐÚNG 100% (S2-06-AC02 & TC-S2-06-X01)
    if (totalWeight !== 100.0) {
      setFormError(
        `Tổng trọng số hiện tại là ${totalWeight}%. Theo quy định Story S2-06-AC02, tổng trọng số của tất cả tiêu chí BẮT BUỘC phải bằng chính xác 100%. Vui lòng điều chỉnh lại.`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const formattedCriteria = formCriteria.map((c, idx) => ({
        code: c.code.trim() || undefined,
        name: c.name.trim(),
        category: c.category,
        weight: Number(c.weight),
        required_level: Number(c.required_level),
        description: c.description.trim() || undefined,
        rubric_scale: {
          "1": c.rubric_1.trim() || "Cần hỗ trợ, chưa đạt chuẩn",
          "3": c.rubric_3.trim() || "Đạt chuẩn yêu cầu của vị trí",
          "5": c.rubric_5.trim() || "Xuất sắc, vượt kỳ vọng"
        },
        interview_questions: c.questions.filter((q) => q.trim().length > 0),
        sort_order: idx
      }));

      const payload: CreateFrameworkInput = {
        code: formCode.trim() || undefined,
        name: formName.trim(),
        category: formCategory,
        description: formDescription.trim(),
        job_titles: formJobTitles,
        criteria: formattedCriteria
      };

      if (formMode === "edit" && editingFrameworkId) {
        await competencyService.updateCompetency(editingFrameworkId, payload);
        setSuccessMessage(`Đã cập nhật thành công khung năng lực "${formName}".`);
      } else {
        await competencyService.createCompetency(payload);
        setSuccessMessage(`Đã tạo mới thành công khung năng lực "${formName}" với tổng trọng số 100%.`);
      }

      setIsFormOpen(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : "Đã có lỗi xảy ra khi lưu khung năng lực.";
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xác nhận Xóa khung năng lực
  const handleConfirmDelete = async () => {
    if (!deletingFramework) return;
    setIsDeleting(true);
    try {
      await competencyService.deleteCompetency(deletingFramework.id);
      setSuccessMessage(`Đã xóa thành công khung năng lực "${deletingFramework.name}".`);
      setDeletingFramework(null);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : "Không thể xóa khung năng lực.";
      setError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Mở modal Xem trước Phiếu Phỏng Vấn Sprint 6 (S2-06-AC04 & TC-S2-06-04)
  const handleOpenScorecardPreview = async (fw: CompetencyFramework, defaultJob?: string) => {
    setScorecardModalOpen(true);
    setScorecardLoading(true);
    const targetJob = defaultJob || (fw.job_titles[0] ?? "Backend Developer");
    setSelectedScorecardJob(targetJob);

    try {
      const scorecard = await competencyService.getInterviewScorecard(fw.id, {
        job_title: targetJob,
        candidate_name: candidateNameInput
      });
      setActiveScorecard(scorecard);

      // Khởi tạo điểm mô phỏng dựa trên required_level
      const initialScores: Record<number, number> = {};
      scorecard.criteria.forEach((c, idx) => {
        initialScores[c.id || idx] = c.required_level || 3;
      });
      setSimulatedScores(initialScores);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : "Không thể tải mẫu phiếu phỏng vấn.";
      setError(msg);
      setScorecardModalOpen(false);
    } finally {
      setScorecardLoading(false);
    }
  };

  // Tính điểm tổng kết trung bình có trọng số cho phiếu phỏng vấn
  const calculatedWeightedScore = useMemo(() => {
    if (!activeScorecard || activeScorecard.criteria.length === 0) return 0;
    const total = activeScorecard.criteria.reduce((sum, c, idx) => {
      const score = simulatedScores[c.id || idx] || c.required_level || 3;
      return sum + score * (c.weight / 100);
    }, 0);
    return Math.round(total * 100) / 100;
  }, [activeScorecard, simulatedScores]);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Actions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                Story S2-06 · Epic EP-02
              </span>
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
                Trưởng phòng Nhân sự & Quản trị viên
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">
              Khai Báo Khung Năng Lực & Tiêu Chí Đánh Giá
            </h1>
            <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">
              Thiết lập bộ tiêu chí đánh giá chuẩn hóa cho từng chức danh với tổng trọng số 100%,
              cho phép tái sử dụng linh hoạt và tự động sinh phiếu đánh giá phỏng vấn thống nhất ở Sprint 6.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              isLoading={isLoading}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Làm mới
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateModal}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Khai báo khung mới
            </Button>
          </div>
        </div>

        {/* 2. Thống kê KPI */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-5 border-t border-slate-100">
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
            <p className="text-xs font-medium text-slate-500">Khung năng lực</p>
            <p className="mt-1 text-xl font-extrabold text-slate-900">{stats.totalFrameworks}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
            <p className="text-xs font-medium text-slate-500">Chức danh áp dụng</p>
            <p className="mt-1 text-xl font-extrabold text-blue-600">{stats.uniqueJobTitles}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100">
            <p className="text-xs font-medium text-slate-500">Tổng tiêu chí</p>
            <p className="mt-1 text-xl font-extrabold text-slate-900">{stats.totalCriteriaCount}</p>
          </div>
          <div className="rounded-xl bg-emerald-50/70 p-3.5 border border-emerald-100">
            <p className="text-xs font-medium text-emerald-700">Chuẩn trọng số</p>
            <p className="mt-1 text-xl font-extrabold text-emerald-700">{stats.validRate} (100%)</p>
          </div>
        </div>
      </div>

      {/* 3. Thông báo Thành công / Lỗi tổng quát */}
      {successMessage && (
        <Alert
          variant="success"
          title="Thành công"
          className="flex items-center justify-between"
        >
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="ml-auto text-emerald-800 hover:text-emerald-950 p-1 rounded-md"
          >
            <X className="h-4 w-4" />
          </button>
        </Alert>
      )}

      {error && (
        <Alert
          variant="error"
          title="Đã xảy ra lỗi"
          className="flex items-center justify-between"
        >
          <div>
            <p>{error}</p>
            <button
              onClick={loadData}
              className="mt-2 text-xs font-bold underline hover:no-underline"
            >
              Bấm vào đây để thử lại kết nối
            </button>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-800 hover:text-red-950 p-1 rounded-md"
          >
            <X className="h-4 w-4" />
          </button>
        </Alert>
      )}

      {/* 4. Bộ lọc & Tìm kiếm */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên khung năng lực, mã tiêu chí, hoặc chức danh..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span>Phân loại:</span>
          </div>
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">Tất cả nhóm</option>
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 ml-2">
            <Briefcase className="h-3.5 w-3.5 text-slate-400" />
            <span>Chức danh:</span>
          </div>
          <select
            value={selectedJobFilter}
            onChange={(e) => setSelectedJobFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">Tất cả chức danh</option>
            {jobTitles.map((jt) => (
              <option key={jt.id} value={jt.name}>
                {jt.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 5. Trạng thái Loading (Skeleton) */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="space-y-2">
                  <div className="h-4 w-28 rounded bg-slate-200" />
                  <div className="h-6 w-72 rounded bg-slate-200" />
                </div>
                <div className="h-8 w-24 rounded bg-slate-200" />
              </div>
              <div className="mt-4 space-y-3">
                <div className="h-4 w-full rounded bg-slate-100" />
                <div className="h-4 w-3/4 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6. Trạng thái Trống (Empty State) */}
      {!isLoading && filteredFrameworks.length === 0 && (
        <Card className="py-16 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner">
            <Award className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900">
            {searchQuery || selectedJobFilter !== "all" || selectedCategoryFilter !== "all"
              ? "Không tìm thấy khung năng lực phù hợp"
              : "Chưa có khung năng lực nào được khai báo"}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            {searchQuery || selectedJobFilter !== "all" || selectedCategoryFilter !== "all"
              ? "Hãy thử điều chỉnh từ khóa tìm kiếm hoặc bỏ bớt các bộ lọc phân loại."
              : "Bắt đầu thiết lập khung năng lực chuẩn hóa cho từng chức danh để phục vụ hội đồng phỏng vấn chấm điểm nhất quán."}
          </p>
          <div className="mt-6">
            <Button onClick={handleOpenCreateModal} leftIcon={<Plus className="h-4 w-4" />}>
              Khai báo khung năng lực đầu tiên
            </Button>
          </div>
        </Card>
      )}

      {/* 7. Danh sách Khung Năng Lực (Card List) */}
      {!isLoading && filteredFrameworks.length > 0 && (
        <div className="space-y-5">
          {filteredFrameworks.map((fw) => (
            <div
              key={fw.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
            >
              {/* Card Header */}
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-extrabold uppercase text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                      {fw.code}
                    </span>
                    <Badge variant="primary">{fw.category}</Badge>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" />
                      Tổng trọng số: {fw.total_weight}%
                    </span>
                  </div>

                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {fw.name}
                  </h2>
                  <p className="text-sm text-slate-500 max-w-4xl">{fw.description}</p>

                  {/* Chức danh áp dụng (AC01 & AC03) */}
                  <div className="pt-1 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
                      Chức danh áp dụng:
                    </span>
                    {fw.job_titles.length > 0 ? (
                      fw.job_titles.map((title, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 border border-slate-200/60"
                        >
                          <Briefcase className="h-3 w-3 text-slate-500" />
                          {title}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-amber-600 font-medium">
                        Chưa gán chức danh
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenScorecardPreview(fw)}
                    leftIcon={<FileCheck className="h-4 w-4 text-blue-600" />}
                    title="Xem trước mẫu phiếu đánh giá phỏng vấn Sprint 6"
                  >
                    Xem phiếu phỏng vấn
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenCloneModal(fw)}
                    leftIcon={<Copy className="h-4 w-4 text-slate-600" />}
                    title="Nhân bản để tạo khung cho chức danh khác"
                  >
                    Nhân bản
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEditModal(fw)}
                    leftIcon={<Edit3 className="h-4 w-4 text-slate-600" />}
                  >
                    Sửa
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingFramework(fw)}
                    leftIcon={<Trash2 className="h-4 w-4 text-red-500" />}
                    className="hover:bg-red-50 hover:text-red-600"
                  >
                    Xóa
                  </Button>
                </div>
              </div>

              {/* Bảng ma trận tiêu chí đánh giá */}
              <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/40">
                <div className="border-b border-slate-200 bg-slate-100/70 px-4 py-2.5 text-xs font-bold text-slate-700 grid grid-cols-12 gap-2">
                  <div className="col-span-1">Mã</div>
                  <div className="col-span-4">Tiêu chí năng lực</div>
                  <div className="col-span-2">Phân loại</div>
                  <div className="col-span-2 text-center">Chuẩn tối thiểu</div>
                  <div className="col-span-1 text-center">Trọng số</div>
                  <div className="col-span-2 text-right">Câu hỏi gợi ý</div>
                </div>

                <div className="divide-y divide-slate-200/80 bg-white">
                  {fw.criteria.map((crit, idx) => (
                    <div
                      key={crit.id || idx}
                      className="px-4 py-3.5 text-xs grid grid-cols-12 gap-2 items-center hover:bg-blue-50/30 transition-colors"
                    >
                      <div className="col-span-1 font-mono font-bold text-slate-500">
                        {crit.code || `C${idx + 1}`}
                      </div>
                      <div className="col-span-4">
                        <p className="font-bold text-slate-900">{crit.name}</p>
                        {crit.description && (
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {crit.description}
                          </p>
                        )}
                      </div>
                      <div className="col-span-2">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                          {crit.category}
                        </span>
                      </div>
                      <div className="col-span-2 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                          Mức {crit.required_level}/5
                        </span>
                      </div>
                      <div className="col-span-1 text-center">
                        <span className="inline-block font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full text-xs">
                          {crit.weight}%
                        </span>
                      </div>
                      <div className="col-span-2 text-right text-slate-500">
                        {crit.interview_questions && crit.interview_questions.length > 0 ? (
                          <span className="text-[11px] text-blue-600 font-semibold cursor-pointer hover:underline" onClick={() => handleOpenScorecardPreview(fw)}>
                            {crit.interview_questions.length} câu hỏi mẫu
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Chưa có câu hỏi</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL KHAI BÁO / CHỈNH SỬA KHUNG NĂNG LỰC (Story S2-06 Form)            */}
      {/* ========================================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {formMode === "create" && "Khai báo Khung Năng Lực Mới (S2-06)"}
                  {formMode === "edit" && "Chỉnh sửa Khung Năng Lực"}
                  {formMode === "clone" && "Nhân bản Khung Năng Lực Cho Chức Danh Mới"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tổng trọng số của tất cả tiêu chí bắt buộc phải bằng chính xác 100%.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-6 space-y-6">
              {formError && (
                <Alert variant="error" title="Lỗi xác thực dữ liệu">
                  {formError}
                </Alert>
              )}

              {/* Thông tin cơ bản */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Tên khung năng lực <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Khung Năng Lực Kỹ Sư Backend Developer..."
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Mã khung năng lực
                  </label>
                  <input
                    type="text"
                    placeholder="Tự động sinh (VD: COMP-DEV-01)"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm uppercase font-mono focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Nhóm chuyên môn
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Mô tả mục tiêu & phạm vi áp dụng
                  </label>
                  <input
                    type="text"
                    placeholder="Mô tả tiêu chuẩn áp dụng cho hội đồng phỏng vấn..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Chức danh áp dụng (AC01 & AC03) */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                    Chức danh áp dụng (Khung dùng lại được cho nhiều chức danh - AC03) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-blue-600 font-semibold">
                    Đã chọn {formJobTitles.length} chức danh
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                  {jobTitles.map((jt) => {
                    const isSelected = formJobTitles.includes(jt.name);
                    return (
                      <button
                        key={jt.id}
                        type="button"
                        onClick={() => handleToggleJobTitle(jt.name)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                        {jt.name}
                      </button>
                    );
                  })}
                </div>

                {/* Nhập thêm chức danh tùy chỉnh nếu chưa có */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-200/80">
                  <input
                    type="text"
                    placeholder="Thêm chức danh khác nếu chưa có trong danh sách..."
                    value={customJobInput}
                    onChange={(e) => setCustomJobInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomJob();
                      }
                    }}
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddCustomJob}
                  >
                    Thêm chức danh
                  </Button>
                </div>
              </div>

              {/* BỘ TIÊU CHÍ ĐÁNH GIÁ (CRITERIA) & THANH TRỌNG SỐ REAL-TIME */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Danh Sách Tiêu Chí Đánh Giá & Trọng Số %
                    </h4>
                    <p className="text-xs text-slate-500">
                      Mỗi tiêu chí tương ứng một khía cạnh năng lực và sinh ra câu hỏi phỏng vấn Sprint 6.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAutoBalanceWeights}
                      leftIcon={<Sliders className="h-3.5 w-3.5" />}
                    >
                      Cân bằng 100% tự động
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleAddCriterion}
                      leftIcon={<Plus className="h-3.5 w-3.5" />}
                    >
                      Thêm tiêu chí
                    </Button>
                  </div>
                </div>

                {/* THANH TIẾN TRÌNH TRỌNG SỐ (S2-06-AC02) */}
                <div className={`p-4 rounded-xl border transition-all ${
                  totalWeight === 100
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : totalWeight > 100
                    ? "bg-red-50 border-red-200 text-red-900"
                    : "bg-amber-50 border-amber-200 text-amber-900"
                }`}>
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="flex items-center gap-1.5">
                      {totalWeight === 100 ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span>Hợp lệ: Tổng trọng số bằng chính xác 100% (Đủ điều kiện lưu)</span>
                        </>
                      ) : totalWeight > 100 ? (
                        <>
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span>Vượt mức: Tổng trọng số hiện là {totalWeight}% (Vượt quá {Math.round((totalWeight - 100) * 100) / 100}%)</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <span>Chưa đủ 100%: Hiện tại là {totalWeight}% (Thiếu {Math.round((100 - totalWeight) * 100) / 100}%)</span>
                        </>
                      )}
                    </span>
                    <span className="text-sm font-extrabold">{totalWeight}% / 100%</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        totalWeight === 100
                          ? "bg-emerald-600"
                          : totalWeight > 100
                          ? "bg-red-600"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${Math.min(100, totalWeight)}%` }}
                    />
                  </div>
                </div>

                {/* Danh sách từng tiêu chí */}
                <div className="space-y-4">
                  {formCriteria.map((criterion, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="grid h-6 w-6 place-items-center rounded-md bg-blue-100 text-xs font-bold text-blue-700">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-700 uppercase">
                            Tiêu chí #{idx + 1}
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={formCriteria.length <= 1}
                          onClick={() => handleRemoveCriterion(idx)}
                          className="text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed p-1 rounded"
                          title="Xóa tiêu chí này"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="md:col-span-5">
                          <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                            Tên tiêu chí <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="VD: Tư duy thiết kế kiến trúc Clean Code..."
                            value={criterion.name}
                            onChange={(e) => handleUpdateCriterion(idx, "name", e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                          />
                        </div>

                        <div className="md:col-span-3">
                          <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                            Phân loại
                          </label>
                          <select
                            value={criterion.category}
                            onChange={(e) => handleUpdateCriterion(idx, "category", e.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                          >
                            {CRITERIA_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                            Trọng số (%) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            required
                            value={criterion.weight}
                            onChange={(e) => handleUpdateCriterion(idx, "weight", Number(e.target.value))}
                            className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold text-blue-700 focus:border-blue-500 focus:outline-none"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                            Mức chuẩn (1-5)
                          </label>
                          <select
                            value={criterion.required_level}
                            onChange={(e) => handleUpdateCriterion(idx, "required_level", Number(e.target.value))}
                            className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-bold text-amber-700 focus:border-blue-500 focus:outline-none"
                          >
                            <option value={1}>⭐ Mức 1 (Cơ bản)</option>
                            <option value={2}>⭐⭐ Mức 2 (Đạt)</option>
                            <option value={3}>⭐⭐⭐ Mức 3 (Khá)</option>
                            <option value={4}>⭐⭐⭐⭐ Mức 4 (Tốt)</option>
                            <option value={5}>⭐⭐⭐⭐⭐ Mức 5 (Xuất sắc)</option>
                          </select>
                        </div>
                      </div>

                      {/* Rubric Thang Điểm & Câu hỏi phỏng vấn */}
                      <div className="pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <label className="block text-slate-500 font-semibold mb-0.5">Rubric Mức 1 (Cơ bản):</label>
                          <input
                            type="text"
                            value={criterion.rubric_1}
                            placeholder="Biểu hiện khi ở mức 1..."
                            onChange={(e) => handleUpdateCriterion(idx, "rubric_1", e.target.value)}
                            className="w-full rounded border border-slate-200 p-1.5 text-[11px] bg-slate-50"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 font-semibold mb-0.5">Rubric Mức 3 (Đạt chuẩn):</label>
                          <input
                            type="text"
                            value={criterion.rubric_3}
                            placeholder="Biểu hiện khi đạt chuẩn..."
                            onChange={(e) => handleUpdateCriterion(idx, "rubric_3", e.target.value)}
                            className="w-full rounded border border-slate-200 p-1.5 text-[11px] bg-slate-50"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 font-semibold mb-0.5">Rubric Mức 5 (Xuất sắc):</label>
                          <input
                            type="text"
                            value={criterion.rubric_5}
                            placeholder="Biểu hiện vượt trội..."
                            onChange={(e) => handleUpdateCriterion(idx, "rubric_5", e.target.value)}
                            className="w-full rounded border border-slate-200 p-1.5 text-[11px] bg-slate-50"
                          />
                        </div>
                      </div>

                      {/* Ngân hàng câu hỏi gợi ý cho tiêu chí (S2-06-AC04) */}
                      <div className="pt-2 border-t border-slate-100">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Câu hỏi phỏng vấn gợi ý (Phục vụ Sprint 6 sinh phiếu phỏng vấn):
                        </label>
                        <div className="space-y-1.5">
                          {criterion.questions.map((q, qIdx) => (
                            <div key={qIdx} className="flex items-center gap-2 text-xs bg-slate-50 px-2.5 py-1 rounded border border-slate-200/60">
                              <HelpCircle className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                              <span className="flex-1 text-slate-700">{q}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveQuestion(idx, qIdx)}
                                className="text-slate-400 hover:text-red-500 text-xs p-0.5"
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="text"
                              id={`q-input-${idx}`}
                              placeholder="Nhập câu hỏi gợi ý cho người phỏng vấn rồi bấm Thêm..."
                              className="flex-1 rounded border border-slate-200 px-2 py-1 text-xs"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const target = e.target as HTMLInputElement;
                                  handleAddQuestion(idx, target.value);
                                  target.value = "";
                                }
                              }}
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const el = document.getElementById(`q-input-${idx}`) as HTMLInputElement;
                                if (el) {
                                  handleAddQuestion(idx, el.value);
                                  el.value = "";
                                }
                              }}
                            >
                              Thêm câu hỏi
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                >
                  Hủy bỏ
                </Button>

                <div className="flex items-center gap-3">
                  {totalWeight !== 100 && (
                    <span className="text-xs font-bold text-red-600">
                      ⚠ Cần đạt chính xác 100% để lưu
                    </span>
                  )}
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting}
                    disabled={totalWeight !== 100}
                    leftIcon={<Check className="h-4 w-4" />}
                  >
                    {formMode === "edit" ? "Lưu thay đổi" : "Khai báo khung năng lực"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. MODAL XÁC NHẬN XÓA KHUNG NĂNG LỰC                                      */}
      {/* ========================================================================= */}
      {deletingFramework && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-red-50 text-red-600 mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                Xác nhận xóa khung năng lực
              </h3>
              <p className="text-sm text-slate-500">
                Bạn có chắc chắn muốn xóa khung năng lực{" "}
                <strong className="text-slate-800">
                  &ldquo;{deletingFramework.name}&rdquo;
                </strong>
                ? Hành động này không thể hoàn tác.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                className="w-1/2"
                onClick={() => setDeletingFramework(null)}
              >
                Hủy
              </Button>
              <Button
                variant="danger"
                className="w-1/2"
                isLoading={isDeleting}
                onClick={handleConfirmDelete}
              >
                Xác nhận xóa
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. MODAL XEM TRƯỚC PHIẾU ĐÁNH GIÁ PHỎNG VẤN SPRINT 6 (AC04 & TC-S2-06-04)*/}
      {/* ========================================================================= */}
      {scorecardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 my-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white shadow-sm">
                  <FileCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">
                      Phiếu Đánh Giá Phỏng Vấn Tuyển Dụng Chuẩn Hóa
                    </h3>
                    <span className="rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5">
                      Sprint 6 Integration (S2-06-AC04)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Sinh tự động từ bộ tiêu chí và trọng số của khung năng lực đã khai báo.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScorecardModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scorecard Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {scorecardLoading ? (
                <div className="py-20 text-center text-sm text-slate-500">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mx-auto mb-2" />
                  Đang khởi tạo phiếu đánh giá phỏng vấn...
                </div>
              ) : activeScorecard ? (
                <div className="space-y-6">
                  {/* Metadata phiếu */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 uppercase font-bold text-[10px] block">Mã phiếu:</span>
                      <span className="font-mono font-bold text-slate-800">{activeScorecard.scorecard_id}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase font-bold text-[10px] block">Chức danh đánh giá:</span>
                      <span className="font-bold text-blue-700">{activeScorecard.target_job_title}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase font-bold text-[10px] block">Ứng viên:</span>
                      <span className="font-bold text-slate-800">{candidateNameInput}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase font-bold text-[10px] block">Ngày đánh giá:</span>
                      <span className="font-semibold text-slate-700">{activeScorecard.evaluation_date}</span>
                    </div>
                  </div>

                  {/* Bảng chấm điểm phỏng vấn tương tác */}
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <div className="bg-slate-100 px-4 py-3 text-xs font-bold text-slate-800 grid grid-cols-12 gap-2">
                      <div className="col-span-5">Tiêu chí đánh giá & Câu hỏi gợi ý</div>
                      <div className="col-span-2 text-center">Trọng số</div>
                      <div className="col-span-2 text-center">Chuẩn yêu cầu</div>
                      <div className="col-span-3 text-center">Chấm điểm (Thang 1-5)</div>
                    </div>

                    <div className="divide-y divide-slate-200 bg-white">
                      {activeScorecard.criteria.map((c, idx) => {
                        const currentScore = simulatedScores[c.id || idx] || c.required_level || 3;
                        return (
                          <div key={c.id || idx} className="p-4 text-xs grid grid-cols-12 gap-2 items-start">
                            {/* Tiêu chí & câu hỏi */}
                            <div className="col-span-5 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                                  {c.code}
                                </span>
                                <span className="font-bold text-slate-900 text-sm">{c.name}</span>
                              </div>
                              <span className="text-[11px] text-slate-500 block">
                                Phân loại: {c.category}
                              </span>

                              {/* Rubric tương ứng mức điểm đang chấm */}
                              {c.rubric_scale?.[String(currentScore)] && (
                                <div className="mt-2 rounded-lg bg-blue-50/80 p-2 text-[11px] text-blue-900 border border-blue-100">
                                  <strong>Chỉ dẫn rubric mức {currentScore}:</strong> {c.rubric_scale[String(currentScore)]}
                                </div>
                              )}

                              {/* Câu hỏi gợi ý */}
                              {c.suggested_questions && c.suggested_questions.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                    Câu hỏi gợi ý cho người phỏng vấn:
                                  </span>
                                  {c.suggested_questions.map((q, qIdx) => (
                                    <div key={qIdx} className="text-[11px] text-slate-600 italic bg-slate-50 p-1.5 rounded">
                                      &ldquo;{q}&rdquo;
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Trọng số */}
                            <div className="col-span-2 text-center pt-1">
                              <span className="font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 text-xs">
                                {c.weight}%
                              </span>
                            </div>

                            {/* Chuẩn tối thiểu */}
                            <div className="col-span-2 text-center pt-1">
                              <span className="font-bold text-amber-700">
                                Mức {c.required_level}/5 ⭐
                              </span>
                            </div>

                            {/* Bộ chọn điểm 1-5 sao */}
                            <div className="col-span-3 text-center pt-1 space-y-1.5">
                              <div className="flex items-center justify-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() =>
                                      setSimulatedScores({
                                        ...simulatedScores,
                                        [c.id || idx]: star
                                      })
                                    }
                                    className={`p-1 rounded transition-colors ${
                                      star <= currentScore
                                        ? "text-amber-500 fill-amber-500"
                                        : "text-slate-300 hover:text-amber-400"
                                    }`}
                                    title={`Chấm ${star} điểm`}
                                  >
                                    <Star className={`h-5 w-5 ${star <= currentScore ? "fill-amber-400" : ""}`} />
                                  </button>
                                ))}
                              </div>
                              <span className="font-extrabold text-xs text-slate-700 block">
                                {currentScore} / 5 điểm
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Kết quả tổng kết điểm có trọng số */}
                  <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Tổng Kết Đánh Giá Phỏng Vấn (Công thức có trọng số)
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Điểm tổng kết = Σ(Điểm tiêu chí × Trọng số) ÷ 100. Điểm sàn yêu cầu tối thiểu: 3.0 / 5.0.
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Điểm quy đổi:</span>
                        <span className="text-2xl font-black text-blue-700">
                          {calculatedWeightedScore} / 5.0
                        </span>
                      </div>

                      <div className={`px-4 py-2 rounded-xl text-xs font-extrabold ${
                        calculatedWeightedScore >= 3.0
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-red-600 text-white shadow-sm"
                      }`}>
                        {calculatedWeightedScore >= 3.0 ? "ĐẠT YÊU CẦU" : "KHÔNG ĐẠT"}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 rounded-b-2xl flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Printer className="h-4 w-4" />}
                onClick={() => window.print()}
              >
                In phiếu đánh giá
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setScorecardModalOpen(false)}
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
