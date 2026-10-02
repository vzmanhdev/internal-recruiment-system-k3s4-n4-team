"use client";

import React from "react";
import { GitMerge, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Candidate } from "../types/recruiter.types";

interface DuplicateResolveModalProps {
  isOpen: boolean;
  primaryCandidate: Candidate | null;
  secondaryCandidate: Candidate | null;
  onClose: () => void;
  onConfirmMerge: (primaryId: string, secondaryId: string) => void;
}

export function DuplicateResolveModal({
  isOpen,
  primaryCandidate,
  secondaryCandidate,
  onClose,
  onConfirmMerge,
}: DuplicateResolveModalProps) {
  if (!isOpen || !primaryCandidate || !secondaryCandidate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-100 text-indigo-600">
              <GitMerge className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">Phát hiện hồ sơ trùng lặp & Gộp hồ sơ</h2>
              <p className="text-xs text-slate-500">So sánh cạnh nhau trước khi hợp nhất dữ liệu vào hồ sơ chính</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Primary Profile */}
          <div className="rounded-xl border-2 border-blue-500 bg-blue-50/20 p-4 relative">
            <span className="absolute -top-3 left-4 rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
              Hồ sơ chính (Giữ lại)
            </span>
            <div className="mt-1 space-y-2">
              <h3 className="font-extrabold text-slate-900 text-base">{primaryCandidate.fullName}</h3>
              <p className="text-xs text-blue-700 font-semibold">{primaryCandidate.jobTitle}</p>
              <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-200/60">
                <p><strong>Mã:</strong> #{primaryCandidate.id}</p>
                <p><strong>Email:</strong> {primaryCandidate.email}</p>
                <p><strong>SĐT:</strong> {primaryCandidate.phone}</p>
                <p><strong>Nguồn:</strong> {primaryCandidate.source}</p>
                <p><strong>Ngày nộp:</strong> {primaryCandidate.appliedDate}</p>
                <p><strong>Kinh nghiệm:</strong> {primaryCandidate.experienceYears} năm</p>
                <p><strong>Đánh giá:</strong> {primaryCandidate.rating}/5 sao</p>
              </div>
              <div className="pt-2">
                <p className="text-[11px] font-bold text-slate-500">Kỹ năng:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {primaryCandidate.skills.map((s) => (
                    <span key={s} className="rounded bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Profile */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 relative">
            <span className="absolute -top-3 left-4 rounded-full bg-slate-500 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
              Hồ sơ trùng lặp (Được gộp vào)
            </span>
            <div className="mt-1 space-y-2">
              <h3 className="font-extrabold text-slate-900 text-base">{secondaryCandidate.fullName}</h3>
              <p className="text-xs text-slate-600 font-semibold">{secondaryCandidate.jobTitle}</p>
              <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-200/60">
                <p><strong>Mã:</strong> #{secondaryCandidate.id}</p>
                <p><strong>Email:</strong> {secondaryCandidate.email}</p>
                <p><strong>SĐT:</strong> {secondaryCandidate.phone}</p>
                <p><strong>Nguồn:</strong> {secondaryCandidate.source}</p>
                <p><strong>Ngày nộp:</strong> {secondaryCandidate.appliedDate}</p>
                <p><strong>Kinh nghiệm:</strong> {secondaryCandidate.experienceYears} năm</p>
                <p><strong>Đánh giá:</strong> {secondaryCandidate.rating}/5 sao</p>
              </div>
              <div className="pt-2">
                <p className="text-[11px] font-bold text-slate-500">Kỹ năng:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {secondaryCandidate.skills.map((s) => (
                    <span key={s} className="rounded bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 border border-slate-200">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-blue-50/60 p-3 text-xs text-slate-600">
          💡 <strong>Khi gộp hồ sơ:</strong> Toàn bộ lịch sử nộp đơn, nhật ký tương tác và các ghi chú nội bộ của hồ sơ #{secondaryCandidate.id} sẽ được tích hợp đầy đủ vào hồ sơ #{primaryCandidate.id}, đảm bảo không làm mất dữ liệu đánh giá quá khứ.
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose}>
            Để riêng (Không gộp)
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onConfirmMerge(primaryCandidate.id, secondaryCandidate.id);
              onClose();
            }}
            leftIcon={<GitMerge className="h-4 w-4" />}
          >
            Xác nhận gộp hồ sơ
          </Button>
        </div>
      </div>
    </div>
  );
}
