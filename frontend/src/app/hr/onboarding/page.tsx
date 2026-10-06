'use client';

import React, { useState } from 'react';
import { 
  CheckSquare, CheckCircle2, Circle, UserCheck, Laptop, Key, BookOpen, 
  Calendar, Building2, ChevronRight
} from 'lucide-react';

interface OnboardingTask {
  id: string;
  candidate_name: string;
  position: string;
  department: string;
  start_date: string;
  mentor_name: string;
  checklist: {
    it_account: boolean;
    laptop_assigned: boolean;
    contract_signed: boolean;
    orientation_done: boolean;
  };
}

export default function HROnboardingPage() {
  const [onboardings, setOnboardings] = useState<OnboardingTask[]>([
    {
      id: "ONB-001",
      candidate_name: "Phạm Văn Minh",
      position: "Senior DevOps Engineer",
      department: "Công Nghệ Thông Tin",
      start_date: "20/10/2026",
      mentor_name: "Nguyễn Văn Hùng",
      checklist: {
        it_account: true,
        laptop_assigned: true,
        contract_signed: true,
        orientation_done: false
      }
    }
  ]);

  const toggleCheck = (id: string, key: keyof OnboardingTask['checklist']) => {
    setOnboardings(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          checklist: {
            ...item.checklist,
            [key]: !item.checklist[key]
          }
        };
      }
      return item;
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Checklist Pre-Onboarding & Thử Việc</h1>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
              [S8-01] New Hire Readiness
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Theo dõi chuẩn bị thiết bị IT, tài khoản truy cập, gán Mentor & đào tạo định hướng cho nhân sự mới</p>
        </div>
      </div>

      {/* Checklist List */}
      <div className="space-y-4">
        {onboardings.map((item) => {
          const completedCount = Object.values(item.checklist).filter(Boolean).length;
          const progressPercent = Math.round((completedCount / 4) * 100);

          return (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4 hover:shadow-md transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">{item.candidate_name}</h2>
                    <span className="text-xs text-slate-500">• Ngày bắt đầu làm: <strong className="text-slate-900">{item.start_date}</strong></span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Vị trí: <strong>{item.position}</strong> ({item.department}) | Mentor: <strong>{item.mentor_name}</strong></div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900">Tiến độ chuẩn bị: {progressPercent}%</div>
                    <div className="w-32 bg-slate-100 h-2 rounded-full mt-1 overflow-hidden">
                      <div className="bg-emerald-500 h-full transition-all" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Checklist Items */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                
                <div 
                  onClick={() => toggleCheck(item.id, 'contract_signed')}
                  className={`p-3.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                    item.checklist.contract_signed ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {item.checklist.contract_signed ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Circle className="w-4 h-4 text-slate-400" />}
                    <span>1. Ký hợp đồng thử việc</span>
                  </div>
                </div>

                <div 
                  onClick={() => toggleCheck(item.id, 'it_account')}
                  className={`p-3.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                    item.checklist.it_account ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {item.checklist.it_account ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Circle className="w-4 h-4 text-slate-400" />}
                    <span>2. Cấp tài khoản Email / IT</span>
                  </div>
                </div>

                <div 
                  onClick={() => toggleCheck(item.id, 'laptop_assigned')}
                  className={`p-3.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                    item.checklist.laptop_assigned ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {item.checklist.laptop_assigned ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Circle className="w-4 h-4 text-slate-400" />}
                    <span>3. Cấp Laptop / Thiết bị</span>
                  </div>
                </div>

                <div 
                  onClick={() => toggleCheck(item.id, 'orientation_done')}
                  className={`p-3.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                    item.checklist.orientation_done ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {item.checklist.orientation_done ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Circle className="w-4 h-4 text-slate-400" />}
                    <span>4. Đào tạo hội nhập HR</span>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
