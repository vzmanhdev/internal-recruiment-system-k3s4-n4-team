'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Users, Calendar, FileText, Send, Filter, Search, Plus, CheckCircle2, 
  Clock, ArrowRight, ShieldCheck, UserCheck, MessageSquare, AlertCircle, LogOut
} from 'lucide-react';

export default function RecruiterWorkspacePage() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'interviews' | 'offers' | 'emails'>('pipeline');
  const [searchQuery, setSearchQuery] = useState('');

  const candidates = [
    { id: 1, name: 'Nguyễn Văn An', position: 'Kỹ sư Backend Senior', stage: 'Mới', matchScore: 92, appliedDate: '02/10/2026', source: 'LinkedIn' },
    { id: 2, name: 'Trần Thị Bình', position: 'Chuyên viên Marketing', stage: 'Sàng lọc', matchScore: 88, appliedDate: '03/10/2026', source: 'Website' },
    { id: 3, name: 'Lê Hoàng Cường', position: 'Kỹ sư Frontend Lead', stage: 'Phỏng vấn', matchScore: 95, appliedDate: '01/10/2026', source: 'Referral' },
    { id: 4, name: 'Đỗ Hoàng Long', position: 'Data Analyst Senior', stage: 'Offer', matchScore: 90, appliedDate: '28/09/2026', source: 'LinkedIn' },
    { id: 5, name: 'Phạm Minh Đức', position: 'Kỹ sư DevOps', stage: 'Đã nhận việc', matchScore: 94, appliedDate: '25/09/2026', source: 'Website' },
  ];

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 font-sans flex flex-col antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
        <div className="w-full max-w-full px-6 sm:px-8 lg:px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900">Recruiter Workspace</span>
                <span className="bg-blue-100 text-blue-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Nhân Viên Tuyển Dụng
                </span>
              </div>
              <p className="text-xs text-slate-500">Vận hành pipeline ứng viên, đặt lịch phỏng vấn & soạn offer</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-slate-50 border border-gray-100 px-3.5 py-1.5 rounded-full">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                RC
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-800 block leading-none">Lê Thị Mai (Recruiter)</span>
                <span className="text-slate-400 text-[10px]">recruiter@company.com</span>
              </div>
            </div>
            <Link href="/login" className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-gray-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold">
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 w-full max-w-full px-6 sm:px-8 lg:px-10 py-6 flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="bg-white rounded-[24px] border border-gray-100 p-4 shadow-sm space-y-2">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thao tác Recruiter</div>
            <button onClick={() => setActiveTab('pipeline')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${activeTab === 'pipeline' ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Users className="w-4 h-4" /> <span>Pipeline Ứng Viên</span>
            </button>
            <Link href="/hr/interviews" className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs text-slate-600 hover:bg-blue-50 hover:text-blue-600">
              <Calendar className="w-4 h-4" /> <span>Đặt Lịch Phỏng Vấn</span>
            </Link>
            <button onClick={() => setActiveTab('offers')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${activeTab === 'offers' ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-50'}`}>
              <FileText className="w-4 h-4" /> <span>Soạn Đề Xuất Offer</span>
            </button>
            <button onClick={() => setActiveTab('emails')} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${activeTab === 'emails' ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Send className="w-4 h-4" /> <span>Gửi Mail Hàng Loạt</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 space-y-6">
          <div className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Quản Lý Pipeline Ứng Viên Được Phân Công</h2>
                <p className="text-xs text-slate-500">Sàng lọc CV, điều phối trạng thái và tương tác với ứng viên</p>
              </div>
              <button className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 cursor-pointer">
                <Plus className="w-4 h-4" />
                <span>+ Thêm Ứng Viên Mới</span>
              </button>
            </div>

            {/* Table Section */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 font-bold uppercase text-[10px] text-slate-400 tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="p-4">Họ & Tên</th>
                    <th className="p-4">Vị Trí Ứng Tuyển</th>
                    <th className="p-4">Match Rate</th>
                    <th className="p-4">Nguồn</th>
                    <th className="p-4">Giai Đoạn Pipeline</th>
                    <th className="p-4 text-right">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {candidates.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-bold text-slate-900">{c.name}</td>
                      <td className="p-4 text-slate-600">{c.position}</td>
                      <td className="p-4 font-extrabold text-emerald-600">{c.matchScore}%</td>
                      <td className="p-4 text-slate-500">{c.source}</td>
                      <td className="p-4">
                        <span className="bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded-full text-[11px]">{c.stage}</span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-[11px] font-semibold transition-all cursor-pointer">Chi tiết</button>
                        <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[11px] font-semibold hover:bg-blue-700 transition-all cursor-pointer">Chuyển bước</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
