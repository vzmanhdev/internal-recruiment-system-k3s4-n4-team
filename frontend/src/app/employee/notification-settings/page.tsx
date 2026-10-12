"use client";

import React, { useState } from "react";
import { EmployeeAppShell } from "@/components/layout/EmployeeAppShell";
import { Settings, Bell, Mail, Smartphone, Save, CheckCircle2 } from "lucide-react";

export default function EmployeeNotificationSettingsPage() {
  const [settings, setSettings] = useState({
    emailNewJobs: true,
    emailInterviewReminders: true,
    emailReferralStatus: true,
    appNewJobs: true,
    appInterviewReminders: true,
    appReferralStatus: true,
  });

  const [toast, setToast] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setToast("Cấu hình thông báo đã được lưu!");
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <EmployeeAppShell activeTab="notification-settings">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2 shadow-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast}</span>
        </div>
      )}

      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-[#4285F4]" />
            Cài Đặt Thông Báo Nhân Viên
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Tùy chỉnh các kênh nhận thông báo qua Email và Ứng dụng nội bộ.
          </p>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-6 text-xs">
          {/* Email Notifications */}
          <div className="space-y-4 pb-6 border-b border-gray-100">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#4285F4]" />
              Thông Báo Qua Email
            </h3>

            <div className="space-y-3 font-medium">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/70 cursor-pointer">
                <div>
                  <div className="font-bold text-slate-900">Tin tuyển dụng mới phù hợp</div>
                  <div className="text-[11px] text-slate-400">Nhận email khi có cơ hội việc làm mới thuộc phòng ban phù hợp.</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailNewJobs}
                  onChange={(e) => setSettings({ ...settings, emailNewJobs: e.target.checked })}
                  className="w-4 h-4 accent-[#4285F4]"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/70 cursor-pointer">
                <div>
                  <div className="font-bold text-slate-900">Nhắc lịch phỏng vấn</div>
                  <div className="text-[11px] text-slate-400">Nhận email nhắc trước 24 giờ khi có buổi phỏng vấn được gán.</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailInterviewReminders}
                  onChange={(e) => setSettings({ ...settings, emailInterviewReminders: e.target.checked })}
                  className="w-4 h-4 accent-[#4285F4]"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/70 cursor-pointer">
                <div>
                  <div className="font-bold text-slate-900">Trạng thái ứng viên giới thiệu</div>
                  <div className="text-[11px] text-slate-400">Nhận email khi ứng viên bạn giới thiệu chuyển vòng hoặc nhận việc.</div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailReferralStatus}
                  onChange={(e) => setSettings({ ...settings, emailReferralStatus: e.target.checked })}
                  className="w-4 h-4 accent-[#4285F4]"
                />
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#4285F4] text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Lưu cấu hình thông báo</span>
            </button>
          </div>
        </form>
      </div>
    </EmployeeAppShell>
  );
}
