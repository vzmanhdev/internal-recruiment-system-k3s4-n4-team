"use client";

import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { recruiterService } from "../services/recruiter.service";

interface RejectReasonModalProps {
  isOpen: boolean;
  candidateName: string;
  candidateId: string;
  onClose: () => void;
  onConfirm: (reason: string, note?: string) => void;
}

export function RejectReasonModal({
  isOpen,
  candidateName,
  candidateId,
  onClose,
  onConfirm,
}: RejectReasonModalProps) {
  const reasons = recruiterService.getRejectReasons();
  const [selectedReason, setSelectedReason] = useState(reasons[0]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) {
      setError("Vui lòng chọn lý do loại ứng viên.");
      return;
    }
    onConfirm(selectedReason, note.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-100 text-red-600">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">Xác nhận loại hồ sơ</h2>
              <p className="text-xs text-slate-500">Mã ứng viên: #{candidateId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <p className="text-sm text-slate-600">
            Bạn đang chuyển ứng viên <strong className="text-slate-900">{candidateName}</strong> sang giai đoạn{" "}
            <span className="font-bold text-red-600">Đã loại</span>. Theo quy định tuyển dụng nội bộ, bắt buộc phải ghi nhận lý do chuẩn hóa để phục vụ phân tích tỷ lệ rơi rụng hồ sơ.
          </p>

          {error && <p className="text-xs font-bold text-red-600">{error}</p>}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Lý do từ danh mục chuẩn *
            </label>
            <Select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              options={reasons.map((r) => ({ value: r, label: r }))}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Ghi chú chi tiết thêm (Không bắt buộc)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú thêm chi tiết nguyên nhân, đánh giá của hội đồng hoặc gợi ý lưu kho tiềm năng..."
              className="w-full min-h-24 rounded-xl border border-slate-200 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={onClose}>
              Hủy bỏ
            </Button>
            <Button variant="danger" size="sm" type="submit">
              Xác nhận loại
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
