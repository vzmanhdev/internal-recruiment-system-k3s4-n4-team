"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MasterDataManagementView } from "@/components/MasterDataManagementView";
import { Folder, DollarSign, ShieldCheck, ArrowLeft, Building2 } from "lucide-react";

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<"tree_view" | "salary_bands">("tree_view");

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-700">
      {/* 1. HEADER CHUẨN */}
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
                  Quản lý Cấu trúc & Lương (Master Data) • S2-04 & S2-05
                </p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/hr-manager"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Về Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. BODY CONTENT: SIDEBAR + MAIN WORKSPACE */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        {/* SIDEBAR BÊN TRÁI */}
        <aside className="w-full lg:w-72 shrink-0">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 lg:sticky lg:top-28 space-y-4">
            <div className="px-4 py-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Menu Quản Trị
              </span>
            </div>

            <nav className="flex flex-col space-y-1.5">
              <Link
                href="/hr-manager"
                className="flex items-center gap-3 px-4 py-3 rounded-2xl font-medium text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <Building2 className="w-5 h-5 text-slate-400" />
                <span>Tổng quan (Dashboard)</span>
              </Link>

              <button
                type="button"
                onClick={() => setActiveTab("tree_view")}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-medium text-sm transition-all cursor-pointer ${
                  activeTab === "tree_view"
                    ? "bg-[#4285F4] text-white shadow-md shadow-blue-500/25 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Folder className="w-5 h-5 shrink-0" />
                <span>Sơ đồ cây phòng ban</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("salary_bands")}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-medium text-sm transition-all cursor-pointer ${
                  activeTab === "salary_bands"
                    ? "bg-[#4285F4] text-white shadow-md shadow-blue-500/25 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <DollarSign className="w-5 h-5 shrink-0" />
                <span>Chức danh & Dải lương</span>
              </button>
            </nav>

            {/* Quy chuẩn an toàn thông tin S2-05 */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#4285F4]">
                <ShieldCheck className="w-4 h-4" />
                <span>Bảo Mật S2-05</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Dải lương tối thiểu và tối đa được bảo vệ nghiêm ngặt. Chỉ tài khoản với vai trò <strong>HR Manager</strong> mới được phân quyền xem và chỉnh sửa.
              </p>
            </div>
          </div>
        </aside>

        {/* WORKSPACE CHÍNH: TÍCH HỢP MASTER DATA MANAGEMENT VIEW */}
        <main className="flex-1 min-w-0">
          <MasterDataManagementView activeTab={activeTab} onTabChange={setActiveTab} />
        </main>
      </div>
    </div>
  );
}
