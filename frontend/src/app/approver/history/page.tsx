'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  History,
  CheckCircle2,
  XCircle,
  FileText,
  DollarSign,
  Search,
  Filter,
  Calendar,
  User,
  ShieldCheck,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { ApprovalTimeline } from '@/features/approver/components/ApprovalTimeline';
import type { ApprovalTimelineItem } from '@/features/approver/types';

interface HistoryRecord {
  id: string;
  type: 'REQ' | 'OFFER';
  code: string;
  title: string;
  department: string;
  amountOrQuantity: string;
  decision: 'approved' | 'rejected';
  decidedAt: string;
  decidedBy: string;
  note: string;
  timeline: ApprovalTimelineItem[];
}

const HISTORICAL_APPROVALS: HistoryRecord[] = [
  {
    id: 'HIST-01',
    type: 'REQ',
    code: 'REQ-2026-002',
    title: 'Senior Frontend Engineer (React/Next.js)',
    department: 'Công Nghệ Thông Tin',
    amountOrQuantity: '2 nhân sự (22tr - 30tr VNĐ)',
    decision: 'approved',
    decidedAt: '16:45 - 08/10/2026',
    decidedBy: 'Phạm Văn Hùng (Ban Giám Đốc)',
    note: 'Đã thẩm định và thông qua kế hoạch bổ sung nguồn lực.',
    timeline: [
      {
        id: 1,
        step_name: 'Khởi tạo tờ trình',
        approver_name: 'Lê Trưởng Nhóm',
        approver_role: 'Trưởng Khối Công Nghệ',
        action: 'submitted',
        created_at: '09:00 - 07/10/2026',
      },
      {
        id: 2,
        step_name: 'Thẩm định HR Manager',
        approver_name: 'Trần Thị Thu Hà',
        approver_role: 'Giám Đốc Nhân Sự',
        action: 'approved',
        created_at: '11:30 - 08/10/2026',
      },
      {
        id: 3,
        step_name: 'Phê duyệt Ban Giám Đốc',
        approver_name: 'Phạm Văn Hùng',
        approver_role: 'Ban Giám Đốc',
        action: 'approved',
        comment: 'Đã thẩm định và thông qua kế hoạch bổ sung nguồn lực.',
        created_at: '16:45 - 08/10/2026',
      },
    ],
  },
  {
    id: 'HIST-02',
    type: 'OFFER',
    code: 'OFFER-2026-079',
    title: 'Đề xuất Offer: Lê Hoàng Yến (Lead Product Designer)',
    department: 'Khối Thiết Kế Sản Phẩm',
    amountOrQuantity: '38.000.000 VNĐ / tháng',
    decision: 'approved',
    decidedAt: '10:15 - 05/10/2026',
    decidedBy: 'Phạm Văn Hùng (Ban Giám Đốc)',
    note: 'Chấp thuận mức lương trong dải chuẩn cho ứng viên xuất sắc.',
    timeline: [
      {
        id: 4,
        step_name: 'Đề xuất Offer từ Tuyển Dụng',
        approver_name: 'Vũ Minh Anh',
        approver_role: 'Lead Recruiter',
        action: 'submitted',
        created_at: '14:00 - 04/10/2026',
      },
      {
        id: 5,
        step_name: 'Phê duyệt Ban Giám Đốc',
        approver_name: 'Phạm Văn Hùng',
        approver_role: 'Ban Giám Đốc',
        action: 'approved',
        comment: 'Chấp thuận mức lương trong dải chuẩn cho ứng viên xuất sắc.',
        created_at: '10:15 - 05/10/2026',
      },
    ],
  },
  {
    id: 'HIST-03',
    type: 'REQ',
    code: 'REQ-2026-005',
    title: 'Trợ Lý Điều Hành Sản Phẩm AI (Vượt định biên)',
    department: 'Khối Đổi Mới Sáng Tạo',
    amountOrQuantity: '3 nhân sự (15tr - 20tr VNĐ)',
    decision: 'rejected',
    decidedAt: '15:20 - 03/10/2026',
    decidedBy: 'Phạm Văn Hùng (Ban Giám Đốc)',
    note: 'Chưa đủ cơ sở mở rộng định biên quý này. Đề xuất luân chuyển nội bộ.',
    timeline: [
      {
        id: 6,
        step_name: 'Khởi tạo tờ trình',
        approver_name: 'Nguyễn Văn Minh',
        approver_role: 'Trưởng Khối AI',
        action: 'submitted',
        created_at: '10:00 - 02/10/2026',
      },
      {
        id: 7,
        step_name: 'Phê duyệt Ban Giám Đốc',
        approver_name: 'Phạm Văn Hùng',
        approver_role: 'Ban Giám Đốc',
        action: 'rejected',
        comment: 'Chưa đủ cơ sở mở rộng định biên quý này. Đề xuất luân chuyển nội bộ.',
        created_at: '15:20 - 03/10/2026',
      },
    ],
  },
];

export default function ApproverHistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);

  const filtered = HISTORICAL_APPROVALS.filter((item) => {
    const matchSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = typeFilter === 'ALL' || item.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/approver"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại trung tâm duyệt</span>
            </Link>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-blue-600" />
            <span>Lịch Sử & Nhật Ký Kiểm Toán Phê Duyệt</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tra cứu toàn bộ các quyết định phê duyệt và từ chối đã thực hiện với chữ ký điện tử bất biến.
          </p>
        </div>

        <div className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-right">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Hồ sơ đã xử lý</span>
          <span className="text-lg font-black text-slate-900 block">{HISTORICAL_APPROVALS.length} hồ sơ</span>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã hồ sơ, chức danh, phòng ban..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
        >
          <option value="ALL">Tất cả loại hồ sơ</option>
          <option value="REQ">Yêu Cầu Tuyển Dụng (REQ)</option>
          <option value="OFFER">Đề Xuất Offer Lương</option>
        </select>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedRecord(item)}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                    {item.code}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">• {item.department}</span>
                </div>

                {item.decision === 'approved' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    ĐÃ PHÊ DUYỆT
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                    <XCircle className="w-3 h-3" />
                    ĐÃ BÁC BỎ
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-50">
                <span className="font-semibold text-slate-700">{item.amountOrQuantity}</span>
                <span>Ngày quyết định: {item.decidedAt}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Audit Timeline Sidebar Preview */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Chi Tiết Nhật Ký Kiểm Toán</span>
          </h4>

          {selectedRecord ? (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 block">{selectedRecord.code}</span>
                <span className="text-xs font-extrabold text-slate-900 block mt-0.5">{selectedRecord.title}</span>
                <p className="text-[11px] text-slate-600 mt-1 italic">"{selectedRecord.note}"</p>
              </div>

              <ApprovalTimeline items={selectedRecord.timeline} />
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-10">
              Nhấp vào một hồ sơ ở danh sách bên trái để xem chuỗi nhật ký kiểm toán bất biến.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
