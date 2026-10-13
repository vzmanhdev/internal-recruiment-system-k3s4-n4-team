'use client';

import React, { useState } from 'react';
import { 
  DollarSign, AlertTriangle, CheckCircle2, XCircle, Clock, ShieldAlert, 
  Plus, Search, Filter, FileText, Send, Eye, Check, Calendar, ArrowUpRight
} from 'lucide-react';
import { CreateOfferModal, CreateOfferFormData } from '@/features/hr/components/CreateOfferModal';

interface OfferItem {
  id: string;
  code: string;
  candidate_name: string;
  position: string;
  department: string;
  offered_salary: number; // TR VNĐ
  max_band_salary: number; // TR VNĐ
  is_over_band: boolean;
  over_percentage: number;
  start_date: string;
  deadline_date?: string;
  notes?: string;
  status: 'pending_approval' | 'approved' | 'sent_to_candidate' | 'accepted' | 'declined';
  created_at: string;
}

export default function HROffersPage() {
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [offers, setOffers] = useState<OfferItem[]>([
    {
      id: "OFF-001",
      code: "OFFER-2026-088",
      candidate_name: "Đỗ Hoàng Long",
      position: "Senior Backend Engineer",
      department: "Công Nghệ Thông Tin",
      offered_salary: 52,
      max_band_salary: 50,
      is_over_band: true,
      over_percentage: 4,
      start_date: "15/10/2026",
      deadline_date: "10/10/2026",
      notes: "Ứng viên yêu cầu thêm phụ cấp gửi xe và hỗ trợ chi phí thi chứng chỉ AWS SA Pro.",
      status: "pending_approval",
      created_at: "03/10/2026"
    },
    {
      id: "OFF-002",
      code: "OFFER-2026-085",
      candidate_name: "Phạm Văn Minh",
      position: "Senior DevOps Engineer",
      department: "Công Nghệ Thông Tin",
      offered_salary: 45,
      max_band_salary: 60,
      is_over_band: false,
      over_percentage: 0,
      start_date: "20/10/2026",
      deadline_date: "15/10/2026",
      notes: "Đã thống nhất nhận việc, bàn giao máy trạm HP ZBook.",
      status: "accepted",
      created_at: "28/09/2026"
    },
    {
      id: "OFF-003",
      code: "OFFER-2026-082",
      candidate_name: "Nguyễn Thu Thủy",
      position: "Trưởng nhóm Data Analyst",
      department: "Khối Phân Tích Dữ Liệu",
      offered_salary: 42,
      max_band_salary: 42,
      is_over_band: false,
      over_percentage: 0,
      start_date: "01/11/2026",
      deadline_date: "25/10/2026",
      notes: "Mức lương chuẩn theo thang bảng lương Khối Dữ Liệu.",
      status: "approved",
      created_at: "05/10/2026"
    }
  ]);

  const handleCreateOffer = (formData: CreateOfferFormData) => {
    const newOfferNumber = offers.length + 89;
    const dateFormatted = formData.startDate.split('-').reverse().join('/');
    const deadlineFormatted = formData.deadlineDate.split('-').reverse().join('/');
    
    const newOffer: OfferItem = {
      id: `OFF-00${offers.length + 1}`,
      code: `OFFER-2026-${String(newOfferNumber).padStart(3, '0')}`,
      candidate_name: formData.candidateName,
      position: formData.position,
      department: formData.department,
      offered_salary: formData.proposedSalary / 1000000,
      max_band_salary: formData.maxBandSalary / 1000000,
      is_over_band: formData.isOverBand,
      over_percentage: formData.overPercentage,
      start_date: dateFormatted,
      deadline_date: deadlineFormatted,
      notes: formData.allowanceNotes,
      status: formData.isOverBand ? 'pending_approval' : 'approved',
      created_at: '12/10/2026',
    };

    setOffers([newOffer, ...offers]);
    setIsOfferModalOpen(false);
    
    setToastMessage(
      formData.isOverBand 
        ? `Đã tạo Offer cho ${formData.candidateName} (Vượt dải +${formData.overPercentage}%) và tự động gửi trình CEO duyệt!`
        : `Đã tạo và tự động phê duyệt Offer cho ${formData.candidateName} thành công!`
    );

    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  const filteredOffers = offers.filter((item) => {
    const matchesSearch = 
      item.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.position.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'over_band') return matchesSearch && item.is_over_band;
    if (filterStatus === 'in_band') return matchesSearch && !item.is_over_band;
    return matchesSearch && item.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm font-semibold flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-xs text-blue-500 hover:text-blue-700 underline font-medium cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quản Lý Thư Mời Nhận Việc (Offer Letters)</h1>
            <span className="bg-amber-50 text-amber-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200">
              [S7-03] Salary Band Warning
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Lập thư mời nhận việc, phát hiện & cảnh báo đỏ Offer vượt dải lương chuẩn để trình CEO duyệt ngoại lệ</p>
        </div>

        <button 
          onClick={() => setIsOfferModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Offer Mới</span>
        </button>
      </div>

      {/* Top Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã, tên ứng viên, vị trí..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 focus:outline-none font-medium cursor-pointer"
          >
            <option value="all">Tất cả Offer</option>
            <option value="over_band">Cảnh báo: Vượt dải lương</option>
            <option value="in_band">Trong dải chuẩn</option>
            <option value="pending_approval">Chờ phê duyệt</option>
            <option value="approved">Đã phê duyệt</option>
            <option value="accepted">Ứng viên đã nhận việc</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Mã Offer & Ứng Viên</th>
                <th className="p-4">Vị Trí & Phòng Ban</th>
                <th className="p-4 text-center">Lương Đề Xuất</th>
                <th className="p-4 text-center">Khung Lương Tối Đa</th>
                <th className="p-4">Cảnh Báo Vượt Dải [S7-03]</th>
                <th className="p-4 text-center">Ngày Đi Làm Target</th>
                <th className="p-4 text-center">Trạng Thái Offer</th>
                <th className="p-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filteredOffers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Không tìm thấy bản ghi Offer nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredOffers.map((off) => (
                  <tr key={off.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{off.candidate_name}</div>
                      <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">{off.code}</span>
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-slate-800">{off.position}</div>
                      <div className="text-[11px] text-slate-400">{off.department}</div>
                    </td>

                    <td className="p-4 text-center font-extrabold text-slate-900 font-mono">
                      {off.offered_salary} TR VNĐ
                    </td>

                    <td className="p-4 text-center font-bold text-slate-500 font-mono">
                      {off.max_band_salary} TR VNĐ
                    </td>

                    {/* Over-band Badge */}
                    <td className="p-4">
                      {off.is_over_band ? (
                        <span className="bg-rose-50 text-rose-600 border border-rose-200 px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 w-max animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                          <span>Vượt dải +{off.over_percentage}% (Cần CEO duyệt)</span>
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 w-max">
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          <span>Trong dải lương</span>
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-center font-semibold text-slate-800">
                      {off.start_date}
                    </td>

                    <td className="p-4 text-center">
                      {off.status === 'pending_approval' && (
                        <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md text-[10px] font-extrabold border border-amber-200">
                          Chờ Phê Duyệt
                        </span>
                      )}
                      {off.status === 'approved' && (
                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-[10px] font-extrabold border border-blue-200">
                          Đã Phê Duyệt
                        </span>
                      )}
                      {off.status === 'accepted' && (
                        <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-[10px] font-extrabold border border-emerald-200">
                          Ứng Viên Đã Đồng Ý
                        </span>
                      )}
                      {off.status === 'sent_to_candidate' && (
                        <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md text-[10px] font-extrabold border border-purple-200">
                          Đã Gửi Ứng Viên
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      <button 
                        onClick={() => alert(`Xem chi tiết Offer: ${off.code}\nỨng viên: ${off.candidate_name}\nLương: ${off.offered_salary} triệu VNĐ\nGhi chú: ${off.notes || 'Không có'}`)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Chi tiết</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Tạo Offer */}
      <CreateOfferModal
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        onSubmit={handleCreateOffer}
      />
    </div>
  );
}
