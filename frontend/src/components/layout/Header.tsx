"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Menu, X } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { Container } from "./Container";
import { AuthActions } from "@/features/auth/components/AuthActions";
import { getSessionRoles, useAuthSession } from "@/features/auth/lib/auth-session";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const session = useAuthSession();
  const roles = getSessionRoles(session);

  const navLinks = [
    { label: "Trang chủ", href: "/" },
    ...(session ? [{ label: "Dashboard", href: "/dashboard" }] : []),
    ...(roles.includes("admin") ? [{ label: "Quản trị", href: "/admin/dashboard" }] : []),
    ...(roles.includes("hr_manager") || roles.includes("admin") ? [{ label: "Thiết lập HR", href: "/hr/dashboard" }] : []),
    ...(roles.includes("recruiter") || roles.includes("hr_manager") || roles.includes("admin") ? [{ label: "Tuyển dụng", href: "/recruiter/dashboard" }] : []),
    { label: "Cơ hội nghề nghiệp", href: "/#jobs" },
    { label: "Lộ trình phát triển", href: "/#development" },
    { label: "Quy trình", href: "/process" },
    { label: "FAQ", href: "/faq" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[var(--color-border)] transition-all">
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
              className="p-2.5 text-slate-500 hover:text-[var(--color-primary)] rounded-full hover:bg-slate-100 transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
            <AuthActions />
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
            <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 px-4"><AuthActions mobile /></div>
          </div>
        )}
      </Container>
    </header>
  );
}
