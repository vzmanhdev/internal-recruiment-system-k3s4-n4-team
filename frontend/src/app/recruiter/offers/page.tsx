"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  FileCheck,
  Plus,
  RefreshCw,
  Send,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { OfferProposal } from "@/features/recruiter/types/recruiter.types";
import { recruiterService } from "@/features/recruiter/services/recruiter.service";
import { OfferProposalModal } from "@/features/recruiter/components/OfferProposalModal";

export default function RecruiterOffersPage() {
  const [offers, setOffers] = useState<OfferProposal[]>(() => recruiterService.getOffers());
  const candidates = recruiterService.getCandidates();
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(
    candidates.find((c) => c.stage === "interviewing" || c.stage === "offer_proposed") || candidates[0]
  );

  const refreshOffers = () => {
    setOffers([...recruiterService.getOffers()]);
  };

  const handleUpdateStatus = (offerId: string, status: OfferProposal["status"], reason?: string) => {
    recruiterService.updateOfferStatus(offerId, status, reason);
    refreshOffers();
  };

  const statusMap: Record<
    OfferProposal["status"],
    { label: string; tone: "blue" | "green" | "amber" | "red" | "purple" }
  > = {
    draft: { label: "Bản nháp", tone: "blue" },
    pending_approval: { label: "Chờ phê duyệt", tone: "amber" },
    approved: { label: "Đã phê duyệt", tone: "purple" },
    sent_to_candidate: { label: "Đã gửi ứng viên", tone: "blue" },
    accepted: { label: "Đồng ý nhận việc", tone: "green" },
    rejected: { label: "Ứng viên từ chối", tone: "red" },
    renegotiating: { label: "Đang thương lượng", tone: "amber" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
            <FileCheck className="h-4 w-4" />
            <span>Quản lý Đề xuất Offer (EP-07)</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-950 sm:text-3xl">
            Đề xuất Thư Mời Nhận Việc (Offer)
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Soạn thảo đề xuất lương, kiểm tra dải chuẩn và theo dõi phản hồi ứng viên.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setSelectedCandidate(
              candidates.find((c) => c.stage === "interviewing" || c.stage === "offer_proposed") || candidates[0]
            );
            setIsOfferModalOpen(true);
          }}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Soạn Offer mới
        </Button>
      </div>

      {/* Offers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {offers.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-400">
            Chưa có đề xuất offer nào được tạo.
          </div>
        ) : (
          offers.map((offer) => {
            const st = statusMap[offer.status] || { label: offer.status, tone: "blue" };
            return (
              <div
                key={offer.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 hover:border-blue-400 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                        st.tone === "green"
                          ? "bg-emerald-100 text-emerald-800"
                          : st.tone === "red"
                          ? "bg-red-100 text-red-800"
                          : st.tone === "amber"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {st.label}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-base mt-2">{offer.candidateName}</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {offer.jobTitle} · Cấp bậc: <strong>{offer.level}</strong>
                    </p>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">#{offer.id}</span>
                </div>

                {/* Salary breakdown vs standard band */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Lương cơ bản đề xuất:</span>
                    <span className="font-extrabold text-blue-700 text-sm">
                      {offer.baseSalary.toLocaleString("vi-VN")} đ
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-500">
                    <span>Phụ cấp hàng tháng:</span>
                    <span className="font-semibold text-slate-700">
                      {offer.allowances.toLocaleString("vi-VN")} đ
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 font-bold text-slate-900">
                    <span>Tổng thu nhập dự kiến:</span>
                    <span className="text-emerald-700">
                      {(offer.baseSalary + offer.allowances).toLocaleString("vi-VN")} đ/tháng
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                    <span>Dải lương chuẩn chức danh:</span>
                    <span>
                      {offer.standardMinSalary.toLocaleString("vi-VN")} – {offer.standardMaxSalary.toLocaleString("vi-VN")} đ
                    </span>
                  </div>
                </div>

                {/* Warning if exceeded */}
                {offer.isSalaryExceeded && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      Lương vượt trần chuẩn chức danh
                    </div>
                    {offer.justification && (
                      <p className="text-[11px] text-amber-800 italic">
                        Giải trình: "{offer.justification}"
                      </p>
                    )}
                  </div>
                )}

                {/* Dates info */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-1">
                  <div>
                    <span>Ngày nhận việc:</span>
                    <p className="font-semibold text-slate-800">{offer.startDate}</p>
                  </div>
                  <div>
                    <span>Hạn phản hồi:</span>
                    <p className="font-semibold text-slate-800">{offer.deadline}</p>
                  </div>
                </div>

                {/* Action buttons depending on state */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">Tạo: {offer.createdAt}</span>

                  <div className="flex items-center gap-1.5">
                    {offer.status === "pending_approval" && (
                      <button
                        onClick={() => handleUpdateStatus(offer.id, "sent_to_candidate")}
                        className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100"
                      >
                        Gửi ứng viên
                      </button>
                    )}

                    {offer.status === "sent_to_candidate" && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(offer.id, "accepted")}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Đồng ý
                        </button>
                        <button
                          onClick={() => {
                            const r = prompt("Nhập lý do ứng viên từ chối offer:");
                            if (r) handleUpdateStatus(offer.id, "rejected", r);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 hover:bg-red-100"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Từ chối
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(offer.id, "renegotiating")}
                          className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 hover:bg-amber-100"
                        >
                          Thương lượng
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Offer Proposal Modal */}
      <OfferProposalModal
        isOpen={isOfferModalOpen}
        candidate={selectedCandidate}
        onClose={() => setIsOfferModalOpen(false)}
        onSuccess={() => refreshOffers()}
      />
    </div>
  );
}
