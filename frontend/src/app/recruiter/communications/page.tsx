"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  FileText,
  Mail,
  RefreshCw,
  Send,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmailLog, EmailTemplate } from "@/features/recruiter/types/recruiter.types";
import { recruiterService } from "@/features/recruiter/services/recruiter.service";
import { BulkEmailModal } from "@/features/recruiter/components/BulkEmailModal";

export default function RecruiterCommunicationsPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>(() =>
    recruiterService.getEmailTemplates()
  );
  const [logs, setLogs] = useState<EmailLog[]>(() => recruiterService.getEmailLogs());
  const candidates = recruiterService.getCandidates();
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(templates[0] || null);

  const refreshLogs = () => {
    setLogs([...recruiterService.getEmailLogs()]);
  };

  const handleResend = (log: EmailLog) => {
    alert(`Đã gửi lại thành công thư '${log.templateName}' tới ứng viên ${log.candidateName} (${log.candidateEmail}).`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600">
            <Mail className="h-4 w-4" />
            <span>Giao tiếp & Tự động hóa Email (EP-08)</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-950 sm:text-3xl">
            Mẫu Thư Tuyển Dụng & Nhật Ký Gửi
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Cấu hình mẫu thông báo tự động, gửi email hàng loạt và tra cứu nhật ký gửi thư (S8-02).
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsBulkOpen(true)}
          leftIcon={<Send className="h-4 w-4" />}
        >
          Soạn gửi thư hàng loạt
        </Button>
      </div>

      {/* Grid: Templates (Left) & Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template List */}
        <div className="space-y-3">
          <h2 className="text-sm font-extrabold text-slate-900">Mẫu email quy trình ({templates.length})</h2>
          <div className="space-y-2">
            {templates.map((tmpl) => {
              const isSelected = selectedTemplate?.id === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl)}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/40 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs text-slate-900">{tmpl.name}</h3>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      {tmpl.stageTrigger}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-1">{tmpl.subject}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Template Details */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {selectedTemplate?.name || "Chi tiết mẫu thư"}
              </h3>
              <p className="text-xs text-slate-400">Tự động kích hoạt khi ứng viên chuyển vào giai đoạn tương ứng</p>
            </div>
            <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2.5 py-1 rounded-lg">
              Hỗ trợ biến động
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="font-bold text-slate-500">Tiêu đề mẫu:</span>
              <p className="font-semibold text-slate-800 mt-1 p-2 rounded-lg bg-slate-50 border border-slate-200">
                {selectedTemplate?.subject}
              </p>
            </div>

            <div>
              <span className="font-bold text-slate-500">Nội dung mẫu:</span>
              <div className="mt-1 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50/50 p-4 font-mono text-xs leading-relaxed text-slate-700">
                {selectedTemplate?.content}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sent Email Logs (S8-02) */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">
              Nhật ký gửi email cho ứng viên (S8-02)
            </h3>
            <p className="text-xs text-slate-400">
              Tra cứu thời điểm, trạng thái gửi và hỗ trợ gửi lại nhanh chóng khi ứng viên thông báo chưa nhận được.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
            {logs.length} bản ghi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Mã</th>
                <th className="px-4 py-3">Ứng viên nhận thư</th>
                <th className="px-4 py-3">Mẫu thư & Tiêu đề</th>
                <th className="px-4 py-3">Thời điểm gửi</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-slate-400">#{log.id}</td>
                  <td className="px-4 py-3.5">
                    <p className="font-bold text-slate-900">{log.candidateName}</p>
                    <p className="text-[11px] text-slate-400">{log.candidateEmail}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-semibold text-slate-800">{log.templateName}</span>
                    <p className="text-[11px] text-slate-500 truncate max-w-xs">{log.subject}</p>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">{log.sentAt}</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" />
                      Thành công
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => handleResend(log)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Gửi lại
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Email Modal */}
      <BulkEmailModal
        isOpen={isBulkOpen}
        selectedCandidates={candidates.slice(0, 3)}
        onClose={() => setIsBulkOpen(false)}
        onSuccess={() => refreshLogs()}
      />
    </div>
  );
}
