"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { policyFor } from "@/lib/auth/route-registry";

/**
 * Candidate area. Signed-in candidate pages use the unified AppShell (root layout); the public pages
 * (job board, apply, status lookup, e-mail links) get a light public frame with no account data.
 */
export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (!policyFor(pathname)?.public) return <>{children}</>;
  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0F172A]">
      <header className="h-14 bg-white border-b border-[#E2E8F0] flex items-center gap-3 px-4 lg:px-6">
        <Link href="/candidate/jobs" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-[#2563EB] text-white text-sm font-bold flex items-center justify-center">TD</span>
          <span className="text-[15px] font-bold">Cơ hội nghề nghiệp</span>
        </Link>
        <nav className="flex-1 flex items-center gap-1 ml-4 text-[13px]">
          <Link href="/candidate/jobs" className="px-3 py-1.5 rounded-lg text-[#334155] hover:bg-slate-100">Việc làm</Link>
          <Link href="/candidate/track" className="px-3 py-1.5 rounded-lg text-[#334155] hover:bg-slate-100">Tra cứu hồ sơ</Link>
        </nav>
        <Link href="/login" className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-[13px] font-semibold flex items-center hover:bg-slate-50">Đăng nhập</Link>
      </header>
      <main className="px-4 lg:px-6 py-5">{children}</main>
    </div>
  );
}
