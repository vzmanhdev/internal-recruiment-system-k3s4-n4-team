"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ArrowLeft, Bell, ChevronDown, KeyRound, LogOut, Menu, Monitor, UserRound, X, type LucideIcon } from "lucide-react";
import { clearAuthSession, getSessionRoles, useAuthSession } from "@/features/auth/lib/auth-session";
import { getDashboardPath } from "@/features/auth/lib/session";
import { cn } from "@/lib/utils";

export interface WorkspaceNavItem { label: string; href: string; icon: LucideIcon }
interface WorkspaceShellProps {
  children: React.ReactNode;
  title: string;
  description: string;
  icon: LucideIcon;
  items: WorkspaceNavItem[];
  allowedRoles: string[];
}

const WorkspaceContext = createContext(false);

export function WorkspaceShell(props: WorkspaceShellProps) {
  const nested = useContext(WorkspaceContext);
  return nested ? <>{props.children}</> : <WorkspaceFrame {...props} />;
}

function WorkspaceFrame({ children, title, description, icon: RoleIcon, items, allowedRoles }: WorkspaceShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useAuthSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const openButton = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLElement>(null);
  const roleKey = getSessionRoles(session).join(",");
  const allowedKey = allowedRoles.join(",");
  const navigation = [...items,
    ...(!items.some((item) => item.href === "/profile") ? [{ href: "/profile", label: "Hồ sơ cá nhân", icon: UserRound }] : []),
    ...(!items.some((item) => item.href === "/change-password") ? [{ href: "/change-password", label: "Đổi mật khẩu", icon: KeyRound }] : []),
  ];
  const sessionId = session?.id;

  useEffect(() => {
    if (!localStorage.getItem("access_token")) router.replace("/login");
    else if (sessionId && !roleKey.split(",").some((role) => allowedKey.split(",").includes(role))) router.replace(getDashboardPath(roleKey));
  }, [allowedKey, roleKey, router, sessionId]);

  useEffect(() => {
    if (!mobileOpen) return;
    const trigger = openButton.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawer.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
      if (event.key !== "Tab") return;
      const controls = drawer.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      if (!controls?.length) return;
      const first = controls[0]; const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", keyboard);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", keyboard); trigger?.focus(); };
  }, [mobileOpen]);

  const logout = () => { clearAuthSession(); router.replace("/login"); };
  const sidebar = <>
    <nav className="flex-1 space-y-2 overflow-y-auto p-4" aria-label={`Điều hướng ${title}`}>
      <p className="mb-5 px-3 pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">{title === "Quản trị hệ thống" ? "Menu quản trị" : "Menu làm việc"}</p>
      {navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={() => setMobileOpen(false)} className={cn("group flex min-h-12 items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all", pathname === href ? "border-blue-500 bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-200/70" : "border-transparent text-slate-600 hover:border-blue-100 hover:bg-white hover:text-blue-700 hover:shadow-sm")}><span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-xl transition-colors", pathname === href ? "bg-white/16 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600")}><Icon className="h-[17px] w-[17px]" /></span><span>{label}</span></Link>)}
    </nav>
    <div className="shrink-0 space-y-3 p-5 pt-6">
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4 text-xs shadow-sm"><p className="flex items-center gap-2 font-semibold text-slate-700"><span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-600 text-white"><Monitor className="h-4 w-4" /></span>Truy cập hệ thống</p><p className="mt-3 flex items-center gap-2 text-emerald-600"><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,.12)]" />{session ? "Đang đăng nhập" : "Đang tải phiên đăng nhập"}</p><p className="mt-2 leading-5 text-slate-400">{title}</p></div>
      <Link href="/" className="flex items-center gap-2 px-2 text-xs font-semibold text-slate-500 hover:text-blue-600"><ArrowLeft className="h-4 w-4" />Trang chủ tuyển dụng</Link>
    </div>
  </>;

  return <WorkspaceContext.Provider value={true}><div className="workspace min-h-screen">
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/85 shadow-[0_8px_30px_rgba(37,99,235,.06)] backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button ref={openButton} aria-label="Mở menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)} className="shrink-0 rounded-xl p-2 text-slate-600 hover:bg-blue-50 lg:hidden"><Menu className="h-5 w-5" /></button>
          <Link href={items[0]?.href ?? "/"} className="flex min-w-0 items-center gap-3">
            <span className="hidden h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-200 sm:grid"><RoleIcon className="h-6 w-6" /></span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="truncate text-sm font-bold text-slate-900 sm:text-lg"><span className="sm:hidden">Tuyển dụng</span><span className="hidden sm:inline">Tuyển Dụng Nội Bộ</span></span><span className="hidden rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 lg:inline">{title === "Quản trị hệ thống" ? "System Admin" : title}</span></div>
              <p className="mt-0.5 hidden text-xs text-slate-500 md:block">Hệ thống Quản trị & Điều phối Tuyển dụng · {description}</p>
            </div>
          </Link>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-4">
          <div className="relative">
            <button type="button" aria-label="Thông báo" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(!notificationsOpen)} className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-blue-50 hover:text-blue-600"><Bell className="h-5 w-5" /></button>
            {notificationsOpen && <div role="region" aria-label="Thông báo tuyển dụng" className="absolute right-0 top-12 w-60 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-lg"><div className="flex items-center justify-between"><p className="text-sm font-bold text-slate-900">Thông báo</p><button aria-label="Đóng thông báo" onClick={() => setNotificationsOpen(false)} className="rounded p-1 text-slate-500"><X className="h-4 w-4" /></button></div><p className="mt-2 text-xs leading-5 text-slate-500">Xem cập nhật tuyển dụng và công việc tại trang tổng quan của bạn.</p><Link onClick={() => setNotificationsOpen(false)} href={getDashboardPath(roleKey)} className="mt-3 block text-xs font-semibold text-blue-600">Mở trang tổng quan →</Link></div>}
          </div>
          <details className="relative">
            <summary aria-label="Menu tài khoản" className="flex cursor-pointer list-none items-center gap-2 rounded-xl p-1 hover:bg-blue-50">
              <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-500 text-xs font-bold text-white sm:h-10 sm:w-10">{session?.avatar_url ? <Image src={session.avatar_url} alt="Ảnh đại diện tài khoản" fill unoptimized className="rounded-full object-cover" /> : session?.full_name?.split(" ").filter(Boolean).slice(-2).map((word) => word[0]).join("").toUpperCase() || <UserRound className="h-5 w-5" />}<span className="absolute -bottom-0.5 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" /></span>
              <span className="hidden max-w-48 sm:block"><span className="block truncate text-sm font-bold text-slate-900">{session?.full_name ?? title}</span><span className="block truncate text-xs text-slate-500">{session?.email ?? title}</span></span><ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
            </summary>
            <div className="absolute right-0 top-14 w-52 rounded-2xl border border-[var(--color-border)] bg-white p-2 shadow-lg">
              <p className="px-3 py-2 text-xs font-semibold text-slate-400">{title}</p>
              <Link href="/profile" onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-blue-50"><UserRound className="h-4 w-4" />Hồ sơ cá nhân</Link>
              <Link href="/change-password" onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-blue-50"><KeyRound className="h-4 w-4" />Đổi mật khẩu</Link>
            </div>
          </details>
          <button onClick={logout} aria-label="Đăng xuất" className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-2.5 text-sm font-medium text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:px-3"><LogOut className="h-4 w-4" /><span className="hidden md:inline">Đăng xuất</span></button>
        </div>
      </div>
    </header>
    {mobileOpen && <div className="fixed inset-0 z-[60] lg:hidden"><button aria-label="Đóng menu" onClick={() => setMobileOpen(false)} tabIndex={-1} className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" /><aside ref={drawer} role="dialog" aria-modal="true" aria-label="Menu điều hướng" className="relative flex h-full w-[min(88vw,288px)] flex-col bg-white shadow-xl"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><p className="text-sm font-bold text-slate-900">{title}</p><button aria-label="Đóng menu" onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-slate-500"><X className="h-5 w-5" /></button></div>{sidebar}</aside></div>}
    <div className="mx-auto grid max-w-[1600px] items-start gap-6 p-4 sm:p-6 lg:grid-cols-[264px_minmax(0,1fr)] lg:px-8">
      <aside className="sticky top-[104px] hidden max-h-[calc(100dvh-128px)] flex-col overflow-hidden rounded-3xl border border-white/90 bg-white/88 shadow-[var(--shadow-card)] backdrop-blur-xl lg:flex">{sidebar}</aside>
      <main className="workspace-content min-w-0 pb-8">{children}</main>
    </div>
  </div></WorkspaceContext.Provider>;
}
