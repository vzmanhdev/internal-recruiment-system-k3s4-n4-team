'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Mail,
  Smartphone,
  CheckCircle2,
  Save,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function CandidateSettingsPage() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [interviewReminders, setInterviewReminders] = useState(true);
  const [offerNotifications, setOfferNotifications] = useState(true);
  const [newsletter, setNewsletter] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Breadcrumb & Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
          <Link href="/candidate/jobs" className="hover:text-blue-600 transition-colors">
            Candidate Workspace
          </Link>
          <span>&rsaquo;</span>
          <span className="text-slate-700 font-bold">Cá nhân</span>
          <span>&rsaquo;</span>
          <span className="text-slate-700 font-bold">Cấu hình thông báo</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Bell className="w-7 h-7 text-blue-600" />
          <span>Cấu Hình Thông Báo Tuyển Dụng</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Tùy chỉnh các kênh nhận thông báo về trạng thái hồ sơ, lịch phỏng vấn và thư mời làm việc.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500 text-white shadow-xl flex items-center gap-2.5 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-extrabold text-xs sm:text-sm">
            Đã lưu cấu hình thông báo thành công!
          </span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="space-y-4">
          <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider text-blue-600 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span>Kênh Thông Báo Qua Email & Ứng Dụng</span>
          </h3>

          <div className="divide-y divide-slate-100">
            {/* Mục 1: Trạng thái hồ sơ */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="font-extrabold text-xs sm:text-sm text-slate-800 block">
                  Cập nhật tiến trình hồ sơ (Review & Screening)
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Nhận email thông báo ngay khi HR cập nhật bước xét duyệt hồ sơ của bạn.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>

            {/* Mục 2: Lịch phỏng vấn */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="font-extrabold text-xs sm:text-sm text-slate-800 block">
                  Nhắc hẹn phỏng vấn & Thư mời Google Meet
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Gửi nhắc nhở tự động trước 24 giờ và 1 giờ trước ca phỏng vấn.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={interviewReminders}
                  onChange={(e) => setInterviewReminders(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>

            {/* Mục 3: Đề xuất Offer */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="font-extrabold text-xs sm:text-sm text-slate-800 block">
                  Thông báo Thư mời nhận việc (Offer Letter)
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Ưu tiên cao nhất: Nhận thông báo tức thì khi Ban Giám Đốc phát hành Offer.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={offerNotifications}
                  onChange={(e) => setOfferNotifications(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>

            {/* Mục 4: Bản tin việc làm mới */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="font-extrabold text-xs sm:text-sm text-slate-800 block">
                  Bản tin việc làm phù hợp hàng tuần
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Gợi ý các cơ hội nghề nghiệp tương tự với kỹ năng Golang / Python / Next.js.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={newsletter}
                  onChange={(e) => setNewsletter(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Thay Đổi Cấu Hình</span>
          </button>
        </div>
      </form>
    </div>
  );
}
