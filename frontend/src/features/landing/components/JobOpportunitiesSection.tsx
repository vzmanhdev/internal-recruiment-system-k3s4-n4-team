"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { JobCard } from "./JobCard";
import type { JobOpportunity } from "../types/landing.types";
import { fetchPublicJobs, JobPostingItem } from "@/features/jobs/services/job-posting.service";

function mapPostingToOpportunity(job: JobPostingItem): JobOpportunity {
  return {
    id: String(job.id),
    title: job.title,
    department: job.department_name || "Tuyển dụng nội bộ",
    location: job.work_location || "Trụ sở chính",
    employmentType: job.employment_type === "full_time" ? "Toàn thời gian" : job.employment_type === "part_time" ? "Bán thời gian" : "Hợp đồng",
    experience: "N/A",
    postedDate: job.created_at ? `Đăng ngày ${new Date(job.created_at).toLocaleDateString("vi-VN")}` : "Mới đăng",
    badges: [{ label: "ƯU TIÊN NỘI BỘ", variant: "primary" }],
    skills: job.requirements ? job.requirements.split(",").map((s) => s.trim()).filter(Boolean) : ["Toàn thời gian"],
  };
}

export function JobOpportunitiesSection() {
  const [jobs, setJobs] = useState<JobOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetchPublicJobs({ page_size: 6 });
        setJobs(res.items.map(mapPostingToOpportunity));
      } catch (err) {
        console.error("Failed to load landing page jobs:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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

        {/* Job Grid: 3 cols desktop, 2 cols tablet, 1 col mobile */}
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">Đang tải vị trí tuyển dụng từ hệ thống...</div>
        ) : jobs.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500 italic bg-white rounded-2xl border border-slate-200">
            Hiện chưa có vị trí tuyển dụng nào được đăng trên cơ sở dữ liệu.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}

