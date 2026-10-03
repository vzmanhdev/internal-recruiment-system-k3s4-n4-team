"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { clearAuthSession, getSessionRoles, useAuthSession } from "@/features/auth/lib/auth-session";
import { getDashboardPath } from "@/features/auth/lib/session";

const navLinks = [
  ["/hr/dashboard", "Thiết lập HR"],
  ["/hr/requisitions", "Tờ trình"],
  ["/hr/applications", "Hồ sơ ứng tuyển"],
  ["/hr/interviews", "Phỏng vấn"],
  ["/hr/offers", "Offer & Onboarding"],
  ["/hr/analytics", "Báo cáo"],
  ["/hr/content", "Nội dung"],
  ["/profile", "Hồ sơ cá nhân"],
] as const;

export function HrShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useAuthSession();
  const roles = getSessionRoles(session);
  const sessionId = session?.id;
  const sessionRole = session?.role ?? "employee";
  const isAllowed = roles.some((role) => role === "hr_manager" || role === "admin");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!window.localStorage.getItem("access_token")) router.replace("/login");
    else if (sessionId && !isAllowed) router.replace(getDashboardPath(sessionRole));
  }, [isAllowed, router, sessionId, sessionRole]);

  const logout = () => {
    clearAuthSession();
    router.push("/login");
  };

  const navItemClass = (href: string) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${pathname === href ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/hr/dashboard" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white"><ShieldCheck className="h-5 w-5" /></span>
            <div><p className="font-extrabold text-slate-950">Trưởng phòng nhân sự</p><p className="text-xs text-slate-500">Không gian quản lý tuyển dụng</p></div>
          </Link>
          <nav className="hidden items-center gap-1 xl:flex">
            {navLinks.map(([href, label]) => <Link key={href} href={href} className={navItemClass(href)}>{label}</Link>)}
            <button onClick={logout} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600"><LogOut className="h-4 w-4" />Đăng xuất</button>
          </nav>
          <button onClick={() => setMobileOpen((open) => !open)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 xl:hidden" aria-label="Mở menu quản trị nhân sự">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileOpen && (
          <nav className="mx-auto grid max-w-[1500px] gap-1 border-t border-slate-100 px-4 py-3 sm:grid-cols-2 sm:px-6 xl:hidden">
            {navLinks.map(([href, label]) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={navItemClass(href)}>{label}</Link>)}
            <button onClick={logout} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" />Đăng xuất</button>
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
