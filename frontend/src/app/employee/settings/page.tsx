'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { EmployeeAppShell } from '@/components/layout/EmployeeAppShell';
import {
  Bell,
  Mail,
  Smartphone,
  ShieldCheck,
  Calendar,
  Gift,
  Activity,
  Save,
  CheckCircle2,
  Sliders,
  RefreshCw,
  AlertCircle,
  Lock,
  ChevronRight,
  Info,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';

type SettingTab = 'notifications' | 'security';

interface EventNotificationSetting {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  inApp: boolean;
  email: boolean;
}

export default function EmployeeSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingTab>('notifications');
  const [toast, setToast] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // User Story 6: 3 required event categories with 2 independent channels (inApp & email)
  const [events, setEvents] = useState<EventNotificationSetting[]>([
    {
      id: 'interviews',
      name: 'Lịch phỏng vấn mới',
      description:
        'Nhận thông báo khi bạn có lịch phỏng vấn mới, thay đổi thời gian hoặc nhắc nhở 30 phút trước buổi phỏng vấn.',
      icon: Calendar,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50 border-blue-200',
      inApp: true,
      email: true,
    },
    {
      id: 'referrals',
      name: 'Tiến độ ứng viên được giới thiệu',
      description:
        'Cập nhật theo thời gian thực khi ứng viên bạn giới thiệu chuyển trạng thái (Duyệt CV, Phỏng vấn, Offer, Nhận việc).',
      icon: Gift,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50 border-emerald-200',
      inApp: true,
      email: true,
    },
    {
      id: 'system',
      name: 'Cập nhật hệ thống',
      description:
        'Thông báo về bảo trì định kỳ hệ thống, chính sách tuyển dụng mới hoặc tính năng bổ sung từ Quản trị viên.',
      icon: Activity,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50 border-purple-200',
      inApp: true,
      email: false,
    },
  ]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  const handleToggle = (id: string, channel: 'inApp' | 'email') => {
    setEvents((prev) =>
      prev.map((event) => {
        if (event.id === id) {
          return {
            ...event,
            [channel]: !event[channel],
          };
        }
        return event;
      })
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast('Cài đặt thông báo đã được lưu thành công!');
    }, 600);
  };

  const handleResetDefaults = () => {
    setEvents([
      {
        id: 'interviews',
        name: 'Lịch phỏng vấn mới',
        description:
          'Nhận thông báo khi bạn có lịch phỏng vấn mới, thay đổi thời gian hoặc nhắc nhở 30 phút trước buổi phỏng vấn.',
        icon: Calendar,
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-50 border-blue-200',
        inApp: true,
        email: true,
      },
      {
        id: 'referrals',
        name: 'Tiến độ ứng viên được giới thiệu',
        description:
          'Cập nhật theo thời gian thực khi ứng viên bạn giới thiệu chuyển trạng thái (Duyệt CV, Phỏng vấn, Offer, Nhận việc).',
        icon: Gift,
        iconColor: 'text-emerald-600',
        iconBg: 'bg-emerald-50 border-emerald-200',
        inApp: true,
        email: true,
      },
      {
        id: 'system',
        name: 'Cập nhật hệ thống',
        description:
          'Thông báo về bảo trì định kỳ hệ thống, chính sách tuyển dụng mới hoặc tính năng bổ sung từ Quản trị viên.',
        icon: Activity,
        iconColor: 'text-purple-600',
        iconBg: 'bg-purple-50 border-purple-200',
        inApp: true,
        email: false,
      },
    ]);
    showToast('Đã khôi phục cấu hình mặc định!');
  };

  const handleEnableAll = () => {
    setEvents((prev) =>
      prev.map((e) => ({
        ...e,
        inApp: true,
        email: true,
      }))
    );
    showToast('Đã bật tất cả các kênh thông báo!');
  };

  return (
    <EmployeeAppShell activeTab="settings">
      {/* Toast Feedback */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
              <Link href="/employee" className="hover:text-blue-600 transition-colors">
                Trang chủ
              </Link>
              <span>&rsaquo;</span>
              <span className="text-slate-700 font-bold">Cài đặt hệ thống</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Sliders className="w-8 h-8 text-blue-600" />
              <span>Cài Đặt Hệ Thống</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Quản lý danh mục tùy chỉnh thông báo sự kiện tuyển dụng và bảo mật tài khoản cá nhân.
            </p>
          </div>
        </div>

        {/* 2-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI (Lg: 4 cols): Danh mục cài đặt */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm space-y-2">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-3 mb-2">
                Danh mục cài đặt
              </p>

              {/* Tab: Cài đặt thông báo */}
              <button
                type="button"
                onClick={() => setActiveTab('notifications')}
                className={clsx(
                  'w-full flex items-center justify-between p-3.5 rounded-2xl text-left font-medium text-xs transition-all cursor-pointer',
                  activeTab === 'notifications'
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                    : 'text-slate-700 hover:bg-slate-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={clsx(
                      'w-8 h-8 rounded-xl flex items-center justify-center',
                      activeTab === 'notifications'
                        ? 'bg-white/20 text-white'
                        : 'bg-blue-50 text-blue-600'
                    )}
                  >
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm">Cài đặt thông báo</div>
                    <div
                      className={clsx(
                        'text-[10px] mt-0.5',
                        activeTab === 'notifications' ? 'text-blue-100' : 'text-slate-400'
                      )}
                    >
                      Kênh Email & Trong ứng dụng
                    </div>
                  </div>
                </div>
                <ChevronRight
                  className={clsx(
                    'w-4 h-4',
                    activeTab === 'notifications' ? 'text-white' : 'text-slate-400'
                  )}
                />
              </button>

              {/* Tab: Bảo mật tài khoản */}
              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={clsx(
                  'w-full flex items-center justify-between p-3.5 rounded-2xl text-left font-medium text-xs transition-all cursor-pointer',
                  activeTab === 'security'
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                    : 'text-slate-700 hover:bg-slate-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={clsx(
                      'w-8 h-8 rounded-xl flex items-center justify-center',
                      activeTab === 'security'
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-50 text-emerald-600'
                    )}
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm">Bảo mật tài khoản</div>
                    <div
                      className={clsx(
                        'text-[10px] mt-0.5',
                        activeTab === 'security' ? 'text-blue-100' : 'text-slate-400'
                      )}
                    >
                      Mật khẩu & Phiên đăng nhập
                    </div>
                  </div>
                </div>
                <ChevronRight
                  className={clsx(
                    'w-4 h-4',
                    activeTab === 'security' ? 'text-white' : 'text-slate-400'
                  )}
                />
              </button>
            </div>

            {/* Quick Tips Box */}
            <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 rounded-3xl p-5 border border-blue-100/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-blue-900 font-extrabold text-xs">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Mẹo cấu hình</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                Bật <strong>Thông báo qua Email</strong> giúp bạn không bỏ lỡ thư mời phỏng vấn hoặc cập nhật thưởng Referral ngay cả khi đang làm việc bên ngoài hệ thống.
              </p>
              <div className="pt-2 border-t border-blue-200/50">
                <Link
                  href="/employee/profile"
                  className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1.5"
                >
                  <span>Chỉnh sửa thông tin hồ sơ liên hệ</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (Lg: 8 cols): Nội dung cấu hình */}
          <div className="lg:col-span-8 space-y-6">
            {activeTab === 'notifications' ? (
              <form onSubmit={handleSave} className="space-y-6">
                {/* Header Card của phần Cài đặt thông báo */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                    <div>
                      <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Bell className="w-5 h-5 text-blue-600" />
                        <span>Cài Đặt Tùy Chỉnh Thông Báo</span>
                      </h2>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Cấu hình độc lập kênh nhận thông báo trong ứng dụng và thư điện tử cho từng sự kiện.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleEnableAll}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Bật tất cả
                      </button>
                      <button
                        type="button"
                        onClick={handleResetDefaults}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Mặc định
                      </button>
                    </div>
                  </div>

                  {/* Channel Headers Legend */}
                  <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 bg-slate-50 rounded-xl text-slate-500 text-[11px] font-extrabold uppercase tracking-wider">
                    <div className="col-span-7">Loại sự kiện</div>
                    <div className="col-span-2.5 text-center flex items-center justify-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                      <span>Trong ứng dụng</span>
                    </div>
                    <div className="col-span-2.5 text-center flex items-center justify-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Qua Email</span>
                    </div>
                  </div>

                  {/* Events List with Dual Toggle Switches */}
                  <div className="space-y-4">
                    {events.map((event) => {
                      const IconComponent = event.icon;
                      return (
                        <div
                          key={event.id}
                          className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-200 transition-all hover:shadow-xs"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                            {/* Cột Tên sự kiện & Mô tả (Sm: 7 cols) */}
                            <div className="sm:col-span-7 flex items-start gap-3.5">
                              <div
                                className={clsx(
                                  'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border mt-0.5',
                                  event.iconBg,
                                  event.iconColor
                                )}
                              >
                                <IconComponent className="w-5 h-5" />
                              </div>
                              <div className="space-y-1">
                                <h3 className="font-extrabold text-sm text-slate-900 leading-snug">
                                  {event.name}
                                </h3>
                                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                                  {event.description}
                                </p>
                              </div>
                            </div>

                            {/* Cột 1: Thông báo trong ứng dụng (In-app Toggle) */}
                            <div className="sm:col-span-2.5 flex sm:flex-col items-center justify-between sm:justify-center gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                              <span className="sm:hidden text-xs font-bold text-slate-600 flex items-center gap-1">
                                <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                                Trong ứng dụng:
                              </span>

                              {/* Toggle switch Tailwind (bg-blue-600 khi bật, bg-slate-300 khi tắt) */}
                              <button
                                type="button"
                                role="switch"
                                aria-checked={event.inApp}
                                onClick={() => handleToggle(event.id, 'inApp')}
                                className={clsx(
                                  'w-12 h-6.5 rounded-full transition-colors duration-200 ease-in-out cursor-pointer relative p-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400/50',
                                  event.inApp ? 'bg-blue-600' : 'bg-slate-300'
                                )}
                              >
                                <span
                                  className={clsx(
                                    'block w-5.5 h-5.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out',
                                    event.inApp ? 'translate-x-5.5' : 'translate-x-0'
                                  )}
                                />
                              </button>

                              <span
                                className={clsx(
                                  'text-[10px] font-bold',
                                  event.inApp ? 'text-blue-600' : 'text-slate-400'
                                )}
                              >
                                {event.inApp ? 'Đang bật' : 'Đã tắt'}
                              </span>
                            </div>

                            {/* Cột 2: Thông báo qua Email (Email Toggle) */}
                            <div className="sm:col-span-2.5 flex sm:flex-col items-center justify-between sm:justify-center gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                              <span className="sm:hidden text-xs font-bold text-slate-600 flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5 text-emerald-600" />
                                Qua Email:
                              </span>

                              {/* Toggle switch Tailwind (bg-blue-600 khi bật, bg-slate-300 khi tắt) */}
                              <button
                                type="button"
                                role="switch"
                                aria-checked={event.email}
                                onClick={() => handleToggle(event.id, 'email')}
                                className={clsx(
                                  'w-12 h-6.5 rounded-full transition-colors duration-200 ease-in-out cursor-pointer relative p-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400/50',
                                  event.email ? 'bg-blue-600' : 'bg-slate-300'
                                )}
                              >
                                <span
                                  className={clsx(
                                    'block w-5.5 h-5.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out',
                                    event.email ? 'translate-x-5.5' : 'translate-x-0'
                                  )}
                                />
                              </button>

                              <span
                                className={clsx(
                                  'text-[10px] font-bold',
                                  event.email ? 'text-blue-600' : 'text-slate-400'
                                )}
                              >
                                {event.email ? 'Đang bật' : 'Đã tắt'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-slate-400 font-medium">
                      Các thay đổi sẽ có hiệu lực ngay lập tức sau khi bạn nhấn Lưu cấu hình.
                    </p>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleResetDefaults}
                        className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Hủy thay đổi
                      </button>

                      <button
                        type="submit"
                        disabled={isSaving}
                        className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                      >
                        {isSaving ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        <span>{isSaving ? 'Đang lưu...' : 'Lưu cấu hình'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              /* TAB: BẢO MẬT TÀI KHOẢN */
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-sm space-y-6">
                <div className="pb-5 border-b border-slate-100">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>Bảo Mật Tài Khoản & Quyền Riêng Tư</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Quản lý mật khẩu đăng nhập và theo dõi an toàn tài khoản nhân sự nội bộ.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Password Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900">Mật khẩu đăng nhập</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Đã thay đổi lần cuối cách đây 25 ngày. Khuyến nghị cập nhật định kỳ mỗi 90 ngày.
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/employee/profile"
                      className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Đổi mật khẩu</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </Link>
                  </div>

                  {/* 2FA Status */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-sm text-slate-900">
                            Xác thực 2 yếu tố (2FA)
                          </h3>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold border border-emerald-200">
                            Đang hoạt động
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Tài khoản được bảo vệ bằng mã OTP gửi về Email và số điện thoại đã xác minh.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Active Session Info */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-start gap-3 text-xs text-blue-900">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      Bạn đang đăng nhập phiên hiện tại trên thiết bị máy trạm nội bộ. Nếu phát hiện hoạt động bất thường, vui lòng liên hệ Bộ phận An ninh thông tin (IT Security) tại{' '}
                      <span className="font-mono font-bold text-blue-700">security@company.com</span>.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </EmployeeAppShell>
  );
}
