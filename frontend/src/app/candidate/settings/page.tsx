'use client';

import React, { useState } from 'react';
import {
  Bell,
  Mail,
  Smartphone,
  ShieldCheck,
  Save,
  CheckCircle2,
  Calendar,
  Sparkles,
  Clock,
  Check,
  HelpCircle,
  Sliders,
  Radio,
  Lock,
} from 'lucide-react';

export default function CandidateSettingsPage() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [calendarSync, setCalendarSync] = useState(true);
  const [jobRecommendations, setJobRecommendations] = useState(false);
  const [workHoursOnly, setWorkHoursOnly] = useState(true);
  const [weekendQuiet, setWeekendQuiet] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3500);
    }, 450);
  };

  return (
    <div className="w-full space-y-8 pb-12">
      {/* 1. Khối Banner Trực Quan (Top Hero Banner trải ngang toàn bộ chiều rộng) */}
      <div className="w-full rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 shadow-md">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-16 w-56 h-56 bg-blue-400/20 rounded-full blur-xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff18_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold text-blue-100 border border-white/10">
              <Bell className="w-3.5 h-3.5 text-yellow-300" />
              <span>CÀI ĐẶT HỆ THỐNG • THÔNG BÁO & BẢO MẬT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Cấu Hình Kênh Nhận Thông Báo
            </h1>
            <p className="text-blue-100 text-sm leading-relaxed">
              Quản lý các kênh nhận tin về lịch phỏng vấn, kết quả thẩm định CV, thư mời nhận việc và cơ hội nghề nghiệp.
            </p>
          </div>

          {isSaved && (
            <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500/90 backdrop-blur-md text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg animate-in fade-in shrink-0 border border-emerald-400/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>Đã lưu cài đặt thông báo!</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Form Nội Dung 2 Cột Mở Rộng Toàn Chiều Rộng */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
          {/* Cột Trái (Danh sách Tùy chọn Kênh - lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Card 1: Kênh Tiếp Nhận Chính */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-600" />
                    Kênh Nhận Thông Báo Tiến Độ
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Chọn các phương thức bạn muốn hệ thống gửi cập nhật về tiến trình tuyển dụng
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* 1. Email */}
                <label className="flex items-start gap-4 p-4 rounded-xl border border-slate-200/80 hover:bg-slate-50/80 transition-all cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800 group-hover:text-blue-700 transition-colors">
                        Thông báo qua Email chính
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                        Khuyến nghị
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Nhận thông báo tự động khi nộp hồ sơ, kết quả xét duyệt CV, thư mời phỏng vấn và Job Offer Letter.
                    </p>
                  </div>
                </label>

                {/* 2. SMS / Zalo */}
                <label className="flex items-start gap-4 p-4 rounded-xl border border-slate-200/80 hover:bg-slate-50/80 transition-all cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={smsAlerts}
                    onChange={(e) => setSmsAlerts(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800 group-hover:text-blue-700 transition-colors">
                        Tin nhắn SMS / Zalo nhắc lịch khẩn
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">
                        Nhắc hẹn
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Nhận tin nhắn SMS ngắn gọn nhắc hẹn trước buổi phỏng vấn 02 giờ kèm đường dẫn tham gia phòng họp Google Meet.
                    </p>
                  </div>
                </label>

                {/* 3. Calendar Sync */}
                <label className="flex items-start gap-4 p-4 rounded-xl border border-slate-200/80 hover:bg-slate-50/80 transition-all cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={calendarSync}
                    onChange={(e) => setCalendarSync(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800 group-hover:text-blue-700 transition-colors">
                        Đồng bộ lịch tự động (Google Calendar / Apple iCal)
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Tự động đính kèm tệp sự kiện `.ics` trong thư mời để bạn bấm thêm vào lịch trên điện thoại hoặc máy tính cá nhân.
                    </p>
                  </div>
                </label>

                {/* 4. Job Recommendations */}
                <label className="flex items-start gap-4 p-4 rounded-xl border border-slate-200/80 hover:bg-slate-50/80 transition-all cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={jobRecommendations}
                    onChange={(e) => setJobRecommendations(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800 group-hover:text-blue-700 transition-colors">
                        Đề xuất cơ hội việc làm mới phù hợp
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Hệ thống tự động phân tích kỹ năng và số năm kinh nghiệm của bạn để gửi thông báo khi có vị trí tương tự đang mở tuyển.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Card 2: Khung Giờ & Tần Suất Nhận Tin */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Khung Giờ & Tần Suất Nhận Thông Báo
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tối ưu trải nghiệm nhận tin, tránh làm phiền ngoài giờ làm việc
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-100/60 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={workHoursOnly}
                    onChange={(e) => setWorkHoursOnly(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                      Ưu tiên giờ hành chính (08:00 - 18:00)
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Trì hoãn các thông báo không khẩn cấp sang ngày làm việc tiếp theo.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-100/60 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={weekendQuiet}
                    onChange={(e) => setWeekendQuiet(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                      Chế độ nghỉ ngơi cuối tuần (T7, CN)
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Không gửi tin nhắn SMS ngoài giờ, chỉ cập nhật kết quả trên cổng trực tuyến.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Nút Submit */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer active:scale-98 disabled:opacity-70"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Đang lưu cài đặt...' : 'Lưu Cài Đặt Thông Báo'}</span>
              </button>
            </div>
          </div>

          {/* Cột Phải (Thông tin bổ trợ & Quyền riêng tư - lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Card 1: Thông Tin Thiết Bị / Kênh Hiện Tại */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
                <Smartphone className="w-4 h-4 text-blue-600" />
                Kênh Tiếp Nhận Đang Kết Nối
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 block font-semibold">Email chính thức:</span>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">nguyen.van.a@gmail.com</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Đã xác thực
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 block font-semibold">Số điện thoại SMS:</span>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">0912 345 678</span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      Sẵn sàng
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Cam Kết Quyền Riêng Tư */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3 text-xs">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Cam Kết Quyền Riêng Tư
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Chúng tôi cam kết chỉ gửi các thông báo liên quan trực tiếp đến hồ sơ ứng tuyển của bạn tại công ty.
              </p>
              <div className="space-y-2 text-slate-700 pt-1">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Không gửi tin nhắn spam thương mại.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Mã hóa thông tin liên lạc 100%.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Dễ dàng bật/tắt mọi lúc trên hệ thống.</span>
                </div>
              </div>
            </div>

            {/* Card 3: Trợ Giúp */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/80 space-y-2 text-xs">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                Không Nhận Được Email?
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Vui lòng kiểm tra kỹ hòm thư <strong>Spam / Hộp thư rác</strong> hoặc thêm địa chỉ <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-blue-700">no-reply@congty.com</code> vào danh bạ an toàn.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
