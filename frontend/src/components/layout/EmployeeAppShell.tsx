"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Gift
} from "lucide-react";
import { authService } from "@/features/auth/services/auth.service";
import { useNotifications, unreadLabel } from "@/hooks/useNotifications";

interface EmployeeAppShellProps {
  children: React.ReactNode;
  activeTab?: "home" | "jobs" | "referral-new" | "my-referrals" | "notifications" | "profile" | "notification-settings";
}

export function EmployeeAppShell({ children, activeTab }: EmployeeAppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notifications = useNotifications();
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [employeeProfile, setEmployeeProfile] = useState({
    name: "Nhân viên",
    email: "",
    avatarUrl: "",
    title: "Nhân viên nội bộ",
    department: "Phòng Công Nghệ",
  });

  useEffect(() => {
    const loadAvatar = () => {
      const u = authService.getUserInfo();
      if (u) {
        const saved = authService.getUserAvatar(u.id);
        setAvatarUrl(saved || u.avatar_url || null);
      } else {
        setAvatarUrl(null);
      }
    };
    loadAvatar();
    window.addEventListener("avatar_updated", loadAvatar);
    return () => window.removeEventListener("avatar_updated", loadAvatar);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setEmployeeProfile({
            name: user.full_name || "Nhân viên",
            email: user.email || "",
            avatarUrl: user.avatar_url || "",
            title: user.job_title || "Nhân viên nội bộ",
            department: (user as any).department || "Phòng Công Nghệ",
          });
          const saved = authService.getUserAvatar(user.id);
          setAvatarUrl(saved || user.avatar_url || null);
        }
      } catch (err) {
        const local = authService.getUserInfo();
        if (local) {
          setEmployeeProfile({
            name: local.full_name || "Nhân viên",
            email: local.email || "",
            avatarUrl: local.avatar_url || "",
            title: local.job_title || "Nhân viên nội bộ",
            department: (local as any).department || "Phòng Công Nghệ",
          });
          const saved = authService.getUserAvatar(local.id);
          setAvatarUrl(saved || local.avatar_url || null);
        }
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    authService.logout();
    router.push("/login");
  };

  const navGroups = [
    {
      label: "TỔNG QUAN",
      items: [
        { id: "home", label: "Trang chủ", href: "/employee/dashboard", icon: Home },
        { id: "jobs", label: "Vị trí đang tuyển", href: "/employee/jobs", icon: Briefcase },
        { id: "referral-new", label: "Giới thiệu ứng viên", href: "/employee/referrals/new", icon: UserPlus },
        { id: "my-referrals", label: "Giới thiệu của tôi", href: "/employee/referrals", icon: CheckSquare },
        { id: "notifications", label: "Thông báo", href: "/employee/notifications", icon: Bell },
      ],
    },
    {
      label: "CÁ NHÂN",
      items: [
        { id: "profile", label: "Hồ sơ cá nhân", href: "/employee/profile", icon: UserIcon },
        { id: "notification-settings", label: "Cài đặt thông báo", href: "/employee/notification-settings", icon: Settings },
      ],
    },
  ];

  const isCurrentTab = (itemHref: string, itemId: string) => {
    if (activeTab) return activeTab === itemId;
    return pathname === itemHref || pathname.startsWith(itemHref + "/");
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-800 flex flex-col font-sans antialiased">
      {/* TOP HEADER */}
      <header className="h-16 bg-white border-b border-gray-100 sticky top-0 z-40 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-[0_2px_15px_rgb(0,0,0,0.02)]">
        {/* Left: Brand & Global Search */}
        <div className="flex items-center gap-6 flex-1 max-w-3xl">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/employee/dashboard" className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#4285F4] text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-blue-500/20">
              ATS
            </div>
            <div className="hidden sm:block">
              <div className="font-extrabold text-sm text-slate-900 tracking-tight leading-none flex items-center gap-2">
                Hệ Thống Tuyển Dụng Nội Bộ
              </div>
            </div>
          </Link>

          {/* Top Search Bar */}
          <div className="relative w-full hidden md:block max-w-md ml-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Tìm kiếm vị trí, phòng ban, tin tuyển dụng..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#4285F4] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Right: Quick Links & Profile Dropdown */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 border-r border-gray-200 pr-4 mr-1">
            <Link
              href="/admin/dashboard"
              className="px-3 py-1.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 border border-gray-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Workspace HR</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <Link
              href="/jobs"
              target="_blank"
              className="px-3 py-1.5 rounded-xl bg-blue-50 text-[#4285F4] hover:bg-blue-100 border border-blue-100 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Cổng Việc Làm</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 relative cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {notifications.unread > 0 && (
                <span className="min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center absolute top-1 right-1 ring-2 ring-white">
                  {unreadLabel(notifications.unread)}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 pb-2 border-b border-gray-100 flex items-center justify-between">
                  <h4 className="font-extrabold text-xs text-slate-900">Thông báo mới</h4>
                  <Link href="/employee/notifications" className="text-[11px] font-bold text-[#4285F4]">
                    Xem tất cả &rarr;
                  </Link>
                </div>
                <div className="divide-y divide-gray-50 text-xs">
                  {notifications.items.length === 0 ? (
                    <div className="p-4 text-center text-[11px] text-slate-400">Chưa có thông báo nào.</div>
                  ) : (
                    notifications.items.map((n) => (
                      <Link
                        key={n.id}
                        href={n.link || "/employee/notifications"}
                        onClick={() => { setIsNotificationOpen(false); if (!n.is_read) notifications.markRead(n.id); }}
                        className={`block p-3 hover:bg-slate-50 ${n.is_read ? "" : "bg-blue-50/40"}`}
                      >
                        <p className="font-bold text-slate-800">{n.title}</p>
                        {n.message && <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>}
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 pl-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-gray-200 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold flex items-center justify-center text-xs border-2 border-white shadow-xs overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={employeeProfile.name} className="w-full h-full object-cover" />
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
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm overflow-hidden shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={employeeProfile.name} className="w-full h-full object-cover" />
                    ) : (
                      employeeProfile.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">{employeeProfile.name}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[150px]">{employeeProfile.email}</div>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#4285F4] text-[10px] font-bold border border-blue-100">
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
                    href="/employee/notification-settings"
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Cài đặt thông báo</span>
                  </Link>
                </div>
                <div className="border-t border-gray-100 pt-1">
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

      {/* BODY LAYOUT: SIDEBAR + MAIN CONTENT */}
      <div className="flex-1 max-w-full flex">
        {/* DESKTOP SIDEBAR */}
        <aside
          className={`fixed lg:sticky top-16 z-30 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-100 shrink-0 flex flex-col justify-between p-4 overflow-y-auto transition-transform duration-200 ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <nav className="space-y-6">
            {navGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-1">
                <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                  {group.label}
                </div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isCurrentTab(item.href, item.id);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-150 ${
                        active
                          ? "bg-blue-50 text-[#4285F4] font-extrabold border-l-4 border-[#4285F4]"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? "text-[#4285F4]" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Bottom Referral Banner Card */}
          <div className="pt-4 border-t border-gray-100">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 rounded-2xl p-4 border border-blue-100 text-xs space-y-2 relative overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-[#4285F4] flex items-center justify-center font-bold mb-1">
                <Gift className="w-5 h-5 text-[#4285F4]" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-xs">Giới thiệu ứng viên nội bộ</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                Cơ hội cho đồng nghiệp, Cơ hội cho công ty.
              </p>
              <Link
                href="/employee/referrals/new"
                className="w-full py-2 px-3 rounded-xl bg-[#4285F4] text-white hover:bg-blue-600 text-[11px] font-bold text-center block transition-all shadow-xs"
              >
                Giới thiệu ngay &rarr;
              </Link>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
