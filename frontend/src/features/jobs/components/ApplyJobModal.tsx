"use client";

import React, { useState, useEffect } from "react";
import { 
  X, Send, User, Mail, Phone, Briefcase, Building, 
  FileText, CheckCircle2, AlertCircle, UploadCloud, Sparkles 
} from "lucide-react";
import type { Job } from "@/types/job";
import { apiRequest } from "@/lib/api-client";

interface ApplyJobModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (appData: any) => void;
}

export function ApplyJobModal({
  job,
  isOpen,
  onClose,
  onSuccess,
}: ApplyJobModalProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    current_company: "Hệ Thống Nội Bộ Company",
    current_position: "",
    years_of_experience: 2,
    cv_url: "",
    cover_letter: "",
    referral_code: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill employee profile from localStorage or authService
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userInfoStr = localStorage.getItem("user_info");
      if (userInfoStr) {
        try {
          const u = JSON.parse(userInfoStr);
          setFormData((prev) => ({
            ...prev,
            full_name: u.full_name || prev.full_name,
            email: u.email || prev.email,
            phone: u.phone || "0912345678",
            current_position: u.employee_code ? `Mã NV: ${u.employee_code}` : "Chuyên viên nội bộ",
          }));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [isOpen]);

  if (!isOpen || !job) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Find numeric job_posting_id
      const numericId = parseInt(job.id, 10) || 1;

      const payload = {
        job_posting_id: numericId,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        current_company: formData.current_company,
        current_position: formData.current_position,
        years_of_experience: Number(formData.years_of_experience) || 0,
        cv_url: formData.cv_url || "https://company.internal/resumes/employee_profile.pdf",
        cover_letter: formData.cover_letter || "Ứng tuyển điều chuyển nội bộ theo định hướng phát triển cá nhân.",
        referral_code: formData.referral_code || null,
      };

      const res = await apiRequest("/applications", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      onSuccess(res);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Có lỗi xảy ra khi nộp hồ sơ. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-blue-300" />
            <span>Đăng ký Điều chuyển / Ứng tuyển Nội bộ</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            {job.title}
          </h2>
          <p className="text-xs text-blue-100 mt-1">
            Phòng ban: <strong>{job.department}</strong> | Địa điểm: <strong>{job.location}</strong>
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Thông tin nhân sự */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5 text-blue-600">
              <User className="w-4 h-4" />
              <span>Thông tin ứng viên nội bộ</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-xs">Họ và tên nhân viên *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-xs">Email công ty *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="employee@company.com"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-xs">Số điện thoại liên hệ *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0912345678"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 text-xs">Chức danh / Mã NV hiện tại</label>
                <input
                  type="text"
                  value={formData.current_position}
                  onChange={(e) => setFormData({ ...formData, current_position: e.target.value })}
                  placeholder="Ví dụ: NV-882 (Khối CNTT)"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Kinh nghiệm & CV */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 text-xs">Số năm kinh nghiệm chuyên môn</label>
              <input
                type="number"
                min={0}
                max={30}
                value={formData.years_of_experience}
                onChange={(e) => setFormData({ ...formData, years_of_experience: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 text-xs">Mã giới thiệu đồng nghiệp (nếu có)</label>
              <input
                type="text"
                value={formData.referral_code}
                onChange={(e) => setFormData({ ...formData, referral_code: e.target.value })}
                placeholder="Ví dụ: REF-2026-99"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Section 3: CV Upload / Path */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 text-xs">Link CV / Hồ sơ năng lực đính kèm</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.cv_url}
                onChange={(e) => setFormData({ ...formData, cv_url: e.target.value })}
                placeholder="https://company.internal/cv/nguyen_van_a.pdf (để trống nếu dùng CV mặc định)"
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, cv_url: "https://company.internal/resumes/employee_cv_verified.pdf" })}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
              >
                Dùng CV Hệ Thống
              </button>
            </div>
          </div>

          {/* Section 4: Cover Letter / Lý do điều chuyển */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 text-xs">Lý do ứng tuyển / Định hướng phát triển nội bộ</label>
            <textarea
              rows={3}
              value={formData.cover_letter}
              onChange={(e) => setFormData({ ...formData, cover_letter: e.target.value })}
              placeholder="Nêu rõ mong muốn thử sức tại vị trí mới, mục tiêu đóng góp cho phòng ban target..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Policy Note */}
          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-[11px] text-blue-900 leading-relaxed">
            🔒 <strong>Quyền riêng tư hồ sơ nội bộ:</strong> Thông tin ứng tuyển của bạn sẽ được chuyển thẳng tới Trưởng phòng HR & Người phụ trách vị trí. Bộ phận quản lý trực tiếp hiện tại sẽ chỉ nhận thông báo khi hồ sơ vào vòng phỏng vấn cuối.
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang gửi hồ sơ...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Xác nhận Nộp Hồ Sơ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
