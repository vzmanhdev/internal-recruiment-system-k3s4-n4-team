"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icons";
import { clearAuthSession, getSessionRoles, useAuthSession } from "../lib/auth-session";

export function AuthActions({mobile=false}:{mobile?:boolean}) {
  const router=useRouter();
  const session=useAuthSession();
  if (!session) return <div className={mobile?"mobile-auth-links":"header-auth"}><Link href="/login">Đăng nhập</Link><Link className="header-register" href="/register">Đăng ký</Link></div>;
  const roleLabels: Record<string,string> = {admin:"Quản trị viên",hr_manager:"Nhân sự",manager:"Quản lý",employee:"Nhân viên"};
  const roles=getSessionRoles(session);
  const logout=()=>{clearAuthSession(); router.push("/login");};
  return <div className={mobile?"mobile-account":"header-user"}><button className="icon-button" aria-label="Thông báo"><Icon name="bell"/></button><span className="avatar">{session.full_name.slice(0,2).toUpperCase()}</span><span><b>{session.full_name}</b><small className="block text-xs text-slate-500">{roles.map(role=>roleLabels[role]??role).join(", ")}</small></span><button className="logout-button" type="button" onClick={logout}>Đăng xuất</button></div>;
}
