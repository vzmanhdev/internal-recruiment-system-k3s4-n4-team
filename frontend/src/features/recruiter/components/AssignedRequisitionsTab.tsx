"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  FileEdit,
  Filter,
  Lock,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";
import type { JobRequisition } from "../types/recruiter.types";
import { Spinner } from "@/components/ui/Spinner";

interface AssignedRequisitionsTabProps {
  requisitions: JobRequisition[];
  loading: boolean;
  onSelectForDraft: (req: JobRequisition) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  departmentFilter: string;
  onDepartmentFilterChange: (dept: string) => void;
  departments: string[];
}

export function AssignedRequisitionsTab({
  requisitions,
  loading,
  onSelectForDraft,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchQueryChange,
  departmentFilter,
  onDepartmentFilterChange,
  departments,
}: AssignedRequisitionsTabProps) {
  const [expandedChainId, setExpandedChainId] = useState<number | null>(null);

  const toggleApprovalChain = (id: number) => {
    setExpandedChainId((prev) => (prev === id ? null : id));
  };

  const statusBadges: Record<
    string,
    { label: string; bg: string; text: string; border: string }
  > = {
    approved: {
      label: "Đã duyệt",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
    },
    pending_approval: {
      label: "Chờ phê duyệt",
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
    },
    draft: {
      label: "Bản nháp",
      bg: "bg-slate-100",
      text: "text-slate-600",
      border: "border-slate-200",
    },
    rejected: {
      label: "Từ chối",
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
    },
    closed: {
      label: "Đã đóng",
      bg: "bg-slate-100",
      text: "text-slate-500",
      border: "border-slate-200",
    },
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Tìm theo mã yêu cầu, chức danh hoặc phòng ban..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs font-medium focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 hidden sm:inline">Phòng ban:</span>
            <select
              value={departmentFilter}
              onChange={(e) => onDepartmentFilterChange(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:border-blue-600 focus:outline-none"
            >
              <option value="all">Tất cả phòng ban</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Status Pills */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 text-xs font-bold overflow-x-auto">
            <button
              type="button"
              onClick={() => onStatusFilterChange("all")}
              className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                statusFilter === "all"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange("approved")}
              className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                statusFilter === "approved"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-emerald-700"
              }`}
            >
              Đã duyệt (S3-09)
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange("pending_approval")}
              className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                statusFilter === "pending_approval"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-amber-700"
              }`}
            >
              Chờ duyệt
            </button>
            <button
              type="button"
              onClick={() => onStatusFilterChange("draft")}
              className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                statusFilter === "draft"
                  ? "bg-slate-700 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Bản nháp
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex h-72 flex-col items-center justify-center gap-3">
            <Spinner size="lg" />
            <p className="text-xs font-medium text-slate-500">Đang tải danh sách yêu cầu được giao...</p>
          </div>
        ) : requisitions.length === 0 ? (
          <div className="flex h-72 flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="h-14 w-14 rounded-3xl bg-slate-100 grid place-items-center text-slate-400">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">Không tìm thấy yêu cầu tuyển dụng nào</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                Hiện không có tờ trình nào khớp với bộ lọc. Khi Trưởng phòng Nhân sự phân công recruiter phụ trách (S3-06), yêu cầu sẽ xuất hiện tại đây.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Yêu cầu & Vị trí</th>
                  <th className="px-4 py-3.5">Phòng ban</th>
                  <th className="px-3 py-3.5 text-center">Chỉ tiêu</th>
                  <th className="px-4 py-3.5">Dải lương đề xuất</th>
                  <th className="px-4 py-3.5">Cảnh báo SLA (S3-08)</th>
                  <th className="px-4 py-3.5 text-center">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Thao tác (S3-09)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requisitions.map((req) => {
                  const badge = statusBadges[req.status] || {
                    label: req.status,
                    bg: "bg-slate-100",
                    text: "text-slate-600",
                    border: "border-slate-200",
                  };
                  const isApproved = req.status === "approved";
                  const isExpanded = expandedChainId === req.id;

                  // SLA Calculations (Story S3-08)
                  const daysOpen = req.days_open ?? 0;
                  const daysRemaining = req.days_remaining;
                  const isOverdue = Boolean(req.is_overdue || (daysRemaining !== null && daysRemaining !== undefined && daysRemaining < 0 && req.status !== "closed"));

                  return (
                    <React.Fragment key={req.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        {/* Title & Code */}
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-2.5">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-slate-900 text-sm hover:text-blue-600 transition-colors">
                                  {req.title}
                                </span>
                                {req.is_converted && (
                                  <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-bold">
                                    Đã tạo tin
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                                <span className="font-mono font-semibold text-slate-500">
                                  #{req.code || req.id}
                                </span>
                                <span>·</span>
                                <span>Tạo: {req.created_at ? new Date(req.created_at).toLocaleDateString("vi-VN") : "N/A"}</span>
                                {req.creator_name && (
                                  <>
                                    <span>·</span>
                                    <span>Bởi: {req.creator_name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 font-medium text-slate-700">
                            <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{req.department}</span>
                          </div>
                        </td>

                        {/* Openings */}
                        <td className="px-3 py-4 text-center">
                          <span className="inline-block rounded-xl bg-slate-100 px-2.5 py-1 font-bold text-slate-700">
                            {req.openings || req.quantity || 1}
                          </span>
                        </td>

                        {/* Salary range */}
                        <td className="px-4 py-4">
                          <span className="font-semibold text-slate-800">
                            {req.salary_range}
                          </span>
                        </td>

                        {/* SLA Progress & Overdue Warning (Story S3-08) */}
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="text-slate-500">
                                Đã mở: <strong>{daysOpen} ngày</strong>
                              </span>
                              <span>·</span>
                              {daysRemaining !== null && daysRemaining !== undefined ? (
                                <span
                                  className={
                                    isOverdue
                                      ? "font-extrabold text-rose-600"
                                      : "font-semibold text-slate-700"
                                  }
                                >
                                  {isOverdue
                                    ? `Quá hạn ${Math.abs(daysRemaining)} ngày`
                                    : `Còn ${daysRemaining} ngày`}
                                </span>
                              ) : (
                                <span className="text-slate-400">Không có hạn</span>
                              )}
                            </div>

                            {/* Overdue Alert Badge */}
                            {isOverdue && (
                              <div className="inline-flex items-center gap-1 rounded-md bg-rose-100 border border-rose-200 px-2 py-0.5 text-[10px] font-extrabold text-rose-700 animate-pulse">
                                <AlertTriangle className="h-3 w-3 text-rose-600" />
                                <span>TRỄ HẠN CẦN NGƯỜI (S3-08)</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4 text-center">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {badge.label}
                          </span>
                        </td>

                        {/* Actions (Story S3-09 Trigger & Timeline) */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Toggle Approval Timeline */}
                            <button
                              type="button"
                              onClick={() => toggleApprovalChain(req.id)}
                              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                              title="Xem tiến độ chuỗi duyệt (S3-03)"
                            >
                              <span>Duyệt</span>
                              {isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                              )}
                            </button>

                            {/* S3-09 Primary CTA: Soạn tin tuyển dụng */}
                            {isApproved ? (
                              <button
                                type="button"
                                onClick={() => onSelectForDraft(req)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-blue-200 hover:bg-blue-700 transition-all cursor-pointer"
                              >
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>Soạn tin tuyển dụng</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled
                                title="Theo Story S3-09 AC3: Chỉ yêu cầu ở trạng thái 'Đã duyệt' mới được phép tạo tin tuyển dụng."
                                className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-[11px] font-medium text-slate-400 cursor-not-allowed"
                              >
                                <Lock className="h-3 w-3 text-slate-400" />
                                <span>Chờ phê duyệt</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Approval Chain Timeline (S3-03) */}
                      {isExpanded && (
                        <tr className="bg-slate-50/60 border-y border-slate-100">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                                  <UserCheck className="h-4 w-4 text-blue-600" />
                                  <span>Chuỗi cấp duyệt headcount (Story S3-03 & S3-06)</span>
                                </h4>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  Recruiter phụ trách: {req.recruiter_name || "Chưa gán"}
                                  {req.support_recruiter_name ? ` · Hỗ trợ: ${req.support_recruiter_name}` : ""}
                                </span>
                              </div>

                              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                                {req.approval_chain && req.approval_chain.length > 0 ? (
                                  req.approval_chain.map((step, idx) => (
                                    <div
                                      key={idx}
                                      className={`rounded-xl border p-3 text-xs ${
                                        step.status === "approved"
                                          ? "border-emerald-200 bg-emerald-50/50"
                                          : step.status === "pending"
                                          ? "border-amber-200 bg-amber-50/50"
                                          : "border-slate-200 bg-slate-50"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-slate-900">
                                          Cấp {step.step}: {step.role}
                                        </span>
                                        <span
                                          className={`text-[10px] font-bold uppercase ${
                                            step.status === "approved"
                                              ? "text-emerald-700"
                                              : step.status === "pending"
                                              ? "text-amber-700"
                                              : "text-slate-500"
                                          }`}
                                        >
                                          {step.status === "approved"
                                            ? "Đã duyệt"
                                            : step.status === "pending"
                                            ? "Đang chờ"
                                            : "Chưa duyệt"}
                                        </span>
                                      </div>
                                      <p className="text-slate-600 text-[11px]">
                                        Người duyệt: <strong>{step.approver}</strong>
                                      </p>
                                      {step.comment && (
                                        <p className="mt-1 text-slate-500 text-[11px] italic bg-white/70 p-1 rounded">
                                          "{step.comment}"
                                        </p>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <div className="col-span-full text-slate-400 text-xs italic">
                                    Chưa có nhật ký chuỗi duyệt chi tiết cho tờ trình này.
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
