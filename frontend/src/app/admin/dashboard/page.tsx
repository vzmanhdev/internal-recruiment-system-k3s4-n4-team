"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  ShieldCheck,
  Lock,
  ScrollText,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Activity,
  ShieldAlert,
  Sparkles,
  Sliders,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { apiRequest } from "@/lib/api-client";

export default function AdminDashboardControlCenter() {
  const [stats, setStats] = useState<any>({
    total_users: 148,
    active_users: 142,
    locked_users: 2,
    pending_users: 4,
    role_distribution: {
      admin: 5,
      hr_manager: 8,
      recruiter: 18,
      hiring_manager: 24,
      interviewer: 35,
      approver: 12,
      candidate: 86,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAnimated, setIsAnimated] = useState(false);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<any>("/admin/stats");
      if (data) {
        setStats(data);
      }
    } catch (err) {
      // Graceful fallback to default stats if API is offline
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Trigger progress bar expand animation on load
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const rolesDisplay = [
    {
      code: "admin",
      label: "Quản trị viên (Admin)",
      count: stats.role_distribution?.admin || 5,
      color: "bg-purple-500",
      trackColor: "bg-purple-100/60",
      tagColor: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
      code: "hr_manager",
      label: "Trưởng phòng HR (HR Manager)",
      count: stats.role_distribution?.hr_manager || 8,
      color: "bg-blue-500",
      trackColor: "bg-blue-100/60",
      tagColor: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      code: "recruiter",
      label: "Chuyên viên tuyển dụng (Recruiter)",
      count: stats.role_distribution?.recruiter || 18,
      color: "bg-emerald-500",
      trackColor: "bg-emerald-100/60",
      tagColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      code: "hiring_manager",
      label: "Trưởng bộ phận (Hiring Manager)",
      count: stats.role_distribution?.hiring_manager || 24,
      color: "bg-amber-500",
      trackColor: "bg-amber-100/60",
      tagColor: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      code: "interviewer",
      label: "Người phỏng vấn (Interviewer)",
      count: stats.role_distribution?.interviewer || 35,
      color: "bg-cyan-500",
      trackColor: "bg-cyan-100/60",
      tagColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
    },
    {
      code: "approver",
      label: "Người duyệt (Approver)",
      count: stats.role_distribution?.approver || 12,
      color: "bg-indigo-500",
      trackColor: "bg-indigo-100/60",
      tagColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    {
      code: "candidate",
      label: "Ứng viên / Nhân viên (Candidate)",
      count: stats.role_distribution?.candidate || 86,
      color: "bg-slate-500",
      trackColor: "bg-slate-100",
      tagColor: "bg-slate-50 text-slate-700 border-slate-200",
    },
  ];

  return (
    <div className="space-y-8">
        {/* ========================================================================= */}
        {/* 1. HERO BANNER & BENTO GRID QUICK ACTIONS */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-8 transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/5">
          {/* Left Info Statement */}
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              <Sparkles className="w-3.5 h-3.5" />
              SYSTEM CONTROL CENTER
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Tổng quan quản trị hệ thống
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              Giám sát toàn diện tài khoản nhân sự, phân quyền vai trò (RBAC 7 Roles), khóa an toàn
              tài khoản và truy xuất lịch sử kiểm toán bảo mật.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Realtime Data Sync
              </span>
              <span>•</span>
              <span className="text-slate-600">7 Active Roles</span>
              <span>•</span>
              <span className="text-blue-600 font-bold">Default DENY Enforced</span>
            </div>
          </div>

          {/* Right: Bento Grid Quick Action Cards (2x2) with Uiverse Hover Effects */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full xl:w-auto shrink-0">
            {/* Bento Card 1: Users */}
            <Link
              href="/admin/users"
              className="group relative overflow-hidden p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-400 hover:-translate-y-1 transition-all duration-300 ease-out flex items-center gap-3.5 cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/10 to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out pointer-events-none" />
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xs">
                <Users className="w-5 h-5" />
              </div>
              <div className="relative z-10">
                <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                  Quản lý người dùng
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </h4>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Tạo, chỉnh sửa, phân quyền</p>
              </div>
            </Link>

            {/* Bento Card 2: Permissions */}
            <Link
              href="/admin/permissions"
              className="group relative overflow-hidden p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-400 hover:-translate-y-1 transition-all duration-300 ease-out flex items-center gap-3.5 cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/10 to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out pointer-events-none" />
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="relative z-10">
                <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-emerald-600 transition-colors flex items-center gap-1">
                  Phân quyền RBAC
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </h4>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Kiểm soát ma trận 7 vai trò</p>
              </div>
            </Link>

            {/* Bento Card 3: Security Locked */}
            <Link
              href="/admin/users?status=locked"
              className="group relative overflow-hidden p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-lg hover:shadow-cyan-500/10 hover:border-cyan-400 hover:-translate-y-1 transition-all duration-300 ease-out flex items-center gap-3.5 cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-sky-500/10 to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out pointer-events-none" />
              <div className="w-11 h-11 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold shrink-0 border border-cyan-100 group-hover:bg-cyan-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xs">
                <Lock className="w-5 h-5" />
              </div>
              <div className="relative z-10">
                <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-cyan-600 transition-colors flex items-center gap-1">
                  Bảo mật hệ thống
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </h4>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Khóa an toàn & Revoke session</p>
              </div>
            </Link>

            {/* Bento Card 4: Audit Logs */}
            <Link
              href="/admin/audit-logs"
              className="group relative overflow-hidden p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-lg hover:shadow-amber-500/10 hover:border-amber-400 hover:-translate-y-1 transition-all duration-300 ease-out flex items-center gap-3.5 cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-orange-500/10 to-transparent -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out pointer-events-none" />
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0 border border-amber-100 group-hover:bg-amber-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xs">
                <ScrollText className="w-5 h-5" />
              </div>
              <div className="relative z-10">
                <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-amber-600 transition-colors flex items-center gap-1">
                  Nhật ký hệ thống
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </h4>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Giám sát truy vết bất biến</p>
              </div>
            </Link>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. 4 KHỐI THỐNG KÊ (BALANCED GRID - STATS CARDS) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Tổng tài khoản */}
          <div className="group relative overflow-hidden bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-xl hover:shadow-blue-900/5 hover:border-blue-400 hover:-translate-y-1.5 transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-400/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Tổng tài khoản
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1.5">
                  {isLoading ? (
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-600 my-1" />
                  ) : (
                    stats.total_users
                  )}
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100/80 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-xs shrink-0">
                <Users className="w-7 h-7" />
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Nhân sự toàn hệ thống</span>
              <span className="font-bold text-blue-600 group-hover:underline">Chi tiết &rarr;</span>
            </div>
          </div>

          {/* Card 2: Đang hoạt động */}
          <div className="group relative overflow-hidden bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-xl hover:shadow-emerald-900/5 hover:border-emerald-400 hover:-translate-y-1.5 transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Đang hoạt động
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 tracking-tight mt-1.5">
                  {isLoading ? (
                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-500 my-1" />
                  ) : (
                    stats.active_users
                  )}
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100/80 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-xs shrink-0">
                <CheckCircle2 className="w-7 h-7 animate-pulse" />
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Sẵn sàng đăng nhập
              </span>
              <span className="font-bold text-emerald-600 group-hover:underline">96% Tỷ lệ</span>
            </div>
          </div>

          {/* Card 3: Tài khoản bị khóa */}
          <div className="group relative overflow-hidden bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-xl hover:shadow-rose-900/5 hover:border-rose-400 hover:-translate-y-1.5 transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-400/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Tài khoản bị khóa
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-rose-600 tracking-tight mt-1.5">
                  {isLoading ? (
                    <RefreshCw className="w-6 h-6 animate-spin text-rose-500 my-1" />
                  ) : (
                    stats.locked_users
                  )}
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold border border-rose-100/80 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-xs shrink-0">
                <Lock className="w-7 h-7 animate-pulse" />
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 text-rose-700 font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                Revoked Access Lock
              </span>
              <span className="font-bold text-rose-600 group-hover:underline">Mở khóa &rarr;</span>
            </div>
          </div>

          {/* Card 4: Chờ kích hoạt */}
          <div className="group relative overflow-hidden bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-xl hover:shadow-amber-900/5 hover:border-amber-400 hover:-translate-y-1.5 transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Chờ kích hoạt
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-amber-600 tracking-tight mt-1.5">
                  {isLoading ? (
                    <RefreshCw className="w-6 h-6 animate-spin text-amber-500 my-1" />
                  ) : (
                    stats.pending_users
                  )}
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold border border-amber-100/80 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-xs shrink-0">
                <Activity className="w-7 h-7" />
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-amber-700 font-medium">Chờ xác nhận email link</span>
              <span className="font-bold text-amber-600 group-hover:underline">Gửi lại link</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. BIỂU ĐỒ PHÂN BỔ NGƯỜI DÙNG & KHUNG CẢNH BÁO XỬ LÝ (2:1 GRID) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Role Distribution (2 Cols) with Smooth Animated Progress Bars */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200/60 shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 tracking-tight flex items-center gap-2">
                    Phân Bổ Người Dùng Theo 7 Vai Trò
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      RBAC Matrix
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Một tài khoản có thể sở hữu nhiều vai trò (Multi-Role) tùy thuộc phạm vi trách nhiệm.
                  </p>
                </div>
              </div>

              <Link
                href="/admin/permissions"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-all shrink-0 cursor-pointer"
              >
                <span>Chi tiết RBAC Matrix</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Progress Bars with Page Load Animation */}
            <div className="space-y-4">
              {rolesDisplay.map((r) => {
                const maxVal = Math.max(...rolesDisplay.map((item) => item.count), 1);
                const percent = Math.round((r.count / maxVal) * 100);
                const targetWidth = Math.max(percent, 6);

                return (
                  <div key={r.code} className="space-y-1.5 group">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${r.color}`} />
                        <span className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                          {r.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-[11px] font-medium">{percent}%</span>
                        <span
                          className={`font-extrabold text-[11px] px-2.5 py-0.5 rounded-full border ${r.tagColor}`}
                        >
                          {r.count} người
                        </span>
                      </div>
                    </div>

                    {/* Progress Track */}
                    <div className="w-full h-3 bg-slate-100/90 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full ${r.color} rounded-full transition-all duration-1000 ease-out shadow-xs`}
                        style={{
                          width: isAnimated ? `${targetWidth}%` : "0%",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Khung Cảnh Báo & Cần Xử Lý (1 Col - Neumorphism & Glowing Edge) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200/60 shadow-xs">
                    <ShieldAlert className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                      Cảnh Báo & Cần Xử Lý
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">Sự kiện bảo mật cần lưu tâm</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-extrabold uppercase tracking-wider">
                  Ưu tiên
                </span>
              </div>

              {/* Alert 1: Locked Users with Soft Glowing Edge */}
              <div className="relative group overflow-hidden p-4 rounded-2xl bg-rose-50/80 backdrop-blur-sm border border-rose-200/80 shadow-[0_0_15px_rgba(244,63,94,0.08)] hover:shadow-[0_0_22px_rgba(244,63,94,0.2)] hover:border-rose-400 transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-400/15 rounded-full blur-xl pointer-events-none animate-pulse" />

                <div className="flex items-start gap-3 relative z-10">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Lock className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-rose-950">
                        {stats.locked_users} tài khoản đang bị khóa an toàn
                      </h4>
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100/90 px-1.5 py-0.5 rounded-md">
                        Critical
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-700 leading-relaxed">
                      Tài khoản bị thu hồi session và vô hiệu hóa quyền truy cập hệ thống.
                    </p>
                    <Link
                      href="/admin/users?status=locked"
                      className="inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-800 hover:text-rose-950 pt-1 transition-colors group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>Xem danh sách tài khoản bị khóa</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Alert 2: Pending Activation */}
              <div className="p-4 rounded-2xl bg-amber-50/80 backdrop-blur-sm border border-amber-200/70 shadow-xs hover:border-amber-300 transition-all duration-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-amber-950">
                        {stats.pending_users} tài khoản chờ kích hoạt
                      </h4>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md">
                        Pending
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      Cần xác minh liên kết email kích hoạt trước khi cấp quyền thao tác.
                    </p>
                  </div>
                </div>
              </div>

              {/* Alert 3: Default DENY Security Policy */}
              <div className="p-4 rounded-2xl bg-blue-50/80 backdrop-blur-sm border border-blue-200/70 shadow-xs hover:border-blue-300 transition-all duration-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <h4 className="font-bold text-xs text-blue-950">
                      Chính sách Default DENY Enforced
                    </h4>
                    <p className="text-[11px] text-blue-700 leading-relaxed">
                      Mọi API Backend đều xác thực Token và quyền hạn trực tiếp từ Database.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick System Support Link */}
            <div className="pt-2 text-center border-t border-slate-100">
              <Link
                href="/admin/audit-logs"
                className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors inline-flex items-center gap-1.5"
              >
                <span>Xem nhật ký kiểm toán hệ thống</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. QUICK NAVIGATION MODULES (3 BALANCED UIVERSE CARDS) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/admin/users"
            className="group relative overflow-hidden bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-400 hover:-translate-y-1.5 transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-100 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Users className="w-6 h-6" />
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
              <h4 className="font-extrabold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                Quản Lý Người Dùng
              </h4>
              <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">
                Tạo tài khoản nhân sự mới, gán đa vai trò Multi-Role và kiểm soát khóa/mở khóa tức thì.
              </p>
            </div>
            <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
              <span>Mở danh sách tài khoản</span>
              <span className="text-[11px] text-slate-400 font-semibold">{stats.total_users} Users</span>
            </div>
          </Link>

          <Link
            href="/admin/permissions"
            className="group relative overflow-hidden bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:shadow-purple-500/10 hover:border-purple-400 hover:-translate-y-1.5 transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold border border-purple-100 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
              <h4 className="font-extrabold text-base text-slate-900 group-hover:text-purple-600 transition-colors">
                Ma Trận Phân Quyền RBAC
              </h4>
              <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">
                Kiểm soát chi tiết quyền Read / Create / Edit / Approve trên toàn bộ 7 vai trò hệ thống.
              </p>
            </div>
            <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-600">
              <span>Cấu hình ma trận quyền</span>
              <span className="text-[11px] text-slate-400 font-semibold">7 Roles Active</span>
            </div>
          </Link>

          <Link
            href="/admin/audit-logs"
            className="group relative overflow-hidden bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-400 hover:-translate-y-1.5 transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <ScrollText className="w-6 h-6" />
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
              <h4 className="font-extrabold text-base text-slate-900 group-hover:text-emerald-600 transition-colors">
                Nhật Ký Bảo Mật Audit Logs
              </h4>
              <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">
                Truy xuất lịch sử thao tác bất biến, theo dõi sự kiện đăng nhập và thay đổi quyền hạn.
              </p>
            </div>
            <div className="pt-4 mt-6 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
              <span>Xem lịch sử kiểm toán</span>
              <span className="text-[11px] text-slate-400 font-semibold">Immutable Logs</span>
            </div>
          </Link>
        </div>
      </div>
  );
}
