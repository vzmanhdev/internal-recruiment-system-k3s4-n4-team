"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import { authService, type UserItem } from "@/features/auth/services/auth.service";
import { notificationService } from "@/services/notification.service";

interface Props {
  title: string;
  badge: string;
  subtitle: string;
  icon: React.ReactNode;
  accent: string; // tailwind gradient classes for the icon tile
  children: React.ReactNode;
}

/** Shared header for role workspaces: real signed-in user, unread notification count, server-side logout. */
export function RoleWorkspaceShell({ title, badge, subtitle, icon, accent, children }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<UserItem | null>(null);
  const [mounted, setMounted] = useState(false);
  const [unread, setUnread] = useState<number | null>(null);

  useEffect(() => {
    setUser(authService.getUserInfo());
    setMounted(true);
    let active = true;
    notificationService.unreadCount().then((n) => active && setUnread(n)).catch(() => active && setUnread(null));
    return () => { active = false; };
  }, []);

  const userName = (mounted && user) ? (user.full_name || "—") : "—";
  const userEmail = (mounted && user) ? (user.email || "") : "";
  const initials = (mounted && user?.full_name ? String(user.full_name) : "?").split(" ").filter(Boolean).slice(-2).map((x: string) => x[0]).join("").toUpperCase();

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 font-sans flex flex-col antialiased">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
        <div className="w-full px-4 sm:px-8 lg:px-10 h-20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <div className={`w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-tr ${accent} flex items-center justify-center text-white shadow-md`}>{icon}</div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-bold text-slate-900">{title}</span>
                <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">{badge}</span>
              </div>
              <p className="text-xs text-slate-500 truncate">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link href="/employee/notifications" className="relative p-2 rounded-full border border-gray-200 text-slate-600 hover:bg-slate-50" title="Thông báo">
              <Bell className="w-4 h-4" />
              {!!unread && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </Link>
            <div className="hidden sm:flex items-center gap-3 bg-slate-50 border border-gray-100 px-3.5 py-1.5 rounded-full">
              <div suppressHydrationWarning className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">{initials}</div>
              <div className="text-xs">
                <span suppressHydrationWarning className="font-bold text-slate-800 block leading-none">{userName}</span>
                <span suppressHydrationWarning className="text-slate-400 text-[10px]">{userEmail}</span>
              </div>
            </div>
            <button
              onClick={() => { authService.logout(); router.push("/login"); }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-gray-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full px-4 sm:px-8 lg:px-10 py-6">{children}</main>
    </div>
  );
}
