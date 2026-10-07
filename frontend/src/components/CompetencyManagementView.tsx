"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Search,
  BookOpen,
  Lock,
  Eye,
  X,
  Save,
  Sliders,
  Sparkles,
  Check,
  Loader2,
} from "lucide-react";
import { competencyService } from "@/features/competency/services/competencyService";

// =========================================================================
// DATA MODELS & INTERFACES
// =========================================================================

export interface CompetencyCriteria {
  id: string;
  code: string;
  name: string;
  description: string;
  weight: number; // Trọng số (%)
}

export interface CompetencyFramework {
  id: string;
  code: string;
  name: string;
  department: string;
  appliedJobTitles: string[]; // Tái sử dụng cho nhiều chức danh
  criteriaList: CompetencyCriteria[];
  status: "active" | "inactive";
  updatedAt: string;
}

export interface InterviewQuestion {
  id: string;
  code: string;
  content: string;
  criteriaId: string;
  criteriaName: string;
  jobTitle: string;
  difficulty: "easy" | "medium" | "hard";
  suggestedAnswer: string;
  is_referenced: boolean;
  status: "active" | "inactive";
  timesUsed: number;
}

// Danh sách các chức danh chuẩn trong hệ thống
export const AVAILABLE_JOB_TITLES = [
  "Senior Backend Engineer",
  "Lead Developer",
  "Fullstack Developer",
  "Frontend Developer",
  "DevOps Engineer",
  "UI/UX Designer",
  "Product Owner",
  "Chuyên viên Tuyển dụng (Recruiter)",
  "Trưởng nhóm Tuyển dụng",
  "Trưởng nhóm Kinh doanh (Sales Lead)",
];

// Danh sách phòng ban
export const AVAILABLE_DEPARTMENTS = [
  "Khối Công Nghệ & Sản Phẩm (Technology)",
  "Trung Tâm Phát Triển Phần Mềm",
  "Phòng Tuyển Dụng & Đào Tạo",
  "Ban Giám Đốc & Điều Hành",
  "Khối Kinh Doanh & Tiếp Thị",
];

interface CompetencyManagementViewProps {
  initialTab?: "framework" | "questions";
}

