'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, FileText, Clock, LogOut } from 'lucide-react';

export default function ApproverWorkspacePage() {
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');

  const pendingApprovals = [
    { id: 'REQ-2026-001', title: 'Kỹ sư Backend Senior (Python/FastAPI)', department: 'Công Nghệ Thông Tin', quantity: 2, salary: '25tr - 35tr VNĐ', type: 'Tờ Trình Tuyển Dụng', priority: 'Cao', status: 'Chờ duyệt' },
    { id: 'OFFER-2026-088', title: 'Đề xuất Offer: Đỗ Hoàng Long', department: 'Phân Tích Dữ Liệu', quantity: 1, salary: '45tr VNĐ (Vượt dải 12%)', type: 'Offer Thư Mời Nhận Việc', priority: 'Vượt hạn mức', status: 'Chờ duyệt' },
  ];

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 font-sans flex flex-col antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
        <div className="w-full max-w-full px-6 sm:px-8 lg:px-10 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900">Approver Workspace</span>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Ban Giám Đốc / Người Duyệt
                </span>
              </div>
              <p className="text-xs text-slate-500">Phê duyệt Yêu cầu tuyển dụng REQ & Offer vượt hạn mức lương</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-slate-50 border border-gray-100 px-3.5 py-1.5 rounded-full">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-xs">
                BD
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-800 block leading-none">Phạm Văn Hùng (Ban Giám Đốc)</span>
                <span className="text-slate-400 text-[10px]">approver@company.com</span>
              </div>
            </div>
            <Link href="/login" className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-gray-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold">
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 w-full max-w-full px-6 sm:px-8 lg:px-10 py-6 flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <div className="bg-white rounded-[24px] border border-gray-100 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Danh Sách Hồ Sơ Chờ Bạn Duyệt (2)</h2>
            <p className="text-xs text-slate-500 mb-6">Thẩm định tờ trình tuyển dụng và đề xuất mức lương vượt hạn mức dải chuẩn</p>

            <div className="space-y-4">
              {pendingApprovals.map((req) => (
                <div key={req.id} className="border border-amber-200/60 bg-amber-50/20 hover:bg-amber-50/40 rounded-2xl p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">{req.id}: {req.title}</span>
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">{req.type}</span>
                    </div>
                    <p className="text-xs text-slate-600">Phòng ban: <strong>{req.department}</strong> | Dải lương: <strong>{req.salary}</strong></p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setSelectedReq(req)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                    >
                      Thẩm Định & Duyệt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Thẩm Định & Duyệt */}
        {selectedReq && (
          <div className="w-full lg:w-96 bg-white rounded-[24px] border border-gray-100 p-6 shadow-xl h-fit space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Thẩm Định Hồ Sơ</h3>
              <button onClick={() => setSelectedReq(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer">Đóng ✕</button>
            </div>

            <div className="text-xs space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-gray-100">
                <span className="font-bold block text-slate-900">{selectedReq.id}</span>
                <span className="text-slate-600">{selectedReq.title}</span>
                <span className="block text-slate-500 mt-1">Dải lương: {selectedReq.salary}</span>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">Ý kiến phê duyệt / Lý do từ chối:</label>
                <textarea 
                  rows={3} 
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập ý kiến chỉ đạo hoặc lý do từ chối..." 
                  className="w-full p-2.5 border border-gray-200 rounded-xl bg-slate-50 text-xs" 
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button 
                  onClick={() => { alert('Đã từ chối hồ sơ thành công!'); setSelectedReq(null); }}
                  className="py-2.5 bg-rose-50 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs hover:bg-rose-100 transition-all cursor-pointer"
                >
                  ✕ Từ Chối
                </button>
                <button 
                  onClick={() => { alert('Đã phê duyệt hồ sơ thành công!'); setSelectedReq(null); }}
                  className="py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 transition-all cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  ✓ Phê Duyệt
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
