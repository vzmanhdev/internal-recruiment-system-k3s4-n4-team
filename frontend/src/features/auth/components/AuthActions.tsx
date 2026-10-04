"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icons";
import { clearAuthSession, useAuthSession } from "../lib/auth-session";

export function AuthActions({mobile=false}:{mobile?:boolean}) {
  const session=useAuthSession();
  if (!session) return <div className={mobile?"mobile-auth-links":"header-auth"}><Link href="/login">Đăng nhập</Link><Link className="header-register" href="/register">Đăng ký</Link></div>;
  return <div className={mobile?"mobile-account":"header-user"}><button className="icon-button" aria-label="Thông báo"><Icon name="bell"/></button><span className="avatar">{session.displayName.slice(0,2).toUpperCase()}</span><span>{session.displayName}</span><button className="logout-button" type="button" onClick={clearAuthSession}>Đăng xuất</button></div>;
}
