'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Calendar, UserCheck, Star, FileText, CheckCircle2, Clock, LogOut } from 'lucide-react';

export default function InterviewerWorkspacePage() {
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);

  const interviews = [
    { id: 1, candidateName: 'Lê Hoàng Cường', position: 'Kỹ sư Frontend Lead', time: '14:00 - 15:00, Hôm nay', room: 'Phòng PV 2 (Google Meet)', cvUrl: '#', status: 'Sắp tới' },
    { id: 2, name: 'Đỗ Hoàng Long', candidateName: 'Đỗ Hoàng Long', position: 'Data Analyst Senior', time: '09:30 - 10:30, Ngày mai', room: 'Phòng Trực tiếp A3', cvUrl: '#', status: 'Đã xếp lịch' },
  ];

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 font-sans flex flex-col antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
        <div className="w-full max-w-full px-6 sm:px-8 lg:px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900">Interviewer Workspace</span>
                <span className="bg-purple-100 text-purple-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Người Phỏng Vấn
                </span>
              </div>
              <p className="text-xs text-slate-500">Xem lịch phỏng vấn được gán, đọc CV & nộp phiếu đánh giá 1-5 điểm</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-slate-50 border border-gray-100 px-3.5 py-1.5 rounded-full">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-xs">
                IT
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-800 block leading-none">Nguyễn Minh Trí (Interviewer)</span>
                <span className="text-slate-400 text-[10px]">interviewer@company.com</span>
              </div>
            </div>
            <Link href="/login" className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-gray-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold">
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 w-full max-w-full px-6 sm:px-8 lg:px-10 py-6 flex flex-col lg:flex-row gap-6">
        {/* Main List */}
        <div className="flex-1 space-y-6">
          <div className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Lịch Phỏng Vấn Được Phân Công</h2>
            <p className="text-xs text-slate-500 mb-6">Đọc CV ứng viên trước buổi phỏng vấn và nộp kết quả đánh giá theo khung năng lực</p>

            <div className="space-y-4">
              {interviews.map((item) => (
                <div key={item.id} className="border border-gray-100 bg-slate-50/50 hover:bg-slate-50 rounded-2xl p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">{item.candidateName}</span>
                      <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{item.status}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-600">Vị trí: {item.position}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> {item.time}</span>
                      <span>• {item.room}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer">
                      Đọc CV (.PDF)
                    </button>
                    <button 
                      onClick={() => setSelectedCandidate(item)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-500/20 cursor-pointer"
                    >
                      Nộp Phiếu Đánh Giá
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Evaluation Panel Modal / Form */}
        {selectedCandidate && (
          <div className="w-full lg:w-96 bg-white rounded-[24px] border border-gray-100 p-6 shadow-lg h-fit space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Phiếu Đánh Giá 1-5 Điểm</h3>
              <button onClick={() => setSelectedCandidate(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer">Đóng ✕</button>
            </div>

            <div className="text-xs text-slate-600 space-y-3">
              <div>
                <span className="block font-bold text-slate-900">{selectedCandidate.candidateName}</span>
                <span className="text-slate-500">{selectedCandidate.position}</span>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block font-bold text-slate-700">1. Kiến thức chuyên môn (Thang 1-5):</label>
                <select className="w-full p-2 border border-gray-200 rounded-xl bg-slate-50 text-xs font-semibold">
                  <option value="5">5 - Xuất sắc</option>
                  <option value="4">4 - Tốt</option>
                  <option value="3">3 - Đạt yêu cầu</option>
                  <option value="2">2 - Yếu</option>
                  <option value="1">1 - Kém</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-slate-700">2. Kỹ năng giao tiếp & Tiếng Anh:</label>
                <select className="w-full p-2 border border-gray-200 rounded-xl bg-slate-50 text-xs font-semibold">
                  <option value="4">4 - Tốt</option>
                  <option value="5">5 - Xuất sắc</option>
                  <option value="3">3 - Đạt yêu cầu</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-slate-700">Nhận xét chi tiết:</label>
                <textarea rows={3} placeholder="Nhập ưu/nhược điểm chính của ứng viên..." className="w-full p-2.5 border border-gray-200 rounded-xl bg-slate-50 text-xs" />
              </div>

              <button className="w-full py-2.5 bg-purple-600 text-white font-bold rounded-xl text-xs hover:bg-purple-700 transition-all cursor-pointer shadow-md shadow-purple-500/20">
                Lưu & Gửi Đánh Giá
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
