"use client";

import React, { useState, useEffect } from "react";
import { AdminAppShell } from "@/components/layout/AdminAppShell";
import {
  Users,
  ShieldCheck,
  Lock,
  UserPlus,
  FileSpreadsheet,
  ScrollText,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Activity,
  KeyRound,
  ShieldAlert,
  Sliders,
  Shield
} from "lucide-react";
import Link from "next/link";
import { authService } from "@/features/auth/services/auth.service";

export default function AdminDashboardControlCenter() {
  const [stats, setStats] = useState<any>({
    total_users: 0,
    active_users: 0,
    locked_users: 0,
    pending_users: 0,
    role_distribution: {
      admin: 0,
      hr_manager: 0,
      recruiter: 0,
      hiring_manager: 0,
      interviewer: 0,
      approver: 0,
      candidate: 0,
    },
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const token = authService.getToken();
      const res = await fetch("http://localhost:8000/api/v1/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const rolesDisplay = [
    { code: "admin", label: "Quản trị viên (Admin)", count: stats.role_distribution?.admin || 0, color: "bg-purple-500" },
    { code: "hr_manager", label: "Trưởng phòng HR", count: stats.role_distribution?.hr_manager || 0, color: "bg-blue-500" },
    { code: "recruiter", label: "Chuyên viên tuyển dụng", count: stats.role_distribution?.recruiter || 0, color: "bg-emerald-500" },
    { code: "hiring_manager", label: "Trưởng bộ phận", count: stats.role_distribution?.hiring_manager || 0, color: "bg-amber-500" },
    { code: "interviewer", label: "Người phỏng vấn", count: stats.role_distribution?.interviewer || 0, color: "bg-cyan-500" },
    { code: "approver", label: "Người duyệt (Approver)", count: stats.role_distribution?.approver || 0, color: "bg-indigo-500" },
    { code: "candidate", label: "Ứng viên (Candidate)", count: stats.role_distribution?.candidate || 0, color: "bg-slate-400" },
  ];

  return (
    <AdminAppShell activeTab="dashboard">
      <div className="space-y-6">
        {/* Banner Header - Redesigned Light Theme matching Reference Screenshot */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Left info block */}
          <div className="space-y-2 max-w-xl">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
              System Control Center
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Tổng quan quản trị hệ thống
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              Giám sát toàn bộ tài khoản nhân sự, phân quyền vai trò (RBAC 7 Roles), khóa an toàn tài khoản và nhật ký bảo mật hệ thống.
            </p>
          </div>

          {/* Right 2x2 Quick Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full lg:w-auto shrink-0">
            <Link
              href="/admin/users"
              className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-blue-50/60 border border-gray-100 hover:border-blue-200 transition-all flex items-center gap-3 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-[#4285F4] flex items-center justify-center font-bold shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-[#4285F4] transition-colors">
                  Quản lý người dùng
                </h4>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Tạo, chỉnh sửa, phân quyền</p>
              </div>
            </Link>

            <Link
              href="/admin/permissions"
              className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-emerald-50/60 border border-gray-100 hover:border-emerald-200 transition-all flex items-center gap-3 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Phân quyền RBAC
                </h4>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Quản lý 7 vai trò</p>
              </div>
            </Link>

            <Link
              href="/admin/users?status=locked"
              className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-cyan-50/60 border border-gray-100 hover:border-cyan-200 transition-all flex items-center gap-3 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-100/80 text-cyan-600 flex items-center justify-center font-bold shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-cyan-600 transition-colors">
                  Bảo mật hệ thống
                </h4>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Khóa/Mở khóa tài khoản</p>
              </div>
            </Link>

            <Link
              href="/admin/audit-logs"
              className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-amber-50/60 border border-gray-100 hover:border-amber-200 transition-all flex items-center gap-3 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-600 flex items-center justify-center font-bold shrink-0">
                <ScrollText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-amber-600 transition-colors">
                  Nhật ký hệ thống
                </h4>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Giám sát hoạt động</p>
              </div>
            </Link>
          </div>
        </div>

        {/* 1. KPI STAT CARDS (4 Columns) - Real DB Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Users */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng tài khoản</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {isLoading ? <RefreshCw className="w-5 h-5 animate-spin text-[#4285F4]" /> : stats.total_users}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-medium">Nhân sự nội bộ trong hệ thống</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#4285F4] flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Active Users */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đang hoạt động</div>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                {isLoading ? <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" /> : stats.active_users}
              </div>
              <div className="text-[11px] text-emerald-600 font-bold mt-1">Sẵn sàng đăng nhập & thao tác</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Locked Users */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tài khoản bị khóa</div>
              <div className="text-2xl font-extrabold text-rose-600 mt-1">
                {isLoading ? <RefreshCw className="w-5 h-5 animate-spin text-rose-500" /> : stats.locked_users}
              </div>
              <div className="text-[11px] text-rose-600 font-bold mt-1">Revoked session & Access lock</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Lock className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Pending Activation */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chờ kích hoạt</div>
              <div className="text-2xl font-extrabold text-amber-600 mt-1">
                {isLoading ? <RefreshCw className="w-5 h-5 animate-spin text-amber-500" /> : stats.pending_users}
              </div>
              <div className="text-[11px] text-amber-600 font-bold mt-1">Cần xác nhận link kích hoạt</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Activity className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 2. ROLE DISTRIBUTION & ACTION CENTER */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Role Distribution Chart / Progress (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#4285F4]" />
                  Phân Bổ Người Dùng Theo 7 Vai Trò (Role Distribution)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Lưu ý: Một tài khoản có thể sở hữu nhiều vai trò (Multi-Role), do đó tổng thành viên có thể lớn hơn số tài khoản.
                </p>
              </div>

              <Link
                href="/admin/permissions"
                className="text-xs font-bold text-[#4285F4] hover:underline flex items-center gap-1"
              >
                <span>Chi tiết RBAC Matrix</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3.5">
              {rolesDisplay.map((r) => {
                const maxVal = Math.max(...rolesDisplay.map((item) => item.count), 1);
                const percent = Math.round((r.count / maxVal) * 100);
                return (
                  <div key={r.code} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800">{r.label}</span>
                      <span className="font-extrabold text-slate-900">{r.count} người dùng</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${r.color} transition-all duration-500 rounded-full`}
                        style={{ width: `${Math.max(percent, 8)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Center Block (1 Col) */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-5">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                Cảnh Báo & Cần Xử Lý
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Sự kiện an ninh và quản trị cần Admin rà soát</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 space-y-1">
                <div className="font-bold text-rose-800 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-rose-600" />
                  <span>{stats.locked_users} tài khoản đang bị khóa</span>
                </div>
                <p className="text-[11px] text-rose-700">Tài khoản bị vô hiệu hóa quyền truy cập hệ thống.</p>
                <Link href="/admin/users?status=locked" className="text-[11px] font-bold text-rose-800 underline block pt-1">
                  Xem danh sách bị khóa &rarr;
                </Link>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100 space-y-1">
                <div className="font-bold text-amber-800 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-amber-600" />
                  <span>{stats.pending_users} tài khoản chờ kích hoạt</span>
                </div>
                <p className="text-[11px] text-amber-700">Cần xác minh liên kết email kích hoạt ban đầu.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100 space-y-1">
                <div className="font-bold text-blue-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>Chính sách Default DENY Active</span>
                </div>
                <p className="text-[11px] text-blue-700">Mọi API backend đều kiểm tra quyền hạn thực tế từ Database.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. QUICK NAVIGATION MODULE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/users"
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#4285F4] flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="font-extrabold text-sm text-slate-900">Quản Lý Người Dùng</h4>
            <p className="text-xs text-slate-400 mt-1 font-medium">Tạo tài khoản, gán multi-role và khóa/mở khóa tài khoản.</p>
          </Link>

          <Link
            href="/admin/permissions"
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="font-extrabold text-sm text-slate-900">Ma Trận Phân Quyền RBAC</h4>
            <p className="text-xs text-slate-400 mt-1 font-medium">Kiểm soát chi tiết quyền Read/Create/Edit/Approve trên 7 vai trò.</p>
          </Link>

          <Link
            href="/admin/audit-logs"
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ScrollText className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="font-extrabold text-sm text-slate-900">Nhật Ký Bảo Mật Audit Logs</h4>
            <p className="text-xs text-slate-400 mt-1 font-medium">Truy xuất lịch sử thao tác bất biến của toàn bộ hệ thống.</p>
          </Link>
        </div>
      </div>
    </AdminAppShell>
  );
}
