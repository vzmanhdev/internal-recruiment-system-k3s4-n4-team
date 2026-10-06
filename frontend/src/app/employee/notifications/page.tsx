"use client";

import React, { useState } from "react";
import { EmployeeAppShell } from "@/components/layout/EmployeeAppShell";
import { Bell, FileText, Calendar, UserCheck, CheckCircle2 } from "lucide-react";

export default function EmployeeNotificationsPage() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Tin tuyển dụng mới phù hợp với bạn",
      message: "Vị trí Senior Backend Engineer vừa được đăng tuyển trong Phòng Công nghệ.",
      time: "2 giờ trước",
      type: "JOB",
      isUnread: true,
    },
    {
      id: 2,
      title: "Lịch phỏng vấn sắp tới",
      message: "Bạn có lịch phỏng vấn vị trí Backend Engineer vào 09:00 ngày 25/10/2024 tại Phòng họp 3.",
      time: "4 giờ trước",
      type: "INTERVIEW",
      isUnread: true,
    },
    {
      id: 3,
      title: "Trạng thái ứng viên đã thay đổi",
      message: "Ứng viên Nguyễn Thị Mai bạn giới thiệu đã chuyển sang vòng phỏng vấn chuyên môn.",
      time: "1 ngày trước",
      type: "REFERRAL",
      isUnread: false,
    },
  ]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
  };

  return (
    <EmployeeAppShell activeTab="notifications">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Bell className="w-7 h-7 text-[#4285F4]" />
              Thông Báo Nhân Viên
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Cập nhật thông tin công việc, lịch phỏng vấn và trạng thái giới thiệu ứng viên nội bộ.
            </p>
          </div>

          <button
            onClick={markAllAsRead}
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-slate-500" />
            <span>Đánh dấu tất cả đã đọc</span>
          </button>
        </div>

        {/* Notification Feed */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs divide-y divide-gray-100 overflow-hidden">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 flex items-start gap-4 transition-colors ${
                n.isUnread ? "bg-blue-50/40" : "hover:bg-slate-50"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                  n.type === "JOB"
                    ? "bg-purple-100 text-purple-600"
                    : n.type === "INTERVIEW"
                    ? "bg-amber-100 text-amber-600"
                    : "bg-blue-100 text-[#4285F4]"
                }`}
              >
                {n.type === "JOB" ? (
                  <FileText className="w-4 h-4" />
                ) : n.type === "INTERVIEW" ? (
                  <Calendar className="w-4 h-4" />
                ) : (
                  <UserCheck className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs text-slate-900">{n.title}</h4>
                  <span className="text-[10px] text-slate-400 font-semibold">{n.time}</span>
                </div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </EmployeeAppShell>
  );
}
