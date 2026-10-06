"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  BriefcaseBusiness,
  CalendarCheck,
  ChevronRight,
  ExternalLink,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { cn } from "@/lib/utils";
import {
  clearAuthSession,
  getSessionRoles,
  useAuthSession,
} from "@/features/auth/lib/auth-session";

const recruiterNavItems = [
  { label: "Tổng quan tuyển dụng", href: "/recruiter/dashboard", icon: LayoutDashboard },
  { label: "Vị trí tuyển dụng", href: "/recruiter/jobs", icon: BriefcaseBusiness },
  { label: "Hồ sơ ứng viên (ATS)", href: "/recruiter/candidates", icon: UserCheck },
  { label: "Lịch phỏng vấn", href: "/recruiter/interviews", icon: CalendarCheck },
  { label: "Giới thiệu nội bộ", href: "/recruiter/referrals", icon: UserPlus },
];

export function RecruiterShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const session = useAuthSession();
  const roles = getSessionRoles(session);
  const isAdmin = roles.includes("admin");

  const displayName = session?.full_name ?? "Chuyên viên Tuyển dụng";
  const displayEmail = session?.email ?? "hr@company.com";

  const handleLogout = () => {
    clearAuthSession();
    router.push("/login");
  };

  useEffect(() => {
    const hasToken = Boolean(window.localStorage.getItem("access_token"));
    if (!hasToken) {
      router.replace("/login");
    }
  }, [router]);

  const sidebarContent = (
    <>
      <div className="flex h-20 items-center justify-between border-b border-slate-200 px-5">
        <BrandLogo size="sm" href="/recruiter/dashboard" />
      </div>

      <div className="px-5 pt-5 pb-2">
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 p-3.5 border border-blue-100/70 shadow-sm">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-200">
            <Users className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">Ban Tuyển dụng</p>
            <p className="truncate text-xs font-medium text-blue-700">HR Recruiter Workspace</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-4" aria-label="Điều hướng tuyển dụng">
        <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Nghiệp vụ tuyển dụng
        </p>
        {recruiterNavItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/recruiter/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all",
                active
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div className="pt-4 mt-2 border-t border-slate-100 space-y-1">
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Điều hướng khác
          </p>
          {isAdmin && (
            <Link
              href="/admin/dashboard"
              className="flex items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                Khu vực Quản trị Admin
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            </Link>
          )}
          <Link
            href="/"
            className="flex items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <span className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-600" />
              Cổng tuyển dụng nội bộ
            </span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          </Link>
        </div>
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 font-bold grid place-items-center text-sm border border-blue-200">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-900">{displayName}</p>
            <p className="truncate text-[11px] text-slate-500">{displayEmail}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Đăng xuất
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-200 bg-white lg:flex">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
            aria-label="Đóng menu"
          />
          <div className="relative flex h-full w-72 flex-col bg-white shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 lg:hidden"
              aria-label="Mở menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                  HR Workspace
                </span>
                <span className="text-xs text-slate-400">|</span>
                <span className="text-xs font-medium text-slate-500">Kỳ tuyển dụng Quý 4/2026</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/recruiter/jobs?action=create"
              className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-blue-200 hover:bg-blue-700 transition-colors"
            >
              <BriefcaseBusiness className="h-3.5 w-3.5" />
              Đăng tin tuyển dụng
            </Link>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <button
                type="button"
                className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
                aria-label="Thông báo"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
