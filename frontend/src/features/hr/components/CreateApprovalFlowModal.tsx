"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Layers, X, Plus, Trash2, ShieldCheck, DollarSign, Lightbulb, 
  AlertTriangle, Check, Search, ChevronDown, Eye, History
} from "lucide-react";
import { Department, ApprovalTypeOption, ApprovalRoleOption, ApprovalFlow, ApprovalFlowStep } from "@/services/master-data.service";
import { formatVND, numberToWordsVietnamese } from "@/lib/currency";

export interface ApprovalFlowFormData {
  name: string;
  department_id: number | null;
  approval_type: string;
  min_salary_threshold: number;
  max_salary_threshold: number;
  steps: ApprovalFlowStep[];
  status: "active" | "draft";
  description?: string;
}

interface CreateApprovalFlowModalProps {
  isOpen: boolean;
  mode?: "create" | "edit" | "view";
  initialData?: ApprovalFlow | null;
  onClose: () => void;
  onSubmit: (data: ApprovalFlowFormData) => Promise<void> | void;
  departments: Department[];
  approvalTypes: ApprovalTypeOption[];
  approvalRoles: ApprovalRoleOption[];
}

export const CreateApprovalFlowModal: React.FC<CreateApprovalFlowModalProps> = ({
  isOpen,
  mode = "create",
  initialData = null,
  onClose,
  onSubmit,
  departments,
  approvalTypes,
  approvalRoles,
}) => {
  const isViewOnly = mode === "view";
  const isEdit = mode === "edit";

  const uniqueApprovalTypes = useMemo(() => {
    const seen = new Set<string>();
    return (approvalTypes || []).filter((t) => {
      if (seen.has(t.code)) return false;
      seen.add(t.code);
      return true;
    });
  }, [approvalTypes]);

  const [name, setName] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [approvalType, setApprovalType] = useState<string>("job_requisition");
  const [minSalary, setMinSalary] = useState<number>(0);
  const [maxSalary, setMaxSalary] = useState<number>(50_000_000);
  const [minSalaryInput, setMinSalaryInput] = useState<string>("0");
  const [maxSalaryInput, setMaxSalaryInput] = useState<string>("50.000.000");
  const [flowStatus, setFlowStatus] = useState<"active" | "draft">("draft");
  const [description, setDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMinSalaryChange = (val: string) => {
    const digits = val.replace(/\D/g, "");
    const num = digits ? parseInt(digits, 10) : 0;
    setMinSalary(num);
    setMinSalaryInput(num > 0 ? num.toLocaleString("vi-VN") : "0");
  };

  const handleMaxSalaryChange = (val: string) => {
    const digits = val.replace(/\D/g, "");
    const num = digits ? parseInt(digits, 10) : 0;
    setMaxSalary(num);
    setMaxSalaryInput(num > 0 ? num.toLocaleString("vi-VN") : "0");
  };

  // Searchable Department Combobox State
  const [deptSearchTerm, setDeptSearchTerm] = useState("");
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const deptDropdownRef = useRef<HTMLDivElement>(null);

  // Steps state
  const [steps, setSteps] = useState<ApprovalFlowStep[]>([
    {
      step_num: 1,
      role: "HIRING_MANAGER",
      description: "Đề xuất & xác nhận nhu cầu tuyển dụng",
    },
  ]);

  // Sync state on open / initialData change
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setName(initialData.name || "");
      setSelectedDeptId(initialData.department_id);
      setApprovalType(initialData.approval_type || "job_requisition");
      const min = initialData.min_salary_threshold || 0;
      const max = initialData.max_salary_threshold || 50_000_000;
      setMinSalary(min);
      setMaxSalary(max);
      setMinSalaryInput(min > 0 ? min.toLocaleString("vi-VN") : "0");
      setMaxSalaryInput(max > 0 ? max.toLocaleString("vi-VN") : "0");
      setFlowStatus(initialData.status === "active" ? "active" : "draft");
      setDescription(initialData.description || "");

      if (initialData.steps_detail && initialData.steps_detail.length > 0) {
        setSteps(initialData.steps_detail.map((st, i) => ({
          step_num: i + 1,
          role: st.role || "HIRING_MANAGER",
          description: st.description || "",
        })));
      } else if (initialData.steps && initialData.steps.length > 0) {
        setSteps(initialData.steps.map((code: any, i) => ({
          step_num: i + 1,
          role: typeof code === 'string' ? code.toUpperCase() : (code?.role || 'HIRING_MANAGER'),
          description: `Cấp phê duyệt số ${i + 1}`,
        })));
      }
    } else {
      // Default new flow values
      setName("");
      setSelectedDeptId(departments.length > 0 ? departments[0].id : null);
      setApprovalType(approvalTypes.length > 0 ? approvalTypes[0].code : "job_requisition");
      setMinSalary(0);
      setMaxSalary(50_000_000);
      setMinSalaryInput("0");
      setMaxSalaryInput((50_000_000).toLocaleString("vi-VN"));
      setFlowStatus("draft");
      setDescription("");
      setSteps([
        {
          step_num: 1,
          role: "HIRING_MANAGER",
          description: "Đề xuất & xác nhận nhu cầu tuyển dụng",
        },
      ]);
    }
    setDeptSearchTerm("");
    setIsDeptDropdownOpen(false);
  }, [isOpen, initialData, departments, approvalTypes]);

  // Close department dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(event.target as Node)) {
        setIsDeptDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered department options
  const filteredDepartments = useMemo(() => {
    const list = departments.filter((d) => d.is_active);
    if (!deptSearchTerm.trim()) return list;
    const term = deptSearchTerm.toLowerCase();
    return list.filter((d) => d.name.toLowerCase().includes(term) || d.code.toLowerCase().includes(term));
  }, [departments, deptSearchTerm]);

  const selectedDepartmentName = useMemo(() => {
    if (selectedDeptId === null) return "Toàn doanh nghiệp";
    const found = departments.find((d) => d.id === selectedDeptId);
    return found ? found.name : "Toàn doanh nghiệp";
  }, [selectedDeptId, departments]);

  const selectedApprovalTypeName = useMemo(() => {
    const found = approvalTypes.find((t) => t.code === approvalType);
    return found ? found.name : "Tuyển dụng (Job Requisition)";
  }, [approvalType, approvalTypes]);

  if (!isOpen) return null;

  // Add step handler (max 3)
  const handleAddStep = () => {
    if (steps.length >= 3) return;
    const nextStepNum = steps.length + 1;
    let nextRole = "HR_MANAGER";
    let nextDesc = "Thẩm định định biên, SLA và ngân sách";

    if (nextStepNum === 3) {
      nextRole = "EXECUTIVE";
      nextDesc = "Ban Giám Đốc phê duyệt cuối cùng";
    }

    setSteps((prev) => [
      ...prev,
      {
        step_num: nextStepNum,
        role: nextRole,
        description: nextDesc,
      },
    ]);
  };

  // Remove step handler (min 1)
  const handleRemoveStep = (indexToRemove: number) => {
    if (steps.length <= 1) return;
    setSteps((prev) => {
      const filtered = prev.filter((_, idx) => idx !== indexToRemove);
      return filtered.map((item, idx) => ({
        ...item,
        step_num: idx + 1,
      }));
    });
  };

  const handleStepChange = (index: number, field: "role" | "description", value: string) => {
    setSteps((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        if (field === "role") {
          // auto fill suggestion description if user changes role and desc was default
          const foundRole = approvalRoles.find((r) => r.code === value);
          const autoDesc = foundRole?.description || item.description;
          return { ...item, role: value, description: autoDesc };
        }
        return { ...item, [field]: value };
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewOnly) {
      onClose();
      return;
    }

    if (!name.trim()) {
      alert("Vui lòng nhập tên luồng phê duyệt!");
      return;
    }

    if (steps.length === 0) {
      alert("Luồng phê duyệt bắt buộc phải có ít nhất 1 cấp duyệt!");
      return;
    }

    if (maxSalary <= minSalary) {
      alert("Mức tối đa phải lớn hơn mức tối thiểu!");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        name: name.trim(),
        department_id: selectedDeptId,
        approval_type: approvalType,
        min_salary_threshold: minSalary,
        max_salary_threshold: maxSalary,
        steps,
        status: flowStatus,
        description: description.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl transform transition-all overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100/70 border border-purple-200 text-purple-700 flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  {isViewOnly ? "Chi tiết luồng phê duyệt" : isEdit ? "Chỉnh sửa luồng phê duyệt" : "Tạo luồng phê duyệt mới"}
                </h3>
                {initialData?.version && (
                  <span className="font-mono bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                    {initialData.version}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Thiết lập quy trình duyệt 2–3 cấp theo phòng ban, loại phê duyệt và ngưỡng áp dụng.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-6 flex-1 text-xs">
          {/* 1. THÔNG TIN CHUNG */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center">
                1
              </span>
              <h4 className="font-bold text-slate-900 text-sm">Thông tin chung</h4>
            </div>

            <div className="space-y-3.5 pl-7">
              {/* Tên luồng duyệt */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên luồng duyệt <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={isViewOnly}
                  placeholder="Ví dụ: Luồng Tuyển Dụng Khối CNTT (Dưới 50 Tr VNĐ)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              {/* Grid: Phòng ban áp dụng & Loại phê duyệt */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Searchable Combobox Phòng ban áp dụng */}
                <div className="relative" ref={deptDropdownRef}>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phòng ban áp dụng <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    disabled={isViewOnly}
                    onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium flex items-center justify-between focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-left cursor-pointer disabled:bg-slate-100"
                  >
                    <span className="truncate">{selectedDepartmentName}</span>
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                  </button>

                  {/* Dropdown with live search */}
                  {isDeptDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden animate-fadeIn">
                      <div className="p-2 border-b border-slate-100 bg-slate-50/70">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Tìm phòng ban..."
                            value={deptSearchTerm}
                            onChange={(e) => setDeptSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            autoFocus
                          />
                        </div>
                      </div>

                      <div className="max-h-52 overflow-y-auto p-1 space-y-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDeptId(null);
                            setIsDeptDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                            selectedDeptId === null ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <span>Toàn doanh nghiệp</span>
                          {selectedDeptId === null && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </button>

                        {filteredDepartments.map((dept) => (
                          <button
                            key={dept.id}
                            type="button"
                            onClick={() => {
                              setSelectedDeptId(dept.id);
                              setIsDeptDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                              selectedDeptId === dept.id ? "bg-blue-50 text-blue-700 font-semibold" : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <span className="truncate">{dept.name}</span>
                            {selectedDeptId === dept.id && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                          </button>
                        ))}

                        {filteredDepartments.length === 0 && (
                          <div className="text-center py-4 text-xs text-slate-400">
                            Không tìm thấy phòng ban phù hợp
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Loại phê duyệt (Tải từ API) */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Loại phê duyệt <span className="text-rose-500">*</span>
                  </label>
                  <select
                    disabled={isViewOnly}
                    value={approvalType}
                    onChange={(e) => setApprovalType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer disabled:bg-slate-100"
                  >
                    {uniqueApprovalTypes.map((t, idx) => (
                      <option key={`${t.code}-${idx}`} value={t.code}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 2. NGƯỠNG KÍCH HOẠT (Đơn vị: VND) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center">
                2
              </span>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Ngưỡng kích hoạt</h4>
                <p className="text-[11px] text-slate-500">
                  Luồng sẽ tự động kích hoạt khi giá trị đề xuất nằm trong khoảng này.
                </p>
              </div>
            </div>

            <div className="pl-7 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mức tối thiểu (VND) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                  Mức tối thiểu (VND)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled={isViewOnly}
                    value={minSalaryInput}
                    onChange={(e) => handleMinSalaryChange(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-14 disabled:bg-slate-100"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 pointer-events-none">
                    VNĐ
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 italic">
                  {numberToWordsVietnamese(minSalary)}
                </p>
              </div>

              {/* Mức tối đa (VND) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-[11px]">
                  Mức tối đa (VND) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    disabled={isViewOnly}
                    value={maxSalaryInput}
                    onChange={(e) => handleMaxSalaryChange(e.target.value)}
                    placeholder="50.000.000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-14 disabled:bg-slate-100"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 pointer-events-none">
                    VNĐ
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 italic">
                  {numberToWordsVietnamese(maxSalary)}
                </p>
              </div>
            </div>
          </div>

          {/* 3. CÁC CẤP PHÊ DUYỆT (Tối đa 3 cấp) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center">
                  3
                </span>
                <h4 className="font-bold text-slate-900 text-sm">
                  Các cấp phê duyệt <span className="text-slate-400 font-normal">(Tối đa 3 cấp)</span>
                </h4>
              </div>

              {!isViewOnly && steps.length < 3 && (
                <button
                  type="button"
                  onClick={handleAddStep}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all border border-blue-200 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Thêm cấp duyệt</span>
                </button>
              )}
            </div>

            <div className="space-y-3 pl-7">
              {steps.map((st, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50/70 border border-slate-200/90 p-3.5 rounded-xl transition-all"
                >
                  {/* Badge số cấp */}
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs">
                      {st.step_num}
                    </span>
                  </div>

                  {/* Dropdown Vai trò duyệt */}
                  <div className="w-full sm:w-72 md:w-80 shrink-0">
                    <select
                      disabled={isViewOnly}
                      value={st.role}
                      onChange={(e) => handleStepChange(index, "role", e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer disabled:bg-slate-100 truncate"
                    >
                      {approvalRoles.map((r) => (
                        <option key={r.code} value={r.code}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Input Mô tả vai trò */}
                  <div className="flex-1">
                    <input
                      type="text"
                      disabled={isViewOnly}
                      placeholder="Mô tả vai trò / trách nhiệm phê duyệt..."
                      value={st.description}
                      onChange={(e) => handleStepChange(index, "description", e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-100"
                    />
                  </div>

                  {/* Nút xóa cấp duyệt */}
                  {!isViewOnly && (
                    <button
                      type="button"
                      disabled={steps.length <= 1}
                      onClick={() => handleRemoveStep(index)}
                      className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
                        steps.length <= 1
                          ? "text-slate-300 cursor-not-allowed"
                          : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 4. XEM TRƯỚC QUY TẮC ÁP DỤNG (Real-time dynamic rule preview) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center">
                4
              </span>
              <h4 className="font-bold text-slate-900 text-sm">Xem trước quy tắc áp dụng</h4>
            </div>

            <div className="pl-7">
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 leading-relaxed font-medium">
                  Tờ trình{" "}
                  <strong className="text-blue-900">{selectedApprovalTypeName.toLowerCase()}</strong>{" "}
                  thuộc{" "}
                  <strong className="text-blue-900">{selectedDepartmentName}</strong>, có mức đề xuất từ{" "}
                  <strong className="text-blue-900">{formatVND(minSalary)}</strong> đến{" "}
                  <strong className="text-blue-900">{formatVND(maxSalary)}</strong>, sẽ đi qua{" "}
                  <strong className="text-blue-900">{steps.length} cấp duyệt</strong>:{" "}
                  <span className="text-blue-800 font-semibold">
                    {steps
                      .map((st) => {
                        const r = approvalRoles.find((role) => role.code === st.role);
                        return r ? r.name.split(" (")[0] : st.role;
                      })
                      .join(" → ")}
                  </span>
                  .
                </div>
              </div>
            </div>
          </div>

          {/* 5. TRẠNG THÁI & HÀNH ĐỘNG */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center">
                5
              </span>
              <h4 className="font-bold text-slate-900 text-sm">Trạng thái & hành động</h4>
            </div>

            <div className="pl-7 space-y-3.5">
              {!isViewOnly ? (
                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="flowStatus"
                      value="draft"
                      checked={flowStatus === "draft"}
                      onChange={() => setFlowStatus("draft")}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <div>
                      <span className="font-bold text-slate-800">Bản nháp</span>
                      <span className="text-[11px] text-slate-500 block">Lưu để chỉnh sửa, chưa áp dụng</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="flowStatus"
                      value="active"
                      checked={flowStatus === "active"}
                      onChange={() => setFlowStatus("active")}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <div>
                      <span className="font-bold text-slate-800">Kích hoạt ngay</span>
                      <span className="text-[11px] text-slate-500 block">Áp dụng cho tờ trình tạo mới</span>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="text-xs">
                  Trạng thái hiện tại:{" "}
                  <strong className={initialData?.status === "active" ? "text-emerald-700" : "text-slate-600"}>
                    {initialData?.status === "active" ? "Đang áp dụng" : "Bản nháp / Ngừng áp dụng"}
                  </strong>
                </div>
              )}

              {/* Version warning note */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Nếu chỉnh sửa luồng đang áp dụng, hệ thống sẽ tự động tạo phiên bản mới. Tờ trình đang chạy sẽ giữ nguyên luồng cũ.
                </p>
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/60">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            {isViewOnly ? "Đóng" : "Hủy"}
          </button>
          {!isViewOnly && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? "Đang lưu..." : isEdit ? "Cập nhật luồng phê duyệt" : "Lưu luồng phê duyệt"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
