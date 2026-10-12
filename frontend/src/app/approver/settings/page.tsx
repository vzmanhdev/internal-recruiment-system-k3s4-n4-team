'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Mail,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Save,
  Clock,
  Sparkles,
  Sliders,
  Check,
  AlertTriangle,
  Info
} from 'lucide-react';

export default function ApproverSettingsPage() {
  const [settings, setSettings] = useState({
    notifyNewReq: true,
    notifyOverBudgetOffer: true,
    notifyUrgentOnly: false,
    emailDailyDigest: true,
    smsUrgentAlert: true,
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="w-full p-6 md:p-8 flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Top Header Card */}
      <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <Link
            href="/approver"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 mb-2 w-fit transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Quay lại trung tâm phê duyệt</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <span>Cấu Hình Thông Báo & Cảnh Báo Phê Duyệt</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Thiết lập tần suất, kênh nhận tin và các tiêu chí kích hoạt cảnh báo khi có hồ sơ cần Ban Giám Đốc ký duyệt.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <span className="px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            Kênh hoạt động bình thường
          </span>
        </div>
      </div>

      {/* Success notification banner */}
      {isSaved && (
        <div className="w-full p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-in slide-in-from-top-2 duration-300 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Đã lưu thành công các thiết lập cấu hình thông báo và cảnh báo phê duyệt!</span>
        </div>
      )}

      {/* Main Settings Card */}
      <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs flex flex-col gap-8">
        
        {/* Section 1: Sự kiện kích hoạt thông báo */}
        <div className="w-full space-y-4">
          <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                SỰ KIỆN KÍCH HOẠT THÔNG BÁO
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Các sự kiện nghiệp vụ tuyển dụng tự động kích hoạt thông báo tới Người duyệt
              </p>
            </div>
            <Sliders className="w-4 h-4 text-slate-400" />
          </div>

          <div className="w-full divide-y divide-slate-100">
            {/* Setting 1 */}
            <div className="py-4.5 flex items-center justify-between gap-6 hover:bg-slate-50/50 -mx-4 px-4 rounded-2xl transition-colors">
              <div className="space-y-1">
                <span className="text-sm font-bold text-slate-900 block">
                  Tờ trình tuyển dụng (REQ) mới chuyển cấp Giám Đốc
                </span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Gửi thông báo ngay khi HR Manager hoàn tất thẩm định cấp 1 và chính thức trình lên Ban Giám Đốc phê duyệt hạn mức ngân sách & chỉ tiêu tuyển dụng.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.notifyNewReq}
                onClick={() => handleToggle('notifyNewReq')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.notifyNewReq ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    settings.notifyNewReq ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Setting 2 */}
            <div className="py-4.5 flex items-center justify-between gap-6 hover:bg-slate-50/50 -mx-4 px-4 rounded-2xl transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 block">
                    Cảnh báo Đề xuất Offer Vượt Khung Ngân Sách
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-extrabold border border-rose-200">
                    Cần lưu ý
                  </span>
                </div>
                <p className="text-xs text-rose-600 font-medium leading-relaxed">
                  Cảnh báo tức thời khi mức lương hoặc gói đãi ngộ ứng viên vượt quá trần khung dải chuẩn (Band range) của vị trí công tác.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.notifyOverBudgetOffer}
                onClick={() => handleToggle('notifyOverBudgetOffer')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.notifyOverBudgetOffer ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    settings.notifyOverBudgetOffer ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Setting 3 */}
            <div className="py-4.5 flex items-center justify-between gap-6 hover:bg-slate-50/50 -mx-4 px-4 rounded-2xl transition-colors">
              <div className="space-y-1">
                <span className="text-sm font-bold text-slate-900 block">
                  Chỉ nhận thông báo hồ sơ có mức ưu tiên "Khẩn cấp"
                </span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Bỏ qua thông báo dạng đẩy (Push/Email) của các hồ sơ định kỳ tiêu chuẩn. Bạn vẫn có thể xem đầy đủ danh sách tại Trung tâm phê duyệt.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.notifyUrgentOnly}
                onClick={() => handleToggle('notifyUrgentOnly')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.notifyUrgentOnly ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    settings.notifyUrgentOnly ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Kênh nhận tin */}
        <div className="w-full space-y-4 pt-2 border-t border-slate-100">
          <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                KÊNH NHẬN TIN & TẦN SUẤT
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Lựa chọn phương thức gửi tin phù hợp với thói quen làm việc của Ban Giám Đốc
              </p>
            </div>
            <Mail className="w-4 h-4 text-slate-400" />
          </div>

          <div className="w-full divide-y divide-slate-100">
            {/* Channel 1 */}
            <div className="py-4.5 flex items-center justify-between gap-6 hover:bg-slate-50/50 -mx-4 px-4 rounded-2xl transition-colors">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-bold text-slate-900 block">
                    Email Digest Tổng Hợp Hàng Ngày
                  </span>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Gửi 01 email tổng hợp danh sách các tờ trình và đề xuất offer đang chờ phê duyệt vào 08:00 sáng mỗi ngày làm việc.
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.emailDailyDigest}
                onClick={() => handleToggle('emailDailyDigest')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.emailDailyDigest ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    settings.emailDailyDigest ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Channel 2 */}
            <div className="py-4.5 flex items-center justify-between gap-6 hover:bg-slate-50/50 -mx-4 px-4 rounded-2xl transition-colors">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-bold text-slate-900 block">
                    Tin nhắn SMS & Ứng dụng OTT Nội bộ
                  </span>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Nhận thông báo khẩn cấp và mã OTP xác nhận ký số khi có yêu cầu phê duyệt có mức ưu tiên cao nhất.
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.smsUrgentAlert}
                onClick={() => handleToggle('smsUrgentAlert')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.smsUrgentAlert ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    settings.smsUrgentAlert ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Action Button Footer */}
        <div className="w-full pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Các thay đổi sẽ có hiệu lực ngay lập tức sau khi lưu thiết lập.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Link
              href="/approver"
              className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-slate-50 font-bold text-xs text-slate-700 transition-colors"
            >
              Hủy
            </Link>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/25 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Lưu Cấu Hình</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
