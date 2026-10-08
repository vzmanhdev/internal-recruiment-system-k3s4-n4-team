"use client";

import React, { useState } from "react";
import { EmployeeAppShell } from "@/components/layout/EmployeeAppShell";
import { CheckSquare, Plus, Search, User, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function MyReferralsPage() {
  const [search, setSearch] = useState("");

  const [referrals, setReferrals] = useState([
    {
      id: 1,
      candidateName: "Nguyễn Thị Mai",
      jobTitle: "UX/UI Designer",
      email: "mai.nguyen@example.com",
      phone: "0912 345 678",
      submittedDate: "12/10/2024",
      status: "IN_REVIEW",
      statusLabel: "Đang xét duyệt",
      statusBadge: "bg-amber-50 text-amber-700 border-amber-200",
      note: "Hồ sơ đã chuyển tới Trưởng nhóm Thiết kế rà soát.",
    },
    {
      id: 2,
      candidateName: "Lê Hoàng Minh",
      jobTitle: "Senior Backend Engineer",
      email: "minh.le@example.com",
      phone: "0988 765 432",
      submittedDate: "05/10/2024",
      status: "INTERVIEWED",
      statusLabel: "Đã phỏng vấn",
      statusBadge: "bg-blue-50 text-[#4285F4] border-blue-200",
      note: "Hoàn thành 2 vòng phỏng vấn kỹ thuật với kết quả Tốt.",
    },
    {
      id: 3,
      candidateName: "Phạm Thu Hà",
      jobTitle: "Chuyên Viên Tuyển Dụng",
      email: "ha.pham@example.com",
      phone: "0904 112 233",
      submittedDate: "20/09/2024",
      status: "HIRED",
      statusLabel: "Đã tuyển dụng",
      statusBadge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      note: "Đã nhận việc thành công vào ngày 01/10/2024.",
    },
  ]);

  return (
    <EmployeeAppShell activeTab="my-referrals">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <CheckSquare className="w-7 h-7 text-[#4285F4]" />
              Danh Sách Ứng Viên Đã Giới Thiệu
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Theo dõi tiến trình phỏng vấn, kết quả xét duyệt và thưởng giới thiệu nhân sự nội bộ.
            </p>
          </div>

          <Link
            href="/employee/referrals/new"
            className="px-4 py-2.5 rounded-xl bg-[#4285F4] text-white hover:bg-blue-600 text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Giới thiệu ứng viên mới</span>
          </Link>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Tìm theo tên ứng viên, email hoặc vị trí..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#4285F4]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100 font-extrabold uppercase text-[11px] text-slate-500">
                  <th className="py-3.5 px-4">Ứng viên</th>
                  <th className="py-3.5 px-4">Vị trí giới thiệu</th>
                  <th className="py-3.5 px-4">Ngày giới thiệu</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4">Ghi chú tiến trình</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {referrals.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{r.candidateName}</div>
                      <div className="text-[11px] text-slate-400">{r.email} • {r.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-blue-600">{r.jobTitle}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-semibold">{r.submittedDate}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full border text-[10px] font-extrabold ${r.statusBadge}`}>
                        {r.statusLabel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </EmployeeAppShell>
  );
}
