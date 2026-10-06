'use client';

import React, { useState } from 'react';
import { 
  DollarSign, AlertTriangle, CheckCircle2, XCircle, Clock, ShieldAlert, 
  Plus, Search, Filter, FileText, Send, Eye
} from 'lucide-react';

interface OfferItem {
  id: string;
  code: string;
  candidate_name: string;
  position: string;
  department: string;
  offered_salary: number; // TR VNĐ
  max_band_salary: number; // TR VNĐ
  is_over_band: boolean;
  over_percentage: number;
  start_date: string;
  status: 'pending_approval' | 'approved' | 'sent_to_candidate' | 'accepted' | 'declined';
  created_at: string;
}

export default function HROffersPage() {
  const [offers, setOffers] = useState<OfferItem[]>([
    {
      id: "OFF-001",
      code: "OFFER-2026-088",
      candidate_name: "Đỗ Hoàng Long",
      position: "Senior Backend Engineer",
      department: "Công Nghệ Thông Tin",
      offered_salary: 52,
      max_band_salary: 50,
      is_over_band: true,
      over_percentage: 4,
      start_date: "15/10/2026",
      status: "pending_approval",
      created_at: "03/10/2026"
    },
    {
      id: "OFF-002",
      code: "OFFER-2026-085",
      candidate_name: "Phạm Văn Minh",
      position: "Senior DevOps Engineer",
      department: "Công Nghệ Thông Tin",
      offered_salary: 45,
      max_band_salary: 60,
      is_over_band: false,
      over_percentage: 0,
      start_date: "20/10/2026",
      status: "accepted",
      created_at: "28/09/2026"
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quản Lý Thư Mời Nhận Việc (Offer Letters)</h1>
            <span className="bg-amber-50 text-amber-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200">
              [S7-03] Salary Band Warning
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Lập thư mời nhận việc, phát hiện & cảnh báo đỏ Offer vượt dải lương chuẩn để trình CEO duyệt ngoại lệ</p>
        </div>

        <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer">
          <Plus className="w-4 h-4" />
          <span>Tạo Offer Mới</span>
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Mã Offer & Ứng Viên</th>
                <th className="p-4">Vị Trí & Phòng Ban</th>
                <th className="p-4 text-center">Lương Đề Xuất</th>
                <th className="p-4 text-center">Khung Lương Tối Đa</th>
                <th className="p-4">Cảnh Báo Vượt Dải [S7-03]</th>
                <th className="p-4 text-center">Ngày Đi Làm Target</th>
                <th className="p-4 text-center">Trạng Thái Offer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {offers.map((off) => (
                <tr key={off.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{off.candidate_name}</div>
                    <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">{off.code}</span>
                  </td>

                  <td className="p-4">
                    <div className="font-bold text-slate-800">{off.position}</div>
                    <div className="text-[11px] text-slate-400">{off.department}</div>
                  </td>

                  <td className="p-4 text-center font-extrabold text-slate-900 font-mono">
                    {off.offered_salary} TR VNĐ
                  </td>

                  <td className="p-4 text-center font-bold text-slate-500 font-mono">
                    {off.max_band_salary} TR VNĐ
                  </td>

                  {/* Over-band Badge */}
                  <td className="p-4">
                    {off.is_over_band ? (
                      <span className="bg-rose-50 text-rose-600 border border-rose-200 px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 w-max animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>Vượt dải +{off.over_percentage}% (Cần CEO duyệt)</span>
                      </span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 w-max">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Trong dải lương</span>
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-center font-semibold text-slate-800">
                    {off.start_date}
                  </td>

                  <td className="p-4 text-center">
                    {off.status === 'pending_approval' && <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-[10px] font-extrabold border border-amber-100">Chờ Phê Duyệt</span>}
                    {off.status === 'accepted' && <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-extrabold border border-emerald-100">Ứng Viên Đã Đồng Ý</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
