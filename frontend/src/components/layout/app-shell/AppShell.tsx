"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, LogOut, Menu, X } from "lucide-react";
import { apiRequest } from "@/lib/api-client";
import { visibleNavigation } from "@/lib/auth/navigation";
import { useAuth } from "@/providers/auth-provider";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { Sidebar } from "./Sidebar";

const UNREAD_POLL_MS = 60_000;

function initialsOf(name?: string | null) {
  return (name || "?").split(" ").filter(Boolean).slice(-2).map((x) => x[0]).join("").toUpperCase();
}

function UnreadBell({ href }: { href: string | null }) {
  const { status } = useAuth();
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (status !== "authenticated") return;
    let active = true;
    const load = () =>
      apiRequest<{ unread_count: number }>("/notifications/unread-count")
        .then((r) => active && setUnread(r.unread_count))
        .catch(() => undefined);
    load();
    const t = window.setInterval(load, UNREAD_POLL_MS);
    return () => { active = false; window.clearInterval(t); };
  }, [status]);
  const badge = unread > 99 ? "99+" : String(unread);
  const content = (
    <>
      <Bell className="w-5 h-5" aria-hidden="true" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{badge}</span>
      )}
      <span className="sr-only">Thông báo ({unread} chưa đọc)</span>
    </>
  );
  const cls = "relative p-2 rounded-lg text-[#64748B] hover:bg-slate-100 hover:text-[#0F172A]";
  return href ? <Link href={href} className={cls}>{content}</Link> : <span className={cls}>{content}</span>;
}

function UserMenu() {
  const { user, logout, canAccess } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const roleNames = (user?.roles || []).map((r) => (typeof r === "string" ? r : r.name)).filter(Boolean);
  const personal = visibleNavigation(canAccess).find((g) => g.id === "personal");
  const doLogout = async () => {
    await logout();
    router.replace("/login");
  };
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="menu"
        className="flex items-center gap-2 rounded-lg pl-1 pr-2 py-1 hover:bg-slate-100 cursor-pointer">
        <span className="w-8 h-8 rounded-full bg-[#2563EB] text-white text-xs font-bold flex items-center justify-center overflow-hidden">
          {user?.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : initialsOf(user?.full_name)}
        </span>
        <span className="hidden md:block text-left leading-tight max-w-[180px]">
          <span className="block text-[13px] font-semibold text-[#0F172A] truncate">{user?.full_name || user?.email || "Người dùng"}</span>
          <span className="block text-[11px] text-[#64748B] truncate">{roleNames.join(", ") || "—"}</span>
        </span>
        <ChevronDown className="w-4 h-4 text-[#94A3B8]" aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-64 bg-white border border-[#E2E8F0] rounded-xl shadow-lg py-1.5 z-50">
          <div className="px-3 py-2 border-b border-[#E2E8F0]">
            <div className="text-[13px] font-semibold text-[#0F172A] truncate">{user?.full_name}</div>
            <div className="text-[11px] text-[#64748B] truncate">{user?.email}</div>
          </div>
          {personal?.items.map((i) => ("href" in i ? (
            <Link key={i.id} href={i.href} role="menuitem" onClick={() => setOpen(false)}
              className="block px-3 py-2 text-[13px] text-[#334155] hover:bg-slate-50">{i.label}</Link>
          ) : null))}
          <button type="button" role="menuitem" onClick={doLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-red-600 hover:bg-red-50 cursor-pointer">
            <LogOut className="w-4 h-4" aria-hidden="true" /> Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}

/** The one application shell for every workspace (persistent: mounted once in the root layout). */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { canAccess } = useAuth();
  const [drawer, setDrawer] = useState(false);
  // close the mobile drawer after navigation
  useEffect(() => { queueMicrotask(() => setDrawer(false)); }, [pathname]);
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawer(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawer]);

  const personal = visibleNavigation(canAccess).find((g) => g.id === "personal");
  const notificationsHref = personal?.items.find((i) => i.id === "me.notifications" && "href" in i);

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0F172A]">
      <header className="sticky top-0 z-40 h-14 bg-white/95 backdrop-blur-md border-b border-slate-300 flex items-center gap-3 px-3 lg:px-5 shadow-2xs">
        <button type="button" onClick={() => setDrawer(true)} className="lg:hidden p-2 rounded-lg text-[#64748B] hover:bg-slate-100 cursor-pointer" aria-label="Mở menu">
          <Menu className="w-5 h-5" />
        </button>
        <BrandLogo size="md" href="/" />
        <div className="flex-1" />
        <UnreadBell href={notificationsHref && "href" in notificationsHref ? notificationsHref.href : null} />
        <UserMenu />
      </header>

      <div className="flex">
        {/* desktop sidebar */}
        <aside className="hidden lg:block w-80 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto bg-slate-50/30 border-r border-slate-300 shadow-xs custom-sidebar-scroll">
          <Sidebar />
        </aside>

        {/* mobile / tablet drawer */}
        {drawer && (
          <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu điều hướng">
            <div className="absolute inset-0 bg-slate-900/40" onClick={() => setDrawer(false)} />
            <aside className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-white border-r border-slate-300 shadow-2xl overflow-y-auto custom-sidebar-scroll">
              <div className="h-14 flex items-center justify-between px-3 border-b border-slate-300">
                <BrandLogo size="sm" href="/" onClick={() => setDrawer(false)} />
                <button type="button" onClick={() => setDrawer(false)} className="p-2 rounded-lg text-[#64748B] hover:bg-slate-100 cursor-pointer" aria-label="Đóng menu">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <Sidebar onNavigate={() => setDrawer(false)} />
            </aside>
          </div>
        )}

        <main className="flex-1 min-w-0 w-full p-3 sm:p-4 lg:p-5">{children}</main>
      </div>
    </div>
  );
}
