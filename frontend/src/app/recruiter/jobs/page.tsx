'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FileText, Plus, Search, Filter, CheckCircle2, Clock, MapPin, Users, ChevronRight, Briefcase } from 'lucide-react';

export default function RecruiterJobsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const jobs = [
    {
      id: 'JOB-2026-01',
      title: 'Senior Backend Engineer (Go/Python)',
      department: 'Khối Công Nghệ & Phần Mềm',
      location: 'Hà Nội (Hybrid)',
      headcount: '3 vị trí',
      applicants: 14,
      status: 'Đang mở',
      postedDate: '01/10/2026',
      salary: '35 - 55 Triệu VNĐ',
    },
    {
      id: 'JOB-2026-02',
      title: 'Frontend React Lead',
      department: 'Khối Công Nghệ & Phần Mềm',
      location: 'Hà Nội',
      headcount: '1 vị trí',
      applicants: 8,
      status: 'Đang mở',
      postedDate: '02/10/2026',
      salary: '40 - 60 Triệu VNĐ',
    },
    {
      id: 'JOB-2026-03',
      title: 'Product Owner / BA Lead',
      department: 'Phòng Phát Triển Sản Phẩm',
      location: 'Hà Nội',
      headcount: '2 vị trí',
      applicants: 11,
      status: 'Đang mở',
      postedDate: '28/09/2026',
      salary: '30 - 45 Triệu VNĐ',
    },
    {
      id: 'JOB-2026-04',
      title: 'DevOps / Cloud Engineer',
      department: 'Khối Vận Hành & Hạ Tầng',
      location: 'Hà Nội (Hybrid)',
      headcount: '2 vị trí',
      applicants: 6,
      status: 'Đang mở',
      postedDate: '03/10/2026',
      salary: '30 - 50 Triệu VNĐ',
    },
    {
      id: 'JOB-2026-05',
      title: 'UI/UX Designer Senior',
      department: 'Phòng Phát Triển Sản Phẩm',
      location: 'Hà Nội',
      headcount: '1 vị trí',
      applicants: 9,
      status: 'Đang mở',
      postedDate: '05/10/2026',
      salary: '25 - 38 Triệu VNĐ',
    },
    {
      id: 'JOB-2026-06',
      title: 'Data Analyst / BI Specialist',
      department: 'Khối Dữ Liệu & Phân Tích',
      location: 'Hà Nội',
      headcount: '1 vị trí',
      applicants: 5,
      status: 'Đang tạm đóng',
      postedDate: '20/09/2026',
      salary: '22 - 35 Triệu VNĐ',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-blue-600" />
            <span>Tin Tuyển Dụng Phụ Trách</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Soạn thảo, xuất bản và giám sát số lượng hồ sơ nộp vào từng tin tuyển dụng.
          </p>
        </div>

        <button className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>+ Soạn Tin Tuyển Dụng Mới</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm vị trí..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {jobs.map((job) => (
            <div key={job.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 -mx-3 px-3 rounded-xl transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900">{job.title}</span>
                  <span className="text-[10px] font-mono text-slate-400">({job.id})</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${job.status === 'Đang mở' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                    {job.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{job.department}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                  <span className="font-bold text-blue-600">Đãi ngộ: {job.salary}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 self-end md:self-auto">
                <div className="text-right">
                  <div className="font-black text-sm text-slate-900">{job.applicants} CV</div>
                  <div className="text-[10px] text-slate-400">Chỉ tiêu: {job.headcount}</div>
                </div>
                <Link
                  href="/recruiter/pipeline"
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1"
                >
                  <span>Mở Pipeline</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
