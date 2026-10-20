"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { policyFor } from "@/lib/auth/route-registry";
import { useAuth } from "@/providers/auth-provider";
import { ChevronDown, LayoutDashboard, LogOut, User } from "lucide-react";

function initialsOf(name?: string | null) {
  return (name || "?").split(" ").filter(Boolean).slice(-2).map((x) => x[0]).join("").toUpperCase();
}

function getRoleLabel(role?: string, roles?: Array<string | { code: string; name: string }>) {
  const allRoles = [
    role || "",
    ...(roles || []).map((r) => (typeof r === "string" ? r : r.name || r.code)),
  ].join(", ").toLowerCase();
  if (allRoles.includes("admin")) return "Quản trị viên";
  if (allRoles.includes("hr")) return "Nhân sự (HR)";
  if (allRoles.includes("recruiter")) return "Tuyển dụng";
  if (allRoles.includes("manager")) return "Quản lý";
  if (allRoles.includes("interviewer")) return "Phỏng vấn viên";
  if (allRoles.includes("approver")) return "Người duyệt";
  return "Ứng viên / Nhân viên";
}

function getWorkspaceUrl(user: any): string {
  if (!user) return "/candidate/jobs";
  if (user.redirect_url) return user.redirect_url;
  const roles = (user.roles || []).map((r: any) => (typeof r === "string" ? r : r.code)).join(",");
  const roleStr = `${user.role || ""},${roles}`.toLowerCase();
  if (roleStr.includes("admin")) return "/admin";
  if (roleStr.includes("hr_manager") || roleStr.includes("hr")) return "/hr/dashboard";
  if (roleStr.includes("recruiter")) return "/recruiter";
  if (roleStr.includes("hiring_manager") || roleStr.includes("manager")) return "/manager";
  if (roleStr.includes("interviewer")) return "/interviewer";
  if (roleStr.includes("approver")) return "/approver";
  return "/candidate";
}

/**
 * Candidate area. Signed-in candidate pages use the unified AppShell (root layout); the public pages
 * (job board, apply, status lookup, e-mail links) get a light public frame that responds to auth state.
 */
export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, status, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  if (!policyFor(pathname)?.public) return <>{children}</>;

  const workspaceUrl = getWorkspaceUrl(user);
  const roleLabel = getRoleLabel(user?.role, user?.roles);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#0F172A]">
      <header className="h-14 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/candidate/jobs" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#2563EB] text-white text-sm font-bold flex items-center justify-center">TD</span>
            <span className="text-[15px] font-bold">Cơ hội nghề nghiệp</span>
          </Link>
          <nav className="flex items-center gap-1 ml-4 text-[13px]">
            <Link
              href="/candidate/jobs"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                pathname === "/candidate/jobs"
                  ? "text-[#2563EB] bg-blue-50 font-bold"
                  : "text-[#334155] hover:bg-slate-100"
              }`}
            >
              Việc làm
            </Link>
            <Link
              href="/candidate/track"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                pathname.startsWith("/candidate/track")
                  ? "text-[#2563EB] bg-blue-50 font-bold"
                  : "text-[#334155] hover:bg-slate-100"
              }`}
            >
              Tra cứu hồ sơ
            </Link>
            {user && (
              <Link
                href="/candidate"
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  pathname === "/candidate"
                    ? "text-[#2563EB] bg-blue-50 font-bold"
                    : "text-[#334155] hover:bg-slate-100"
                }`}
              >
                Hồ sơ của tôi
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          {user ? (
            <>
              <Link
                href={workspaceUrl}
                className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-lg bg-blue-50 text-[#2563EB] hover:bg-blue-100 text-xs font-bold transition-colors"
                title="Đến Không gian làm việc"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Không gian làm việc</span>
              </Link>

              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                >
                  <span className="w-7 h-7 rounded-full bg-[#2563EB] text-white text-xs font-bold flex items-center justify-center overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      initialsOf(user.full_name)
                    )}
                  </span>
                  <span className="text-left leading-tight hidden md:block max-w-[150px]">
                    <span className="block text-xs font-bold text-[#0F172A] truncate">
                      {user.full_name || user.email}
                    </span>
                    <span className="block text-[10px] text-[#64748B] truncate font-medium">
                      {roleLabel}
                    </span>
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E2E8F0] rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-[#E2E8F0]">
                      <div className="text-xs font-bold text-[#0F172A] truncate">{user.full_name}</div>
                      <div className="text-[11px] text-[#64748B] truncate">{user.email}</div>
                    </div>
                    <Link
                      href={workspaceUrl}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-[#334155] hover:bg-slate-50 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#2563EB]" />
                      <span>Không gian làm việc</span>
                    </Link>
                    <Link
                      href="/candidate"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-[#334155] hover:bg-slate-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-500" />
                      <span>Bàn làm việc của tôi</span>
                    </Link>
                    <div className="h-px bg-[#E2E8F0] my-1" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="h-9 px-3.5 rounded-lg border border-[#E2E8F0] text-[13px] font-semibold flex items-center hover:bg-slate-50 text-[#0F172A] transition-colors"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </header>
      <main className="w-full min-h-[calc(100vh-3.5rem)]">{children}</main>
    </div>
  );
}
