'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FileText,
  GitMerge,
  Star,
  Calendar,
  Filter,
  User,
  Settings,
  Briefcase,
  Bell,
  LogOut,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { authService } from '@/features/auth/services/auth.service';
import clsx from 'clsx';

interface ManagerAppShellProps {
  children: React.ReactNode;
}

export function ManagerAppShell({ children }: ManagerAppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const [managerProfile, setManagerProfile] = useState({
    name: 'Lê Trưởng Nhóm',
    role: 'Trưởng Bộ Phận (Hiring Manager)',
    email: 'manager@company.com',
    department: 'Khối Công Nghệ & Phần Mềm',
    initials: 'LT',
    avatarUrl: '',
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const u = await authService.getCurrentUser();
        if (u) {
          const initials = u.full_name
            ? u.full_name
                .split(' ')
                .map((n) => n[0])
                .slice(-2)
                .join('')
                .toUpperCase()
            : 'LT';

          setManagerProfile({
            name: u.full_name || 'Lê Trưởng Nhóm',
            role: 'Trưởng Bộ Phận (Hiring Manager)',
            email: u.email || 'manager@company.com',
            department: 'Khối Công Nghệ & Phần Mềm',
            initials: initials || 'LT',
            avatarUrl: u.avatar_url || '',
          });
        }
      } catch (err) {
        // Fallback to default
      }
    };
    fetchUser();
  }, []);

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

  // 7 Mục menu chuẩn theo yêu cầu chính xác:
  // 1. YC tuyển dụng (FileText) - route: /manager/requisitions
  // 2. Chuỗi cấp duyệt (GitMerge) - route: /manager/approvals
  // 3. Đánh giá ứng viên (Star) - route: /manager/evaluations
  // 4. Lịch phỏng vấn (Calendar) - route: /manager/interviews
  // 5. Tiến độ Pipeline Funnel (Filter) - route: /manager/pipeline
  // 6. Hồ sơ (User) - route: /manager/profile
  // 7. Cài đặt (Settings) - route: /manager/settings
  const navItems = [
    {
      id: 'requisitions',
      label: 'YC tuyển dụng',
      href: '/manager/requisitions',
      icon: FileText,
      badge: '5 vị trí',
    },
    {
      id: 'approvals',
      label: 'Chuỗi cấp duyệt',
      href: '/manager/approvals',
      icon: GitMerge,
      badge: '1 chờ',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'evaluations',
      label: 'Đánh giá ứng viên',
      href: '/manager/evaluations',
      icon: Star,
      badge: '4 đợi chấm',
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    {
      id: 'interviews',
      label: 'Lịch phỏng vấn',
      href: '/manager/interviews',
      icon: Calendar,
      badge: 'Hôm nay',
    },
    {
      id: 'pipeline',
      label: 'Tiến độ Pipeline Funnel',
      href: '/manager/pipeline',
      icon: Filter,
    },
    {
      id: 'profile',
      label: 'Hồ sơ',
      href: '/manager/profile',
      icon: User,
    },
    {
      id: 'settings',
      label: 'Cài đặt',
      href: '/manager/settings',
      icon: Settings,
    },
    {
      id: 'notifications',
      label: 'Cấu hình thông báo',
      href: '/manager/notifications',
      icon: Bell,
    },
  ];

  const isCurrentTab = (itemHref: string) => {
    return pathname === itemHref || pathname.startsWith(itemHref + '/');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased">
      {/* 1. TOP HEADER (100% full width, sticky top, z-50, detached completely from sidebar) */}
      <header className="w-full sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
        <div className="w-full max-w-full px-6 sm:px-8 h-16 flex items-center justify-between">
          {/* Left: Brand & Mobile Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/manager/requisitions" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900 tracking-tight">Enterprise ATS</span>
                  <span className="bg-blue-50 text-blue-700 border border-blue-200/60 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Hiring Manager Workspace
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">{managerProfile.department}</p>
              </div>
            </Link>
          </div>

          {/* Right: Quick actions, Notification & Profile */}
          <div className="flex items-center gap-3">
            {/* Quick Link to Job Portal */}
            <div className="hidden md:flex items-center gap-2 border-r border-slate-100 pr-4 mr-1">
              <Link
                href="/jobs"
                target="_blank"
                className="px-3 py-1.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Cổng Việc Làm</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <Link
                href="/manager/notifications"
                className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center cursor-pointer relative"
                title="Thông báo tuyển dụng"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
              </Link>
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-sm shadow-blue-500/20 overflow-hidden">
                  {managerProfile.avatarUrl ? (
                    <img src={managerProfile.avatarUrl} alt={managerProfile.name} className="w-full h-full object-cover" />
                  ) : (
                    managerProfile.initials
                  )}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {managerProfile.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    Hiring Manager
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="font-bold text-xs text-slate-900">{managerProfile.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{managerProfile.email}</div>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100">
                      {managerProfile.role}
                    </span>
                  </div>

                  <div className="py-1 text-xs">
                    <Link
                      href="/manager/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Hồ sơ cá nhân</span>
                    </Link>
                    <Link
                      href="/manager/notifications"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <Bell className="w-4 h-4 text-slate-400" />
                      <span>Cấu hình thông báo</span>
                    </Link>
                    <Link
                      href="/manager/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Cài đặt & Ủy quyền</span>
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 text-xs font-bold cursor-pointer"
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

        {/* FLOATING SIDEBAR (Card nổi ml-6 mt-6 w-64 bg-white rounded-2xl shadow-sm border border-slate-100 p-4) */}
        <aside
          className={clsx(
            'fixed lg:sticky top-20 z-30 h-[calc(100vh-6.5rem)] w-64 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 shrink-0 flex flex-col overflow-y-auto ml-4 sm:ml-6 mt-6 mb-6 transition-transform duration-200 select-none',
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-[120%] lg:translate-x-0'
          )}
        >
          {/* Vùng chứa các menu có flex-1 để đẩy khối Trạng thái máy chủ xuống dưới cùng nếu màn hình dài */}
          <div className="flex-1 space-y-5">
            <div className="space-y-1.5">
              <div className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                MENU TRƯỞNG BỘ PHẬN
              </div>
              <div className="space-y-1">
                {navItems.map((item) => {
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
                            'w-4 h-4 transition-colors shrink-0',
                            active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                          )}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={clsx(
                            'text-[9px] font-extrabold px-2 py-0.5 rounded-full transition-colors',
                            active
                              ? 'bg-white/20 text-white border border-white/20'
                              : item.badgeColor || 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
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

            {/* Quick Action Button in Sidebar */}
            <div className="pt-2">
              <Link
                href="/manager/requisitions?action=create"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100/80 text-blue-700 font-bold text-xs border border-blue-200/80 transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Đề Xuất Tuyển Dụng</span>
              </Link>
            </div>
          </div>

          {/* 2. Đường kẻ phân cách (Divider) */}
          <div className="my-4 border-t border-slate-100" />

          {/* 3. Khối Trạng thái máy chủ (Server Status Widget) */}
          <div className="bg-emerald-50/50 rounded-2xl p-4 flex flex-col gap-1 border border-emerald-100/50 shadow-xs">
            {/* Dòng tiêu đề (Top line) */}
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-semibold text-slate-800">Trạng thái máy chủ</span>
              <span className="ml-auto bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Online
              </span>
            </div>

            {/* Dòng phụ đề (Bottom line) */}
            <p className="text-xs text-emerald-600/80 pl-4">
              Hệ thống hoạt động bình thường
            </p>
          </div>
        </aside>

        {/* 3. MAIN CONTENT CONTAINER (flex-1 m-6) */}
        <main className="flex-1 min-w-0 m-6 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
