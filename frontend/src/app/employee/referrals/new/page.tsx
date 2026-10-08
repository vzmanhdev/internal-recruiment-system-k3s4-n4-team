"use client";

import React, { useState } from "react";
import { EmployeeAppShell } from "@/components/layout/EmployeeAppShell";
import { UserPlus, Upload, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewReferralPage() {
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [candidatePhone, setCandidatePhone] = useState("");
  const [selectedJob, setSelectedJob] = useState("");
  const [relationship, setRelationship] = useState("Đồng nghiệp cũ");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMsg(true);
    }, 1000);
  };

  return (
    <EmployeeAppShell activeTab="referral-new">
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/employee/referrals"
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <UserPlus className="w-7 h-7 text-[#4285F4]" />
              Giới Thiệu Ứng Viên Nội Bộ
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Điền thông tin và tải lên CV ứng viên để gửi tới bộ phận Tuyển dụng HR rà soát.
            </p>
          </div>
        </div>

        {successMsg ? (
          <div className="bg-white rounded-3xl p-8 border border-emerald-200 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-slate-900">Gửi Giới Thiệu Thành Công!</h3>
            <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
              Hồ sơ ứng viên <strong>{candidateName}</strong> đã được chuyển tới bộ phận HR. Bạn có thể theo dõi tiến trình trong mục <strong>Giới thiệu của tôi</strong>.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Link
                href="/employee/referrals"
                className="px-4 py-2 rounded-xl bg-[#4285F4] text-white text-xs font-bold shadow-md shadow-blue-500/20"
              >
                Xem danh sách giới thiệu
              </Link>
              <button
                onClick={() => {
                  setSuccessMsg(false);
                  setCandidateName("");
                  setCandidateEmail("");
                  setCandidatePhone("");
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
              >
                Giới thiệu thêm ứng viên
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs">
            <form onSubmit={handleSubmit} className="space-y-5 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Họ và tên ứng viên *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Thị Mai"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#4285F4]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Email ứng viên *</label>
                  <input
                    type="email"
                    placeholder="mai.nguyen@example.com"
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#4285F4]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Số điện thoại *</label>
                  <input
                    type="tel"
                    placeholder="0912 345 678"
                    value={candidatePhone}
                    onChange={(e) => setCandidatePhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#4285F4]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Vị trí tuyển dụng ứng tuyển *</label>
                <select
                  value={selectedJob}
                  onChange={(e) => setSelectedJob(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#4285F4]"
                  required
                >
                  <option value="">-- Chọn vị trí tuyển dụng --</option>
                  <option value="1">Chuyên Viên Tuyển Dụng Cao Cấp (HR Specialist)</option>
                  <option value="2">Senior Backend Engineer</option>
                  <option value="3">Trưởng Nhóm Sản Phẩm</option>
                  <option value="4">Chuyên Viên Marketing Internal</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Mối quan hệ với ứng viên</label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#4285F4]"
                >
                  <option value="Đồng nghiệp cũ">Đồng nghiệp cũ</option>
                  <option value="Bạn học / Bạn bè">Bạn học / Bạn bè</option>
                  <option value="Cấp dưới cũ">Cấp dưới cũ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Tải lên file CV (PDF / DOCX)</label>
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center space-y-2 hover:border-blue-300 transition-colors">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="text-slate-600 font-medium">
                    Kéo thả file CV vào đây hoặc <span className="text-[#4285F4] font-bold">chọn file từ máy</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Hỗ trợ định dạng .pdf, .docx (tối đa 10MB)</p>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Nhận xét & Đánh giá năng lực</label>
                <textarea
                  rows={3}
                  placeholder="Nhập vài lời nhận xét về thế mạnh, kinh nghiệm nổi bật của ứng viên..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#4285F4]"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <Link
                  href="/employee/referrals"
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Hủy
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#4285F4] text-white hover:bg-blue-600 font-bold shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? "Đang gửi..." : "Gửi hồ sơ giới thiệu"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </EmployeeAppShell>
  );
}
