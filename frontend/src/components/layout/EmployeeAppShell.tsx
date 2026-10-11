'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Briefcase,
  UserPlus,
  CheckSquare,
  Bell,
  User as UserIcon,
  Settings,
  Search,
  LogOut,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
  Gift,
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { authService } from '@/features/auth/services/auth.service';
import clsx from 'clsx';

interface EmployeeAppShellProps {
  children: React.ReactNode;
  activeTab?: string;
}

export function EmployeeAppShell({ children, activeTab }: EmployeeAppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [employeeProfile, setEmployeeProfile] = useState({
    name: 'Hoàng Văn Nhân Viên',
    email: 'employee@company.com',
    avatarUrl: '',
    title: 'Nhân viên nội bộ',
    department: 'Khối Công Nghệ & Phần Mềm',
  });

  // Mock In-app Notifications for User Story 5
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Lịch phỏng vấn sắp tới',
      content: 'Bạn có lịch phỏng vấn lúc 14:00 ngày mai (Vòng chuyên môn).',
      time: '25 phút trước',
      isUnread: true,
      type: 'interview',
    },
    {
      id: 2,
      title: 'Tiến độ hồ sơ Referral',
      content: 'Ứng viên Nguyễn Văn A bạn giới thiệu đã qua vòng CV và chuyển sang phỏng vấn.',
      time: '2 giờ trước',
      isUnread: true,
      type: 'referral',
    },
    {
      id: 3,
      title: 'Vị trí tuyển dụng mới',
      content: 'Vị trí Senior Backend Engineer phòng ban của bạn vừa mở tuyển bổ sung.',
      time: '5 giờ trước',
      isUnread: true,
      type: 'job',
    },
    {
      id: 4,
      title: 'Cập nhật hồ sơ cá nhân',
      content: 'Hồ sơ năng lực của bạn đã được đồng bộ thành công trên hệ thống ATS.',
      time: 'Hôm qua',
      isUnread: false,
      type: 'system',
    },
  ]);

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  useEffect(() => {
    const loadAvatar = () => {
      const saved = localStorage.getItem('user_avatar_url');
      if (saved) {
        setAvatarUrl(saved);
      }
    };
    loadAvatar();
    window.addEventListener('avatar_updated', loadAvatar);
    return () => window.removeEventListener('avatar_updated', loadAvatar);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setEmployeeProfile({
            name: user.full_name || 'Hoàng Văn Nhân Viên',
            email: user.email || 'employee@company.com',
            avatarUrl: user.avatar_url || '',
            title: 'Nhân viên nội bộ',
            department: (user as any).department || 'Khối Công Nghệ & Phần Mềm',
          });
          if (user.avatar_url && !localStorage.getItem('user_avatar_url')) {
            setAvatarUrl(user.avatar_url);
          }
        }
      } catch (err) {
        // Fallback to demo profile
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
  };

  // Menu Items for Employee Workspace
  const navGroups = [
    {
      label: 'TỔNG QUAN',
      items: [
        { id: 'home', label: 'Trang chủ', href: '/employee', icon: Home },
        { id: 'jobs', label: 'Vị trí đang tuyển', href: '/employee/jobs', icon: Briefcase },
        { id: 'my-referrals', label: 'Giới thiệu ứng viên', href: '/employee/referrals', icon: Gift },
        { id: 'interviews', label: 'Lịch phỏng vấn', href: '/employee/interviews', icon: Calendar },
        { id: 'notifications', label: 'Thông báo', href: '/employee/notifications', icon: Bell },
      ],
    },
    {
      label: 'CÁ NHÂN',
      items: [
        { id: 'profile', label: 'Hồ sơ cá nhân', href: '/employee/profile', icon: UserIcon },
        { id: 'settings', label: 'Cài đặt thông báo', href: '/employee/settings', icon: Settings },
      ],
    },
  ];

  const isCurrentTab = (itemHref: string, itemId: string) => {
    if (activeTab) return activeTab === itemId;
    if (itemId === 'home') {
      return pathname === '/employee' || pathname === '/employee/dashboard';
    }
    return pathname === itemHref || pathname.startsWith(itemHref + '/');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      {/* 1. TOP HEADER (100% full width, detached from sidebar) */}
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-xs">
        {/* Left: Brand & Global Search */}
        <div className="flex items-center gap-6 flex-1 max-w-3xl">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/employee" className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-blue-500/20">
              ATS
            </div>
            <div className="hidden sm:block">
              <div className="font-extrabold text-sm text-slate-900 tracking-tight leading-none flex items-center gap-2">
                <span>Hệ Thống Tuyển Dụng Nội Bộ</span>
                <span className="bg-blue-50 text-blue-700 border border-blue-200/60 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Employee Portal
                </span>
              </div>
            </div>
          </Link>

          {/* Top Search Bar */}
          <div className="relative w-full hidden md:block max-w-md ml-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Tìm kiếm vị trí, phòng ban, tin tuyển dụng..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Right: Quick Links, Notification Bell & Profile Dropdown */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 border-r border-slate-200 pr-4 mr-1">
            <Link
              href="/jobs"
              target="_blank"
              className="px-3 py-1.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Cổng Việc Làm</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* User Story 5: Notification Bell with Ping Animation & Rich Dropdown */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="p-2.5 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-100 relative cursor-pointer transition-colors"
              title="Thông báo mới"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 pointer-events-none">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 ring-2 ring-white" />
                </span>
              )}
            </button>

            {/* Notification Dropdown Menu */}
            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-xs text-slate-900">Thông báo mới</h4>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-black border border-rose-100">
                        {unreadCount} chưa đọc
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      Đã đọc tất cả
                    </button>
                  )}
                </div>

                <div className="divide-y divide-slate-100 text-xs max-h-80 overflow-y-auto">
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      className={clsx(
                        'p-3.5 hover:bg-slate-50/80 cursor-pointer transition-colors flex items-start gap-3',
                        item.isUnread ? 'bg-blue-50/40' : 'bg-white'
                      )}
                    >
                      <div className="mt-0.5 shrink-0">
                        {item.type === 'interview' ? (
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                            <Calendar className="w-3.5 h-3.5" />
                          </div>
                        ) : item.type === 'referral' ? (
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        ) : item.type === 'job' ? (
                          <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                            <Briefcase className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center font-bold">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p
                            className={clsx(
                              'text-xs truncate',
                              item.isUnread
                                ? 'font-black text-slate-900'
                                : 'font-semibold text-slate-700'
                            )}
                          >
                            {item.title}
                          </p>
                          {item.isUnread && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                          {item.content}
                        </p>
                        <span className="text-[10px] text-slate-400 font-medium block mt-1">
                          {item.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 px-4 border-t border-slate-100 text-center">
                  <Link
                    href="/employee/notifications"
                    onClick={() => setIsNotificationOpen(false)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                  >
                    <span>Xem tất cả thông báo</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 pl-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold flex items-center justify-center text-xs border-2 border-white shadow-xs overflow-hidden">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={employeeProfile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  employeeProfile.name.charAt(0)
                )}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {employeeProfile.name}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold">
                  {employeeProfile.title}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm overflow-hidden shrink-0">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={employeeProfile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      employeeProfile.name.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 truncate">
                      {employeeProfile.name}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {employeeProfile.email}
                    </div>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
                      {employeeProfile.department}
                    </span>
                  </div>
                </div>
                <div className="py-1 text-xs">
                  <Link
                    href="/employee/profile"
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>Hồ sơ cá nhân</span>
                  </Link>
                  <Link
                    href="/employee/settings"
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Cài đặt thông báo</span>
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

        {/* FLOATING SIDEBAR */}
        <aside
          className={clsx(
            'fixed lg:sticky top-20 z-30 h-[calc(100vh-6.5rem)] w-64 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 shrink-0 flex flex-col justify-between overflow-y-auto ml-4 sm:ml-6 mt-6 mb-6 transition-transform duration-200 select-none',
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-[120%] lg:translate-x-0'
          )}
        >
          {/* Top Nav Area with flex-1 */}
          <div className="flex-1 space-y-6">
            <nav className="space-y-6">
              {navGroups.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-1.5">
                  <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                    {group.label}
                  </div>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = isCurrentTab(item.href, item.id);
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
                </div>
              ))}
            </nav>

            {/* Quick Action Button in Sidebar */}
            <div className="pt-1">
              <Link
                href="/employee/referrals"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100/80 text-blue-700 font-bold text-xs border border-blue-200/80 transition-all shadow-xs cursor-pointer"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>+ Giới Thiệu Ứng Viên</span>
              </Link>
            </div>
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-slate-100" />

          {/* Server Status Widget at Bottom */}
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

        {/* 3. MAIN CONTENT CONTAINER */}
        <main className="flex-1 min-w-0 mx-4 sm:mx-6 lg:ml-6 lg:mr-6 mt-6 mb-6 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
