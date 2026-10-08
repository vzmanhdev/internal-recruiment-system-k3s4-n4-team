'use client';

import { existingApiFetch } from "@/lib/existing-api-fetch";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileCheck, Search, Filter, Plus, AlertTriangle, Clock, Users, UserPlus, 
  PauseCircle, XCircle, CheckCircle2, Eye, MoreVertical, ShieldAlert, ArrowLeft, 
  ChevronRight, Building2, AlertCircle, RefreshCw
} from 'lucide-react';

interface Requisition {
  id: string;
  code: string;
  title: string;
  department: string;
  headcount: number;
  salary_range: string;
  target_date: string;
  status: 'pending_approval' | 'approved' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
  sla_status: 'normal' | 'warning' | 'overdue';
  delay_days: number;
  primary_recruiter?: string;
  supporting_recruiters?: string[];
  created_at: string;
}

export default function HRRequisitionsPage() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  
  // Modal states
  const [activeModal, setActiveModal] = useState<'assign' | 'cancel' | 'detail' | null>(null);
  const [selectedReq, setSelectedReq] = useState<Requisition | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionType, setActionType] = useState<'paused' | 'cancelled' | 'completed'>('paused');
  const [assignedRecruiter, setAssignedRecruiter] = useState('');

  useEffect(() => {
    fetchRequisitions();
  }, []);

  const fetchRequisitions = async () => {
    try {
      setLoading(true);
      const res = await existingApiFetch('http://localhost:8000/api/v1/requisitions');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setRequisitions(data);
          return;
        }
      }
      // Fallback structured data
      setRequisitions(initialRequisitions);
    } catch (err) {
      setRequisitions(initialRequisitions);
    } finally {
      setLoading(false);
    }
  };

  const initialRequisitions: Requisition[] = [
    {
      id: "REQ-001",
      code: "REQ-2026-001",
      title: "Kỹ sư Backend Senior (Python/FastAPI)",
      department: "Công Nghệ Thông Tin",
      headcount: 3,
      salary_range: "35 - 50 Triệu VNĐ",
      target_date: "15/10/2026",
      status: "in_progress",
      sla_status: "normal",
      delay_days: 0,
      primary_recruiter: "Nguyễn Văn Hùng",
      supporting_recruiters: ["Lê Thị Mai"],
      created_at: "01/10/2026"
    },
    {
      id: "REQ-004",
      code: "REQ-2026-004",
      title: "Chuyên viên Senior DevOps / Cloud Architect",
      department: "Công Nghệ Thông Tin",
      headcount: 2,
      salary_range: "40 - 60 Triệu VNĐ",
      target_date: "30/09/2026",
      status: "in_progress",
      sla_status: "overdue",
      delay_days: 5,
      primary_recruiter: "Nguyễn Văn Hùng",
      created_at: "15/09/2026"
    },
    {
      id: "REQ-008",
      code: "REQ-2026-008",
      title: "Trưởng nhóm Data Analyst & BI",
      department: "Khối Dữ Liệu",
      headcount: 1,
      salary_range: "45 - 55 Triệu VNĐ",
      target_date: "02/10/2026",
      status: "in_progress",
      sla_status: "overdue",
      delay_days: 3,
      primary_recruiter: "Lê Thị Mai",
      created_at: "10/09/2026"
    },
    {
      id: "REQ-012",
      code: "REQ-2026-012",
      title: "Chuyên viên Digital Marketing Lead",
      department: "Marketing & Growth",
      headcount: 2,
      salary_range: "25 - 35 Triệu VNĐ",
      target_date: "20/10/2026",
      status: "pending_approval",
      sla_status: "warning",
      delay_days: 0,
      created_at: "03/10/2026"
    }
  ];

  const handleCancelPauseSubmit = () => {
    if (!selectedReq || !actionReason.trim()) {
      alert("Vui lòng nhập lý do bắt buộc!");
      return;
    }

    setRequisitions(prev => prev.map(item => {
      if (item.id === selectedReq.id) {
        return { ...item, status: actionType };
      }
      return item;
    }));

    alert(`Đã cập nhật trạng thái tờ trình ${selectedReq.code} thành "${actionType === 'paused' ? 'Tạm dừng' : actionType === 'cancelled' ? 'Hủy' : 'Đã tuyển đủ'}" với lý do: ${actionReason}`);
    setActiveModal(null);
    setActionReason('');
  };

  const handleAssignSubmit = () => {
    if (!selectedReq || !assignedRecruiter) {
      alert("Vui lòng chọn Recruiter chính!");
      return;
    }

    setRequisitions(prev => prev.map(item => {
      if (item.id === selectedReq.id) {
        return { ...item, primary_recruiter: assignedRecruiter, status: 'in_progress' };
      }
      return item;
    }));

    alert(`Đã phân công ${assignedRecruiter} phụ trách chính vị trí ${selectedReq.code}`);
    setActiveModal(null);
  };

  const filtered = requisitions.filter(item => {
    const matchesQuery = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus || (selectedStatus === 'overdue' && item.sla_status === 'overdue');
    const matchesDept = selectedDept === 'all' || item.department === selectedDept;
    return matchesQuery && matchesStatus && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quản Lý Yêu Cầu Tuyển Dụng (REQ)</h1>
            <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">
              [S3-06] [S3-07] [S3-08]
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Theo dõi tiến độ tờ trình, gán Recruiter phụ trách & giám sát cảnh báo quá hạn SLA</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchRequisitions}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Tải lại</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm theo mã REQ hoặc tên vị trí tuyển dụng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold">Bộ lọc:</span>
          </div>

          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="overdue">🔴 Quá hạn SLA</option>
            <option value="in_progress">Đang tuyển dụng</option>
            <option value="pending_approval">Chờ duyệt</option>
            <option value="paused">Tạm dừng</option>
            <option value="cancelled">Đã hủy</option>
          </select>

          <select 
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">Tất cả phòng ban</option>
            <option value="Công Nghệ Thông Tin">Công Nghệ Thông Tin</option>
            <option value="Khối Dữ Liệu">Khối Dữ Liệu</option>
            <option value="Marketing & Growth">Marketing & Growth</option>
          </select>
        </div>

      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Mã REQ & Chức Danh</th>
                <th className="p-4">Phòng Ban</th>
                <th className="p-4 text-center">Chỉ Tiêu</th>
                <th className="p-4">Hạn SLA Target</th>
                <th className="p-4">Trạng Thái SLA</th>
                <th className="p-4">Recruiter Phụ Trách</th>
                <th className="p-4 text-center">Trạng Thái REQ</th>
                <th className="p-4 text-right">Thao Tác HR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filtered.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                  
                  {/* Code & Title */}
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{req.title}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">{req.code}</span>
                      <span>• Dải lương: {req.salary_range}</span>
                    </div>
                  </td>

                  {/* Dept */}
                  <td className="p-4">
                    <span className="text-slate-800 font-semibold">{req.department}</span>
                  </td>

                  {/* Headcount */}
                  <td className="p-4 text-center font-bold text-blue-700">
                    {req.headcount} người
                  </td>

                  {/* Target Date */}
                  <td className="p-4 text-slate-600">
                    {req.target_date}
                  </td>

                  {/* SLA Badge */}
                  <td className="p-4">
                    {req.sla_status === 'overdue' ? (
                      <span className="bg-rose-50 text-rose-600 border border-rose-200 px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 w-max animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Quá hạn {req.delay_days} ngày</span>
                      </span>
                    ) : req.sla_status === 'warning' ? (
                      <span className="bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 w-max">
                        <Clock className="w-3 h-3" />
                        <span>Sắp hết hạn SLA</span>
                      </span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 w-max">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Trong tiến độ</span>
                      </span>
                    )}
                  </td>

                  {/* Assigned Recruiter */}
                  <td className="p-4">
                    {req.primary_recruiter ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center">
                          {req.primary_recruiter.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900">{req.primary_recruiter}</span>
                      </div>
                    ) : (
                      <button 
                        onClick={() => { setSelectedReq(req); setActiveModal('assign'); }}
                        className="text-blue-600 hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Phân công Recruiter</span>
                      </button>
                    )}
                  </td>

                  {/* Status */}
                  <td className="p-4 text-center">
                    {req.status === 'in_progress' && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-[10px] font-extrabold border border-blue-100">Đang tuyển dụng</span>}
                    {req.status === 'pending_approval' && <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-[10px] font-extrabold border border-amber-100">Chờ duyệt</span>}
                    {req.status === 'paused' && <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-extrabold">Tạm dừng</span>}
                    {req.status === 'cancelled' && <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md text-[10px] font-extrabold">Đã hủy</span>}
                  </td>

                  {/* Action Buttons */}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button 
                        onClick={() => { setSelectedReq(req); setActiveModal('assign'); }}
                        title="Đổi Recruiter"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>

                      <button 
                        onClick={() => { setSelectedReq(req); setActiveModal('cancel'); }}
                        title="Tạm dừng / Hủy REQ"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                      >
                        <PauseCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Phân Công Recruiter [S3-06] */}
      {activeModal === 'assign' && selectedReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Phân Công Recruiter Phụ Trách</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="font-bold text-slate-900">{selectedReq.title}</div>
                <div className="text-slate-500">Mã REQ: {selectedReq.code} | Phòng ban: {selectedReq.department}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Recruiter Chính Phụ Trách *</label>
                <select 
                  value={assignedRecruiter}
                  onChange={(e) => setAssignedRecruiter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                >
                  <option value="">-- Chọn chuyên viên tuyển dụng --</option>
                  <option value="Nguyễn Văn Hùng">Nguyễn Văn Hùng (Senior Recruiter)</option>
                  <option value="Lê Thị Mai">Lê Thị Mai (Tech Recruiter)</option>
                  <option value="Trần Hoàng Nam">Trần Hoàng Nam (HR Specialist)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50">Hủy</button>
              <button onClick={handleAssignSubmit} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold">Xác Nhận Phân Công</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Tạm Dừng / Hủy REQ Bắt Buộc Nhập Lý Do [S3-07] */}
      {activeModal === 'cancel' && selectedReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900">Thay Đổi Trạng Thái Tờ Trình [S3-07]</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 text-slate-700 space-y-1">
                <div className="font-bold text-slate-900">{selectedReq.title} ({selectedReq.code})</div>
                <p className="text-[11px] text-rose-700">Lưu ý: Thay đổi trạng thái sang Tạm dừng/Hủy sẽ tự động ẩn tin tuyển dụng công khai & thông báo tới ứng viên đang ứng tuyển.</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Trạng Thái Mới *</label>
                <select 
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                >
                  <option value="paused">⏸ Tạm dừng tuyển dụng</option>
                  <option value="cancelled">❌ Hủy bỏ yêu cầu tuyển dụng</option>
                  <option value="completed">✅ Đã tuyển đủ nhân sự</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lý Do Chi Tiết (Bắt Buộc Nhập) *</label>
                <textarea 
                  rows={3}
                  placeholder="Nhập chi tiết lý do thay đổi trạng thái (Ví dụ: Thay đổi kế hoạch kinh doanh, Tái cấu trúc phòng ban...)"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50">Bỏ Qua</button>
              <button onClick={handleCancelPauseSubmit} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold">Xác Nhận Cập Nhật</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
