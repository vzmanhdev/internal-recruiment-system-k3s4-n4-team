'use client';

import React, { useState } from 'react';
import { 
  Layers, Plus, ShieldCheck, CheckCircle2, ArrowRight, Building2, 
  DollarSign, Edit2, History
} from 'lucide-react';

interface ApprovalFlowRule {
  id: string;
  name: string;
  department: string;
  min_salary_threshold: number;
  max_salary_threshold: number;
  version: string;
  steps: Array<{
    step_num: number;
    role: string;
    description: string;
  }>;
  status: 'active' | 'draft';
}

export default function HRApprovalFlowsPage() {
  const [flows, setFlows] = useState<ApprovalFlowRule[]>([
    {
      id: "FLOW-001",
      name: "Luồng Duyệt Tuyển Dụng Khối CNTT (Dưới 50 Tr VNĐ)",
      department: "Công Nghệ Thông Tin",
      min_salary_threshold: 0,
      max_salary_threshold: 50,
      version: "v2.1",
      steps: [
        { step_num: 1, role: "HIRING_MANAGER", description: "Trưởng phòng chuyên môn đề xuất" },
        { step_num: 2, role: "HR_MANAGER", description: "Trưởng phòng Nhân sự thẩm định định biên & dải lương" },
        { step_num: 3, role: "CEO", description: "Ban Giám Đốc phê duyệt cuối" }
      ],
      status: "active"
    },
    {
      id: "FLOW-002",
      name: "Luồng Duyệt Offer Vượt Band Lương (> 50 Tr VNĐ)",
      department: "Toàn Doanh Nghiệp",
      min_salary_threshold: 50,
      max_salary_threshold: 150,
      version: "v3.0",
      steps: [
        { step_num: 1, role: "RECRUITER", description: "Recruiter trình giải trình vượt dải" },
        { step_num: 2, role: "HR_MANAGER", description: "Trưởng phòng HR xem xét tài chính" },
        { step_num: 3, role: "CEO", description: "CEO phê duyệt ngoại lệ" }
      ],
      status: "active"
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cấu Hình Luồng Phê Duyệt Động (Approval Flows)</h1>
            <span className="bg-purple-50 text-purple-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-purple-200">
              [S3-01] Dynamic Versioning
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Định nghĩa quy trình duyệt 2–3 cấp theo phòng ban & dải lương. Thay đổi luồng mới không ảnh hưởng luồng đang chạy</p>
        </div>

        <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer">
          <Plus className="w-4 h-4" />
          <span>Tạo Luồng Duyệt Mới</span>
        </button>
      </div>

      {/* Main Flow List */}
      <div className="space-y-4">
        {flows.map((flow) => (
          <div key={flow.id} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4 hover:shadow-md transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">{flow.name}</h2>
                  <span className="font-mono bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                    {flow.version}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Phòng ban áp dụng: <strong>{flow.department}</strong> | Ngưỡng lương: <strong>{flow.min_salary_threshold} - {flow.max_salary_threshold} TR VNĐ</strong>
                </div>
              </div>

              <span className="bg-emerald-50 text-emerald-700 font-extrabold text-[10px] px-2.5 py-1 rounded-full border border-emerald-200 w-max">
                Đang Áp Dụng
              </span>
            </div>

            {/* Steps Visualizer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {flow.steps.map((step) => (
                <div key={step.step_num} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>Cấp {step.step_num}: {step.role}</span>
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-[11px] text-slate-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
