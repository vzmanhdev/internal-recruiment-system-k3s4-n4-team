'use client';

import React, { useState } from 'react';
import { Bell, Check, Mail, Smartphone, Calendar, AlertTriangle } from 'lucide-react';

export default function InterviewerSettingsPage() {
  const [settings, setSettings] = useState({
    emailInterviewInvite: true,
    emailScorecardReminder: true,
    smsReminder: false,
    calendarSync: true,
    urgentNotice: true,
  });
  const [saved, setSaved] = useState(false);

  const toggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Cấu Hình Thông Báo & Cảnh Báo</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Tùy chỉnh thông báo nhắc nhở lịch phỏng vấn và hạn chót nộp phiếu đánh giá năng lực ứng viên
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6 max-w-4xl">
        {saved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Đã lưu cài đặt thông báo thành công!</span>
          </div>
        )}

        <div className="divide-y divide-slate-100 space-y-4 text-xs">
          <div className="pt-2 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-800 block text-sm">Email mời phỏng vấn mới</span>
              <p className="text-slate-500">Nhận email ngay khi HR gán bạn vào hội đồng phỏng vấn một ứng viên</p>
            </div>
            <input
              type="checkbox"
              checked={settings.emailInterviewInvite}
              onChange={() => toggle('emailInterviewInvite')}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
          </div>

          <div className="pt-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-800 block text-sm">Nhắc nhở nộp phiếu đánh giá</span>
              <p className="text-slate-500">Thông báo tự động sau buổi phỏng vấn nếu phiếu chấm điểm chưa được nộp</p>
            </div>
            <input
              type="checkbox"
              checked={settings.emailScorecardReminder}
              onChange={() => toggle('emailScorecardReminder')}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
          </div>

          <div className="pt-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-800 block text-sm">Đồng bộ lịch cá nhân (Google/Outlook Calendar)</span>
              <p className="text-slate-500">Tự động thêm sự kiện phỏng vấn vào lịch cá nhân với link phòng họp online</p>
            </div>
            <input
              type="checkbox"
              checked={settings.calendarSync}
              onChange={() => toggle('calendarSync')}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
          </div>

          <div className="pt-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-800 block text-sm">Thông báo SMS khẩn cấp</span>
              <p className="text-slate-500">Gửi tin nhắn khi buổi phỏng vấn thay đổi giờ đột xuất trong vòng 2 giờ</p>
            </div>
            <input
              type="checkbox"
              checked={settings.smsReminder}
              onChange={() => toggle('smsReminder')}
              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-500/20 active:scale-95"
          >
            Lưu Cấu Hình
          </button>
        </div>
      </div>
    </div>
  );
}
