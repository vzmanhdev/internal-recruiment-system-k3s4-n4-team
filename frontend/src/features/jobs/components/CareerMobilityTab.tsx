"use client";

import React from "react";
import { 
  Sparkles, Target, Award, ArrowUpRight, CheckCircle2, 
  BookOpen, Compass, ShieldCheck, ChevronRight, Zap 
} from "lucide-react";

interface CareerMobilityTabProps {
  onSelectJob?: (jobId: string) => void;
}

export function CareerMobilityTab({ onSelectJob }: CareerMobilityTabProps) {
  const careerPaths = [
    {
      currentRole: "Chuyên viên Khối Công Nghệ",
      targetRole: "Senior Python Backend Engineer",
      matchScore: 88,
      readiness: "Sẵn sàng ứng tuyển nội bộ",
      skillsMatched: ["Python", "FastAPI", "SQLAlchemy", "Git", "REST API"],
      skillsToDevelop: ["Docker & Kubernetes", "Microservices Architecture"],
      recommendedAction: "Ứng tuyển ngay - Đáp ứng 88% khung năng lực",
      jobId: "1"
    },
    {
      currentRole: "Chuyên viên Tuyển Dụng",
      targetRole: "Chuyên Viên Tuyển Dụng Cao Cấp (HR Specialist)",
      matchScore: 92,
      readiness: "Phù hợp vượt trội",
      skillsMatched: ["Sàng lọc CV", "Tạo Offer", "Phỏng vấn BEI", "Sử dụng ATS"],
      skillsToDevelop: ["Xây dựng thương hiệu tuyển dụng (Employer Branding)"],
      recommendedAction: "Ưu tiên xét tuyển tăng bậc dải lương",
      jobId: "2"
    }
  ];

  return (
    <div className="space-y-6">
      {/* AI Mobility Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>AI Career Mobility Assistant</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Lộ Trình Phát Triển & Gợi Ý Vị Trí Nội Bộ P-Fit
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            Hệ thống phân tích Khung năng lực cá nhân và tự động đối chiếu với các Vị trí Tuyển dụng Nội bộ đang mở để gợi ý hướng chuyển đổi sự nghiệp tối ưu nhất cho bạn.
          </p>
        </div>
      </div>

      {/* Grid of Career Mobility Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {careerPaths.map((path, idx) => (
          <div 
            key={idx} 
            className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5"
          >
            <div className="space-y-4">
              {/* Header Match Score */}
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  {path.readiness}
                </span>
                <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200 text-xs font-extrabold">
                  <span>Khớp {path.matchScore}%</span>
                </div>
              </div>

              {/* Target Role Title */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Vị trí mục tiêu phù hợp
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 leading-snug">
                  {path.targetRole}
                </h3>
              </div>

              {/* Skills Matched */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">Kỹ năng bạn đã làm chủ:</span>
                <div className="flex flex-wrap gap-1.5">
                  {path.skillsMatched.map((skill, sIdx) => (
                    <span key={sIdx} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200/60 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Skills to Develop */}
              {path.skillsToDevelop.length > 0 && (
                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-2">Kỹ năng bổ trợ đề xuất:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {path.skillsToDevelop.map((skill, dIdx) => (
                      <span key={dIdx} className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200/60 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-amber-600" />
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Call */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Gợi ý từ HR Mobility:</span>
              <button
                onClick={() => onSelectJob && onSelectJob(path.jobId)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>Xem chi tiết vị trí</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
