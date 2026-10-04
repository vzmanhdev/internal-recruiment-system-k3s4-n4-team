"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BriefcaseBusiness, ClipboardCheck, LayoutDashboard, LogOut, Menu, UserRound, UsersRound, X } from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { clearAuthSession, getSessionRoles, useAuthSession } from "@/features/auth/lib/auth-session";
import { getDashboardPath } from "@/features/auth/lib/session";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Tổng quan bộ phận", href: "/manager/dashboard", icon: LayoutDashboard },
  { label: "Duyệt yêu cầu tuyển dụng", href: "/manager/requisitions", icon: ClipboardCheck },
  { label: "Vị trí đang tuyển", href: "/jobs", icon: BriefcaseBusiness },
  { label: "Hồ sơ cá nhân", href: "/profile", icon: UserRound },
];

export function ManagerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useAuthSession();
  const roles = getSessionRoles(session);
  const roleKey = roles.join(",");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const hasToken = Boolean(window.localStorage.getItem("access_token"));
    if (!hasToken) router.replace("/login");
    else if (session && !roles.some((role) => role === "manager" || role === "admin")) {
      router.replace(getDashboardPath(session.role, roles));
    }
  }, [roleKey, roles, router, session]);

  const logout = () => {
    clearAuthSession();
    router.replace("/login");
  };

  const sidebar = (
    <>
      <div className="flex h-20 items-center border-b border-slate-200 px-5"><BrandLogo size="sm" href="/manager/dashboard" /></div>
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3 rounded-2xl bg-indigo-50 p-3.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white"><UsersRound className="h-5 w-5" /></span>
          <div><p className="font-extrabold text-slate-950">Trưởng bộ phận</p><p className="text-xs text-slate-500">Điều phối nhu cầu nhân sự</p></div>
        </div>
      </div>
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6" aria-label="Điều hướng Trưởng bộ phận">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={cn("flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors", active ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950")}><Icon className="h-[18px] w-[18px]" />{item.label}</Link>;
        })}
      </nav>
      <div className="border-t border-slate-200 p-4"><button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600"><LogOut className="h-[18px] w-[18px]" />Đăng xuất</button></div>
    </>
  );

  return <div className="min-h-screen bg-slate-50">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-200 bg-white lg:flex">{sidebar}</aside>
    {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Đóng menu" onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-slate-950/40" /><aside className="relative flex h-full w-[min(86vw,288px)] flex-col bg-white shadow-2xl"><button aria-label="Đóng menu" onClick={() => setMobileOpen(false)} className="absolute right-3 top-5 rounded-lg p-2 text-slate-500"><X className="h-5 w-5" /></button>{sidebar}</aside></div>}
    <div className="lg:pl-72">
      <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 xl:px-8">
        <button aria-label="Mở menu" onClick={() => setMobileOpen(true)} className="rounded-xl border border-slate-200 p-2.5 text-slate-600 lg:hidden"><Menu className="h-5 w-5" /></button>
        <div className="ml-auto text-right"><p className="text-sm font-bold text-slate-900">{session?.full_name ?? "Trưởng bộ phận"}</p><p className="text-xs text-slate-500">Quản lý nhu cầu tuyển dụng</p></div>
      </header>
      <main className="p-4 sm:p-6 xl:p-8">{children}</main>
    </div>
  </div>;
}
