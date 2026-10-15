"use client";

import React, { useState } from "react";
import { AdminAppShell } from "@/components/layout/AdminAppShell";
import { Bell, CheckCircle2, Shield, Mail } from "lucide-react";

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState({
    securityAlerts: true,
    accountLocks: true,
    rbacChanges: true,
    emailDigest: false,
  });
  const [toast, setToast] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setToast("Cấu hình tùy chọn thông báo bảo mật thành công!");
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <AdminAppShell activeTab="notification-settings">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2 shadow-xl animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-[#4285F4]" />
            Cấu Hình Thông Báo Hệ Thống (S8-03, S8-04)
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Thiết lập nhận thông báo sự kiện an ninh, cảnh báo khóa tài khoản và thay đổi ma trận phân quyền.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-6">
          <form onSubmit={handleSave} className="space-y-4 text-xs font-medium">
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-100 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                <div>
                  <span className="font-bold text-slate-900 block">Cảnh báo bảo mật hệ thống</span>
                  <span className="text-slate-400 text-[11px]">Nhận thông báo khi có truy cập bất thường hoặc lỗi phân quyền RBAC</span>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.securityAlerts}
                  onChange={(e) => setPrefs({ ...prefs, securityAlerts: e.target.checked })}
                  className="rounded text-[#4285F4] focus:ring-0 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-100 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                <div>
                  <span className="font-bold text-slate-900 block">Thông báo khi khóa tài khoản</span>
                  <span className="text-slate-400 text-[11px]">Nhận thông báo khi có thao tác khóa tài khoản từ Quản trị viên</span>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.accountLocks}
                  onChange={(e) => setPrefs({ ...prefs, accountLocks: e.target.checked })}
                  className="rounded text-[#4285F4] focus:ring-0 w-4 h-4"
                />
              </label>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#4285F4] text-white hover:bg-blue-600 text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer"
              >
                Lưu Tùy Chọn Thông Báo
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminAppShell>
  );
}
