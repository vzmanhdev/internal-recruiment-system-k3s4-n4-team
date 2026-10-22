'use client';

import React, { useState } from 'react';
import { X, Layers, Sparkles } from 'lucide-react';

export interface NewLookupCategoryData {
  name: string;
  code: string;
  description: string;
  initialItem?: string;
  status: 'active' | 'inactive';
}

interface CreateLookupCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewLookupCategoryData) => void;
}

export const CreateLookupCategoryModal: React.FC<CreateLookupCategoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [initialItem, setInitialItem] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [errors, setErrors] = useState<{ name?: string; code?: string }>({});

  if (!isOpen) return null;

  // Tự động chuyển ký tự thành in hoa, loại bỏ dấu tiếng Việt và ký tự đặc biệt
  const handleCodeChange = (val: string) => {
    const formatted = val
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z0-9_]/g, '_');
    setCode(formatted);
    if (errors.code) setErrors((prev) => ({ ...prev, code: undefined }));
  };

  // Gợi ý mã code tự động từ tên nếu mã chưa nhập
  const handleNameChange = (val: string) => {
    setName(val);
    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
  };

  const handleSuggestCode = () => {
    if (!name) return;
    const generated = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim()
      .replace(/[^A-Z0-9]+/g, '_');
    setCode(generated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; code?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Vui lòng nhập tên danh mục';
    }
    if (!code.trim()) {
      newErrors.code = 'Vui lòng nhập mã danh mục (System Key)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      name: name.trim(),
      code: code.trim(),
      description: description.trim(),
      initialItem: initialItem.trim(),
      status,
    });

    // Reset form
    setName('');
    setCode('');
    setDescription('');
    setInitialItem('');
    setStatus('active');
    setErrors({});
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-all animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Khối form chính */}
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 transform transition-all relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Thêm Danh Mục Hệ Thống Mới</h2>
              <p className="text-xs text-slate-500">Khởi tạo từ điển phân loại dùng chung toàn công ty</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-5 text-xs">
          {/* Tên Danh Mục */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">
              Tên Danh Mục <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ví dụ: Nguồn Tuyển Dụng, Kỹ Năng, Lý Do Từ Chối"
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                errors.name
                  ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500'
                  : 'border-slate-200 focus:ring-blue-100 focus:border-blue-500'
              }`}
            />
            {errors.name && <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.name}</p>}
          </div>

          {/* Mã Danh Mục (System Key) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-slate-700 font-semibold">
                Mã Danh Mục (System Key) <span className="text-rose-500">*</span>
              </label>
              {name && !code && (
                <button
                  type="button"
                  onClick={handleSuggestCode}
                  className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  Gợi ý từ tên
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="Ví dụ: SOURCES, SKILLS, REJECT_REASONS"
                className={`w-full font-mono uppercase px-3.5 py-2.5 rounded-xl border bg-slate-50 text-slate-900 font-semibold placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                  errors.code
                    ? 'border-rose-400 focus:ring-rose-200 focus:border-rose-500'
                    : 'border-slate-200 focus:ring-blue-100 focus:border-blue-500'
                }`}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Định dạng chữ in hoa, không dấu, dùng làm key API & query cơ sở dữ liệu.
            </p>
            {errors.code && <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.code}</p>}
          </div>

          {/* Giá trị danh mục đầu tiên (Tùy chọn) */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">
              Giá trị danh mục đầu tiên (Khởi tạo ngay)
            </label>
            <input
              type="text"
              value={initialItem}
              onChange={(e) => setInitialItem(e.target.value)}
              placeholder="Ví dụ: Giá trị mặc định 1..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-medium placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Phần tử này sẽ được lưu trực tiếp vào cơ sở dữ liệu làm giá trị ban đầu cho nhóm.
            </p>
          </div>

          {/* Mô tả danh mục */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">
              Mô tả danh mục
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ví dụ: Các kênh thu hút hồ sơ ứng viên..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all resize-none font-normal"
            />
          </div>

          {/* Trạng thái */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <span className="block font-semibold text-slate-800">Trạng thái</span>
              <span className="text-[11px] text-slate-500">
                {status === 'active'
                  ? 'Kích hoạt để cho phép chọn trong toàn hệ thống'
                  : 'Tạm khóa, không hiển thị trên các biểu mẫu nhập'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStatus(status === 'active' ? 'inactive' : 'active')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  status === 'active' ? 'bg-blue-600' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={status === 'active'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    status === 'active' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span
                className={`text-xs font-semibold ${
                  status === 'active' ? 'text-blue-700' : 'text-slate-500'
                }`}
              >
                {status === 'active' ? 'Đang hoạt động' : 'Khóa'}
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-slate-600 hover:bg-slate-100 rounded-full font-medium transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-all shadow-md shadow-blue-500/20 cursor-pointer"
            >
              Tạo Danh Mục
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
