"use client";

import React, { useState } from "react";
import { MapPin, Briefcase, Clock, Bookmark, ArrowRight, Building2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { JobOpportunity } from "../types/landing.types";

export interface JobCardProps {
  job: JobOpportunity;
}

export function JobCard({ job }: JobCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(job.isBookmarked || false);

  return (
    <Card variant="interactive" className="flex flex-col justify-between h-full p-6 relative group border-slate-200/80">
      <div>
        {/* Header: Badges & Bookmark */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex flex-wrap gap-1.5">
            {job.badges.map((badge, idx) => (
              <Badge key={idx} variant={badge.variant}>
                {badge.label}
              </Badge>
            ))}
          </div>

          <button
            type="button"
            aria-label="Lưu tin tuyển dụng"
            onClick={(e) => {
              e.preventDefault();
              setIsBookmarked(!isBookmarked);
            }}
            className={`p-2 rounded-lg transition-colors ${
              isBookmarked
                ? "text-[var(--color-primary)] bg-blue-50"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* Job Title & Department */}
        <h3 className="text-xl font-bold text-[var(--color-heading)] group-hover:text-[var(--color-primary)] transition-colors mb-2 line-clamp-2">
          {job.title}
        </h3>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-4">
          <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
          <span>{job.department}</span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-y-2.5 gap-x-2 text-xs text-slate-600 mb-5 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{job.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{job.employmentType}</span>
          </div>
          <div className="flex items-center gap-1.5 col-span-2">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Kinh nghiệm: {job.experience}</span>
          </div>
        </div>

        {/* Skill Tags */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {job.skills.map((skill) => (
            <span
              key={skill}
              className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">{job.postedDate}</span>
        <Button
          variant="ghost"
          size="sm"
          href={`/jobs/${job.id}`}
          rightIcon={<ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />}
          className="text-[var(--color-primary)] font-semibold p-0 hover:bg-transparent"
        >
          Xem chi tiết
        </Button>
      </div>
    </Card>
  );
}
