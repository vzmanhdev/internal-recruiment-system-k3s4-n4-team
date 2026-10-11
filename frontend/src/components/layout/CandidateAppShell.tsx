'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Briefcase,
  UserCircle,
  Calendar,
  Award,
  Bell,
  LogOut,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  Phone,
  Mail,
  FileText,
  Sparkles,
  User,
} from 'lucide-react';
import { authService } from '@/features/auth/services/auth.service';
import clsx from 'clsx';

interface CandidateAppShellProps {
  children: React.ReactNode;
}

export function CandidateAppShell({ children }: CandidateAppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Candidate Profile state - Nguyễn Văn An (candidate@company.com)
  const [candidateProfile, setCandidateProfile] = useState({
    name: 'Nguyễn Văn An',
    role: 'Ứng viên (Candidate)',
    email: 'candidate@company.com',
    phone: '0912 345 678',
    code: 'UV-2026-085',
    title: 'Senior Backend Engineer',
    initials: 'AN',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&auto=format&fit=crop',
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
            : 'AN';

          setCandidateProfile((prev) => ({
            ...prev,
            name: u.full_name || prev.name,
            email: u.email || prev.email,
            phone: u.phone || prev.phone,
            code: u.employee_code || prev.code,
            initials: initials || prev.initials,
            avatarUrl: u.avatar_url || prev.avatarUrl,
          }));
        }
      } catch {
        // Fallback to default mock data
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

  // 4 Mục menu theo đúng yêu cầu:
  // 1. Cơ hội việc làm (/candidate/jobs)
  // 2. Hồ sơ của tôi (/candidate/applications)
  // 3. Lịch phỏng vấn (/candidate/interviews)
  // 4. Đề xuất (Offer) (/candidate/offers)
  const navItems = [
    {
      id: 'jobs',
      label: 'Cơ hội việc làm',
      href: '/candidate/jobs',
      icon: Briefcase,
      badge: 'Mới',
    },
    {
      id: 'applications',
      label: 'Hồ sơ của tôi',
      href: '/candidate/applications',
      icon: FileText,
      badge: '4 hồ sơ',
    },
    {
      id: 'interviews',
      label: 'Lịch phỏng vấn',
      href: '/candidate/interviews',
      icon: Calendar,
      badge: '1 ca',
    },
    {
      id: 'offers',
      label: 'Đề xuất (Offer)',
      href: '/candidate/offers',
      icon: Award,
      badge: '1 mới',
    },
  ];

  const isCurrentTab = (href: string) => {
    if (href === '/candidate/jobs' && (pathname === '/candidate' || pathname === '/candidate/jobs')) {
      return true;
    }
    if (href === '/candidate/applications' && (pathname.startsWith('/candidate/applications') || pathname.startsWith('/candidate/profile'))) {
      return true;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      {/* 1. TOP HEADER TRẮNG */}
      <header className="w-full sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
        <div className="w-full max-w-full px-4 sm:px-8 h-16 flex items-center justify-between">
          {/* Left: Brand & Mobile Toggle */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
              aria-label="Toggle Navigation"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/candidate/jobs" className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-md shadow-blue-500/20 shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                    Enterprise ATS
                  </span>
                  <span className="bg-blue-50 text-blue-700 border border-blue-200/80 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Candidate Workspace
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                  Cổng Thông Tin Ứng Viên & Theo Dõi Tuyển Dụng
                </p>
              </div>
            </Link>
          </div>

          {/* Right: Notification Bell & Profile Dropdown */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Quick public job portal link */}
            <Link
              href="/jobs"
              target="_blank"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              <span>Xem Cổng Ngoài</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>

            {/* Notification Bell */}
            <Link
              href="/candidate/interviews"
              className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center cursor-pointer relative"
              title="Thông báo lịch hẹn và thư mời"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-blue-600 rounded-full ring-2 ring-white animate-pulse" />
            </Link>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2.5 p-1.5 pl-2 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-sm shadow-blue-500/20 overflow-hidden ring-2 ring-blue-50">
                  {candidateProfile.avatarUrl ? (
                    <img
                      src={candidateProfile.avatarUrl}
                      alt={candidateProfile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    candidateProfile.initials
                  )}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-extrabold text-slate-900 leading-tight">
                    {candidateProfile.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {candidateProfile.code} &bull; Ứng viên
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="font-extrabold text-slate-900">{candidateProfile.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                      {candidateProfile.email}
                    </div>
                    <div className="text-[10px] text-blue-600 font-bold mt-1 inline-flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-md">
                      <ShieldCheck className="w-3 h-3 text-blue-600" />
                      <span>{candidateProfile.title}</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/candidate/applications"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-slate-700 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Hồ sơ ứng tuyển & Tracking</span>
                    </Link>

                    <Link
                      href="/candidate/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-slate-700 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
                    >
                      <UserCircle className="w-4 h-4 text-slate-400" />
                      <span>Thông tin cá nhân & CV</span>
                    </Link>

                    <Link
                      href="/candidate/interviews"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-slate-700 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
                    >
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>Lịch hẹn phỏng vấn</span>
                    </Link>

                    <Link
                      href="/candidate/offers"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-slate-700 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
                    >
                      <Award className="w-4 h-4 text-slate-400" />
                      <span>Thư mời nhận việc (Offer)</span>
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 font-bold cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất tài khoản</span>
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
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-30 lg:hidden"
          />
        )}

        {/* FLOATING SIDEBAR: Dùng class chuẩn ml-6 mt-6 w-64 bg-white rounded-2xl p-4 */}
        <aside
          className={clsx(
            'fixed lg:sticky top-20 z-40 h-[calc(100vh-6.5rem)] w-64 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 shrink-0 flex flex-col overflow-y-auto ml-4 sm:ml-6 mt-6 mb-6 transition-transform duration-200 select-none',
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-[120%] lg:translate-x-0'
          )}
        >
          {/* 1. Danh sách mục Menu chính */}
          <div className="space-y-1.5">
            <div className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">
              MENU ỨNG VIÊN
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
                      'flex items-center justify-between gap-3 px-4 py-3 transition-all duration-200 ease-in-out text-xs cursor-pointer group',
                      active
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold rounded-full'
                        : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-full font-medium'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={clsx(
                          'w-4 h-4 shrink-0 transition-colors',
                          active ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                        )}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={clsx(
                          'text-[10px] font-extrabold px-2 py-0.5 rounded-full',
                          active
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
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

          {/* 1. Khối đẩy xuống đáy (Spacer) */}
          <div className="flex-1 min-h-4"></div>

          {/* 2. Nhóm menu "CÁ NHÂN" */}
          <div className="space-y-1 pt-2">
            <div className="text-xs font-bold text-slate-400 mb-2 uppercase px-3">
              CÁ NHÂN
            </div>
            <div className="space-y-1">
              <Link
                href="/candidate/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 transition-all duration-200 ease-in-out text-xs cursor-pointer group',
                  pathname === '/candidate/profile'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold rounded-full'
                    : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-full font-medium'
                )}
              >
                <User
                  className={clsx(
                    'w-4 h-4 shrink-0 transition-colors',
                    pathname === '/candidate/profile' ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                  )}
                />
                <span>Hồ sơ cá nhân</span>
              </Link>

              <Link
                href="/candidate/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 transition-all duration-200 ease-in-out text-xs cursor-pointer group',
                  pathname === '/candidate/settings' || pathname === '/candidate/notifications'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold rounded-full'
                    : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-full font-medium'
                )}
              >
                <Bell
                  className={clsx(
                    'w-4 h-4 shrink-0 transition-colors',
                    pathname === '/candidate/settings' || pathname === '/candidate/notifications'
                      ? 'text-white'
                      : 'text-slate-400 group-hover:text-slate-700'
                  )}
                />
                <span>Cấu hình thông báo</span>
              </Link>
            </div>
          </div>

          {/* 3. Khối "Trạng thái máy chủ" (Server Status) */}
          <hr className="my-4 border-slate-100" />

          <div className="bg-emerald-50/50 rounded-2xl p-4 flex flex-col gap-1 border border-emerald-100/50 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-semibold text-slate-800">Trạng thái máy chủ</span>
              <span className="ml-auto bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Online
              </span>
            </div>
            <p className="text-xs text-emerald-600/80 pl-4">Hệ thống hoạt động bình thường</p>
          </div>
        </aside>

        {/* MAIN CONTENT WRAPPER */}
        <main className="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-6 lg:pl-4 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
