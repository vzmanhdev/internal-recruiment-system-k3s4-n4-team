"use client";

import React, { useState } from "react";
import { 
  X, DollarSign, AlertTriangle, CheckCircle2, Calendar, 
  FileText, ShieldCheck, Sparkles 
} from "lucide-react";

export interface CandidateOfferOption {
  id: string;
  name: string;
  position: string;
  department: string;
  maxBandSalary: number; // VNĐ
  maxBandDisplay: string;
}

// no built-in sample candidates: the page passes the real offer-eligible applications
export const PASSED_CANDIDATES: CandidateOfferOption[] = [];

export interface CreateOfferFormData {
  candidateId: string;
  candidateName: string;
  position: string;
  department: string;
  proposedSalary: number; // in VNĐ
  maxBandSalary: number; // in VNĐ
  isOverBand: boolean;
  overPercentage: number;
  startDate: string;
  deadlineDate: string;
  allowanceNotes: string;
}

interface CreateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateOfferFormData) => void;
  /** Applications that may receive an offer, with the approved salary band. */
  candidates?: CandidateOfferOption[];
}

export const CreateOfferModal: React.FC<CreateOfferModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  candidates,
}) => {
  const options = candidates ?? PASSED_CANDIDATES;
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [proposedSalaryInput, setProposedSalaryInput] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [deadlineDate, setDeadlineDate] = useState<string>("");
  const [allowanceNotes, setAllowanceNotes] = useState<string>("");

  if (!isOpen) return null;

  const currentCandidate: CandidateOfferOption = options.find(c => c.id === selectedCandidateId) || options[0]
    || { id: "", name: "", position: "", department: "", maxBandSalary: 0, maxBandDisplay: "—" };
  
  // Parse proposed salary to VND
  const rawNum = parseFloat(proposedSalaryInput.replace(/[^0-9]/g, '')) || 0;
  // If user enters in millions (e.g. 52), normalize to 52,000,000
  const normalizedSalary = rawNum > 0 && rawNum < 1000 ? rawNum * 1000000 : rawNum;
  const isOverBand = normalizedSalary > currentCandidate.maxBandSalary;
  const overPercentage = isOverBand && currentCandidate.maxBandSalary > 0
    ? Math.round(((normalizedSalary - currentCandidate.maxBandSalary) / currentCandidate.maxBandSalary) * 100)
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!normalizedSalary || normalizedSalary <= 0) {
      alert("Vui lòng nhập mức lương đề xuất hợp lệ.");
      return;
    }

    onSubmit({
      candidateId: currentCandidate.id,
      candidateName: currentCandidate.name,
      position: currentCandidate.position,
      department: currentCandidate.department,
      proposedSalary: normalizedSalary,
      maxBandSalary: currentCandidate.maxBandSalary,
      isOverBand,
      overPercentage,
      startDate,
      deadlineDate,
      allowanceNotes,
    });
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 transition-all"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 transform transition-all max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Tạo Thư Mời Nhận Việc (Offer)</h3>
              <p className="text-xs text-slate-500">Khởi tạo và thiết lập các điều khoản đãi ngộ cho ứng viên</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-5">
            {/* Chọn Ứng viên & Vị trí (col-span-2) */}
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Chọn Ứng viên & Vị trí <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedCandidateId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedCandidateId(newId);
                  const cand = options.find(c => c.id === newId);
                  if (cand) {
                    setProposedSalaryInput(cand.maxBandSalary.toString());
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              >
                {options.length === 0 && <option value="">Không có ứng viên nào đủ điều kiện nhận offer</option>}
                {options.map((cand) => (
                  <option key={cand.id} value={cand.id}>
                    {cand.name} — {cand.position} ({cand.department})
                  </option>
                ))}
              </select>
              {/* Khung lương tối đa hiển thị ngay bên dưới */}
              <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                  Khung lương chuẩn: <strong className="font-semibold text-slate-700">{currentCandidate.maxBandDisplay}</strong>
                </span>
                <span className="text-[11px] text-slate-400">Phòng ban: {currentCandidate.department}</span>
              </div>
            </div>

            {/* Lương đề xuất (Proposed Salary) */}
            <div className="col-span-2 sm:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Lương Đề Xuất (VNĐ) <span className="text-rose-500">*</span>
                </label>
                {normalizedSalary > 0 && (
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {formatVND(normalizedSalary)} ({normalizedSalary / 1000000} triệu VNĐ)
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="500000"
                  value={proposedSalaryInput}
                  onChange={(e) => setProposedSalaryInput(e.target.value)}
                  placeholder="Ví dụ: 50000000"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono font-medium pl-10"
                />
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-[11px] text-slate-400">Mẫu thử:</span>
                <button
                  type="button"
                  onClick={() => setProposedSalaryInput(currentCandidate.maxBandSalary.toString())}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer transition-colors"
                >
                  Bằng chuẩn ({currentCandidate.maxBandSalary / 1000000}tr)
                </button>
                <button
                  type="button"
                  onClick={() => setProposedSalaryInput((currentCandidate.maxBandSalary + 2000000).toString())}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium cursor-pointer transition-colors border border-amber-200"
                >
                  Vượt +2 triệu ({(currentCandidate.maxBandSalary + 2000000) / 1000000}tr)
                </button>
                <button
                  type="button"
                  onClick={() => setProposedSalaryInput((currentCandidate.maxBandSalary + 5000000).toString())}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium cursor-pointer transition-colors border border-rose-200"
                >
                  Vượt +5 triệu ({(currentCandidate.maxBandSalary + 5000000) / 1000000}tr)
                </button>
              </div>
            </div>

            {/* Cảnh báo động (Dynamic Warning - col-span-2) */}
            {normalizedSalary > 0 && (
              isOverBand ? (
                <div className="col-span-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center gap-2 text-xs font-medium">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <div>
                    <span>⚠️ Mức lương đề xuất vượt dải chuẩn. Offer này sẽ tự động chuyển lên cấp CEO để phê duyệt ngoại lệ.</span>
                    <div className="text-[11px] text-red-600/80 font-mono mt-0.5">
                      Vượt mức: +{formatVND(normalizedSalary - currentCandidate.maxBandSalary)} (+{overPercentage}%)
                    </div>
                  </div>
                </div>
              ) : (
                <div className="col-span-2 bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg flex items-center gap-2 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>✅ Mức lương nằm trong dải chuẩn (Tự động duyệt)</span>
                </div>
              )
            )}

            {/* Ngày dự kiến đi làm (Start Date) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Ngày Dự Kiến Đi Làm <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium pl-10"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Hạn chót phản hồi Offer */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Hạn Chót Phản Hồi Offer <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={deadlineDate}
                  onChange={(e) => setDeadlineDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium pl-10"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Trợ cấp & Ghi chú thêm (col-span-2) */}
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Trợ Cấp & Ghi Chú Thêm
              </label>
              <textarea
                rows={3}
                value={allowanceNotes}
                onChange={(e) => setAllowanceNotes(e.target.value)}
                placeholder="Ví dụ: Phụ cấp ăn trưa 1.000.000 VNĐ/tháng, phụ cấp xăng xe 500.000 VNĐ/tháng, cấp laptop Macbook Pro..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium leading-relaxed resize-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-slate-600 hover:bg-slate-50 rounded-full font-medium transition-colors cursor-pointer text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-colors shadow-sm cursor-pointer text-sm flex items-center gap-1.5"
            >
              <span>Tạo & Gửi Trình Duyệt</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
