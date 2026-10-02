"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  Clock,
  Download,
  Eye,
  FileCheck,
  FileSpreadsheet,
  GitMerge,
  Mail,
  Plus,
  Search,
  Sparkles,
  Star,
  Users,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Candidate, PipelineStage } from "@/features/recruiter/types/recruiter.types";
import { recruiterService } from "@/features/recruiter/services/recruiter.service";
import { CandidateUnifiedDrawer } from "@/features/recruiter/components/CandidateUnifiedDrawer";
import { CandidateFormModal } from "@/features/recruiter/components/CandidateFormModal";
import { RejectReasonModal } from "@/features/recruiter/components/RejectReasonModal";
import { DuplicateResolveModal } from "@/features/recruiter/components/DuplicateResolveModal";
import { BulkEmailModal } from "@/features/recruiter/components/BulkEmailModal";

export default function RecruiterCandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>(() => recruiterService.getCandidates());
  const jobs = recruiterService.getJobPostings();

  // Filters
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [jobFilter, setJobFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals & Drawer
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [candidateToReject, setCandidateToReject] = useState<Candidate | null>(null);
  const [duplicatePrimary, setDuplicatePrimary] = useState<Candidate | null>(null);
  const [duplicateSecondary, setDuplicateSecondary] = useState<Candidate | null>(null);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isBulkEmailOpen, setIsBulkEmailOpen] = useState(false);

  const refreshCandidates = () => {
    setCandidates([...recruiterService.getCandidates()]);
  };

  const stageLabels: Record<PipelineStage, string> = {
    new_applied: "Hồ sơ mới",
    screening: "Sàng lọc",
    interviewing: "Phỏng vấn",
    offer_proposed: "Đề xuất Offer",
    hired: "Nhận việc",
    rejected: "Đã loại",
  };

  const filtered = candidates.filter((c) => {
    if (stageFilter !== "all" && c.stage !== stageFilter) return false;
    if (jobFilter !== "all" && c.jobId !== jobFilter) return false;
    if (sourceFilter !== "all" && c.source !== sourceFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = c.fullName.toLowerCase().includes(q);
      const matchEmail = c.email.toLowerCase().includes(q);
      const matchPhone = c.phone.includes(q);
      const matchSkill = c.skills.some((s) => s.toLowerCase().includes(q));
      if (!matchName && !matchEmail && !matchPhone && !matchSkill) return false;
    }
    return true;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((c) => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExportSelected = () => {
    const toExport = candidates.filter((c) =>
      selectedIds.length > 0 ? selectedIds.includes(c.id) : filtered.includes(c)
    );
    recruiterService.exportCandidatesToExcel(toExport, "Danh_sach_ung_vien");
  };

  const handleTriggerDuplicateCheck = (cand: Candidate) => {
    const dup = recruiterService.checkDuplicateCandidate(cand.email, cand.phone, cand.id);
    if (dup) {
      setDuplicatePrimary(cand);
      setDuplicateSecondary(dup);
      setIsDuplicateModalOpen(true);
    } else {
      alert(`Không phát hiện hồ sơ nào trùng email hoặc số điện thoại với '${cand.fullName}'.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
            <Users className="h-4 w-4" />
            <span>Quản lý hồ sơ ứng viên (EP-05)</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-950 sm:text-3xl">
            Danh sách Hồ sơ Ứng viên
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Xem hồ sơ hợp nhất, đánh giá nhanh, phát hiện trùng lặp và xuất dữ liệu báo cáo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSelected}
            leftIcon={<FileSpreadsheet className="h-4 w-4 text-emerald-600" />}
          >
            Xuất Excel ({selectedIds.length > 0 ? `${selectedIds.length} đã chọn` : filtered.length})
          </Button>

          {selectedIds.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBulkEmailOpen(true)}
              leftIcon={<Mail className="h-4 w-4 text-blue-600" />}
            >
              Gửi Email ({selectedIds.length})
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Thêm ứng viên
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm họ tên, email, SĐT, kỹ năng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Job Filter */}
          <Select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            options={[
              { value: "all", label: "Tất cả vị trí" },
              ...jobs.map((j) => ({ value: j.id, label: j.title })),
            ]}
          />

          {/* Stage Filter */}
          <Select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            options={[
              { value: "all", label: "Tất cả giai đoạn" },
              { value: "new_applied", label: "Hồ sơ mới" },
              { value: "screening", label: "Sàng lọc" },
              { value: "interviewing", label: "Phỏng vấn" },
              { value: "offer_proposed", label: "Đề xuất Offer" },
              { value: "hired", label: "Nhận việc" },
              { value: "rejected", label: "Đã loại" },
            ]}
          />

          {/* Source Filter */}
          <Select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            options={[
              { value: "all", label: "Tất cả nguồn" },
              { value: "Nội bộ", label: "Giới thiệu nội bộ" },
              { value: "LinkedIn", label: "LinkedIn" },
              { value: "TopCV", label: "TopCV" },
              { value: "Website", label: "Website" },
            ]}
          />
        </div>
      </div>

      {/* Candidates Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.length === filtered.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3.5">Ứng viên & Liên hệ</th>
                <th className="px-4 py-3.5">Vị trí ứng tuyển</th>
                <th className="px-4 py-3.5">Giai đoạn</th>
                <th className="px-4 py-3.5">Điểm & Đánh giá</th>
                <th className="px-4 py-3.5">Nguồn & Ngày nộp</th>
                <th className="px-4 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Không tìm thấy ứng viên nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filtered.map((cand) => {
                  const isSelected = selectedIds.includes(cand.id);
                  return (
                    <tr
                      key={cand.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? "bg-blue-50/30" : ""
                      }`}
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(cand.id)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-sm font-extrabold text-blue-700">
                            {cand.fullName.slice(0, 1)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span
                                onClick={() => {
                                  setSelectedCandidate(cand);
                                  setIsDrawerOpen(true);
                                }}
                                className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer"
                              >
                                {cand.fullName}
                              </span>
                              {cand.slaOverdue && (
                                <span
                                  className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"
                                  title={`Quá hạn SLA ${cand.slaDaysInCurrentStage} ngày`}
                                />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500">{cand.email} · {cand.phone}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900">{cand.jobTitle}</p>
                        <p className="text-[11px] text-slate-400">{cand.department}</p>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            cand.stage === "new_applied"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : cand.stage === "screening"
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              : cand.stage === "interviewing"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : cand.stage === "offer_proposed"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : cand.stage === "hired"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {stageLabels[cand.stage]}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 font-bold text-blue-700">
                          {cand.matchScore}%
                        </div>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${
                                star <= cand.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="font-semibold text-slate-700">{cand.source}</span>
                        <p className="text-[11px] text-slate-400">{cand.appliedDate}</p>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleTriggerDuplicateCheck(cand)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                            title="Kiểm tra trùng lặp (S5-01)"
                          >
                            <GitMerge className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCandidate(cand);
                              setIsDrawerOpen(true);
                            }}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                            title="Xem hồ sơ hợp nhất (S4-09)"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      <CandidateUnifiedDrawer
        isOpen={isDrawerOpen}
        candidate={selectedCandidate}
        onClose={() => {
          setIsDrawerOpen(false);
          refreshCandidates();
        }}
        onStageChange={(id, newStage) => {
          recruiterService.updateCandidateStage(id, newStage);
          refreshCandidates();
          setSelectedCandidate(recruiterService.getCandidateById(id) || null);
        }}
        onOpenSchedule={() => {}}
        onOpenOffer={() => {}}
        onOpenReject={(cand) => {
          setIsDrawerOpen(false);
          setCandidateToReject(cand);
        }}
      />

      {/* Manual Candidate Modal */}
      <CandidateFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => refreshCandidates()}
      />

      {/* Reject Modal */}
      <RejectReasonModal
        isOpen={Boolean(candidateToReject)}
        candidateId={candidateToReject?.id || ""}
        candidateName={candidateToReject?.fullName || ""}
        onClose={() => setCandidateToReject(null)}
        onConfirm={(reason, note) => {
          if (candidateToReject) {
            recruiterService.rejectCandidate(candidateToReject.id, reason, note);
            refreshCandidates();
          }
        }}
      />

      {/* Duplicate Resolve Modal */}
      <DuplicateResolveModal
        isOpen={isDuplicateModalOpen}
        primaryCandidate={duplicatePrimary}
        secondaryCandidate={duplicateSecondary}
        onClose={() => setIsDuplicateModalOpen(false)}
        onConfirmMerge={(pId, sId) => {
          recruiterService.mergeCandidates(pId, sId);
          refreshCandidates();
        }}
      />

      {/* Bulk Email Modal */}
      <BulkEmailModal
        isOpen={isBulkEmailOpen}
        selectedCandidates={candidates.filter((c) => selectedIds.includes(c.id))}
        onClose={() => setIsBulkEmailOpen(false)}
        onSuccess={(count) => {
          alert(`Đã gửi thành công ${count} email tới các ứng viên được chọn.`);
          setSelectedIds([]);
        }}
      />
    </div>
  );
}
