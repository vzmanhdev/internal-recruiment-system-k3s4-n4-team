"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { Container } from "./Container";
import { AuthActions } from "@/features/auth/components/AuthActions";
import { getSessionRoles, useAuthSession } from "@/features/auth/lib/auth-session";
import { getDashboardPath } from "@/features/auth/lib/session";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const session = useAuthSession();
  const roles = getSessionRoles(session);

  const navLinks = [
    { label: "Trang chủ", href: "/" },
    ...(session ? [{ label: "Dashboard", href: getDashboardPath(session.role, roles) }] : []),
    ...(roles.includes("admin") || roles.includes("hr_manager") || roles.includes("recruiter") ? [{ label: "Tuyển dụng (HR)", href: "/hr" }] : []),
    ...(roles.includes("admin") ? [{ label: "Quản trị", href: "/admin" }] : []),
    { label: "Cơ hội nghề nghiệp", href: "/jobs" },
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
          <nav className="hidden xl:flex items-center gap-5">
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
          <div className="hidden xl:flex items-center gap-4">
            <AuthActions />
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 xl:hidden">
            <button
              type="button"
              aria-label="Mở menu điều hướng"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="p-2 text-slate-600 hover:text-[var(--color-heading)] rounded-lg hover:bg-slate-100"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="xl:hidden py-4 border-t border-slate-100 space-y-3">
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
