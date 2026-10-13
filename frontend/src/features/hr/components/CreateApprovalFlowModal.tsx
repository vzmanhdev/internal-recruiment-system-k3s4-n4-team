"use client";

import React, { useState } from "react";
import { Layers, X, Plus, Trash2, ShieldCheck, DollarSign, ArrowRight } from "lucide-react";

export interface ApprovalStepItem {
  step_num: number;
  role: string;
  description: string;
}

export interface ApprovalFlowFormData {
  name: string;
  department: string;
  approvalType: string;
  minSalary: number;
  maxSalary: number;
  steps: ApprovalStepItem[];
}

interface CreateApprovalFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ApprovalFlowFormData) => void;
}

const DEPARTMENT_OPTIONS = [
  "Toàn Doanh Nghiệp",
  "Công Nghệ Thông Tin",
  "Khối Dữ Liệu & Phân Tích (Data & BI)",
  "Phòng Marketing & Growth",
  "Khối Quản Trị Nguồn Nhân Lực (HR)",
  "Khối Kinh Doanh & Tăng Trưởng",
  "Phòng Quản Lý Chất Lượng QA/QC",
];

const APPROVAL_TYPE_OPTIONS = [
  "Tuyển dụng (Job Requisition)",
  "Offer thư mời nhận việc",
  "Ngân sách tuyển dụng (Headcount)",
  "Ngoại lệ lương (Salary Exception)",
];

const ROLE_OPTIONS = [
  { value: "HIRING_MANAGER", label: "HIRING_MANAGER (Trưởng phòng chuyên môn)" },
  { value: "HR_MANAGER", label: "HR_MANAGER (Trưởng phòng Nhân sự)" },
  { value: "DIRECTOR", label: "DIRECTOR (Giám đốc Khối)" },
  { value: "CFO", label: "CFO (Giám đốc Tài chính)" },
  { value: "CEO", label: "CEO (Tổng Giám Đốc)" },
  { value: "RECRUITER", label: "RECRUITER (Chuyên viên Tuyển dụng)" },
];

