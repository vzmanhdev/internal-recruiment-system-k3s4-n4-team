"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle2, DollarSign, FileCheck, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Candidate, OfferProposal } from "../types/recruiter.types";
import { recruiterService } from "../services/recruiter.service";

interface OfferProposalModalProps {
  isOpen: boolean;
  candidate: Candidate | null;
  onClose: () => void;
  onSuccess: (offer: OfferProposal) => void;
}

export function OfferProposalModal({
  isOpen,
  candidate,
  onClose,
  onSuccess,
}: OfferProposalModalProps) {
  const [level, setLevel] = useState("Senior L3");
  const [baseSalary, setBaseSalary] = useState("35000000");
  const standardMin = 28000000;
  const standardMax = 45000000;
  const [allowances, setAllowances] = useState("2000000");
  const [startDate, setStartDate] = useState("2026-11-01");
  const [deadline, setDeadline] = useState("2026-10-10");
  const [justification, setJustification] = useState("");
  const [error, setError] = useState("");

  if (!isOpen || !candidate) return null;

  const currentSalaryNum = Number(baseSalary) || 0;
  const isSalaryExceeded = currentSalaryNum > standardMax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!baseSalary || currentSalaryNum <= 0) {
      setError("Vui lòng nhập mức lương cơ bản hợp lệ.");
      return;
    }

    if (isSalaryExceeded && !justification.trim()) {
      setError("Mức lương đề xuất vượt dải chuẩn của chức danh. Bắt buộc nhập giải trình để gửi cấp thẩm quyền duyệt!");
      return;
    }

    const newOffer = recruiterService.createOffer({
      candidateId: candidate.id,
      candidateName: candidate.fullName,
      jobTitle: candidate.jobTitle,
      department: candidate.department,
      level,
      baseSalary: currentSalaryNum,
      standardMinSalary: standardMin,
      standardMaxSalary: standardMax,
      allowances: Number(allowances) || 0,
      startDate,
      deadline,
      status: "pending_approval",
      isSalaryExceeded,
      justification: justification.trim() || undefined,
    });

    onSuccess(newOffer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-600">
              <FileCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">Soạn đề xuất Offer (S7-04)</h2>
              <p className="text-xs text-slate-500">Ứng viên: <strong>{candidate.fullName}</strong> — #{candidate.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && <p className="text-xs font-bold text-red-600">{error}</p>}

          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Vị trí: <strong>{candidate.jobTitle}</strong></span>
              <span className="font-semibold text-slate-600">Phòng ban: <strong>{candidate.department}</strong></span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-blue-200/60">
              <span className="text-blue-800 font-bold">
                Dải lương chuẩn của chức danh:
              </span>
              <span className="font-extrabold text-blue-900">
                {standardMin.toLocaleString("vi-VN")} – {standardMax.toLocaleString("vi-VN")} VNĐ
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Cấp bậc đề xuất"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              options={[
                { value: "Junior L1", label: "Junior L1" },
                { value: "Middle L2", label: "Middle L2" },
                { value: "Senior L3", label: "Senior L3" },
                { value: "Lead L4", label: "Lead / Specialist L4" },
              ]}
            />
            <Input
              label="Lương cơ bản đề xuất (Gross/tháng) *"
              type="number"
              step="500000"
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
              placeholder="35000000"
            />
          </div>

          {/* Cảnh báo vượt dải chuẩn */}
          {isSalaryExceeded && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900">MỨC LƯƠNG VƯỢT DẢI CHUẨN CỦA CHỨC DANH!</h4>
                  <p className="text-xs text-amber-800 mt-1">
                    Mức đề xuất {currentSalaryNum.toLocaleString("vi-VN")} đ cao hơn mức tối đa quy định ({standardMax.toLocaleString("vi-VN")} đ). Theo quy trình, bắt buộc phải có giải trình để chuyển cấp Approver phê duyệt.
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <label className="block text-xs font-bold text-amber-900 mb-1">
                  Giải trình lý do vượt trần *
                </label>
                <textarea
                  required
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Nêu rõ về năng lực vượt trội của ứng viên, độ khan hiếm nhân tài trên thị trường hoặc yêu cầu cấp bách của dự án..."
                  className="w-full min-h-20 rounded-xl border border-amber-300 bg-white p-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Phụ cấp ăn trưa & đi lại"
              type="number"
              step="100000"
              value={allowances}
              onChange={(e) => setAllowances(e.target.value)}
              placeholder="2000000"
            />
            <Input
              label="Ngày dự kiến nhận việc *"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="Hạn phản hồi offer *"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Xem trước tóm tắt Offer</h4>
            <div className="mt-2 space-y-1 text-xs text-slate-600">
              <p>• Tổng thu nhập dự kiến: <strong>{(currentSalaryNum + (Number(allowances) || 0)).toLocaleString("vi-VN")} VNĐ</strong> / tháng</p>
              <p>• Trạng thái sau khi tạo: <span className="font-bold text-amber-600">Chờ phê duyệt</span> (Sẽ tự động gửi thư mời khi duyệt)</p>
              <p>• Hồ sơ ứng viên sẽ tự động chuyển sang cột: <span className="font-bold text-blue-600">Đề xuất Offer</span></p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={onClose}>
              Hủy bỏ
            </Button>
            <Button size="sm" type="submit" leftIcon={<FileCheck className="h-4 w-4" />}>
              Gửi duyệt Offer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
