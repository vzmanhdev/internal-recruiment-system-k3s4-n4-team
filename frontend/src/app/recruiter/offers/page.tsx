'use client';

import React, { useState } from 'react';
import { Mail, Plus, FileText, CheckCircle2, Clock, Send, DollarSign, Award, ChevronRight } from 'lucide-react';

export default function RecruiterOffersPage() {
  const offers = [
    {
      id: 'OFF-2026-01',
      candidate: 'Lê Hoàng Cường',
      position: 'Senior Backend Engineer (Go/Python)',
      salaryOffer: '48.000.000 VNĐ / tháng',
      status: 'Chờ duyệt mức lương',
      approvalLevel: 'HM & HR Lead đã duyệt, Chờ GD Khối',
      sendDate: 'Hôm nay',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'OFF-2026-02',
      candidate: 'Lê Hoàng Yến',
      position: 'Product Owner / BA Lead',
      salaryOffer: '36.000.000 VNĐ / tháng',
      status: 'Sẵn sàng gửi',
      approvalLevel: 'Đã hoàn tất duyệt 3 cấp',
      sendDate: 'Hôm qua',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'OFF-2026-03',
      candidate: 'Phạm Minh Đức',
      position: 'DevOps Engineer',
      salaryOffer: '38.000.000 VNĐ / tháng',
      status: 'Ứng viên đã chấp nhận',
      approvalLevel: 'Đã ký hợp đồng thử việc',
      sendDate: '01/10/2026',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Mail className="w-7 h-7 text-blue-600" />
            <span>Quản Lý Offer & Thư Tuyển Dụng</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Soạn thảo đề xuất mức lương, theo dõi cấp duyệt và phát hành thư mời làm việc chính thức.
          </p>
        </div>

        <button className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>+ Soạn Thảo Đề Xuất Offer</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Danh Sách Đề Xuất Offer Gần Đây</span>
        </h3>

        <div className="divide-y divide-slate-100 text-xs">
          {offers.map((off) => (
            <div key={off.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 -mx-3 px-3 rounded-xl transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900">{off.candidate}</span>
                  <span className="text-[10px] font-mono text-slate-400">({off.id})</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${off.badgeColor}`}>
                    {off.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {off.position} &bull; <strong className="text-slate-800">Mức đề xuất: {off.salaryOffer}</strong>
                </div>
                <div className="text-[10px] text-slate-400">{off.approvalLevel}</div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto">
                <button className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs">
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi Thư Mời</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
