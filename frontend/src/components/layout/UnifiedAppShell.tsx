'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { authService } from '@/features/auth/services/auth.service';
import {
  LayoutDashboard,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  Users,
  Briefcase,
  Calendar,
  ClipboardCheck,
  CheckCircle2,
  Award,
  UserCheck,
  KeyRound,
  History,
  LogOut,
  Bell,
  ChevronDown,
  Menu,
  X,
  User as UserIcon,
} from 'lucide-react';
import { getAggregatedMenuGroups, MenuGroup } from '@/lib/navigation/menu-config';
import { useNotifications, unreadLabel } from '@/hooks/useNotifications';

interface RoleObj {
  code: string;
  name: string;
}

interface UserData {
  id: number;
  full_name: string;
  email: string;
  role?: string;
  roles?: RoleObj[];
  permissions?: string[];
  avatar_url?: string;
  department?: string;
  job_title?: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  Users,
  Briefcase,
  Calendar,
  ClipboardCheck,
  CheckCircle2,
  Award,
  UserCheck,
  KeyRound,
  History,
};

export default function UnifiedAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [mounted, setMounted] = useState(false);
  const notifications = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Fetch user profile from /auth/me or localStorage cache
    const cachedUserStr = localStorage.getItem('user') || localStorage.getItem('user_info');
    if (cachedUserStr) {
      try {
        setUser(JSON.parse(cachedUserStr));
      } catch (e) {
        /* ignore */
      }
    }

    if (authService.getToken()) {
      // Shared client: env-configured base URL, refresh-on-expiry and the 401/403 policy.
      authService.getCurrentUser()
        .then((data) => {
          setUser(data as unknown as UserData);
          localStorage.setItem('user', JSON.stringify(data));
          localStorage.setItem('user_info', JSON.stringify(data));
        })
        .catch(() => undefined)
    }

    const onAvatarUpdated = () => {
      const u = authService.getUserInfo();
      if (u) {
        setUser((prev) => prev ? { ...prev, avatar_url: authService.getUserAvatar(u.id) || u.avatar_url } : null);
      }
    };
    window.addEventListener('avatar_updated', onAvatarUpdated);
    return () => window.removeEventListener('avatar_updated', onAvatarUpdated);
  }, []);

  const handleLogout = async () => {
    // Revoke the server-side session too, not just the local copy of the token.
    await authService.logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const isSuperAdmin = Boolean(
    user?.roles?.some((r: any) => (typeof r === 'string' ? r === 'admin' : r.code === 'admin')) ||
    user?.role?.includes('admin')
  );

  const menuGroups: MenuGroup[] = getAggregatedMenuGroups(
    user?.permissions || null,
    isSuperAdmin
  );

  // Formatting multi-role badge string
  const roleDisplayNames = user?.roles?.map((r: any) => (typeof r === 'string' ? r : r.name)) || [user?.job_title || 'Thành viên'];
  const primaryRoleBadge = roleDisplayNames.join(' · ');

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0F172A] flex flex-col font-sans">
      {/* HEADER BAR */}
      <header className="h-16 bg-white border-b border-[#E2E8F0] sticky top-0 z-40 px-4 lg:px-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-[#64748B] hover:text-[#0F172A] rounded-lg focus:outline-none"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link href="/workspace" className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-[#2563EB] rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
              R
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-base text-[#0F172A] leading-tight">RecruitHub</h1>
              <p className="text-xs text-[#64748B]">Hệ thống Tuyển dụng Nội bộ</p>
            </div>
          </Link>
        </div>

        {/* User profile & Roles Badge */}
        {mounted && user && (
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Multi-role badge */}
            <div className="hidden md:flex items-center bg-[#EFF6FF] text-[#2563EB] text-xs font-semibold px-3 py-1.5 rounded-full border border-[#BFDBFE]">
              <span className="w-2 h-2 rounded-full bg-[#2563EB] mr-2 animate-pulse"></span>
              <span className="max-w-[280px] truncate" title={primaryRoleBadge}>
                {primaryRoleBadge}
              </span>
            </div>

            {/* Notification bell */}
            <Link href="/employee/notifications" className="p-2 text-[#64748B] hover:text-[#0F172A] rounded-full hover:bg-slate-100 relative transition-colors" aria-label="Thông báo">
              <Bell size={20} />
              {notifications.unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadLabel(notifications.unread)}
                </span>
              )}
            </Link>

            {/* User Avatar Menu dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none"
              >
                <div className="w-9 h-9 rounded-full bg-[#2563EB] text-white font-semibold flex items-center justify-center overflow-hidden border border-blue-200">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user.full_name?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-[#0F172A] leading-tight">
                    {user.full_name}
                  </div>
                  <div className="text-[11px] text-[#64748B]">{user.email}</div>
                </div>
                <ChevronDown size={14} className="text-[#64748B]" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E2E8F0] rounded-xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 md:hidden">
                    <p className="text-xs font-bold text-[#0F172A]">{user.full_name}</p>
                    <p className="text-[11px] text-[#64748B] truncate">{user.email}</p>
                    <p className="text-[11px] text-[#2563EB] font-medium mt-1">{primaryRoleBadge}</p>
                  </div>

                  <Link
                    href="/workspace"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <LayoutDashboard size={16} className="text-slate-500" />
                    <span>Trang tổng quan</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center space-x-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100 mt-1"
                  >
                    <LogOut size={16} className="text-red-500" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR NAVIGATION (White + Blue) */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-[#E2E8F0] flex flex-col transform transition-transform duration-200 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
            {menuGroups.map((group) => (
              <div key={group.id} className="space-y-1">
                <h3 className="px-3 text-[11px] font-bold text-[#64748B] tracking-wider uppercase">
                  {group.title}
                </h3>
                <div className="mt-1 space-y-0.5">
                  {group.items.map((item) => {
                    const IconComponent = ICON_MAP[item.iconName] || LayoutDashboard;
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold border-l-4 border-[#2563EB]'
                            : 'text-[#64748B] hover:bg-slate-50 hover:text-[#0F172A]'
                        }`}
                      >
                        <IconComponent
                          size={18}
                          className={isActive ? 'text-[#2563EB]' : 'text-[#64748B]'}
                        />
                        <span className="flex-1">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-[#E2E8F0] bg-slate-50/50">
            <div className="text-[11px] text-[#64748B] text-center">
              Internal Recruitment Platform v2.0
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
