'use client';

import React, { useState } from 'react';
import { 
  Users, Search, Filter, Star, Eye, ChevronRight, CheckCircle2, 
  XCircle, Clock, FileText, ArrowRight, UserCheck, ShieldAlert, Sparkles
} from 'lucide-react';

interface CandidateItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  position_applied: string;
  stage: 'applied' | 'screening' | 'tech_interview' | 'hr_interview' | 'offer' | 'hired';
  rating: number; // 1-5
  source: string;
  recruiter: string;
  applied_at: string;
  resume_url?: string;
}

const STAGES = [
  { key: 'applied', label: '1. Hồ sơ mới', color: 'bg-slate-100 text-slate-700' },
  { key: 'screening', label: '2. Thẩm định (Screening)', color: 'bg-blue-50 text-blue-700' },
  { key: 'tech_interview', label: '3. Phỏng vấn Chuyên môn', color: 'bg-indigo-50 text-indigo-700' },
  { key: 'hr_interview', label: '4. Phỏng vấn HR', color: 'bg-purple-50 text-purple-700' },
  { key: 'offer', label: '5. Thư mời (Offer)', color: 'bg-amber-50 text-amber-700' },
  { key: 'hired', label: '6. Đã tuyển dụng (Hired)', color: 'bg-emerald-50 text-emerald-700' }
];

export default function HRCandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateItem[]>([
    {
      id: "CAN-001",
      name: "Đỗ Hoàng Long",
      email: "long.do@gmail.com",
      phone: "0988 123 456",
      position_applied: "Senior Backend Engineer",
      stage: "offer",
      rating: 5,
      source: "TopCV",
      recruiter: "Nguyễn Văn Hùng",
      applied_at: "20/09/2026"
    },
    {
      id: "CAN-002",
      name: "Nguyễn Thu Thủy",
      email: "thuthuy.nguyen@gmail.com",
      phone: "0912 345 678",
      position_applied: "Senior Backend Engineer",
      stage: "tech_interview",
      rating: 4,
      source: "Website Công Khai",
      recruiter: "Nguyễn Văn Hùng",
      applied_at: "25/09/2026"
    },
    {
      id: "CAN-003",
      name: "Trần Minh Quang",
      email: "quang.tm@gmail.com",
      phone: "0934 567 890",
      position_applied: "Trưởng nhóm Data Analyst",
      stage: "hr_interview",
      rating: 4,
      source: "Giới Thiệu Nội Bộ",
      recruiter: "Lê Thị Mai",
      applied_at: "28/09/2026"
    }
  ]);

  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateItem | null>(null);

  const moveStage = (candidateId: string, newStage: any) => {
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, stage: newStage } : c));
    alert(`Đã chuyển ứng viên sang giai đoạn: ${STAGES.find(s => s.key === newStage)?.label}`);
    setSelectedCandidate(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Phễu Tuyển Dụng & Ứng Viên (Pipeline)</h1>
            <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">
              [S5-01] 6-Stage Pipeline
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Theo dõi phễu chuyển đổi ứng viên qua 6 giai đoạn tuyển dụng chuẩn ATS</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
            <button 
              onClick={() => setViewMode('board')}
              className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'board' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Kanban Board
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Danh Sách
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 overflow-x-auto pb-4">
          {STAGES.map((st) => {
            const stageCandidates = candidates.filter(c => c.stage === st.key);
            return (
              <div key={st.key} className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-3 space-y-3 min-w-[220px]">
                <div className="flex items-center justify-between font-bold text-xs">
                  <span className={`px-2 py-0.5 rounded-md ${st.color}`}>{st.label}</span>
                  <span className="bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">
                    {stageCandidates.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {stageCandidates.map((can) => (
                    <div 
                      key={can.id}
                      onClick={() => setSelectedCandidate(can)}
                      className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-xs text-slate-900">{can.name}</span>
                        <div className="flex items-center text-amber-400 text-[10px]">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span className="font-bold text-slate-700 ml-0.5">{can.rating}</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 line-clamp-1">{can.position_applied}</div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                        <span>{can.source}</span>
                        <span>{can.applied_at}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase">
                <th className="p-4">Họ & Tên Ứng Viên</th>
                <th className="p-4">Vị Trí Ứng Tuyển</th>
                <th className="p-4">Giai Đoạn Phễu</th>
                <th className="p-4 text-center">Đánh Giá</th>
                <th className="p-4">Recruiter Phụ Trách</th>
                <th className="p-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidates.map((can) => (
                <tr key={can.id} className="hover:bg-slate-50/70">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{can.name}</div>
                    <div className="text-[11px] text-slate-400">{can.email} | {can.phone}</div>
                  </td>
                  <td className="p-4 font-semibold text-slate-800">{can.position_applied}</td>
                  <td className="p-4">
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-[10px] font-extrabold">
                      {STAGES.find(s => s.key === can.stage)?.label}
                    </span>
                  </td>
                  <td className="p-4 text-center font-bold text-amber-500">⭐ {can.rating}/5</td>
                  <td className="p-4 text-slate-700 font-semibold">{can.recruiter}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => setSelectedCandidate(can)} className="text-blue-600 font-bold hover:underline">Chi tiết</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Candidate Quick Action Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Ứng Viên: {selectedCandidate.name}</h3>
              <button onClick={() => setSelectedCandidate(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="font-bold text-slate-900">{selectedCandidate.position_applied}</div>
                <div className="text-slate-500">Email: {selectedCandidate.email} | SĐT: {selectedCandidate.phone}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Chuyển Giai Đoạn Phễu Mới *</label>
                <div className="space-y-1">
                  {STAGES.map((st) => (
                    <button 
                      key={st.key}
                      onClick={() => moveStage(selectedCandidate.id, st.key)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border ${
                        selectedCandidate.stage === st.key ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{st.label}</span>
                      {selectedCandidate.stage === st.key && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
