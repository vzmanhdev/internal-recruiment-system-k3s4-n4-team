'use client';

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Send,
  Clock,
  ShieldCheck,
  MessageSquare,
  User,
} from 'lucide-react';
import clsx from 'clsx';
import type { ApprovalTimelineItem } from '../types';

interface ApprovalTimelineProps {
  items: ApprovalTimelineItem[];
  className?: string;
  emptyMessage?: string;
}

export function ApprovalTimeline({
  items,
  className,
  emptyMessage = 'Chưa có dữ liệu lịch sử phê duyệt.',
}: ApprovalTimelineProps) {
  if (!items || items.length === 0) {
    return (
      <div className={clsx('py-8 text-center text-slate-400 bg-slate-50/60 rounded-2xl border border-slate-100 p-6', className)}>
        <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
        <p className="text-xs font-medium">{emptyMessage}</p>
        <span className="text-[10px] text-slate-400 mt-1 inline-block">Hồ sơ đang chờ xử lý ở cấp thẩm định đầu tiên</span>
      </div>
    );
  }

  const getActionConfig = (action: ApprovalTimelineItem['action']) => {
    switch (action) {
      case 'approved':
        return {
          label: 'ĐÃ PHÊ DUYỆT',
          icon: CheckCircle2,
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          dotBg: 'bg-emerald-500 ring-4 ring-emerald-100',
        };
      case 'rejected':
        return {
          label: 'ĐÃ TỪ CHỐI',
          icon: XCircle,
          badgeBg: 'bg-rose-50 text-rose-700 border-rose-200/80',
          dotBg: 'bg-rose-500 ring-4 ring-rose-100',
        };
      case 'changes_requested':
        return {
          label: 'YÊU CẦU BỔ SUNG',
          icon: RotateCcw,
          badgeBg: 'bg-amber-50 text-amber-700 border-amber-200/80',
          dotBg: 'bg-amber-500 ring-4 ring-amber-100',
        };
      case 'renegotiate':
        return {
          label: 'YÊU CẦU ĐÀM PHÁN LẠI',
          icon: AlertTriangle,
          badgeBg: 'bg-purple-50 text-purple-700 border-purple-200/80',
          dotBg: 'bg-purple-500 ring-4 ring-purple-100',
        };
      case 'submitted':
      default:
        return {
          label: 'ĐÃ TRÌNH DUYỆT',
          icon: Send,
          badgeBg: 'bg-blue-50 text-blue-700 border-blue-200/80',
          dotBg: 'bg-blue-500 ring-4 ring-blue-100',
        };
    }
  };

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Header Audit Notice */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Nhật Ký Thẩm Định & Kiểm Toán
          </h4>
        </div>
        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          Dữ liệu bất biến (Read-only)
        </span>
      </div>

      {/* Vertical Timeline Track */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
        {items.map((log, index) => {
          const config = getActionConfig(log.action);
          const Icon = config.icon;

          return (
            <div key={log.id || index} className="relative group">
              {/* Dot Icon Indicator */}
              <div
                className={clsx(
                  'absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] shadow-xs',
                  config.dotBg
                )}
              >
                <Icon className="w-3 h-3 stroke-[2.5]" />
              </div>

              {/* Log Card Box */}
              <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 shadow-xs hover:border-slate-300 transition-colors">
                {/* Top: Step name & Status Badge */}
                <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                  <span className="text-xs font-bold text-slate-900">
                    {log.step_name}
                  </span>
                  <span
                    className={clsx(
                      'text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border',
                      config.badgeBg
                    )}
                  >
                    {config.label}
                  </span>
                </div>

                {/* Approver Identity & Timestamp */}
                <div className="flex items-center justify-between gap-3 text-[11px] text-slate-500 mb-2">
                  <div className="flex items-center gap-1.5 font-medium text-slate-700">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>{log.approver_name}</span>
                    {log.approver_role && (
                      <span className="text-slate-400 text-[10px]">
                        ({log.approver_role})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{log.created_at}</span>
                  </div>
                </div>

                {/* Comment Box */}
                {log.comment ? (
                  <div className="bg-slate-50/80 rounded-lg p-2.5 border border-slate-100 flex items-start gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {log.comment}
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">
                    Không đính kèm ghi chú bổ sung.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
