"use client";

import React from "react";
import { Award, X, Sparkles } from "lucide-react";

export interface CriterionFormData {
  name: string;
  category: "Chuyên môn" | "Kỹ năng mềm" | "Văn hóa & Thái độ";
  weight: number;
  description: string;
  benchmark1: string;
  benchmark3: string;
  benchmark5: string;
}

interface CompetencyCriterionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  mode: "create" | "edit";
  positionTitle: string;
  formData: CriterionFormData;
  setFormData: React.Dispatch<React.SetStateAction<CriterionFormData>>;
  standardTemplates: Array<{
    name: string;
    category: "Chuyên môn" | "Kỹ năng mềm" | "Văn hóa & Thái độ";
    weight: number;
    description: string;
  }>;
}

export const CompetencyCriterionModal: React.FC<CompetencyCriterionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  positionTitle,
  formData,
  setFormData,
  standardTemplates,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-900/50 backdrop-blur-xs transition-all"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
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
                {mode === "create"
                  ? `Thêm Tiêu Chí Năng Lực cho: ${positionTitle}`
                  : "Chỉnh Sửa Tiêu Chí Năng Lực"}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Cấu hình trọng số và chuẩn mực hành vi (Rubric chuẩn ATS)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body với padding rộng rãi p-6 md:p-8 lg:p-10 */}
        <form onSubmit={onSubmit} className="p-6 md:p-8 lg:p-10 space-y-6 text-xs">
          {/* Chọn nhanh từ template từ điển: Dàn trải toàn bộ chiều rộng lớn */}
          {mode === "create" && (
            <div className="p-4 md:p-5 bg-blue-50/60 rounded-xl border border-blue-100 space-y-3">
              <span className="text-xs font-extrabold text-blue-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Hoặc chọn nhanh từ Từ điển năng lực chuẩn doanh nghiệp:
              </span>
              <div className="flex flex-wrap gap-2.5">
                {standardTemplates.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setFormData({
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
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium transition-all"
              />
            </div>

            {/* Nhóm năng lực (3 cột) */}
            <div className="lg:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                Nhóm năng lực
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as CriterionFormData["category"],
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
                value={formData.weight}
                onChange={(e) =>
                  setFormData({
                    ...formData,
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
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
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
                  value={formData.benchmark1}
                  onChange={(e) =>
                    setFormData({ ...formData, benchmark1: e.target.value })
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
                  value={formData.benchmark3}
                  onChange={(e) =>
                    setFormData({ ...formData, benchmark3: e.target.value })
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
                  value={formData.benchmark5}
                  onChange={(e) =>
                    setFormData({ ...formData, benchmark5: e.target.value })
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
              onClick={onClose}
              className="px-6 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-7 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
            >
              {mode === "create" ? "Xác nhận thêm tiêu chí" : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
