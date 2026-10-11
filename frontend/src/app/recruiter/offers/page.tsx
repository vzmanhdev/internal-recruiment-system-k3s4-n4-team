'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
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
// 2. MOCK DATA
// ==========================================

const INITIAL_OFFERS: OfferProposal[] = [
  {
    id: 'OFF-2026-01',
    candidateName: 'Lê Hoàng Cường',
    candidateEmail: 'cuong.lehoang@gmail.com',
    candidatePhone: '0908 765 432',
    candidateAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=120&auto=format&fit=crop',
    position: 'Senior Backend Engineer (Go/Python)',
    department: 'Khối Công Nghệ & Phần Mềm',
    baseSalary: 52000000,
    allowanceAndBonus: 'Sign-on bonus 20M + MacBook Pro M3 + Gói ESOP 1.000 CP',
    startDate: '2026-11-01',
    deadlineDate: '2026-10-15',
    status: 'pending',
    approvalChain: 'Đã hoàn tất duyệt 3 cấp (HM & HR Lead & Giám đốc Khối)',
    sentDate: '11/10/2026',
    negotiationRound: 1,
  },
  {
    id: 'OFF-2026-02',
    candidateName: 'Lê Hoàng Yến',
    candidateEmail: 'hoangyen.po@gmail.com',
    candidatePhone: '0978 123 456',
    candidateAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=120&auto=format&fit=crop',
    position: 'Product Owner / BA Lead',
    department: 'Khối Phát Triển Sản Phẩm',
    baseSalary: 36000000,
    allowanceAndBonus: 'Phụ cấp ăn trưa 1.5M + Bảo hiểm sức khỏe PVI Premium',
    startDate: '2026-10-25',
    deadlineDate: '2026-10-14',
    status: 'accepted',
    approvalChain: 'Đã hoàn tất duyệt 3 cấp & Ứng viên đã ký số',
    sentDate: '08/10/2026',
    negotiationRound: 1,
  },
  {
    id: 'OFF-2026-03',
    candidateName: 'Nguyễn Văn An',
    candidateEmail: 'an.nguyen@gmail.com',
    candidatePhone: '0912 345 678',
    candidateAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=120&auto=format&fit=crop',
    position: 'Senior Backend Engineer (Go/Python)',
    department: 'Khối Công Nghệ & Phần Mềm',
    baseSalary: 45000000,
    allowanceAndBonus: 'Phụ cấp dự án 3M + Thưởng tháng 13',
    startDate: '2026-11-01',
    deadlineDate: '2026-10-10',
    status: 'renegotiating',
    rejectionReasonCategory: 'salary_low',
    rejectionReasonNote: 'Ứng viên kỳ vọng mức lương net tối thiểu 48M - 50M do đang có offer đối tác đề xuất 50M.',
    approvalChain: 'Đang xin ý kiến Giám Đốc Khối điều chỉnh dải lương',
    sentDate: '05/10/2026',
    negotiationRound: 2,
  },
  {
    id: 'OFF-2026-04',
    candidateName: 'Trần Minh Quân',
    candidateEmail: 'quan.tran@techcorp.vn',
    candidatePhone: '0987 111 222',
    candidateAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&auto=format&fit=crop',
    position: 'Frontend React Lead',
    department: 'Khối Công Nghệ & Phần Mềm',
    baseSalary: 42000000,
    allowanceAndBonus: 'Phụ cấp công nghệ 2M + Laptop Dell XPS 15',
    startDate: '2026-11-05',
    deadlineDate: '2026-10-18',
    status: 'pending',
    approvalChain: 'HM & HR Lead đã duyệt, Chờ Giám đốc phê duyệt',
    sentDate: '10/10/2026',
    negotiationRound: 1,
  },
  {
    id: 'OFF-2026-05',
    candidateName: 'Đặng Mai Linh',
    candidateEmail: 'linh.dang@gmail.com',
    candidatePhone: '0911 223 344',
    candidateAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=120&auto=format&fit=crop',
    position: 'DevOps / Cloud Engineer',
    department: 'Khối Vận Hành & Hạ Tầng',
    baseSalary: 40000000,
    allowanceAndBonus: 'Gói chứng chỉ AWS Pro được công ty tài trợ 100%',
    startDate: '2026-10-01',
    deadlineDate: '2026-09-25',
    status: 'accepted',
    approvalChain: 'Đã hoàn tất nhận việc thành công (Onboarded)',
    sentDate: '20/09/2026',
    negotiationRound: 1,
  },
  {
    id: 'OFF-2026-06',
    candidateName: 'Nguyễn Quốc Cường',
    candidateEmail: 'cuong.nguyen@gmail.com',
    candidatePhone: '0932 444 555',
    candidateAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=120&auto=format&fit=crop',
    position: 'Product Owner / BA Lead',
    department: 'Khối Phát Triển Sản Phẩm',
    baseSalary: 32000000,
    allowanceAndBonus: 'Phụ cấp 1.5M',
    startDate: '2026-10-15',
    deadlineDate: '2026-10-05',
    status: 'rejected',
    rejectionReasonCategory: 'too_far',
    rejectionReasonNote: 'Ứng viên chuyển chỗ ở sang khu vực Long Biên, văn phòng Keangnam quá xa và không có chính sách làm remote.',
    approvalChain: 'Đã đóng quy trình offer',
    sentDate: '01/10/2026',
    negotiationRound: 1,
  },
  {
    id: 'OFF-2026-07',
    candidateName: 'Phạm Hồng Nhung',
    candidateEmail: 'nhung.pham@gmail.com',
    candidatePhone: '0943 222 111',
    candidateAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop',
    position: 'UI/UX Designer Senior',
    department: 'Khối Phát Triển Sản Phẩm',
    baseSalary: 28000000,
    allowanceAndBonus: 'Phụ cấp đồ họa 2M',
    startDate: '2026-10-20',
    deadlineDate: '2026-10-08',
    status: 'rejected',
    rejectionReasonCategory: 'competitor_offer',
    rejectionReasonNote: 'Nhận offer từ công ty FinTech với mức 35M + chế độ bảo hiểm gia đình.',
    approvalChain: 'Đã đóng quy trình offer',
    sentDate: '02/10/2026',
    negotiationRound: 1,
  },
];

