'use client';

import React, { useState } from 'react';
import { 
  Calendar, Clock, Users, Video, MapPin, CheckCircle2, XCircle, 
  Plus, Search, Filter, AlertCircle, Eye, UserCheck
} from 'lucide-react';

interface InterviewSchedule {
  id: string;
  code: string;
  candidate_name: string;
  position: string;
  datetime: string;
  type: 'online' | 'offline';
  location_or_link: string;
  interviewers: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  evaluation_submitted: number; // e.g. 2/2
}

export default function HRInterviewsPage() {
  const [interviews, setInterviews] = useState<InterviewSchedule[]>([
    {
      id: "INT-001",
      code: "INT-2026-045",
      candidate_name: "Nguyễn Thu Thủy",
      position: "Senior Backend Engineer",
      datetime: "08/10/2026 14:00 - 15:00",
      type: "online",
      location_or_link: "https://meet.google.com/abc-xyz-123",
      interviewers: ["Lê Văn Mạnh (Tech Lead)", "Phạm Quốc Tuấn (Solution Architect)"],
      status: "scheduled",
      evaluation_submitted: 0
    },
    {
      id: "INT-002",
      code: "INT-2026-042",
      candidate_name: "Trần Minh Quang",
      position: "Trưởng nhóm Data Analyst",
      datetime: "05/10/2026 10:00 - 11:30",
      type: "offline",
      location_or_link: "Phòng họp 402 - Trụ sở chính Hà Nội",
      interviewers: ["Trần Thị Thu Hà (HR Manager)", "Phạm Quốc Tuấn (Data Director)"],
      status: "completed",
      evaluation_submitted: 2
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lịch Phỏng Vấn & Hội Đồng Evaluators</h1>
            <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">
              [S6-01] Interview Operations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Lên lịch phỏng vấn Online/Offline, gán Hội đồng phỏng vấn & theo dõi tiến độ nộp phiếu đánh giá</p>
        </div>

        <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer">
          <Plus className="w-4 h-4" />
          <span>Tạo Lịch Phỏng Vấn Mới</span>
        </button>
      </div>

      {/* Main List */}
      <div className="space-y-4">
        {interviews.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4 hover:shadow-md transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">{item.code}</span>
                    <h2 className="text-base font-bold text-slate-900">{item.candidate_name}</h2>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Vị trí: <strong>{item.position}</strong></div>
                </div>
              </div>

              {item.status === 'scheduled' ? (
                <span className="bg-blue-50 text-blue-700 font-extrabold text-[10px] px-2.5 py-1 rounded-full border border-blue-200">
                  Sắp Phỏng Vấn
                </span>
              ) : (
                <span className="bg-emerald-50 text-emerald-700 font-extrabold text-[10px] px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Đã Phỏng Vấn</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
              <div className="space-y-1">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase">Thời Gian & Hình Thức</div>
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>{item.datetime}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {item.type === 'online' ? `🖥️ Online: ${item.location_or_link}` : `🏢 Offline: ${item.location_or_link}`}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase">Hội Đồng Phỏng Vấn (Panel)</div>
                <div className="space-y-0.5">
                  {item.interviewers.map((person, idx) => (
                    <div key={idx} className="font-semibold text-slate-800 flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-slate-400" />
                      <span>{person}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase">Phiếu Đánh Giá</div>
                <div className="font-bold text-slate-900">
                  Đã nộp: <span className="text-blue-600 font-extrabold">{item.evaluation_submitted}/{item.interviewers.length}</span> người
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
