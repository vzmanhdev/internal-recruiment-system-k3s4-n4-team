'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, CheckCircle2, XCircle, Clock, AlertCircle, Eye, 
  MessageSquare, UserCheck, ArrowRight, Building2, DollarSign, Calendar
} from 'lucide-react';

interface ApprovalItem {
  id: string;
  code: string;
  type: 'requisition' | 'offer';
  title: string;
  department: string;
  requester: string;
  amount_or_headcount: string;
  current_step: number;
  total_steps: number;
  steps: Array<{
    step_num: number;
    role_name: string;
    approver_name?: string;
    status: 'approved' | 'pending' | 'rejected';
    updated_at?: string;
    comment?: string;
  }>;
  created_at: string;
}

export default function HRApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([
    {
      id: "APP-001",
      code: "REQ-2026-001",
      type: "requisition",
      title: "Tờ trình tuyển dụng Senior Backend Engineer",
      department: "Công Nghệ Thông Tin",
      requester: "Lê Văn Mạnh (Trưởng phòng CNTT)",
      amount_or_headcount: "3 chỉ tiêu (35 - 50 TR VNĐ)",
      current_step: 2,
      total_steps: 3,
      steps: [
        { step_num: 1, role_name: "Trưởng phòng chuyên môn", approver_name: "Lê Văn Mạnh", status: "approved", updated_at: "01/10/2026 09:00", comment: "Đã xác nhận nhu cầu dự án" },
        { step_num: 2, role_name: "Trưởng phòng Nhân sự (HR Manager)", approver_name: "Trần Thị Thu Hà", status: "pending" },
        { step_num: 3, role_name: "Ban Giám Đốc (CEO)", status: "pending" }
      ],
      created_at: "01/10/2026"
    },
    {
      id: "APP-002",
      code: "OFFER-2026-088",
      type: "offer",
      title: "Thư mời nhận việc (Offer) — Ứng viên Đỗ Hoàng Long",
      department: "Khối Dữ Liệu",
      requester: "Nguyễn Văn Hùng (Recruiter)",
      amount_or_headcount: "Lương 52 TR VNĐ (Vượt dải 12%)",
      current_step: 2,
      total_steps: 3,
      steps: [
        { step_num: 1, role_name: "Trưởng bộ phận", approver_name: "Phạm Quốc Tuấn", status: "approved", updated_at: "03/10/2026 14:30", comment: "Đánh giá xuất sắc, đồng ý vượt band" },
        { step_num: 2, role_name: "Trưởng phòng Nhân sự (HR Manager)", approver_name: "Trần Thị Thu Hà", status: "pending" },
        { step_num: 3, role_name: "Ban Giám Đốc (CEO)", status: "pending" }
      ],
      created_at: "03/10/2026"
    }
  ]);

  const [selectedApp, setSelectedApp] = useState<ApprovalItem | null>(null);
  const [actionComment, setActionComment] = useState('');

  const handleDecision = (decision: 'approved' | 'rejected') => {
    if (!selectedApp) return;

    setApprovals(prev => prev.map(item => {
      if (item.id === selectedApp.id) {
        const updatedSteps = item.steps.map(step => {
          if (step.step_num === item.current_step) {
            return {
              ...step,
              status: decision,
              comment: actionComment || (decision === 'approved' ? "HR Manager đã phê duyệt" : "HR Manager từ chối"),
              updated_at: new Date().toLocaleString()
            };
          }
          return step;
        });

        const nextStep = decision === 'approved' ? item.current_step + 1 : item.current_step;
        return {
          ...item,
          current_step: nextStep,
          steps: updatedSteps
        };
      }
      return item;
    }));

    alert(`Đã thực hiện ${decision === 'approved' ? 'Phê duyệt' : 'Từ chối'} cho ${selectedApp.code}`);
    setSelectedApp(null);
    setActionComment('');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Trung Tâm Phê Duyệt Tuyển Dụng 3 Cấp</h1>
          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
            [S3-01] Approval Engine
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">Duyệt tờ trình tuyển dụng & offer vượt dải lương theo luồng phê duyệt 3 cấp động</p>
      </div>

      {/* Main Queue List */}
      <div className="space-y-4">
        {approvals.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4 hover:shadow-md transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${
                  item.type === 'requisition' ? 'bg-blue-600' : 'bg-emerald-600'
                }`}>
                  {item.type === 'requisition' ? <Building2 className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-slate-100 text-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded">
                      {item.code}
                    </span>
                    <h2 className="text-base font-bold text-slate-900">{item.title}</h2>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Phòng ban: <strong>{item.department}</strong> | Người yêu cầu: <strong>{item.requester}</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setSelectedApp(item)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Xử Lý Phê Duyệt</span>
                </button>
              </div>
            </div>

            {/* 3-Step Dynamic Approval Timeline */}
            <div>
              <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-3">
                Tiến Độ Luồng Phê Duyệt (Cấp {item.current_step}/{item.total_steps})
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {item.steps.map((step) => (
                  <div 
                    key={step.step_num}
                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                      step.status === 'approved' 
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' 
                        : step.status === 'pending' && step.step_num === item.current_step
                        ? 'bg-amber-50/70 border-amber-200 text-amber-900 shadow-sm animate-pulse'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>Cấp {step.step_num}: {step.role_name}</span>
                      {step.status === 'approved' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      {step.status === 'pending' && <Clock className="w-4 h-4 text-amber-600" />}
                    </div>
                    {step.approver_name && (
                      <div className="text-[11px]">Người duyệt: <strong>{step.approver_name}</strong></div>
                    )}
                    {step.comment && (
                      <p className="text-[11px] italic text-slate-600">"{step.comment}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Decision Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Phê Duyệt: {selectedApp.code}</h3>
              <button onClick={() => setSelectedApp(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="font-bold text-slate-900">{selectedApp.title}</div>
                <div className="text-slate-600">Chi tiết: {selectedApp.amount_or_headcount}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ý Kiến Phê Duyệt / Nhận Xét (Không bắt buộc)</label>
                <textarea 
                  rows={3}
                  placeholder="Ghi nhận xét của Trưởng phòng HR..."
                  value={actionComment}
                  onChange={(e) => setActionComment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button 
                onClick={() => handleDecision('rejected')}
                className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all"
              >
                Từ Chối
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedApp(null)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold">Hủy</button>
                <button 
                  onClick={() => handleDecision('approved')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
                >
                  Phê Duyệt (Approve)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
