'use client';

import React, { useState } from 'react';
import { 
  Layers, Plus, Tag, MapPin, Share2, HelpCircle, CheckCircle2, Search
} from 'lucide-react';

interface LookupCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  items_count: number;
  sample_items: string[];
}

export default function HRLookupsPage() {
  const [categories, setCategories] = useState<LookupCategory[]>([
    {
      id: "CAT-01",
      name: "Danh Mục Kỹ Năng (Skill Tags)",
      code: "SKILLS",
      description: "Các kỹ năng chuyên môn chuẩn phục vụ tìm kiếm & lọc hồ sơ",
      items_count: 42,
      sample_items: ["Python", "FastAPI", "React.js", "Docker", "K8s", "SQL"]
    },
    {
      id: "CAT-02",
      name: "Nguồn Tuyển Dụng (Candidate Sources)",
      code: "SOURCES",
      description: "Các kênh thu hút hồ sơ ứng viên",
      items_count: 8,
      sample_items: ["Website Công Khai", "Giới Thiệu Nội Bộ", "LinkedIn", "TopCV", "Headhunter"]
    },
    {
      id: "CAT-03",
      name: "Lý Do Từ Chối / Đóng Tuyển Dụng",
      code: "REASONS",
      description: "Lý do trượt ứng viên hoặc dừng tờ trình",
      items_count: 12,
      sample_items: ["Không Đạt Chuyên Môn", "Kỳ Vọng Lương Vượt Band", "Từ Chối Offer", "Đã Tuyển Đủ"]
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Danh Mục Dùng Chung (System Lookups)</h1>
            <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">
              Master Lookups
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Quản lý thẻ kỹ năng, nguồn ứng viên, danh mục địa điểm & lý do từ chối dùng chung toàn hệ thống</p>
        </div>

        <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer">
          <Plus className="w-4 h-4" />
          <span>Thêm Danh Mục Mới</span>
        </button>
      </div>

      {/* Main List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3 hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono bg-slate-100 text-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded">{cat.code}</span>
                <h2 className="text-sm font-bold text-slate-900 mt-1">{cat.name}</h2>
              </div>
              <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                {cat.items_count} mục
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">{cat.description}</p>

            <div className="pt-2 border-t border-slate-100">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Mẫu Giá Trị</div>
              <div className="flex flex-wrap gap-1.5">
                {cat.sample_items.map((item, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