export const CreateApprovalFlowModal: React.FC<CreateApprovalFlowModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("Công Nghệ Thông Tin");
  const [approvalType, setApprovalType] = useState("Tuyển dụng (Job Requisition)");
  const [minSalary, setMinSalary] = useState<number | "">(0);
  const [maxSalary, setMaxSalary] = useState<number | "">(50);

  // Mảng dynamic state các cấp duyệt, mặc định có sẵn 1 cấp
  const [steps, setSteps] = useState<ApprovalStepItem[]>([
    {
      step_num: 1,
      role: "HIRING_MANAGER",
      description: "Trưởng phòng chuyên môn đề xuất",
    },
  ]);

  if (!isOpen) return null;

  // Thêm cấp duyệt mới
  const handleAddStep = () => {
    const nextStepNum = steps.length + 1;
    let defaultRole = "HR_MANAGER";
    let defaultDesc = "Trưởng phòng Nhân sự thẩm định định biên & dải lương";

    if (nextStepNum === 3) {
      defaultRole = "CEO";
      defaultDesc = "Ban Giám Đốc phê duyệt cuối cùng";
    }

    setSteps((prev) => [
      ...prev,
      {
        step_num: nextStepNum,
        role: defaultRole,
        description: defaultDesc,
      },
    ]);
  };

  // Xóa cấp duyệt
  const handleRemoveStep = (indexToRemove: number) => {
    if (steps.length <= 1) {
      alert("Luồng phê duyệt bắt buộc phải có ít nhất 1 cấp duyệt!");
      return;
    }

    setSteps((prev) => {
      const filtered = prev.filter((_, idx) => idx !== indexToRemove);
      // Đánh số lại thứ tự cấp 1, 2, 3...
      return filtered.map((item, idx) => ({
        ...item,
        step_num: idx + 1,
      }));
    });
  };

  // Sửa trường thông tin trong từng cấp
  const handleStepChange = (index: number, field: "role" | "description", value: string) => {
    setSteps((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Vui lòng nhập tên luồng phê duyệt!");
      return;
    }

    if (steps.length === 0) {
      alert("Vui lòng thiết lập ít nhất 1 cấp phê duyệt!");
      return;
    }

    const min = typeof minSalary === "number" ? minSalary : 0;
    const max = typeof maxSalary === "number" ? maxSalary : 100;

    onSubmit({
      name: name.trim(),
      department,
      approvalType,
      minSalary: min,
      maxSalary: max,
      steps,
    });

    // Reset form
    setName("");
    setMinSalary(0);
    setMaxSalary(50);
    setSteps([
      { step_num: 1, role: "HIRING_MANAGER", description: "Trưởng phòng chuyên môn đề xuất" },
    ]);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* 1. Modal Wrapper */}
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 transform transition-all overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Tạo Luồng Phê Duyệt Mới</h3>
              <p className="text-xs text-slate-500 font-medium">
                Thiết lập quy trình duyệt 1-3 cấp theo phòng ban, loại đề xuất & ngưỡng lương
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer text-base"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          {/* 2. Bố cục các trường thông tin cơ bản: grid grid-cols-1 md:grid-cols-2 gap-5 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Tên luồng duyệt (*) - col-span-2 */}
            <div className="col-span-1 md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                Tên Luồng Duyệt <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Luồng Duyệt Tuyển Dụng Khối CNTT (Dưới 50 Tr VNĐ)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              />
            </div>

            {/* Phòng ban áp dụng */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                Phòng Ban Áp Dụng
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer"
              >
                {DEPARTMENT_OPTIONS.map((dept, idx) => (
                  <option key={idx} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Loại phê duyệt */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                Loại Phê Duyệt
              </label>
              <select
                value={approvalType}
                onChange={(e) => setApprovalType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer"
              >
                {APPROVAL_TYPE_OPTIONS.map((type, idx) => (
                  <option key={idx} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Khối Thiết lập Ngưỡng Lương (Salary Range Threshold): col-span-2 */}
            <div className="col-span-1 md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-purple-600" />
                  <span>Ngưỡng áp dụng (Tùy chọn - Đơn vị: Triệu VNĐ)</span>
                </h4>
                <span className="text-[11px] text-slate-400">
                  Tự động kích hoạt khi lương đề xuất nằm trong khoảng này
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Mức tối thiểu (Min) */}
                <div>
                  <label className="block font-bold text-slate-600 mb-1 text-[11px]">
                    Mức Tối Thiểu (Min)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={minSalary}
                      onChange={(e) =>
                        setMinSalary(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                    <span className="text-[10px] text-slate-400 absolute right-3 top-1/2 -translate-y-1/2">
                      TR VNĐ
                    </span>
                  </div>
                </div>

                {/* Mức tối đa (Max) */}
                <div>
                  <label className="block font-bold text-slate-600 mb-1 text-[11px]">
                    Mức Tối Đa (Max)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="50"
                      value={maxSalary}
                      onChange={(e) =>
                        setMaxSalary(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                    <span className="text-[10px] text-slate-400 absolute right-3 top-1/2 -translate-y-1/2">
                      TR VNĐ
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Khối Định nghĩa các Cấp Phê Duyệt (Approval Levels - Động): col-span-2 */}
            <div className="col-span-1 md:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Các Cấp Phê Duyệt ({steps.length} cấp)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Quy trình tuần tự từ Cấp 1 đến cấp duyệt sau cùng
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddStep}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition-all border border-purple-200 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Thêm cấp duyệt</span>
                </button>
              </div>

              {/* Danh sách các card cấp duyệt */}
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white border border-slate-200 p-4 rounded-xl shadow-2xs hover:border-purple-300 transition-all"
                  >
                    {/* Badge Số thứ tự Cấp */}
                    <div className="shrink-0 flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 font-extrabold flex items-center justify-center text-xs">
                        {step.step_num}
                      </span>
                      <span className="font-bold text-slate-800 text-xs">Cấp {step.step_num}</span>
                    </div>

                    {/* Vai trò duyệt (Role) */}
                    <div className="w-full sm:w-64">
                      <select
                        value={step.role}
                        onChange={(e) => handleStepChange(index, "role", e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer"
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Mô tả vai trò */}
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Mô tả nhiệm vụ phê duyệt (ví dụ: Trưởng phòng chuyên môn đề xuất)..."
                        value={step.description}
                        onChange={(e) => handleStepChange(index, "description", e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      />
                    </div>

                    {/* Nút xóa cấp duyệt */}
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(index)}
                      title="Xóa cấp duyệt này"
                      disabled={steps.length <= 1}
                      className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
                        steps.length <= 1
                          ? "text-slate-300 cursor-not-allowed"
                          : "text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Footer Actions (Dải nút bấm dính đáy) */}
          <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-slate-200 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer active:scale-95"
            >
              Lưu Luồng Phê Duyệt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
