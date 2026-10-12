'use client';

import React from 'react';
import { Target, CheckCircle2, Award, Layers } from 'lucide-react';

export default function CompetencyFrameworksPage() {
  const frameworks = [
    {
      id: 1,
      title: 'Khung Năng Lực Khối Kỹ Thuật (Engineering Framework)',
      levels: ['Junior', 'Middle', 'Senior', 'Staff / Lead', 'Principal'],
      criteria: [
        'Kỹ năng lập trình & Clean Code',
        'Kiến trúc giải pháp & System Design',
        'CI/CD, DevOps & Tối ưu hiệu năng',
        'Mentorship & Dẫn dắt kỹ thuật',
      ],
    },
    {
      id: 2,
      title: 'Khung Năng Lực Khối Dữ Liệu & Phân Tích (Data Analytics)',
      levels: ['Data Analyst', 'Senior DA', 'Lead Data Specialist'],
      criteria: [
        'Truy vấn SQL nâng cao & Data Modeling',
        'Tư duy phân tích số liệu kinh doanh',
        'Trực quan hóa dữ liệu (Dashboard / BI)',
        'Thống kê ứng dụng & Machine Learning cơ bản',
      ],
    },
    {
      id: 3,
      title: 'Khung Năng Lực Lãnh Đạo & Quản Lý (Leadership)',
      levels: ['Team Lead', 'Engineering Manager', 'Head of Department'],
      criteria: [
        'Quản trị mục tiêu OKR / KPI',
        'Kỹ năng phản hồi 360 & Động viên đội ngũ',
        'Tư duy chiến lược và quản lý ngân sách',
        'Giải quyết xung đột & Văn hóa tổ chức',
      ],
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Khung Năng Lực Chuẩn (Competency Framework)</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Bộ tiêu chí đánh giá chuẩn hóa cấp tập đoàn áp dụng trong các vòng phỏng vấn chuyên môn
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {frameworks.map((f) => (
          <div key={f.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-slate-900">{f.title}</h2>
              <div className="flex flex-wrap gap-1 pt-1">
                {f.levels.map((lvl) => (
                  <span key={lvl} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                    {lvl}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Tiêu chí chấm điểm:
              </span>
              <ul className="space-y-2 text-xs text-slate-600">
                {f.criteria.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
