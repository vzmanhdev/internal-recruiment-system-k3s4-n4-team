'use client';

import React, { useState } from 'react';
import { 
  Target, AlertTriangle, ShieldCheck, Plus, CheckCircle2, Clock, 
  Building2, ArrowRight, ShieldAlert, FileText, Search
} from 'lucide-react';

interface HeadcountItem {
  id: string;
  department: string;
  position_title: string;
  target_headcount: number;
  current_headcount: number;
  remaining_headcount: number;
  approved_budget: string;
  status: 'normal' | 'near_limit' | 'exceeded';
}

export default function HRHeadcountPage() {
  const [headcounts, setHeadcounts] = useState<HeadcountItem[]>([
    {
      id: "HC-001",
      department: "Công Nghệ Thông Tin",
      position_title: "Kỹ sư Senior Backend (Python/FastAPI)",
      target_headcount: 10,
      current_headcount: 8,
      remaining_headcount: 2,
      approved_budget: "45.0 Triệu VNĐ / người",
      status: "normal"
    },
    {
      id: "HC-002",
      department: "Công Nghệ Thông Tin",
      position_title: "Chuyên viên Senior DevOps",
      target_headcount: 3,
      current_headcount: 3,
      remaining_headcount: 0,
      approved_budget: "50.0 Triệu VNĐ / người",
      status: "near_limit"
    },
    {
      id: "HC-003",
      department: "Khối Dữ Liệu",
      position_title: "Trưởng nhóm Data Analyst & BI",
      target_headcount: 2,
      current_headcount: 3,
      remaining_headcount: -1,
      approved_budget: "55.0 Triệu VNĐ / người",
      status: "exceeded"
    }
  ]);

  const [overrideModal, setOverrideModal] = useState<HeadcountItem | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [additionalHeadcount, setAdditionalHeadcount] = useState(1);

  const handleOverrideSubmit = () => {
    if (!overrideModal || !overrideReason.trim()) {
      alert("Vui lòng nhập lý do giải trình ghi đè Headcount!");
      return;
    }

    setHeadcounts(prev => prev.map(item => {
      if (item.id === overrideModal.id) {
        const newTarget = item.target_headcount + additionalHeadcount;
        const newRemaining = newTarget - item.current_headcount;
        return {
          ...item,
          target_headcount: newTarget,
          remaining_headcount: newRemaining,
          status: newRemaining >= 0 ? 'normal' : 'exceeded'
        };
      }
      return item;
    }));

    alert(`Đã ghi đè chỉ tiêu Headcount cho "${overrideModal.position_title}" thêm +${additionalHeadcount} người. Lý do giải trình: ${overrideReason}`);
    setOverrideModal(null);
    setOverrideReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ngân Sách Headcount & Quyền Ghi Đè (Override)</h1>
            <span className="bg-rose-50 text-rose-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-rose-200">
              [S3-04] HR Manager Exclusive
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Khai báo chỉ tiêu nhân sự, theo dõi định biên & thực hiện ghi đè (Override) khi vượt chỉ tiêu kèm lý do giải trình</p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Phòng Ban & Chức Danh</th>
                <th className="p-4 text-center">Chỉ Tiêu (Target)</th>
                <th className="p-4 text-center">Hiện Có (Occupied)</th>
                <th className="p-4 text-center">Còn Lại (Remaining)</th>
                <th className="p-4">Dải Lương / Ngân Sách Duyệt</th>
                <th className="p-4 text-center">Trạng Thái Định Biên</th>
                <th className="p-4 text-right">Thao Tác HR Manager</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {headcounts.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{item.position_title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{item.department}</div>
                  </td>

                  <td className="p-4 text-center font-extrabold text-slate-900">
                    {item.target_headcount} người
                  </td>

                  <td className="p-4 text-center font-bold text-slate-700">
                    {item.current_headcount} người
                  </td>

                  <td className="p-4 text-center font-extrabold">
                    <span className={item.remaining_headcount < 0 ? 'text-rose-600 font-black' : item.remaining_headcount === 0 ? 'text-amber-600' : 'text-emerald-600'}>
                      {item.remaining_headcount} người
                    </span>
                  </td>

                  <td className="p-4 text-slate-600 font-mono text-[11px]">
                    {item.approved_budget}
                  </td>

                  <td className="p-4 text-center">
                    {item.status === 'exceeded' ? (
                      <span className="bg-rose-50 text-rose-600 border border-rose-200 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Vượt Headcount</span>
                      </span>
                    ) : item.status === 'near_limit' ? (
                      <span className="bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Chạm Hạn Định Biên</span>
                      </span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>An Toàn</span>
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-right">
                    <button 
                      onClick={() => setOverrideModal(item)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer inline-flex items-center gap-1"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Ghi Đè (Override)</span>
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Override Modal */}
      {overrideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900">Ghi Đè Ngân Sách Headcount [S3-04]</h3>
              </div>
              <button onClick={() => setOverrideModal(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 space-y-1">
                <div className="font-bold text-slate-900">{overrideModal.position_title}</div>
                <div className="text-slate-600">Phòng ban: <strong>{overrideModal.department}</strong></div>
                <div className="text-rose-700 font-bold">Chỉ tiêu hiện tại: {overrideModal.target_headcount} | Đã tuyển: {overrideModal.current_headcount}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số Lượng Headcount Bổ Sung Thêm *</label>
                <input 
                  type="number"
                  min={1}
                  max={10}
                  value={additionalHeadcount}
                  onChange={(e) => setAdditionalHeadcount(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lý Do Giải Trình Ghi Đè (Bắt Buộc Lưu Audit Log) *</label>
                <textarea 
                  rows={3}
                  placeholder="Nhập lý do giải trình đặc biệt bổ sung chỉ tiêu tuyển dụng vượt ngân sách ban đầu..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setOverrideModal(null)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold">Bỏ Qua</button>
              <button onClick={handleOverrideSubmit} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20">Xác Nhận Ghi Đè Headcount</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
