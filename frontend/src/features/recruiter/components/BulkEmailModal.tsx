"use client";

import React, { useState } from "react";
import { Mail, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Candidate, EmailTemplate } from "../types/recruiter.types";
import { recruiterService } from "../services/recruiter.service";

interface BulkEmailModalProps {
  isOpen: boolean;
  selectedCandidates: Candidate[];
  onClose: () => void;
  onSuccess: (sentCount: number) => void;
}

export function BulkEmailModal({
  isOpen,
  selectedCandidates,
  onClose,
  onSuccess,
}: BulkEmailModalProps) {
  const templates = recruiterService.getEmailTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || "");

  const currentTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];
  const [subject, setSubject] = useState(currentTemplate?.subject || "");
  const [content, setContent] = useState(currentTemplate?.content || "");

  if (!isOpen) return null;

  const handleTemplateChange = (id: string) => {
    setSelectedTemplateId(id);
    const tmpl = templates.find((t) => t.id === id);
    if (tmpl) {
      setSubject(tmpl.subject);
      setContent(tmpl.content);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCandidates.length === 0) return;

    const count = recruiterService.sendBulkEmail(
      selectedCandidates.map((c) => c.id),
      selectedTemplateId,
      subject,
      content
    );

    onSuccess(count);
    onClose();
  };

  // Preview with first candidate
  const sampleCandidate = selectedCandidates[0];
  const previewSubject = sampleCandidate
    ? subject.replace(/{{job_title}}/g, sampleCandidate.jobTitle).replace(/{{candidate_name}}/g, sampleCandidate.fullName)
    : subject;

  const previewContent = sampleCandidate
    ? content
        .replace(/{{job_title}}/g, sampleCandidate.jobTitle)
        .replace(/{{candidate_name}}/g, sampleCandidate.fullName)
        .replace(/{{interview_round}}/g, "Vòng 1 - Chuyên môn")
        .replace(/{{interview_time}}/g, "14:00 ngày 05/10/2026")
        .replace(/{{interview_format}}/g, "Trực tuyến qua Google Meet")
        .replace(/{{interview_location}}/g, "https://meet.google.com/vina-interview-room")
    : content;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-blue-600">
              <Mail className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">Gửi thư hàng loạt cho ứng viên (S7-09)</h2>
              <p className="text-xs text-slate-500">Đã chọn <strong>{selectedCandidates.length} ứng viên</strong> để gửi thông báo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSend} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 text-xs text-slate-700">
            <p className="font-bold text-blue-900 mb-1">Danh sách người nhận:</p>
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
              {selectedCandidates.map((c) => (
                <span key={c.id} className="rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 border border-slate-200">
                  {c.fullName} ({c.email})
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Chọn mẫu thư (Email Template) *
            </label>
            <Select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              options={templates.map((t) => ({ value: t.id, label: t.name }))}
            />
          </div>

          <Input
            label="Tiêu đề thư *"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Nội dung thư (Hỗ trợ biến template: {"{{candidate_name}}"}, {"{{job_title}}"}) *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-32 rounded-xl border border-slate-200 p-3 text-xs leading-relaxed focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Real data preview */}
          {sampleCandidate && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Sparkles className="h-4 w-4 text-blue-600" />
                Xem trước nội dung gửi tới ứng viên đầu tiên ({sampleCandidate.fullName}):
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700 space-y-2">
                <p><strong>Tiêu đề:</strong> {previewSubject}</p>
                <div className="h-px bg-slate-100" />
                <p className="whitespace-pre-wrap leading-relaxed">{previewContent}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={onClose}>
              Hủy bỏ
            </Button>
            <Button size="sm" type="submit" leftIcon={<Send className="h-4 w-4" />}>
              Gửi {selectedCandidates.length} email
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
