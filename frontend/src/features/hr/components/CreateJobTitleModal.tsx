"use client";

import React, { useState } from "react";
import { Award, X, DollarSign, Building2, Layers, CheckCircle2 } from "lucide-react";

export interface JobTitleFormData {
  title: string;
  code: string;
  department: string;
  level: string;
  minSalary: number;
  midSalary: number;
  maxSalary: number;
  status: "active" | "inactive";
}

interface CreateJobTitleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: JobTitleFormData) => void;
}

const DEPARTMENT_OPTIONS = [
  "Tất cả phòng ban",
  "Công Nghệ Thông Tin",
  "Khối Dữ Liệu & Phân Tích (Data & BI)",
  "Phòng Marketing & Growth",
  "Khối Quản Trị Nguồn Nhân Lực (HR)",
  "Khối Kinh Doanh & Tăng Trưởng",
  "Phòng Quản Lý Chất Lượng QA/QC",
];

const LEVEL_OPTIONS = [
  "Level 1 (Intern / Fresher)",
  "Level 2 (Junior)",
  "Level 3 (Middle)",
  "Level 4 (Senior)",
  "Level 5 (Lead / Architect / Manager)",
  "Level 6 (Director / Head of Dept)",
];

export const CreateJobTitleModal: React.FC<CreateJobTitleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [department, setDepartment] = useState("Công Nghệ Thông Tin");
  const [level, setLevel] = useState("Level 4 (Senior)");
  const [minSalary, setMinSalary] = useState<number | "">(35);
  const [midSalary, setMidSalary] = useState<number | "">(42.5);
  const [maxSalary, setMaxSalary] = useState<number | "">(50);
  const [status, setStatus] = useState<"active" | "inactive">("active");

  if (!isOpen) return null;

  // Auto calculate mid salary if min and max change
  const handleMinChange = (val: string) => {
    const num = val === "" ? "" : Number(val);
    setMinSalary(num);
    if (typeof num === "number" && typeof maxSalary === "number" && maxSalary >= num) {
      setMidSalary(parseFloat(((num + maxSalary) / 2).toFixed(1)));
    }
  };

  const handleMaxChange = (val: string) => {
    const num = val === "" ? "" : Number(val);
    setMaxSalary(num);
    if (typeof minSalary === "number" && typeof num === "number" && num >= minSalary) {
      setMidSalary(parseFloat(((minSalary + num) / 2).toFixed(1)));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) {
      alert("Vui lòng điền đầy đủ Tên chức danh và Mã chức danh!");
      return;
    }

    const min = typeof minSalary === "number" ? minSalary : 0;
    const mid = typeof midSalary === "number" ? midSalary : min;
    const max = typeof maxSalary === "number" ? maxSalary : mid;

    if (max < min) {
      alert("Mức lương tối đa không thể nhỏ hơn mức lương tối thiểu!");
      return;
    }

    onSubmit({
      title: title.trim(),
      code: code.trim().toUpperCase(),
      department,
      level,
      minSalary: min,
      midSalary: mid,
      maxSalary: max,
      status,
    });

    // Reset form
    setTitle("");
    setCode("");
    setMinSalary(35);
    setMidSalary(42.5);
    setMaxSalary(50);
    setStatus("active");
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* 1. Cấu trúc Modal (Modal Wrapper): bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 transform transition-all */}
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 transform transition-all max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Tiêu đề "Thêm Chức Danh Mới" và nút X (Close) ở góc phải */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Thêm Chức Danh Mới</h3>
              <p className="text-xs text-slate-500 font-medium">Thiết lập chức danh, khung cấp bậc và dải lương chuẩn (Salary Bands)</p>
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
            {/* Tên chức danh (*) */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                Tên Chức Danh <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Senior Backend Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Mã chức danh / Cấp bậc (*) */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                Mã Chức Danh / Cấp Bậc <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: SWE-SR"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Phòng ban hạn định */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                Phòng Ban Hạn Định
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              >
                {DEPARTMENT_OPTIONS.map((dept, idx) => (
                  <option key={idx} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Khung cấp bậc (Level) */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                Khung Cấp Bậc (Level)
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              >
                {LEVEL_OPTIONS.map((lvl, idx) => (
                  <option key={idx} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Khối Thiết lập Dải Lương Chuẩn (Salary Band): col-span-1 md:col-span-2 */}
            <div className="col-span-1 md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Khung dải lương (Đơn vị: Triệu VNĐ)</span>
                </h4>
                <span className="text-[11px] text-slate-400">
                  Dùng để khóa chặn và cảnh báo Offer tuyển dụng
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Tối thiểu (Min) */}
                <div>
                  <label className="block font-bold text-slate-600 mb-1 text-[11px]">
                    Tối Thiểu (Min)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      required
                      placeholder="Ví dụ: 35"
                      value={minSalary}
                      onChange={(e) => handleMinChange(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <span className="text-[10px] text-slate-400 absolute right-3 top-1/2 -translate-y-1/2">
                      TR
                    </span>
                  </div>
                </div>

                {/* Trung vị (Mid) */}
                <div>
                  <label className="block font-bold text-slate-600 mb-1 text-[11px]">
                    Trung Vị (Mid)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      required
                      placeholder="Ví dụ: 42.5"
                      value={midSalary}
                      onChange={(e) => setMidSalary(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <span className="text-[10px] text-slate-400 absolute right-3 top-1/2 -translate-y-1/2">
                      TR
                    </span>
                  </div>
                </div>

                {/* Tối đa (Max) */}
                <div>
                  <label className="block font-bold text-slate-600 mb-1 text-[11px]">
                    Tối Đa (Max)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      required
                      placeholder="Ví dụ: 50"
                      value={maxSalary}
                      onChange={(e) => handleMaxChange(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <span className="text-[10px] text-slate-400 absolute right-3 top-1/2 -translate-y-1/2">
                      TR
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Trạng thái (Status) & 5. Footer Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-5 border-t border-slate-200">
            {/* Trạng thái ở góc dưới bên trái form */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700">Trạng thái:</span>
              <button
                type="button"
                onClick={() => setStatus(status === "active" ? "inactive" : "active")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  status === "active" ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    status === "active" ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className={`text-xs font-semibold ${status === "active" ? "text-emerald-700" : "text-slate-500"}`}>
                {status === "active" ? "Đang hoạt động" : "Khóa"}
              </span>
            </div>

            {/* Dải nút bấm bên phải */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-full font-medium transition-colors cursor-pointer text-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium shadow-sm transition-colors cursor-pointer text-xs active:scale-95"
              >
                Lưu Chức Danh
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
