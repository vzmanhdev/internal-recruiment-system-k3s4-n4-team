"use client";

import React from "react";
import { Building2, X } from "lucide-react";

export interface DepartmentOption {
  id: string;
  name: string;
  code: string;
}

interface AddDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  name: string;
  setName: (val: string) => void;
  code: string;
  setCode: (val: string) => void;
  manager: string;
  setManager: (val: string) => void;
  parentId: string;
  setParentId: (val: string) => void;
  parentOptions: DepartmentOption[];
}

export const AddDepartmentModal: React.FC<AddDepartmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  name,
  setName,
  code,
  setCode,
  manager,
  setManager,
  parentId,
  setParentId,
  parentOptions,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 transition-all"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* 1. Nới rộng Modal Wrapper: w-full max-w-2xl kèm p-6 md:p-8 */}
      <div 
        className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-2xl p-6 md:p-8 transform transition-all max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Thêm Phòng Ban Mới</h3>
              <p className="text-xs text-slate-500 font-medium">Thiết lập cơ cấu tổ chức và phân cấp quản lý đơn vị</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer text-base"
          >
            ✕
          </button>
        </div>

        {/* 2. Chia lại bố cục các trường nhập liệu (Grid Layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Tên Phòng Ban: Chiếm 1 cột mặc định */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
              Tên Phòng Ban <span className="text-rose-500">*</span>
            </label>
            <input 
              type="text" 
              placeholder="Ví dụ: Phòng Quản Lý Chất Lượng QA/QC"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Mã Phòng Ban (Code): Chiếm 1 cột mặc định (ngang hàng với Tên) */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
              Mã Phòng Ban (Code) <span className="text-rose-500">*</span>
            </label>
            <input 
              type="text" 
              placeholder="Ví dụ: QAQC"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Trưởng Phòng Phụ Trách: Cho chiếm toàn bộ chiều ngang bằng class col-span-1 md:col-span-2 */}
          <div className="col-span-1 md:col-span-2">
            <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
              Trưởng Phòng Phụ Trách
            </label>
            <input 
              type="text" 
              placeholder="Ví dụ: Trần Thị Thu Hà (HR Manager) hoặc Tên nhân sự quản lý..."
              value={manager}
              onChange={(e) => setManager(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Phòng ban cha (Thuộc phòng ban nào - nếu có): Cho chiếm toàn bộ chiều ngang md:col-span-2 */}
          <div className="col-span-1 md:col-span-2">
            <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
              Phòng Ban Cha (Thuộc phòng ban nào - nếu có)
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="">-- Trực thuộc Công ty (Phòng ban gốc cấp 1) --</option>
              {parentOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">Để trống nếu đây là Khối hoặc Phòng ban cấp cao trực thuộc Ban Giám Đốc</p>
          </div>
        </div>

        {/* 3. Footer: Nút bấm căn phải */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button 
            type="button"
            onClick={onClose} 
            className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button 
            type="button"
            onClick={onSave} 
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer active:scale-95"
          >
            Lưu Phòng Ban
          </button>
        </div>
      </div>
    </div>
  );
};
