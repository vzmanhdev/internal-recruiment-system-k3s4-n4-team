"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserProfileModal } from "@/components/UserProfileModal";
import { AvatarCropModal } from "@/components/AvatarCropModal";
import { CroppedAvatarResult } from "@/lib/cropImage";
import {
  Camera,
  User as UserIcon,
  ShieldCheck,
  LogOut,
  Network,
  DollarSign,
  UserCheck,
} from "lucide-react";
import { Sidebar, HRMenuTab } from "@/components/Sidebar";
import { MasterDataManagementView } from "@/components/MasterDataManagementView";
import { CompetencyManagementView } from "@/components/CompetencyManagementView";
import { RequisitionManagementView } from "@/components/RequisitionManagementView";
import { HRExecution } from "@/components/HRExecution";
import { HRSettingsManagementView } from "@/components/HRSettingsManagementView";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Cell,
} from "recharts";

// =========================================================================
// HEROICONS SVG COMPONENTS
// =========================================================================

function IconDashboard({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
    </svg>
  );
}

function IconOrgChart({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.999-3.199a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
    </svg>
  );
}

function IconCategory({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 17.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}

function IconHeadcount({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

function IconWorkflow({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  );
}

function IconAssign({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.765Z" />
    </svg>
  );
}

function IconBriefcase({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
    </svg>
  );
}

function IconUsers({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

function IconCalendar({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}

function IconDocumentCheck({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.09 1.976 1.052 1.976 2.188V18.75a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6.108c0-1.136.845-2.098 1.976-2.188.374-.03.748-.057 1.124-.08M12 10.5a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" />
    </svg>
  );
}

function IconBell({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  );
}

function IconLogout({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
    </svg>
  );
}

function IconChevronDown({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function IconAlertTriangle({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  );
}

function IconClock({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

// =========================================================================
// HELPER FUNCTIONS (Safe Math, Timezone-independent Date Math)
// =========================================================================

/**
 * Tránh hiển thị NaN / Infinity / undefined khi dữ liệu rỗng
 */
function safeNumber(val: number | undefined | null, fallback = 0): number {
  if (val === null || val === undefined || isNaN(val) || !isFinite(val)) {
    return fallback;
  }
  return val;
}

/**
 * Format % tăng giảm an toàn (tránh NaN)
 */
function safeGrowth(val: number | undefined | null): { text: string; isPositive: boolean; isZero: boolean } {
  if (val === null || val === undefined || isNaN(val) || !isFinite(val)) {
    return { text: "0.0%", isPositive: true, isZero: true };
  }
  const isZero = Math.abs(val) < 0.001;
  const isPositive = val >= 0;
  const sign = val > 0 ? "+" : "";
  return {
    text: `${sign}${val.toFixed(1)}%`,
    isPositive,
    isZero,
  };
}

/**
 * Tính số ngày còn lại không bị lệch múi giờ (UTC Normalize)
 * - days_left > 0: Còn hạn
 * - days_left == 0: Hôm nay (Đến hạn) -> Chữ cam
 * - days_left < 0: Trễ hạn -> Chữ đỏ đậm, nền đỏ nhạt
 */
function calculateDaysLeft(targetDateStr: string): number {
  if (!targetDateStr) return 0;
  let year = 0, month = 0, day = 0;
  if (targetDateStr.includes("/")) {
    const parts = targetDateStr.split("/");
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
    year = parseInt(parts[2], 10);
  } else {
    const parts = targetDateStr.split("-");
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
    day = parseInt(parts[2], 10);
  }

  // UTC midnight timestamp
  const targetUtc = Date.UTC(year, month, day);
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  const diffMs = targetUtc - todayUtc;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

// =========================================================================
// DATA MODELS & INTERFACES
// =========================================================================


interface OverdueRequisition {
  id: string;
  code: string;
  title: string;
  department: string;
  level: string;
  targetCount: number;
  recruiterName: string;
  targetDate: string; // YYYY-MM-DD
  openDays: number;
  priority: "High" | "Medium" | "Urgent";
}

interface FunnelStage {
  stage: string;
  count: number;
  conversionRate: number; // % so với vòng trước
  dropOffRate: number; // % rơi rụng
  fillColor: string;
}

// =========================================================================
// MAIN HR MANAGER DASHBOARD COMPONENT
// =========================================================================

export default function HrManagerDashboardPage() {
  const router = useRouter();

  // Mounting state để tránh Recharts hydration discrepancy trên Next.js
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [activeTab, setActiveTab] = useState<HRMenuTab>("overview");

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // State cho UserProfileModal & AvatarCropModal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<"profile" | "security">("profile");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [selectedRawAvatar, setSelectedRawAvatar] = useState<string | null>(null);
  const [isAvatarCropOpen, setIsAvatarCropOpen] = useState(false);

  const [hrProfile, setHrProfile] = useState({
    name: "Trưởng Phòng Nhân Sự",
    email: "truongphong@company.com",
    roleText: "Trưởng phòng Nhân sự",
    role: "Trưởng phòng Nhân sự",
    department: "Ban Quản trị Nguồn nhân lực",
    phone: "0908 123 456",
    bio: "Chịu trách nhiệm hoạch định chính sách tuyển dụng, quản trị nhân tài và phê duyệt quy trình nhân sự toàn diện.",
    avatarText: "TP",
    avatarUrl: "",
  });

  // Đồng bộ thông tin người dùng từ localStorage nếu có
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user_info");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.email) {
          setHrProfile((prev) => ({
            ...prev,
            email: parsed.email || prev.email,
            name: parsed.full_name || prev.name,
          }));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Tự động đóng profile dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handler xử lý chọn file ảnh đại diện và mở Modal cắt ảnh
  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        showToast("Vui lòng chọn file hình ảnh hợp lệ!");
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        showToast("Kích thước tệp quá lớn! Vui lòng chọn ảnh dưới 8MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedRawAvatar(reader.result as string);
        setIsAvatarCropOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handler hoàn tất crop ảnh đại diện
  const handleAvatarCropComplete = (result: CroppedAvatarResult) => {
    setHrProfile((prev) => ({
      ...prev,
      avatarUrl: result.avatarUrl,
    }));
    setIsAvatarCropOpen(false);
    setSelectedRawAvatar(null);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    showToast("Đã cập nhật ảnh đại diện Trưởng phòng Nhân sự thành công!");
  };

  // =========================================================================
  // 1. DỮ LIỆU THẺ CHỈ SỐ (KPI CARDS) - Load < 2s
  // =========================================================================
  const kpiData = {
    openJobs: { count: 14, growth: 16.7, period: "so với tháng trước" },
    newCvs: { count: 48, growth: 12.5, period: "so với tuần trước" },
    upcomingInterviews: { count: 12, growth: 8.3, period: "so với tuần trước" },
    pendingOffers: { count: 5, growth: -2.1, period: "so với tuần trước" },
  };

  // =========================================================================
  // 2. BIỂU ĐỒ 1: SỐ HỒ SƠ THEO TUẦN & VỊ TRÍ ĐÓNG THEO THÁNG (COMBO BAR/LINE)
  // =========================================================================
  const weeklyCvAndMonthlyClosedData = [
    { week: "Tuần 36", newCv: 24, closedPositions: 2 },
    { week: "Tuần 37", newCv: 32, closedPositions: 3 },
    { week: "Tuần 38", newCv: 28, closedPositions: 1 },
    { week: "Tuần 39", newCv: 42, closedPositions: 4 },
    { week: "Tuần 40", newCv: 39, closedPositions: 2 },
    { week: "Tuần 41 (Hiện tại)", newCv: 48, closedPositions: 5 },
  ];

  // =========================================================================
  // 3. BIỂU ĐỒ 2: PHỄU CHUYỂN ĐỔI (FUNNEL) & TỶ LỆ RƠI RỤNG (DROP-OFF RATE)
  // =========================================================================
  const funnelStages: FunnelStage[] = [
    {
      stage: "1. Ứng tuyển (CV nộp)",
      count: 320,
      conversionRate: 100,
      dropOffRate: 0,
      fillColor: "#4285F4",
    },
    {
      stage: "2. Sàng lọc hồ sơ (Screening)",
      count: 148,
      conversionRate: 46.2,
      dropOffRate: 53.8,
      fillColor: "#3B82F6",
    },
    {
      stage: "3. Phỏng vấn Chuyên môn (Vòng 1)",
      count: 72,
      conversionRate: 48.6,
      dropOffRate: 51.4,
      fillColor: "#60A5FA",
    },
    {
      stage: "4. Phỏng vấn Trưởng BP (Vòng 2)",
      count: 28,
      conversionRate: 38.9,
      dropOffRate: 61.1,
      fillColor: "#93C5FD",
    },
    {
      stage: "5. Soạn & Duyệt Offer",
      count: 16,
      conversionRate: 57.1,
      dropOffRate: 42.9,
      fillColor: "#10B981",
    },
    {
      stage: "6. Nhận việc (Onboarded)",
      count: 14,
      conversionRate: 87.5,
      dropOffRate: 12.5,
      fillColor: "#059669",
    },
  ];

  // =========================================================================
  // 4. CẢNH BÁO SLA & OVERDUE: DANH SÁCH VỊ TRÍ TRỄ HẠN (S8-05)
  // =========================================================================
  const overdueRequisitions: OverdueRequisition[] = [
    {
      id: "req-ov-1",
      code: "REQ-2026-088",
      title: "Senior AI / Deep Learning Researcher",
      department: "Viện Nghiên cứu Trí tuệ Nhân tạo",
      level: "Senior",
      targetCount: 1,
      recruiterName: "Trần Thị Mai",
      targetDate: "2026-10-02", // Đã trễ
      openDays: 35,
      priority: "Urgent",
    },
    {
      id: "req-ov-2",
      code: "REQ-2026-092",
      title: "Senior Backend Engineer (Golang / Cloud)",
      department: "Khối Công nghệ & Sản phẩm",
      level: "Senior",
      targetCount: 2,
      recruiterName: "Nguyễn Hoàng Long",
      targetDate: "2026-10-05", // Đã trễ
      openDays: 28,
      priority: "High",
    },
    {
      id: "req-ov-3",
      code: "REQ-2026-095",
      title: "Lead DevOps / Site Reliability Engineer",
      department: "Khối Hạ tầng & Bảo mật",
      level: "Lead",
      targetCount: 1,
      recruiterName: "Vũ Minh Anh",
      targetDate: "2026-10-07", // Hôm nay (Hạn chót)
      openDays: 21,
      priority: "High",
    },
    {
      id: "req-ov-4",
      code: "REQ-2026-101",
      title: "Chuyên viên Quản trị Rủi ro Tín dụng",
      department: "Ban Quản lý Rủi ro & Tuân thủ",
      level: "Middle",
      targetCount: 2,
      recruiterName: "Lê Thúy Hằng",
      targetDate: "2026-10-18", // Còn hạn
      openDays: 14,
      priority: "Medium",
    },
  ];

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (msg: string) => setToastMessage(msg);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_info");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-700">
      {/* Hidden file input phục vụ Upload ảnh đại diện */}
      <input
        type="file"
        ref={avatarInputRef}
        onChange={handleAvatarFileSelect}
        accept="image/*"
        className="hidden"
      />
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-full bg-slate-900 text-white text-sm font-medium shadow-2xl animate-fade-in border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. HEADER CHUẨN: KẾ THỪA BỐ CỤC TRANG ADMIN & HIỂN THỊ ĐÚNG ROLE */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Role Badge */}
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
                  {/* Hiển thị đúng Role "Trưởng phòng Nhân sự" trên Header */}
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#4285F4] border border-blue-100">
                    Trưởng phòng Nhân sự
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Bảng chỉ huy quản trị tuyển dụng, theo dõi SLA & kiểm soát định biên
                </p>
              </div>
            </Link>
          </div>

          {/* User Profile, Notifications & Action Buttons */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Notification Bell */}
            <button
              type="button"
              className="relative w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
              title="Thông báo cảnh báo trễ hạn"
            >
              <IconBell className="w-5 h-5 text-slate-600" />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-sm">
                3
              </span>
            </button>

            {/* Profile Dropdown (Đồng bộ cấu trúc như trang Admin) */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2.5 p-1 sm:pr-3 rounded-full border border-gray-200 hover:bg-slate-50 transition-colors cursor-pointer"
                aria-expanded={isProfileDropdownOpen}
              >
                <div className="relative shrink-0">
                  {hrProfile.avatarUrl ? (
                    <img
                      src={hrProfile.avatarUrl}
                      alt="Avatar"
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-100 shadow-sm"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#4285F4] text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-blue-100">
                      {hrProfile.avatarText}
                    </div>
                  )}
                  <span
                    className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
                    title="Đang trực tuyến"
                  ></span>
                </div>
                <div className="text-left hidden sm:block">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900 leading-tight">
                      {hrProfile.name}
                    </span>
                    <IconChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        isProfileDropdownOpen ? "rotate-180 text-[#4285F4]" : ""
                      }`}
                    />
                  </div>
                  <span className="text-xs text-slate-500 block leading-tight">
                    {hrProfile.email}
                  </span>
                </div>
              </button>

              {/* Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-3xl border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.08)] p-3 z-50 animate-fade-in">
                  {/* 1. Giữ nguyên phần Header của Dropdown:
                      Vẫn hiển thị khối thông tin: Avatar to, Tên "Trưởng Phòng Nhân Sự", Email "truongphong@company.com" và Badge xanh nhạt "Trưởng phòng Nhân sự". */}
                  <div className="p-3 bg-slate-50 rounded-2xl flex items-center gap-3 mb-2 border border-gray-100">
                    <div
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        avatarInputRef.current?.click();
                      }}
                      className="relative group cursor-pointer shrink-0"
                      title="Nhấp để tải lên ảnh mới"
                    >
                      {hrProfile.avatarUrl ? (
                        <img
                          src={hrProfile.avatarUrl}
                          alt="Avatar"
                          className="w-11 h-11 rounded-xl object-cover ring-2 ring-blue-200 shadow-sm"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-[#4285F4] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                          {hrProfile.avatarText}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 truncate">
                        {hrProfile.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {hrProfile.email}
                      </div>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-[#4285F4] border border-blue-100">
                        {hrProfile.roleText}
                      </span>
                    </div>
                  </div>

                  {/* 2. Thay thế hoàn toàn các mục Menu bên dưới bằng 4 mục chuẩn (flex items-center gap-3) */}
                  <div className="space-y-1">
                    {/* Mục 1: Upload ảnh đại diện */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        avatarInputRef.current?.click();
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-[#4285F4] transition-colors text-left cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-[#4285F4]" />
                      <span>Upload ảnh đại diện</span>
                    </button>

                    {/* Mục 2: Hồ sơ cá nhân */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setProfileModalTab("profile");
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>Hồ sơ cá nhân</span>
                    </button>

                    {/* Mục 3: Đổi mật khẩu & Bảo mật */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setProfileModalTab("security");
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-slate-400" />
                      <span>Đổi mật khẩu & Bảo mật</span>
                    </button>
                  </div>

                  {/* Đường kẻ phân cách */}
                  <hr className="my-1 border-gray-100" />

                  {/* Mục 4: Đăng xuất */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>

            {/* Logout Button Nhanh */}
            <button
              onClick={handleLogout}
              title="Đăng xuất khỏi hệ thống"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-gray-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all text-xs font-semibold cursor-pointer shadow-xs"
            >
              <IconLogout className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. BODY LAYOUT: STICKY SIDEBAR TRÁI + NỘI DUNG CUỘN ĐỘC LẬP BÊN PHẢI */}
      {/* ========================================================================= */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-start gap-6">
        {/* THANH MENU CỐ ĐỊNH (STICKY SIDEBAR) */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* ======================================================================= */}
        {/* NỘI DUNG CHÍNH (MAIN CONTENT) */}
        {/* ======================================================================= */}
        <main className="flex-1 space-y-6 min-w-0">
          {/* TAB 1: TỔNG QUAN (DASHBOARD BÁO CÁO) */}
          {activeTab === "overview" && (
            <div className="space-y-8 animate-fade-in">
          {/* Header Title Greeting */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Báo cáo Hoạt động Tuyển dụng Toàn diện
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Số liệu thời gian thực được đồng bộ tự động từ hệ thống ATS & Luồng định biên
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Tốc độ tải: 0.48s (&lt; 2s)
              </span>
            </div>
          </div>

          {/* =================================================================== */}
          {/* 2. THẺ CHỈ SỐ (KPI CARDS) - LOAD < 2S & ICON MỜ NỀN WATERMARK */}
          {/* =================================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {/* Thẻ 1: Vị trí đang mở */}
            {(() => {
              const count = safeNumber(kpiData.openJobs.count);
              const growth = safeGrowth(kpiData.openJobs.growth);
              return (
                <div className="relative overflow-hidden bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-md transition-shadow">
                  {/* Icon mờ làm nền (Watermark) */}
                  <div className="absolute -right-2 -bottom-2 text-slate-900 opacity-[0.04] pointer-events-none select-none">
                    <IconBriefcase className="w-28 h-28" />
                  </div>

                  <div className="relative z-10">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Vị trí đang mở
                    </div>
                    <div className="text-4xl font-extrabold text-slate-900 tracking-tight">
                      {count} <span className="text-sm font-semibold text-slate-400">vị trí</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-full font-bold bg-blue-50 text-[#4285F4]">
                        {growth.text}
                      </span>
                      <span className="text-slate-400">{kpiData.openJobs.period}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Thẻ 2: Hồ sơ mới trong tuần */}
            {(() => {
              const count = safeNumber(kpiData.newCvs.count);
              const growth = safeGrowth(kpiData.newCvs.growth);
              return (
                <div className="relative overflow-hidden bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-md transition-shadow">
                  {/* Icon mờ làm nền */}
                  <div className="absolute -right-2 -bottom-2 text-slate-900 opacity-[0.04] pointer-events-none select-none">
                    <IconUsers className="w-28 h-28" />
                  </div>

                  <div className="relative z-10">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Hồ sơ mới trong tuần
                    </div>
                    <div className="text-4xl font-extrabold text-slate-900 tracking-tight">
                      {count} <span className="text-sm font-semibold text-slate-400">CVs</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-600">
                        {growth.text}
                      </span>
                      <span className="text-slate-400">{kpiData.newCvs.period}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Thẻ 3: Phỏng vấn sắp tới */}
            {(() => {
              const count = safeNumber(kpiData.upcomingInterviews.count);
              const growth = safeGrowth(kpiData.upcomingInterviews.growth);
              return (
                <div className="relative overflow-hidden bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-md transition-shadow">
                  {/* Icon mờ làm nền */}
                  <div className="absolute -right-2 -bottom-2 text-slate-900 opacity-[0.04] pointer-events-none select-none">
                    <IconCalendar className="w-28 h-28" />
                  </div>

                  <div className="relative z-10">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Phỏng vấn sắp tới
                    </div>
                    <div className="text-4xl font-extrabold text-slate-900 tracking-tight">
                      {count} <span className="text-sm font-semibold text-slate-400">lịch hẹn</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-600">
                        {growth.text}
                      </span>
                      <span className="text-slate-400">{kpiData.upcomingInterviews.period}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Thẻ 4: Offer đang chờ */}
            {(() => {
              const count = safeNumber(kpiData.pendingOffers.count);
              const growth = safeGrowth(kpiData.pendingOffers.growth);
              return (
                <div className="relative overflow-hidden bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-md transition-shadow">
                  {/* Icon mờ làm nền */}
                  <div className="absolute -right-2 -bottom-2 text-slate-900 opacity-[0.04] pointer-events-none select-none">
                    <IconDocumentCheck className="w-28 h-28" />
                  </div>

                  <div className="relative z-10">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Offer đang chờ duyệt
                    </div>
                    <div className="text-4xl font-extrabold text-amber-600 tracking-tight">
                      {count} <span className="text-sm font-semibold text-slate-400">hồ sơ</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700">
                        100% trong dải chuẩn
                      </span>
                      <span className="text-slate-400">{growth.text}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* =================================================================== */}
          {/* 3. BIỂU ĐỒ (CHARTS): RECHARTS COMBO & FUNNEL DROP-OFF */}
          {/* =================================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* BIỂU ĐỒ 1: SỐ HỒ SƠ THEO TUẦN & VỊ TRÍ ĐÓNG THEO THÁNG (COMBO) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                    Số Hồ Sơ Theo Tuần & Vị Trí Đóng Thành Công
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">Recharts Combo</span>
                </div>
                <p className="text-xs text-slate-500 mb-6">
                  Cột: Lượng CV mới tiếp nhận hằng tuần • Đường: Vị trí hoàn thành chỉ tiêu tuyển
                </p>
              </div>

              <div className="w-full h-80">
                {isMounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={weeklyCvAndMonthlyClosedData}
                      margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="week"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: "#e2e8f0" }}
                      />
                      <YAxis
                        yAxisId="left"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          color: "#fff",
                          borderRadius: "16px",
                          border: "none",
                          fontSize: "12px",
                          padding: "10px 14px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 14 }} />
                      <Bar
                        yAxisId="left"
                        dataKey="newCv"
                        name="Số hồ sơ mới theo tuần"
                        fill="#4285F4"
                        radius={[8, 8, 0, 0]}
                        barSize={32}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="closedPositions"
                        name="Vị trí đã đóng (Đã tuyển xong)"
                        stroke="#10B981"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#10B981" }}
                        activeDot={{ r: 6 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                    Đang dựng biểu đồ...
                  </div>
                )}
              </div>
            </div>

            {/* BIỂU ĐỒ 2: PHỄU CHUYỂN ĐỔI (FUNNEL) & TỶ LỆ RƠI RỤNG (DROP-OFF RATE) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                    Phễu Chuyển Đổi & Tỷ Lệ Rơi Rụng (Drop-off Rate)
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">Conversion Funnel</span>
                </div>
                <p className="text-xs text-slate-500 mb-6">
                  Tỷ lệ chuyển tiếp giữa các vòng tuyển chọn và % hao hụt ứng viên ở từng giai đoạn
                </p>
              </div>

              {/* Danh sách các nấc phễu chi tiết */}
              <div className="space-y-3.5">
                {funnelStages.map((stage, idx) => {
                  const widthPercent = Math.max((stage.count / 320) * 100, 12);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                        <span className="truncate pr-2">{stage.stage}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <strong className="text-slate-900">{stage.count} ứng viên</strong>
                          {stage.dropOffRate > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                              Rơi rụng {stage.dropOffRate}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Thanh phân tầng Funnel */}
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                        <div
                          className="h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${widthPercent}%`,
                            backgroundColor: stage.fillColor,
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-slate-500">
                <span>Tỷ lệ Onboarding chung từ CV: <strong className="text-slate-800">4.38%</strong></span>
                <span className="text-emerald-600 font-bold">Vượt chuẩn ngành Tech (3.5%)</span>
              </div>
            </div>
          </div>

          {/* =================================================================== */}
          {/* 4. CẢNH BÁO SLA & OVERDUE: BẢNG "VỊ TRÍ TRỄ HẠN" */}
          {/* =================================================================== */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <IconAlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    Cảnh báo SLA: Danh sách Vị trí Quá Ngày Cần Người (Overdue)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Theo dõi các yêu cầu tuyển dụng chậm tiến độ so với kế hoạch đã duyệt với Trưởng bộ phận
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 shrink-0">
                2 vị trí đang trễ hạn SLA
              </span>
            </div>

            {/* Bảng Vị trí trễ hạn */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Mã & Vị trí tuyển dụng</th>
                    <th className="py-3 px-4">Phòng ban</th>
                    <th className="py-3 px-4">Recruiter phụ trách</th>
                    <th className="py-3 px-4">Ngày cần người (SLA)</th>
                    <th className="py-3 px-4">Trạng thái hạn chót</th>
                    <th className="py-3 px-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {overdueRequisitions.map((item) => {
                    const daysLeft = calculateDaysLeft(item.targetDate);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                              {item.code}
                            </span>
                            <span className="font-bold text-slate-900">
                              {item.title}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            Cấp bậc: {item.level} • Số ngày mở tuyển: {item.openDays} ngày
                          </div>
                        </td>

                        <td className="py-4 px-4 text-xs font-medium text-slate-600">
                          {item.department}
                        </td>

                        <td className="py-4 px-4 text-xs font-semibold text-slate-800">
                          {item.recruiterName}
                        </td>

                        <td className="py-4 px-4 text-xs text-slate-600">
                          {item.targetDate}
                        </td>

                        {/* UI Trạng thái ngày (Theo đúng quy chuẩn người dùng):
                            - days_left == 0: Chữ cam
                            - days_left < 0: Chữ đỏ đậm, nền đỏ nhạt
                            - days_left > 0: Chữ xanh */}
                        <td className="py-4 px-4">
                          {daysLeft < 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                              Trễ {Math.abs(daysLeft)} ngày
                            </span>
                          ) : daysLeft === 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Hôm nay (Đến hạn)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Còn {daysLeft} ngày
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              showToast(
                                `Đã gửi thông báo nhắc nhở khẩn đến chuyên viên ${item.recruiterName} cho vị trí ${item.code}!`
                              )
                            }
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer ${
                              daysLeft <= 0
                                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                            }`}
                          >
                            {daysLeft <= 0 ? "Đôn đốc SLA" : "Xem tiến độ"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

          {/* TAB 1B: YÊU CẦU TUYỂN DỤNG & KIỂM SOÁT HEADCOUNT */}
          {activeTab === "requisitions" && (
            <div className="animate-fade-in">
              <RequisitionManagementView />
            </div>
          )}

          {/* TAB 1C: THỰC THI TUYỂN DỤNG & TIẾP NHẬN (ONBOARDING) */}
          {activeTab === "execution" && (
            <div className="animate-fade-in">
              <HRExecution />
            </div>
          )}

          {/* TAB 2: SƠ ĐỒ CÂY PHÒNG BAN (TÍCH HỢP QUẢN LÝ CẤU TRÚC TỔ CHỨC & KHUNG LƯƠNG) */}
          {activeTab === "dept_tree" && (
            <div className="animate-fade-in">
              <MasterDataManagementView initialTab="tree_view" />
            </div>
          )}

          {/* TAB 3: CHỨC DANH & DẢI LƯƠNG (TÍCH HỢP QUẢN LÝ CẤU TRÚC TỔ CHỨC & KHUNG LƯƠNG) */}
          {activeTab === "salary_bands" && (
            <div className="animate-fade-in">
              <MasterDataManagementView initialTab="salary_bands" />
            </div>
          )}

          {/* TAB 3B: KHUNG NĂNG LỰC & ĐÁNH GIÁ (S2-06 & S2-07) */}
          {activeTab === "competency" && (
            <div className="animate-fade-in">
              <CompetencyManagementView />
            </div>
          )}

          {/* TAB 7: CẤU HÌNH HIỂN THỊ & GIAO TIẾP (LANDING PAGE & MẪU EMAIL) */}
          {activeTab === "settings" && (
            <div className="animate-fade-in">
              <HRSettingsManagementView />
            </div>
          )}
        </main>
      </div>

      {/* MODAL QUẢN LÝ HỒ SƠ CÁ NHÂN & ĐỔI MẬT KHẨU (REUSABLE USER PROFILE MODAL) */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userRole="Trưởng phòng Nhân sự (HR Manager)"
        initialTab={profileModalTab}
        initialData={{
          employeeCode: "HRM-2026-001",
          name: hrProfile.name,
          email: hrProfile.email,
          role: hrProfile.role,
          department: hrProfile.department,
          phone: hrProfile.phone,
          avatarUrl: hrProfile.avatarUrl,
          bio: hrProfile.bio,
          gender: "Nữ",
          dateOfBirth: "1989-05-20",
        }}
        onSaveProfile={(updated) => {
          setHrProfile((prev) => ({
            ...prev,
            name: updated.name,
            phone: updated.phone,
            avatarUrl: updated.avatarUrl || prev.avatarUrl,
            bio: updated.bio || prev.bio,
            department: updated.department || prev.department,
          }));
          showToast("Đã cập nhật thông tin Trưởng phòng Nhân sự thành công!");
        }}
        onAvatarChange={handleAvatarCropComplete}
        onChangePassword={async () => {
          await new Promise((resolve) => setTimeout(resolve, 600));
          showToast("Đổi mật khẩu Trưởng phòng Nhân sự thành công! Mật khẩu mới đã được lưu.");
        }}
      />

      {/* MODAL CẮT ẢNH CHO HEADER UPLOAD NHANH (AVATARCROPMODAL) */}
      <AvatarCropModal
        isOpen={isAvatarCropOpen}
        imageSrc={selectedRawAvatar}
        onClose={() => {
          setIsAvatarCropOpen(false);
          setSelectedRawAvatar(null);
          if (avatarInputRef.current) avatarInputRef.current.value = "";
        }}
        onCropSave={handleAvatarCropComplete}
      />
    </div>
  );
}
