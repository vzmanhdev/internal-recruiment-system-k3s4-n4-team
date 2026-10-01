"use client";
import { useEffect } from "react";
import Link from "next/link";
import { LogOut, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { clearAuthSession, getSessionRoles, useAuthSession } from "@/features/auth/lib/auth-session";

export function HrShell({children}:{children:React.ReactNode}){
  const router=useRouter(); const session=useAuthSession(); const roles=getSessionRoles(session);
  useEffect(()=>{if(!window.localStorage.getItem("access_token")) router.replace("/login");else if(session&&!roles.some(role=>role==="hr_manager"||role==="admin")) router.replace("/dashboard")},[router,session,roles]);
  const logout=()=>{clearAuthSession();router.push("/login")};
  return <div className="min-h-screen bg-slate-50"><header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur"><div className="mx-auto flex min-h-16 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white"><ShieldCheck className="h-5 w-5"/></span><div><p className="font-extrabold text-slate-950">Quản trị nhân sự</p><p className="text-xs text-slate-500">Khai báo nền tảng tổ chức</p></div></div><div className="hidden items-center gap-2 md:flex"><Link href="/hr/dashboard" className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700">Thiết lập HR</Link><Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Dashboard</Link><button onClick={logout} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600"><LogOut className="h-4 w-4"/>Đăng xuất</button></div><button onClick={logout} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 md:hidden" aria-label="Đăng xuất"><LogOut className="h-5 w-5"/></button></div></header><main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">{children}</main></div>;
}
