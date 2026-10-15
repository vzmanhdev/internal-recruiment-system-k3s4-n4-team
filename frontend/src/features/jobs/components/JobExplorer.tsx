"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icons";
import { JobCard } from "./JobCard";
import { fetchPublicJobs, JobPostingItem } from "../services/job-posting.service";
import type { Job } from "@/types/job";

function mapBackendJobToUi(job: JobPostingItem): Job {
  return {
    id: String(job.id),
    title: job.title,
    department: job.department_name || "Tuyển dụng nội bộ",
    location: job.work_location || "Trụ sở chính",
    employmentType: job.employment_type === "full_time" ? "Toàn thời gian" : job.employment_type === "part_time" ? "Bán thời gian" : "Hợp đồng",
    openings: `${job.quantity} người`,
    status: "open",
    description: job.job_description || "Không có mô tả chi tiết",
    skills: job.requirements ? job.requirements.split(",").map((s) => s.trim()).filter(Boolean) : ["Toàn thời gian"],
    deadline: job.deadline ? new Date(job.deadline).toLocaleDateString("vi-VN") : "Không giới hạn",
    responsibilities: job.job_description ? [job.job_description] : [],
    requirements: job.requirements ? [job.requirements] : [],
  };
}

export function JobExplorer() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [backendJobs, setBackendJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJobs() {
      setLoading(true);
      try {
        const res = await fetchPublicJobs({ search, work_location: location });
        const mapped = res.items.map(mapBackendJobToUi);
        setBackendJobs(mapped);
      } catch (err) {
        console.error("Failed to fetch public jobs from backend:", err);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, [search, location]);

  const displayJobs = backendJobs;

  const filtered = displayJobs.filter((job) => {
    const matchesSearch = `${job.title} ${job.description} ${job.skills.join(" ")}`.toLowerCase().includes(search.toLowerCase());
    const matchesDept = !department || job.department === department;
    const matchesLoc = !location || job.location.toLowerCase().includes(location.toLowerCase());
    return matchesSearch && matchesDept && matchesLoc;
  });

  const availableDepts = Array.from(new Set(displayJobs.map((job) => job.department)));
  const availableLocs = Array.from(new Set(displayJobs.map((job) => job.location)));


  return (
    <>
      <div className="filters">
        <label>
          <span className="sr-only">Tìm kiếm vị trí</span>
          <span className="input-wrap">
            <Icon name="search" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên vị trí hoặc từ khóa..." />
          </span>
        </label>
        <label>
          <span className="sr-only">Lọc phòng ban</span>
          <select value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">Tất cả phòng ban</option>
            {availableDepts.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Lọc địa điểm</span>
          <select value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="">Tất cả địa điểm</option>
            {availableLocs.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-slate-500">Đang tải danh sách việc làm...</div>
      ) : filtered.length ? (
        <div className="job-grid">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className="state-card">
          <Icon name="search" />
          <h2>Chưa tìm thấy vị trí phù hợp</h2>
          <p>Hãy thử từ khóa hoặc bộ lọc khác.</p>
        </div>
      )}
    </>
  );
}
