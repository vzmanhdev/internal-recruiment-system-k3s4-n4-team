"use client";

import React, { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export function SearchFilterBar() {
  const [keyword, setKeyword] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [workType, setWorkType] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Search action trigger
  };

  return (
    <form
      onSubmit={handleSearchSubmit}
      className="bg-white p-4 sm:p-6 rounded-2xl shadow-[var(--shadow-card)] border border-[var(--color-border)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-center"
    >
      {/* Keyword Input */}
      <div className="lg:col-span-4">
        <Input
          placeholder="Tìm vị trí, kỹ năng, phòng ban..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          leftIcon={<Search className="w-5 h-5 text-slate-400" />}
          className="h-12 border-slate-200"
        />
      </div>

      {/* Department Select */}
      <div className="lg:col-span-3">
        <Select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="h-12 border-slate-200"
          options={[
            { value: "", label: "Tất cả phòng ban" },
            { value: "it", label: "Khối Công nghệ Thông tin" },
            { value: "product", label: "Phát triển Sản phẩm" },
            { value: "hr", label: "Quản trị Nhân sự" },
            { value: "finance", label: "Tài chính - Kế toán" },
            { value: "marketing", label: "Truyền thông & Marketing" },
          ]}
        />
      </div>

      {/* Location Select */}
      <div className="lg:col-span-2">
        <Select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="h-12 border-slate-200"
          options={[
            { value: "", label: "Tất cả địa điểm" },
            { value: "hn", label: "Hà Nội" },
            { value: "hcm", label: "TP. Hồ Chí Minh" },
            { value: "dn", label: "Đà Nẵng" },
            { value: "remote", label: "Làm việc từ xa" },
          ]}
        />
      </div>

      {/* Work Type Select */}
      <div className="lg:col-span-2">
        <Select
          value={workType}
          onChange={(e) => setWorkType(e.target.value)}
          className="h-12 border-slate-200"
          options={[
            { value: "", label: "Hình thức làm việc" },
            { value: "fulltime", label: "Toàn thời gian" },
            { value: "parttime", label: "Bán thời gian" },
            { value: "hybrid", label: "Hybrid" },
          ]}
        />
      </div>

      {/* Submit Button */}
      <div className="lg:col-span-1 flex items-center">
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full h-12"
          leftIcon={<Search className="w-4 h-4" />}
        >
          Tìm
        </Button>
      </div>
    </form>
  );
}
