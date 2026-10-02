"use client";

import React, { useState } from "react";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Globe,
  Plus,
  Power,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { RecruiterJobPosting } from "@/features/recruiter/types/recruiter.types";
import { recruiterService } from "@/features/recruiter/services/recruiter.service";
import { JobPostingFormModal } from "@/features/recruiter/components/JobPostingFormModal";

export default function RecruiterJobsPage() {
  const [jobPostings, setJobPostings] = useState<RecruiterJobPosting[]>(() =>
    recruiterService.getJobPostings()
  );
  const requisitions = recruiterService.getRequisitions();
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);

  const refreshJobs = () => {
    setJobPostings([...recruiterService.getJobPostings()]);
  };

  const handleToggleStatus = (jobId: string) => {
    recruiterService.toggleJobPostingStatus(jobId);
    refreshJobs();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
            <Briefcase className="h-4 w-4" />
            <span>Quản trị Tin tuyển dụng (EP-04)</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-950 sm:text-3xl">
            Tin Tuyển Dụng & Yêu Cầu Đã Duyệt
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Soạn thảo tin từ yêu cầu đã duyệt, đăng công khai lên portal hoặc gỡ tin khi đủ người.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsComposeModalOpen(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Soạn tin từ Yêu cầu đã duyệt
        </Button>
      </div>

      {/* Section 1: Active Job Postings */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-slate-900">
          Các tin đang quản lý ({jobPostings.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobPostings.map((job) => {
            const isPublished = job.status === "published" || job.status === "closing_soon";
            return (
              <div
                key={job.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 hover:border-blue-400 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                        job.status === "published"
                          ? "bg-emerald-100 text-emerald-800"
                          : job.status === "closing_soon"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {job.status === "published"
                        ? "Đang tuyển dụng"
                        : job.status === "closing_soon"
                        ? "Sắp hết hạn"
                        : "Đã tạm dừng / Đóng"}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">#{job.id}</span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{job.title}</h3>
                    <p className="text-xs text-slate-500">{job.department} · {job.location}</p>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {job.skills.map((s) => (
                      <span key={s} className="rounded bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 border border-slate-200">
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1 text-xs text-slate-500">
                    <div className="flex justify-between">
                      <span>Dải lương công khai:</span>
                      <strong className="text-slate-800">
                        {job.showSalary
                          ? `${(job.minSalary / 1000000).toFixed(0)} - ${(job.maxSalary / 1000000).toFixed(0)} triệu`
                          : "Thỏa thuận"}
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Hạn nhận hồ sơ:</span>
                      <strong className="text-slate-800">{job.deadline}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Tổng ứng viên:</span>
                      <strong className="text-blue-700 font-bold">{job.totalApplicants} hồ sơ</strong>
                    </div>
                  </div>
                </div>

                {/* Bottom Toggle Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Cập nhật: {job.updatedAt}</span>
                  <button
                    onClick={() => handleToggleStatus(job.id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                      isPublished
                        ? "bg-red-50 text-red-700 hover:bg-red-100"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    <Power className="h-3.5 w-3.5" />
                    {isPublished ? "Gỡ tin" : "Đăng lại"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Approved Requisitions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Yêu cầu tuyển dụng đã được duyệt sẵn sàng tạo tin ({requisitions.length})
            </h2>
            <p className="text-xs text-slate-500">
              Các yêu cầu từ Trưởng bộ phận đã thông qua cấp duyệt ngân sách headcount.
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {requisitions.map((req) => (
            <div key={req.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 font-mono">
                    {req.id}
                  </span>
                  <h4 className="font-bold text-xs text-slate-900">{req.title}</h4>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    Đã duyệt
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {req.department} · Cần: <strong>{req.openings} người</strong> · Hạn cần người: {req.needBy} · Dải lương:{" "}
                  {(req.minSalary / 1000000).toFixed(0)} - {(req.maxSalary / 1000000).toFixed(0)} triệu
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsComposeModalOpen(true)}
              >
                Soạn tin từ phiếu này
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Job Posting Compose Modal */}
      <JobPostingFormModal
        isOpen={isComposeModalOpen}
        onClose={() => setIsComposeModalOpen(false)}
        onSuccess={() => refreshJobs()}
      />
    </div>
  );
}
