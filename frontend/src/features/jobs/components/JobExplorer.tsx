"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icons";
import { jobs as fallbackJobs } from "../data/jobs";
import { JobCard } from "./JobCard";
import { recruiterService } from "@/features/recruiter/services/recruiter.service";
import type { Job, JobStatus } from "@/types/job";
import type { RecruiterJob } from "@/features/recruiter/types/recruiter.types";

function parseStringOrArray(val: unknown): string[] {
  if (Array.isArray(val)) {
    return val.map((x) => String(x).trim()).filter(Boolean);
  }
  if (typeof val === "string") {
    return val.split("\n").map((x) => x.trim()).filter(Boolean);
  }
  return [];
}

function mapRecruiterJobToJob(rj: RecruiterJob): Job {
  const reqs = parseStringOrArray(rj.requirements);
  const bens = parseStringOrArray(rj.benefits);

  return {
    id: String(rj.id),
    title: rj.title,
    department: rj.department,
    location: rj.location,
    employmentType: rj.employment_type || "Toàn thời gian",
    openings: `${rj.openings} vị trí`,
    status: (rj.status as JobStatus) || "open",
    description: rj.description,
    skills: reqs.slice(0, 3).map((r: string) => r.replace(/^[-•*]\s*/, "")),
    deadline: rj.deadline,
    responsibilities: bens,
    requirements: reqs,
  };
}

export function JobExplorer() {
  const [jobList, setJobList] = useState<Job[]>(fallbackJobs);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function fetchJobs() {
      try {
        setLoading(true);
        const res = await recruiterService.getPublicJobs();
        if (isMounted && res?.items && res.items.length > 0) {
          const liveJobs = res.items.map(mapRecruiterJobToJob);
          setJobList(liveJobs);
        }
      } catch (err) {
        console.warn("Could not fetch live jobs, using fallback dataset:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchJobs();
    return () => {
      isMounted = false;
    };
  }, []);

  const departments = useMemo(() => {
    return Array.from(new Set(jobList.map((job) => job.department))).filter(Boolean);
  }, [jobList]);

  const locations = useMemo(() => {
    return Array.from(new Set(jobList.map((job) => job.location))).filter(Boolean);
  }, [jobList]);

  const filtered = useMemo(() => {
    return jobList.filter((job) => {
      const skillsStr = job.skills.join(" ");
      const textToSearch = `${job.title} ${job.description} ${skillsStr}`.toLowerCase();
      const matchesSearch = !search || textToSearch.includes(search.toLowerCase());
      const matchesDepartment = !department || job.department === department;
      const matchesLocation = !location || job.location === location;
      return matchesSearch && matchesDepartment && matchesLocation;
    });
  }, [jobList, search, department, location]);

  return (
    <>
      <div className="filters">
        <label>
          <span className="sr-only">Tìm kiếm vị trí</span>
          <span className="input-wrap">
            <Icon name="search" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo tên hoặc kỹ năng..."
            />
          </span>
        </label>
        <label>
          <span className="sr-only">Lọc phòng ban</span>
          <select value={department} onChange={(event) => setDepartment(event.target.value)}>
            <option value="">Tất cả phòng ban</option>
            {departments.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Lọc địa điểm</span>
          <select value={location} onChange={(event) => setLocation(event.target.value)}>
            <option value="">Tất cả địa điểm</option>
            {locations.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && jobList.length === 0 ? (
        <div className="state-card" style={{ padding: "40px 20px", textAlign: "center" }}>
          <p style={{ color: "var(--color-text-secondary)" }}>Đang tải danh sách bài đăng tuyển dụng...</p>
        </div>
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
