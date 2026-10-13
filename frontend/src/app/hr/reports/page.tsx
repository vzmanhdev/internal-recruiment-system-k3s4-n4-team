'use client';

import React, { useState } from 'react';
import { 
  BarChart3, Download, Calendar, Filter, FileSpreadsheet, TrendingUp, 
  Users, Clock, CheckCircle2, DollarSign, Building2, RefreshCw
} from 'lucide-react';

export default function HRReportsPage() {
  const [dateRange, setDateRange] = useState('q3_2026');
  const [selectedDept, setSelectedDept] = useState('all');
  const [exporting, setExporting] = useState(false);

  const handleExportExcel = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      alert("Đã xuất dữ liệu báo cáo Báo Cáo Tuyển Dụng Tổng Hợp thành tệp Excel (.xlsx) thành công!");
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Trung Tâm Báo Cáo & Phân Tích Tuyển Dụng</h1>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
              [S9-01] [S9-04] Excel Export
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Tổng hợp báo cáo phễu chuyển đổi, thời gian tuyển trung bình (Time-to-Hire) & Xuất báo cáo Excel theo quy định</p>
        </div>

        <button 
          onClick={handleExportExcel}
          disabled={exporting}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
        >
          <FileSpreadsheet className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
          <span>{exporting ? 'Đang Xuất Excel...' : 'Xuất Báo Cáo Excel (.xlsx)'}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Kỳ báo cáo:</span>
          </div>

          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
          >
            <option value="q3_2026">Quý 3/2026 (01/07/2026 - 30/09/2026)</option>
            <option value="q4_2026">Quý 4/2026 (01/10/2026 - 31/12/2026)</option>
            <option value="year_2026">Cả Năm 2026</option>
          </select>

          <select 
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
          >
            <option value="all">Tất cả phòng ban</option>
            <option value="IT">Công Nghệ Thông Tin</option>
            <option value="DATA">Khối Dữ Liệu</option>
          </select>
        </div>
      </div>

      {/* KPI Report Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-1">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tổng Vị Trí Đã Đóng</div>
          <div className="text-2xl font-black text-slate-900">18/22</div>
          <div className="text-xs text-emerald-600 font-bold">Đạt 81.8% chỉ tiêu</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-1">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Thời Gian Tuyển TB (Time-to-Hire)</div>
          <div className="text-2xl font-black text-blue-600">24.5 ngày</div>
          <div className="text-xs text-slate-500">Giảm 3.2 ngày so với Q2</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-1">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tỷ Lệ Nhận Offer (Offer Acceptance)</div>
          <div className="text-2xl font-black text-purple-600">92.3%</div>
          <div className="text-xs text-emerald-600 font-bold">Cao hơn 5% so với target</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-1">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Chi Phí / 1 Nhân Sự (Cost-per-Hire)</div>
          <div className="text-2xl font-black text-slate-900">8.5 TR VNĐ</div>
          <div className="text-xs text-slate-500">Nằm trong định biên ngân sách</div>
        </div>
      </div>

      {/* Main Report Preview Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">Chi Tiết Hiệu Quả Tuyển Dụng Theo Phòng Ban [S9-01]</h2>
          <span className="text-xs text-slate-400">Xem trước bản xem dữ liệu trước khi xuất Excel</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase">
                <th className="p-3">Phòng Ban</th>
                <th className="p-3 text-center">Chỉ Tiêu Tuyển</th>
                <th className="p-3 text-center">Đã Tuyển Đủ</th>
                <th className="p-3 text-center">Tổng Hồ Sơ (CV)</th>
                <th className="p-3 text-center">Phỏng Vấn</th>
                <th className="p-3 text-center">Offer Phát Ra</th>
                <th className="p-3 text-center">Time-to-Hire</th>
                <th className="p-3 text-center">Tỷ Lệ Thành Công</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
              <tr className="hover:bg-slate-50/70">
                <td className="p-3 font-bold text-slate-900">Công Nghệ Thông Tin</td>
                <td className="p-3 text-center">12</td>
                <td className="p-3 text-center text-emerald-600 font-bold">10</td>
                <td className="p-3 text-center">145</td>
                <td className="p-3 text-center">32</td>
                <td className="p-3 text-center">11</td>
                <td className="p-3 text-center">26 ngày</td>
                <td className="p-3 text-center text-blue-600 font-bold">83.3%</td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="p-3 font-bold text-slate-900">Khối Dữ Liệu & BI</td>
                <td className="p-3 text-center">6</td>
                <td className="p-3 text-center text-emerald-600 font-bold">5</td>
                <td className="p-3 text-center">68</td>
                <td className="p-3 text-center">16</td>
                <td className="p-3 text-center">6</td>
                <td className="p-3 text-center">21 ngày</td>
                <td className="p-3 text-center text-blue-600 font-bold">83.3%</td>
              </tr>
              <tr className="hover:bg-slate-50/70">
                <td className="p-3 font-bold text-slate-900">Marketing & Growth</td>
                <td className="p-3 text-center">4</td>
                <td className="p-3 text-center text-emerald-600 font-bold">3</td>
                <td className="p-3 text-center">52</td>
                <td className="p-3 text-center">10</td>
                <td className="p-3 text-center">3</td>
                <td className="p-3 text-center">18 ngày</td>
                <td className="p-3 text-center text-blue-600 font-bold">75.0%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
