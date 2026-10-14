"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Building2,
  Briefcase,
  Award,
  HelpCircle,
  ListFilter,
  FileText,
  GitMerge,
  TrendingUp,
  Megaphone,
  UserCheck,
  FolderGit2,
  Calendar,
  ClipboardCheck,
  FileSignature,
  UserPlus,
  Globe,
  Mail,
  Send,
  Bell,
  BarChart3,
  Filter,
  Clock,
  PieChart,
  ScrollText,
  FileSpreadsheet,
  SlidersHorizontal,
  CircleUserRound,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { authService } from "@/features/auth/services/auth.service";
import { getAggregatedMenu, MenuGroup } from "@/lib/menu-aggregator";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Building2,
  Briefcase,
  Award,
  HelpCircle,
  ListFilter,
  FileText,
  GitMerge,
  TrendingUp,
  Megaphone,
  UserCheck,
  FolderGit2,
  Calendar,
  ClipboardCheck,
  FileSignature,
  UserPlus,
  Globe,
  Mail,
  Send,
  Bell,
  BarChart3,
  Filter,
  Clock,
  PieChart,
  ScrollText,
  FileSpreadsheet,
  SlidersHorizontal,
  CircleUserRound,
};

interface AdminAppShellProps {
  children: React.ReactNode;
  activeTab?: string;
}

export function AdminAppShell({ children, activeTab }: AdminAppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>(["admin"]);

  const [adminProfile, setAdminProfile] = useState({
    name: "System Admin",
    email: "admin@company.com",
    avatarUrl: "",
    role: "Quản trị viên Cấp cao",
    department: "Ban Công Nghệ & Quản Trị Hệ Thống",
  });

  useEffect(() => {
    const loadAvatar = () => {
      const saved = localStorage.getItem("user_avatar_url");
      if (saved) setAvatarUrl(saved);
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
          const roles = (user.roles && user.roles.length > 0 ? user.roles : [user.role || "admin"])
            .map((role) => role.trim().toLowerCase().replace(/[\s-]+/g, "_"));
          setUserRoles(roles);

          setAdminProfile({
            name: user.full_name || "System Admin",
            email: user.email || "admin@company.com",
            avatarUrl: user.avatar_url || "",
            role: roles.includes("admin") ? "Quản trị viên Cấp cao (Admin)" : roles.join(", ").toUpperCase(),
            department: user.department || "Ban Quản Trị Hệ Thống",
          });
          if (user.avatar_url && !localStorage.getItem("user_avatar_url")) {
            setAvatarUrl(user.avatar_url);
          }
        }
      } catch {
        setUserRoles(["admin"]);
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
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    authService.logout();
    router.push("/login");
  };

  const navGroups: MenuGroup[] = getAggregatedMenu(userRoles);

  const isCurrentTab = (itemHref: string, itemId: string) => {
    if (activeTab) return activeTab === itemId;
    return pathname === itemHref || pathname.startsWith(itemHref + "/");
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-800 flex flex-col font-sans antialiased">
      {/* 1. TOP HEADER (64px) */}
      <header className="h-16 bg-white border-b border-gray-100 sticky top-0 z-40 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-[0_2px_15px_rgb(0,0,0,0.02)]">
        {/* Left: Brand & Mobile Toggle */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#4285F4] text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-blue-500/20">
              ATS
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900 tracking-tight leading-none flex items-center gap-2">
                Hệ Thống Tuyển Dụng Nội Bộ
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#4285F4] border border-blue-100 text-[10px] font-bold uppercase tracking-wider">
                  {userRoles.includes("admin") ? "Admin Console" : "Workspace"}
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
          <div className="hidden md:flex items-center gap-2 border-r border-gray-200 pr-4 mr-1">
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
              className="px-3 py-1.5 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 border border-gray-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Cổng Việc Làm</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

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
              className="flex items-center gap-2.5 p-1.5 pl-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-gray-200 cursor-pointer"
            >
              <div className="relative w-8 h-8 rounded-full bg-blue-100 text-[#4285F4] font-bold flex items-center justify-center text-xs border border-blue-200 shadow-xs overflow-hidden">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt={adminProfile.name} fill sizes="32px" className="object-cover" unoptimized />
                ) : (
                  adminProfile.name.charAt(0)
                )}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {adminProfile.name}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold truncate max-w-[120px]">
                  {adminProfile.role}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm overflow-hidden shrink-0">
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt={adminProfile.name} fill sizes="40px" className="object-cover" unoptimized />
                    ) : (
                      adminProfile.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">{adminProfile.name}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[150px]">{adminProfile.email}</div>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#4285F4] text-[10px] font-bold border border-blue-100">
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

      {/* 2. BODY LAYOUT: SIDEBAR + MAIN CONTENT */}
      <div className="flex-1 max-w-full flex">
        {/* DESKTOP SIDEBAR (240px - White with subtle right border) */}
        <aside
          className={`fixed lg:sticky top-16 z-30 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-100 shrink-0 flex flex-col justify-between p-4 overflow-y-auto transition-transform duration-200 ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <nav className="space-y-5">
            {navGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-1">
                <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  {group.groupName}
                </div>
                {group.items.map((item) => {
                  const Icon = ICON_MAP[item.iconName] || LayoutDashboard;
                  const active = isCurrentTab(item.href, item.id);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                        active
                          ? "bg-blue-50 text-[#4285F4] font-extrabold shadow-xs border-l-4 border-[#4285F4]"
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

          {/* System Health Widget Footer */}
          <div className="pt-4 border-t border-gray-100">
            <div className="bg-slate-50 rounded-xl p-3 border border-gray-100 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-700 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>System Operational</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Security & RBAC Enforcement Active
              </p>
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
