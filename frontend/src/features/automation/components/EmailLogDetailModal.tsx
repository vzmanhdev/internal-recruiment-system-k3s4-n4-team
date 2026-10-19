'use client';

import React from 'react';
import {
  X,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  User,
  Calendar,
  AlertCircle,
  FileText,
} from 'lucide-react';

export interface EmailLogData {
  id: number;
  template_code?: string;
  recipient_name: string;
  recipient_email: string;
  subject: string;
  body_html: string;
  status: string;
  error_message?: string;
  sent_at: string;
  retried_at?: string;
}

interface EmailLogDetailModalProps {
  isOpen: boolean;
  log: EmailLogData | null;
  onClose: () => void;
  onRetry?: (log: EmailLogData) => void;
}

export function EmailLogDetailModal({ isOpen, log, onClose, onRetry }: EmailLogDetailModalProps) {
  if (!isOpen || !log) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30">
                  #{log.id}
                </span>
                <span className="text-sm font-bold text-white">Chi Tiết Nhật Ký Email Hệ Thống</span>
                {log.status === 'sent' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Đã gửi thành công</span>
                  </span>
                )}
                {log.status === 'failed' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-400/30 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    <span>Gửi thất bại</span>
                  </span>
                )}
                {log.status === 'pending' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Đang chờ gửi</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Mẫu template: <strong className="font-mono text-white">{log.template_code || 'Tùy chỉnh'}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/70">
          {/* Metadata Card */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Người nhận (Recipient):</span>
                <strong className="text-slate-900 font-bold block text-sm">{log.recipient_name}</strong>
                <span className="text-slate-500 font-mono text-[11px]">{log.recipient_email}</span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Thời gian phát hành:</span>
                <strong className="text-slate-800 font-semibold block text-sm">
                  {log.sent_at ? new Date(log.sent_at).toLocaleString('vi-VN') : 'Chưa gửi'}
                </strong>
                {log.retried_at && (
                  <span className="text-slate-500 text-[11px] block">
                    Gửi lại lần cuối: {new Date(log.retried_at).toLocaleString('vi-VN')}
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 block font-medium">Tiêu đề thư (Subject):</span>
              <strong className="text-slate-900 font-bold block text-xs mt-0.5">{log.subject}</strong>
            </div>

            {log.error_message && (
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Mã lỗi SMTP phản hồi:</span>
                </span>
                <p className="font-mono text-[11px] leading-relaxed">{log.error_message}</p>
              </div>
            )}
          </div>

          {/* Email Body Container */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Nội Dung Email Gửi Đi (Rendered Preview)</span>
            </div>

            <div className="p-5 overflow-x-auto text-xs sm:text-sm text-slate-800 leading-relaxed bg-white min-h-[180px]">
              {log.body_html ? (
                <div
                  dangerouslySetInnerHTML={{ __html: log.body_html }}
                  className="prose prose-sm max-w-none"
                />
              ) : (
                <p className="text-slate-400 italic">Nội dung thư trống.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between">
          <div>
            {log.status === 'failed' && onRetry && (
              <button
                type="button"
                onClick={() => onRetry(log)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Gửi Lại Email Này</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
