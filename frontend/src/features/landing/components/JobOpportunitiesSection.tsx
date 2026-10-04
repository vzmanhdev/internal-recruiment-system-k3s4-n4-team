"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { JobCard } from "./JobCard";
import { jobService, JobPostingItem } from "@/services/job.service";
import type { JobOpportunity } from "../types/landing.types";

export function JobOpportunitiesSection() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [jobs, setJobs] = useState<JobOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    jobService
      .getJobs()
      .then((data) => {
        if (isMounted) {
          const mapped: JobOpportunity[] = data.map((j) => ({
            id: j.slug || String(j.id),
            title: j.title,
            department: j.department_name || j.department || "Khối Công Nghệ",
            location: j.location || "Hà Nội",
            employmentType: j.type || "Toàn thời gian",
            experience: j.experience_level || "1-3 năm",
            postedDate: "Tuyển dụng mới",
            badges: [
              { label: "ƯU TIÊN NỘI BỘ", variant: "primary" },
              { label: "HOT", variant: "danger" },
            ],
            skills: j.requirements ? j.requirements.split(",").map((s) => s.trim()) : ["Tuyển dụng nội bộ"],
            isBookmarked: false,
          }));
          setJobs(mapped);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load landing jobs:", err);
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = [
    { id: "all", label: `Tất cả vị trí (${jobs.length})` },
    { id: "it", label: "Công nghệ thông tin" },
    { id: "product", label: "Sản phẩm & Thiết kế" },
    { id: "hr", label: "Nhân sự & L&D" },
    { id: "finance", label: "Tài chính & Dữ liệu" },
  ];

  const filteredJobs = jobs.filter((job) => {
    if (activeCategory === "all") return true;
    if (activeCategory === "it") return job.department.toLowerCase().includes("công nghệ") || job.department.toLowerCase().includes("it");
    if (activeCategory === "product") return job.department.toLowerCase().includes("sản phẩm");
    if (activeCategory === "hr") return job.department.toLowerCase().includes("nhân sự");
    if (activeCategory === "finance") return job.department.toLowerCase().includes("tài chính") || job.department.toLowerCase().includes("dữ liệu");
    return true;
  });

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

        {/* Job Grid */}
        {loading ? (
          <div className="text-center py-12 text-slate-500 font-medium">Đang tải danh sách vị trí từ máy chủ...</div>
        ) : filteredJobs.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 font-medium">Chưa có vị trí tuyển dụng trong danh mục này.</div>
        )}
      </Container>
    </section>
  );
}
