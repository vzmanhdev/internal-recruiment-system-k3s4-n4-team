"use client";

import React from "react";
import {
  Check,
  Clock,
  Lock,
  ShieldCheck,
  Calendar,
  User as UserIcon,
  Circle,
  X,
  Hash,
} from "lucide-react";

export type ApprovalStepStatus = "APPROVED" | "PENDING" | "NOT_REACHED" | "REJECTED";

export interface ApprovalStep {
  id: string;
  stepNumber: number;
  stepName: string;
  approverName: string;
  approverRole: string;
  department?: string;
  status: ApprovalStepStatus;
  timestamp: string; // VD: "03/10/2026 - 14:30" hoặc "Đang chờ xử lý..."
  comment: string; // Nhận xét của người duyệt
  slaHours?: number;
}

export interface ApprovalWorkflowRecord {
  id?: string;
  itemCode?: string;
  itemType?: "REQUISITION" | "OFFER";
  itemTitle?: string;
  department?: string;
  creator?: string;
  createdAt?: string;
  overallStatus?: "APPROVED" | "IN_PROGRESS" | "DRAFT" | "REJECTED";
  auditHash?: string;
  lastAuditedAt?: string;
  steps: ApprovalStep[];
}

export interface ApprovalWorkflowTimelineProps {
  steps: ApprovalStep[];
  title?: string;
  subtitle?: string;
  workflowInfo?: {
    itemCode?: string;
    itemTitle?: string;
    department?: string;
    creator?: string;
    createdAt?: string;
  };
  auditHash?: string;
  lastAuditedAt?: string;
  bannerPosition?: "top" | "bottom" | "both";
  className?: string;
}

/**
 * Component "Chuỗi cấp duyệt & Nhật ký thẩm định" (Approval Workflow & Audit Trail)
 * - Timeline dọc với đường kẻ xuyên suốt (relative, absolute w-0.5 bg-gray-200)
 * - 3 trạng thái Node chuẩn xác:
 *    + Đã duyệt: bg-green-500, icon tick trắng
 *    + Đang chờ duyệt: bg-blue-500, animate-pulse
 *    + Chưa đến lượt: bg-gray-200
 * - Chi tiết mỗi node gồm:
 *    + Người duyệt (in đậm) & Vai trò (chữ nhỏ màu xám)
 *    + Thời điểm (ngày giờ hoặc "Đang chờ xử lý...")
 *    + Ý kiến (comment trong khối nền xám siêu nhạt, italic/ngoặc kép, rounded-lg)
 * - Bảo mật & Read-Only: Tuyệt đối không có nút Sửa/Xóa. Banner khóa niêm phong bảo mật.
 */
