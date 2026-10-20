"use client";

import React, { useState, useEffect } from "react";
import { UserPlus, UserCheck, X, AlertCircle } from "lucide-react";
import { UserItem, ROLE_DEFINITIONS } from "./types";

interface UserFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  user?: UserItem | null;
  onClose: () => void;
  onSave: (formData: Partial<UserItem>) => void;
}

export function UserFormModal({
  isOpen,
  mode,
  user,
  onClose,
  onSave,
}: UserFormModalProps) {
  const isCreate = mode === "create";

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    employee_code: "",
    department: "Khối Công nghệ & Kỹ thuật",
    password: "",
    roles: ["candidate"] as string[],
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user && !isCreate) {
      setFormData({
        full_name: user.full_name,
        email: user.email,
        phone: user.phone || "",
        employee_code: user.employee_code,
        department: user.department || "Khối Công nghệ & Kỹ thuật",
        password: "",
        roles: user.roles && user.roles.length > 0 ? user.roles : ["candidate"],
      });
    } else {
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        employee_code: `NV-${Math.floor(200 + Math.random() * 800)}`,
        department: "Khối Công nghệ & Kỹ thuật",
        password: "",
        roles: ["candidate"],
      });
    }
    setErrorMsg(null);
  }, [user, isCreate, isOpen]);

  if (!isOpen) return null;

  const toggleRole = (code: string) => {
    if (formData.roles.includes(code)) {
      if (formData.roles.length > 1) {
        setFormData({ ...formData, roles: formData.roles.filter((r) => r !== code) });
      }
    } else {
      setFormData({ ...formData, roles: [...formData.roles, code] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.email.trim()) {
      setErrorMsg("Vui lòng nhập đầy đủ họ tên và email.");
      return;
    }
    if (!formData.email.includes("@")) {
      setErrorMsg("Email không đúng định dạng (Ví dụ: name@company.com).");
      return;
    }
    if (isCreate && !formData.password) {
      setErrorMsg("Vui lòng thiết lập mật khẩu ban đầu.");
      return;
    }

    onSave({
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone,
      employee_code: formData.employee_code,
      department: formData.department,
      roles: formData.roles,
      role: formData.roles[0],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Khung Modal nền trắng: Đã nới rộng ra w-full max-w-2xl (hoặc max-w-3xl) kèm mx-auto */}
      <div className="bg-white rounded-3xl w-full max-w-2xl sm:max-w-3xl mx-auto shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header với padding rộng rãi p-6 hoặc sm:px-8 */}
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/80 shadow-xs shrink-0">
              {isCreate ? <UserPlus className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                {isCreate ? "Thêm Tài Khoản Người Dùng Mới" : "Chỉnh Sửa Thông Tin Tài Khoản"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                {isCreate
                  ? "Khởi tạo tài khoản nhân sự và thiết lập phân quyền ban đầu"
                  : `Cập nhật thông tin cho ${user?.full_name}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body với padding rộng rãi p-6 sm:p-8 */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Hàng 1: Họ và tên & Mã nhân viên (grid grid-cols-2 gap-6) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Họ và tên <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Nguyễn Văn An"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mã nhân viên <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: NV-001"
                value={formData.employee_code}
                onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm font-mono font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          {/* Hàng 2: Email công việc & Số điện thoại (grid grid-cols-2 gap-6) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email công việc <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="Ví dụ: an.nguyen@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Số điện thoại
              </label>
              <input
                type="tel"
                placeholder="Ví dụ: 0912 345 678"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          {/* Hàng 3: Phòng ban & Mật khẩu ban đầu (grid grid-cols-2 gap-6) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Phòng ban / Khối chức năng
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-600 transition-all"
              >
                <option value="Khối Công nghệ & Kỹ thuật">Khối Công nghệ & Kỹ thuật</option>
                <option value="Phòng Quản trị Nhân sự (HR)">Phòng Quản trị Nhân sự (HR)</option>
                <option value="Phòng Tuyển dụng & Đào tạo">Phòng Tuyển dụng & Đào tạo</option>
                <option value="Khối Kinh doanh & Phát triển">Khối Kinh doanh & Phát triển</option>
                <option value="Phòng Tài chính - Kế toán">Phòng Tài chính - Kế toán</option>
                <option value="Khối Vận hành & Hệ thống">Khối Vận hành & Hệ thống</option>
                <option value="Ban Giám đốc & Điều hành">Ban Giám đốc & Điều hành</option>
              </select>
            </div>

            {isCreate ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mật khẩu ban đầu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Thiết lập mật khẩu tạm thời"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">
                  Trạng thái mật khẩu
                </label>
                <div className="px-4 py-2.5 bg-slate-100 rounded-xl text-xs font-semibold text-slate-500 border border-slate-200/60">
                  •••••••• (Bảo mật - Người dùng đổi khi đăng nhập)
                </div>
              </div>
            )}
          </div>

          {/* Phần Vai trò phân quyền ban đầu: grid grid-cols-2 gap-4 */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Vai trò phân quyền ban đầu (Chọn nhiều vai trò):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
              {ROLE_DEFINITIONS.map((r) => {
                const checked = formData.roles.includes(r.code);
                return (
                  <label
                    key={r.code}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      checked
                        ? "bg-blue-50/70 border-blue-200 text-blue-900 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRole(r.code)}
                      className="rounded text-blue-600 focus:ring-0 mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs">{r.name}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${r.badgeClass}`}
                        >
                          {r.shortName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-normal mt-0.5 line-clamp-1">
                        {r.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all active:scale-95 cursor-pointer"
            >
              {isCreate ? "Tạo tài khoản" : "Cập nhật tài khoản"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
