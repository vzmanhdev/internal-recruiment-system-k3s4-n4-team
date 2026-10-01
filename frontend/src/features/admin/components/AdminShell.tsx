"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { cn } from "@/lib/utils";
import { adminNavItems } from "../data/dashboard";
import { clearAuthSession, getSessionRoles, useAuthSession } from "@/features/auth/lib/auth-session";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const session = useAuthSession();
  const roles = getSessionRoles(session);
  const roleKey = roles.join(",");
  const roleLabels: Record<string,string> = {admin:"Quản trị viên",hr_manager:"Nhân sự",manager:"Quản lý",employee:"Nhân viên"};
  const displayName = session?.full_name ?? "Quản trị viên";
  const handleLogout = () => { clearAuthSession(); router.push("/login"); };

  useEffect(() => {
    const hasToken = Boolean(window.localStorage.getItem("access_token"));
    if (!hasToken) router.replace("/login");
    else if (session && !roleKey.split(",").includes("admin")) router.replace("/dashboard");
  }, [roleKey, router, session]);

  const sidebar = (
    <>
      <div className="flex h-20 items-center border-b border-slate-200 px-5">
        <BrandLogo size="sm" href="/admin/dashboard" />
      </div>

      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 rounded-2xl bg-blue-50 p-3.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">Khu vực quản trị</p>
            <p className="truncate text-xs text-slate-500">Quản lý toàn hệ thống</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6" aria-label="Điều hướng quản trị">
        <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Quản lý
        </p>
        {adminNavItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600">
          <LogOut className="h-[18px] w-[18px]" />
          Đăng xuất
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-200 bg-white lg:flex">
        {sidebar}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
            aria-label="Đóng menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-[min(86vw,288px)] flex-col bg-white shadow-2xl">
            <button
              type="button"
              aria-label="Đóng menu quản trị"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-5 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 xl:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 lg:hidden"
              aria-label="Mở menu quản trị"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative hidden w-72 md:block xl:w-96">
              <Search className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                aria-label="Tìm kiếm trong hệ thống"
                placeholder="Tìm kiếm nhanh..."
                className="h-11 w-full rounded-xl border-slate-200 bg-slate-50 pl-11 pr-4 text-sm focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label="Thông báo"
              className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50 hover:text-blue-600"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
            <button className="flex items-center gap-2.5 rounded-xl p-1.5 pr-2 hover:bg-slate-50">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
                {displayName.split(" ").slice(-2).map(part=>part[0]).join("").toUpperCase()}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-bold text-slate-900">{displayName}</span>
                <span className="block text-xs text-slate-500">{roles.map(role=>roleLabels[role]??role).join(", ") || "Quản trị viên"}</span>
              </span>
              <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 xl:p-8">{children}</main>
      </div>
    </div>
  );
}