export const ApprovalWorkflowTimeline: React.FC<ApprovalWorkflowTimelineProps> = ({
  steps = [],
  title,
  subtitle,
  workflowInfo,
  auditHash,
  lastAuditedAt,
  bannerPosition = "bottom",
  className = "",
}) => {
  const approvedCount = steps.filter((s) => s.status === "APPROVED").length;
  const totalCount = steps.length;

  const renderSecurityBanner = () => (
    <div className="flex items-center gap-2.5 px-4 py-3 bg-gray-50 border border-gray-200/80 rounded-lg text-xs text-gray-600">
      <div className="flex items-center justify-center w-6 h-6 rounded-md bg-white border border-gray-200 text-gray-500 shrink-0 shadow-xs">
        <Lock className="w-3.5 h-3.5 text-gray-600" />
      </div>
      <div className="flex-1">
        <span className="font-semibold text-gray-800">
          Lịch sử phê duyệt được bảo mật và không thể chỉnh sửa.
        </span>
        <span className="hidden sm:inline text-gray-500 ml-1">
          (Dữ liệu chỉ đọc • Audit Trail tuân thủ quy chuẩn kiểm toán)
        </span>
      </div>
      {auditHash && (
        <div className="hidden md:flex items-center gap-1 font-mono text-[11px] text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-200 shrink-0">
          <Hash className="w-3 h-3 text-gray-400" />
          <span className="truncate max-w-[130px]">{auditHash}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className={`space-y-5 font-sans ${className}`}>
      {/* Optional Top Security Banner */}
      {(bannerPosition === "top" || bannerPosition === "both") && renderSecurityBanner()}

      {/* Optional Header / Title */}
      {(title || workflowInfo) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            {title && (
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-gray-700" />
                <h4 className="text-base font-bold text-gray-900">{title}</h4>
              </div>
            )}
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
            {workflowInfo && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-600">
                {workflowInfo.itemCode && (
                  <span className="font-mono font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                    {workflowInfo.itemCode}
                  </span>
                )}
                {workflowInfo.itemTitle && (
                  <span className="font-medium text-gray-800">{workflowInfo.itemTitle}</span>
                )}
                {workflowInfo.department && (
                  <span className="text-gray-500">• {workflowInfo.department}</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              {approvedCount} / {totalCount} Cấp đã duyệt
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. BỐ CỤC TIMELINE DỌC (VERTICAL TIMELINE)                                */}
      {/* ========================================================================= */}
      <div className="relative">
        {/* Đường kẻ xuyên suốt ở bên trái để nối các bước duyệt (w-0.5 bg-gray-200) */}
        <div className="absolute left-[18px] top-4 bottom-4 w-0.5 bg-gray-200" />

        {/* Danh sách các bước duyệt */}
        <div className="space-y-6">
          {steps.map((step, index) => {
            const isApproved = step.status === "APPROVED";
            const isPending = step.status === "PENDING";
            const isNotReached = step.status === "NOT_REACHED";
            const isRejected = step.status === "REJECTED";

            // Định dạng thời điểm chuẩn xác theo logic nghiệp vụ
            const displayTimestamp = isPending
              ? "Đang chờ xử lý..."
              : isNotReached
              ? step.timestamp || "Chưa đến lượt xử lý"
              : step.timestamp;

            return (
              <div
                key={step.id || `step-${index}`}
                className="relative flex items-start gap-4 group"
              >
                {/* =================================================================== */}
                {/* NODE ĐIỂM NỐI: Tròn, màu sắc và icon chuẩn xác theo trạng thái        */}
                {/* =================================================================== */}
                <div
                  className={`relative z-10 flex items-center justify-center w-9 h-9 rounded-full shrink-0 ring-4 ring-white shadow-xs transition-transform duration-200 ${
                    isApproved
                      ? "bg-green-500 text-white"
                      : isPending
                      ? "bg-blue-500 text-white animate-pulse"
                      : isRejected
                      ? "bg-red-500 text-white"
                      : "bg-gray-200 text-gray-400"
                  }`}
                  title={
                    isApproved
                      ? "Đã duyệt"
                      : isPending
                      ? "Đang chờ duyệt"
                      : isRejected
                      ? "Từ chối"
                      : "Chưa đến lượt"
                  }
                >
                  {isApproved && <Check className="w-4 h-4 text-white stroke-[2.8]" />}
                  {isPending && <Clock className="w-4 h-4 text-white" />}
                  {isRejected && <X className="w-4 h-4 text-white stroke-[2.8]" />}
                  {isNotReached && <Circle className="w-2.5 h-2.5 fill-gray-400 text-gray-400" />}
                </div>

                {/* =================================================================== */}
                {/* 2. CARD NỘI DUNG CHI TIẾT TỪNG BƯỚC DUYỆT (Bên phải Node)           */}
                {/* =================================================================== */}
                <div
                  className={`flex-1 rounded-xl p-4 sm:p-5 border transition-all ${
                    isApproved
                      ? "bg-white border-gray-200/80 shadow-xs"
                      : isPending
                      ? "bg-blue-50/20 border-blue-200/90 shadow-xs ring-1 ring-blue-100/60"
                      : isRejected
                      ? "bg-red-50/20 border-red-200/80 shadow-xs"
                      : "bg-gray-50/50 border-gray-200/60"
                  }`}
                >
                  {/* Header của Bước duyệt & Badge trạng thái */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-gray-100">
                    <span className="text-xs font-semibold text-gray-600 tracking-wide uppercase">
                      {step.stepName || `Cấp ${step.stepNumber || index + 1}`}
                    </span>

                    {/* Status Badge */}
                    <div>
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                          Đã duyệt
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping inline-block" />
                          Đang chờ duyệt
                        </span>
                      )}
                      {isNotReached && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                          Chưa đến lượt
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                          <X className="w-3 h-3 stroke-[2.5]" />
                          Từ chối
                        </span>
                      )}
                    </div>
                  </div>

                  {/* THÔNG TIN 1: Người duyệt & Vai trò */}
                  {/* THÔNG TIN 2: Thời điểm */}
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5 mb-3">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-bold text-gray-900 text-sm sm:text-base">
                        {step.approverName}
                      </span>
                      <span className="text-xs text-gray-500 font-normal">
                        ({step.approverRole})
                      </span>
                      {step.department && (
                        <span className="text-[11px] text-gray-400">
                          • {step.department}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-gray-500 shrink-0 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span
                        className={
                          isPending
                            ? "text-blue-600 font-semibold"
                            : isNotReached
                            ? "text-gray-400"
                            : "text-gray-700"
                        }
                      >
                        {displayTimestamp}
                      </span>
                    </div>
                  </div>

                  {/* THÔNG TIN 3: Ý kiến (Comment) */}
                  {/* Khối nền xám siêu nhạt, chữ nghiêng (italic), để trong ngoặc kép, rounded-lg */}
                  <div className="p-3 bg-gray-50/90 border border-gray-100 rounded-lg">
                    <p className="text-[11px] font-semibold text-gray-500 mb-1">
                      Ý kiến phê duyệt:
                    </p>
                    <p className="text-xs sm:text-sm text-gray-700 italic leading-relaxed">
                      &ldquo;{step.comment || "Không có ý kiến bổ sung."}&rdquo;
                    </p>
                  </div>

                  {/* 3. LOGIC READ-ONLY: TUYỆT ĐỐI KHÔNG CÓ NÚT EDIT/DELETE TẠI ĐÂY */}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BANNER BẢO MẬT & READ-ONLY (Dưới cùng)                                 */}
      {/* ========================================================================= */}
      {(bannerPosition === "bottom" || bannerPosition === "both") && renderSecurityBanner()}

      {lastAuditedAt && (
        <div className="text-right text-[11px] text-gray-400 font-mono">
          Lần kiểm tra gần nhất: {lastAuditedAt}
        </div>
      )}
    </div>
  );
};

export default ApprovalWorkflowTimeline;
