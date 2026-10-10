'use client';

import React, { useState } from 'react';
import {
  Settings,
  Bell,
  Mail,
  Shield,
  UserCheck,
  Calendar,
  CheckCircle2,
  Clock,
  Save,
  AlertTriangle,
} from 'lucide-react';
import clsx from 'clsx';

export default function ManagerSettingsPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Notification toggles
  const [notifyNewApplicant, setNotifyNewApplicant] = useState(true);
  const [notifyUpcomingInterview, setNotifyUpcomingInterview] = useState(true);
  const [notifySlaOverdue, setNotifySlaOverdue] = useState(true);
  const [notifyWeeklyReport, setNotifyWeeklyReport] = useState(true);

  // Delegation toggles
  const [isDelegationEnabled, setIsDelegationEnabled] = useState(false);
  const [delegateUser, setDelegateUser] = useState('NV-TL-05');
  const [delegationStartDate, setDelegationStartDate] = useState('2026-02-01');
  const [delegationEndDate, setDelegationEndDate] = useState('2026-02-10');
  const [delegationReason, setDelegationReason] = useState('Đi công tác dự án Tokyo');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage('Đã lưu cấu hình thông báo và ủy quyền phê duyệt thành công!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[10px] uppercase tracking-wider">
              Tùy Chọn & Ủy Quyền
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Cài Đặt Thông Báo & Ủy Quyền Phê Duyệt
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấu hình kênh nhận tin tuyển dụng và chuyển giao quyền hạn xử lý hồ sơ khi vắng mặt.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* CARD 1: Cấu hình thông báo */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" />
            <span>Kênh Nhận Thông Báo Tuyển Dụng</span>
          </h2>

          <div className="space-y-4 divide-y divide-slate-100 text-xs">
            {/* 1. Ứng viên mới */}
            <div className="pt-3 first:pt-0 flex items-center justify-between gap-4">
              <div>
                <strong className="text-slate-900 block text-xs">Thông báo khi có CV nộp mới vào bộ phận</strong>
                <span className="text-slate-500 text-[11px]">
                  Gửi email tức thời kèm đường link xem nhanh hồ sơ khi ứng viên hoàn tất nộp đơn.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifyNewApplicant}
                onChange={(e) => setNotifyNewApplicant(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {/* 2. Lịch phỏng vấn */}
            <div className="pt-3 flex items-center justify-between gap-4">
              <div>
                <strong className="text-slate-900 block text-xs">Nhắc lịch phỏng vấn trước 30 phút</strong>
                <span className="text-slate-500 text-[11px]">
                  Gửi ping nhắc nhở kèm liên kết phòng họp trực tuyến Teams/Meet trước giờ phỏng vấn.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifyUpcomingInterview}
                onChange={(e) => setNotifyUpcomingInterview(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {/* 3. Cảnh báo quá SLA */}
            <div className="pt-3 flex items-center justify-between gap-4">
              <div>
                <strong className="text-slate-900 block text-xs">Cảnh báo hồ sơ duyệt bị ngâm quá hạn SLA (48h)</strong>
                <span className="text-slate-500 text-[11px]">
                  Bật cảnh báo màu cam nổi bật và gửi email đốc thúc tới HR khi tờ trình dừng quá hạn cam kết.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifySlaOverdue}
                onChange={(e) => setNotifySlaOverdue(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500 cursor-pointer"
              />
            </div>

            {/* 4. Báo cáo tuần */}
            <div className="pt-3 flex items-center justify-between gap-4">
              <div>
                <strong className="text-slate-900 block text-xs">Tóm tắt tiến độ phễu tuyển dụng hàng tuần</strong>
                <span className="text-slate-500 text-[11px]">
                  Gửi email tổng hợp định biên đã tuyển, số lượng ứng viên vòng phỏng vấn sáng thứ Hai.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifyWeeklyReport}
                onChange={(e) => setNotifyWeeklyReport(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* CARD 2: Ủy quyền phê duyệt (Delegation) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Chế Độ Ủy Quyền Duyệt & Phỏng Vấn (Delegation Mode)</span>
            </h2>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">
                {isDelegationEnabled ? 'Đang bật' : 'Tắt'}
              </span>
              <button
                type="button"
                onClick={() => setIsDelegationEnabled(!isDelegationEnabled)}
                className={clsx(
                  'w-11 h-6 rounded-full transition-colors relative cursor-pointer',
                  isDelegationEnabled ? 'bg-blue-600' : 'bg-slate-200'
                )}
              >
                <span
                  className={clsx(
                    'w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 shadow-xs',
                    isDelegationEnabled ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Chuyển giao quyền chấm điểm phỏng vấn và duyệt yêu cầu cho nhân sự cấp dưới được chỉ định trong thời gian bạn đi công tác hoặc nghỉ phép dài ngày.
          </p>

          {isDelegationEnabled && (
            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Nhân sự được ủy quyền
                  </label>
                  <select
                    value={delegateUser}
                    onChange={(e) => setDelegateUser(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="NV-TL-05">Trần Quốc Nam (Tech Lead - Backend)</option>
                    <option value="NV-TL-06">Nguyễn Văn Bình (Phó Phòng Kỹ Thuật)</option>
                    <option value="NV-TL-07">Lê Thị Thanh (Lead Frontend Architect)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Lý do ủy quyền
                  </label>
                  <input
                    type="text"
                    value={delegationReason}
                    onChange={(e) => setDelegationReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Bắt đầu từ ngày
                  </label>
                  <input
                    type="date"
                    value={delegationStartDate}
                    onChange={(e) => setDelegationStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Đến hết ngày
                  </label>
                  <input
                    type="date"
                    value={delegationEndDate}
                    onChange={(e) => setDelegationEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200/60 text-amber-900 text-[11px]">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Lưu ý: Mọi quyết định và phiếu chấm điểm được thực hiện trong khoảng thời gian này sẽ được ghi nhận với nhãn "Ủy quyền bởi {delegateUser}" trong nhật ký kiểm toán hệ thống.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Toàn Bộ Cấu Hình</span>
          </button>
        </div>
      </form>
    </div>
  );
}
