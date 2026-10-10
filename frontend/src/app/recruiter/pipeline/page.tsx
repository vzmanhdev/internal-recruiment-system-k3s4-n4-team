'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Kanban,
  MoreVertical,
  Calendar,
  Mail,
  FileText,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Briefcase,
  ChevronRight,
  ChevronLeft,
  X,
  User,
  Star,
  ExternalLink,
} from 'lucide-react';
import clsx from 'clsx';

// Candidate Interface
interface Candidate {
  id: string;
  name: string;
  position: string;
  university: string;
  experience: string;
  matchScore: number;
  appliedDate: string;
  source: string;
  avatar: string;
  columnId: 'new' | 'screening' | 'interview' | 'offer' | 'rejected';
  tags?: string[];
}

// 5 Cột cố định theo đúng yêu cầu:
// 1. Ứng tuyển mới (CV Mới)
// 2. Đang sàng lọc
// 3. Chờ phỏng vấn
// 4. Đề xuất Offer
// 5. Từ chối / Rớt (Gửi thư cảm ơn)
const KANBAN_COLUMNS = [
  {
    id: 'new',
    title: 'Ứng tuyển mới (CV Mới)',
    accentColor: 'border-t-blue-500',
    badgeColor: 'bg-blue-100 text-blue-800',
    dotColor: 'bg-blue-500',
  },
  {
    id: 'screening',
    title: 'Đang sàng lọc',
    accentColor: 'border-t-purple-500',
    badgeColor: 'bg-purple-100 text-purple-800',
    dotColor: 'bg-purple-500',
  },
  {
    id: 'interview',
    title: 'Chờ phỏng vấn',
    accentColor: 'border-t-amber-500',
    badgeColor: 'bg-amber-100 text-amber-800',
    dotColor: 'bg-amber-500',
  },
  {
    id: 'offer',
    title: 'Đề xuất Offer',
    accentColor: 'border-t-emerald-500',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    dotColor: 'bg-emerald-500',
  },
  {
    id: 'rejected',
    title: 'Từ chối / Rớt (Gửi thư cảm ơn)',
    accentColor: 'border-t-slate-400',
    badgeColor: 'bg-rose-100 text-rose-800',
    dotColor: 'bg-rose-500',
  },
] as const;

