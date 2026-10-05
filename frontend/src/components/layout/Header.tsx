"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Menu, X, UsersRound } from "lucide-react";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "Trang chủ", href: "/" },
    { label: "Cơ hội nghề nghiệp", href: "#jobs" },
    { label: "Lộ trình phát triển", href: "#development" },
    { label: "Tin tức nội bộ", href: "#news" },
    { label: "Quy trình", href: "#process" },
    { label: "FAQ", href: "/faq" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-[0_2px_15px_rgba(0,0,0,0.02)] transition-all">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Trái: Cụm Logo icon kèm text in đậm "TUYỂN DỤNG NỘI BỘ" */}
          <Link href="/" className="flex items-center gap-3 select-none group">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#4285F4] flex items-center justify-center shrink-0 border border-blue-100 shadow-xs group-hover:scale-105 transition-transform">
              <UsersRound className="w-5 h-5 text-[#4285F4]" />
            </div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 group-hover:text-[#4285F4] transition-colors">
              TUYỂN DỤNG NỘI BỘ
            </span>
          </Link>

          {/* Giữa: Dải menu liên kết kèm icon kính lúp tìm kiếm (Font chữ cỡ vừa, màu xám đen) */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm xl:text-[15px] font-medium text-slate-700 hover:text-[#4285F4] transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              aria-label="Tìm kiếm"
              onClick={() => {
                const searchElem = document.getElementById("search-bar");
                if (searchElem) searchElem.scrollIntoView({ behavior: "smooth" });
              }}
              className="p-2 text-slate-600 hover:text-[#4285F4] rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              title="Tìm kiếm vị trí"
            >
              <Search className="w-4 h-4" />
            </button>
          </nav>

          {/* Phải: Cụm nút hành động gồm nút "Đăng nhập" (chữ trơn) và nút "Đăng ký" (nền xanh #4285F4, chữ trắng, bo góc rounded-full) */}
          <div className="hidden lg:flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-700 hover:text-[#4285F4] transition-colors px-3 py-2 rounded-xl hover:bg-slate-50"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="bg-[#4285F4] hover:bg-blue-600 text-white px-6 py-2.5 rounded-full text-sm font-semibold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all cursor-pointer"
            >
              Đăng ký
            </Link>
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
          <div className="lg:hidden py-4 border-t border-slate-100 space-y-3 animate-in fade-in duration-200">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-[#4285F4] rounded-xl transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 px-4">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl border border-gray-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-full bg-[#4285F4] hover:bg-blue-600 text-white text-sm font-semibold shadow-md shadow-blue-500/25 transition-all"
              >
                Đăng ký
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
