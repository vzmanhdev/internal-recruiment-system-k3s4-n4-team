"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";

import {
  Briefcase as BriefcaseIcon,
  Users as UsersIcon,
  Clock as ClockIcon,
  DollarSign as DollarSignIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ArrowUpRight as ArrowUpRightIcon,
  ArrowDownRight as ArrowDownRightIcon,
  RefreshCw as RefreshCwIcon,
  Download as DownloadIcon,
  Calendar as CalendarIcon,
  Sparkles as SparklesIcon,
  CheckCircle2 as CheckCircle2Icon,
  AlertTriangle as AlertTriangleIcon,
  ChevronRight as ChevronRightIcon,
  FileSpreadsheet as FileSpreadsheetIcon,
  Award as AwardIcon,
  Layers as LayersIcon,
  Building2 as Building2Icon,
  Percent,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";

// =============================================================================
// MOCK DATA & DEFINITIONS
// =============================================================================

// 1. Phễu Tuyển dụng (Recruitment Funnel)
const FUNNEL_DATA = [
  { stage: "Hồ sơ tiếp nhận (CV)", count: 1250, conversionFromPrev: 100, color: "#3B82F6", dropOff: 0 },
  { stage: "Sàng lọc hồ sơ (Screening)", count: 680, conversionFromPrev: 54.4, color: "#6366F1", dropOff: 45.6 },
  { stage: "Phỏng vấn chuyên môn (Interview)", count: 210, conversionFromPrev: 30.9, color: "#8B5CF6", dropOff: 69.1 },
  { stage: "Gửi thư mời (Offer Sent)", count: 48, conversionFromPrev: 22.9, color: "#EC4899", dropOff: 77.1 },
  { stage: "Đã nhận việc (Hired)", count: 36, conversionFromPrev: 75.0, color: "#10B981", dropOff: 25.0 },
];

// 2. Hiệu quả Nguồn tuyển dụng (Source of Hire)
const SOURCE_PIE_DATA = [
  { name: "LinkedIn", value: 438, percentage: 35, color: "#0A66C2" },
  { name: "Nội bộ giới thiệu", value: 350, percentage: 28, color: "#10B981" },
  { name: "Facebook & Mạng XH", value: 225, percentage: 18, color: "#1877F2" },
  { name: "Cổng tuyển dụng Portal", value: 150, percentage: 12, color: "#8B5CF6" },
  { name: "Headhunter / Agency", value: 87, percentage: 7, color: "#F59E0B" },
];

const SOURCE_EFFICIENCY_TABLE = [
  {
    source: "Nội bộ giới thiệu (Referral)",
    applied: 350,
    interviewed: 112,
    hired: 16,
    hireRate: "4.57%",
    costPerHire: "3.500.000 ₫",
    roi: "Xuất sắc (Tối ưu)",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    source: "LinkedIn Talent Solutions",
    applied: 438,
    interviewed: 58,
    hired: 11,
    hireRate: "2.51%",
    costPerHire: "6.200.000 ₫",
    roi: "Rất tốt (Chất lượng cao)",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    source: "Cổng tuyển dụng Career Portal",
    applied: 150,
    interviewed: 24,
    hired: 5,
    hireRate: "3.33%",
    costPerHire: "1.800.000 ₫",
    roi: "Chi phí thấp nhất",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    source: "Facebook & Mạng xã hội",
    applied: 225,
    interviewed: 12,
    hired: 2,
    hireRate: "0.89%",
    costPerHire: "8.500.000 ₫",
    roi: "Cần cải thiện chất lượng",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    source: "Headhunter / Agency",
    applied: 87,
    interviewed: 18,
    hired: 2,
    hireRate: "2.30%",
    costPerHire: "28.000.000 ₫",
    roi: "Chi phí cao (Dành cho C-Level)",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
  },
];

// 3. Biến động Thời gian & Chi phí tuyển dụng theo tháng (Time-to-Hire & Cost-per-Hire)
const MONTHLY_TREND_DATA = [
  { month: "T1", timeToHire: 32.5, costPerHire: 9.8, targetSLA: 25 },
  { month: "T2", timeToHire: 30.2, costPerHire: 9.2, targetSLA: 25 },
  { month: "T3", timeToHire: 28.6, costPerHire: 8.7, targetSLA: 25 },
  { month: "T4", timeToHire: 27.4, costPerHire: 8.5, targetSLA: 25 },
  { month: "T5", timeToHire: 26.1, costPerHire: 8.1, targetSLA: 25 },
  { month: "T6", timeToHire: 25.8, costPerHire: 7.8, targetSLA: 25 },
  { month: "T7", timeToHire: 29.4, costPerHire: 8.4, targetSLA: 25 }, // Điểm nghẽn mùa tuyển dụng
  { month: "T8", timeToHire: 24.6, costPerHire: 7.2, targetSLA: 25 },
  { month: "T9", timeToHire: 23.5, costPerHire: 7.0, targetSLA: 25 },
  { month: "T10 (Nay)", timeToHire: 22.4, costPerHire: 6.85, targetSLA: 25 },
];

export default function HRDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [timeRange, setTimeRange] = useState("30d");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const handleExportExcel = () => {
    alert("Đang trích xuất báo cáo phân tích tuyển dụng định dạng Excel (.xlsx)...");
  };

  return (
    <div className="w-full space-y-6">
      {/* ========================================================================= */}
      {/* HEADER SECTION: TIÊU ĐỀ & THANH CÔNG CỤ ĐIỀU HÀNH                        */}
      {/* ========================================================================= */}
      <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[10px] tracking-wider uppercase border border-blue-100">
                Executive Control Center
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <SparklesIcon className="w-3.5 h-3.5 text-amber-500" />
                Cập nhật tự động theo thời gian thực (Live Analytics)
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 mt-1 tracking-tight">
              Báo Cáo & Điều Hành Tuyển Dụng Toàn Công Ty
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Tổng quan hiệu suất tuyển dụng, phân tích chuyển đổi phễu ứng viên, đo lường nguồn thu hút và phát hiện điểm nghẽn SLA.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            {/* Bộ lọc khoảng thời gian */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTimeRange("30d")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  timeRange === "30d"
                    ? "bg-white text-blue-600 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                30 Ngày qua
              </button>
              <button
                type="button"
                onClick={() => setTimeRange("quarter")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  timeRange === "quarter"
                    ? "bg-white text-blue-600 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Quý 3/2026
              </button>
              <button
                type="button"
                onClick={() => setTimeRange("year")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  timeRange === "year"
                    ? "bg-white text-blue-600 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Năm 2026
              </button>
            </div>

            {/* Nút Làm mới */}
            <button
              type="button"
              onClick={handleRefresh}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
              title="Làm mới dữ liệu"
            >
              <RefreshCwIcon
                className={`w-4 h-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`}
              />
            </button>

            {/* Nút Xuất Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <FileSpreadsheetIcon className="w-4 h-4" />
              <span>Xuất Báo Cáo Excel</span>
            </button>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* YÊU CẦU 1: OVERVIEW DASHBOARD (2 PHÚT MỖI SÁNG - 4 THẺ KPI NỔI BẬT)     */}
        {/* ===================================================================== */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
              Khởi đầu ngày mới (2 phút nắm bắt toàn cục)
            </span>
            <span className="text-[11px] text-slate-400">
              Kỳ so sánh: Tháng trước
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Tổng YC đang mở */}
            <div className="bg-gradient-to-br from-white to-blue-50/40 p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Tổng YC Đang Mở</span>
                <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BriefcaseIcon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  14 <span className="text-sm font-bold text-slate-400">vị trí</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-emerald-600">
                  <ArrowUpRightIcon className="w-3.5 h-3.5" />
                  <span>+2 vị trí mới trong tháng</span>
                </div>
              </div>
            </div>

            {/* KPI 2: Tổng ứng viên mới */}
            <div className="bg-gradient-to-br from-white to-indigo-50/40 p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Tổng Ứng Viên Mới</span>
                <div className="w-10 h-10 rounded-xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UsersIcon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  1,250 <span className="text-sm font-bold text-slate-400">hồ sơ</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-emerald-600">
                  <ArrowUpRightIcon className="w-3.5 h-3.5" />
                  <span>+18.4% so với tháng trước</span>
                </div>
              </div>
            </div>

            {/* KPI 3: Thời gian tuyển trung bình (Time-to-hire) */}
            <div className="bg-gradient-to-br from-white to-purple-50/40 p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Thời Gian Tuyển TB (Time-to-Hire)</span>
                <div className="w-10 h-10 rounded-xl bg-purple-100/80 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ClockIcon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl md:text-3xl font-black text-purple-700 tracking-tight">
                  22.4 <span className="text-sm font-bold text-slate-400">ngày</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-emerald-600">
                  <ArrowDownRightIcon className="w-3.5 h-3.5" />
                  <span>Rút ngắn 3.2 ngày (SLA cam kết: 25 ngày)</span>
                </div>
              </div>
            </div>

            {/* KPI 4: Chi phí trên mỗi lượt tuyển (Cost-per-hire) */}
            <div className="bg-gradient-to-br from-white to-emerald-50/40 p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Chi Phí / Tuyển Dụng (Cost-per-Hire)</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <DollarSignIcon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl md:text-3xl font-black text-emerald-700 tracking-tight">
                  6.85 <span className="text-sm font-bold text-slate-400">triệu VNĐ</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-emerald-600">
                  <ArrowDownRightIcon className="w-3.5 h-3.5" />
                  <span>Tiết kiệm 12% so với định mức ngân sách</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* YÊU CẦU 2 & 3: PHỄU TUYỂN DỤNG & HIỆU QUẢ NGUỒN ỨNG VIÊN                 */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI (6/12): BÁO CÁO PHỄU TUYỂN DỤNG (RECRUITMENT FUNNEL) */}
          <div className="lg:col-span-6 bg-slate-50/70 border border-slate-200 rounded-2xl p-5 md:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  Conversion Analytics
                </span>
                <h2 className="text-sm md:text-base font-black text-slate-900 mt-1">
                  Báo Cáo Phễu Tuyển Dụng (Recruitment Funnel)
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tỷ lệ rơi rụng (Drop-off) & tỷ lệ chuyển đổi giữa 5 giai đoạn chính
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block">Tỷ lệ trúng tuyển toàn phễu</span>
                <span className="text-base font-black text-emerald-600">2.88%</span>
              </div>
            </div>

            {/* Horizontal Bar Visual Funnel */}
            <div className="space-y-3.5">
              {FUNNEL_DATA.map((step, idx) => {
                const widthPercent = (step.count / FUNNEL_DATA[0].count) * 100;

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-black">
                          {idx + 1}
                        </span>
                        <span>{step.stage}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 font-extrabold">{step.count.toLocaleString()}</span>
                        {idx > 0 && (
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-mono font-bold">
                            {step.conversionFromPrev}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Funnel Progress Bar with Dropoff Indicator */}
                    <div className="w-full bg-slate-200/80 rounded-full h-3 overflow-hidden p-0.5 flex">
                      <div
                        className="h-full rounded-full transition-all duration-500 shadow-xs"
                        style={{
                          width: `${widthPercent}%`,
                          backgroundColor: step.color,
                        }}
                      />
                    </div>

                    {idx > 0 && (
                      <div className="text-[10px] text-slate-400 text-right pr-1">
                        Rơi rụng so với bước trước: <strong className="text-slate-600">{step.dropOff}%</strong>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Funnel Metrics Summary Box */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-600">
              <div className="flex items-center justify-between font-bold">
                <span>Điểm thắt cổ chai lớn nhất:</span>
                <span className="text-purple-700">Vòng Phỏng vấn chuyên môn (Chỉ 22.9% được Offer)</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Đề xuất: Tối ưu lại bộ lọc bài test đầu vào để giảm thời gian phỏng vấn không phù hợp cho Trưởng bộ phận.
              </p>
            </div>
          </div>

          {/* CỘT PHẢI (6/12): BÁO CÁO HIỆU QUẢ NGUỒN (SOURCE OF HIRE) */}
          <div className="lg:col-span-6 bg-slate-50/70 border border-slate-200 rounded-2xl p-5 md:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  Channel Attribution
                </span>
                <h2 className="text-sm md:text-base font-black text-slate-900 mt-1">
                  Báo Cáo Hiệu Quả Nguồn Ứng Viên (Source of Hire)
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tỷ trọng ứng viên theo kênh tiếp cận & hiệu quả chuyển đổi thành nhân sự nhận việc
                </p>
              </div>
            </div>

            {/* Donut Pie Chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              {!mounted ? (
                <div className="h-56 flex items-center justify-center text-xs text-slate-400">
                  Đang tải biểu đồ nguồn tuyển dụng...
                </div>
              ) : (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={SOURCE_PIE_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {SOURCE_PIE_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any, name: any, item: any) => [
                          `${val} CV (${item.payload.percentage}%)`,
                          name,
                        ]}
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(val: string) => (
                          <span className="text-[11px] font-bold text-slate-700 mr-2">
                            {val}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Bảng nhỏ phân tích nguồn mang lại ứng viên nhận việc nhiều nhất */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <div className="p-2.5 bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-700">
                Bảng phân tích chi phí & tỷ lệ tuyển thành công theo kênh:
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase">
                      <th className="py-2.5 px-3">Kênh tuyển dụng</th>
                      <th className="py-2.5 px-2 text-center">CV</th>
                      <th className="py-2.5 px-2 text-center">Đã tuyển</th>
                      <th className="py-2.5 px-2 text-right">Chi phí / Hire</th>
                      <th className="py-2.5 px-3 text-right">Đánh giá ROI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {SOURCE_EFFICIENCY_TABLE.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2 px-3 font-bold text-slate-800">
                          {row.source}
                        </td>
                        <td className="py-2 px-2 text-center text-slate-600 font-mono">
                          {row.applied}
                        </td>
                        <td className="py-2 px-2 text-center font-extrabold text-emerald-600 font-mono">
                          {row.hired}
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                          {row.costPerHire}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${row.badgeColor}`}>
                            {row.roi}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* YÊU CẦU 4: BÁO CÁO CHI PHÍ & THỜI GIAN TUYỂN DỤNG (LINE / AREA CHART)    */}
        {/* ===================================================================== */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 md:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                Time-to-Hire & Cost Trends
              </span>
              <h2 className="text-sm md:text-base font-black text-slate-900 mt-1">
                Báo Cáo Xu Hướng Thời Gian Tuyển & Chi Phí (T1 - T10/2026)
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Theo dõi biến động số ngày lấp đầy vị trí và chi phí trung bình để phát hiện các tháng có điểm nghẽn quy trình
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-blue-700">
                <span className="w-3 h-3 rounded-full bg-blue-600" />
                <span>Thời gian tuyển (ngày)</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span>Chi phí / Hire (Triệu ₫)</span>
              </div>
            </div>
          </div>

          {/* Line Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            {!mounted ? (
              <div className="h-72 flex items-center justify-center text-xs text-slate-400">
                Đang tải biểu đồ xu hướng...
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={MONTHLY_TREND_DATA}
                    margin={{ top: 20, right: 30, left: -10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "#64748b", fontSize: 11, fontWeight: "bold" }}
                      axisLine={{ stroke: "#e2e8f0" }}
                      tickLine={false}
                    />
                    {/* Trục trái: Thời gian tuyển (ngày) */}
                    <YAxis
                      yAxisId="left"
                      tick={{ fill: "#3b82f6", fontSize: 11, fontWeight: "bold" }}
                      domain={[15, 35]}
                      unit=" ngày"
                      axisLine={false}
                      tickLine={false}
                    />
                    {/* Trục phải: Chi phí (Triệu VNĐ) */}
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fill: "#10b981", fontSize: 11, fontWeight: "bold" }}
                      domain={[4, 12]}
                      unit=" tr"
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                      }}
                      formatter={(val: any, name: any) => {
                        if (name === "timeToHire") return [`${val} ngày`, "Thời gian tuyển TB"];
                        if (name === "costPerHire") return [`${val} triệu VNĐ`, "Chi phí / Hire"];
                        return [val, name];
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      wrapperStyle={{ paddingBottom: 10 }}
                      formatter={(val: string) => {
                        if (val === "timeToHire") return "Thời gian tuyển (Trục trái)";
                        if (val === "costPerHire") return "Chi phí / Hire (Trục phải)";
                        return val;
                      }}
                    />

                    {/* Đường Thời gian tuyển */}
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="timeToHire"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#ffffff", stroke: "#3b82f6", strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: "#3b82f6", stroke: "#ffffff", strokeWidth: 2 }}
                    />

                    {/* Đường Chi phí tuyển */}
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="costPerHire"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#ffffff", stroke: "#10b981", strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: "#10b981", stroke: "#ffffff", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Phân tích điểm nghẽn SLA từ AI / Giám sát hệ thống */}
          <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs space-y-1.5 text-amber-950">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertTriangleIcon className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Phân tích điểm nghẽn tự động:</span>
            </div>
            <p className="leading-relaxed">
              Tháng 7 ghi nhận mức thời gian tuyển tăng vọt lên <strong className="text-amber-900">29.4 ngày</strong> (vượt trần cam kết SLA 25 ngày) do khối Công nghệ dồn lịch phỏng vấn và vòng duyệt lương BOD bị trễ. Từ Tháng 8, sau khi áp dụng <em>Luồng duyệt động 3 cấp</em> và <em>Khung năng lực số hóa</em>, thời gian đã giảm đều đặn xuống <strong className="text-emerald-700 font-bold">22.4 ngày</strong> trong Tháng 10.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
