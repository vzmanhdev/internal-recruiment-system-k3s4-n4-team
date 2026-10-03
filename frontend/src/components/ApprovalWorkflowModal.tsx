"use client";

import React from "react";
import { X, ShieldCheck, Lock } from "lucide-react";
import {
  ApprovalWorkflowTimeline,
  ApprovalWorkflowRecord,
  ApprovalStep,
} from "./ApprovalWorkflowTimeline";

export interface ApprovalWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow?: ApprovalWorkflowRecord | null;
  steps?: ApprovalStep[];
  title?: string;
  itemCode?: string;
  itemTitle?: string;
  department?: string;
  creator?: string;
  createdAt?: string;
}

/**
 * Modal hiển thị "Chuỗi cấp duyệt & Nhật ký thẩm định" (Approval Workflow & Audit Trail)
 * Đặt bên trong Modal chi tiết của một Yêu cầu tuyển dụng hoặc mở độc lập từ bảng/thẻ yêu cầu.
 * Đảm bảo 100% Read-only & Chuẩn kiểm toán Audit Trail.
 */
export const ApprovalWorkflowModal: React.FC<ApprovalWorkflowModalProps> = ({
  isOpen,
  onClose,
  workflow,
  steps,
  title = "Chuỗi Cấp Duyệt & Nhật Ký Thẩm Định",
  itemCode,
  itemTitle,
  department,
  creator,
  createdAt,
}) => {
  if (!isOpen) return null;

  // Resolve steps and metadata from workflow or props
  const resolvedSteps = workflow?.steps || steps || [];
  const resolvedCode = workflow?.itemCode || itemCode;
  const resolvedTitle = workflow?.itemTitle || itemTitle;
  const resolvedDept = workflow?.department || department;
  const resolvedCreator = workflow?.creator || creator;
  const resolvedCreatedAt = workflow?.createdAt || createdAt;
  const resolvedHash = workflow?.auditHash;
  const resolvedLastAuditedAt = workflow?.lastAuditedAt;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn font-sans"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-3xl rounded-[24px] sm:rounded-[28px] shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Modal Header */}
        <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-gray-100 flex items-start justify-between bg-gradient-to-r from-gray-50 via-white to-blue-50/30">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200/60 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                  <Lock className="w-3 h-3 text-green-600" />
                  Read-only • Audit Trail
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500">
                Bảo toàn toàn vẹn lịch sử xét duyệt • Không thể chỉnh sửa hoặc xóa theo chuẩn ISO/SOC2
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-white">
          {/* Thông tin tóm tắt hồ sơ nếu có */}
          {(resolvedCode || resolvedTitle) && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/40 via-gray-50 to-indigo-50/20 border border-blue-100/70">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                {resolvedCode && (
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-white text-gray-700 border border-gray-200 shadow-xs">
                    {resolvedCode}
                  </span>
                )}
                <span className="text-xs font-medium text-gray-500">Hồ sơ tuyển dụng</span>
              </div>
              {resolvedTitle && (
                <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
                  {resolvedTitle}
                </h4>
              )}
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-gray-600">
                {resolvedDept && (
                  <span>
                    Phòng ban: <strong>{resolvedDept}</strong>
                  </span>
                )}
                {resolvedCreator && (
                  <span>
                    Người đề xuất: <strong>{resolvedCreator}</strong>
                  </span>
                )}
                {resolvedCreatedAt && (
                  <span>
                    Khởi tạo: <strong>{resolvedCreatedAt}</strong>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Component Timeline Thẩm Định */}
          <ApprovalWorkflowTimeline
            steps={resolvedSteps}
            auditHash={resolvedHash}
            lastAuditedAt={resolvedLastAuditedAt}
            bannerPosition="bottom"
          />
        </div>

        {/* Modal Footer: CHỈ ĐỌC - TUYỆT ĐỐI KHÔNG CÓ NÚT SỬA/XÓA */}
        <div className="px-6 py-4 sm:px-8 sm:py-4.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Lock className="w-4 h-4 text-gray-400" />
            <span>
              Chế độ: <strong>Chỉ xem (Read-only)</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-full font-semibold text-sm transition-all shadow-xs cursor-pointer hover:shadow-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalWorkflowModal;
