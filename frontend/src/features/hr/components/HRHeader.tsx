'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, Bell, Search, LogOut, ChevronDown, User, ShieldCheck, 
  Sparkles, CheckCircle2
} from 'lucide-react';

interface HRHeaderProps {
  userName?: string;
  userEmail?: string;
  notificationCount?: number;
}

export const HRHeader: React.FC<HRHeaderProps> = ({
  userName = "Trần Thị Thu Hà",
  userEmail = "hr.manager@company.com",
  notificationCount = 3
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="w-full sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
      <div className="w-full max-w-full px-6 sm:px-8 h-16 flex items-center justify-between">
        
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900 tracking-tight">Enterprise ATS</span>
              <span className="bg-blue-50 text-blue-700 border border-blue-200/60 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                HR Manager Workspace
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Trung tâm Điều hành Tuyển dụng Enterprise</p>
          </div>
        </div>

        {/* Search & Global Actions */}
        <div className="hidden md:flex items-center gap-4 flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm ứng viên, tờ trình, vị trí tuyển dụng..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Right User Profile & Controls */}
        <div className="flex items-center gap-3">
          
          {/* Notification Bell Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {notificationCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 z-50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-xs text-slate-900">Thông Báo Cần Xử Lý ({notificationCount})</span>
                  <button className="text-[10px] text-blue-600 hover:underline font-semibold cursor-pointer">Đánh dấu đã đọc</button>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100">
                    <div className="font-bold text-slate-800">REQ-2026-001 đang chờ phê duyệt</div>
                    <div className="text-[11px] text-slate-500">Kỹ sư Backend Senior — Phòng CNTT</div>
                  </div>
                  <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-100">
                    <div className="font-bold text-slate-800">Vị trí Senior Data Analyst quá SLA</div>
                    <div className="text-[11px] text-slate-500">Đã trễ 4 ngày so với tiến độ cam kết</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Badge */}
          <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-sm shadow-blue-500/20">
              HA
            </div>
            <div className="hidden sm:block text-xs">
              <span className="font-bold text-slate-900 block leading-tight">{userName}</span>
              <span className="text-slate-500 text-[10px] font-medium">Trưởng phòng Nhân sự</span>
            </div>
          </div>

          {/* Logout */}
          <Link 
            href="/login" 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-all cursor-pointer ml-1"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </Link>

        </div>
      </div>
    </header>
  );
};