export default function RecruiterPipelinePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Danh sách ứng viên mẫu đa dạng
  const [candidates, setCandidates] = useState<Candidate[]>([
    // Cột 1: Ứng tuyển mới
    {
      id: 'CAN-101',
      name: 'Vũ Đức Thịnh',
      position: 'Senior Backend Engineer (Go/Python)',
      university: 'ĐH Bách Khoa Hà Nội',
      experience: '4 năm KN',
      matchScore: 94,
      appliedDate: 'Hôm nay, 10:15',
      source: 'LinkedIn Jobs',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop',
      columnId: 'new',
      tags: ['Golang', 'Docker', 'PostgreSQL'],
    },
    {
      id: 'CAN-102',
      name: 'Lê Thảo My',
      position: 'Frontend React Lead',
      university: 'ĐH FPT Hà Nội',
      experience: '5 năm KN',
      matchScore: 91,
      appliedDate: 'Hôm qua, 16:30',
      source: 'TopCV',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=120&auto=format&fit=crop',
      columnId: 'new',
      tags: ['Next.js', 'TypeScript', 'Tailwind'],
    },
    {
      id: 'CAN-103',
      name: 'Đặng Quốc Huy',
      position: 'DevOps / Cloud Engineer',
      university: 'ĐH Công Nghệ ĐHQG',
      experience: '3 năm KN',
      matchScore: 82,
      appliedDate: '08/10/2026',
      source: 'VietnamWorks',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=120&auto=format&fit=crop',
      columnId: 'new',
      tags: ['AWS', 'K8s', 'Terraform'],
    },

    // Cột 2: Đang sàng lọc
    {
      id: 'CAN-092',
      name: 'Trần Minh Quân',
      position: 'Frontend React Lead',
      university: 'ĐH Khoa Học Tự Nhiên',
      experience: '4 năm KN',
      matchScore: 89,
      appliedDate: '05/10/2026',
      source: 'Referral Nội Bộ',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&auto=format&fit=crop',
      columnId: 'screening',
      tags: ['React Native', 'Redux', 'GraphQL'],
    },
    {
      id: 'CAN-093',
      name: 'Ngô Thanh Hương',
      position: 'UI/UX Designer',
      university: 'ĐH Mỹ Thuật Công Nghiệp',
      experience: '3 năm KN',
      matchScore: 87,
      appliedDate: '06/10/2026',
      source: 'Behance Portfolio',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop',
      columnId: 'screening',
      tags: ['Figma', 'Design System', 'User Research'],
    },

    // Cột 3: Chờ phỏng vấn
    {
      id: 'CAN-085',
      name: 'Nguyễn Văn An',
      position: 'Senior Backend Engineer (Go/Python)',
      university: 'ĐH Bách Khoa TP.HCM',
      experience: '5 năm KN',
      matchScore: 96,
      appliedDate: '01/10/2026',
      source: 'LinkedIn InMail',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=120&auto=format&fit=crop',
      columnId: 'interview',
      tags: ['Microservices', 'Kafka', 'Redis'],
    },
    {
      id: 'CAN-088',
      name: 'Hoàng Kim Ngân',
      position: 'Product Owner / BA Lead',
      university: 'ĐH Ngoại Thương Hà Nội',
      experience: '4 năm KN',
      matchScore: 92,
      appliedDate: '03/10/2026',
      source: 'Referral Quản Lý',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=120&auto=format&fit=crop',
      columnId: 'interview',
      tags: ['Agile Scrum', 'Jira', 'Data-driven'],
    },

    // Cột 4: Đề xuất Offer
    {
      id: 'CAN-077',
      name: 'Lê Hoàng Cường',
      position: 'Senior Backend Engineer (Go/Python)',
      university: 'Học Viện Công Nghệ Bưu Chính Viễn Thông',
      experience: '6 năm KN',
      matchScore: 98,
      appliedDate: '25/09/2026',
      source: 'Headhunter Agency',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=120&auto=format&fit=crop',
      columnId: 'offer',
      tags: ['System Architect', 'High Concurrency', 'Lead'],
    },

    // Cột 5: Từ chối / Rớt (Gửi thư cảm ơn)
    {
      id: 'CAN-061',
      name: 'Phạm Đức Dũng',
      position: 'DevOps / Cloud Engineer',
      university: 'ĐH Công Nghiệp Hà Nội',
      experience: '1.5 năm KN',
      matchScore: 68,
      appliedDate: '22/09/2026',
      source: 'TopCV',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=120&auto=format&fit=crop',
      columnId: 'rejected',
      tags: ['Chưa đủ kinh nghiệm K8s'],
    },
  ]);

  // Modal thêm ứng viên mới state
  const [newCandidateForm, setNewCandidateForm] = useState({
    name: '',
    position: 'Senior Backend Engineer (Go/Python)',
    university: '',
    experience: '',
    matchScore: 85,
    source: 'LinkedIn Jobs',
  });

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const matchQuery =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.university.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPos = selectedPosition === 'all' || c.position === selectedPosition;
      return matchQuery && matchPos;
    });
  }, [candidates, searchQuery, selectedPosition]);

  // Handle chuyển cột
  const handleMoveCandidate = (candidateId: string, direction: 'prev' | 'next') => {
    const colOrder = ['new', 'screening', 'interview', 'offer', 'rejected'] as const;
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId) return c;
        const currentIndex = colOrder.indexOf(c.columnId);
        const nextIndex =
          direction === 'next'
            ? Math.min(currentIndex + 1, colOrder.length - 1)
            : Math.max(currentIndex - 1, 0);
        return { ...c, columnId: colOrder[nextIndex] };
      })
    );
  };

  // Thêm ứng viên mới
  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidateForm.name || !newCandidateForm.university) return;

    const newCand: Candidate = {
      id: `CAN-${Math.floor(100 + Math.random() * 900)}`,
      name: newCandidateForm.name,
      position: newCandidateForm.position,
      university: newCandidateForm.university,
      experience: newCandidateForm.experience || '3 năm KN',
      matchScore: Number(newCandidateForm.matchScore),
      appliedDate: 'Vừa xong',
      source: newCandidateForm.source,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop',
      columnId: 'new',
      tags: ['Mới tiếp nhận'],
    };

    setCandidates([newCand, ...candidates]);
    setIsAddModalOpen(false);
    setNewCandidateForm({
      name: '',
      position: 'Senior Backend Engineer (Go/Python)',
      university: '',
      experience: '',
      matchScore: 85,
      source: 'LinkedIn Jobs',
    });
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col space-y-4">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Kanban className="w-7 h-7 text-blue-600" />
            <span>Kanban Pipeline Điều Phối Ứng Viên</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Kéo thả, theo dõi hành trình ứng viên từ tiếp nhận CV đến phỏng vấn và gửi Offer chính thức.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium bg-white px-3.5 py-1.5 rounded-xl border border-slate-200/80 shadow-xs">
          <span>Trang chủ</span>
          <span>&rsaquo;</span>
          <span className="text-slate-700 font-bold">Kanban Pipeline</span>
        </div>
      </div>

      {/* Thanh công cụ (Top Bar) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Ô tìm kiếm ứng viên */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên, kỹ năng, trường..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Bộ lọc (Filter) theo "Vị trí đang tuyển" */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
            >
              <option value="all">🎯 Tất cả vị trí đang tuyển</option>
              <option value="Senior Backend Engineer (Go/Python)">Senior Backend Engineer (Go/Python)</option>
              <option value="Frontend React Lead">Frontend React Lead</option>
              <option value="Product Owner / BA Lead">Product Owner / BA Lead</option>
              <option value="DevOps / Cloud Engineer">DevOps / Cloud Engineer</option>
              <option value="UI/UX Designer">UI/UX Designer</option>
            </select>
          </div>
        </div>

        {/* Nút "+ Thêm ứng viên" */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm Ứng Viên</span>
          </button>
        </div>
      </div>

      {/* Khu vực Board (Kanban Columns) - Cuộn ngang mượt mà */}
      <div className="flex-1 overflow-x-auto pb-4 pt-1">
        <div className="flex gap-4 min-w-[1300px] h-full items-start">
          {KANBAN_COLUMNS.map((col) => {
            const colCandidates = filteredCandidates.filter((c) => c.columnId === col.id);

            return (
              <div
                key={col.id}
                className={clsx(
                  'w-80 shrink-0 bg-slate-100/70 rounded-2xl border border-slate-200/80 flex flex-col max-h-[calc(100vh-14rem)] border-t-4',
                  col.accentColor
                )}
              >
                {/* Column Header */}
                <div className="p-3.5 flex items-center justify-between border-b border-slate-200/60 bg-white/60 rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <span className={clsx('w-2 h-2 rounded-full', col.dotColor)} />
                    <h3 className="font-extrabold text-xs text-slate-800 tracking-tight">
                      {col.title}
                    </h3>
                  </div>
                  <span
                    className={clsx(
                      'text-[10px] font-extrabold px-2 py-0.5 rounded-full',
                      col.badgeColor
                    )}
                  >
                    {colCandidates.length}
                  </span>
                </div>

                {/* Candidate Cards List */}
                <div className="p-3 space-y-3 overflow-y-auto flex-1">
                  {colCandidates.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-white/40">
                      Chưa có ứng viên nào
                    </div>
                  ) : (
                    colCandidates.map((cand) => (
                      <div
                        key={cand.id}
                        onClick={() => setSelectedCandidate(cand)}
                        className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md transition-all space-y-3 cursor-pointer group hover:border-blue-300"
                      >
                        {/* Header card: Avatar, Tên, Match Score */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={cand.avatar}
                              alt={cand.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                                {cand.name}
                              </h4>
                              <span className="text-[10px] font-mono text-slate-400 block">
                                {cand.id}
                              </span>
                            </div>
                          </div>

                          {/* Nhãn màu đánh giá mức độ phù hợp */}
                          <span
                            className={clsx(
                              'text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 border',
                              cand.matchScore >= 90
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : cand.matchScore >= 80
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            )}
                          >
                            {cand.matchScore}% Match
                          </span>
                        </div>

                        {/* Vị trí ứng tuyển */}
                        <div className="text-[11px] font-bold text-slate-700 line-clamp-1">
                          {cand.position}
                        </div>

                        {/* Thông tin Trường Đại học & Kinh nghiệm */}
                        <div className="space-y-1 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                          <div className="flex items-center gap-1.5 truncate">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{cand.university}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{cand.experience}</span>
                          </div>
                        </div>

                        {/* Tags kỹ năng */}
                        {cand.tags && (
                          <div className="flex flex-wrap gap-1">
                            {cand.tags.map((tag, tIdx) => (
                              <span
                                key={tIdx}
                                className="text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Footer card: Ngày nộp + Nút chuyển cột */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                          <span>{cand.appliedDate}</span>

                          <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {col.id !== 'new' && (
                              <button
                                type="button"
                                title="Lùi lại vòng trước"
                                onClick={() => handleMoveCandidate(cand.id, 'prev')}
                                className="p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {col.id !== 'rejected' && (
                              <button
                                type="button"
                                title="Chuyển sang vòng tiếp theo"
                                onClick={() => handleMoveCandidate(cand.id, 'next')}
                                className="p-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal chi tiết ứng viên */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedCandidate.avatar}
                  alt={selectedCandidate.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-100"
                />
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    {selectedCandidate.name}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedCandidate.id} &bull; Nguồn: {selectedCandidate.source}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl space-y-1.5">
                <div className="font-bold text-slate-700">Vị trí ứng tuyển</div>
                <div className="font-extrabold text-blue-700">{selectedCandidate.position}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl space-y-1">
                  <div className="text-slate-400 text-[10px]">Trường đại học</div>
                  <div className="font-bold text-slate-800">{selectedCandidate.university}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl space-y-1">
                  <div className="text-slate-400 text-[10px]">Kinh nghiệm</div>
                  <div className="font-bold text-slate-800">{selectedCandidate.experience}</div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-emerald-700 font-bold">Mức độ phù hợp thuật toán (Match Score)</div>
                  <div className="text-lg font-black text-emerald-800">{selectedCandidate.matchScore}% Phù hợp</div>
                </div>
                <Sparkles className="w-6 h-6 text-emerald-600" />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`Đã gửi email phỏng vấn tới ứng viên ${selectedCandidate.name}`);
                  setSelectedCandidate(null);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 cursor-pointer"
              >
                Đặt Lịch Phỏng Vấn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal thêm ứng viên mới */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Thêm Ứng Viên Mới Vào Pipeline</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCandidate} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ và tên ứng viên *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn Hùng"
                  value={newCandidateForm.name}
                  onChange={(e) => setNewCandidateForm({ ...newCandidateForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Vị trí ứng tuyển *</label>
                <select
                  value={newCandidateForm.position}
                  onChange={(e) => setNewCandidateForm({ ...newCandidateForm, position: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="Senior Backend Engineer (Go/Python)">Senior Backend Engineer (Go/Python)</option>
                  <option value="Frontend React Lead">Frontend React Lead</option>
                  <option value="Product Owner / BA Lead">Product Owner / BA Lead</option>
                  <option value="DevOps / Cloud Engineer">DevOps / Cloud Engineer</option>
                  <option value="UI/UX Designer">UI/UX Designer</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trường ĐH *</label>
                  <input
                    type="text"
                    required
                    placeholder="ĐH Bách Khoa..."
                    value={newCandidateForm.university}
                    onChange={(e) => setNewCandidateForm({ ...newCandidateForm, university: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số năm kinh nghiệm</label>
                  <input
                    type="text"
                    placeholder="3 năm KN..."
                    value={newCandidateForm.experience}
                    onChange={(e) => setNewCandidateForm({ ...newCandidateForm, experience: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nguồn ứng tuyển</label>
                <select
                  value={newCandidateForm.source}
                  onChange={(e) => setNewCandidateForm({ ...newCandidateForm, source: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="LinkedIn Jobs">LinkedIn Jobs</option>
                  <option value="TopCV">TopCV</option>
                  <option value="VietnamWorks">VietnamWorks</option>
                  <option value="Referral Nội Bộ">Referral Nội Bộ</option>
                  <option value="Website Tuyển Dụng">Website Tuyển Dụng</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-500/20"
                >
                  Lưu Ứng Viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
