"use client";

import { useState } from "react";
import {
  Settings,
  Bell,
  Lock,
  Mail,
  Save,
  CheckCircle2,
  Shield,
  Sliders,
} from "lucide-react";
import { AdminShell } from "./AdminShell";

export function SystemSettings() {
  const [saved, setSaved] = useState(false);
  const [companyName, setCompanyName] = useState("Internal Recruitment System");
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [requireApproval, setRequireApproval] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("60");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Cấu hình Hệ thống</h1>
            <p className="mt-1 text-sm text-slate-500">
              Cài đặt các thông số chung, chính sách bảo mật và luồng phê duyệt hệ thống.
            </p>
          </div>
          <button
            onClick={handleSave}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-hover hover:bg-blue-700"
          >
            {saved ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-300" /> Đã lưu cài đặt!
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Lưu cấu hình
              </>
            )}
          </button>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* General Settings */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <Sliders className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Thông tin Chung</h2>
                <p className="text-xs text-slate-500">Tên hệ thống và tùy chọn hiển thị</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên Hệ thống / Doanh nghiệp
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Thời gian hết hạn phiên làm việc (phút)
                </label>
                <select
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="30">30 phút</option>
                  <option value="60">60 phút (Default)</option>
                  <option value="120">120 phút (2 giờ)</option>
                  <option value="480">8 giờ (1 ca làm việc)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Registration & Approval Flow */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Đăng ký & Phê duyệt</h2>
                <p className="text-xs text-slate-500">Chính sách tài khoản và phê duyệt đa cấp</p>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Cho phép Đăng ký Tài khoản mới</p>
                  <p className="text-xs text-slate-500">Cho phép người dùng tự đăng ký trên trang Register</p>
                </div>
                <input
                  type="checkbox"
                  checked={allowRegistration}
                  onChange={(e) => setAllowRegistration(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Yêu cầu Phê duyệt Đăng ký</p>
                  <p className="text-xs text-slate-500">Tài khoản mới phải được Admin phê duyệt trước khi đăng nhập</p>
                </div>
                <input
                  type="checkbox"
                  checked={requireApproval}
                  onChange={(e) => setRequireApproval(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Email & Notifications */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 lg:col-span-2">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">Thông báo & Email</h2>
                <p className="text-xs text-slate-500">Cấu hình gửi email tự động khi có sự kiện tuyển dụng</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Gửi Email tự động cho Ứng viên & HR</p>
                <p className="text-xs text-slate-500">Thông báo trạng thái ứng tuyển, lịch phỏng vấn và kết quả</p>
              </div>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
