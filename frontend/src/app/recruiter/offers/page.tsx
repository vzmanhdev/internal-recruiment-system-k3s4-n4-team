'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { getSearchScore } from '@/utils/vietnameseSearch';
import { getLocalTodayDateString, isPastDate } from '@/utils/dateUtils';
import { SearchAutocompleteInput } from '@/components/ui/SearchAutocompleteInput';
import { OfferDetailModal } from '@/features/offers/components/OfferDetailModal';
import {
  Mail,
  Plus,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  DollarSign,
  Award,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Filter,
  Search,
  Users,
  CheckSquare,
  Square,
  ArrowRight,
  ChevronRight,
  X,
  ExternalLink,
  ShieldCheck,
  Building2,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Calendar,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import clsx from 'clsx';
import { apiRequest, ApiError } from '@/lib/api-client';
import { offerService, type OfferItem } from '@/services/offer.service';
import { candidatesApi, STAGE_LABEL, type ApiApplication } from '@/features/candidates/api';
import { useApiData } from '@/hooks/useApiData';
import { ErrorState, LoadingState } from '@/components/ui/DataStates';

// ==========================================
// 1. DATA TYPES & INTERFACES
// ==========================================

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'renegotiating';

export type RejectionReasonCategory =
  | 'salary_low'
  | 'too_far'
  | 'competitor_offer'
  | 'benefits_low'
  | 'start_date_mismatch'
  | 'other';

export interface OfferProposal {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  candidateAvatar: string;
  position: string;
  department: string;
  baseSalary: number; // VND/month
  allowanceAndBonus: string;
  startDate: string; // YYYY-MM-DD
  deadlineDate: string; // YYYY-MM-DD
  status: OfferStatus;
  rejectionReasonCategory?: RejectionReasonCategory;
  rejectionReasonNote?: string;
  approvalChain: string;
  sentDate: string;
  negotiationRound?: number;
  raw: OfferItem;
}

export interface BulkCandidate {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  resultStatus: 'pass' | 'fail' | 'pending';
  stageName: string;
  matchScore: number;
}

// ==========================================
// 2. REAL OFFERS / APPLICATIONS -> PAGE MODELS
// ==========================================

// UI reason category <-> backend decline reason (salary, location, other_offer, personal, other)
const REASON_TO_API: Record<RejectionReasonCategory, string> = {
  salary_low: 'salary', too_far: 'location', competitor_offer: 'other_offer',
  benefits_low: 'other', start_date_mismatch: 'other', other: 'other',
};

function parseDecline(reason?: string | null): { category?: RejectionReasonCategory; note?: string } {
  if (!reason) return {};
  const [code, ...rest] = reason.split(':');
  let note = rest.join(':').trim();
  const tagged = /^\[(benefits_low|start_date_mismatch)\]\s*/.exec(note);
  if (tagged) note = note.slice(tagged[0].length);
  const category: RejectionReasonCategory = tagged
    ? (tagged[1] as RejectionReasonCategory)
    : code === 'salary' ? 'salary_low' : code === 'location' ? 'too_far' : code === 'other_offer' ? 'competitor_offer' : 'other';
  return { category, note };
}

const STATUS_TEXT: Record<string, string> = {
  draft: 'Bản nháp — chưa gửi duyệt', pending_approval: 'Đang chờ Trưởng phòng Nhân sự duyệt', approved: 'Đã duyệt — chờ gửi ứng viên',
  sent: 'Đã gửi ứng viên — chờ phản hồi', accepted: 'Ứng viên đã đồng ý', declined: 'Ứng viên từ chối', rejected: 'Bị từ chối duyệt',
  expired: 'Quá hạn phản hồi', changes_requested: 'Cần chỉnh sửa',
};

function toOffer(o: OfferItem & { sent_at?: string | null }): OfferProposal {
  const declined = o.status === 'declined' || o.status === 'expired' || o.status === 'rejected';
  const { category, note } = parseDecline(o.decline_reason);
  return {
    id: `OFF-${o.id}`,
    candidateName: o.candidate_name || '',
    candidateEmail: o.candidate_email || '',
    candidatePhone: '',
    candidateAvatar: '',
    position: o.job_title || '',
    department: o.department || '',
    baseSalary: o.offered_salary,
    allowanceAndBonus: [o.allowance ? `Phụ cấp ${o.allowance.toLocaleString('vi-VN')} đ` : '', o.notes || ''].filter(Boolean).join(' · '),
    startDate: o.start_date,
    deadlineDate: o.response_deadline || '',
    status: o.status === 'accepted' ? 'accepted' : declined ? 'rejected' : 'pending',
    rejectionReasonCategory: o.status === 'declined' ? category : undefined,
    rejectionReasonNote: o.status === 'declined' ? note : undefined,
    approvalChain: STATUS_TEXT[o.status] || o.status,
    sentDate: o.sent_at ? new Date(o.sent_at).toLocaleDateString('vi-VN') : '',
    negotiationRound: (o.revision || 0) + 1,
    raw: o,
  };
}

function toBulkCandidate(a: ApiApplication): BulkCandidate {
  const resultStatus: BulkCandidate['resultStatus'] =
    a.status === 'rejected' || (a.rating != null && a.rating <= 2) ? 'fail'
      : a.status === 'offered' || a.status === 'hired' || a.status === 'onboarded' || (a.rating != null && a.rating >= 4) ? 'pass' : 'pending';
  return {
    id: String(a.id), name: a.full_name, email: a.email, position: a.job_title || '', department: a.department || '',
    resultStatus, stageName: STAGE_LABEL[a.status] || a.status, matchScore: Math.round(a.match_score ?? 0),
  };
}

// Direct-message texts for the templates that have no dedicated workflow e-mail
const DIRECT_TEMPLATES: Record<'interview' | 'reminder', (name: string, job: string) => { subject: string; body: string }> = {
  interview: (name, job) => ({
    subject: `[Thư mời phỏng vấn] Lịch phỏng vấn Vòng chuyên môn - Vị trí ${job}`,
    body: `Kính gửi bạn ${name},\n\nBộ phận Tuyển dụng trân trọng kính mời bạn tham gia buổi phỏng vấn cho vị trí ${job}. Lịch hẹn chi tiết sẽ được gửi kèm thư xác nhận.\n\nTrân trọng,\nPhòng Nhân sự & Tuyển dụng`,
  }),
  reminder: (name, job) => ({
    subject: `[Nhắc nhở hạn phản hồi] Thư mời nhận việc vị trí ${job}`,
    body: `Chào bạn ${name},\n\nBộ phận Tuyển dụng xin phép nhắc lại về thời hạn phản hồi Thư mời nhận việc vị trí ${job}. Vui lòng phản hồi qua liên kết trong thư mời.\n\nTrân trọng,\nPhòng Nhân sự & Tuyển dụng`,
  }),
};

const errorText = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback);
const escapeAttr = (html: string) => html.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

