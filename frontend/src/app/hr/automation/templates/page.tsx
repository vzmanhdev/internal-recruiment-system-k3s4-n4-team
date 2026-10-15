'use client';

import React, { useState } from 'react';
import { 
  Mail, Plus, Edit2, Play, Pause, CheckCircle2, FileText, Code, Sparkles, Send
} from 'lucide-react';

interface EmailTemplateItem {
  id: string;
  code: string;
  name: string;
  trigger_event: string;
  subject: string;
  body: string;
  variables: string[];
  is_active: boolean;
}

export default function HREmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplateItem[]>([
    {
      id: "TMP-01",
      code: "EMAIL-INVITE-INT",
      name: "Thư Mời Phỏng Vấn Tự Động",
      trigger_event: "Khi ứng viên chuyển sang giai đoạn 'Phỏng vấn'",
      subject: "[Công ty] Thư mời phỏng vấn vị trí {{job_title}} - Ứng viên {{candidate_name}}",
      body: "Kính gửi {{candidate_name}},\n\nBộ phận Tuyển dụng trân trọng mời bạn tham dự buổi phỏng vấn vị trí {{job_title}} vào lúc {{interview_time}}.\nLĩnh vực/Hình thức: {{interview_location}}.\n\nTrân trọng,\nHR Team",
      variables: ["{{candidate_name}}", "{{job_title}}", "{{interview_time}}", "{{interview_location}}"],
      is_active: true
    },
    {
      id: "TMP-02",
      code: "EMAIL-OFFER-LETTER",
      name: "Thư Mời Nhận Việc (Offer Letter)",
      trigger_event: "Khi HR phê duyệt Offer Letter",
      subject: "[Chúc mừng] Thư mời nhận việc vị trí {{job_title}} từ {{company_name}}",
      body: "Chào {{candidate_name}},\n\nChúng tôi rất vui mừng thông báo bạn đã trúng tuyển vị trí {{job_title}} với mức lương {{offered_salary}}.\nNgày đi làm chính thức: {{start_date}}.\n\nVui lòng xác nhận offer trước ngày {{expiry_date}}.\n\nTrân trọng,",
      variables: ["{{candidate_name}}", "{{job_title}}", "{{offered_salary}}", "{{start_date}}", "{{expiry_date}}"],
      is_active: true
    }
  ]);

  const [editingTemplate, setEditingTemplate] = useState<EmailTemplateItem | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mẫu Email Tự Động & Quy Tắc Gửi (Email Automation)</h1>
            <span className="bg-purple-50 text-purple-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-purple-200">
              [S4-01] Auto Trigger
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Cấu hình mẫu email động với biến giữ chỗ placeholder & kích hoạt tự động theo sự kiện chuyển giai đoạn ứng viên</p>
        </div>

        <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer">
          <Plus className="w-4 h-4" />
          <span>Tạo Mẫu Email Mới</span>
        </button>
      </div>

      {/* Main List */}
      <div className="space-y-4">
        {templates.map((tmp) => (
          <div key={tmp.id} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4 hover:shadow-md transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono bg-purple-50 text-purple-700 text-[10px] font-extrabold px-2 py-0.5 rounded border border-purple-100">{tmp.code}</span>
                  <h2 className="text-base font-bold text-slate-900">{tmp.name}</h2>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Sự kiện kích hoạt: <strong className="text-blue-600">{tmp.trigger_event}</strong></div>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-emerald-50 text-emerald-700 font-extrabold text-[10px] px-2.5 py-1 rounded-full border border-emerald-200">
                  Đang Hoạt Động
                </span>
                <button onClick={() => setEditingTemplate(tmp)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl cursor-pointer">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="font-bold text-slate-700">Tiêu đề email mẫu: </span>
                <span className="font-mono bg-slate-50 text-slate-800 px-2 py-1 rounded border border-slate-200">{tmp.subject}</span>
              </div>

              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 font-mono text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed">
                {tmp.body}
              </div>

              <div>
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Các Biến Động Hỗ Trợ (Placeholder Variables)</div>
                <div className="flex flex-wrap gap-1.5">
                  {tmp.variables.map((v, idx) => (
                    <span key={idx} className="bg-blue-50 text-blue-700 text-[10px] font-bold font-mono px-2 py-0.5 rounded-md border border-blue-100">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
