"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Menu, X, LogOut, User, LayoutDashboard, ShieldCheck } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { Container } from "./Container";
import { Button } from "@/components/ui/Button";

interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  role: string;
  employee_code?: string;
}

export function Header() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadAvatar = () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("user_avatar_url");
        if (saved) setAvatarUrl(saved);
      }
    };
    loadAvatar();
    window.addEventListener("avatar_updated", loadAvatar);
    return () => window.removeEventListener("avatar_updated", loadAvatar);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      const uStr = localStorage.getItem("user_info");
      if (token && uStr) {
        try {
          const u = JSON.parse(uStr);
          setUser(u);
          if (u.avatar_url && !localStorage.getItem("user_avatar_url")) {
            setAvatarUrl(u.avatar_url);
          }
        } catch (e) {
          console.error("Failed to parse user_info", e);
        }
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_info");
    }
    setUser(null);
    router.push("/login");
  };

  const getRoleLabel = (role: string) => {
    const roles = role.split(",");
    if (roles.includes("admin")) return "Quản Trị Viên";
    if (roles.includes("hr_manager") || roles.includes("hr")) return "Trưởng Phòng HR";
    if (roles.includes("recruiter")) return "Nhân Viên Tuyển Dụng";
    if (roles.includes("hiring_manager") || roles.includes("manager")) return "Trưởng Bộ Phận";
    if (roles.includes("interviewer")) return "Người Phỏng Vấn";
    if (roles.includes("approver")) return "Người Duyệt";
    return "Ứng Viên / Nhân Viên";
  };

  const getWorkspaceUrl = (role: string) => {
    const roles = role.split(",");
    if (roles.includes("admin")) return "/admin";
    if (roles.includes("hr_manager") || roles.includes("hr")) return "/hr/dashboard";
    if (roles.includes("recruiter")) return "/recruiter";
    if (roles.includes("hiring_manager") || roles.includes("manager")) return "/manager";
    if (roles.includes("interviewer")) return "/interviewer";
    if (roles.includes("approver")) return "/approver";
    if (roles.includes("employee")) return "/employee/dashboard";
    return "/jobs";
  };

  const navLinks = [
    { label: "Trang chủ", href: "/" },
    { label: "Cơ hội nghề nghiệp", href: "/jobs" },
    { label: "Lộ trình phát triển", href: "/jobs#mobility" },
    { label: "Tin tức nội bộ", href: "/#news" },
    { label: "Quy trình", href: "/process" },
    { label: "FAQ", href: "/faq" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[var(--color-border)] shadow-sm transition-all">
      <Container className="max-w-[1400px]">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <BrandLogo size="md" href="/" />

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-semibold text-[var(--color-body)] hover:text-[var(--color-primary)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <button
              type="button"
              aria-label="Tìm kiếm"
              className="p-2.5 text-slate-500 hover:text-[var(--color-primary)] rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Search className="w-5 h-5" />
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href={getWorkspaceUrl(user.role)}
                  className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 px-3.5 py-1.5 rounded-full transition-all group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-sm overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={user.full_name} className="w-full h-full object-cover" />
                    ) : (
                      user.full_name ? user.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "NV"
                    )}
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-slate-800 text-xs block leading-none group-hover:text-blue-600 transition-colors">
                      {user.full_name}
                    </span>
                    <span className="text-[10px] font-semibold text-blue-600">
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                </Link>

                <Link
                  href={getWorkspaceUrl(user.role)}
                  className="px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  title="Đến Không gian làm việc"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Workspace</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Đăng xuất"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <Button variant="ghost" href="/login">
                  Đăng nhập
                </Button>
                <Button variant="primary" href="/register">
                  Đăng ký
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              aria-label="Toggle Navigation"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="p-2 text-slate-600 hover:text-[var(--color-heading)] rounded-lg hover:bg-slate-100"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-100 space-y-3">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-[var(--color-body)] hover:bg-slate-50 hover:text-[var(--color-primary)] rounded-lg transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 px-4">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                      {user.full_name ? user.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "NV"}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-xs">{user.full_name}</div>
                      <div className="text-[10px] text-blue-600 font-semibold">{getRoleLabel(user.role)}</div>
                    </div>
                  </div>
                  <Button variant="primary" href={getWorkspaceUrl(user.role)} className="w-full">
                    Đến Không gian làm việc ({getRoleLabel(user.role)})
                  </Button>
                  <button
                    onClick={handleLogout}
                    className="w-full py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              ) : (
                <>
                  <Button variant="outline" href="/login" className="w-full">
                    Đăng nhập
                  </Button>
                  <Button variant="primary" href="/register" className="w-full">
                    Đăng ký
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Container>
    </header>
  );
}

