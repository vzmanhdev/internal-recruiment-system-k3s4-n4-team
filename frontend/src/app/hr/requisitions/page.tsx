'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search, Filter, AlertTriangle, Clock, UserPlus, PauseCircle, CheckCircle2, ShieldAlert, RefreshCw,
} from 'lucide-react';
import { requisitionService, type RequisitionItem } from '@/services/requisition.service';
import { masterDataService, type Person } from '@/services/master-data.service';
import { ApiError } from '@/lib/api-client';

type Assigned = { recruiter_id: number; full_name: string; assignment_type: 'primary' | 'secondary' };
type Row = RequisitionItem & {
  recruiters?: Assigned[];
  days_remaining?: number | null;
  is_overdue?: boolean;
};

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Nháp', cls: 'bg-slate-100 text-slate-600' },
  changes_requested: { label: 'Cần chỉnh sửa', cls: 'bg-amber-50 text-amber-700 border border-amber-100' },
  pending_manager: { label: 'Chờ duyệt', cls: 'bg-amber-50 text-amber-700 border border-amber-100' },
  pending_hr: { label: 'Chờ duyệt', cls: 'bg-amber-50 text-amber-700 border border-amber-100' },
  pending_executive: { label: 'Chờ duyệt', cls: 'bg-amber-50 text-amber-700 border border-amber-100' },
  approved: { label: 'Đang tuyển dụng', cls: 'bg-blue-50 text-blue-700 border border-blue-100' },
  rejected: { label: 'Bị từ chối', cls: 'bg-rose-50 text-rose-700' },
  paused: { label: 'Tạm dừng', cls: 'bg-slate-100 text-slate-600' },
  filled: { label: 'Đã tuyển đủ', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
  cancelled: { label: 'Đã hủy', cls: 'bg-rose-50 text-rose-700' },
};
const PENDING = new Set(['pending_manager', 'pending_hr', 'pending_executive']);
const CLOSED = new Set(['filled', 'cancelled', 'rejected']);

const money = (n?: number) => (n ? `${Math.round(n / 1_000_000)}` : '?');
const salaryRange = (r: Row) => (r.min_salary || r.max_salary ? `${money(r.min_salary)} - ${money(r.max_salary)} Triệu VNĐ` : 'Thỏa thuận');
const vnDate = (s?: string) => (s ? new Date(s).toLocaleDateString('vi-VN') : '—');

