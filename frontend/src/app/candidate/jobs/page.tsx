'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Search,
  MapPin,
  Building2,
  DollarSign,
  Calendar,
  Clock,
  ChevronRight,
  Filter,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { careerApi, type CandidateJob } from '@/features/candidate/api';
import { useApiData } from '@/hooks/useApiData';
import { ErrorState, LoadingState } from '@/components/ui/DataStates';
import { ApiError } from '@/lib/api-client';

export default function CandidateJobsPage() {
  const { data, error, loading, reload } = useApiData(() => careerApi.list(), []);
  const CANDIDATE_JOBS: CandidateJob[] = useMemo(() => data || [], [data]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');

  // Danh sách các phòng ban duy nhất
  const departments = useMemo(() => {
    const list = Array.from(new Set(CANDIDATE_JOBS.map((j) => j.department)));
    return list;
  }, [CANDIDATE_JOBS]);

  // Danh sách các địa điểm duy nhất
  const locations = useMemo(() => {
    const list = Array.from(new Set(CANDIDATE_JOBS.map((j) => j.location)));
    return list;
  }, [CANDIDATE_JOBS]);

  // Lọc dữ liệu theo từ khóa, phòng ban, địa điểm
  const filteredJobs = useMemo(() => {
    return CANDIDATE_JOBS.filter((job) => {
      const matchSearch =
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchDept =
        selectedDepartment === 'all' || job.department === selectedDepartment;

      const matchLoc =
        selectedLocation === 'all' || job.location === selectedLocation;

      return matchSearch && matchDept && matchLoc;
    });
  }, [CANDIDATE_JOBS, searchTerm, selectedDepartment, selectedLocation]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('all');
    setSelectedLocation('all');
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-8">
      {/* 1. Header có Logo công ty & Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white shadow-xl shadow-blue-500/10 p-6 sm:p-10">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-blue-100 text-xs font-extrabold">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>Tuyển Dụng Nhân Tài 2026</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Gia nhập đội ngũ của chúng tôi
          </h1>

          <p className="text-xs sm:text-base text-blue-100/90 font-medium leading-relaxed max-w-2xl">
            Cùng chúng tôi kiến tạo các giải pháp công nghệ tiên phong, làm việc trong môi trường cởi mở, minh bạch với đãi ngộ xứng đáng và lộ trình thăng tiến rõ ràng.
          </p>

          <div className="pt-1 flex items-center gap-4 text-xs font-semibold text-blue-200">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              Không cần tài khoản khi nộp CV
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              Phản hồi hồ sơ trong 48h
            </span>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -right-16 -bottom-16 w-72 h-72 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute right-32 -top-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
      </div>

      {/* 2. Thanh Tìm kiếm & Lọc (Mobile-first: Xếp dọc trên mobile, ngang trên PC) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Ô tìm kiếm từ khóa */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo chức danh, kỹ năng (Go, React, AI, Product...)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Lọc theo Phòng ban */}
          <div className="w-full md:w-56">
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition-all cursor-pointer appearance-none"
              >
                <option value="all">Tất cả phòng ban</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lọc theo Địa điểm */}
          <div className="w-full md:w-48">
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-500 transition-all cursor-pointer appearance-none"
              >
                <option value="all">Tất cả địa điểm</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nút đặt lại bộ lọc */}
          {(searchTerm || selectedDepartment !== 'all' || selectedLocation !== 'all') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại</span>
            </button>
          )}
        </div>

        {/* Kết quả thống kê */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Tìm thấy <strong className="text-slate-900 font-extrabold">{filteredJobs.length}</strong> vị trí tuyển dụng đang mở
          </span>
          <span className="text-[11px] text-slate-400">
            Cập nhật hàng ngày
          </span>
        </div>
      </div>

      {/* 3. Danh sách việc làm dạng Card */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-800">
              Không tìm thấy vị trí tuyển dụng phù hợp
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Vui lòng thử tìm kiếm bằng từ khóa khác hoặc nới lỏng các tiêu chí phòng ban và địa điểm.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Xem tất cả vị trí đang mở</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between gap-5 group"
            >
              <div className="space-y-3.5">
                {/* Header Card: Badges & Title */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-100">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{job.department}</span>
                    </span>

                    {job.isHot && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-black uppercase tracking-wider">
                        Tuyển Gấp
                      </span>
                    )}
                  </div>

                  <Link href={`/candidate/jobs/${job.id}`}>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug cursor-pointer">
                      {job.title}
                    </h2>
                  </Link>
                </div>

                {/* Thông tin cốt lõi: Mức lương & Địa điểm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Mức lương */}
                  <div className="flex items-center gap-1.5 font-extrabold text-blue-600 bg-blue-50/60 px-3 py-1.5 rounded-lg border border-blue-100/60">
                    <DollarSign className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>{job.salary}</span>
                  </div>

                  {/* Địa điểm */}
                  <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{job.location}</span>
                  </div>
                </div>

                {/* Tags Kỹ năng */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {job.tags.slice(0, 4).map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                  {job.tags.length > 4 && (
                    <span className="px-1.5 py-0.5 text-[10px] text-slate-400 font-bold">
                      +{job.tags.length - 4}
                    </span>
                  )}
                </div>
              </div>

              {/* Footer Card: Hạn nộp & Nút Xem chi tiết */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Hạn nộp: <strong className="text-slate-700">{job.deadline}</strong></span>
                </div>

                <Link
                  href={`/candidate/jobs/${job.id}`}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs inline-flex items-center gap-1.5 transition-all shadow-sm shadow-blue-500/20 active:scale-95 cursor-pointer"
                >
                  <span>Xem chi tiết</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