// Danh sách ứng viên phục vụ tính năng Gửi Thư Hàng Loạt (Tab 2)
const MOCK_BULK_CANDIDATES: BulkCandidate[] = [
  {
    id: 'CAN-085',
    name: 'Nguyễn Văn An',
    email: 'an.nguyen@gmail.com',
    position: 'Senior Backend Engineer (Go/Python)',
    department: 'Khối Công Nghệ',
    resultStatus: 'pass',
    stageName: 'Pass Vòng 2 Kỹ Thuật (System Design)',
    matchScore: 96,
  },
  {
    id: 'CAN-077',
    name: 'Lê Hoàng Cường',
    email: 'cuong.lehoang@gmail.com',
    position: 'Senior Backend Engineer (Go/Python)',
    department: 'Khối Công Nghệ',
    resultStatus: 'pass',
    stageName: 'Đã duyệt Offer chính thức',
    matchScore: 98,
  },
  {
    id: 'CAN-092',
    name: 'Trần Minh Quân',
    email: 'quan.tran@techcorp.vn',
    position: 'Frontend React Lead',
    department: 'Khối Công Nghệ',
    resultStatus: 'pass',
    stageName: 'Pass Vòng 1 Chuyên môn',
    matchScore: 89,
  },
  {
    id: 'CAN-088',
    name: 'Hoàng Kim Ngân',
    email: 'ngan.hoangkim@gmail.com',
    position: 'Product Owner / BA Lead',
    department: 'Khối Sản Phẩm',
    resultStatus: 'pass',
    stageName: 'Pass Vòng 1 Case Study',
    matchScore: 92,
  },
  {
    id: 'CAN-101',
    name: 'Vũ Đức Thịnh',
    email: 'thinh.vuduc@gmail.com',
    position: 'Senior Backend Engineer (Go/Python)',
    department: 'Khối Công Nghệ',
    resultStatus: 'pending',
    stageName: 'Chờ kết quả hội đồng',
    matchScore: 88,
  },
  {
    id: 'CAN-061',
    name: 'Phạm Đức Dũng',
    email: 'dung.pham@gmail.com',
    position: 'DevOps / Cloud Engineer',
    department: 'Khối Hạ Tầng',
    resultStatus: 'fail',
    stageName: 'Không đạt Tech Test (Chưa đạt K8s)',
    matchScore: 68,
  },
  {
    id: 'CAN-109',
    name: 'Đỗ Thùy Trang',
    email: 'thuytrang.design@gmail.com',
    position: 'UI/UX Designer Senior',
    department: 'Khối Sản Phẩm',
    resultStatus: 'pass',
    stageName: 'Pass Vòng Portfolio',
    matchScore: 94,
  },
  {
    id: 'CAN-114',
    name: 'Hoàng Văn Bách',
    email: 'bach.hoang@gmail.com',
    position: 'Frontend React Lead',
    department: 'Khối Công Nghệ',
    resultStatus: 'fail',
    stageName: 'Không đạt Vòng Phỏng Vấn Kiến Trúc',
    matchScore: 65,
  },
];

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
  const [offers, setOffers] = useState<OfferProposal[]>(INITIAL_OFFERS);
  const [offerSearch, setOfferSearch] = useState('');
  const [offerStatusFilter, setOfferStatusFilter] = useState<'all' | OfferStatus>('all');
  const [toast, setToast] = useState<string | null>(null);

  // Modal 1: Soạn Offer mới
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [newOfferForm, setNewOfferForm] = useState({
    candidateName: '',
    candidateEmail: '',
    candidatePhone: '',
    position: 'Senior Backend Engineer (Go/Python)',
    department: 'Khối Công Nghệ & Phần Mềm',
    baseSalary: 48000000,
    allowanceAndBonus: 'Phụ cấp ăn trưa 1.5M + Laptop MacBook Pro M3',
    startDate: '2026-11-01',
    deadlineDate: '2026-10-18',
  });

  // Modal 2: Ghi nhận Lý do Từ chối / Thương lượng lại (Salary Adjustment Data)
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [selectedOfferForRejection, setSelectedOfferForRejection] = useState<OfferProposal | null>(null);
  const [rejectionForm, setRejectionForm] = useState({
    status: 'renegotiating' as 'rejected' | 'renegotiating',
    category: 'salary_low' as RejectionReasonCategory,
    note: '',
    counterSalaryExpected: 50000000,
  });

  // Tab 2: Quản lý Thư & Gửi thư hàng loạt (Bulk Emailing)
  const [bulkFilter, setBulkFilter] = useState<'all' | 'pass' | 'fail' | 'pending'>('all');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>(['CAN-085', 'CAN-077']);
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
  const handleCreateOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfferForm.candidateName.trim()) {
      alert('Vui lòng nhập tên ứng viên');
      return;
    }

    const newOffer: OfferProposal = {
      id: `OFF-2026-${(offers.length + 1).toString().padStart(2, '0')}`,
      candidateName: newOfferForm.candidateName,
      candidateEmail: newOfferForm.candidateEmail || 'candidate@gmail.com',
      candidatePhone: newOfferForm.candidatePhone || '0900 123 456',
      candidateAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120&auto=format&fit=crop',
      position: newOfferForm.position,
      department: newOfferForm.department,
      baseSalary: Number(newOfferForm.baseSalary),
      allowanceAndBonus: newOfferForm.allowanceAndBonus,
      startDate: newOfferForm.startDate,
      deadlineDate: newOfferForm.deadlineDate,
      status: 'pending',
      approvalChain: 'HM & HR Lead đã duyệt, Đang gửi ứng viên',
      sentDate: 'Hôm nay',
      negotiationRound: 1,
    };

    setOffers([newOffer, ...offers]);
    setIsDraftModalOpen(false);
    showToast(`Đã tạo và gửi dự thảo Offer tới "${newOffer.candidateName}" thành công!`);
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
  const handleSaveRejectionReason = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOfferForRejection) return;

    setOffers((prev) =>
      prev.map((o) => {
        if (o.id === selectedOfferForRejection.id) {
          return {
            ...o,
            status: rejectionForm.status,
            rejectionReasonCategory: rejectionForm.category,
            rejectionReasonNote: rejectionForm.note,
            negotiationRound: (o.negotiationRound || 1) + 1,
          };
        }
        return o;
      })
    );

    setIsRejectionModalOpen(false);
    showToast(
      `Đã ghi nhận lý do từ chối của "${selectedOfferForRejection.candidateName}" vào hệ thống phân tích dữ liệu lương!`
    );
  };

  // Chuyển nhanh trạng thái Offer
  const handleQuickStatusChange = (offerId: string, newStatus: OfferStatus) => {
    const target = offers.find((o) => o.id === offerId);
    if (!target) return;

    if (newStatus === 'rejected' || newStatus === 'renegotiating') {
      handleOpenRejectionPopup(target);
      return;
    }

    setOffers((prev) =>
      prev.map((o) => (o.id === offerId ? { ...o, status: newStatus } : o))
    );
    showToast(`Đã cập nhật trạng thái Offer "${target.candidateName}" thành "${newStatus === 'accepted' ? 'Đã đồng ý' : 'Đang chờ'}"`);
  };

  // ==========================================
  // HANDLERS FOR BULK EMAILING (TAB 2)
  // ==========================================

  const filteredBulkCandidates = useMemo(() => {
    return MOCK_BULK_CANDIDATES.filter((c) => {
      if (bulkFilter === 'all') return true;
      return c.resultStatus === bulkFilter;
    });
  }, [bulkFilter]);

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
  const handleSendBulkEmails = () => {
    if (selectedCandidateIds.length === 0) {
      alert('Vui lòng chọn ít nhất một ứng viên để gửi thư.');
      return;
    }

    setIsSendingBulk(true);
    setTimeout(() => {
      setIsSendingBulk(false);
      showToast(
        `Đã gửi thư hàng loạt thành công tới ${selectedCandidateIds.length} ứng viên qua máy chủ SMTP công ty!`
      );
    }, 1200);
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
    return offers.filter((o) => {
      const matchSearch =
        o.candidateName.toLowerCase().includes(offerSearch.toLowerCase()) ||
        o.position.toLowerCase().includes(offerSearch.toLowerCase()) ||
        o.id.toLowerCase().includes(offerSearch.toLowerCase());
      const matchStatus = offerStatusFilter === 'all' || o.status === offerStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [offers, offerSearch, offerStatusFilter]);

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
            {MOCK_BULK_CANDIDATES.length} ứng viên sẵn sàng
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
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base tracking-tight">
                    Căn Cứ Điều Chỉnh Mức Lương Tuyển Dụng (Salary Market Data)
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Dữ liệu tổng hợp từ các trường hợp ứng viên từ chối hoặc yêu cầu thương lượng lại.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-extrabold border border-blue-400/30">
                Data-Driven Recruitment
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="text-[11px] text-slate-300 font-bold flex items-center justify-between">
                  <span>Lương thấp hơn kỳ vọng</span>
                  <span className="text-rose-400 font-extrabold">Chiếm ~50%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-rose-500 h-2 rounded-full w-1/2"></div>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Ứng viên Senior Backend thường có offer cạnh tranh ở mức 48M - 52M net.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="text-[11px] text-slate-300 font-bold flex items-center justify-between">
                  <span>Địa điểm xa / Không Hybrid</span>
                  <span className="text-amber-400 font-extrabold">Chiếm ~25%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full w-1/4"></div>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Đề xuất áp dụng cơ chế 2 ngày WFH/tuần cho các vị trí Tech/Product.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="text-[11px] text-slate-300 font-bold flex items-center justify-between">
                  <span>Offer đối thủ cạnh tranh</span>
                  <span className="text-purple-400 font-extrabold">Chiếm ~25%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full w-1/4"></div>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Đối thủ có gói thưởng chào mừng (Sign-on Bonus) và bảo hiểm cho gia đình.
                </p>
              </div>
            </div>
          </div>

          {/* TOOLBAR: SEARCH & STATUS FILTER */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={offerSearch}
                onChange={(e) => setOfferSearch(e.target.value)}
                placeholder="Tìm theo ứng viên, vị trí, mã offer..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={offerStatusFilter}
                onChange={(e) => setOfferStatusFilter(e.target.value as any)}
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
                              <img
                                src={off.candidateAvatar}
                                alt={off.candidateName}
                                className="w-10 h-10 rounded-2xl object-cover border border-slate-200 shrink-0"
                              />
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
                              {off.status === 'pending' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickStatusChange(off.id, 'accepted')}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold transition-colors cursor-pointer"
                                  >
                                    Đã đồng ý
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenRejectionPopup(off)}
                                    className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold transition-colors cursor-pointer"
                                  >
                                    Từ chối
                                  </button>
                                </>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  alert(`Đang mở xem chi tiết Thư mời nhận việc PDF của mã ${off.id}...`);
                                }}
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
                    onClick={() => setSelectedTemplate(tpl.id as any)}
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
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Hoàng Đình Trọng"
                    value={newOfferForm.candidateName}
                    onChange={(e) =>
                      setNewOfferForm({ ...newOfferForm, candidateName: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email ứng viên *</label>
                  <input
                    type="email"
                    required
                    placeholder="trong.hoang@gmail.com"
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
                    onChange={(e) =>
                      setNewOfferForm({ ...newOfferForm, position: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="Senior Backend Engineer (Go/Python)">
                      Senior Backend Engineer (Go/Python)
                    </option>
                    <option value="Frontend React Lead">Frontend React Lead</option>
                    <option value="Product Owner / BA Lead">Product Owner / BA Lead</option>
                    <option value="DevOps / Cloud Engineer">DevOps / Cloud Engineer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mức lương cơ bản (VNĐ / tháng) *
                  </label>
                  <input
                    type="number"
                    required
                    step={1000000}
                    value={newOfferForm.baseSalary}
                    onChange={(e) =>
                      setNewOfferForm({ ...newOfferForm, baseSalary: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-blue-600"
                  />
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
                    value={newOfferForm.startDate}
                    onChange={(e) =>
                      setNewOfferForm({ ...newOfferForm, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Hạn chót phản hồi (Deadline) *
                  </label>
                  <input
                    type="date"
                    required
                    value={newOfferForm.deadlineDate}
                    onChange={(e) =>
                      setNewOfferForm({ ...newOfferForm, deadlineDate: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100 text-blue-900 text-[11px] leading-relaxed">
                ℹ️ Sau khi nhấn &ldquo;Lưu & Gửi Phê Duyệt&rdquo;, hệ thống sẽ tự động gửi thông báo duyệt cấp 1 tới Hiring Manager và cấp 2 tới Giám đốc Khối trước khi phát hành thư chính thức.
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
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 cursor-pointer"
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
    </div>
  );
}
