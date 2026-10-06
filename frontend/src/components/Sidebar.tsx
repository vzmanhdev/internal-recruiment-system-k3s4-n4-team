"use client";

import React from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Briefcase,
  UserCheck,
  Network,
  DollarSign,
  Award,
  Globe,
  Server,
} from "lucide-react";

// =========================================================================
// 1. DATA TYPES: CHỈ GIỮ LẠI ĐÚNG 7 MỤC CHUẨN, XÓA TOÀN BỘ CÁC MỤC CŨ
// =========================================================================

export type HRMenuTab =
  | "overview" // 1. Tổng quan (Dashboard KPI)
  | "requisitions" // 2. Yêu cầu tuyển dụng (Quản lý Requisition)
  | "execution" // 3. Thực thi & Tiếp nhận nhân sự (Phiếu đánh giá & Checklist Onboard)
  | "dept_tree" // 4. Sơ đồ cây phòng ban nhiều cấp (Quản lý phòng ban)
  | "salary_bands" // 5. Danh mục dải lương chuẩn theo chức danh (Quản lý mức lương)
  | "competency" // 6. Thiết lập Khung năng lực & Đánh giá (Quản lý tiêu chí & Ngân hàng câu hỏi)
  | "settings"; // 7. Cấu hình hiển thị & Giao tiếp (Landing page & Mẫu Email)

export interface MenuItemConfig {
  id: HRMenuTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

// Danh sách đúng 7 mục menu chuẩn mực theo yêu cầu
export const HR_SIDEBAR_MENU_ITEMS: MenuItemConfig[] = [
  {
    id: "overview",
    label: "Tổng quan (Dashboard KPI)",
    icon: LayoutDashboard,
    href: "/hr-manager",
  },
  {
    id: "requisitions",
    label: "Yêu cầu tuyển dụng (Quản lý Requisition)",
    icon: Briefcase,
    href: "/hr-manager/requisitions",
  },
  {
    id: "execution",
    label: "Thực thi & Tiếp nhận nhân sự (Phiếu đánh giá & Checklist Onboard)",
    icon: UserCheck,
    href: "/hr-manager/execution",
  },
  {
    id: "dept_tree",
    label: "Sơ đồ cây phòng ban nhiều cấp (Quản lý phòng ban)",
    icon: Network,
    href: "/hr-manager/master-data",
  },
  {
    id: "salary_bands",
    label: "Danh mục dải lương chuẩn theo chức danh (Quản lý mức lương)",
    icon: DollarSign,
    href: "/hr-manager/master-data",
  },
  {
    id: "competency",
    label: "Thiết lập Khung năng lực & Đánh giá (Quản lý tiêu chí & Ngân hàng câu hỏi)",
    icon: Award,
    href: "/hr-manager/competency",
  },
  {
    id: "settings",
    label: "Cấu hình hiển thị & Giao tiếp (Landing page & Mẫu Email)",
    icon: Globe,
    href: "/hr-manager/settings",
  },
];

export interface SidebarProps {
  activeTab?: HRMenuTab;
  onTabChange?: (tab: HRMenuTab) => void;
  className?: string;
}

export function Sidebar({ activeTab = "overview", onTabChange, className = "" }: SidebarProps) {
  return (
    <aside
      className={`sticky top-6 h-[calc(100vh-48px)] overflow-y-auto bg-white rounded-3xl shadow-sm flex flex-col p-4 [&::-webkit-scrollbar]:hidden w-80 shrink-0 border border-gray-100 justify-between ${className}`}
    >
      <div className="space-y-4">
        {/* Tiêu đề Menu */}
        <div className="px-4 py-2 flex items-center justify-between border-b border-gray-100 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            MENU TRƯỞNG PHÒNG NHÂN SỰ
          </span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>

        {/* DANH SÁCH MENU: flex flex-col gap-2 ĐỂ KHOẢNG CÁCH ĐỀU NHAU */}
        <div className="flex flex-col gap-2">
          {HR_SIDEBAR_MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            // Nếu truyền callback onTabChange: điều khiển state activeTab để tải component tức thì
            if (onTabChange) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors cursor-pointer text-left ${
                    isActive
                      ? "bg-blue-500 text-white font-semibold shadow-md shadow-blue-500/25"
                      : "text-slate-700 hover:bg-gray-100 font-medium"
                  }`}
                >
                  {/* Icon chuẩn: w-5 h-5 shrink-0 đảm bảo luôn thẳng hàng tắp */}
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      isActive ? "text-white" : "text-slate-500"
                    }`}
                  />
                  {/* Text nhãn tiêu đề */}
                  <span className="text-left text-xs sm:text-sm leading-snug">
                    {item.label}
                  </span>
                </button>
              );
            }

            // Nếu không truyền callback onTabChange: sử dụng thẻ Link điều hướng
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors cursor-pointer text-left ${
                  isActive
                    ? "bg-blue-500 text-white font-semibold shadow-md shadow-blue-500/25"
                    : "text-slate-700 hover:bg-gray-100 font-medium"
                }`}
              >
                {/* Icon chuẩn: w-5 h-5 shrink-0 đảm bảo luôn thẳng hàng tắp */}
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? "text-white" : "text-slate-500"
                  }`}
                />
                {/* Text nhãn tiêu đề */}
                <span className="text-left text-xs sm:text-sm leading-snug">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
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
            Phiên bản hệ thống: v2.5.0-enterprise
          </p>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
