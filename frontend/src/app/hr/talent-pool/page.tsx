'use client';

import React, { useState } from 'react';
import { 
  Database, Search, Filter, ShieldAlert, AlertTriangle, CheckCircle2, 
  Tag, Star, Mail, Phone, Calendar, UserX, Plus, FileText
} from 'lucide-react';

interface TalentCandidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  primary_skill: string;
  experience_years: number;
  rating: number;
  source: string;
  is_blacklisted: boolean;
  blacklist_reason?: string;
  blacklist_tagged_by?: string;
  blacklist_tagged_at?: string;
  skills: string[];
}

export default function HRTalentPoolPage() {
  const [talents, setTalents] = useState<TalentCandidate[]>([
    {
      id: "TP-001",
      name: "Nguyễn Văn An",
      email: "an.nguyen@gmail.com",
      phone: "0901 234 567",
      primary_skill: "Python / FastAPI / Docker",
      experience_years: 5,
      rating: 5,
      source: "TopCV",
      is_blacklisted: false,
      skills: ["Python", "FastAPI", "PostgreSQL", "Docker", "Redis"]
    },
    {
      id: "TP-002",
      name: "Vũ Thị Bích",
      email: "bich.vu@gmail.com",
      phone: "0912 987 654",
      primary_skill: "React.js / Next.js / TypeScript",
      experience_years: 4,
      rating: 4,
      source: "LinkedIn",
      is_blacklisted: false,
      skills: ["React.js", "TypeScript", "TailwindCSS", "Next.js"]
    },
    {
      id: "TP-003",
      name: "Hoàng Văn Cường",
      email: "cuong.hv@yahoo.com",
      phone: "0988 555 444",
      primary_skill: "Java / Spring Boot",
      experience_years: 6,
      rating: 1,
      source: "Giới Thiệu Nội Bộ",
      is_blacklisted: true,
      blacklist_reason: "Bùng Offer sát ngày Onboarding không lý do & Khai gian bằng cấp",
      blacklist_tagged_by: "Trần Thị Thu Hà (HR Manager)",
      blacklist_tagged_at: "15/08/2026",
      skills: ["Java", "Spring Boot", "Microservices"]
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterBlacklist, setFilterBlacklist] = useState<string>('all');
  
  // Modal Blacklist [S5-08]
  const [blacklistModal, setBlacklistModal] = useState<TalentCandidate | null>(null);
  const [reasonInput, setReasonInput] = useState('');

  const handleBlacklistToggle = () => {
    if (!blacklistModal || !reasonInput.trim()) {
      alert("Vui lòng nhập lý do gắn nhãn Blacklist / Cảnh báo!");
      return;
    }

    setTalents(prev => prev.map(t => {
      if (t.id === blacklistModal.id) {
        const newStatus = !t.is_blacklisted;
        return {
          ...t,
          is_blacklisted: newStatus,
          blacklist_reason: newStatus ? reasonInput : undefined,
          blacklist_tagged_by: newStatus ? "Trần Thị Thu Hà (HR Manager)" : undefined,
          blacklist_tagged_at: newStatus ? new Date().toLocaleDateString() : undefined
        };
      }
      return t;
    }));

    alert(`Đã cập nhật nhãn Blacklist cho ứng viên ${blacklistModal.name}. Lý do: ${reasonInput}`);
    setBlacklistModal(null);
    setReasonInput('');
  };

  const filtered = talents.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.primary_skill.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBlacklist = filterBlacklist === 'all' || (filterBlacklist === 'blacklisted' && t.is_blacklisted) || (filterBlacklist === 'clean' && !t.is_blacklisted);
    return matchesSearch && matchesBlacklist;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kho Tài Năng Talent Pool & Cảnh Báo Blacklist</h1>
            <span className="bg-rose-50 text-rose-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-rose-200">
              [S5-08] Red-Flag Audit
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Lưu trữ hồ sơ tài năng tiềm năng, tra cứu theo kỹ năng & đánh nhãn Blacklist/Red-flag kèm lý do giải trình</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm theo tên ứng viên, email hoặc kỹ năng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={filterBlacklist}
            onChange={(e) => setFilterBlacklist(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
          >
            <option value="all">Tất cả ứng viên</option>
            <option value="clean">✅ Ứng viên an toàn</option>
            <option value="blacklisted">🔴 Danh sách đen (Blacklisted)</option>
          </select>
        </div>
      </div>

      {/* Talent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filtered.map((talent) => (
          <div 
            key={talent.id} 
            className={`rounded-2xl border p-5 shadow-sm space-y-3 transition-all ${
              talent.is_blacklisted 
                ? 'bg-rose-50/40 border-rose-200' 
                : 'bg-white border-slate-200/80 hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">{talent.name}</h2>
                  {talent.is_blacklisted && (
                    <span className="bg-rose-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                      <ShieldAlert className="w-3 h-3" />
                      <span>Blacklist</span>
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{talent.email} • {talent.phone}</div>
              </div>

              <div className="flex items-center text-amber-400 text-xs font-bold">
                ⭐ {talent.rating}/5
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-700">
              <div>Kỹ năng chính: <strong className="text-slate-900">{talent.primary_skill}</strong></div>
              <div>Kinh nghiệm: <strong>{talent.experience_years} năm</strong> | Kênh: <strong>{talent.source}</strong></div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {talent.skills.map((s, idx) => (
                <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                  {s}
                </span>
              ))}
            </div>

            {/* Blacklist Warning Box if tagged */}
            {talent.is_blacklisted && talent.blacklist_reason && (
              <div className="p-3 bg-rose-100/70 border border-rose-200 rounded-xl text-xs space-y-1 text-rose-900">
                <div className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                  <span>Cảnh báo Red-flag [S5-08]:</span>
                </div>
                <p className="text-[11px] italic">"{talent.blacklist_reason}"</p>
                <div className="text-[10px] text-rose-700 pt-1">Gắn nhãn bởi: {talent.blacklist_tagged_by} ({talent.blacklist_tagged_at})</div>
              </div>
            )}

            {/* Action */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
              <button 
                onClick={() => setBlacklistModal(talent)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                  talent.is_blacklisted
                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <UserX className="w-3.5 h-3.5" />
                <span>{talent.is_blacklisted ? 'Gỡ Nhãn Blacklist' : 'Gắn Nhãn Blacklist [S5-08]'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Blacklist Modal [S5-08] */}
      {blacklistModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900">Cập Nhật Nhãn Blacklist [S5-08]</h3>
              </div>
              <button onClick={() => setBlacklistModal(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 space-y-1">
                <div className="font-bold text-slate-900">{blacklistModal.name} ({blacklistModal.email})</div>
                <div className="text-rose-700 text-[11px]">Lưu ý: Đánh nhãn Blacklist sẽ cảnh báo đỏ cho tất cả Recruiter khi ứng viên nộp hồ sơ vào bất kỳ vị trí nào trong tương lai.</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lý Do Gắn Nhãn / Ghi Chú Vi Phạm (Bắt Buộc Audit Log) *</label>
                <textarea 
                  rows={3}
                  placeholder="Ví dụ: Bùng Offer sát ngày đi làm, Gian lận bằng cấp chứng chỉ, Thái độ không đúng mực trong phỏng vấn..."
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setBlacklistModal(null)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold">Bỏ Qua</button>
              <button onClick={handleBlacklistToggle} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20">Xác Nhận Đánh Nhãn</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
