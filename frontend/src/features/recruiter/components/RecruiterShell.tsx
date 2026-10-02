"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Briefcase,
  Calendar,
  ChevronDown,
  Clock,
  FileCheck,
  FileSpreadsheet,
  Kanban,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Plus,
  Search,
  Sparkles,
  UserCheck,
  Users,
  X,
  Shield,
  Layers,
} from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { cn } from "@/lib/utils";
import {
  clearAuthSession,
  getSessionRoles,
  saveAuthSession,
  useAuthSession,
} from "@/features/auth/lib/auth-session";
import { recruiterService } from "../services/recruiter.service";

interface RecruiterNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeTone?: "blue" | "amber" | "green" | "red";
}

export function RecruiterShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const session = useAuthSession();
  const roles = getSessionRoles(session);
  const [metrics, setMetrics] = useState({ newAppliedCount: 0, slaOverdueCount: 0, interviewsTodayCount: 0 });

  useEffect(() => {
    const summary = recruiterService.getMetricsSummary();
    setMetrics({
      newAppliedCount: summary.newAppliedCount,
      slaOverdueCount: summary.slaOverdueCount,
      interviewsTodayCount: summary.interviewsTodayCount,
    });
  }, [pathname]);

  const handleLogout = () => {
    clearAuthSession();
    router.push("/login");
  };

  // Switch role helper for easy testing / demo
  const switchToRecruiter = () => {
    saveAuthSession({
      id: 99,
      email: "phong.recruiter@vinatech.com",
      full_name: "Phong (Recruiter)",
      phone: "0912345678",
      role: "recruiter",
      roles: ["recruiter"],
      is_active: true,
      avatar_url: "",
    });
    window.localStorage.setItem("access_token", "demo-recruiter-token");
    window.location.reload();
  };

  const navItems: RecruiterNavItem[] = [
    {
      label: "Bàn làm việc",
      href: "/recruiter/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Pipeline ứng viên",
      href: "/recruiter/pipeline",
      icon: Kanban,
      badge: metrics.newAppliedCount > 0 ? metrics.newAppliedCount : undefined,
      badgeTone: "blue",
    },
    {
      label: "Hồ sơ ứng viên",
      href: "/recruiter/candidates",
      icon: Users,
      badge: metrics.slaOverdueCount > 0 ? `${metrics.slaOverdueCount} trễ SLA` : undefined,
      badgeTone: "amber",
    },
    {
      label: "Lịch phỏng vấn",
      href: "/recruiter/interviews",
      icon: Calendar,
      badge: metrics.interviewsTodayCount > 0 ? `${metrics.interviewsTodayCount} hôm nay` : undefined,
      badgeTone: "green",
    },
    {
      label: "Đề xuất Offer",
      href: "/recruiter/offers",
      icon: FileCheck,
    },
    {
      label: "Tin tuyển dụng",
      href: "/recruiter/jobs",
      icon: Briefcase,
    },
    {
      label: "Giao tiếp & Email",
      href: "/recruiter/communications",
      icon: Mail,
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand Header */}
      <div className="flex h-20 items-center justify-between border-b border-slate-200 px-6">
        <BrandLogo size="sm" href="/recruiter/dashboard" />
        <button
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Đóng menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Recruiter Persona Card */}
      <div className="px-5 pt-6">
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-600 font-extrabold text-white shadow-md shadow-blue-500/20">
              P
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-bold text-slate-900">
                  {session?.full_name || "Phong"}
                </p>
                <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-[10px] text-white" title="Trực tuyến">
                  ✓
                </span>
              </div>
              <p className="truncate text-xs font-semibold text-blue-600">Nhân viên tuyển dụng</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-blue-100/60 pt-2.5 text-xs text-slate-500">
            <span>VinaTech Talent Ops</span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sẵn sàng
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6" aria-label="Điều hướng tuyển dụng">
        <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Nghiệp vụ tuyển dụng
        </p>
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/recruiter/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex min-h-11 items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150",
                active
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn("h-[18px] w-[18px] shrink-0 transition-colors", active ? "text-white" : "text-slate-500 group-hover:text-blue-600")} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-extrabold",
                    active
                      ? "bg-white/20 text-white"
                      : item.badgeTone === "amber"
                      ? "bg-amber-100 text-amber-800"
                      : item.badgeTone === "green"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-blue-100 text-blue-700"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        <div className="pt-4">
          <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Khu vực khác
          </p>
          <Link
            href="/hr/dashboard"
            className="flex min-h-10 items-center gap-3 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <Shield className="h-4 w-4" />
            <span>Thiết lập HR Manager</span>
          </Link>
          <Link
            href="/jobs"
            target="_blank"
            className="flex min-h-10 items-center gap-3 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <Layers className="h-4 w-4" />
            <span>Xem Cổng tuyển dụng</span>
          </Link>
        </div>
      </nav>

      {/* Footer / Switch Role & Logout */}
      <div className="border-t border-slate-200 p-4 space-y-2">
        <button
          onClick={switchToRecruiter}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
          title="Đặt lại tài khoản phiên mẫu Phong (Recruiter)"
        >
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          Kích hoạt vai trò Phong
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Đăng xuất
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-200 bg-white lg:flex">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col lg:pl-72 min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Mở menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative hidden sm:block w-72 md:w-96">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm nhanh ứng viên, kỹ năng, vị trí..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/recruiter/pipeline"
              className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition-colors"
            >
              <Kanban className="h-4 w-4" />
              Mở Pipeline
            </Link>

            <div className="h-8 w-px bg-slate-200 mx-1" />

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-tight">Phong (Recruiter)</p>
                <p className="text-[11px] text-slate-500">phong.recruiter@vinatech.com</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-sm font-extrabold text-blue-700">
                P
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
