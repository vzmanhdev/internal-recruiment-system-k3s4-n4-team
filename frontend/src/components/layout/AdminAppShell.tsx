"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  ShieldCheck,
  Lock,
  KeyRound,
  FileSpreadsheet,
  ScrollText,
  Sliders,
  Database,
  Bell,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
  Briefcase
} from "lucide-react";
import { authService } from "@/features/auth/services/auth.service";
import { useAuth } from "@/providers/auth-provider";
import clsx from "clsx";


interface AdminAppShellProps {
  children: React.ReactNode;
  activeTab?: "dashboard" | "users" | "import" | "roles" | "permissions" | "master-data" | "audit-logs" | "profile" | "notification-settings";
}

export function AdminAppShell({ children, activeTab }: AdminAppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isAuthInitialized, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadAvatar = () => {
      const saved = localStorage.getItem("user_avatar_url");
      if (saved) setAvatarUrl(saved);
      else if (currentUser?.avatar_url) setAvatarUrl(currentUser.avatar_url);
    };
    loadAvatar();
    window.addEventListener("avatar_updated", loadAvatar);
    return () => window.removeEventListener("avatar_updated", loadAvatar);
  }, [currentUser]);

  const adminProfile = {
    name: mounted ? (currentUser?.full_name || "Quản Trị Viên") : "Quản Trị Viên",
    email: currentUser?.email || "admin@company.com",
    avatarUrl: avatarUrl || currentUser?.avatar_url || "",
    role: currentUser?.role || "Quản trị viên Cấp cao (Admin)",
    department: currentUser?.department || "Ban Quản Trị Hệ Thống",
  };


  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };


  const navGroups = [
    {
      label: "TỔNG QUAN",
      items: [
        {
          id: "dashboard",
          label: "Dashboard Quản Trị",
          href: "/admin/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      label: "QUẢN LÝ NGƯỜI DÙNG",
      items: [
        {
          id: "users",
          label: "Danh sách người dùng",
          href: "/admin/users",
          icon: Users,
        },
        {
          id: "import",
          label: "Import nhân sự Excel",
          href: "/admin/users/import",
          icon: FileSpreadsheet,
        },
      ],
    },
    {
      label: "TRUY CẬP & PHÂN QUYỀN",
      items: [
        {
          id: "roles",
          label: "Vai trò (7 Roles)",
          href: "/admin/roles",
          icon: ShieldCheck,
        },
        {
          id: "permissions",
          label: "Ma trận phân quyền RBAC",
          href: "/admin/permissions",
          icon: Lock,
        },
      ],
    },
    {
      label: "DỮ LIỆU HỆ THỐNG",
      items: [
        {
          id: "master-data",
          label: "Danh mục dùng chung",
          href: "/admin/master-data",
          icon: Sliders,
        },
      ],
    },
    {
      label: "GIÁM SÁT",
      items: [
        {
          id: "audit-logs",
          label: "Nhật ký hệ thống (Audit)",
          href: "/admin/audit-logs",
          icon: ScrollText,
        },
      ],
    },
    {
      label: "CÁ NHÂN",
      items: [
        {
          id: "profile",
          label: "Hồ sơ cá nhân",
          href: "/admin/profile",
          icon: UserIcon,
        },
        {
          id: "notification-settings",
          label: "Cấu hình thông báo",
          href: "/admin/notification-settings",
          icon: Bell,
        },
      ],
    },
  ];

  const isCurrentTab = (itemHref: string, itemId: string) => {
    if (activeTab) return activeTab === itemId;
    return pathname === itemHref || pathname.startsWith(itemHref + "/");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      {/* 1. TOP HEADER (100% full width, completely detached from sidebar) */}
      <header className="w-full h-16 bg-white border-b border-slate-100 sticky top-0 z-40 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-xs">
        {/* Left: Brand & Mobile Toggle */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-blue-500/20">
              ATS
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900 tracking-tight leading-none flex items-center gap-2">
                Hệ Thống Tuyển Dụng Nội Bộ
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold uppercase tracking-wider">
                  Admin Console
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                System Administration & Access Control Panel
              </div>
            </div>
          </Link>
        </div>

        {/* Right: Workspace Switcher & Profile Menu */}
        <div className="flex items-center gap-3">
          {/* Quick Workspace Navigation */}
          <div className="hidden md:flex items-center gap-2 border-r border-slate-100 pr-4 mr-1">
            <Link
              href="/hr"
              className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Workspace HR</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <Link
              href="/jobs"
              target="_blank"
              className="px-3 py-1.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Cổng Việc Làm</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Notifications button */}
          <Link
            href="/admin/notification-settings"
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 relative cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 ring-2 ring-white"></span>
          </Link>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 pl-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
            >
              <div suppressHydrationWarning className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-xs border border-blue-200 shadow-xs overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={adminProfile.name} className="w-full h-full object-cover" />
                ) : (
                  adminProfile.name.charAt(0)
                )}
              </div>
              <div className="text-left hidden sm:block" suppressHydrationWarning>
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {adminProfile.name}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold">
                  System Admin
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm overflow-hidden shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={adminProfile.name} className="w-full h-full object-cover" />
                    ) : (
                      adminProfile.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">{adminProfile.name}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[150px]">{adminProfile.email}</div>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100">
                      {adminProfile.role}
                    </span>
                  </div>
                </div>
                <div className="py-1 text-xs">
                  <Link
                    href="/admin/profile"
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>Hồ sơ cá nhân</span>
                  </Link>
                  <Link
                    href="/admin/notification-settings"
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    <Bell className="w-4 h-4 text-slate-400" />
                    <span>Cấu hình thông báo</span>
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

        {/* FLOATING SIDEBAR (Card nổi, bo tròn rounded-2xl, không dính sát mép ml-6 mt-6) */}
        <aside
          className={`fixed lg:sticky top-20 z-30 h-[calc(100vh-6.5rem)] w-64 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 shrink-0 flex flex-col justify-between overflow-y-auto ml-4 sm:ml-6 mt-6 mb-6 transition-transform duration-200 ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-[120%] lg:translate-x-0"
          }`}
        >
          <nav className="space-y-6">
            {navGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-1.5">
                <div className="px-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
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
                      className={clsx(
                        "flex items-center justify-between gap-3 px-4 py-3 font-medium transition-all duration-200 ease-in-out rounded-full text-xs cursor-pointer group",
                        active
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold"
                          : "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={clsx("w-4 h-4 transition-transform duration-200 group-hover:scale-105 shrink-0", active ? "text-white" : "text-slate-400 group-hover:text-slate-600")} />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Thẻ Card nhỏ "Trạng thái máy chủ" ở dưới cùng Sidebar với màu nền xanh ngọc nhạt bg-teal-50 */}
          <div className="pt-3 border-t border-slate-100">
            <div className="bg-teal-50 rounded-2xl p-3.5 border border-teal-100/80 text-xs space-y-1 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-teal-900">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
                  <span>Trạng thái máy chủ</span>
                </div>
                <span className="text-[10px] font-extrabold text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded-full">
                  Online
                </span>
              </div>
              <p className="text-[11px] text-teal-700/80 font-medium leading-relaxed">
                Hệ thống hoạt động bình thường
              </p>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT CONTAINER (mr-6 mt-6 tương xứng với Floating Sidebar) */}
        <main className="flex-1 min-w-0 mx-4 sm:mx-6 lg:ml-6 lg:mr-6 mt-6 mb-6 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
