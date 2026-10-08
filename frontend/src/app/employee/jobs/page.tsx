"use client";

import React, { useState, useEffect } from "react";
import { EmployeeAppShell } from "@/components/layout/EmployeeAppShell";
import { Search, Briefcase, MapPin, Building2, Clock, Star, Gift } from "lucide-react";
import Link from "next/link";

export default function EmployeeJobsPage() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  const [jobs, setJobs] = useState([
    {
      id: 1,
      title: "Chuyên Viên Tuyển Dụng Cao Cấp (HR Specialist)",
      department: "Phòng Nhân sự",
      location: "Hà Nội",
      type: "Toàn thời gian",
      description: "Tham gia xây dựng chiến lược tuyển dụng, tìm kiếm và thu hút nhân tài cho các bộ phận.",
      tags: ["Tuyển dụng", "HR", "Giao tiếp"],
      daysLeft: 5,
    },
    {
      id: 2,
      title: "Senior Backend Engineer",
      department: "Phòng Công nghệ",
      location: "Hà Nội",
      type: "Toàn thời gian",
      description: "Phát triển và tối ưu hệ thống backend, tham gia thiết kế kiến trúc hệ thống quy mô lớn.",
      tags: ["Python", "FastAPI", "Database"],
      daysLeft: 10,
    },
    {
      id: 3,
      title: "Trưởng Nhóm Sản Phẩm",
      department: "Phòng Sản phẩm",
      location: "Hồ Chí Minh",
      type: "Toàn thời gian",
      description: "Dẫn dắt nhóm phát triển sản phẩm, định hướng chiến lược và triển khai các dự án quan trọng.",
      tags: ["Product", "Quản lý", "Agile"],
      daysLeft: 7,
    },
    {
      id: 4,
      title: "Chuyên Viên Marketing Internal",
      department: "Phòng Marketing",
      location: "Hà Nội",
      type: "Toàn thời gian",
      description: "Xây dựng và triển khai các hoạt động truyền thông nội bộ, thu hút nhân tài.",
      tags: ["Truyền thông", "Content", "Sự kiện"],
      daysLeft: 12,
    },
  ]);

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.department.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === "all" || j.department.includes(deptFilter);
    return matchesSearch && matchesDept;
  });

  return (
    <EmployeeAppShell activeTab="jobs">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Briefcase className="w-7 h-7 text-[#4285F4]" />
              Vị Trí Tuyển Dụng Nội Bộ
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Khám phá các cơ hội chuyển đổi vị trí nội bộ hoặc giới thiệu ứng viên phù hợp cho công ty.
            </p>
          </div>

          <Link
            href="/employee/referrals/new"
            className="px-4 py-2.5 rounded-xl bg-[#4285F4] text-white hover:bg-blue-600 text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Gift className="w-4 h-4" />
            <span>Giới thiệu ứng viên ngay</span>
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Tìm kiếm vị trí, từ khóa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#4285F4]"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">Tất cả phòng ban</option>
              <option value="Công nghệ">Phòng Công nghệ</option>
              <option value="Nhân sự">Phòng Nhân sự</option>
              <option value="Sản phẩm">Phòng Sản phẩm</option>
              <option value="Marketing">Phòng Marketing</option>
            </select>
          </div>
        </div>

        {/* Job Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <h3 className="font-extrabold text-sm text-slate-900 leading-tight">{job.title}</h3>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[11px] font-medium text-slate-500">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {job.department}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {job.location}
                  </span>
                </div>

                <p className="text-xs text-slate-500 font-medium leading-relaxed">{job.description}</p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {job.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-lg bg-slate-50 text-slate-600 border border-gray-200 text-[10px] font-bold"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-[11px] font-medium text-amber-600 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Còn {job.daysLeft} ngày
                </span>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/employee/referrals/new?jobId=${job.id}`}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 text-[#4285F4] hover:bg-blue-100 font-bold text-xs transition-all"
                  >
                    Giới thiệu
                  </Link>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="px-3 py-1.5 rounded-xl bg-[#4285F4] text-white hover:bg-blue-600 font-bold text-xs transition-all"
                  >
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </EmployeeAppShell>
  );
}
