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
import { myDecisions, type MyDecision } from '@/features/approver/api';
import { useApiData } from '@/hooks/useApiData';
import { useAuth } from '@/providers/auth-provider';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/DataStates';

type HistoryRecord = MyDecision;

export default function ApproverHistoryPage() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useApiData(
    () => (user ? myDecisions(user.id, user.full_name) : Promise.resolve([] as MyDecision[])),
    [user?.id],
  );
  const HISTORICAL_APPROVALS = data || [];
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
          {loading && <LoadingState />}
          {!loading && !!error && <ErrorState error={error} onRetry={reload} />}
          {!loading && !error && filtered.length === 0 && <EmptyState hint="Bạn chưa có quyết định phê duyệt nào được ghi nhận." />}
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
                ) : item.decision === 'changes_requested' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                    YÊU CẦU BỔ SUNG
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
