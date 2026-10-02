"use client";

import React, { useState } from "react";
import { AlertCircle, Plus, UploadCloud, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Candidate } from "../types/recruiter.types";
import { recruiterService } from "../services/recruiter.service";

interface CandidateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (candidate: Candidate) => void;
}

export function CandidateFormModal({ isOpen, onClose, onSuccess }: CandidateFormModalProps) {
  const jobs = recruiterService.getJobPostings();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    jobId: jobs[0]?.id || "",
    source: "LinkedIn" as Candidate["source"],
    experienceYears: "3",
    currentCompany: "",
    education: "Đại học",
    skills: "React, TypeScript, CSS",
    cvSummary: "",
  });

  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleEmailChange = (val: string) => {
    setFormData((prev) => ({ ...prev, email: val }));
    checkDuplicate(val, formData.phone);
  };

  const handlePhoneChange = (val: string) => {
    setFormData((prev) => ({ ...prev, phone: val }));
    checkDuplicate(formData.email, val);
  };

  const checkDuplicate = (email: string, phone: string) => {
    if (!email && !phone) {
      setDuplicateWarning(null);
      return;
    }
    const dup = recruiterService.checkDuplicateCandidate(email, phone);
    if (dup) {
      setDuplicateWarning(
        `Phát hiện ứng viên trùng khớp: #${dup.id} - ${dup.fullName} (${dup.jobTitle}, nộp ngày ${dup.appliedDate}). Bạn vẫn có thể thêm hoặc hệ thống sẽ hỗ trợ gộp hồ sơ!`
      );
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setError("Vui lòng điền đầy đủ Họ tên, Email và Số điện thoại.");
      return;
    }

    const selectedJob = jobs.find((j) => j.id === formData.jobId) || jobs[0];

    const newCandidate = recruiterService.addManualCandidate({
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      jobId: selectedJob?.id || "JOB-01",
      jobTitle: selectedJob?.title || "Vị trí tuyển dụng",
      department: selectedJob?.department || "Khối Công nghệ",
      stage: "new_applied",
      source: formData.source,
      appliedDate: new Date().toLocaleDateString("vi-VN"),
      experienceYears: Number(formData.experienceYears) || 0,
      currentCompany: formData.currentCompany.trim(),
      education: formData.education.trim(),
      matchScore: 85,
      rating: 3,
      slaDaysInCurrentStage: 0,
      slaOverdue: false,
      tags: ["Thêm thủ công", formData.source],
      skills: formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
      cvFileName: "CV_Imported.pdf",
      cvFileSize: "1.2 MB",
      cvSummary: formData.cvSummary.trim() || "Hồ sơ ứng viên được tiếp nhận từ nguồn ngoài do Recruiter thêm trực tiếp.",
    });

    onSuccess(newCandidate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-blue-600">
              <UserPlus className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">Thêm ứng viên thủ công</h2>
              <p className="text-xs text-slate-500">Đưa ứng viên từ LinkedIn, sự kiện hoặc giới thiệu vào pipeline</p>
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

          {duplicateWarning && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-bold">Cảnh báo trùng lặp thông tin</p>
                <p className="mt-0.5">{duplicateWarning}</p>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Họ và tên ứng viên *"
              required
              placeholder="Nguyễn Văn A"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
            <Input
              label="Email liên hệ *"
              type="email"
              required
              placeholder="candidate@gmail.com"
              value={formData.email}
              onChange={(e) => handleEmailChange(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Số điện thoại *"
              required
              placeholder="0912345678"
              value={formData.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
            />
            <Select
              label="Nguồn ứng viên"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value as Candidate["source"] })}
              options={[
                { value: "LinkedIn", label: "LinkedIn" },
                { value: "Nội bộ", label: "Giới thiệu nội bộ" },
                { value: "TopCV", label: "TopCV / VietnamWorks" },
                { value: "Website", label: "Website công ty" },
                { value: "Khác", label: "Khác" },
              ]}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Vị trí ứng tuyển *"
              value={formData.jobId}
              onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
              options={jobs.map((j) => ({ value: j.id, label: `${j.title} (${j.department})` }))}
            />
            <Input
              label="Số năm kinh nghiệm"
              type="number"
              min="0"
              value={formData.experienceYears}
              onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Công ty hiện tại"
              placeholder="FPT, Viettel, VNG..."
              value={formData.currentCompany}
              onChange={(e) => setFormData({ ...formData, currentCompany: e.target.value })}
            />
            <Input
              label="Học vấn / Bằng cấp"
              placeholder="Cử nhân CNTT - Bách Khoa"
              value={formData.education}
              onChange={(e) => setFormData({ ...formData, education: e.target.value })}
            />
          </div>

          <Input
            label="Kỹ năng chính (cách nhau bởi dấu phẩy)"
            placeholder="React, Next.js, TypeScript, SQL..."
            value={formData.skills}
            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
          />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Tóm tắt hồ sơ & Đánh giá sơ bộ
            </label>
            <textarea
              placeholder="Tóm tắt năng lực cốt lõi hoặc lý do recruiter chủ động liên hệ..."
              value={formData.cvSummary}
              onChange={(e) => setFormData({ ...formData, cvSummary: e.target.value })}
              className="w-full min-h-20 rounded-xl border border-slate-200 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center hover:bg-slate-100/60 cursor-pointer">
            <UploadCloud className="mx-auto h-8 w-8 text-blue-500" />
            <p className="mt-2 text-xs font-bold text-slate-700">Đính kèm tệp CV (PDF / Word)</p>
            <p className="text-[11px] text-slate-400">Dung lượng tối đa 5MB</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={onClose}>
              Hủy bỏ
            </Button>
            <Button size="sm" type="submit" leftIcon={<Plus className="h-4 w-4" />}>
              Thêm vào Pipeline
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
