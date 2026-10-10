'use client';

import React, { useState } from 'react';
import { Calendar, Plus, Clock, Users, Video, MapPin, CheckCircle2 } from 'lucide-react';

export default function RecruiterInterviewsPage() {
  const [selectedDay, setSelectedDay] = useState('Hôm nay');

  const interviews = [
    {
      id: 'IV-01',
      candidate: 'Nguyễn Văn An',
      position: 'Senior Backend Engineer (Go/Python)',
      time: '09:30 - 10:30',
      date: 'Hôm nay, 10/10/2026',
      round: 'Vòng 2: Kỹ thuật chuyên sâu (System Design)',
      interviewers: ['Lê Trưởng Nhóm (HM)', 'Trần Thị Recruiter'],
      type: 'Google Meet',
      link: 'https://meet.google.com/abc-def-ghi',
      status: 'Sắp diễn ra',
    },
    {
      id: 'IV-02',
      candidate: 'Đỗ Thùy Trang',
      position: 'UI/UX Designer Senior',
      time: '14:00 - 15:00',
      date: 'Hôm nay, 10/10/2026',
      round: 'Vòng 1: Đánh giá Portfolio & Văn hóa',
      interviewers: ['Phạm Văn Interviewer', 'Trần Thị Recruiter'],
      type: 'Trực tiếp tại văn phòng',
      location: 'Phòng Họp Tokyo (Tầng 5)',
      status: 'Đã xác nhận',
    },
    {
      id: 'IV-03',
      candidate: 'Lê Hoàng Yến',
      position: 'Product Owner / BA Lead',
      time: '16:00 - 16:45',
      date: 'Hôm nay, 10/10/2026',
      round: 'Vòng 3: Trao đổi Offer & Lộ trình',
      interviewers: ['Trần Thị Recruiter'],
      type: 'Google Meet',
      link: 'https://meet.google.com/xyz-uvw-rst',
      status: 'Đã sẵn sàng link',
    },
    {
      id: 'IV-04',
      candidate: 'Vũ Đức Thịnh',
      position: 'DevOps / Cloud Engineer',
      time: '10:00 - 11:00',
      date: 'Ngày mai, 11/10/2026',
      round: 'Vòng 1: Sơ vấn kỹ thuật',
      interviewers: ['Nguyễn Technical Lead'],
      type: 'Google Meet',
      status: 'Chờ ứng viên confirm',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-blue-600" />
            <span>Lịch Phỏng Vấn Tuyển Dụng</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Đặt lịch phỏng vấn, tạo phòng họp Google Meet và điều phối hội đồng chuyên môn.
          </p>
        </div>

        <button className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>+ Đặt Lịch Phỏng Vấn Mới</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {interviews.map((iv) => (
          <div key={iv.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[10px]">
                {iv.date}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                {iv.status}
              </span>
            </div>

            <div className="space-y-1">
              <div className="font-black text-sm text-slate-900">{iv.candidate}</div>
              <div className="text-xs font-bold text-blue-600">{iv.position}</div>
              <div className="text-[11px] text-slate-500 font-medium">{iv.round}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{iv.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>HĐPV: {iv.interviewers.join(', ')}</span>
              </div>
              {iv.link && (
                <div className="flex items-center gap-2 text-blue-600 font-semibold pt-1">
                  <Video className="w-3.5 h-3.5" />
                  <a href={iv.link} target="_blank" rel="noreferrer" className="hover:underline">
                    Vào phòng họp Meet &rarr;
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
