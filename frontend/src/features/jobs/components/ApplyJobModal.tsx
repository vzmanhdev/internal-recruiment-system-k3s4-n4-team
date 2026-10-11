"use client";

import React, { useState, useEffect } from "react";
import { masterDataService } from "@/services/master-data.service";
import { 
  X, Send, User, Mail, Phone, Briefcase, Building, 
  FileText, CheckCircle2, AlertCircle, UploadCloud, Sparkles 
} from "lucide-react";
import type { Job } from "@/types/job";
import { apiRequest } from "@/lib/api-client";
import { ApiError } from "@/lib/api-client";
import { uploadFile, type UploadedFile } from "@/services/file.service";

interface ApplyJobModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (appData: any) => void;
  isAlreadyApplied?: boolean;
  onAlreadyApplied?: (jobId: string) => void;
}

export function ApplyJobModal({
  job,
  isOpen,
  onClose,
  onSuccess,
  isAlreadyApplied = false,
  onAlreadyApplied,
}: ApplyJobModalProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    current_company: "",
    current_position: "",
    years_of_experience: 2,
    cv_url: "",
    cover_letter: "",
    referral_code: "",
    source: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cvFile, setCvFile] = useState<UploadedFile | null>(null);
  const [sources, setSources] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    masterDataService.categories()
      .then((cats) => {
        if (active) setSources(cats.filter((c) => c.category_type === "source" && c.is_active).sort((a, b) => a.sort_order - b.sort_order).map((c) => c.name));
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

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
            phone: u.phone || prev.phone,
            current_position: u.job_title || prev.current_position,
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
      const numericId = Number(job.id);
      if (!Number.isInteger(numericId) || numericId <= 0) {
        throw new Error("Không xác định được tin tuyển dụng. Vui lòng tải lại trang.");
      }

      const payload = {
        job_posting_id: numericId,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        current_company: formData.current_company,
        current_position: formData.current_position,
        years_of_experience: Number(formData.years_of_experience) || 0,
        cv_url: cvFile?.url || undefined,
        cover_letter: formData.cover_letter || undefined,
        referral_code: formData.referral_code || null,
        source: formData.source || undefined,
      };

      const res = await apiRequest("/applications", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      onSuccess(res);
      onClose();
    } catch (err: any) {
      console.warn("Lỗi nộp hồ sơ:", err?.message || err);
      const errMsg = String(err?.message || "");
      const isDuplicate = 
        err?.status === 409 || 
        errMsg.includes("đã nộp hồ sơ") || 
        errMsg.includes("DUPLICATE_APPLICATION");

      if (isDuplicate) {
        setError("Bạn đã nộp hồ sơ cho vị trí này và hồ sơ vẫn đang được xử lý.");
        if (onAlreadyApplied && job) {
          onAlreadyApplied(String(job.id));
        }
      } else {
        setError(errMsg || "Có lỗi xảy ra khi nộp hồ sơ. Vui lòng thử lại!");
      }
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
        <div className="bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50/50 p-6 text-slate-900 border-b border-blue-100 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-500 hover:text-slate-700 border border-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Đăng ký Điều chuyển / Ứng tuyển Nội bộ</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {job.title}
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Phòng ban: <strong className="text-slate-800">{job.department}</strong> | Địa điểm: <strong className="text-slate-800">{job.location}</strong>
          </p>
        </div>

        {isAlreadyApplied ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Bạn đã nộp hồ sơ cho vị trí này</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Hồ sơ ứng tuyển nội bộ của bạn hiện đang được bộ phận Tuyển dụng tiếp nhận và xử lý. Bạn có thể theo dõi tiến độ ở mục &quot;Hồ sơ đã ứng tuyển của tôi&quot;.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20"
            >
              Đã hiểu & Đóng cửa sổ
            </button>
          </div>
        ) : (
        /* Form Body */
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

          {/* Section 3: CV upload (PDF/DOCX ≤ 10MB, validated by the server) */}
          <div className="space-y-2">
            <label className="block font-semibold text-slate-700 mb-1 text-xs">CV (PDF hoặc DOCX, tối đa 10MB)</label>
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                setError(null);
                try {
                  setCvFile(await uploadFile("cv", file));
                } catch (err) {
                  setCvFile(null);
                  setError(err instanceof ApiError ? err.message : "Tải CV thất bại.");
                } finally {
                  setUploading(false);
                }
              }}
              className="block w-full text-xs text-slate-600 file:mr-3 file:px-3 file:py-2 file:rounded-xl file:border-0 file:bg-slate-100 file:font-bold file:text-slate-700"
            />
            {uploading && <div className="text-xs text-slate-500">Đang tải CV lên...</div>}
            {cvFile && (
              <div className="text-xs rounded-xl border border-emerald-200 bg-emerald-50 p-3 space-y-1">
                <div className="font-semibold text-emerald-800">Đã tải lên: {cvFile.original_name}</div>
                {cvFile.parsed?.status === "parsed" && (
                  <div className="text-slate-600 space-y-1">
                    <div>Thông tin bóc tách từ CV (kiểm tra trước khi dùng):
                      {[cvFile.parsed.full_name, cvFile.parsed.email, cvFile.parsed.phone].filter(Boolean).join(" · ")}</div>
                    <button type="button" className="font-bold text-blue-600 cursor-pointer"
                      onClick={() => setFormData({
                        ...formData,
                        full_name: cvFile.parsed?.full_name || formData.full_name,
                        email: cvFile.parsed?.email || formData.email,
                        phone: cvFile.parsed?.phone || formData.phone,
                      })}>Dùng thông tin này</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {sources.length > 0 && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1 text-xs">Bạn biết tin tuyển dụng qua đâu?</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              >
                <option value="">— Chọn nguồn —</option>
                {sources.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
          )}

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
        )}
      </div>
    </div>
  );
}
