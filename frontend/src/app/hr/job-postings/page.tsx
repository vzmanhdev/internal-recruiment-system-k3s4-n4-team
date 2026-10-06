'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Briefcase, Eye, CheckCircle2, Globe, MapPin, DollarSign, Calendar, 
  Building2, ArrowUpRight, Search, Filter, ShieldCheck
} from 'lucide-react';

interface JobPostingItem {
  id: string;
  code: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salary_range: string;
  status: 'draft' | 'pending_review' | 'published' | 'closed';
  description: string;
  requirements: string[];
  benefits: string[];
  created_at: string;
}

export default function HRJobPostingsPage() {
  const [jobs, setJobs] = useState<JobPostingItem[]>([
    {
      id: "JOB-001",
      code: "JOB-2026-001",
      title: "Senior Backend Engineer (Python / FastAPI / PostgreSQL)",
      department: "Công Nghệ Thông Tin",
      location: "Hà Nội (Hybrid)",
      type: "Full-time",
      salary_range: "35 - 50 Triệu VNĐ",
      status: "pending_review",
      description: "Chúng tôi tìm kiếm Senior Backend Engineer có kinh nghiệm thiết kế hệ thống Microservices, tối ưu CSDL PostgreSQL và làm việc với Docker/K8s.",
      requirements: [
        "Tối thiểu 4+ năm kinh nghiệm Python/FastAPI hoặc Django",
        "Thành thạo PostgreSQL, Redis, RabbitMQ/Kafka",
        "Có tư duy thiết kế Clean Architecture và SOLID"
      ],
      benefits: [
        "Lương thưởng tháng 13 + thưởng hiệu quả dự án",
        "Bảo hiểm sức khỏe cao cấp Healthcare PVI",
        "Trang bị Macbook Pro M-series mới nhất"
      ],
      created_at: "02/10/2026"
    },
    {
      id: "JOB-002",
      code: "JOB-2026-002",
      title: "Trưởng nhóm Data Analyst & BI Specialist",
      department: "Khối Dữ Liệu",
      location: "Hồ Chí Minh",
      type: "Full-time",
      salary_range: "45 - 55 Triệu VNĐ",
      status: "published",
      description: "Xây dựng dashboard báo cáo BI toàn công ty, phân tích xu hướng tuyển dụng và tối ưu phễu chuyển đổi dữ liệu.",
      requirements: [
        "5+ năm kinh nghiệm trong lĩnh vực Data Analysis / Power BI / Tableau",
        "Thành thạo SQL nâng cao, Python data stack (Pandas, Numpy)",
        "Kỹ năng thuyết trình và làm việc với Executive Management"
      ],
      benefits: [
        "Chế độ đãi ngộ cạnh tranh top đầu thị trường",
        "Du lịch nghỉ dưỡng 5 sao hàng năm"
      ],
      created_at: "28/09/2026"
    }
  ]);

  const [previewJob, setPreviewJob] = useState<JobPostingItem | null>(null);

  const handlePublish = (jobId: string) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'published' } : j));
    alert("Đã duyệt & xuất bản tin tuyển dụng lên Cổng Sự Nghiệp Công Khai!");
    setPreviewJob(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Thẩm Định & Xem Trước Tin Tuyển Dụng</h1>
            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-200">
              [S3-10] Candidate Preview
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Duyệt tin tuyển dụng do Recruiter tạo và xem trước (Preview) giao diện Public Career trước khi bấm Xuất bản</p>
        </div>
      </div>

      {/* Main List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4 hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">{job.code}</span>
                <h2 className="text-base font-bold text-slate-900 mt-1">{job.title}</h2>
                <div className="text-xs text-slate-500 mt-0.5">{job.department}</div>
              </div>

              {job.status === 'pending_review' ? (
                <span className="bg-amber-50 text-amber-700 font-extrabold text-[10px] px-2.5 py-1 rounded-full border border-amber-200">
                  Chờ Duyệt Tin
                </span>
              ) : (
                <span className="bg-emerald-50 text-emerald-700 font-extrabold text-[10px] px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  <span>Đã Xuất Bản</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{job.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-bold text-slate-900">{job.salary_range}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button 
                onClick={() => setPreviewJob(job)}
                className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Xem Trước (Preview)</span>
              </button>

              {job.status === 'pending_review' && (
                <button 
                  onClick={() => handlePublish(job.id)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Duyệt & Xuất Bản</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Candidate Public Layout Preview Modal [S3-10] */}
      {previewJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full p-8 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Public Candidate Site Preview Mode [S3-10]
                </span>
              </div>
              <button onClick={() => setPreviewJob(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕ Đóng</button>
            </div>

            {/* Public Card Design */}
            <div className="space-y-5 bg-[#fafbfc] p-6 rounded-2xl border border-slate-200/80">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{previewJob.department}</span>
                <h1 className="text-2xl font-black text-slate-900 mt-1">{previewJob.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-3">
                  <span className="bg-white border border-slate-200 px-3 py-1 rounded-lg font-semibold">{previewJob.location}</span>
                  <span className="bg-white border border-slate-200 px-3 py-1 rounded-lg font-semibold">{previewJob.type}</span>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-lg font-bold">{previewJob.salary_range}</span>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">Mô tả công việc</h3>
                  <p>{previewJob.description}</p>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">Yêu cầu ứng viên</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {previewJob.requirements.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">Quyền lợi được hưởng</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {previewJob.benefits.map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-400">Nút ứng tuyển giao diện ứng viên:</span>
                <button className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 cursor-not-allowed opacity-90">
                  Nộp Hồ Sơ Ứng Tuyển Ngay
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setPreviewJob(null)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold">Chỉnh Sửa Thêm</button>
              {previewJob.status === 'pending_review' && (
                <button onClick={() => handlePublish(previewJob.id)} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20">Duyệt & Xuất Bản Lên Career Site</button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
