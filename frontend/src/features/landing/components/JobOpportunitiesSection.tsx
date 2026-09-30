"use client";

import React, { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { JobCard } from "./JobCard";
import type { JobOpportunity } from "../types/landing.types";

const mockJobs: JobOpportunity[] = [
  {
    id: "job-1",
    title: "Trưởng nhóm Phát triển Phần mềm (Lead Software Engineer)",
    department: "Khối Công nghệ Thông tin",
    location: "Hà Nội",
    employmentType: "Toàn thời gian",
    experience: "5+ năm",
    postedDate: "Đăng 2 ngày trước",
    badges: [
      { label: "ƯU TIÊN NỘI BỘ", variant: "primary" },
      { label: "HOT", variant: "danger" },
    ],
    skills: ["React", "Next.js", "Python", "System Design", "Agile"],
    isBookmarked: true,
  },
  {
    id: "job-2",
    title: "Chuyên viên Senior UX/UI Designer",
    department: "Phát triển Sản phẩm",
    location: "TP. Hồ Chí Minh",
    employmentType: "Hybrid",
    experience: "3+ năm",
    postedDate: "Đăng 1 ngày trước",
    badges: [
      { label: "MỚI", variant: "success" },
      { label: "NỔI BẬT", variant: "warning" },
    ],
    skills: ["Figma", "Design System", "User Research", "Prototyping"],
  },
  {
    id: "job-3",
    title: "Quản lý Dự án Công nghệ (Tech Project Manager)",
    department: "Khối Công nghệ Thông tin",
    location: "Hà Nội",
    employmentType: "Toàn thời gian",
    experience: "4+ năm",
    postedDate: "Đăng 3 ngày trước",
    badges: [{ label: "ƯU TIÊN NỘI BỘ", variant: "primary" }],
    skills: ["Scrum", "Jira", "Risk Management", "Stakeholder Management"],
  },
  {
    id: "job-4",
    title: "Chuyên viên Phân tích Dữ liệu (Data Analyst)",
    department: "Tài chính - Kế toán",
    location: "TP. Hồ Chí Minh",
    employmentType: "Toàn thời gian",
    experience: "2+ năm",
    postedDate: "Đăng 4 ngày trước",
    badges: [{ label: "MỚI", variant: "success" }],
    skills: ["SQL", "Python", "Power BI", "Data Modeling"],
  },
  {
    id: "job-5",
    title: "Chuyên viên Đào tạo & Phát triển Nhân sự (L&D Specialist)",
    department: "Quản trị Nhân sự",
    location: "Hà Nội",
    employmentType: "Toàn thời gian",
    experience: "3+ năm",
    postedDate: "Đăng 5 ngày trước",
    badges: [{ label: "NỔI BẬT", variant: "warning" }],
    skills: ["Training", "Talent Management", "Instructional Design"],
  },
  {
    id: "job-6",
    title: "Chuyên viên Truyền thông Nội bộ (Internal Communications)",
    department: "Truyền thông & Marketing",
    location: "Hà Nội",
    employmentType: "Hybrid",
    experience: "2+ năm",
    postedDate: "Đăng 1 tuần trước",
    badges: [{ label: "ƯU TIÊN NỘI BỘ", variant: "primary" }],
    skills: ["Content Creation", "Event Management", "Copywriting"],
  },
];

export function JobOpportunitiesSection() {
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = [
    { id: "all", label: "Tất cả vị trí (120+)" },
    { id: "it", label: "Công nghệ thông tin" },
    { id: "product", label: "Sản phẩm & Thiết kế" },
    { id: "hr", label: "Nhân sự & L&D" },
    { id: "finance", label: "Tài chính & Dữ liệu" },
  ];

  return (
    <section id="jobs" className="py-20 bg-slate-50/50 border-y border-slate-200/60">
      <Container>
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)] tracking-wider uppercase">
              <Sparkles className="w-4 h-4" />
              CƠ HỘI DÀNH CHO BẠN
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-heading)] tracking-tight">
              Những vị trí đang tuyển dụng nội bộ
            </h2>
            <p className="text-base text-[var(--color-muted)] max-w-xl">
              Khám phá các cơ hội nghề nghiệp hấp dẫn từ nhiều phòng ban khác nhau và tạo nên bước đột phá sự nghiệp của chính bạn.
            </p>
          </div>

          <Button variant="outline" href="/jobs" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Xem tất cả vị trí
          </Button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                activeCategory === cat.id
                  ? "bg-[var(--color-primary)] text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Job Grid: 3 cols desktop, 2 cols tablet, 1 col mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </Container>
    </section>
  );
}
