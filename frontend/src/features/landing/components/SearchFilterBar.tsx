"use client";

import React, { useState } from "react";
import { Search, ChevronDown, MapPin, Building2, Briefcase } from "lucide-react";

export function SearchFilterBar() {
  const [keyword, setKeyword] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [workType, setWorkType] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Cuộn mượt xuống danh sách việc làm để xem kết quả
    const jobsSection = document.getElementById("jobs");
    if (jobsSection) {
      jobsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <form
      onSubmit={handleSearchSubmit}
      className="bg-white p-3 sm:p-4 lg:p-3.5 rounded-2xl shadow-xl border border-gray-100 flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-0 lg:divide-x divide-gray-100"
    >
      {/* 1. Input text: "Tìm vị trí, kỹ năng, phòng ban..." (kèm icon search) */}
      <div className="flex-1 flex items-center px-4 py-2">
        <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
        <input
          type="text"
          placeholder="Tìm vị trí, kỹ năng, phòng ban..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 font-medium focus:outline-none"
        />
      </div>

      {/* 2. Dropdown Select: "Tất cả phòng ban" */}
      <div className="lg:w-56 flex items-center px-4 py-2 relative">
        <Building2 className="w-4 h-4 text-slate-400 shrink-0 mr-2.5 hidden sm:block" />
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          aria-label="Phòng ban"
          className="w-full bg-transparent text-sm text-slate-700 font-medium focus:outline-none appearance-none pr-6 cursor-pointer"
        >
          <option value="">Tất cả phòng ban</option>
          <option value="it">Khối Công nghệ & Phần mềm</option>
          <option value="product">Khối Quản trị Sản phẩm</option>
          <option value="hr">Phòng Nhân sự & Văn hóa</option>
          <option value="finance">Tài chính - Kế toán</option>
          <option value="marketing">Truyền thông & Marketing</option>
        </select>
        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 pointer-events-none" />
      </div>

      {/* 3. Dropdown Select: "Tất cả địa điểm" */}
      <div className="lg:w-48 flex items-center px-4 py-2 relative">
        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mr-2.5 hidden sm:block" />
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          aria-label="Địa điểm làm việc"
          className="w-full bg-transparent text-sm text-slate-700 font-medium focus:outline-none appearance-none pr-6 cursor-pointer"
        >
          <option value="">Tất cả địa điểm</option>
          <option value="hn">Hà Nội</option>
          <option value="hcm">TP. Hồ Chí Minh</option>
          <option value="dn">Đà Nẵng</option>
          <option value="remote">Làm việc từ xa</option>
        </select>
        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 pointer-events-none" />
      </div>

      {/* 4. Dropdown Select: "Hình thức làm việc" */}
      <div className="lg:w-48 flex items-center px-4 py-2 relative">
        <Briefcase className="w-4 h-4 text-slate-400 shrink-0 mr-2.5 hidden sm:block" />
        <select
          value={workType}
          onChange={(e) => setWorkType(e.target.value)}
          aria-label="Hình thức làm việc"
          className="w-full bg-transparent text-sm text-slate-700 font-medium focus:outline-none appearance-none pr-6 cursor-pointer"
        >
          <option value="">Hình thức làm việc</option>
          <option value="fulltime">Toàn thời gian</option>
          <option value="parttime">Bán thời gian</option>
          <option value="hybrid">Hybrid (Linh hoạt)</option>
        </select>
        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 pointer-events-none" />
      </div>

      {/* 5. Nút Submit: Nút "Tìm" màu xanh dương nổi bật, bo tròn */}
      <div className="p-1 sm:p-1.5 flex items-center shrink-0">
        <button
          type="submit"
          className="w-full lg:w-auto px-8 py-3.5 rounded-full bg-[#4285F4] hover:bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Search className="w-4 h-4" />
          <span>Tìm</span>
        </button>
      </div>
    </form>
  );
}