export default function HRRequisitionsPage() {
  const [requisitions, setRequisitions] = useState<Row[]>([]);
  const [recruiters, setRecruiters] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  const [activeModal, setActiveModal] = useState<'assign' | 'cancel' | null>(null);
  const [selectedReq, setSelectedReq] = useState<Row | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionType, setActionType] = useState<'paused' | 'cancelled' | 'filled'>('paused');
  const [assignedRecruiter, setAssignedRecruiter] = useState('');
  const [assignmentType, setAssignmentType] = useState<'primary' | 'secondary'>('primary');
  const [needsConfirm, setNeedsConfirm] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchRequisitions = useCallback(() => {
    setLoading(true);
    return requisitionService.getRequisitions()
      .then((rows) => { setRequisitions(rows as Row[]); setError(null); })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Không tải được danh sách tờ trình.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let active = true;
    requisitionService.getRequisitions()
      .then((rows) => { if (active) setRequisitions(rows as Row[]); })
      .catch((err) => { if (active) setError(err instanceof ApiError ? err.message : 'Không tải được danh sách tờ trình.'); })
      .finally(() => { if (active) setLoading(false); });
    masterDataService.people('recruiter').then((p) => active && setRecruiters(p)).catch(() => {});
    return () => { active = false; };
  }, []);

  const departments = useMemo(
    () => Array.from(new Set(requisitions.map((r) => r.department_name).filter(Boolean))) as string[],
    [requisitions],
  );

  const openModal = (req: Row, modal: 'assign' | 'cancel') => {
    setSelectedReq(req);
    setActiveModal(modal);
    setModalError(null);
    setNeedsConfirm(null);
    setActionReason('');
    setAssignedRecruiter('');
  };

  const handleCancelPauseSubmit = async () => {
    if (!selectedReq) return;
    if (!actionReason.trim()) { setModalError('Vui lòng nhập lý do bắt buộc.'); return; }
    setSaving(true); setModalError(null);
    try {
      await requisitionService.closeRequisition(selectedReq.id, actionType, actionReason.trim(), !!needsConfirm);
      setNotice(`Đã cập nhật tờ trình ${selectedReq.code}.`);
      setActiveModal(null);
      fetchRequisitions();
    } catch (err) {
      // 409 with active candidates: the API asks for an explicit second confirmation (S3-07 AC2).
      if (err instanceof ApiError && err.status === 409 && !needsConfirm && /ứng viên/i.test(err.message)) {
        setNeedsConfirm(err.message);
      } else {
        setModalError(err instanceof ApiError ? err.message : 'Không cập nhật được trạng thái.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAssignSubmit = async () => {
    if (!selectedReq || !assignedRecruiter) { setModalError('Vui lòng chọn Recruiter.'); return; }
    setSaving(true); setModalError(null);
    try {
      const res = await requisitionService.assignRecruiter(selectedReq.id, Number(assignedRecruiter), assignmentType);
      setNotice(res.message || 'Đã phân công recruiter.');
      setActiveModal(null);
      fetchRequisitions();
    } catch (err) {
      setModalError(err instanceof ApiError ? err.message : 'Không phân công được.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = requisitions.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery = item.title.toLowerCase().includes(q) || item.code.toLowerCase().includes(q);
    const matchesStatus = selectedStatus === 'all'
      || (selectedStatus === 'overdue' && item.is_overdue)
      || (selectedStatus === 'pending' && PENDING.has(item.status))
      || item.status === selectedStatus;
    const matchesDept = selectedDept === 'all' || item.department_name === selectedDept;
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
          <p className="text-xs text-slate-500 mt-1">Theo dõi tiến độ tờ trình, gán Recruiter phụ trách & giám sát cảnh báo quá hạn</p>
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

      {error && <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">{error}</div>}
      {notice && (
        <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
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
            <option value="overdue">🔴 Quá hạn</option>
            <option value="approved">Đang tuyển dụng</option>
            <option value="pending">Chờ duyệt</option>
            <option value="paused">Tạm dừng</option>
            <option value="filled">Đã tuyển đủ</option>
            <option value="cancelled">Đã hủy</option>
          </select>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">Tất cả phòng ban</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
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
                <th className="p-4">Ngày Cần Nhân Sự</th>
                <th className="p-4">Tiến Độ</th>
                <th className="p-4">Recruiter Phụ Trách</th>
                <th className="p-4 text-center">Trạng Thái REQ</th>
                <th className="p-4 text-right">Thao Tác HR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-slate-400">Không có tờ trình nào phù hợp.</td></tr>
              )}
              {filtered.map((req) => {
                const primary = req.recruiters?.find((r) => r.assignment_type === 'primary');
                const support = req.recruiters?.filter((r) => r.assignment_type !== 'primary') || [];
                const status = STATUS_LABELS[req.status] || { label: req.status, cls: 'bg-slate-100 text-slate-600' };
                const warning = !req.is_overdue && req.days_remaining != null && req.days_remaining <= 7 && !CLOSED.has(req.status);
                return (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{req.title}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">{req.code}</span>
                        <span>• Dải lương: {salaryRange(req)}</span>
                      </div>
                    </td>

                    <td className="p-4"><span className="text-slate-800 font-semibold">{req.department_name}</span></td>

                    <td className="p-4 text-center font-bold text-blue-700">{req.quantity} người</td>

                    <td className="p-4 text-slate-600">{vnDate(req.target_onboard_date)}</td>

                    <td className="p-4">
                      {CLOSED.has(req.status) ? (
                        <span className="text-slate-400">—</span>
                      ) : req.is_overdue ? (
                        <span className="bg-rose-50 text-rose-600 border border-rose-200 px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 w-max">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Quá hạn {Math.abs(req.days_remaining || 0)} ngày</span>
                        </span>
                      ) : warning ? (
                        <span className="bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 w-max">
                          <Clock className="w-3 h-3" />
                          <span>Còn {req.days_remaining} ngày</span>
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 w-max">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Trong tiến độ</span>
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      {primary ? (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center">
                              {primary.full_name.charAt(0)}
                            </div>
                            <span className="font-bold text-slate-900">{primary.full_name}</span>
                          </div>
                          {support.length > 0 && (
                            <div className="text-[10px] text-slate-400 mt-1">Hỗ trợ: {support.map((s) => s.full_name).join(', ')}</div>
                          )}
                        </div>
                      ) : req.status === 'approved' ? (
                        <button
                          onClick={() => openModal(req, 'assign')}
                          className="text-blue-600 hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Phân công Recruiter</span>
                        </button>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${status.cls}`}>{status.label}</span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {req.status === 'approved' && (
                          <button
                            onClick={() => openModal(req, 'assign')}
                            title="Phân công Recruiter"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                        )}
                        {(req.status === 'approved' || req.status === 'paused') && (
                          <button
                            onClick={() => openModal(req, 'cancel')}
                            title="Tạm dừng / Hủy / Đóng REQ"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                          >
                            <PauseCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
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
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="font-bold text-slate-900">{selectedReq.title}</div>
                <div className="text-slate-500">Mã REQ: {selectedReq.code} | Phòng ban: {selectedReq.department_name}</div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Recruiter *</label>
                <select
                  value={assignedRecruiter}
                  onChange={(e) => setAssignedRecruiter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                >
                  <option value="">-- Chọn chuyên viên tuyển dụng --</option>
                  {recruiters.map((r) => <option key={r.id} value={r.id}>{r.full_name} ({r.email})</option>)}
                </select>
                {recruiters.length === 0 && <p className="text-[11px] text-slate-400 mt-1">Chưa có tài khoản nào mang vai trò Recruiter.</p>}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Vai trò phụ trách</label>
                <select
                  value={assignmentType}
                  onChange={(e) => setAssignmentType(e.target.value as 'primary' | 'secondary')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                >
                  <option value="primary">Phụ trách chính</option>
                  <option value="secondary">Hỗ trợ</option>
                </select>
              </div>
              {modalError && <div className="text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{modalError}</div>}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer">Hủy</button>
              <button disabled={saving} onClick={handleAssignSubmit} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer">Xác Nhận Phân Công</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Tạm Dừng / Hủy / Đóng REQ — lý do bắt buộc [S3-07] */}
      {activeModal === 'cancel' && selectedReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900">Thay Đổi Trạng Thái Tờ Trình [S3-07]</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 text-slate-700 space-y-1">
                <div className="font-bold text-slate-900">{selectedReq.title} ({selectedReq.code})</div>
                <p className="text-[11px] text-rose-700">Lưu ý: Tạm dừng/Hủy/Đóng sẽ tự động gỡ các tin tuyển dụng công khai của tờ trình này.</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Trạng Thái Mới *</label>
                <select
                  value={actionType}
                  onChange={(e) => { setActionType(e.target.value as 'paused' | 'cancelled' | 'filled'); setNeedsConfirm(null); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
                >
                  {selectedReq.status !== 'paused' && <option value="paused">⏸ Tạm dừng tuyển dụng</option>}
                  <option value="cancelled">❌ Hủy bỏ yêu cầu tuyển dụng</option>
                  <option value="filled">✅ Đã tuyển đủ nhân sự</option>
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
              {needsConfirm && (
                <div className="text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  {needsConfirm} Bấm &quot;Xác Nhận Cập Nhật&quot; lần nữa để tiếp tục.
                </div>
              )}
              {modalError && <div className="text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{modalError}</div>}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setActiveModal(null)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer">Bỏ Qua</button>
              <button disabled={saving} onClick={handleCancelPauseSubmit} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer">Xác Nhận Cập Nhật</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