export function CompetencyManagementView({
  initialTab = "framework",
}: CompetencyManagementViewProps) {
  // Tabs điều hướng chính
  const [activeTab, setActiveTab] = useState<"framework" | "questions">(initialTab);

  // Loading State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Frameworks State
  const [frameworks, setFrameworks] = useState<CompetencyFramework[]>([]);
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string>("");

  // Form Khung năng lực đang chỉnh sửa
  const currentFramework = useMemo(() => {
    return frameworks.find((f) => f.id === selectedFrameworkId) || frameworks[0];
  }, [frameworks, selectedFrameworkId]);

  // State cho Form Framework hiện tại
  const [formData, setFormData] = useState<CompetencyFramework | null>(null);

  // State Ngân hàng câu hỏi
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);

  // Tải dữ liệu từ CSDL Backend khi mount
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fwData, qData] = await Promise.all([
        competencyService.getFrameworks(),
        competencyService.getQuestions(),
      ]);
      setFrameworks(fwData);
      setQuestions(qData);
      if (fwData.length > 0) {
        setSelectedFrameworkId(fwData[0].id);
        setFormData(JSON.parse(JSON.stringify(fwData[0])));
      }
    } catch (err: any) {
      console.error("Failed to load competency data:", err);
      showToast(err.message || "Không thể tải dữ liệu từ CSDL.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Đồng bộ formData khi đổi framework được chọn
  const handleSelectFramework = (fId: string) => {
    setSelectedFrameworkId(fId);
    const target = frameworks.find((f) => f.id === fId);
    if (target) {
      setFormData(JSON.parse(JSON.stringify(target)));
    }
  };

  // Filter State cho Ngân hàng câu hỏi
  const [searchQuestion, setSearchQuestion] = useState("");
  const [filterJobTitle, setFilterJobTitle] = useState("all");
  const [filterCriteria, setFilterCriteria] = useState("all");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Modals State
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<InterviewQuestion | null>(null);
  const [questionFormData, setQuestionFormData] = useState({
    code: "",
    content: "",
    criteriaName: "",
    jobTitle: AVAILABLE_JOB_TITLES[0],
    difficulty: "medium" as "easy" | "medium" | "hard",
    suggestedAnswer: "",
  });

  const [rubricModalData, setRubricModalData] = useState<InterviewQuestion | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // =========================================================================
  // STRICT VALIDATION 100% LOGIC
  // =========================================================================
  const totalWeight = useMemo(() => {
    if (!formData || !formData.criteriaList) return 0;
    return formData.criteriaList.reduce((sum, item) => sum + (Number(item.weight) || 0), 0);
  }, [formData?.criteriaList]);

  const validationState = useMemo(() => {
    if (totalWeight === 100) {
      return {
        isValid: true,
        type: "success" as const,
        barColor: "bg-emerald-500",
        message: "✓ Tuyệt đối chính xác: Tổng trọng số đạt đúng 100%. Đáp ứng chuẩn mực đánh giá.",
        textColor: "text-emerald-700",
        bgColor: "bg-emerald-50 border-emerald-200",
      };
    }
    if (totalWeight < 100) {
      const remaining = 100 - totalWeight;
      return {
        isValid: false,
        type: "under" as const,
        barColor: "bg-amber-500",
        message: `⚠️ Tổng trọng số hiện tại là ${totalWeight}%. Tổng trọng số phải đúng bằng 100% (còn thiếu ${remaining}%).`,
        textColor: "text-amber-800",
        bgColor: "bg-amber-50 border-amber-200",
      };
    }
    const excess = totalWeight - 100;
    return {
      isValid: false,
      type: "over" as const,
      barColor: "bg-rose-500",
      message: `❌ Tổng trọng số hiện tại là ${totalWeight}%. Tổng trọng số phải đúng bằng 100% (đang vượt quá ${excess}%).`,
      textColor: "text-rose-800",
      bgColor: "bg-rose-50 border-rose-200",
    };
  }, [totalWeight]);

  // Dynamic Form Handlers
  const handleAutoBalanceWeights = () => {
    if (!formData || formData.criteriaList.length === 0) return;
    const count = formData.criteriaList.length;
    const baseWeight = Math.floor(100 / count);
    const remainder = 100 - baseWeight * count;

    const newCriteriaList = formData.criteriaList.map((crit, idx) => ({
      ...crit,
      weight: idx === 0 ? baseWeight + remainder : baseWeight,
    }));

    setFormData({
      ...formData,
      criteriaList: newCriteriaList,
    });
    showToast(`⚡ Đã tự động phân bổ cân bằng trọng số đúng 100%!`);
  };

  const handleAddCriteria = () => {
    if (!formData) return;
    const nextCode = `TC-${String(formData.criteriaList.length + 1).padStart(2, "0")}`;
    const newCriteria: CompetencyCriteria = {
      id: `crit-${Date.now()}`,
      code: nextCode,
      name: "",
      description: "",
      weight: 10,
    };
    const updatedList = [...formData.criteriaList, newCriteria];
    setFormData({
      ...formData,
      criteriaList: updatedList,
    });
  };

  const handleUpdateCriteria = (id: string, field: keyof CompetencyCriteria, value: any) => {
    if (!formData) return;
    setFormData({
      ...formData,
      criteriaList: formData.criteriaList.map((c) =>
        c.id === id ? { ...c, [field]: field === "weight" ? Number(value) || 0 : value } : c
      ),
    });
  };

  const handleRemoveCriteria = (id: string) => {
    if (!formData) return;
    if (formData.criteriaList.length <= 1) {
      alert("Khung năng lực cần tối thiểu 1 tiêu chí!");
      return;
    }
    setFormData({
      ...formData,
      criteriaList: formData.criteriaList.filter((c) => c.id !== id),
    });
  };


  const handleToggleJobTitle = (title: string) => {
    if (!formData) return;
    const exists = formData.appliedJobTitles.includes(title);
    setFormData({
      ...formData,
      appliedJobTitles: exists
        ? formData.appliedJobTitles.filter((t) => t !== title)
        : [...formData.appliedJobTitles, title],
    });
  };

  const handleSaveFramework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    if (!validationState.isValid) {
      alert("Không thể lưu: Tổng trọng số của khung năng lực bắt buộc phải đúng bằng 100%!");
      return;
    }
    if (!formData.name.trim()) {
      alert("Vui lòng nhập tên khung năng lực!");
      return;
    }
    if (formData.appliedJobTitles.length === 0) {
      alert("Vui lòng chọn ít nhất một chức danh áp dụng cho khung năng lực này!");
      return;
    }

    setIsSaving(true);
    try {
      let saved: CompetencyFramework;
      if (frameworks.some((f) => f.id === formData.id)) {
        saved = await competencyService.updateFramework(formData.id, formData);
        setFrameworks((prev) => prev.map((f) => (f.id === saved.id ? saved : f)));
      } else {
        saved = await competencyService.createFramework(formData);
        setFrameworks((prev) => [...prev, saved]);
        setSelectedFrameworkId(saved.id);
      }
      setFormData(saved);
      showToast(`Đã lưu thành công khung năng lực "${saved.name}" vào CSDL vĩnh viễn!`);
    } catch (err: any) {
      alert(err.message || "Lưu khung năng lực thất bại.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewFramework = async () => {
    const defaultCode = `CF-CUSTOM-${Math.floor(100 + Math.random() * 900)}`;
    const newF: Partial<CompetencyFramework> = {
      code: defaultCode,
      name: "Khung Năng Lực Mới (Chưa đặt tên)",
      department: AVAILABLE_DEPARTMENTS[0],
      appliedJobTitles: [AVAILABLE_JOB_TITLES[0]],
      status: "active",
      criteriaList: [
        { id: `c-1`, code: "TC-01", name: "Chuyên môn nghiệp vụ", description: "Mô tả thang điểm 1-5", weight: 50 },
        { id: `c-2`, code: "TC-02", name: "Kỹ năng mềm & Giao tiếp", description: "Mô tả thang điểm 1-5", weight: 50 },
      ],
    };

    setIsSaving(true);
    try {
      const created = await competencyService.createFramework(newF);
      setFrameworks((prev) => [created, ...prev]);
      setSelectedFrameworkId(created.id);
      setFormData(created);
      showToast(`Đã tạo mới khung năng lực "${created.code}" trong CSDL!`);
    } catch (err: any) {
      alert(err.message || "Không thể tạo mới khung năng lực.");
    } finally {
      setIsSaving(false);
    }
  };

  // =========================================================================
  // NGÂN HÀNG CÂU HỎI & LOGIC XÓA THAM CHIẾU
  // =========================================================================
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchSearch =
        q.content.toLowerCase().includes(searchQuestion.toLowerCase()) ||
        q.code.toLowerCase().includes(searchQuestion.toLowerCase()) ||
        q.criteriaName.toLowerCase().includes(searchQuestion.toLowerCase());
      const matchJob = filterJobTitle === "all" || q.jobTitle === filterJobTitle;
      const matchCrit = filterCriteria === "all" || q.criteriaName === filterCriteria;
      const matchDiff = filterDifficulty === "all" || q.difficulty === filterDifficulty;
      const matchStat = filterStatus === "all" || q.status === filterStatus;
      return matchSearch && matchJob && matchCrit && matchDiff && matchStat;
    });
  }, [questions, searchQuestion, filterJobTitle, filterCriteria, filterDifficulty, filterStatus]);

  const handleDeleteQuestion = async (q: InterviewQuestion) => {
    if (q.is_referenced) {
      alert(`Câu hỏi "${q.code}" đã được sử dụng trong ${q.timesUsed} cuộc phỏng vấn. Hệ thống không cho phép xóa để bảo toàn lịch sử đánh giá.`);
      return;
    }
    if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn câu hỏi [${q.code}] khỏi CSDL?`)) {
      try {
        await competencyService.deleteQuestion(q.id);
        setQuestions((prev) => prev.filter((item) => item.id !== q.id));
        showToast(`Đã xóa vĩnh viễn câu hỏi "${q.code}" khỏi CSDL.`);
      } catch (err: any) {
        alert(err.message || "Xóa câu hỏi thất bại.");
      }
    }
  };

  const handleToggleQuestionStatus = async (q: InterviewQuestion) => {
    const nextStatus = q.status === "active" ? "inactive" : "active";
    try {
      const updated = await competencyService.updateQuestion(q.id, { status: nextStatus });
      setQuestions((prev) =>
        prev.map((item) => (item.id === q.id ? updated : item))
      );
      showToast(
        nextStatus === "inactive"
          ? `Đã ngừng áp dụng câu hỏi "${q.code}".`
          : `Đã kích hoạt lại câu hỏi "${q.code}".`
      );
    } catch (err: any) {
      alert(err.message || "Cập nhật trạng thái thất bại.");
    }
  };

  // Modal Thêm / Sửa câu hỏi
  const handleOpenAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionFormData({
      code: `Q-NEW-${Math.floor(100 + Math.random() * 900)}`,
      content: "",
      criteriaName: formData?.criteriaList[0]?.name || "Kiến thức chuyên môn",
      jobTitle: formData?.appliedJobTitles[0] || AVAILABLE_JOB_TITLES[0],
      difficulty: "medium",
      suggestedAnswer: "",
    });
    setIsQuestionModalOpen(true);
  };

  const handleOpenEditQuestion = (q: InterviewQuestion) => {
    setEditingQuestion(q);
    setQuestionFormData({
      code: q.code,
      content: q.content,
      criteriaName: q.criteriaName,
      jobTitle: q.jobTitle,
      difficulty: q.difficulty,
      suggestedAnswer: q.suggestedAnswer,
    });
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionFormData.content.trim()) {
      alert("Vui lòng nhập nội dung câu hỏi!");
      return;
    }

    try {
      if (editingQuestion) {
        const updated = await competencyService.updateQuestion(editingQuestion.id, {
          content: questionFormData.content,
          criteriaName: questionFormData.criteriaName,
          jobTitle: questionFormData.jobTitle,
          difficulty: questionFormData.difficulty,
          suggestedAnswer: questionFormData.suggestedAnswer,
        });
        setQuestions((prev) =>
          prev.map((q) => (q.id === editingQuestion.id ? updated : q))
        );
        showToast(`Đã cập nhật câu hỏi "${editingQuestion.code}" vào CSDL!`);
      } else {
        const created = await competencyService.createQuestion({
          code: questionFormData.code,
          content: questionFormData.content,
          criteriaName: questionFormData.criteriaName,
          jobTitle: questionFormData.jobTitle,
          difficulty: questionFormData.difficulty,
          suggestedAnswer: questionFormData.suggestedAnswer,
        });
        setQuestions((prev) => [created, ...prev]);
        showToast(`Đã lưu câu hỏi mới "${created.code}" vào CSDL thành công!`);
      }
      setIsQuestionModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Lưu câu hỏi thất bại.");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-full bg-slate-900 text-white text-sm font-medium shadow-2xl animate-fade-in border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" />
            <span>DANH MỤC NỀN TẢNG PERSISTED (CSDL REALTIME)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Thiết lập Khung Năng Lực & Đánh Giá
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kết nối CSDL SQLite/PostgreSQL • Tiêu chí và dải trọng số lưu trữ vĩnh viễn không bao giờ mất khi reload
          </p>
        </div>

        {/* Thanh Tabs chuyển đổi dạng Pill */}
        <div className="flex items-center gap-1.5 p-1.5 bg-white rounded-full border border-gray-200 shadow-xs self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("framework")}
            className={`px-5 py-2 rounded-full text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "framework"
                ? "border border-blue-200 text-[#4285F4] bg-blue-50/70 font-bold shadow-xs"
                : "border border-transparent text-slate-500 hover:text-slate-800 font-medium"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>1. Khung năng lực (Strict 100%)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("questions")}
            className={`px-5 py-2 rounded-full text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "questions"
                ? "border border-blue-200 text-[#4285F4] bg-blue-50/70 font-bold shadow-xs"
                : "border border-transparent text-slate-500 hover:text-slate-800 font-medium"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>2. Ngân hàng câu hỏi</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-3xl p-12 border border-gray-100 text-center flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#4285F4] animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Đang tải dữ liệu khung năng lực và câu hỏi từ CSDL...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: FORM KHUNG NĂNG LỰC */}
          {activeTab === "framework" && formData && (
            <div className="space-y-6">
              {/* Thanh Chọn Khung Năng Lực */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Chọn bộ khung:
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {frameworks.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleSelectFramework(f.id)}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          selectedFrameworkId === f.id
                            ? "bg-[#4285F4] text-white shadow-md shadow-blue-500/20"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCreateNewFramework}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold transition-all self-start md:self-auto cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tạo Khung Mới CSDL</span>
                </button>
              </div>

              {/* Form Chi Tiết Khung Năng Lực */}
              <form onSubmit={handleSaveFramework} className="space-y-6">
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                        <span>Thông Tin Cấu Hình Khung Năng Lực</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-600 border border-blue-100">
                          {formData.code}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tất cả chỉnh sửa tiêu chí sẽ lưu trực tiếp xuống CSDL PostgreSQL / SQLite
                      </p>
                    </div>

                    {/* NÚT LƯU CSDL */}
                    <div className="flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={!validationState.isValid || isSaving}
                        className={`px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all shadow-md ${
                          validationState.isValid && !isSaving
                            ? "bg-[#4285F4] hover:bg-blue-600 text-white shadow-blue-500/25 cursor-pointer scale-100"
                            : "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none"
                        }`}
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        <span>Lưu Khung Năng Lực Vào CSDL</span>
                      </button>
                    </div>
                  </div>

                  {/* Thông tin cơ bản */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Tên khung năng lực *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="VD: Khung Năng Lực Kỹ Sư Phần Mềm"
                        required
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Khối phòng ban áp dụng *
                      </label>
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                      >
                        {AVAILABLE_DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Chức danh áp dụng */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Chức danh áp dụng khung năng lực này *
                      </label>
                      <span className="text-[11px] text-blue-600 font-bold">
                        Đã chọn {formData.appliedJobTitles.length} chức danh
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {AVAILABLE_JOB_TITLES.map((title) => {
                          const isSelected = formData.appliedJobTitles.includes(title);
                          return (
                            <button
                              key={title}
                              type="button"
                              onClick={() => handleToggleJobTitle(title)}
                              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                isSelected
                                  ? "bg-blue-600 text-white shadow-xs"
                                  : "bg-white text-slate-600 border border-slate-200 hover:border-blue-300"
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              <span>{title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* THANH PROGRESS BAR REALTIME */}
                  <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/90 space-y-4 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                          TỔNG TRỌNG SỐ ĐANG NHẬP:
                        </span>
                        <span
                          className={`text-xl font-black px-3 py-0.5 rounded-xl ${
                            totalWeight === 100
                              ? "bg-emerald-100 text-emerald-800"
                              : totalWeight < 100
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800 animate-pulse"
                          }`}
                        >
                          {totalWeight}%
                        </span>
                        <span className="text-xs text-slate-400">/ 100%</span>
                      </div>

                      <div className="text-xs font-bold">
                        {totalWeight === 100 ? (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Tròn 100% (Cho phép lưu vào CSDL)
                          </span>
                        ) : (
                          <span className="text-rose-600 flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" />
                            Chưa đạt 100% (Khóa nút lưu)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden p-0.5 relative">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ease-out ${validationState.barColor}`}
                          style={{ width: `${Math.min(totalWeight, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono px-1">
                        <span>0%</span>
                        <span>25%</span>
                        <span>50%</span>
                        <span>75%</span>
                        <span className="font-bold text-slate-700">100% (Chuẩn)</span>
                      </div>
                    </div>

                    <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${validationState.bgColor}`}>
                      {validationState.type === "success" ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-1">
                        <p className={`font-bold ${validationState.textColor}`}>
                          {validationState.message}
                        </p>
                        <p className="text-slate-600 leading-relaxed text-[11px]">
                          <strong>Quy tắc nghiệp vụ S2-06:</strong> Toàn bộ các tiêu chí đánh giá phỏng vấn của một chức danh phải có tổng trọng số đúng bằng 100%. Khi nhấn <strong>"Lưu Khung Năng Lực Vào CSDL"</strong>, dữ liệu sẽ được ghi nhận trực tiếp vào cơ sở dữ liệu vĩnh viễn.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* BẢNG TIÊU CHÍ ĐÁNH GIÁ (DYNAMIC FORM) */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <div>
                        <h4 className="text-base font-extrabold text-slate-900">
                          Danh Sách Tiêu Chí Đánh Giá Trong Khung
                        </h4>
                        <p className="text-xs text-slate-500">
                          Mỗi tiêu chí sẽ được người phỏng vấn chấm điểm từ 1 - 5 điểm theo trọng số quy định
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleAutoBalanceWeights}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                          title="Tự động chia đều trọng số tất cả tiêu chí để tổng đúng bằng 100%"
                        >
                          <Sparkles className="w-4 h-4 text-amber-600" />
                          <span>⚡ Cân Bằng Trọng Số (100%)</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleAddCriteria}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#4285F4] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Thêm Tiêu Chí</span>
                        </button>
                      </div>

                    </div>

                    {/* Table Criteria */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                            <th className="py-3 px-3 w-16 text-center">Mã</th>
                            <th className="py-3 px-4 min-w-[220px]">Tên tiêu chí đánh giá *</th>
                            <th className="py-3 px-4 min-w-[300px]">Hướng dẫn / Mô tả đánh giá (Thang 1-5)</th>
                            <th className="py-3 px-4 w-32 text-center">Trọng số (%) *</th>
                            <th className="py-3 px-3 w-16 text-center">Xóa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {formData.criteriaList.map((crit, index) => (
                            <tr key={crit.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-3 text-center">
                                <span className="px-2 py-1 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-700 font-mono">
                                  {crit.code}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="text"
                                  value={crit.name}
                                  onChange={(e) => handleUpdateCriteria(crit.id, "name", e.target.value)}
                                  placeholder={`Tiêu chí ${index + 1}...`}
                                  required
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="text"
                                  value={crit.description}
                                  onChange={(e) => handleUpdateCriteria(crit.id, "description", e.target.value)}
                                  placeholder="Mô tả tiêu chuẩn kỳ vọng để người phỏng vấn chấm điểm..."
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                                />
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={crit.weight}
                                    onChange={(e) => handleUpdateCriteria(crit.id, "weight", e.target.value)}
                                    required
                                    className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-xl text-center text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                                  />
                                  <span className="text-xs font-bold text-slate-400">%</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCriteria(crit.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Xóa tiêu chí này"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-50/90 font-bold border-t-2 border-slate-200">
                            <td colSpan={3} className="py-3.5 px-4 text-right text-xs uppercase text-slate-600">
                              Tổng cộng trọng số:
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`text-sm font-black px-2.5 py-1 rounded-lg ${
                                  totalWeight === 100
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {totalWeight}%
                              </span>
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: NGÂN HÀNG CÂU HỎI PHỎNG VẤN */}
          {activeTab === "questions" && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <span>Ngân Hàng Câu Hỏi Phỏng Vấn Theo Tiêu Chí (CSDL)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mỗi câu hỏi gắn với một tiêu chí cụ thể, đồng bộ CSDL vĩnh viễn
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddQuestion}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#4285F4] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Thêm Câu Hỏi Mới</span>
                </button>
              </div>

              {/* Toolbar */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                <div className="flex flex-wrap items-center gap-3 flex-1">
                  <div className="relative min-w-[240px] flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm nội dung câu hỏi, mã, từ khóa..."
                      value={searchQuestion}
                      onChange={(e) => setSearchQuestion(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                    />
                  </div>

                  <select
                    value={filterJobTitle}
                    onChange={(e) => setFilterJobTitle(e.target.value)}
                    className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                  >
                    <option value="all">Tất cả chức danh</option>
                    {AVAILABLE_JOB_TITLES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                  >
                    <option value="all">Tất cả độ khó</option>
                    <option value="easy">Dễ (Xanh lá)</option>
                    <option value="medium">Vừa (Vàng)</option>
                    <option value="hard">Khó (Đỏ)</option>
                  </select>
                </div>

                {(searchQuestion || filterJobTitle !== "all" || filterDifficulty !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuestion("");
                      setFilterJobTitle("all");
                      setFilterDifficulty("all");
                    }}
                    className="text-xs text-[#4285F4] font-bold hover:underline self-end md:self-auto cursor-pointer"
                  >
                    Đặt lại bộ lọc
                  </button>
                )}
              </div>

              {/* Bảng Danh Sách Câu Hỏi */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <th className="py-3.5 px-4 w-28">Mã & Trạng thái</th>
                      <th className="py-3.5 px-4 min-w-[280px]">Nội dung câu hỏi phỏng vấn</th>
                      <th className="py-3.5 px-4 min-w-[180px]">Tiêu chí & Chức danh</th>
                      <th className="py-3.5 px-4 w-28 text-center">Độ khó</th>
                      <th className="py-3.5 px-4 w-32 text-center">Gợi ý trả lời</th>
                      <th className="py-3.5 px-4 w-44 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredQuestions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          Không tìm thấy câu hỏi phù hợp trong CSDL.
                        </td>
                      </tr>
                    ) : (
                      filteredQuestions.map((q) => {
                        return (
                          <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-mono text-xs font-bold text-slate-800">
                                {q.code}
                              </div>
                              <div className="mt-1">
                                {q.status === "active" ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Áp dụng
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                    Ngừng áp dụng
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <p className="font-semibold text-slate-900 leading-snug">
                                {q.content}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                                {q.is_referenced ? (
                                  <span className="text-blue-600 font-semibold flex items-center gap-1">
                                    <Lock className="w-3 h-3" />
                                    Đã dùng {q.timesUsed} lần trong phỏng vấn
                                  </span>
                                ) : (
                                  <span className="text-slate-400">
                                    Chưa đưa vào phỏng vấn thực tế
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="text-xs font-bold text-slate-800">
                                {q.criteriaName}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {q.jobTitle}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              {q.difficulty === "easy" && (
                                <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                                  Dễ
                                </span>
                              )}
                              {q.difficulty === "medium" && (
                                <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                                  Vừa
                                </span>
                              )}
                              {q.difficulty === "hard" && (
                                <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                                  Khó
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => setRubricModalData(q)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-600 text-xs font-bold transition-all cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Xem Rubric</span>
                              </button>
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {q.is_referenced ? (
                                  <>
                                    <button
                                      type="button"
                                      disabled
                                      className="px-2.5 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 flex items-center gap-1"
                                      title={`Câu hỏi đã được sử dụng trong ${q.timesUsed} buổi phỏng vấn. Khóa xóa để giữ lịch sử.`}
                                    >
                                      <Lock className="w-3.5 h-3.5" />
                                      <span>Khóa Xóa</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleToggleQuestionStatus(q)}
                                      className={`px-2.5 py-1.5 rounded-full text-xs font-bold transition-colors border cursor-pointer ${
                                        q.status === "active"
                                          ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                          : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                      }`}
                                    >
                                      {q.status === "active" ? "Ngừng áp dụng" : "Kích hoạt"}
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditQuestion(q)}
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                      title="Chỉnh sửa câu hỏi"
                                    >
                                      <Sliders className="w-4 h-4" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteQuestion(q)}
                                      className="px-3 py-1.5 rounded-full text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                                      title="Xóa vĩnh viễn câu hỏi khỏi CSDL"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Xóa</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL RUBRIC */}
      {rubricModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-blue-50 text-blue-600 font-mono">
                  {rubricModalData.code}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Tiêu chuẩn chấm điểm phỏng vấn
                </span>
              </div>
              <button
                type="button"
                onClick={() => setRubricModalData(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Câu hỏi phỏng vấn
                </span>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {rubricModalData.content}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block">Tiêu chí:</span>
                  <strong className="text-slate-800">{rubricModalData.criteriaName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Mức độ khó:</span>
                  <strong className="text-slate-800 capitalize">
                    {rubricModalData.difficulty === "easy"
                      ? "Dễ"
                      : rubricModalData.difficulty === "medium"
                      ? "Vừa"
                      : "Khó"}
                  </strong>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-4 h-4" />
                  Gợi ý câu trả lời chuẩn & Tiêu chuẩn đánh giá (Rubric)
                </span>
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-slate-700 leading-relaxed font-medium space-y-2">
                  <p>{rubricModalData.suggestedAnswer}</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setRubricModalData(null)}
                className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÊM / SỬA CÂU HỎI MỚI */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-lg font-extrabold text-slate-900">
                {editingQuestion ? `Chỉnh Sửa Câu Hỏi [${editingQuestion.code}]` : "+ Thêm Câu Hỏi Mới CSDL"}
              </h3>
              <button
                type="button"
                onClick={() => setIsQuestionModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mã câu hỏi *
                  </label>
                  <input
                    type="text"
                    value={questionFormData.code}
                    onChange={(e) => setQuestionFormData({ ...questionFormData, code: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mức độ khó
                  </label>
                  <select
                    value={questionFormData.difficulty}
                    onChange={(e) =>
                      setQuestionFormData({
                        ...questionFormData,
                        difficulty: e.target.value as "easy" | "medium" | "hard",
                      })
                    }
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="easy">Dễ (Xanh lá)</option>
                    <option value="medium">Vừa (Vàng)</option>
                    <option value="hard">Khó (Đỏ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Chức danh áp dụng *
                </label>
                <select
                  value={questionFormData.jobTitle}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, jobTitle: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                >
                  {AVAILABLE_JOB_TITLES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tiêu chí gắn liền trong khung năng lực *
                </label>
                <input
                  type="text"
                  value={questionFormData.criteriaName}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, criteriaName: e.target.value })}
                  placeholder="VD: Kiến trúc hệ thống & Thiết kế CSDL"
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nội dung câu hỏi phỏng vấn *
                </label>
                <textarea
                  rows={3}
                  value={questionFormData.content}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, content: e.target.value })}
                  placeholder="Nhập nội dung câu hỏi đặt ra cho ứng viên..."
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Gợi ý trả lời & Tiêu chuẩn đánh giá (Rubric) *
                </label>
                <textarea
                  rows={3}
                  value={questionFormData.suggestedAnswer}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, suggestedAnswer: e.target.value })}
                  placeholder="Các ý chính ứng viên cần nêu để đạt điểm tối đa..."
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-gray-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#4285F4] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Lưu Câu Hỏi Vào CSDL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompetencyManagementView;
