'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Briefcase,
  Activity,
  Calendar,
  MailOpen,
  User,
  Bell,
  LogOut,
  ChevronDown,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { authService } from '@/features/auth/services/auth.service';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [candidateProfile, setCandidateProfile] = useState({
    name: 'Nguyễn Văn A',
    email: 'nguyen.van.a@gmail.com',
    role: 'Ứng viên',
    badge: 'Tài khoản Ứng viên',
  });

  // Tải avatar đã lưu từ localStorage nếu có
  useEffect(() => {
    const loadAvatar = () => {
      const saved = localStorage.getItem('user_avatar_url');
      if (saved) setAvatarUrl(saved);
    };
    loadAvatar();
    window.addEventListener('avatar_updated', loadAvatar);
    return () => window.removeEventListener('avatar_updated', loadAvatar);
  }, []);

  // Lấy thông tin người dùng từ authService nếu có đăng nhập
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setCandidateProfile({
            name: user.full_name || 'Nguyễn Văn A',
            email: user.email || 'nguyen.van.a@gmail.com',
            role: 'Ứng viên',
            badge: 'Tài khoản Ứng viên',
          });
          if (user.avatar_url && !localStorage.getItem('user_avatar_url')) {
            setAvatarUrl(user.avatar_url);
          }
        }
      } catch {
        // Fallback mặc định
      }
    };
    fetchUser();
  }, []);

  // Xử lý click ra ngoài để đóng User Dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  // Cấu trúc danh sách Menu chia theo từng nhóm chuẩn Admin
  const navGroups: NavGroup[] = [
    {
      label: 'TỔNG QUAN',
      items: [
        {
          id: 'overview',
          label: 'Tổng quan',
          href: '/candidate',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: 'QUẢN LÝ ỨNG TUYỂN',
      items: [
        {
          id: 'jobs',
          label: 'Vị trí tuyển dụng',
          href: '/candidate/jobs',
          icon: Briefcase,
        },
        {
          id: 'tracking',
          label: 'Tiến độ ứng tuyển',
          href: '/candidate/tracking',
          icon: Activity,
        },
      ],
    },
    {
      label: 'LỊCH & KẾT QUẢ',
      items: [
        {
          id: 'interviews',
          label: 'Lịch phỏng vấn',
          href: '/candidate/interviews',
          icon: Calendar,
        },
        {
          id: 'offers',
          label: 'Thư mời nhận việc',
          href: '/candidate/offers',
          icon: MailOpen,
        },
      ],
    },
    {
      label: 'CÁ NHÂN',
      items: [
        {
          id: 'profile',
          label: 'Hồ sơ cá nhân',
          href: '/candidate/profile',
          icon: User,
        },
        {
          id: 'settings',
          label: 'Cấu hình thông báo',
          href: '/candidate/settings',
          icon: Bell,
        },
      ],
    },
  ];

  // Kiểm tra route active
  const isCurrentTab = (itemHref: string) => {
    if (itemHref === '/candidate') {
      return pathname === '/candidate';
    }
    if (itemHref === '/candidate/tracking') {
      return pathname === '/candidate/tracking' || pathname.startsWith('/candidate/track');
    }
    if (itemHref === '/candidate/interviews') {
      return pathname === '/candidate/interviews' || pathname.startsWith('/candidate/interview');
    }
    if (itemHref === '/candidate/offers') {
      return pathname === '/candidate/offers' || pathname.startsWith('/candidate/offer');
    }
    return pathname === itemHref || pathname.startsWith(itemHref + '/');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-800">
      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      {/* 2. THANH MENU DỌC BÊN TRÁI (SIDEBAR) */}
      <aside
        className={clsx(
          'fixed lg:static inset-y-0 left-0 z-40 w-[280px] bg-white border-r border-slate-200 flex flex-col h-full shrink-0 transition-transform duration-200 ease-in-out',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header Logo (Hàng đầu tiên): h-20 flex items-center px-6 gap-3 border-b border-slate-100 */}
        <div className="h-20 flex items-center px-6 gap-3 border-b border-slate-100 shrink-0">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-blue-500/20 shrink-0">
            ATS
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-sm text-slate-900 tracking-tight leading-tight truncate">
              Hệ Thống Tuyển Dụng
            </div>
            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mt-0.5">
              CANDIDATE PORTAL
            </div>
          </div>
        </div>

        {/* Danh sách Menu (Scrollable) */}
        <nav className="flex-1 overflow-y-auto py-2">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx}>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-6 px-6">
                {group.label}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isCurrentTab(item.href);

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={clsx(
                        'flex items-center gap-3 px-4 py-2.5 mx-4 rounded-xl transition-all font-medium text-xs sm:text-sm group',
                        active
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-200 font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      )}
                    >
                      <Icon
                        className={clsx(
                          'w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105',
                          active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Widget (Trạng thái máy chủ - Online nền xanh ngọc bg-emerald-50 y hệt Admin) */}
        <div className="p-4 border-t border-slate-100 shrink-0">
          <div className="bg-emerald-50 rounded-2xl p-3.5 border border-emerald-100/80 text-xs space-y-1 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Trạng thái máy chủ</span>
              </div>
              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Online
              </span>
            </div>
            <p className="text-[11px] text-emerald-700/80 font-medium leading-relaxed">
              Hệ thống hoạt động bình thường
            </p>
          </div>
        </div>
      </aside>

      {/* 3. KHU VỰC NỘI DUNG PHẢI & TOPBAR (RIGHT CONTENT) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar (Header trên cùng): h-20 flex justify-end items-center px-8 gap-4 bg-slate-50 */}
        <header className="h-20 flex justify-between lg:justify-end items-center px-6 md:px-8 gap-4 bg-slate-50 border-b border-slate-200/60 shrink-0">
          {/* Mobile hamburger button */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-white border border-slate-200/80 cursor-pointer transition-colors"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                ATS
              </div>
              <span className="font-extrabold text-xs text-slate-900">Candidate Portal</span>
            </div>
          </div>

          {/* Right Action Widgets */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Nút "Cổng Việc Làm" (Outline button kèm icon ExternalLink) */}
            <Link
              href="/candidate/jobs"
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <span>Cổng Việc Làm</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            {/* Chuông thông báo: Icon Bell có chấm đỏ góc trên */}
            <Link
              href="/candidate/settings"
              className="p-2.5 rounded-xl text-slate-500 hover:bg-white hover:text-slate-800 transition-colors relative cursor-pointer"
              title="Thông báo hệ thống"
            >
              <Bell className="w-5 h-5" />
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 ring-2 ring-slate-50"></span>
            </Link>

            {/* User Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pl-2 rounded-2xl hover:bg-white transition-all border border-transparent hover:border-slate-200 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-xs border border-blue-200 shadow-2xs overflow-hidden shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={candidateProfile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    candidateProfile.name.charAt(0)
                  )}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {candidateProfile.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold">
                    {candidateProfile.role}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {/* Dropdown Menu Card */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 top-full w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Khối thông tin: Tên, Email, Badge "Tài khoản Ứng viên" */}
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm overflow-hidden shrink-0">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={candidateProfile.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        candidateProfile.name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 truncate">
                        {candidateProfile.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                        {candidateProfile.email}
                      </div>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100">
                        {candidateProfile.badge}
                      </span>
                    </div>
                  </div>

                  {/* Các menu */}
                  <div className="py-1 text-xs">
                    <Link
                      href="/candidate/profile"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Hồ sơ cá nhân</span>
                    </Link>
                    <Link
                      href="/candidate/settings"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                    >
                      <Bell className="w-4 h-4 text-slate-400" />
                      <span>Cấu hình thông báo</span>
                    </Link>
                  </div>

                  {/* Divider & Nút Đăng xuất */}
                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Đăng xuất hệ thống</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Vùng chứa Page Content (Children): Có thể cuộn độc lập với thanh Sidebar */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
