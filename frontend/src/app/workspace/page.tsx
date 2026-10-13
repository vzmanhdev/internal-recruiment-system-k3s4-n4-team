"use client";

import Link from "next/link";
import { useMemo } from "react";
import { isSubgroup, visibleNavigation } from "@/lib/auth/navigation";
import { NavIcon } from "@/components/layout/app-shell/NavIcon";
import { useAuth } from "@/providers/auth-provider";

/**
 * Unified overview: every module the signed-in user may open (union of all roles, from backend
 * effective permissions). Nothing here is role-hardcoded and no counters are invented.
 */
export default function WorkspaceOverviewPage() {
  const { user, canAccess, status } = useAuth();
  const groups = useMemo(
    () => (status === "authenticated" ? visibleNavigation(canAccess).filter((g) => g.id !== "overview" && g.id !== "personal") : []),
    [canAccess, status],
  );
  const roleNames = (user?.roles || []).map((r) => (typeof r === "string" ? r : r.name)).filter(Boolean);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#0F172A]">Xin chào{user?.full_name ? `, ${user.full_name}` : ""}</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Vai trò: {roleNames.length ? roleNames.join(", ") : "—"}. Các chức năng dưới đây được tính từ quyền thực tế của tài khoản.
        </p>
      </div>

      {status === "loading" && <div className="h-24 rounded-2xl bg-white border border-[#E2E8F0] animate-pulse" />}
      {status === "authenticated" && groups.length === 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 text-sm text-[#64748B]">
          Chưa có dữ liệu. Tài khoản chưa được cấp quyền sử dụng phân hệ nào — vui lòng liên hệ Quản trị hệ thống.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map((g) => {
          const links = g.items.flatMap((i) => (isSubgroup(i) ? i.children : [i]));
          return (
            <section key={g.id} className="bg-white border border-[#E2E8F0] rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
                  <NavIcon name={g.icon} className="w-4 h-4" />
                </span>
                <h2 className="text-sm font-bold text-[#0F172A]">{g.label}</h2>
              </div>
              <ul className="space-y-1">
                {links.map((l) => (
                  <li key={l.id}>
                    <Link href={l.href} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-[#334155] hover:bg-slate-50 hover:text-[#2563EB]">
                      <NavIcon name={l.icon} className="w-3.5 h-3.5 text-[#94A3B8]" />
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
