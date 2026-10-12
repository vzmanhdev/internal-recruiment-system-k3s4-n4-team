'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  FileEdit,
  History,
  BookOpen,
  Target,
  User,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';
import { authService } from '@/features/auth/services/auth.service';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeClass?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export default function InterviewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const [interviewerProfile, setInterviewerProfile] = useState({
    name: 'Nguyễn Minh Trí',
    email: 'interviewer@company.com',
    role: 'Hội Đồng Phỏng Vấn',
    title: 'Senior Tech Lead / Interviewer',
    department: 'Ban Công Nghệ & Khối Tuyển Dụng',
    avatarUrl: '',
    initials: 'MT',
  });

  // Tải thông tin người dùng từ authService nếu có
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          const names = (user.full_name || 'Nguyễn Minh Trí').split(' ');
          const initials =
            names.length >= 2
              ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
              : names[0].slice(0, 2).toUpperCase();

          setInterviewerProfile((prev) => ({
            ...prev,
            name: user.full_name || prev.name,
            email: user.email || prev.email,
            avatarUrl: user.avatar_url || '',
            initials: initials || prev.initials,
          }));
        }
      } catch {
        // Fallback profile mặc định
      }
    };
    fetchUser();
  }, []);

  // Xử lý đóng dropdown profile khi click ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  // 1. TỔNG QUAN
  const overviewGroup: NavGroup = {
    label: 'TỔNG QUAN',
    items: [
      {
        id: 'dashboard',
        label: 'Bảng điều khiển',
        href: '/interviewer',
        icon: LayoutDashboard,
      },
    ],
  };

  // 2. LỊCH & ĐÁNH GIÁ (Nghiệp vụ cốt lõi)
  const evaluationsGroup: NavGroup = {
    label: 'LỊCH & ĐÁNH GIÁ',
    items: [
      {
        id: 'schedule',
        label: 'Lịch phỏng vấn của tôi',
        href: '/interviewer/schedule',
        icon: Calendar,
      },
      {
        id: 'pending-scorecards',
        label: 'Phiếu đánh giá chờ nộp',
        href: '/interviewer/evaluations/pending',
        icon: FileEdit,
        badge: '3',
        badgeClass: 'bg-rose-500 text-white font-extrabold shadow-sm animate-pulse',
      },
      {
        id: 'history',
        label: 'Lịch sử đánh giá',
        href: '/interviewer/evaluations/history',
        icon: History,
      },
    ],
  };

  // 3. HỖ TRỢ PHỎNG VẤN
  const supportGroup: NavGroup = {
    label: 'HỖ TRỢ PHỎNG VẤN',
    items: [
      {
        id: 'questions',
        label: 'Ngân hàng câu hỏi',
        href: '/interviewer/questions',
        icon: BookOpen,
      },
      {
        id: 'frameworks',
        label: 'Khung năng lực chuẩn',
        href: '/interviewer/frameworks',
        icon: Target,
      },
    ],
  };

  // 4. CÁ NHÂN (Đặt ở dưới cùng sát đáy)
  const personalItems: NavItem[] = [
    {
      id: 'profile',
      label: 'Hồ sơ cá nhân',
      href: '/interviewer/profile',
      icon: User,
    },
    {
      id: 'settings',
      label: 'Cấu hình thông báo',
      href: '/interviewer/settings',
      icon: Bell,
    },
  ];

  // Kiểm tra route hiện tại để active menu item
  const isCurrentTab = (itemHref: string) => {
    if (itemHref === '/interviewer') {
      return pathname === '/interviewer';
    }
    return pathname === itemHref || pathname.startsWith(itemHref + '/');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased">
      {/* 1. TOP HEADER (100% full width, sticky top, chuẩn Admin/Approver) */}
      <header className="w-full sticky top-0 z-50 bg-white border-b border-slate-100 shadow-xs">
        <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Brand & Mobile Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/interviewer" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                ATS
              </div>
              <div>
                <div className="font-extrabold text-sm text-slate-900 tracking-tight leading-none flex items-center gap-2">
                  Hệ Thống Tuyển Dụng Nội Bộ
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold uppercase tracking-wider">
                    Interviewer Workspace
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Hội Đồng Phỏng Vấn & Đánh Giá Ứng Viên
                </div>
              </div>
            </Link>
          </div>

          {/* Right: Quick actions, Notifications & User Profile */}
          <div className="flex items-center gap-3">
            {/* Quick Link to Job Portal */}
            <div className="hidden md:flex items-center gap-2 border-r border-slate-100 pr-4 mr-1">
              <Link
                href="/jobs"
                target="_blank"
                className="px-3 py-1.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer hover:shadow-xs active:scale-95"
              >
                <span>Cổng Việc Làm</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <Link
                href="/interviewer/settings"
                className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center cursor-pointer relative active:scale-95"
                title="Thông báo mới"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
              </Link>
            </div>

            {/* User Profile Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 cursor-pointer active:scale-95"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-xs border border-blue-200 shadow-xs overflow-hidden shrink-0">
                  {interviewerProfile.avatarUrl ? (
                    <img
                      src={interviewerProfile.avatarUrl}
                      alt={interviewerProfile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{interviewerProfile.initials}</span>
                  )}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {interviewerProfile.name}
                  </div>
                  <div className="text-[10px] text-blue-600 font-semibold">
                    Hội Đồng Phỏng Vấn
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
              </button>

              {/* Profile Menu Popover */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                  <div className="flex items-center gap-3 p-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-sm border border-blue-200">
                      {interviewerProfile.avatarUrl ? (
                        <img
                          src={interviewerProfile.avatarUrl}
                          alt={interviewerProfile.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{interviewerProfile.initials}</span>
                      )}
                    </div>
                    <div className="flex flex-col text-left overflow-hidden">
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {interviewerProfile.name}
                      </span>
                      <span className="text-xs text-slate-500 truncate">
                        {interviewerProfile.email}
                      </span>
                      <span className="bg-blue-50 text-blue-600 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 w-fit border border-blue-100">
                        {interviewerProfile.role}
                      </span>
                    </div>
                  </div>

                  <div className="p-2 space-y-1">
                    <Link
                      href="/interviewer/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Hồ sơ cá nhân</span>
                    </Link>

                    <Link
                      href="/interviewer/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <Bell className="w-4 h-4 text-slate-400" />
                      <span>Cấu hình thông báo</span>
                    </Link>
                  </div>

                  <div className="p-2 border-t border-slate-100">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất hệ thống</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. BODY LAYOUT: FLOATING SIDEBAR + MAIN CONTENT */}
      <div className="flex-1 w-full flex">
        {/* Mobile menu backdrop */}
        {isMobileMenuOpen && (
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-20 lg:hidden"
          />
        )}

        {/* FLOATING SIDEBAR (Card nổi ml-4 sm:ml-6 mt-6 w-64 bg-white rounded-2xl shadow-sm border border-slate-100 p-4) */}
        <aside
          className={clsx(
            'fixed lg:sticky top-20 z-30 h-[calc(100vh-6.5rem)] w-64 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 shrink-0 flex flex-col overflow-y-auto ml-4 sm:ml-6 mt-6 mb-6 transition-transform duration-200 select-none',
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-[120%] lg:translate-x-0'
          )}
        >
          {/* Menu Items Container */}
          <div className="space-y-6">
            {/* NHÓM 1: TỔNG QUAN */}
            <div className="space-y-1.5">
              <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                <span>{overviewGroup.label}</span>
                <span className="text-blue-600 font-bold">v2.0</span>
              </div>
              <div className="space-y-1">
                {overviewGroup.items.map((item) => {
                  const Icon = item.icon;
                  const active = isCurrentTab(item.href);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={clsx(
                        'flex items-center justify-between gap-3 px-4 py-3 font-medium transition-all duration-200 ease-in-out rounded-full text-xs cursor-pointer group',
                        active
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold'
                          : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={clsx(
                            'w-4 h-4 transition-transform duration-200 group-hover:scale-105 shrink-0',
                            active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                          )}
                        />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* NHÓM 2: LỊCH & ĐÁNH GIÁ (Nghiệp vụ cốt lõi) */}
            <div className="space-y-1.5">
              <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                {evaluationsGroup.label}
              </div>
              <div className="space-y-1">
                {evaluationsGroup.items.map((item) => {
                  const Icon = item.icon;
                  const active = isCurrentTab(item.href);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={clsx(
                        'flex items-center justify-between gap-3 px-4 py-3 font-medium transition-all duration-200 ease-in-out rounded-full text-xs cursor-pointer group',
                        active
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold'
                          : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={clsx(
                            'w-4 h-4 transition-transform duration-200 group-hover:scale-105 shrink-0',
                            active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                          )}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={clsx(
                            'text-[9px] px-2 py-0.5 rounded-full transition-colors',
                            active
                              ? 'bg-white/20 text-white border border-white/30 font-bold'
                              : item.badgeClass || 'bg-rose-500 text-white font-bold'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* NHÓM 3: HỖ TRỢ PHỎNG VẤN */}
            <div className="space-y-1.5">
              <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                {supportGroup.label}
              </div>
              <div className="space-y-1">
                {supportGroup.items.map((item) => {
                  const Icon = item.icon;
                  const active = isCurrentTab(item.href);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={clsx(
                        'flex items-center justify-between gap-3 px-4 py-3 font-medium transition-all duration-200 ease-in-out rounded-full text-xs cursor-pointer group',
                        active
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold'
                          : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={clsx(
                            'w-4 h-4 transition-transform duration-200 group-hover:scale-105 shrink-0',
                            active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                          )}
                        />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 1. KHỐI ĐẨY NỘI DUNG XUỐNG ĐÁY */}
          <div className="mt-auto" />

          {/* NHÓM 4: CÁ NHÂN (Đặt ở dưới cùng sát đáy) */}
          <div className="pt-4 space-y-1">
            <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
              CÁ NHÂN
            </div>
            {personalItems.map((item) => {
              const Icon = item.icon;
              const active = isCurrentTab(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={clsx(
                    'flex items-center justify-between gap-3 px-4 py-3 font-medium transition-all duration-200 ease-in-out rounded-full text-xs cursor-pointer group',
                    active
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold'
                      : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={clsx(
                        'w-4 h-4 transition-transform duration-200 group-hover:scale-105 shrink-0',
                        active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                      )}
                    />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}

            {/* Nút Đăng xuất (Logout) - Text màu đỏ */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 font-bold transition-all duration-200 ease-in-out rounded-full text-xs cursor-pointer group text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-4 h-4 text-rose-500 group-hover:text-rose-600 transition-transform duration-200 group-hover:scale-105 shrink-0" />
                <span>Đăng xuất</span>
              </div>
            </button>
          </div>

          {/* KHỐI TRẠNG THÁI MÁY CHỦ (SERVER STATUS) */}
          <hr className="my-3 border-slate-100" />
          <div className="bg-emerald-50/70 rounded-2xl p-3.5 flex flex-col gap-1 border border-emerald-100/60 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-700">Trạng thái máy chủ</span>
              </div>
              <span className="bg-emerald-100 text-emerald-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                Online
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 font-medium">
              Hệ thống hoạt động bình thường
            </p>
          </div>
        </aside>

        {/* 3. MAIN CONTENT CONTAINER (mr-6 mt-6 mb-6 tương xứng với Floating Sidebar) */}
        <main className="flex-1 min-w-0 mx-4 sm:mx-6 lg:ml-6 lg:mr-6 mt-6 mb-6 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
