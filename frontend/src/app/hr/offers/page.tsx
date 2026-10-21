'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Pagination } from '@/components/ui/Pagination';
import { apiRequest, ApiError } from '@/lib/api-client';
import { offerService, type OfferItem as ApiOffer } from '@/services/offer.service';
import { requisitionService } from '@/services/requisition.service';
import { jobService } from '@/services/job.service';
import type { ApiApplication } from '@/features/candidates/api';
import type { CandidateOfferOption } from '@/features/hr/components/CreateOfferModal';
import { useApiData } from '@/hooks/useApiData';
import { ErrorState, LoadingState } from '@/components/ui/DataStates';

const M = 1_000_000;
const vnDate = (iso?: string | null) => (iso ? new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString('vi-VN') : '');
function toStatus(st: string): OfferItem['status'] {
  if (st === 'approved') return 'approved';
  if (st === 'sent') return 'sent_to_candidate';
  if (st === 'accepted') return 'accepted';
  if (st === 'declined' || st === 'expired' || st === 'rejected') return 'declined';
  return 'pending_approval';
}
function toOffer(o: ApiOffer): OfferItem {
  const max = o.band_max || 0;
  const over = max > 0 && o.offered_salary > max;
  return {
    id: String(o.id),
    code: `OFFER-${o.id}`,
    candidate_name: o.candidate_name || '',
    position: o.job_title || '',
    department: o.department || '',
    offered_salary: Math.round((o.offered_salary / M) * 10) / 10,
    max_band_salary: Math.round((max / M) * 10) / 10,
    is_over_band: over || !!o.requires_escalation,
    over_percentage: over ? Math.round(((o.offered_salary - max) / max) * 100) : 0,
    start_date: vnDate(o.start_date),
    deadline_date: vnDate(o.response_deadline),
    notes: o.notes || '',
    status: toStatus(o.status),
    created_at: vnDate(o.created_at),
  };
}
async function loadOffers() {
  const [offers, appsRes, reqsRes, jobsRes] = await Promise.all([
    offerService.getOffers().catch(() => []),
    apiRequest<ApiApplication[]>('/applications').catch(() => []),
    requisitionService.getRequisitions().catch(() => []),
    jobService.getAdminJobs().catch(() => []),
  ]);
  const offersList = Array.isArray(offers) ? offers : [];
  const appList: ApiApplication[] = Array.isArray(appsRes) ? appsRes : ((appsRes as any)?.items || (appsRes as any)?.data || []);
  const reqs = Array.isArray(reqsRes) ? reqsRes : [];
  const jobs = Array.isArray(jobsRes) ? jobsRes : [];

  const withOffer = new Set(offersList.map((o) => Number(o.application_id)));
  const TERMINAL_STATUSES = new Set(['hired', 'rejected', 'withdrawn', 'onboarded']);

  // Eligible candidates: active applications in pipeline not in terminal states and without an existing offer
  let eligible = appList.filter((a: ApiApplication) => !TERMINAL_STATUSES.has(a.status) && !withOffer.has(Number(a.id)));
  if (eligible.length === 0) {
    // Fallback: any application not having an offer
    eligible = appList.filter((a: ApiApplication) => !withOffer.has(Number(a.id)));
  }

  const candidates: CandidateOfferOption[] = eligible.map((a: ApiApplication) => {
    const job = jobs.find((j) => j.id === a.job_posting_id);
    const req = reqs.find((r) => r.id === job?.requisition_id);
    const max = req?.max_salary || 30_000_000;
    const min = req?.min_salary || 15_000_000;
    return {
      id: String(a.id),
      name: a.full_name || `Ứng viên #${a.id}`,
      position: a.job_title || job?.title || 'Chuyên viên',
      department: a.department || job?.department || (req as any)?.department_name || 'Nhân sự',
      maxBandSalary: max,
      maxBandDisplay: `${Math.round(min / M)} - ${Math.round(max / M)} triệu VNĐ`,
    };
  });
  return { offers: offersList, candidates };
}
import { 
  DollarSign, AlertTriangle, CheckCircle2, XCircle, Clock, ShieldAlert, 
  Plus, Search, Filter, FileText, Send, Eye, Check, Calendar, ArrowUpRight
} from 'lucide-react';
import { CreateOfferModal, CreateOfferFormData } from '@/features/hr/components/CreateOfferModal';
import { OfferDetailModal } from '@/features/offers/components/OfferDetailModal';

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
  const [selectedOfferId, setSelectedOfferId] = useState<string | number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data, error, loading, reload } = useApiData(loadOffers, []);
  const offers: OfferItem[] = useMemo(() => (data?.offers || []).map(toOffer), [data]);

  const handleCreateOffer = async (formData: CreateOfferFormData) => {
    if (!formData.candidateId || !formData.startDate) {
      setToastMessage('Vui lòng chọn ứng viên và ngày nhận việc.');
      return;
    }
    try {
      await offerService.createOffer({
        application_id: Number(formData.candidateId),
        offered_salary: formData.proposedSalary,
        start_date: formData.startDate,
        response_deadline: formData.deadlineDate || null,
        notes: formData.allowanceNotes || undefined,
        salary_justification: formData.isOverBand
          ? `Đề xuất mức lương ${formData.proposedSalary.toLocaleString('vi-VN')} VNĐ (vượt dải ${formData.overPercentage}%) để tuyển dụng nhân sự chất lượng cao.`
          : undefined,
      });
      setIsOfferModalOpen(false);
      reload();
      setToastMessage(
        formData.isOverBand
          ? `Đã tạo Offer cho ${formData.candidateName} (vượt dải +${formData.overPercentage}%) — cần phê duyệt cấp cao theo quy trình.`
          : `Đã tạo Offer cho ${formData.candidateName} và chuyển Trưởng phòng Nhân sự phê duyệt.`
      );
    } catch (err) {
      setToastMessage(err instanceof ApiError ? err.message : 'Không tạo được offer.');
    }
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  const handleOpenDetail = (id: string | number) => {
    setSelectedOfferId(id);
    setIsDetailModalOpen(true);
  };

  const filteredOffers = useMemo(() => {
    return offers.filter((item) => {
      const matchesSearch = 
        item.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.position.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (filterStatus === 'all') return matchesSearch;
      if (filterStatus === 'over_band') return matchesSearch && item.is_over_band;
      if (filterStatus === 'in_band') return matchesSearch && !item.is_over_band;
      return matchesSearch && item.status === filterStatus;
    });
  }, [offers, searchQuery, filterStatus]);

  // Pagination states & slices
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredOffers.length / pageSize));
  const paginatedOffers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOffers.slice(start, start + pageSize);
  }, [filteredOffers, currentPage, pageSize]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

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
              {paginatedOffers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Không tìm thấy bản ghi Offer nào phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedOffers.map((off) => (
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
                        onClick={() => handleOpenDetail(off.id)}
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

        {/* Phân Trang Offers */}
        {filteredOffers.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-white rounded-b-2xl">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredOffers.length}
              pageSize={pageSize}
              pageSizeOptions={[5, 10, 20, 50]}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setCurrentPage(1);
              }}
              onPageChange={(p) => setCurrentPage(p)}
              itemLabel="đề xuất offer"
            />
          </div>
        )}
      </div>

      {/* Modal Form Tạo Offer */}
      <CreateOfferModal
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        onSubmit={handleCreateOffer}
        candidates={data?.candidates || []}
      />

      {/* Modal Form Xem Chi Tiết Offer Chuẩn Doanh Nghiệp */}
      <OfferDetailModal
        isOpen={isDetailModalOpen}
        offerId={selectedOfferId}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedOfferId(null);
        }}
        onActionSuccess={reload}
      />
    </div>
  );
}
