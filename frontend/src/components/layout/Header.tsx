"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, Menu, X, LogOut, User, LayoutDashboard, ShieldCheck } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { Container } from "./Container";
import { Button } from "@/components/ui/Button";
import { useActiveSection } from "@/hooks/useActiveSection";

interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  role: string;
  employee_code?: string;
}

export const NAV_SECTIONS = [
  { id: "home", label: "Trang Chủ" },
  { id: "about", label: "Về Chúng Tôi" },
  { id: "jobs", label: "Cơ Hội Nghề Nghiệp" },
  { id: "process", label: "Quy Trình" },
  { id: "news", label: "Tin Tức" },
  { id: "faq", label: "Hỗ Trợ" },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  // Active section tracking via IntersectionObserver
  const activeSection = useActiveSection(
    NAV_SECTIONS.map((s) => s.id),
    95
  );

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    if (roles.includes("candidate")) return "/candidate";
    return "/jobs";
  };

  // Smooth scroll handler for one-page navigation
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (isHomePage) {
      e.preventDefault();
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", `#${id}`);
      }
      setIsMobileMenuOpen(false);
    }
  };

  const handleSearchClick = () => {
    if (isHomePage) {
      const el = document.getElementById("jobs");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", "#jobs");
      }
    } else {
      router.push("/#jobs");
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isHomePage && !isScrolled
          ? "bg-transparent border-b border-transparent shadow-none"
          : "bg-white/85 backdrop-blur-md border-b border-slate-200/60 shadow-xs"
      }`}
    >
      <Container className="max-w-[1400px]">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <BrandLogo size="md" href="/" />

          {/* Desktop Navigation Links with Active State & Smooth Scrolling */}
          <nav className="hidden lg:flex items-center gap-1.5 xl:gap-2">
            {NAV_SECTIONS.map((item) => {
              const isActive = isHomePage && activeSection === item.id;
              return (
                <Link
                  key={item.id}
                  href={isHomePage ? `#${item.id}` : `/#${item.id}`}
                  onClick={(e) => handleNavClick(e, item.id)}
                  className={`relative px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "text-blue-600 font-bold bg-blue-50/80 shadow-xs"
                      : "text-slate-700 hover:text-blue-600 hover:bg-white/60"
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-1 left-4 right-4 h-[2px] bg-blue-600 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              type="button"
              aria-label="Tìm kiếm cơ hội nghề nghiệp"
              onClick={handleSearchClick}
              className="p-2.5 text-slate-600 hover:text-blue-600 rounded-full hover:bg-white/60 transition-colors cursor-pointer"
              title="Tìm kiếm vị trí tuyển dụng"
            >
              <Search className="w-5 h-5" />
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href={getWorkspaceUrl(user.role)}
                  className="flex items-center gap-2.5 bg-white/80 hover:bg-white border border-slate-200/80 px-3.5 py-1.5 rounded-full transition-all group cursor-pointer shadow-2xs"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-sm overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={user.full_name} className="w-full h-full object-cover" />
                    ) : (
                      user.full_name ? user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "NV"
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
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-5 py-2.5 rounded-full text-sm font-bold text-blue-600 bg-blue-50/90 hover:bg-blue-100 hover:text-blue-700 border border-blue-200/80 shadow-xs transition-all cursor-pointer"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="btn-pill-apply px-5 py-2.5 rounded-full text-white !text-white font-bold text-sm shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 transition-all cursor-pointer"
                  style={{ color: "#ffffff", backgroundColor: "#2563eb" }}
                >
                  <span style={{ color: "#ffffff" }}>Đăng ký</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              aria-label="Toggle Navigation"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-100 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-1.5">
              {NAV_SECTIONS.map((item) => {
                const isActive = isHomePage && activeSection === item.id;
                return (
                  <Link
                    key={item.id}
                    href={isHomePage ? `#${item.id}` : `/#${item.id}`}
                    onClick={(e) => handleNavClick(e, item.id)}
                    className={`flex items-center justify-between px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-blue-50 text-blue-600 font-bold border-l-4 border-blue-600 shadow-xs"
                        : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 px-4">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                      {user.full_name ? user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "NV"}
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
                    className="w-full py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
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
