"use client";

import { useState } from "react";
import {
  Bell,
  CheckCircle2,
  Globe,
  KeyRound,
  Lock,
  Mail,
  Save,
  Settings,
  ShieldAlert,
  Sliders,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export function SystemSettings() {
  const [activeTab, setActiveTab] = useState<"general" | "recruitment" | "security" | "notifications">("general");
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form states
  const [generalConfig, setGeneralConfig] = useState({
    companyName: "Tập đoàn Công nghệ & Dịch vụ Số",
    supportEmail: "tech-support@company.com",
    timezone: "Asia/Ho_Chi_Minh (GMT+7)",
    defaultLanguage: "vi-VN (Tiếng Việt)",
  });

  const [recruitmentConfig, setRecruitmentConfig] = useState({
    requireAdminApproval: true,
    allowConvertFromApprovedReq: true,
    defaultPostingDurationDays: 30,
    maxApplicantsPerJob: 100,
    autoCloseExpiredJobs: true,
  });

  const [securityConfig, setSecurityConfig] = useState({
    maxFailedAttempts: 5,
    lockDurationMinutes: 15,
    tokenExpireHours: 24,
    passwordMinLength: 8,
    requireStrongPassword: true,
  });

  const [notificationConfig, setNotificationConfig] = useState({
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    fromEmail: "recruitment-noreply@company.com",
    notifyOnNewRegistration: true,
    notifyOnNewJobPendingApproval: true,
    notifyCandidateOnStageChange: true,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setNotification("Đã lưu thiết lập cấu hình hệ thống thành công!");
      setTimeout(() => setNotification(null), 3500);
    }, 600);
  };

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-24 right-6 z-50 flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-emerald-900/20">
          <CheckCircle2 className="h-4 w-4" />
          <span>{notification}</span>
        </div>
      )}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-blue-600">
            <Settings className="h-4 w-4" />
            Thiết lập quản trị
          </div>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">
            Cấu hình Hệ Thống
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Quản trị quy tắc phê duyệt tin tuyển dụng, chính sách khóa tài khoản và thông số vận hành nền tảng.
          </p>
        </div>
      </header>

      {/* Tabs Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200">
        {[
          { id: "general", label: "Cấu hình chung", icon: Globe },
          { id: "recruitment", label: "Tuyển dụng & Phê duyệt", icon: Sliders },
          { id: "security", label: "Bảo mật & Đăng nhập", icon: Lock },
          { id: "notifications", label: "Email & Thông báo", icon: Mail },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold transition-colors ${
                active
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Tab 1: General */}
        {activeTab === "general" && (
          <Card className="space-y-5 p-6">
            <h3 className="text-base font-extrabold text-slate-900">Thông tin tổ chức</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên doanh nghiệp / Công ty</label>
                <input
                  type="text"
                  value={generalConfig.companyName}
                  onChange={(e) => setGeneralConfig({ ...generalConfig, companyName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email hỗ trợ kỹ thuật</label>
                <input
                  type="email"
                  value={generalConfig.supportEmail}
                  onChange={(e) => setGeneralConfig({ ...generalConfig, supportEmail: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Múi giờ hệ thống</label>
                <input
                  type="text"
                  disabled
                  value={generalConfig.timezone}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ngôn ngữ mặc định</label>
                <input
                  type="text"
                  disabled
                  value={generalConfig.defaultLanguage}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600 cursor-not-allowed"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Tab 2: Recruitment & Approvals */}
        {activeTab === "recruitment" && (
          <Card className="space-y-6 p-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Quy tắc Phê duyệt & Đăng tin</h3>
              <p className="text-xs text-slate-500 mt-1">
                Quy định thẩm quyền và điều kiện tiên quyết trước khi đưa bài tuyển dụng lên cổng nội bộ.
              </p>
            </div>

            <div className="space-y-4 divide-y divide-slate-100">
              <label className="flex items-start justify-between gap-4 pt-4 cursor-pointer">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Bắt buộc Quản trị viên (Admin) phê duyệt trước khi đăng tin
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Khi bật, bài đăng do Nhân sự (HR) tạo sẽ luôn ở trạng thái "Chờ duyệt" và không thể mở đăng công khai cho đến khi Admin phê duyệt.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={recruitmentConfig.requireAdminApproval}
                  onChange={(e) => setRecruitmentConfig({ ...recruitmentConfig, requireAdminApproval: e.target.checked })}
                  className="h-5 w-5 rounded accent-blue-600 mt-1"
                />
              </label>

              <label className="flex items-start justify-between gap-4 pt-4 cursor-pointer">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Cho phép chuyển đổi yêu cầu tuyển dụng (Story S3-09)
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cho phép Nhân sự kế thừa mô tả công việc, dải lương từ các yêu cầu tuyển dụng đã hoàn tất chuỗi cấp duyệt ('approved').
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={recruitmentConfig.allowConvertFromApprovedReq}
                  onChange={(e) => setRecruitmentConfig({ ...recruitmentConfig, allowConvertFromApprovedReq: e.target.checked })}
                  className="h-5 w-5 rounded accent-blue-600 mt-1"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2 pt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Thời hạn nhận hồ sơ mặc định (Ngày)
                  </label>
                  <input
                    type="number"
                    min="7"
                    max="180"
                    value={recruitmentConfig.defaultPostingDurationDays}
                    onChange={(e) => setRecruitmentConfig({ ...recruitmentConfig, defaultPostingDurationDays: parseInt(e.target.value) || 30 })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số ứng viên tối đa / Vị trí
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    value={recruitmentConfig.maxApplicantsPerJob}
                    onChange={(e) => setRecruitmentConfig({ ...recruitmentConfig, maxApplicantsPerJob: parseInt(e.target.value) || 100 })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Tab 3: Security & Login */}
        {activeTab === "security" && (
          <Card className="space-y-6 p-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Chính sách Bảo mật & Đăng nhập</h3>
              <p className="text-xs text-slate-500 mt-1">
                Kiểm soát số lần thử đăng nhập, khóa tài khoản và thời hạn token xác thực.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                <label className="block text-xs font-bold text-amber-900 mb-1">
                  Số lần nhập sai tối đa trước khi tạm khóa giao diện
                </label>
                <input
                  type="number"
                  min="3"
                  max="10"
                  value={securityConfig.maxFailedAttempts}
                  onChange={(e) => setSecurityConfig({ ...securityConfig, maxFailedAttempts: parseInt(e.target.value) || 5 })}
                  className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs text-slate-900"
                />
                <p className="mt-1 text-[11px] text-amber-700">Mặc định: 5 lần (Story S1-02).</p>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                <label className="block text-xs font-bold text-amber-900 mb-1">
                  Thời gian tạm khóa giao diện (Phút)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={securityConfig.lockDurationMinutes}
                  onChange={(e) => setSecurityConfig({ ...securityConfig, lockDurationMinutes: parseInt(e.target.value) || 15 })}
                  className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs text-slate-900"
                />
                <p className="mt-1 text-[11px] text-amber-700">Mặc định: 15 phút (Story S1-02).</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Thời hạn hiệu lực phiên làm việc (Giờ)
                </label>
                <input
                  type="number"
                  min="1"
                  max="72"
                  value={securityConfig.tokenExpireHours}
                  onChange={(e) => setSecurityConfig({ ...securityConfig, tokenExpireHours: parseInt(e.target.value) || 24 })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Độ dài mật khẩu tối thiểu
                </label>
                <input
                  type="number"
                  min="8"
                  max="32"
                  value={securityConfig.passwordMinLength}
                  onChange={(e) => setSecurityConfig({ ...securityConfig, passwordMinLength: parseInt(e.target.value) || 8 })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Tab 4: Notifications & Email */}
        {activeTab === "notifications" && (
          <Card className="space-y-6 p-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Email & Thông báo tự động</h3>
              <p className="text-xs text-slate-500 mt-1">
                Cấu hình máy chủ gửi thư điện tử và các kịch bản kích hoạt thông báo quản trị.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={notificationConfig.smtpHost}
                  onChange={(e) => setNotificationConfig({ ...notificationConfig, smtpHost: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">SMTP Port</label>
                <input
                  type="number"
                  value={notificationConfig.smtpPort}
                  onChange={(e) => setNotificationConfig({ ...notificationConfig, smtpPort: parseInt(e.target.value) || 587 })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Email người gửi (From Email)</label>
                <input
                  type="email"
                  value={notificationConfig.fromEmail}
                  onChange={(e) => setNotificationConfig({ ...notificationConfig, fromEmail: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationConfig.notifyOnNewRegistration}
                  onChange={(e) => setNotificationConfig({ ...notificationConfig, notifyOnNewRegistration: e.target.checked })}
                  className="h-4 w-4 rounded accent-blue-600"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Gửi thông báo tới Admin khi có tài khoản mới đăng ký chờ phê duyệt
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationConfig.notifyOnNewJobPendingApproval}
                  onChange={(e) => setNotificationConfig({ ...notificationConfig, notifyOnNewJobPendingApproval: e.target.checked })}
                  className="h-4 w-4 rounded accent-blue-600"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Gửi thông báo tới Admin khi có bài đăng tuyển dụng mới cần xét duyệt
                </span>
              </label>
            </div>
          </Card>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit" isLoading={saving} leftIcon={<Save className="h-4 w-4" />}>
            Lưu thay đổi cấu hình
          </Button>
        </div>
      </form>
    </div>
  );
}
