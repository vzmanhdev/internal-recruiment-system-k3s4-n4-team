'use client';

import React, { useState } from 'react';
import {
  Bell,
  Mail,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Users,
  FileText,
  Clock,
  Sparkles,
  Save,
  Check,
} from 'lucide-react';
import clsx from 'clsx';

export default function ManagerNotificationsPage() {
  const [toast, setToast] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Notification Preferences State
  const [settings, setSettings] = useState({
    // Ứng viên & Hồ sơ
    newApplicant: true,
    testCompleted: true,
    scorecardReminder: true,
    candidateWithdrew: false,

    // Lịch phỏng vấn
    interviewScheduled: true,
    interviewReminder2h: true,
    rescheduleRequest: true,

    // Phê duyệt & SLA
    requisitionApproved: true,
    salaryOfferFeedback: true,
    slaOverdueWarning: true,

    // Kênh nhận
    channelEmail: true,
    channelInApp: true,
    weeklyDigest: false,
  });

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast('Đã lưu cấu hình thông báo tuyển dụng thành công!');
    }, 600);
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-blue-600" />
            <span>Cấu Hình Thông Báo</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Tùy chỉnh tần suất và các sự kiện tuyển dụng bạn muốn nhận cảnh báo trong vai trò Trưởng bộ phận.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium bg-white px-3.5 py-1.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span>Trang chủ</span>
          <span>&rsaquo;</span>
          <span className="text-slate-700 font-bold">Cấu hình thông báo</span>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* CỘT 1 & 2: CÁC NHÓM SỰ KIỆN THÔNG BÁO */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Nhóm 1: Ứng viên & Đánh giá hồ sơ */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                <Users className="w-4 h-4 text-blue-600" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Ứng viên & Đánh giá năng lực</h3>
                  <p className="text-[11px] text-slate-400">Thông báo về luồng ứng viên nộp vào các vị trí trực thuộc phòng ban</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/70 cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                  <div>
                    <span className="font-bold text-slate-900 block">Ứng viên mới nộp hồ sơ</span>
                    <span className="text-slate-400 text-[11px]">Nhận thông báo ngay khi có CV mới ứng tuyển vào vị trí của phòng bạn</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.newApplicant}
                    onChange={() => toggleSetting('newApplicant')}
                    className="w-4 h-4 text-blue-600 rounded-md focus:ring-0 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/70 cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                  <div>
                    <span className="font-bold text-slate-900 block">Ứng viên hoàn thành bài kiểm tra chuyên môn</span>
                    <span className="text-slate-400 text-[11px]">Thông báo kèm link chấm bài khi ứng viên nộp test kĩ thuật</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.testCompleted}
                    onChange={() => toggleSetting('testCompleted')}
                    className="w-4 h-4 text-blue-600 rounded-md focus:ring-0 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/70 cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                  <div>
                    <span className="font-bold text-slate-900 block">Nhắc nhở điền phiếu chấm Scorecard</span>
                    <span className="text-slate-400 text-[11px]">Cảnh báo sau phỏng vấn 4 giờ nếu Trưởng bộ phận chưa chấm điểm</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.scorecardReminder}
                    onChange={() => toggleSetting('scorecardReminder')}
                    className="w-4 h-4 text-blue-600 rounded-md focus:ring-0 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Nhóm 2: Lịch phỏng vấn */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Lịch phỏng vấn & Gặp mặt</h3>
                  <p className="text-[11px] text-slate-400">Điều phối lịch họp kỹ thuật và các phiên phỏng vấn chuyên sâu</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/70 cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                  <div>
                    <span className="font-bold text-slate-900 block">Lịch phỏng vấn mới được HR sắp xếp</span>
                    <span className="text-slate-400 text-[11px]">Tự động thêm vào lịch công tác và gửi email xác nhận</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.interviewScheduled}
                    onChange={() => toggleSetting('interviewScheduled')}
                    className="w-4 h-4 text-blue-600 rounded-md focus:ring-0 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/70 cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                  <div>
                    <span className="font-bold text-slate-900 block">Nhắc hẹn trước 2 giờ</span>
                    <span className="text-slate-400 text-[11px]">Thông báo trên app và gửi tin nhắn nhắc nhở trước giờ phỏng vấn</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.interviewReminder2h}
                    onChange={() => toggleSetting('interviewReminder2h')}
                    className="w-4 h-4 text-blue-600 rounded-md focus:ring-0 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/70 cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                  <div>
                    <span className="font-bold text-slate-900 block">Ứng viên yêu cầu đổi giờ phỏng vấn</span>
                    <span className="text-slate-400 text-[11px]">Thông báo ngay khi ứng viên phản hồi cần sắp xếp lại lịch</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.rescheduleRequest}
                    onChange={() => toggleSetting('rescheduleRequest')}
                    className="w-4 h-4 text-blue-600 rounded-md focus:ring-0 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Nhóm 3: Chuỗi phê duyệt & Giám sát SLA */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                <FileText className="w-4 h-4 text-amber-600" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Phê duyệt & Giám sát SLA</h3>
                  <p className="text-[11px] text-slate-400">Tiến độ phê duyệt yêu cầu tuyển dụng và đề xuất mức offer</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/70 cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                  <div>
                    <span className="font-bold text-slate-900 block">Yêu cầu tuyển dụng (Requisition) được duyệt</span>
                    <span className="text-slate-400 text-[11px]">Thông báo khi HR Lead hoặc Ban Giám Đốc phê duyệt phiếu tuyển dụng</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.requisitionApproved}
                    onChange={() => toggleSetting('requisitionApproved')}
                    className="w-4 h-4 text-blue-600 rounded-md focus:ring-0 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/70 cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                  <div>
                    <span className="font-bold text-slate-900 block">Cảnh báo vi phạm SLA tuyển dụng</span>
                    <span className="text-slate-400 text-[11px]">Cảnh báo đỏ khi hồ sơ nằm ở một vòng quá thời hạn quy định (48h)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.slaOverdueWarning}
                    onChange={() => toggleSetting('slaOverdueWarning')}
                    className="w-4 h-4 text-blue-600 rounded-md focus:ring-0 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* CỘT 3: KÊNH GỬI & TÓM TẮT THIẾT LẬP */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Kênh nhận thông báo */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 space-y-4">
              <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>Kênh nhận thông báo</span>
              </h3>

              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/70 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <div>
                      <span className="font-bold text-slate-800 block">Email nội bộ</span>
                      <span className="text-[10px] text-slate-400">manager@company.com</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.channelEmail}
                    onChange={() => toggleSetting('channelEmail')}
                    className="w-4 h-4 text-blue-600 rounded-md focus:ring-0 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/70 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-4 h-4 text-slate-500" />
                    <div>
                      <span className="font-bold text-slate-800 block">Thông báo App & Web</span>
                      <span className="text-[10px] text-slate-400">Chuông thông báo góc trên</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.channelInApp}
                    onChange={() => toggleSetting('channelInApp')}
                    className="w-4 h-4 text-blue-600 rounded-md focus:ring-0 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/70 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-slate-500" />
                    <div>
                      <span className="font-bold text-slate-800 block">Báo cáo tuần tổng hợp</span>
                      <span className="text-[10px] text-slate-400">Gửi lúc 8:00 sáng Thứ Hai</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.weeklyDigest}
                    onChange={() => toggleSetting('weeklyDigest')}
                    className="w-4 h-4 text-blue-600 rounded-md focus:ring-0 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Thông tin hỗ trợ */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs space-y-2">
              <div className="flex items-center gap-2 text-blue-900 font-extrabold">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Quy chuẩn bảo mật thông báo</span>
              </div>
              <p className="text-[11px] text-blue-800/80 leading-relaxed font-medium">
                Tất cả thông báo lương và dữ liệu ứng viên nhạy cảm đều được mã hóa và chỉ gửi tới hộp thư chính thức được gán quyền Hiring Manager.
              </p>
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 px-6 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Đang lưu cấu hình...' : 'Lưu Cấu Hình Thông Báo'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
