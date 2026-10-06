"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  ChevronDown,
  ChevronUp,
  Network,
  Settings2,
  Wallet,
  GitBranch,
  UserCheck,
  Server,
  FileText,
  DollarSign,
  Users,
} from "lucide-react";

export type HRMenuTab =
  | "overview" // Tổng quan (Dashboard báo cáo)
  | "dept_tree" // Sơ đồ cây phòng ban
  | "salary_bands" // Chức danh & Dải lương
  | "org_chart" // Sơ đồ tổ chức
  | "category_config" // Cấu hình danh mục
  | "headcount" // Ngân sách Headcount
  | "workflow" // Luồng phê duyệt
  | "assignment"; // Phân công công việc

interface SidebarProps {
  activeTab: HRMenuTab;
  onTabChange: (tab: HRMenuTab) => void;
  className?: string;
}

export function Sidebar({ activeTab, onTabChange, className = "" }: SidebarProps) {
  // State đóng/mở Accordion cho mục Tổng quan (Dashboard)
  const [isOverviewOpen, setIsOverviewOpen] = useState<boolean>(true);

  // Kiểm tra xem một trong các tab con của Tổng quan có đang active hay không
  const isOverviewChildActive =
    activeTab === "overview" ||
    activeTab === "dept_tree" ||
    activeTab === "salary_bands";

  return (
    <aside
      className={`sticky top-6 h-[calc(100vh-48px)] overflow-y-auto bg-white rounded-3xl shadow-sm [&::-webkit-scrollbar]:hidden w-72 shrink-0 p-4 flex flex-col justify-between border border-gray-100 ${className}`}
    >
      <div className="space-y-4">
        {/* Tiêu đề Menu */}
        <div className="px-4 py-2 flex items-center justify-between border-b border-gray-100 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            MENU NHÂN SỰ
          </span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>

        {/* Danh sách Menu */}
        <nav className="space-y-1.5">
          {/* ================================================================= */}
          {/* MỤC 1: TỔNG QUAN (DASHBOARD) - ACCORDION MULTI-LEVEL */}
          {/* ================================================================= */}
          <div>
            <button
              type="button"
              onClick={() => setIsOverviewOpen((prev) => !prev)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                isOverviewChildActive
                  ? "bg-blue-500 text-white font-semibold shadow-md shadow-blue-500/25"
                  : "text-slate-700 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard
                  className={`w-5 h-5 shrink-0 ${
                    isOverviewChildActive ? "text-white" : "text-slate-500"
                  }`}
                />
                <span className="text-left font-medium">Tổng quan (Dashboard)</span>
              </div>
              <span className="ml-2 shrink-0">
                {isOverviewOpen ? (
                  <ChevronUp className="w-4 h-4 transition-transform duration-200" />
                ) : (
                  <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                )}
              </span>
            </button>

            {/* CÁC MỤC CON KHI MỞ ACCORDION */}
            {isOverviewOpen && (
              <div className="mt-1 space-y-1 pl-4 border-l-2 border-slate-100 ml-4 py-1 animate-fade-in">
                {/* Mục con 1: "Tổng quan" (Dashboard báo cáo) */}
                <button
                  type="button"
                  onClick={() => onTabChange("overview")}
                  className={`w-full flex items-center gap-2.5 pl-6 pr-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors text-left cursor-pointer ${
                    activeTab === "overview"
                      ? "bg-blue-50 text-blue-600 font-bold"
                      : "bg-transparent text-slate-500 hover:text-blue-600 hover:bg-blue-50/50"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Tổng quan</span>
                </button>

                {/* Mục con 2: "Sơ đồ cây phòng ban" */}
                <button
                  type="button"
                  onClick={() => onTabChange("dept_tree")}
                  className={`w-full flex items-center gap-2.5 pl-6 pr-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors text-left cursor-pointer ${
                    activeTab === "dept_tree"
                      ? "bg-blue-50 text-blue-600 font-bold"
                      : "bg-transparent text-slate-500 hover:text-blue-600 hover:bg-blue-50/50"
                  }`}
                >
                  <Network className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Sơ đồ cây phòng ban</span>
                </button>

                {/* Mục con 3: "Chức danh & Dải lương" */}
                <button
                  type="button"
                  onClick={() => onTabChange("salary_bands")}
                  className={`w-full flex items-center gap-2.5 pl-6 pr-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors text-left cursor-pointer ${
                    activeTab === "salary_bands"
                      ? "bg-blue-50 text-blue-600 font-bold"
                      : "bg-transparent text-slate-500 hover:text-blue-600 hover:bg-blue-50/50"
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Chức danh & Dải lương</span>
                </button>
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* MỤC 2: SƠ ĐỒ TỔ CHỨC */}
          {/* ================================================================= */}
          <button
            type="button"
            onClick={() => onTabChange("org_chart")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-200 cursor-pointer ${
              activeTab === "org_chart"
                ? "bg-blue-500 text-white font-semibold shadow-md shadow-blue-500/25"
                : "text-slate-700 hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <Users
                className={`w-5 h-5 shrink-0 ${
                  activeTab === "org_chart" ? "text-white" : "text-slate-500"
                }`}
              />
              <span className="text-left font-medium">Sơ đồ tổ chức</span>
            </div>
          </button>

          {/* ================================================================= */}
          {/* MỤC 3: CẤU HÌNH DANH MỤC */}
          {/* ================================================================= */}
          <button
            type="button"
            onClick={() => onTabChange("category_config")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-200 cursor-pointer ${
              activeTab === "category_config"
                ? "bg-blue-500 text-white font-semibold shadow-md shadow-blue-500/25"
                : "text-slate-700 hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <Settings2
                className={`w-5 h-5 shrink-0 ${
                  activeTab === "category_config" ? "text-white" : "text-slate-500"
                }`}
              />
              <span className="text-left font-medium">Cấu hình danh mục</span>
            </div>
          </button>

          {/* ================================================================= */}
          {/* MỤC 4: NGÂN SÁCH HEADCOUNT */}
          {/* ================================================================= */}
          <button
            type="button"
            onClick={() => onTabChange("headcount")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-200 cursor-pointer ${
              activeTab === "headcount"
                ? "bg-blue-500 text-white font-semibold shadow-md shadow-blue-500/25"
                : "text-slate-700 hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <Wallet
                className={`w-5 h-5 shrink-0 ${
                  activeTab === "headcount" ? "text-white" : "text-slate-500"
                }`}
              />
              <span className="text-left font-medium">Ngân sách Headcount</span>
            </div>
          </button>

          {/* ================================================================= */}
          {/* MỤC 5: LUỒNG PHÊ DUYỆT */}
          {/* ================================================================= */}
          <button
            type="button"
            onClick={() => onTabChange("workflow")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-200 cursor-pointer ${
              activeTab === "workflow"
                ? "bg-blue-500 text-white font-semibold shadow-md shadow-blue-500/25"
                : "text-slate-700 hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <GitBranch
                className={`w-5 h-5 shrink-0 ${
                  activeTab === "workflow" ? "text-white" : "text-slate-500"
                }`}
              />
              <span className="text-left font-medium">Luồng phê duyệt</span>
            </div>
          </button>

          {/* ================================================================= */}
          {/* MỤC 6: PHÂN CÔNG CÔNG VIỆC */}
          {/* ================================================================= */}
          <button
            type="button"
            onClick={() => onTabChange("assignment")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-200 cursor-pointer ${
              activeTab === "assignment"
                ? "bg-blue-500 text-white font-semibold shadow-md shadow-blue-500/25"
                : "text-slate-700 hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <UserCheck
                className={`w-5 h-5 shrink-0 ${
                  activeTab === "assignment" ? "text-white" : "text-slate-500"
                }`}
              />
              <span className="text-left font-medium">Phân công công việc</span>
            </div>
          </button>
        </nav>
      </div>

      {/* THẺ TRẠNG THÁI HỆ THỐNG / CHỈ SỐ NHANH DƯỚI CÙNG SIDEBAR */}
      <div className="pt-4 border-t border-gray-100">
        <div className="bg-slate-50 rounded-2xl p-3.5 border border-gray-100">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1">
            <Server className="w-3.5 h-3.5 text-blue-500" />
            <span>Trạng thái máy chủ</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Hoạt động ổn định (99.98%)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Phiên bản hệ thống: v2.4.0-prod
          </p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
