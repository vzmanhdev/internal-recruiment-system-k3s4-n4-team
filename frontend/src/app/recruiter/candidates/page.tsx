'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Users, Search, Filter, Plus, ChevronRight, GraduationCap, Briefcase, Sparkles, ExternalLink } from 'lucide-react';

export default function RecruiterCandidatesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const candidates = [
    {
      id: 'CAN-085',
      name: 'Nguyễn Văn An',
      email: 'an.nguyen@example.com',
      phone: '0912 345 678',
      position: 'Senior Backend Engineer (Go/Python)',
      stage: 'Chờ phỏng vấn',
      university: 'ĐH Bách Khoa TP.HCM',
      experience: '5 năm kinh nghiệm',
      matchScore: 96,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=120&auto=format&fit=crop',
    },
    {
      id: 'CAN-077',
      name: 'Lê Hoàng Cường',
      email: 'cuong.le@example.com',
      phone: '0908 765 432',
      position: 'Senior Backend Engineer (Go/Python)',
      stage: 'Đề xuất Offer',
      university: 'PTIT',
      experience: '6 năm kinh nghiệm',
      matchScore: 98,
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=120&auto=format&fit=crop',
    },
    {
      id: 'CAN-092',
      name: 'Trần Minh Quân',
      email: 'quan.tran@example.com',
      phone: '0987 111 222',
      position: 'Frontend React Lead',
      stage: 'Đang sàng lọc',
      university: 'ĐH Khoa Học Tự Nhiên',
      experience: '4 năm kinh nghiệm',
      matchScore: 89,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&auto=format&fit=crop',
    },
    {
      id: 'CAN-088',
      name: 'Hoàng Kim Ngân',
      email: 'ngan.hoang@example.com',
      phone: '0933 888 999',
      position: 'Product Owner / BA Lead',
      stage: 'Chờ phỏng vấn',
      university: 'ĐH Ngoại Thương Hà Nội',
      experience: '4 năm kinh nghiệm',
      matchScore: 92,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=120&auto=format&fit=crop',
    },
    {
      id: 'CAN-101',
      name: 'Vũ Đức Thịnh',
      email: 'thinh.vu@example.com',
      phone: '0977 444 555',
      position: 'Senior Backend Engineer (Go/Python)',
      stage: 'Ứng tuyển mới',
      university: 'ĐH Bách Khoa Hà Nội',
      experience: '4 năm kinh nghiệm',
      matchScore: 94,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-blue-600" />
            <span>Quản Lý Hồ Sơ Ứng Viên Hợp Nhất</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Tra cứu toàn bộ cơ sở dữ liệu ứng viên, lịch sử ứng tuyển và điểm đánh giá năng lực.
          </p>
        </div>

        <Link
          href="/recruiter/pipeline"
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Ứng Viên Mới</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, email, trường..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 font-bold uppercase text-[10px] text-slate-400 tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-3.5">Ứng viên</th>
                <th className="p-3.5">Vị trí ứng tuyển</th>
                <th className="p-3.5">Học vấn & Kinh nghiệm</th>
                <th className="p-3.5">Trạng thái</th>
                <th className="p-3.5 text-center">Match Score</th>
                <th className="p-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidates.map((cand) => (
                <tr key={cand.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3.5">
                    <div className="flex items-center gap-2.5">
                      <img src={cand.avatar} alt={cand.name} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                      <div>
                        <div className="font-extrabold text-slate-900">{cand.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{cand.id} &bull; {cand.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold text-slate-800">{cand.position}</span>
                  </td>
                  <td className="p-3.5">
                    <div className="text-[11px] text-slate-600 font-medium">{cand.university}</div>
                    <div className="text-[10px] text-slate-400">{cand.experience}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px]">
                      {cand.stage}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[11px] border border-emerald-200">
                      {cand.matchScore}%
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <Link
                      href="/recruiter/pipeline"
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center gap-1"
                    >
                      <span>Xem Pipeline</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
