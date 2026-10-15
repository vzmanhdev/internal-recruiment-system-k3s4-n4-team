"use client";

import React, { useState, useEffect } from "react";
import { AdminAppShell } from "@/components/layout/AdminAppShell";
import { ShieldCheck, Users, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { authService } from "@/features/auth/services/auth.service";
import { API_BASE_URL } from "@/lib/api-client";

interface RoleCard {
  code: string;
  name: string;
  description: string;
  authorityType: "TECHNICAL" | "BUSINESS";
  userCount: number;
  badgeColor: string;
}

export default function RolesOverviewPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = authService.getToken();
        const res = await fetch(`${API_BASE_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data.role_distribution || {});
        }
      } catch (err) {}
    };
    fetchStats();
  }, []);

  const rolesList: RoleCard[] = [
    {
      code: "ADMIN",
      name: "Quản trị hệ thống (System Administrator)",
      description: "Quản trị người dùng, gán vai trò, khóa tài khoản, xem nhật ký bảo mật và cấu hình hệ thống.",
      authorityType: "TECHNICAL",
      userCount: stats?.admin || 1,
      badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
    },
    {
      code: "HR_MANAGER",
      name: "Trưởng phòng Nhân sự (HR Manager)",
      description: "Quản lý chiến lược tuyển dụng, phân công chuyên viên, xem báo cáo tổng thể và phê duyệt offer.",
      authorityType: "BUSINESS",
      userCount: stats?.hr_manager || 1,
      badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
    },
    {
      code: "RECRUITER",
      name: "Chuyên viên Tuyển dụng (Recruiter)",
      description: "Đăng tin tuyển dụng, quản lý nguồn ứng viên, lên lịch phỏng vấn và gửi offer.",
      authorityType: "BUSINESS",
      userCount: stats?.recruiter || 1,
      badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    {
      code: "HIRING_MANAGER",
      name: "Trưởng bộ phận tuyển dụng (Hiring Manager)",
      description: "Tạo yêu cầu tuyển dụng, xem danh sách ứng viên bộ phận, đánh giá phỏng vấn.",
      authorityType: "BUSINESS",
      userCount: stats?.hiring_manager || 1,
      badgeColor: "bg-amber-100 text-amber-700 border-amber-200",
    },
    {
      code: "INTERVIEWER",
      name: "Người phỏng vấn (Interviewer)",
      description: "Xem lịch phỏng vấn được gán, nhập điểm đánh giá phỏng vấn và nhận xét chuyên môn.",
      authorityType: "BUSINESS",
      userCount: stats?.interviewer || 1,
      badgeColor: "bg-cyan-100 text-cyan-700 border-cyan-200",
    },
    {
      code: "APPROVER",
      name: "Người duyệt (Approver / CEO)",
      description: "Xem và phê duyệt các Yêu cầu tuyển dụng (Requisition) và Đề xuất tuyển dụng (Offer).",
      authorityType: "BUSINESS",
      userCount: stats?.approver || 1,
      badgeColor: "bg-indigo-100 text-indigo-700 border-indigo-200",
    },
    {
      code: "CANDIDATE",
      name: "Ứng viên (Candidate)",
      description: "Tìm kiếm công việc công khai, nộp hồ sơ ứng tuyển, theo dõi tiến trình tuyển dụng.",
      authorityType: "BUSINESS",
      userCount: stats?.candidate || 1,
      badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    },
  ];

  return (
    <AdminAppShell activeTab="roles">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="w-7 h-7 text-[#4285F4]" />
              Danh Mục 7 Vai Trò Nghiệp Vụ (Business Roles)
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Phân định quyền hạn Technical Authority & Business Decision Authority theo chuẩn Product Backlog Excel.
            </p>
          </div>

          <Link
            href="/admin/permissions"
            className="px-4 py-2.5 rounded-xl bg-[#4285F4] text-white hover:bg-blue-600 text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Mở Ma Trận RBAC Matrix</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rolesList.map((r) => (
            <div
              key={r.code}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-extrabold uppercase ${r.badgeColor}`}>
                    {r.code}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                    {r.userCount} tài khoản
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 leading-tight">{r.name}</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">{r.description}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-[11px] font-bold text-slate-400">Phạm vi quyền:</span>
                {r.authorityType === "TECHNICAL" ? (
                  <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-extrabold">
                    Technical System Authority
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-extrabold">
                    Business Workflow Authority
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminAppShell>
  );
}
