"use client";

import React, { useState } from "react";
import { Briefcase, Check, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { JobRequisitionInherited, RecruiterJobPosting } from "../types/recruiter.types";
import { recruiterService } from "../services/recruiter.service";

interface JobPostingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (posting: RecruiterJobPosting) => void;
}

export function JobPostingFormModal({ isOpen, onClose, onSuccess }: JobPostingFormModalProps) {
  const requisitions = recruiterService.getRequisitions();
  const [selectedReqId, setSelectedReqId] = useState<string>(requisitions[0]?.id || "");

  const currentReq = requisitions.find((r) => r.id === selectedReqId) || requisitions[0];

  const [formData, setFormData] = useState({
    title: currentReq?.title || "",
    department: currentReq?.department || "Khối Công nghệ",
    location: "Hà Nội (Hybrid)",
    employmentType: "Toàn thời gian" as RecruiterJobPosting["employmentType"],
    openings: `${currentReq?.openings || 1} người`,
    minSalary: String(currentReq?.minSalary || 20000000),
    maxSalary: String(currentReq?.maxSalary || 35000000),
    showSalary: true,
    deadline: currentReq?.needBy || "2026-11-30",
    skills: "React, Next.js, TypeScript",
    description: currentReq?.description || "",
    responsibilities: "• Thiết kế và phát triển tính năng mới\n• Tối ưu hóa hiệu năng ứng dụng\n• Phối hợp chặt chẽ với Product Manager và QA",
    requirements: "• Tối thiểu 3 năm kinh nghiệm trong lĩnh vực liên quan\n• Tư duy giải quyết vấn đề tốt và giao tiếp mạch lạc",
  });

  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSelectRequisition = (reqId: string) => {
    setSelectedReqId(reqId);
    const req = requisitions.find((r) => r.id === reqId);
    if (req) {
      setFormData((prev) => ({
        ...prev,
        title: req.title,
        department: req.department,
        openings: `${req.openings} người`,
        minSalary: String(req.minSalary),
        maxSalary: String(req.maxSalary),
        deadline: req.needBy,
        description: req.description,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim() || !formData.deadline) {
      setError("Vui lòng nhập tiêu đề vị trí và hạn chót nhận hồ sơ.");
      return;
    }

    const newPosting = recruiterService.createJobPostingFromRequisition(selectedReqId, {
      title: formData.title.trim(),
      department: formData.department,
      location: formData.location,
      employmentType: formData.employmentType,
      openings: formData.openings,
      minSalary: Number(formData.minSalary) || 0,
      maxSalary: Number(formData.maxSalary) || 0,
      showSalary: formData.showSalary,
      deadline: formData.deadline,
      status: "published",
      skills: formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
      description: formData.description.trim(),
      responsibilities: formData.responsibilities.split("\n").filter(Boolean),
      requirements: formData.requirements.split("\n").filter(Boolean),
    });

    onSuccess(newPosting);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-blue-600">
              <Briefcase className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">Soạn tin tuyển dụng từ Yêu cầu đã duyệt (S3-09)</h2>
              <p className="text-xs text-slate-500">Kế thừa mô tả và dải lương đã được Trưởng bộ phận & HR phê duyệt</p>
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

          {/* Requisition selector */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
            <label className="block text-xs font-bold text-blue-900 mb-1.5">
              Chọn Yêu cầu tuyển dụng đã duyệt *
            </label>
            <Select
              value={selectedReqId}
              onChange={(e) => handleSelectRequisition(e.target.value)}
              options={requisitions.map((r) => ({
                value: r.id,
                label: `[${r.id}] ${r.title} - ${r.department} (Cần: ${r.openings} người)`,
              }))}
            />
            <p className="mt-2 text-[11px] text-blue-700">
              ✨ Thông tin chức danh, dải lương và số lượng đã được tự động điền sẵn từ phiếu yêu cầu.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Tiêu đề tin tuyển dụng *"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <Input
              label="Phòng ban"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Địa điểm làm việc"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
            <Select
              label="Hình thức làm việc"
              value={formData.employmentType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  employmentType: e.target.value as RecruiterJobPosting["employmentType"],
                })
              }
              options={[
                { value: "Toàn thời gian", label: "Toàn thời gian" },
                { value: "Bán thời gian", label: "Bán thời gian" },
                { value: "Thực tập", label: "Thực tập" },
              ]}
            />
            <Input
              label="Hạn nhận hồ sơ *"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Lương tối thiểu (VND)"
              type="number"
              value={formData.minSalary}
              onChange={(e) => setFormData({ ...formData, minSalary: e.target.value })}
            />
            <Input
              label="Lương tối đa (VND)"
              type="number"
              value={formData.maxSalary}
              onChange={(e) => setFormData({ ...formData, maxSalary: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showSalaryCheck"
              checked={formData.showSalary}
              onChange={(e) => setFormData({ ...formData, showSalary: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="showSalaryCheck" className="text-xs font-semibold text-slate-700">
              Công khai dải lương trên Cổng tuyển dụng nội bộ
            </label>
          </div>

          <div>
            <Input
              label="Kỹ năng yêu cầu (cách nhau bằng dấu phẩy)"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Mô tả vị trí (Được kế thừa từ yêu cầu & có thể tinh chỉnh lại) *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full min-h-24 rounded-xl border border-slate-200 p-3 text-xs leading-relaxed focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Trách nhiệm chính (mỗi dòng một ý)
              </label>
              <textarea
                value={formData.responsibilities}
                onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                className="w-full min-h-24 rounded-xl border border-slate-200 p-3 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Yêu cầu công việc (mỗi dòng một ý)
              </label>
              <textarea
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                className="w-full min-h-24 rounded-xl border border-slate-200 p-3 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={onClose}>
              Hủy bỏ
            </Button>
            <Button size="sm" type="submit" leftIcon={<Briefcase className="h-4 w-4" />}>
              Đăng tin tuyển dụng
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
