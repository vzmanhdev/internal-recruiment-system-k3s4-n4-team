'use client';

import React, { useState } from 'react';
import { User, Mail, Phone, Building, ShieldCheck, Check, Sparkles } from 'lucide-react';

export default function InterviewerProfilePage() {
  const [profile, setProfile] = useState({
    name: 'Nguyễn Minh Trí',
    email: 'interviewer@company.com',
    phone: '0987 654 321',
    department: 'Ban Công Nghệ & Khối Tuyển Dụng',
    role: 'Hội Đồng Phỏng Vấn (Interviewer)',
    title: 'Senior Tech Lead / Technical Interviewer',
    bio: 'Tham gia hội đồng phỏng vấn chuyên môn các vị trí Kỹ sư Phần mềm, DevOps và Data Engineer từ năm 2023.',
  });
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Hồ Sơ Người Phỏng Vấn</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Thông tin định danh và chuyên môn của bạn trong Hội đồng Phỏng vấn tập đoàn
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cột trái: Avatar & Vai trò */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm text-center space-y-4">
          <div className="w-20 h-20 bg-blue-600 text-white font-extrabold text-2xl rounded-full flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
            MT
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{profile.name}</h2>
            <p className="text-xs text-slate-500">{profile.title}</p>
            <span className="inline-block mt-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200/60">
              {profile.role}
            </span>
          </div>

          <div className="text-xs text-slate-600 text-left bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
            <span className="font-bold text-slate-700 block mb-1">Mô tả chuyên môn:</span>
            {profile.bio}
          </div>
        </div>

        {/* Cột phải: Form thông tin */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Thông Tin Cá Nhân
          </h3>

          {saved && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Đã lưu thông tin hồ sơ thành công!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ và tên:</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email nội bộ:</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số điện thoại:</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phòng ban phụ trách:</label>
                <input
                  type="text"
                  value={profile.department}
                  disabled
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-500/20 active:scale-95"
              >
                Cập Nhật Thông Tin
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
