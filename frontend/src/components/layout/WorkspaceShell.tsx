"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronRight, KeyRound, LogOut, Menu, UserRound, X, type LucideIcon } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
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
  const openButton = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLElement>(null);
  const roleKey = getSessionRoles(session).join(",");
  const allowedKey = allowedRoles.join(",");
  const navigation = [...items,
    ...(!items.some((item) => item.href === "/profile") ? [{ href: "/profile", label: "Hồ sơ cá nhân", icon: UserRound }] : []),
    ...(!items.some((item) => item.href === "/change-password") ? [{ href: "/change-password", label: "Đổi mật khẩu", icon: KeyRound }] : []),
  ];
  const active = navigation.find((item) => pathname === item.href);
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

  const sidebar = <>
    <div className="flex h-20 shrink-0 items-center border-b border-[var(--color-border)] px-5"><BrandLogo size="sm" href={items[0]?.href ?? "/"} /></div>
    <div className="px-4 pt-5"><div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-3.5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600 text-white"><RoleIcon className="h-5 w-5" /></span><div className="min-w-0"><p className="text-sm font-bold text-slate-900">{title}</p><p className="mt-0.5 text-xs leading-5 text-slate-500">{description}</p></div></div></div>
    <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5" aria-label={`Điều hướng ${title}`}><p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Không gian làm việc</p>{navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} onClick={() => setMobileOpen(false)} className={cn("flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold", pathname === href ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-blue-50 hover:text-blue-700")}><Icon className="h-[18px] w-[18px] shrink-0" /><span>{label}</span></Link>)}</nav>
    <div className="shrink-0 space-y-1 border-t border-[var(--color-border)] p-4"><Link href="/" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-blue-50"><ArrowLeft className="h-[18px] w-[18px]" />Trang chủ tuyển dụng</Link><button onClick={() => { clearAuthSession(); router.replace("/login"); }} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600"><LogOut className="h-[18px] w-[18px]" />Đăng xuất</button></div>
  </>;

  return <WorkspaceContext.Provider value={true}><div className="workspace min-h-screen bg-[var(--color-background-start)]">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-[var(--color-border)] bg-white lg:flex">{sidebar}</aside>
    {mobileOpen && <div className="fixed inset-0 z-[60] lg:hidden"><button aria-label="Đóng menu" onClick={() => setMobileOpen(false)} tabIndex={-1} className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" /><aside ref={drawer} role="dialog" aria-modal="true" aria-label="Menu điều hướng" className="relative flex h-full w-[min(88vw,288px)] flex-col bg-white shadow-xl"><button aria-label="Đóng menu" onClick={() => setMobileOpen(false)} className="absolute right-2 top-6 rounded-lg bg-white p-2 text-slate-500"><X className="h-5 w-5" /></button>{sidebar}</aside></div>}
    <div className="min-w-0 lg:pl-72"><header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-3 border-b border-[var(--color-border)] bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8"><div className="flex min-w-0 items-center gap-3"><button ref={openButton} aria-label="Mở menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)} className="rounded-xl border border-[var(--color-border)] p-2.5 text-slate-600 lg:hidden"><Menu className="h-5 w-5" /></button><div className="min-w-0"><p className="hidden items-center gap-1 text-xs text-slate-500 sm:flex">{title}<ChevronRight className="h-3 w-3" />Không gian làm việc</p><p className="truncate text-sm font-semibold text-slate-900">{active?.label ?? title}</p></div></div><Link href="/profile" className="flex shrink-0 items-center gap-2.5 rounded-xl p-1.5 hover:bg-blue-50"><span className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-blue-50 text-sm font-bold text-blue-700"><UserRound className="h-5 w-5" /></span><span className="hidden max-w-48 sm:block"><span className="block truncate text-sm font-bold text-slate-900">{session?.full_name ?? title}</span><span className="block text-xs text-slate-500">Hồ sơ cá nhân</span></span></Link></header><main className="mx-auto w-full max-w-[1440px] p-4 sm:p-6 xl:p-8">{children}</main></div>
  </div></WorkspaceContext.Provider>;
}