const REJECTION_LABELS: Record<RejectionReasonCategory, { label: string; color: string }> = {
  salary_low: {
    label: 'Lương thấp hơn kỳ vọng thị trường',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  too_far: {
    label: 'Địa điểm làm việc xa / Không có Hybrid/Remote',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  competitor_offer: {
    label: 'Đã nhận offer đối thủ cạnh tranh đãi ngộ tốt hơn',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  benefits_low: {
    label: 'Chế độ phúc lợi & bảo hiểm chưa hấp dẫn',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  start_date_mismatch: {
    label: 'Không thỏa thuận được ngày nhận việc',
    color: 'bg-slate-100 text-slate-700 border-slate-300',
  },
  other: {
    label: 'Lý do cá nhân khác',
    color: 'bg-slate-100 text-slate-700 border-slate-300',
  },
};

export default function RecruiterOffersPage() {
  const [activeTab, setActiveTab] = useState<'offers' | 'letters'>('offers');
  const [selectedDetailOfferId, setSelectedDetailOfferId] = useState<string | number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { data: offerRows, error, loading, reload, setData: setOfferRows } = useApiData(() => offerService.getOffers(), []);
  const offers = useMemo(() => (offerRows || []).map(toOffer), [offerRows]);
  const putOfferRow = (row: OfferItem) =>
    setOfferRows((prev) => (prev || []).some((x) => x.id === row.id) ? (prev || []).map((x) => (x.id === row.id ? row : x)) : [row, ...(prev || [])]);
  const { data: appRows } = useApiData(() => apiRequest<ApiApplication[]>('/applications'), []);
  const offeredAppIds = useMemo(() => new Set((offerRows || []).map((o) => o.application_id)), [offerRows]);
  // candidates that may receive a new offer: past screening, still open, no offer yet
  const offerable = useMemo(
    () => (appRows || []).filter((a) => (a.status === 'interviewing' || a.status === 'offered') && !offeredAppIds.has(a.id)),
    [appRows, offeredAppIds],
  );
  const BULK_CANDIDATES = useMemo(() => (appRows || []).map(toBulkCandidate), [appRows]);
  const [saving, setSaving] = useState(false);
  const [offerSearch, setOfferSearch] = useState('');
  const [offerStatusFilter, setOfferStatusFilter] = useState<'all' | OfferStatus>('all');
  const [toast, setToast] = useState<string | null>(null);

  // Modal 1: Soạn Offer mới
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [newOfferForm, setNewOfferForm] = useState({
    applicationId: '',
    candidateName: '',
    candidateEmail: '',
    candidatePhone: '',
    position: '',
    department: '',
    baseSalary: 0,
    allowanceAndBonus: '',
    startDate: '',
    deadlineDate: '',
  });

  // Modal 2: Ghi nhận Lý do Từ chối / Thương lượng lại (Salary Adjustment Data)
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [selectedOfferForRejection, setSelectedOfferForRejection] = useState<OfferProposal | null>(null);
  const [rejectionForm, setRejectionForm] = useState({
    status: 'renegotiating' as 'rejected' | 'renegotiating',
    category: 'salary_low' as RejectionReasonCategory,
    note: '',
    counterSalaryExpected: 0,
  });

  // Tab 2: Quản lý Thư & Gửi thư hàng loạt (Bulk Emailing)
  const [bulkFilter, setBulkFilter] = useState<'all' | 'pass' | 'fail' | 'pending'>('all');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<'offer' | 'rejection' | 'interview' | 'reminder'>('offer');
  const [isSendingBulk, setIsSendingBulk] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // ==========================================
  // HANDLERS FOR OFFERS (TAB 1)
  // ==========================================

  // Submit Soạn Offer mới
  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfferForm.applicationId) {
      showToast('Vui lòng chọn ứng viên.');
      return;
    }
    if (!newOfferForm.baseSalary || !newOfferForm.startDate) {
      showToast('Vui lòng nhập mức lương và ngày nhận việc.');
      return;
    }
    if (isPastDate(newOfferForm.startDate)) {
      showToast('Ngày nhận việc dự kiến không được ở trong quá khứ.');
      return;
    }
    if (newOfferForm.deadlineDate && isPastDate(newOfferForm.deadlineDate)) {
      showToast('Hạn chót phản hồi offer không được ở trong quá khứ.');
      return;
    }
    if (newOfferForm.deadlineDate && newOfferForm.startDate && newOfferForm.deadlineDate > newOfferForm.startDate) {
      showToast('Hạn chót phản hồi offer phải trước hoặc bằng ngày nhận việc.');
      return;
    }
    setSaving(true);
    try {
      const created = await offerService.createOffer({
        application_id: Number(newOfferForm.applicationId),
        offered_salary: Number(newOfferForm.baseSalary),
        start_date: newOfferForm.startDate,
        response_deadline: newOfferForm.deadlineDate || null,
        notes: newOfferForm.allowanceAndBonus || undefined,
      });
      putOfferRow(created);
      setIsDraftModalOpen(false);
      showToast(`Đã tạo offer cho "${created.candidate_name}" và gửi Trưởng phòng Nhân sự phê duyệt.`);
    } catch (err) {
      showToast(errorText(err, 'Không tạo được offer.'));
    } finally {
      setSaving(false);
    }
  };

  // Mở popup ghi nhận lý do từ chối
  const handleOpenRejectionPopup = (offer: OfferProposal) => {
    setSelectedOfferForRejection(offer);
    setRejectionForm({
      status: offer.status === 'renegotiating' ? 'renegotiating' : 'rejected',
      category: offer.rejectionReasonCategory || 'salary_low',
      note: offer.rejectionReasonNote || '',
      counterSalaryExpected: offer.baseSalary + 5000000,
    });
    setIsRejectionModalOpen(true);
  };

  // Lưu lý do từ chối vào database
  const handleSaveRejectionReason = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = selectedOfferForRejection;
    if (!target) return;
    const label = REJECTION_LABELS[rejectionForm.category].label;
    setSaving(true);
    try {
      if (rejectionForm.status === 'rejected') {
        // the candidate declined: recorded on the offer (reason feeds the decline analytics)
        const tag = rejectionForm.category === 'benefits_low' || rejectionForm.category === 'start_date_mismatch' ? `[${rejectionForm.category}] ` : '';
        const updated = await offerService.respond(target.raw.id, 'declined', REASON_TO_API[rejectionForm.category], `${tag}${rejectionForm.note}`.trim() || undefined);
        putOfferRow(updated);
        showToast(`Đã ghi nhận lý do từ chối của "${target.candidateName}".`);
      } else {
        // renegotiation request: kept in the candidate's internal notes; revise the offer terms afterwards
        const expected = rejectionForm.counterSalaryExpected ? ` — kỳ vọng ${rejectionForm.counterSalaryExpected.toLocaleString('vi-VN')} đ/tháng` : '';
        await candidatesApi.addNote(target.raw.application_id, `Ứng viên đề nghị thương lượng lại offer: ${label}${expected}. ${rejectionForm.note}`.trim());
        showToast(`Đã lưu đề nghị thương lượng của "${target.candidateName}" vào ghi chú hồ sơ.`);
      }
      setIsRejectionModalOpen(false);
    } catch (err) {
      showToast(errorText(err, 'Không lưu được phản hồi.'));
    } finally {
      setSaving(false);
    }
  };

  // Chuyển nhanh trạng thái Offer
  // Next real step of the offer workflow: draft -> submit, approved -> send, sent -> accepted
  const handleQuickStatusChange = async (offerId: string, newStatus: OfferStatus) => {
    const target = offers.find((o) => o.id === offerId);
    if (!target) return;
    if (newStatus === 'rejected' || newStatus === 'renegotiating') {
      handleOpenRejectionPopup(target);
      return;
    }
    const st = target.raw.status;
    try {
      if (st === 'draft') {
        putOfferRow(await offerService.submitOffer(target.raw.id));
        showToast(`Đã gửi offer "${target.candidateName}" cho Trưởng phòng Nhân sự duyệt.`);
      } else if (st === 'approved') {
        putOfferRow(await offerService.sendOffer(target.raw.id));
        showToast(`Đã gửi thư mời nhận việc tới "${target.candidateName}".`);
      } else if (st === 'sent') {
        putOfferRow(await offerService.respond(target.raw.id, 'accepted'));
        showToast(`Đã ghi nhận "${target.candidateName}" đồng ý offer; checklist onboarding đã được tạo.`);
      } else {
        showToast(`Offer đang ở trạng thái: ${STATUS_TEXT[st] || st}.`);
      }
    } catch (err) {
      showToast(errorText(err, 'Không cập nhật được offer.'));
    }
  };

  // Open Enterprise Offer Detail Modal
  const handleOpenLetter = (offer: OfferProposal) => {
    setSelectedDetailOfferId(offer.raw.id);
    setIsDetailModalOpen(true);
  };

  // ==========================================
  // HANDLERS FOR BULK EMAILING (TAB 2)
  // ==========================================

  const filteredBulkCandidates = useMemo(() => {
    return BULK_CANDIDATES.filter((c) => {
      if (bulkFilter === 'all') return true;
      return c.resultStatus === bulkFilter;
    });
  }, [bulkFilter, BULK_CANDIDATES]);

  const handleToggleSelectAll = () => {
    const visibleIds = filteredBulkCandidates.map((c) => c.id);
    const isAllSelected = visibleIds.every((id) => selectedCandidateIds.includes(id));

    if (isAllSelected) {
      setSelectedCandidateIds(selectedCandidateIds.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedCandidateIds(Array.from(new Set([...selectedCandidateIds, ...visibleIds])));
    }
  };

  const handleToggleCandidate = (id: string) => {
    if (selectedCandidateIds.includes(id)) {
      setSelectedCandidateIds(selectedCandidateIds.filter((item) => item !== id));
    } else {
      setSelectedCandidateIds([...selectedCandidateIds, id]);
    }
  };

  // Gửi thư hàng loạt
  const handleSendBulkEmails = async () => {
    if (selectedCandidateIds.length === 0) {
      showToast('Vui lòng chọn ít nhất một ứng viên để gửi thư.');
      return;
    }
    const chosen = (appRows || []).filter((a) => selectedCandidateIds.includes(String(a.id)));
    setIsSendingBulk(true);
    let queued = 0, skipped = 0;
    try {
      if (selectedTemplate === 'rejection') {
        // the server only batches candidates in the same stage -> one request per stage
        const byStatus = new Map<string, number[]>();
        chosen.forEach((a) => byStatus.set(a.status, [...(byStatus.get(a.status) || []), a.id]));
        for (const ids of byStatus.values()) {
          const r = await apiRequest<{ queued: number; skipped_duplicates: number }>('/applications/bulk-email', {
            method: 'POST', body: JSON.stringify({ application_ids: ids, template_code: 'REJECT_CANDIDATE' }),
          });
          queued += r.queued;
          skipped += r.skipped_duplicates;
        }
      } else if (selectedTemplate === 'offer') {
        // official offer letters only go out for offers already approved
        for (const a of chosen) {
          const offer = (offerRows || []).find((o) => o.application_id === a.id && o.status === 'approved');
          if (!offer) { skipped += 1; continue; }
          putOfferRow(await offerService.sendOffer(offer.id));
          queued += 1;
        }
      } else {
        for (const a of chosen) {
          const msg = DIRECT_TEMPLATES[selectedTemplate](a.full_name, a.job_title || '');
          await candidatesApi.sendEmail(a.id, msg.subject, msg.body);
          queued += 1;
        }
      }
      showToast(`Đã đưa ${queued} thư vào hàng đợi gửi${skipped ? `, bỏ qua ${skipped} ứng viên (trùng thư hoặc chưa có offer đã duyệt)` : ''}.`);
    } catch (err) {
      showToast(errorText(err, 'Gửi thư hàng loạt bị lỗi.') + (queued ? ` (đã gửi ${queued} thư trước khi lỗi)` : ''));
    } finally {
      setIsSendingBulk(false);
    }
  };

  // ==========================================
  // THỐNG KÊ & ANALYTICS LÝ DO TỪ CHỐI
  // ==========================================
  const analyticsData = useMemo(() => {
    const total = offers.length;
    const accepted = offers.filter((o) => o.status === 'accepted').length;
    const pending = offers.filter((o) => o.status === 'pending').length;
    const rejectedOrNego = offers.filter(
      (o) => o.status === 'rejected' || o.status === 'renegotiating'
    ).length;

    // Phân tích lý do từ chối
    const reasonsCount: Record<string, number> = {
      salary_low: 0,
      too_far: 0,
      competitor_offer: 0,
      benefits_low: 0,
      start_date_mismatch: 0,
      other: 0,
    };

    offers.forEach((o) => {
      if (o.rejectionReasonCategory) {
        reasonsCount[o.rejectionReasonCategory] =
          (reasonsCount[o.rejectionReasonCategory] || 0) + 1;
      }
    });

    return { total, accepted, pending, rejectedOrNego, reasonsCount };
  }, [offers]);

  const filteredOffers = useMemo(() => {
    const q = offerSearch.trim();
    return offers.filter((o) => {
      if (q) {
        const score = Math.max(
          getSearchScore(o.candidateName, q),
          getSearchScore(o.position, q),
          getSearchScore(o.id, q)
        );
        if (score === 0) return false;
      }
      const matchStatus = offerStatusFilter === 'all' || o.status === offerStatusFilter;
      return matchStatus;
    }).sort((a, b) => {
      if (q) {
        const scoreA = Math.max(
          getSearchScore(a.candidateName, q),
          getSearchScore(a.position, q),
          getSearchScore(a.id, q)
        );
        const scoreB = Math.max(
          getSearchScore(b.candidateName, q),
          getSearchScore(b.position, q),
          getSearchScore(b.id, q)
        );
        if (scoreA !== scoreB) return scoreB - scoreA;
      }
      return 0;
    });
  }, [offers, offerSearch, offerStatusFilter]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-6 antialiased font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* 1. TOP HEADER & PRIMARY ACTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
            <Link href="/recruiter" className="hover:text-blue-600 transition-colors">
              Recruiter Workspace
            </Link>
            <span>&rsaquo;</span>
            <span className="text-slate-700 font-bold">Quản lý Offer & Thư</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Mail className="w-8 h-8 text-blue-600" />
            <span>Quản Lý Đề Xuất Offer & Thư Tuyển Dụng</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Theo dõi tỷ lệ chốt offer, ghi nhận lý do từ chối để điều chỉnh lương, và gửi thư thông báo hàng loạt.
          </p>
        </div>

        {activeTab === 'offers' ? (
          <button
            type="button"
            onClick={() => setIsDraftModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 flex items-center gap-2.5 transition-all transform active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Soạn Offer Mới</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={isSendingBulk || selectedCandidateIds.length === 0}
            onClick={handleSendBulkEmails}
            className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 flex items-center gap-2.5 transition-all transform active:scale-95 cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>
              {isSendingBulk
                ? 'Đang phát hành email...'
                : `Gửi Thư Hàng Loạt (${selectedCandidateIds.length} người)`}
            </span>
          </button>
        )}
      </div>

      {/* 2. TAB CONTROLLER: TAB 1 (QUẢN LÝ OFFER) VS TAB 2 (QUẢN LÝ THƯ & GIAO TIẾP) */}
      <div className="flex items-center gap-3 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('offers')}
          className={clsx(
            'pb-3.5 font-extrabold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer',
            activeTab === 'offers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          )}
        >
          <FileText className="w-4 h-4" />
          <span>Quản Lý Đề Xuất Offer (Tab 1)</span>
          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
            {offers.length} đề xuất
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('letters')}
          className={clsx(
            'pb-3.5 font-extrabold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer',
            activeTab === 'letters'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          )}
        >
          <Users className="w-4 h-4" />
          <span>Gửi Thư Hàng Loạt & Template (Tab 2)</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
            {BULK_CANDIDATES.length} ứng viên sẵn sàng
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: QUẢN LÝ OFFER (OFFER MANAGEMENT)                    */}
      {/* ======================================================== */}
      {activeTab === 'offers' && (
        <div className="space-y-6">
          {/* KPI CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
              <div className="text-slate-400 text-xs font-bold flex items-center justify-between">
                <span>Tổng đề xuất Offer</span>
                <FileText className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {analyticsData.total}
              </div>
              <p className="text-[11px] text-slate-400">100% qua quy trình phê duyệt</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
              <div className="text-emerald-600 text-xs font-bold flex items-center justify-between">
                <span>Đã đồng ý (Accept)</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700">
                {analyticsData.accepted}
              </div>
              <p className="text-[11px] text-emerald-600/80">
                Tỷ lệ nhận việc:{' '}
                <strong>{Math.round((analyticsData.accepted / analyticsData.total) * 100)}%</strong>
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
              <div className="text-amber-600 text-xs font-bold flex items-center justify-between">
                <span>Đang chờ phản hồi</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-700">
                {analyticsData.pending}
              </div>
              <p className="text-[11px] text-amber-600/80">Hạn chót trong 3 - 5 ngày tới</p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-1">
              <div className="text-rose-600 text-xs font-bold flex items-center justify-between">
                <span>Từ chối / Thương lượng</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-rose-700">
                {analyticsData.rejectedOrNego}
              </div>
              <p className="text-[11px] text-rose-600/80">Cần phân tích lý do điều chỉnh lương</p>
            </div>
          </div>

          {/* KHỐI PHÂN TÍCH: DỮ LIỆU ĐIỀU CHỈNH LƯƠNG (SALARY ADJUSTMENT INSIGHTS - User Story 1) */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-slate-800 font-bold text-sm sm:text-base tracking-tight">
                    Cảnh Báo Điều Chỉnh Mức Lương Tuyển Dụng (Salary Market Data)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dữ liệu tổng hợp từ các trường hợp ứng viên từ chối hoặc yêu cầu thương lượng lại.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-extrabold border border-blue-200">
                Data-Driven Recruitment
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-4 space-y-2">
                <div className="text-xs font-semibold flex items-center justify-between">
                  <span className="text-slate-700 font-semibold">Lương thấp hơn kỳ vọng</span>
                  <span className="text-rose-600 font-extrabold">Chiếm ~50%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-rose-500 h-2 rounded-full w-1/2"></div>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Ứng viên Senior Backend thường có offer cạnh tranh ở mức 48M - 52M net.
                </p>
              </div>

              <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-4 space-y-2">
                <div className="text-xs font-semibold flex items-center justify-between">
                  <span className="text-slate-700 font-semibold">Địa điểm xa / Không Hybrid</span>
                  <span className="text-amber-600 font-extrabold">Chiếm ~25%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full w-1/4"></div>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Đề xuất áp dụng cơ chế 2 ngày WFH/tuần cho các vị trí Tech/Product.
                </p>
              </div>

              <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-4 space-y-2">
                <div className="text-xs font-semibold flex items-center justify-between">
                  <span className="text-slate-700 font-semibold">Offer đối thủ cạnh tranh</span>
                  <span className="text-purple-600 font-extrabold">Chiếm ~25%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full w-1/4"></div>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Đối thủ có gói thưởng chào mừng (Sign-on Bonus) và bảo hiểm cho gia đình.
                </p>
              </div>
            </div>
          </div>

          {/* TOOLBAR: SEARCH & STATUS FILTER */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <SearchAutocompleteInput
                value={offerSearch}
                onChange={(val) => setOfferSearch(val)}
                onSelectSuggestion={(item) => setOfferSearch(item.title)}
                placeholder="Tìm theo ứng viên, vị trí, mã offer..."
                size="sm"
                localSuggestions={offers.map((o) => ({
                  id: o.id,
                  title: o.candidateName,
                  subtitle: `${o.position} • Lương: ${o.baseSalary ? o.baseSalary.toLocaleString('vi-VN') + ' đ' : 'Thoả thuận'} • ${o.status}`,
                  category: "candidate",
                  category_label: "Offer",
                }))}
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={offerStatusFilter}
                onChange={(e) => setOfferStatusFilter(e.target.value as typeof offerStatusFilter)}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">⏳ Đang chờ phản hồi</option>
                <option value="accepted">✅ Đã đồng ý (Accept)</option>
                <option value="rejected">❌ Bị từ chối</option>
                <option value="renegotiating">🔄 Thương lượng lại</option>
              </select>
            </div>
          </div>

          {/* OFFER TABLE (User Story 1) */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Ứng viên & Vị trí</th>
                    <th className="py-3.5 px-4">Mức lương đề xuất</th>
                    <th className="py-3.5 px-4">Ngày nhận việc</th>
                    <th className="py-3.5 px-4">Hạn phản hồi</th>
                    <th className="py-3.5 px-4">Trạng thái Offer</th>
                    <th className="py-3.5 px-4">Lý do từ chối (Data lương)</th>
                    <th className="py-3.5 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOffers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                        Không có đề xuất offer nào phù hợp với bộ lọc
                      </td>
                    </tr>
                  ) : (
                    filteredOffers.map((off) => {
                      const isRejectedOrNego =
                        off.status === 'rejected' || off.status === 'renegotiating';

                      return (
                        <tr
                          key={off.id}
                          className="hover:bg-slate-50/80 transition-colors group"
                        >
                          {/* Ứng viên */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              {off.candidateAvatar ? (
                                <img
                                  src={off.candidateAvatar}
                                  alt={off.candidateName}
                                  className="w-10 h-10 rounded-2xl object-cover border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-2xl bg-sky-100 text-[#0284C7] font-extrabold text-sm flex items-center justify-center border border-slate-200 shrink-0 select-none">
                                  {(off.candidateName || "U").trim().split(" ").slice(-1)[0][0]?.toUpperCase() || "U"}
                                </div>
                              )}
                              <div>
                                <span className="font-extrabold text-sm text-slate-900 block group-hover:text-blue-600 transition-colors">
                                  {off.candidateName}
                                </span>
                                <span className="text-[11px] text-slate-500 block truncate max-w-[200px]">
                                  {off.position}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  {off.id}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Mức lương */}
                          <td className="py-4 px-4">
                            <div className="space-y-0.5">
                              <span className="font-black text-sm text-blue-600 block">
                                {off.baseSalary.toLocaleString('vi-VN')} đ/tháng
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate max-w-[210px]" title={off.allowanceAndBonus}>
                                {off.allowanceAndBonus}
                              </span>
                            </div>
                          </td>

                          {/* Ngày nhận việc */}
                          <td className="py-4 px-4 font-bold text-slate-700">
                            {off.startDate}
                          </td>

                          {/* Hạn phản hồi */}
                          <td className="py-4 px-4">
                            <span className="px-2 py-1 rounded-xl bg-slate-100 text-slate-700 font-mono font-bold text-[11px]">
                              {off.deadlineDate}
                            </span>
                          </td>

                          {/* Trạng thái Offer */}
                          <td className="py-4 px-4">
                            {off.status === 'accepted' ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Đã đồng ý (Accept)</span>
                              </span>
                            ) : off.status === 'pending' ? (
                              <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black inline-flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Đang chờ</span>
                              </span>
                            ) : off.status === 'renegotiating' ? (
                              <button
                                type="button"
                                onClick={() => handleOpenRejectionPopup(off)}
                                className="px-2.5 py-1 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-black inline-flex items-center gap-1 cursor-pointer transition-colors"
                                title="Click để xem & cập nhật lý do thương lượng"
                              >
                                <RefreshCw className="w-3 h-3 text-purple-600" />
                                <span>Thương lượng lại (Lần {off.negotiationRound || 2})</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenRejectionPopup(off)}
                                className="px-2.5 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-black inline-flex items-center gap-1 cursor-pointer transition-colors"
                                title="Click để xem & cập nhật lý do từ chối"
                              >
                                <XCircle className="w-3 h-3 text-rose-600" />
                                <span>Bị từ chối</span>
                              </button>
                            )}
                          </td>

                          {/* Lý do từ chối (Data Điều Chỉnh Lương) */}
                          <td className="py-4 px-4 max-w-[220px]">
                            {isRejectedOrNego && off.rejectionReasonCategory ? (
                              <div
                                onClick={() => handleOpenRejectionPopup(off)}
                                className="cursor-pointer space-y-1 hover:opacity-80 transition-opacity"
                              >
                                <span
                                  className={clsx(
                                    'px-2 py-0.5 rounded-md text-[10px] font-bold border inline-block truncate max-w-[200px]',
                                    REJECTION_LABELS[off.rejectionReasonCategory].color
                                  )}
                                >
                                  {REJECTION_LABELS[off.rejectionReasonCategory].label}
                                </span>
                                {off.rejectionReasonNote && (
                                  <p className="text-[10px] text-slate-500 italic truncate">
                                    &ldquo;{off.rejectionReasonNote}&rdquo;
                                  </p>
                                )}
                              </div>
                            ) : isRejectedOrNego ? (
                              <button
                                type="button"
                                onClick={() => handleOpenRejectionPopup(off)}
                                className="text-[10px] text-rose-600 font-extrabold hover:underline cursor-pointer flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Ghi nhận lý do từ chối</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[10px] italic">--</span>
                            )}
                          </td>

                          {/* Thao tác */}
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {off.status === 'pending' && off.raw.status !== 'pending_approval' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickStatusChange(off.id, 'accepted')}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold transition-colors cursor-pointer"
                                  >
                                    {off.raw.status === 'draft' ? 'Gửi duyệt' : off.raw.status === 'approved' ? 'Gửi offer' : 'Đã đồng ý'}
                                  </button>
                                  {off.raw.status === 'sent' && <button
                                    type="button"
                                    onClick={() => handleOpenRejectionPopup(off)}
                                    className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold transition-colors cursor-pointer"
                                  >
                                    Từ chối
                                  </button>}
                                </>
                              )}

                              <button
                                type="button"
                                onClick={() => handleOpenLetter(off)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                                title="Xem file Offer PDF"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: QUẢN LÝ THƯ & GỬI THƯ HÀNG LOẠT (BULK EMAILING)    */}
      {/* ======================================================== */}
      {activeTab === 'letters' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI (7 COLS): DANH SÁCH ỨNG VIÊN & CHECKBOX CHỌN */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Chọn Danh Sách Ứng Viên Nhận Thư</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Đã chọn: <strong className="text-blue-600">{selectedCandidateIds.length}</strong> / {filteredBulkCandidates.length} ứng viên hiển thị
                  </p>
                </div>

                {/* Filter nút bấm: Pass / Fail / Pending */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setBulkFilter('all')}
                    className={clsx(
                      'px-3 py-1 rounded-xl transition-all cursor-pointer',
                      bulkFilter === 'all'
                        ? 'bg-white text-blue-600 shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkFilter('pass')}
                    className={clsx(
                      'px-3 py-1 rounded-xl transition-all cursor-pointer',
                      bulkFilter === 'pass'
                        ? 'bg-white text-emerald-700 shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    Đạt (Pass)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkFilter('fail')}
                    className={clsx(
                      'px-3 py-1 rounded-xl transition-all cursor-pointer',
                      bulkFilter === 'fail'
                        ? 'bg-white text-rose-700 shadow-xs font-black'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    Trượt (Fail)
                  </button>
                </div>
              </div>

              {/* Nút Chọn tất cả */}
              <div className="flex items-center justify-between text-xs px-2">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-blue-600 font-extrabold flex items-center gap-1.5 cursor-pointer hover:underline"
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>Chọn / Bỏ chọn tất cả trong danh sách này</span>
                </button>
              </div>

              {/* Checkbox List */}
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {filteredBulkCandidates.map((cand) => {
                  const isChecked = selectedCandidateIds.includes(cand.id);

                  return (
                    <label
                      key={cand.id}
                      className={clsx(
                        'flex items-center justify-between p-3.5 rounded-2xl transition-all cursor-pointer',
                        isChecked ? 'bg-blue-50/50 border border-blue-200' : 'hover:bg-slate-50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleCandidate(cand.id)}
                          className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                        />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-slate-900">
                              {cand.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              ({cand.id})
                            </span>
                            <span
                              className={clsx(
                                'text-[9px] font-black px-2 py-0.5 rounded-full uppercase',
                                cand.resultStatus === 'pass'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : cand.resultStatus === 'fail'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              )}
                            >
                              {cand.resultStatus === 'pass'
                                ? 'Đạt'
                                : cand.resultStatus === 'fail'
                                ? 'Không đạt'
                                : 'Chờ duyệt'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {cand.position} &bull; {cand.department}
                          </p>
                          <span className="text-[10px] text-slate-400 block">
                            Giai đoạn: <strong>{cand.stageName}</strong> ({cand.matchScore}% phù hợp)
                          </span>
                        </div>
                      </div>

                      <span className="text-[11px] font-mono text-slate-500">{cand.email}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (5 COLS): CHỌN TEMPLATE & XEM TRƯỚC NỘI DUNG THƯ (TEMPLATE PREVIEW) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4 text-xs">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>Chọn Mẫu Thư (Template Selector)</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Tự động điền biến tên, vị trí và mức lương cho từng người nhận.
                </p>
              </div>

              {/* Template Radio Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: 'offer',
                    name: 'Thư Mời Nhận Việc (Offer)',
                    color: 'text-emerald-700 border-emerald-200 bg-emerald-50/50',
                  },
                  {
                    id: 'rejection',
                    name: 'Thư Cảm Ơn & Từ Chối',
                    color: 'text-rose-700 border-rose-200 bg-rose-50/50',
                  },
                  {
                    id: 'interview',
                    name: 'Thư Mời Phỏng Vấn',
                    color: 'text-blue-700 border-blue-200 bg-blue-50/50',
                  },
                  {
                    id: 'reminder',
                    name: 'Nhắc Hạn Phản Hồi',
                    color: 'text-amber-700 border-amber-200 bg-amber-50/50',
                  },
                ].map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplate(tpl.id as typeof selectedTemplate)}
                    className={clsx(
                      'p-2.5 rounded-xl border text-left font-extrabold text-xs transition-all cursor-pointer',
                      selectedTemplate === tpl.id
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    )}
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>

              {/* KHUNG XEM TRƯỚC (PREVIEW) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                    Xem trước nội dung email
                  </span>
                  <span className="text-[10px] font-bold text-blue-600">Dynamic Merge Tags</span>
                </div>

                <div className="space-y-2 font-mono text-[11px] text-slate-800 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                  {selectedTemplate === 'offer' && (
                    <>
                      <p className="font-bold text-slate-900">
                        Tiêu đề: [Thư mời nhận việc] Chúc mừng bạn gia nhập Công ty - Vị trí {'{Vị trí}'}
                      </p>
                      <hr className="border-slate-100 my-1" />
                      <p>Kính gửi bạn <strong>{'{Tên ứng viên}'}</strong>,</p>
                      <p>
                        Ban Giám đốc và Phòng Tuyển dụng trân trọng gửi tới bạn Thư mời nhận việc chính thức (Offer Letter) cho vị trí <strong>{'{Vị trí}'}</strong> tại <strong>{'{Phòng ban}'}</strong>.
                      </p>
                      <p>
                        Mức lương cơ bản: <strong>{'{Mức lương thỏa thuận}'}</strong>. Ngày bắt đầu làm việc dự kiến: <strong>{'{Ngày nhận việc}'}</strong>.
                      </p>
                      <p>
                        Vui lòng phản hồi trước 17:00 ngày <strong>{'{Hạn chót}'}</strong>.
                      </p>
                      <p>Trân trọng,<br />Phòng Nhân sự & Tuyển dụng</p>
                    </>
                  )}

                  {selectedTemplate === 'rejection' && (
                    <>
                      <p className="font-bold text-slate-900">
                        Tiêu đề: [Thư cảm ơn] Cập nhật kết quả ứng tuyển vị trí {'{Vị trí}'}
                      </p>
                      <hr className="border-slate-100 my-1" />
                      <p>Chào bạn <strong>{'{Tên ứng viên}'}</strong>,</p>
                      <p>
                        Cảm ơn bạn đã dành thời gian tham gia quy trình phỏng vấn tại Công ty. Hội đồng tuyển dụng đánh giá rất cao năng lực chuyên môn và nhiệt huyết của bạn.
                      </p>
                      <p>
                        Tuy nhiên, ở thời điểm hiện tại chúng tôi đã lựa chọn được ứng viên có độ phù hợp cao hơn với đặc thù dự án. Chúng tôi xin phép được lưu giữ hồ sơ của bạn trong Talent Pool và sẽ chủ động liên hệ lại ngay khi có vị trí mới!
                      </p>
                      <p>Chúc bạn luôn thành công trên chặng đường sự nghiệp.</p>
                    </>
                  )}

                  {selectedTemplate === 'interview' && (
                    <>
                      <p className="font-bold text-slate-900">
                        Tiêu đề: [Thư mời phỏng vấn] Lịch phỏng vấn Vòng chuyên môn - Vị trí {'{Vị trí}'}
                      </p>
                      <hr className="border-slate-100 my-1" />
                      <p>Kính gửi bạn <strong>{'{Tên ứng viên}'}</strong>,</p>
                      <p>
                        Bộ phận Tuyển dụng trân trọng kính mời bạn tham gia buổi phỏng vấn trực tuyến cùng Ban Giám đốc và Hội đồng chuyên môn...
                      </p>
                    </>
                  )}

                  {selectedTemplate === 'reminder' && (
                    <>
                      <p className="font-bold text-slate-900">
                        Tiêu đề: [Nhắc nhở hạn phản hồi] Thư mời nhận việc vị trí {'{Vị trí}'}
                      </p>
                      <hr className="border-slate-100 my-1" />
                      <p>Chào bạn <strong>{'{Tên ứng viên}'}</strong>,</p>
                      <p>
                        Bộ phận Tuyển dụng xin phép nhắc lại về thời hạn phản hồi Thư mời nhận việc sẽ kết thúc vào lúc 17:00 ngày mai...
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Nút bấm Phát hành đồng loạt */}
              <button
                type="button"
                disabled={isSendingBulk || selectedCandidateIds.length === 0}
                onClick={handleSendBulkEmails}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-extrabold text-xs shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSendingBulk
                    ? 'Đang phát hành email...'
                    : `Gửi Thư Hàng Loạt Tới ${selectedCandidateIds.length} Ứng Viên`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: SOẠN OFFER MỚI (DRAFT NEW OFFER)                */}
      {/* ======================================================== */}
      {isDraftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 p-6 space-y-4 animate-in zoom-in-95 duration-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Soạn Thảo Đề Xuất Offer Mới</h3>
                  <p className="text-[11px] text-slate-400">
                    Điền mức lương, ngày nhận việc và thời hạn phản hồi để xin cấp duyệt.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDraftModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên ứng viên *
                  </label>
                  <select
                    required
                    value={newOfferForm.applicationId}
                    onChange={(e) => {
                      const a = offerable.find((x) => String(x.id) === e.target.value);
                      setNewOfferForm({
                        ...newOfferForm, applicationId: e.target.value, candidateName: a?.full_name || '',
                        candidateEmail: a?.email || '', position: a?.job_title || '', department: a?.department || '',
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <option value="">-- Chọn ứng viên --</option>
                    {offerable.map((a) => (
                      <option key={a.id} value={a.id}>{a.full_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email ứng viên *</label>
                  <input
                    type="email"
                    readOnly
                    placeholder="— theo hồ sơ ứng viên —"
                    value={newOfferForm.candidateEmail}
                    onChange={(e) =>
                      setNewOfferForm({ ...newOfferForm, candidateEmail: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vị trí ứng tuyển</label>
                  <select
                    value={newOfferForm.position}
                    disabled
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value={newOfferForm.position}>{newOfferForm.position || '— theo hồ sơ ứng viên —'}</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">
                      Mức lương cơ bản (VNĐ / tháng) *
                    </label>
                    {newOfferForm.baseSalary > 0 && (
                      <span className="text-[11px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {newOfferForm.baseSalary.toLocaleString('vi-VN')} VNĐ
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      step={500000}
                      placeholder="Ví dụ: 30000000"
                      value={newOfferForm.baseSalary || ''}
                      onChange={(e) =>
                        setNewOfferForm({ ...newOfferForm, baseSalary: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 pl-8 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-blue-600 focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold select-none text-xs">
                      ₫
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Chế độ đãi ngộ & Phụ cấp
                </label>
                <input
                  type="text"
                  value={newOfferForm.allowanceAndBonus}
                  onChange={(e) =>
                    setNewOfferForm({ ...newOfferForm, allowanceAndBonus: e.target.value })
                  }
                  placeholder="Ví dụ: Phụ cấp ăn trưa 1.5M, Laptop MacBook Pro M3..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ngày nhận việc dự kiến *
                  </label>
                  <input
                    type="date"
                    required
                    min={getLocalTodayDateString()}
                    value={newOfferForm.startDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewOfferForm({
                        ...newOfferForm,
                        startDate: val,
                        ...(newOfferForm.deadlineDate && val && newOfferForm.deadlineDate > val
                          ? { deadlineDate: val }
                          : {}),
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                  {newOfferForm.startDate && isPastDate(newOfferForm.startDate) && (
                    <p className="text-[10px] text-rose-500 mt-1 font-medium">⚠️ Ngày nhận việc không được ở quá khứ</p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Hạn chót phản hồi (Deadline) *
                  </label>
                  <input
                    type="date"
                    required
                    min={getLocalTodayDateString()}
                    max={newOfferForm.startDate || undefined}
                    value={newOfferForm.deadlineDate}
                    onChange={(e) =>
                      setNewOfferForm({ ...newOfferForm, deadlineDate: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                  {newOfferForm.deadlineDate && isPastDate(newOfferForm.deadlineDate) && (
                    <p className="text-[10px] text-rose-500 mt-1 font-medium">⚠️ Hạn phản hồi không được ở quá khứ</p>
                  )}
                  {newOfferForm.startDate && newOfferForm.deadlineDate && newOfferForm.deadlineDate > newOfferForm.startDate && (
                    <p className="text-[10px] text-rose-500 mt-1 font-medium">⚠️ Hạn phản hồi phải trước ngày nhận việc</p>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100 text-blue-900 text-[11px] leading-relaxed">
                ℹ️ Sau khi nhấn &ldquo;Lưu & Gửi Phê Duyệt&rdquo;, offer được chuyển tới Trưởng phòng Nhân sự phê duyệt (và cấp cao hơn nếu mức lương vượt khung) trước khi phát hành thư chính thức.
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDraftModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-60"
                >
                  Lưu & Gửi Phê Duyệt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: GHI NHẬN LÝ DO TỪ CHỐI / THƯƠNG LƯỢNG LẠI        */}
      {/* (User Story 1 - Phục vụ Data Điều Chỉnh Mức Lương)       */}
      {/* ======================================================== */}
      {isRejectionModalOpen && selectedOfferForRejection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-4 animate-in zoom-in-95 duration-200 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    Ghi Nhận Lý Do Từ Chối / Thương Lượng
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Dữ liệu sẽ được lưu vào hệ thống phân tích lương thị trường.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRejectionModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thông tin ứng viên */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-extrabold text-slate-900 text-xs">
                {selectedOfferForRejection.candidateName}
              </div>
              <div className="text-[11px] text-slate-500">
                {selectedOfferForRejection.position} &bull; Mức offer ban đầu:{' '}
                <strong className="text-blue-600">
                  {selectedOfferForRejection.baseSalary.toLocaleString('vi-VN')} đ
                </strong>
              </div>
            </div>

            <form onSubmit={handleSaveRejectionReason} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Trạng thái cập nhật *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRejectionForm({ ...rejectionForm, status: 'renegotiating' })}
                    className={clsx(
                      'p-2.5 rounded-xl border text-center font-bold text-xs cursor-pointer transition-all',
                      rejectionForm.status === 'renegotiating'
                        ? 'border-purple-600 bg-purple-50 text-purple-800'
                        : 'border-slate-200 text-slate-600'
                    )}
                  >
                    🔄 Thương lượng lại
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejectionForm({ ...rejectionForm, status: 'rejected' })}
                    className={clsx(
                      'p-2.5 rounded-xl border text-center font-bold text-xs cursor-pointer transition-all',
                      rejectionForm.status === 'rejected'
                        ? 'border-rose-600 bg-rose-50 text-rose-800'
                        : 'border-slate-200 text-slate-600'
                    )}
                  >
                    ❌ Từ chối hẳn
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nhóm lý do từ chối (Danh mục chuẩn hóa) *
                </label>
                <select
                  value={rejectionForm.category}
                  onChange={(e) =>
                    setRejectionForm({
                      ...rejectionForm,
                      category: e.target.value as RejectionReasonCategory,
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="salary_low">💰 Mức lương thấp hơn kỳ vọng của ứng viên</option>
                  <option value="too_far">🚗 Địa điểm làm việc xa / Không có Hybrid/Remote</option>
                  <option value="competitor_offer">🏢 Đã nhận offer đối thủ cạnh tranh có đãi ngộ tốt hơn</option>
                  <option value="benefits_low">🎁 Chế độ phúc lợi & bảo hiểm chưa tương xứng</option>
                  <option value="start_date_mismatch">📅 Không thỏa thuận được ngày nhận việc</option>
                  <option value="other">📌 Lý do cá nhân khác</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Chi tiết lý do / Mức lương ứng viên yêu cầu (Note) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionForm.note}
                  onChange={(e) => setRejectionForm({ ...rejectionForm, note: e.target.value })}
                  placeholder="Ví dụ: Ứng viên kỳ vọng 50M net do đang có offer từ công ty X đề xuất 52M kèm thưởng ký hợp đồng..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRejectionModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Lưu & Cập Nhật Dữ Liệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Form Xem Chi Tiết Offer Chuẩn Doanh Nghiệp */}
      <OfferDetailModal
        isOpen={isDetailModalOpen}
        offerId={selectedDetailOfferId}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedDetailOfferId(null);
        }}
        onActionSuccess={reload}
      />
    </div>
  );
}
