"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icons";
import { JobCard } from "./JobCard";
import { jobService, JobPostingItem } from "@/services/job.service";
import type { Job } from "@/types/job";
import { toJob } from "@/features/jobs/mapPosting";

export function JobExplorer() {
  const [dbJobs, setDbJobs] = useState<JobPostingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    let isMounted = true;
    jobService
      .getJobs()
      .then((data) => {
        if (isMounted) {
          setDbJobs(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load jobs:", err);
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const formattedJobs: Job[] = useMemo(() => {
    return dbJobs.map(toJob);
  }, [dbJobs]);

  const filtered = useMemo(() => {
    return formattedJobs.filter(
      (job) =>
        `${job.title} ${job.description} ${job.skills.join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (!department || job.department === department) &&
        (!location || job.location === location)
    );
  }, [formattedJobs, search, department, location]);

  const departments = useMemo(() => {
    return Array.from(new Set(formattedJobs.map((j) => j.department)));
  }, [formattedJobs]);

  const locations = useMemo(() => {
    return Array.from(new Set(formattedJobs.map((j) => j.location)));
  }, [formattedJobs]);

  if (loading) {
    return (
      <div className="state-card">
        <Icon name="search" />
        <h2>Đang tải danh sách việc làm từ hệ thống...</h2>
      </div>
    );
  }

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
              placeholder="Tìm theo tên hoặc kỹ năng"
            />
          </span>
        </label>
        <label>
          <span className="sr-only">Lọc phòng ban</span>
          <select value={department} onChange={(event) => setDepartment(event.target.value)}>
            <option value="">Tất cả phòng ban</option>
            {departments.map((val) => (
              <option key={val}>{val}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Lọc địa điểm</span>
          <select value={location} onChange={(event) => setLocation(event.target.value)}>
            <option value="">Tất cả địa điểm</option>
            {locations.map((val) => (
              <option key={val}>{val}</option>
            ))}
          </select>
        </label>
      </div>
      {filtered.length ? (
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
