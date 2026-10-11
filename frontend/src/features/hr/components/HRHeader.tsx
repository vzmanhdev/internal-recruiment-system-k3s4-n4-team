'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Building2, Bell, Search, LogOut
} from 'lucide-react';
import { authService, type UserItem } from '@/features/auth/services/auth.service';
import { useNotifications, unreadLabel } from '@/hooks/useNotifications';
import { notificationService } from '@/services/notification.service';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Quản trị hệ thống', hr_manager: 'Trưởng phòng Nhân sự', recruiter: 'Chuyên viên tuyển dụng',
  hiring_manager: 'Quản lý tuyển dụng', approver: 'Người phê duyệt', interviewer: 'Người phỏng vấn', employee: 'Nhân viên',
};

export const HRHeader: React.FC = () => {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [query, setQuery] = useState('');
  const [user, setUser] = useState<UserItem | null>(null);
  const [mounted, setMounted] = useState(false);
  const notifications = useNotifications();

  useEffect(() => {
    setUser(authService.getUserInfo());
    setMounted(true);
  }, []);

  const userName = (mounted && user) ? (user.full_name || user.email || 'Người dùng') : 'Người dùng';
  const roleLabel = (mounted && user) ? ((user.roles || []).map((r) => ROLE_LABELS[r]).find(Boolean) || '') : '';
  const initials = userName.split(' ').filter(Boolean).slice(-2).map((x) => x[0]).join('').toUpperCase();

  const logout = async () => {
    await authService.logout();
    router.replace('/login');
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
    } finally {
      notifications.refresh();
    }
  };

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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && query.trim()) router.push(`/hr/candidates?q=${encodeURIComponent(query.trim())}`); }}
              placeholder="Tìm kiếm ứng viên (Enter)..."
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
              {notifications.unread > 0 && (
                <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {unreadLabel(notifications.unread)}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 z-50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-xs text-slate-900">Thông báo chưa đọc ({notifications.unread})</span>
                  <button onClick={markAllRead} className="text-[10px] text-blue-600 hover:underline font-semibold cursor-pointer">Đánh dấu đã đọc</button>
                </div>
                <div className="space-y-2 text-xs">
                  {notifications.items.length === 0 ? (
                    <div className="p-3 text-center text-[11px] text-slate-400">Chưa có thông báo nào.</div>
                  ) : notifications.items.map((n) => (
                    <Link
                      key={n.id}
                      href={n.link || '/employee/notifications'}
                      onClick={() => { setShowNotifications(false); if (!n.is_read) notifications.markRead(n.id); }}
                      className={`block p-2.5 rounded-xl border ${n.is_read ? 'border-slate-100' : 'bg-blue-50/60 border-blue-100'}`}
                    >
                      <div className="font-bold text-slate-800">{n.title}</div>
                      {n.message && <div className="text-[11px] text-slate-500 line-clamp-2">{n.message}</div>}
                    </Link>
                  ))}
                  <Link href="/employee/notifications" onClick={() => setShowNotifications(false)} className="block text-center text-[11px] font-bold text-blue-600 pt-1">Xem tất cả &rarr;</Link>
                </div>
              </div>
            )}
          </div>

          {/* User Badge */}
          <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
            <div 
              suppressHydrationWarning
              className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-sm shadow-blue-500/20"
            >
              {initials}
            </div>
            <div className="hidden sm:block text-xs">
              <span suppressHydrationWarning className="font-bold text-slate-900 block leading-tight">{userName}</span>
              <span suppressHydrationWarning className="text-slate-500 text-[10px] font-medium">{roleLabel}</span>
            </div>
          </div>

          {/* Logout */}
          <button 
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-all cursor-pointer ml-1"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>

        </div>
      </div>
    </header>
  );
};
