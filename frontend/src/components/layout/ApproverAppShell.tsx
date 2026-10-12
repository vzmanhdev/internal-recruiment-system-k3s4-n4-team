'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FileText,
  DollarSign,
  History,
  ShieldCheck,
  CheckSquare,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { authService } from '@/features/auth/services/auth.service';
import clsx from 'clsx';

interface ApproverAppShellProps {
  children: React.ReactNode;
}

export function ApproverAppShell({ children }: ApproverAppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const [approverProfile, setApproverProfile] = useState({
    name: 'Ban Giám Đốc Approver',
    role: 'Quyền Phê Duyệt Tối Cao',
    email: 'approver@company.com',
    department: 'Ban Giám Đốc (Board of Directors)',
    initials: 'BD',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=500&auto=format&fit=crop',
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const savedAvatar = typeof window !== 'undefined' ? localStorage.getItem('user_avatar_url') : null;
        const u = await authService.getCurrentUser();
        if (u) {
          const initials = u.full_name
            ? u.full_name
                .split(' ')
                .map((n) => n[0])
                .slice(-2)
                .join('')
                .toUpperCase()
            : 'BD';

          setApproverProfile({
            name: 'Ban Giám Đốc Approver',
            role: 'Quyền Phê Duyệt Tối Cao',
            email: u.email || 'approver@company.com',
            department: 'Ban Giám Đốc (Board of Directors)',
            initials: initials || 'BD',
            avatarUrl: savedAvatar || u.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=500&auto=format&fit=crop',
          });
        } else if (savedAvatar) {
          setApproverProfile((prev) => ({ ...prev, avatarUrl: savedAvatar }));
        }
      } catch (err) {
        // Fallback to default
      }
    };
    fetchUser();

    const handleAvatarUpdate = () => {
      const savedAvatar = localStorage.getItem('user_avatar_url');
      if (savedAvatar) {
        setApproverProfile((prev) => ({ ...prev, avatarUrl: savedAvatar }));
      }
    };
    window.addEventListener('avatar_updated', handleAvatarUpdate);
    return () => window.removeEventListener('avatar_updated', handleAvatarUpdate);
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

  // Nhóm menu chính
  const navItems = [
    {
      id: 'center',
      label: 'Trung tâm phê duyệt',
      href: '/approver',
      icon: CheckSquare,
      badge: 'Cần duyệt',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'requisitions',
      label: 'Yêu cầu tuyển dụng',
      href: '/approver/requisitions',
      icon: FileText,
      badge: 'REQ',
    },
    {
      id: 'offers',
      label: 'Đề xuất Offer',
      href: '/approver/offers',
      icon: DollarSign,
      badge: 'Offer',
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    {
      id: 'history',
      label: 'Lịch sử phê duyệt',
      href: '/approver/history',
      icon: History,
    },
  ];

  // Nhóm menu "CÁ NHÂN"
  const personalNavItems = [
    {
      id: 'profile',
      label: 'Hồ sơ cá nhân',
      href: '/approver/profile',
      icon: User,
    },
    {
      id: 'settings',
      label: 'Cấu hình thông báo',
      href: '/approver/settings',
      icon: Bell,
    },
  ];

  const isCurrentTab = (itemHref: string) => {
    if (itemHref === '/approver') {
      return pathname === '/approver';
    }
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
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/approver" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900 tracking-tight">Enterprise ATS</span>
                  <span className="bg-amber-50 text-amber-800 border border-amber-200/80 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Ban Giám Đốc / Người Duyệt
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">{approverProfile.department}</p>
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
                className="px-3 py-1.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer hover:shadow-xs active:scale-95"
              >
                <span>Cổng Việc Làm</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center cursor-pointer relative active:scale-95"
                title="Thông báo chờ duyệt"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white animate-pulse" />
              </button>
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 cursor-pointer active:scale-95"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-xs border border-blue-200 shadow-xs overflow-hidden">
                  {approverProfile.avatarUrl ? (
                    <img src={approverProfile.avatarUrl} alt="Ban Giám Đốc Approver" className="w-full h-full object-cover" />
                  ) : (
                    <span>{approverProfile.initials || 'BD'}</span>
                  )}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {approverProfile.name}
                  </div>
                  <div className="text-[10px] text-blue-600 font-semibold">
                    Quyền Phê Duyệt Tối Cao
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
                  {/* 1. Khối Header của Dropdown (Thông tin User) */}
                  <div className="flex items-center gap-3 p-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-sm border border-blue-200">
                      {approverProfile.avatarUrl ? (
                        <img
                          src={approverProfile.avatarUrl}
                          alt="Ban Giám Đốc Approver"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span>{approverProfile.initials || 'BD'}</span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 leading-tight">
                        Ban Giám Đốc Approver
                      </span>
                      <span className="text-xs text-slate-500 truncate max-w-[170px] mt-0.5">
                        approver@company.com
                      </span>
                      <span className="bg-blue-50 text-blue-600 text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 w-fit border border-blue-100">
                        Quyền Phê Duyệt Tối Cao
                      </span>
                    </div>
                  </div>

                  {/* 2. Danh sách Menu Items (Chỉ giữ 2 mục tinh gọn giống Admin) */}
                  <div className="py-1">
                    <Link
                      href="/approver/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer font-medium"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Hồ sơ cá nhân</span>
                    </Link>
                    <Link
                      href="/approver/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer font-medium"
                    >
                      <Bell className="w-4 h-4 text-slate-400" />
                      <span>Cấu hình thông báo</span>
                    </Link>
                  </div>

                  {/* 3. Đường phân cách & Khối Đăng xuất (Logout) */}
                  <hr className="my-2 border-slate-100" />
                  <div className="pb-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer text-left"
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
          {/* Nhóm menu chính phía trên */}
          <div className="space-y-5">
            <div className="space-y-1.5">
              <div className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>PHÂN HỆ NGƯỜI DUYỆT</span>
                <span className="text-blue-600">v2.4</span>
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

            {/* Role Notice Card */}
            <div className="p-3 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 rounded-xl border border-blue-100/70 text-slate-700">
              <div className="flex items-center gap-2 mb-1 text-blue-900 font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Quy trình 2-3 Cấp Duyệt</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Tờ trình REQ và Offer vượt khung sẽ được ủy quyền cho Ban Giám Đốc thẩm định cuối cùng trước khi phát hành.
              </p>
            </div>
          </div>

          {/* 1. Khối đẩy nội dung xuống đáy */}
          <div className="mt-auto" />

          {/* 2. Nhóm menu "CÁ NHÂN" */}
          <div className="pt-4 space-y-1">
            <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider px-3">
              CÁ NHÂN
            </div>
            {personalNavItems.map((item) => {
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
                </Link>
              );
            })}
          </div>

          {/* 3. Khối "Trạng thái máy chủ" (Server Status) */}
          <hr className="my-4 border-slate-100" />
          <div className="bg-emerald-50/70 rounded-2xl p-4 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-bold text-slate-700">Trạng thái máy chủ</span>
              </div>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Online
              </span>
            </div>
            <p className="text-xs text-emerald-600/90">
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
