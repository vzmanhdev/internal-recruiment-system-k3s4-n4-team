"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  FileSpreadsheet,
  Filter,
  MoreVertical,
  Plus,
  Search,
  Sparkles,
  Star,
  Tag,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Candidate, PipelineStage } from "../types/recruiter.types";
import { recruiterService } from "../services/recruiter.service";
import { CandidateUnifiedDrawer } from "./CandidateUnifiedDrawer";
import { CandidateFormModal } from "./CandidateFormModal";
import { RejectReasonModal } from "./RejectReasonModal";
import { InterviewSchedulerModal } from "./InterviewSchedulerModal";
import { OfferProposalModal } from "./OfferProposalModal";

export function CandidateKanbanBoard() {
  const [candidates, setCandidates] = useState<Candidate[]>(() => recruiterService.getCandidates());
  const jobs = recruiterService.getJobPostings();

  // Filters
  const [selectedJobId, setSelectedJobId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [slaFilterOnly, setSlaFilterOnly] = useState(false);

  // Modals & Drawer State
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [candidateToReject, setCandidateToReject] = useState<Candidate | null>(null);
  const [candidateToSchedule, setCandidateToSchedule] = useState<Candidate | null>(null);
  const [candidateToOffer, setCandidateToOffer] = useState<Candidate | null>(null);

  // Drag and drop state
  const [draggedCandidateId, setDraggedCandidateId] = useState<string | null>(null);

  const refreshCandidates = () => {
    setCandidates([...recruiterService.getCandidates()]);
  };

  // 6 Stages Definition
  const stages: { key: PipelineStage; label: string; tone: string; description: string }[] = [
    { key: "new_applied", label: "Hồ sơ mới", tone: "blue", description: "Hồ sơ vừa nộp chưa qua xử lý" },
    { key: "screening", label: "Sàng lọc", tone: "indigo", description: "Đang kiểm tra tiêu chí & gọi trao đổi" },
    { key: "interviewing", label: "Phỏng vấn", tone: "amber", description: "Đã lên lịch hoặc đang phỏng vấn" },
    { key: "offer_proposed", label: "Đề xuất Offer", tone: "purple", description: "Đang soạn hoặc chờ duyệt offer" },
    { key: "hired", label: "Nhận việc", tone: "green", description: "Đã ký offer và chuẩn bị onboarding" },
    { key: "rejected", label: "Đã loại", tone: "red", description: "Đã loại hồ sơ và lưu lý do" },
  ];

  // Filtering candidates
  const filteredCandidates = candidates.filter((c) => {
    if (selectedJobId !== "all" && c.jobId !== selectedJobId) return false;
    if (slaFilterOnly && !c.slaOverdue) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.fullName.toLowerCase().includes(q);
      const matchEmail = c.email.toLowerCase().includes(q);
      const matchSkill = c.skills.some((s) => s.toLowerCase().includes(q));
      const matchTag = c.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchEmail && !matchSkill && !matchTag) return false;
    }
    return true;
  });

  const handleDragStart = (id: string) => {
    setDraggedCandidateId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (stage: PipelineStage) => {
    if (!draggedCandidateId) return;

    if (stage === "rejected") {
      const cand = candidates.find((c) => c.id === draggedCandidateId);
      if (cand) {
        setCandidateToReject(cand);
        setDraggedCandidateId(null);
        return;
      }
    }

    recruiterService.updateCandidateStage(draggedCandidateId, stage);
    setDraggedCandidateId(null);
    refreshCandidates();
  };

  const handleStageAdvance = (candidate: Candidate) => {
    const stageOrder: PipelineStage[] = ["new_applied", "screening", "interviewing", "offer_proposed", "hired"];
    const currentIndex = stageOrder.indexOf(candidate.stage);
    if (currentIndex >= 0 && currentIndex < stageOrder.length - 1) {
      const nextStage = stageOrder[currentIndex + 1];
      recruiterService.updateCandidateStage(candidate.id, nextStage);
      refreshCandidates();
      if (selectedCandidate?.id === candidate.id) {
        setSelectedCandidate(recruiterService.getCandidateById(candidate.id) || null);
      }
    }
  };

  const handleExportExcel = () => {
    recruiterService.exportCandidatesToExcel(filteredCandidates, "Pipeline_Tuyen_Dung");
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
            <Sparkles className="h-4 w-4" />
            <span>Điều phối tuyển dụng (S5-02)</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-950 sm:text-3xl">
            Pipeline Ứng viên Kanban
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Kéo thả hoặc chuyển giai đoạn ứng viên mượt mà qua 6 giai đoạn chuẩn của hệ thống.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            leftIcon={<FileSpreadsheet className="h-4 w-4 text-emerald-600" />}
          >
            Xuất Excel ({filteredCandidates.length})
          </Button>

          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Thêm ứng viên
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            {/* Job Filter */}
            <div className="w-64">
              <Select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                options={[
                  { value: "all", label: "Tất cả vị trí tuyển dụng" },
                  ...jobs.map((j) => ({ value: j.id, label: j.title })),
                ]}
              />
            </div>

            {/* Keyword Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên, email, kỹ năng (React, SQL...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* SLA Filter toggle */}
          <button
            type="button"
            onClick={() => setSlaFilterOnly((prev) => !prev)}
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
              slaFilterOnly
                ? "border-amber-400 bg-amber-50 text-amber-900 shadow-sm"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            <span>Chỉ hồ sơ trễ hạn SLA</span>
          </button>
        </div>
      </div>

      {/* 6-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start overflow-x-auto pb-6">
        {stages.map((stage) => {
          const stageCandidates = filteredCandidates.filter((c) => c.stage === stage.key);
          return (
            <div
              key={stage.key}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.key)}
              className="flex flex-col min-w-[260px] rounded-2xl border border-slate-200 bg-slate-100/60 p-3 transition-colors"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      stage.key === "new_applied"
                        ? "bg-blue-500"
                        : stage.key === "screening"
                        ? "bg-indigo-500"
                        : stage.key === "interviewing"
                        ? "bg-amber-500"
                        : stage.key === "offer_proposed"
                        ? "bg-purple-500"
                        : stage.key === "hired"
                        ? "bg-emerald-500"
                        : "bg-red-500"
                    }`}
                  />
                  <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                    {stage.label}
                  </h3>
                </div>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-600 shadow-xs border border-slate-200">
                  {stageCandidates.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="mt-3 space-y-3 min-h-[300px]">
                {stageCandidates.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-400">
                    Kéo thả ứng viên vào đây
                  </div>
                ) : (
                  stageCandidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      draggable
                      onDragStart={() => handleDragStart(candidate.id)}
                      onClick={() => {
                        setSelectedCandidate(candidate);
                        setIsDrawerOpen(true);
                      }}
                      className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs hover:border-blue-400 hover:shadow-md transition-all relative active:scale-95"
                    >
                      {/* SLA Overdue Ribbon */}
                      {candidate.slaOverdue && (
                        <div className="mb-2 flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <AlertCircle className="h-3 w-3" />
                          Trễ SLA ({candidate.slaDaysInCurrentStage} ngày)
                        </div>
                      )}

                      {/* Header inside card */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                            {candidate.fullName}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {candidate.jobTitle}
                          </p>
                        </div>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 shrink-0">
                          {candidate.source}
                        </span>
                      </div>

                      {/* Score & Rating */}
                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                          {candidate.matchScore}%
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${
                                star <= candidate.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Skills badges */}
                      <div className="mt-2.5 flex flex-wrap gap-1">
                        {candidate.skills.slice(0, 3).map((s) => (
                          <span
                            key={s}
                            className="rounded bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-600 border border-slate-100"
                          >
                            {s}
                          </span>
                        ))}
                        {candidate.skills.length > 3 && (
                          <span className="text-[10px] text-slate-400 self-center">
                            +{candidate.skills.length - 3}
                          </span>
                        )}
                      </div>

                      {/* Quick action buttons on hover */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]"
                      >
                        <span className="text-[10px] text-slate-400">#{candidate.id}</span>
                        <div className="flex items-center gap-1">
                          {stage.key !== "rejected" && (
                            <button
                              type="button"
                              onClick={() => setCandidateToReject(candidate)}
                              className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Loại hồ sơ (S5-03)"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {stage.key !== "hired" && stage.key !== "rejected" && (
                            <button
                              type="button"
                              onClick={() => handleStageAdvance(candidate)}
                              className="flex items-center gap-0.5 rounded bg-blue-50 px-2 py-0.5 font-bold text-blue-700 hover:bg-blue-600 hover:text-white transition-colors"
                              title="Chuyển bước tiếp theo"
                            >
                              Tiếp
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Unified Candidate Profile Drawer */}
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
        onOpenSchedule={(cand) => {
          setIsDrawerOpen(false);
          setCandidateToSchedule(cand);
        }}
        onOpenOffer={(cand) => {
          setIsDrawerOpen(false);
          setCandidateToOffer(cand);
        }}
        onOpenReject={(cand) => {
          setIsDrawerOpen(false);
          setCandidateToReject(cand);
        }}
      />

      {/* Manual Candidate Modal */}
      <CandidateFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          refreshCandidates();
        }}
      />

      {/* Reject Reason Modal */}
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

      {/* Interview Scheduler Modal */}
      <InterviewSchedulerModal
        isOpen={Boolean(candidateToSchedule)}
        candidate={candidateToSchedule}
        onClose={() => setCandidateToSchedule(null)}
        onSuccess={() => {
          refreshCandidates();
        }}
      />

      {/* Offer Proposal Modal */}
      <OfferProposalModal
        isOpen={Boolean(candidateToOffer)}
        candidate={candidateToOffer}
        onClose={() => setCandidateToOffer(null)}
        onSuccess={() => {
          refreshCandidates();
        }}
      />
    </div>
  );
}
