"use client";

import React from "react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { HRSettingsManagementView } from "@/components/HRSettingsManagementView";
import { ArrowLeft } from "lucide-react";

export default function HRSettingsPage() {
  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-700">
      {/* 1. HEADER CHUẨN HR MANAGER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/hr-manager" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#4285F4] to-blue-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
                HR
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900 tracking-tight group-hover:text-[#4285F4] transition-colors">
                    HỆ THỐNG TUYỂN DỤNG NỘI BỘ
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#4285F4] border border-blue-100">
                    Trưởng phòng Nhân sự
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Cấu hình Hiển thị & Giao tiếp (Landing page & Mẫu Email) • Sprint 3
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/hr-manager"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4285F4] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Về Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. BODY CONTENT: SIDEBAR + MAIN WORKSPACE */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-start gap-6">
        <Sidebar activeTab="settings" />
        <main className="flex-1 space-y-6 min-w-0">
          <HRSettingsManagementView />
        </main>
      </div>
    </div>
  );
}
