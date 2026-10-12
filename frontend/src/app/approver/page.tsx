'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  Eye,
  Clock,
  Building,
  User,
  Users,
  Calendar,
  Briefcase,
  AlertCircle,
  Check,
  X,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Flame,
  Award,
  Sparkles,
  Info,
  Layers,
  ArrowUpRight,
  Send,
} from 'lucide-react';
import clsx from 'clsx';
import { ApprovalTimeline } from '@/features/approver/components/ApprovalTimeline';
import type { RequisitionApprovalItem, OfferApprovalItem, ApprovalTimelineItem } from '@/features/approver/types';
import { apiRequest } from '@/lib/api-client';

// Initial Mock Data cho Requisitions Chờ Duyệt
const INITIAL_REQUISITIONS: RequisitionApprovalItem[] = [
  {
    id: 1,
    code: 'REQ-2026-001',
    title: 'Kỹ Sư Backend Senior (Python/FastAPI)',
    department: 'Công Nghệ Thông Tin',
    quantity: 2,
    reason: 'expansion',
    reason_detail: 'Mở rộng quy mô khối dịch vụ Core Banking & Microservices chịu tải cao Q1/2026',
    priority: 'high',
    employment_type: 'Full-time',
    work_location: 'Hà Nội (Trụ sở chính)',
    salary_range: '25.000.000 - 35.000.000 VNĐ',
    min_salary: 25000000,
    max_salary: 35000000,
    target_onboard_date: '15/11/2026',
    job_description:
      'Thiết kế, xây dựng và bảo trì các RESTful API và microservices hiệu năng cao sử dụng FastAPI, PostgreSQL và Redis. Tham gia thiết kế hệ thống phân tán, xử lý hàng triệu bản ghi mỗi ngày.',
    requirements:
      'Tối thiểu 4 năm kinh nghiệm với Python/FastAPI/Django. Nắm vững kiến trúc microservices, Docker, Kubernetes, CI/CD và cơ sở dữ liệu quan hệ (PostgreSQL). Kỹ năng tối ưu hóa truy vấn chuyên sâu.',
    benefits:
      'Lương thưởng cạnh tranh, tháng lương 13+, thưởng KPI quý. Gói bảo hiểm sức khỏe quốc tế PTI/Bảo Việt. Cung cấp MacBook Pro M3 Pro & màn hình 4K.',
    created_by: 'Lê Trưởng Nhóm',
    created_by_role: 'Trưởng Khối Công Nghệ',
    created_at: '08:30 - 10/10/2026',
    status: 'pending_board',
    current_approval_step: 'board',
    timeline: [
      {
        id: 101,
        step_name: 'Khởi tạo tờ trình',
        approver_name: 'Lê Trưởng Nhóm',
        approver_role: 'Trưởng Khối Công Nghệ',
        action: 'submitted',
        comment: 'Đã hoàn thiện bản mô tả công việc và định biên ngân sách phòng ban.',
        created_at: '08:30 - 10/10/2026',
      },
      {
        id: 102,
        step_name: 'Cấp 1: Thẩm định HR & Ngân Sách',
        approver_name: 'Trần Thị Thu Hà',
        approver_role: 'Giám Đốc Nhân Sự (HR Manager)',
        action: 'approved',
        comment: 'Đã đối soát quỹ lương phòng ban và định biên nhân sự 2026. Đạt tiêu chuẩn, chuyển Ban Giám Đốc phê duyệt cuối cùng.',
        created_at: '14:20 - 11/10/2026',
      },
    ],
  },
  {
    id: 2,
    code: 'REQ-2026-004',
    title: 'Trưởng Nhóm Digital Marketing Performance',
    department: 'Khối Marketing & Truyền Thông',
    quantity: 1,
    reason: 'replacement',
    reason_detail: 'Thay thế nhân sự cấp quản lý chuyển công tác sang thị trường quốc tế',
    priority: 'urgent',
    employment_type: 'Full-time',
    work_location: 'Hồ Chí Minh',
    salary_range: '32.000.000 - 45.000.000 VNĐ',
    min_salary: 32000000,
    max_salary: 45000000,
    target_onboard_date: '01/11/2026',
    job_description:
      'Chịu trách nhiệm toàn diện về các chiến dịch Paid Ads (Facebook, Google, TikTok, Programmatic). Tối ưu hóa chỉ số CAC, LTV và ROAS cho các dòng sản phẩm EdTech chủ lực.',
    requirements:
      'Tối thiểu 3 năm kinh nghiệm Lead Performance Team quản lý ngân sách từ 1 tỷ/tháng trở lên. Khả năng phân tích dữ liệu tốt với Google Analytics 4, AppsFlyer, BigQuery.',
    benefits:
      'Lương cứng hấp dẫn kèm thưởng hoa hồng chiến dịch không giới hạn. Xem xét tăng lương 6 tháng/lần. Được tài trợ ngân sách tham gia các khóa học chuyên môn quốc tế.',
    created_by: 'Nguyễn Minh Tuấn',
    created_by_role: 'Trưởng Phòng Marketing',
    created_at: '09:15 - 11/10/2026',
    status: 'pending_board',
    current_approval_step: 'board',
    timeline: [
      {
        id: 103,
        step_name: 'Khởi tạo tờ trình',
        approver_name: 'Nguyễn Minh Tuấn',
        approver_role: 'Trưởng Phòng Marketing',
        action: 'submitted',
        comment: 'Đề xuất tuyển gấp để kịp triển khai chiến dịch kích cầu người học quý 4.',
        created_at: '09:15 - 11/10/2026',
      },
      {
        id: 104,
        step_name: 'Cấp 1: Thẩm định HR & Ngân Sách',
        approver_name: 'Trần Thị Thu Hà',
        approver_role: 'Giám Đốc Nhân Sự',
        action: 'approved',
        comment: 'Đã kiểm tra dải ngân sách, hoàn toàn phù hợp với vị trí Lead. Kính trình Ban Giám Đốc phê duyệt.',
        created_at: '16:00 - 11/10/2026',
      },
    ],
  },
  {
    id: 3,
    code: 'REQ-2026-007',
    title: 'Product Owner (Nền Tảng Đào Tạo LMS)',
    department: 'Khối Sản Phẩm & Nghiên Cứu',
    quantity: 1,
    reason: 'expansion',
    reason_detail: 'Phát triển module thi trực tuyến và hệ thống AI chấm bài tự động',
    priority: 'medium',
    employment_type: 'Full-time',
    work_location: 'Hà Nội',
    salary_range: '30.000.000 - 40.000.000 VNĐ',
    min_salary: 30000000,
    max_salary: 40000000,
    target_onboard_date: '30/11/2026',
    job_description:
      'Định hình lộ trình phát triển sản phẩm (Product Roadmap), quản lý Product Backlog, làm việc trực tiếp với đội ngũ kỹ thuật và người dùng để tối ưu hóa trải nghiệm học tập số.',
    requirements:
      'Tối thiểu 3 năm kinh nghiệm làm PO hoặc Senior BA cho các sản phẩm SaaS/EdTech. Thành thạo Agile/Scrum, Jira, Confluence, Figma.',
    benefits:
      'Môi trường làm việc năng động, trẻ trung. Trợ cấp ăn trưa, gửi xe, thiết bị làm việc công nghệ cao.',
    created_by: 'Hoàng Anh Dũng',
    created_by_role: 'Giám Đốc Sản Phẩm',
    created_at: '11:00 - 12/10/2026',
    status: 'pending_board',
    current_approval_step: 'board',
    timeline: [
      {
        id: 105,
        step_name: 'Khởi tạo tờ trình',
        approver_name: 'Hoàng Anh Dũng',
        approver_role: 'Giám Đốc Sản Phẩm',
        action: 'submitted',
        comment: 'Tờ trình bổ sung PO phụ trách dự án AI LMS trọng điểm.',
        created_at: '11:00 - 12/10/2026',
      },
    ],
  },
];

// Initial Mock Data cho Offers Chờ Duyệt
const INITIAL_OFFERS: OfferApprovalItem[] = [
  {
    id: 88,
    code: 'OFFER-2026-088',
    candidate_name: 'Đỗ Hoàng Long',
    candidate_email: 'long.do@example.com',
    candidate_phone: '0987 654 321',
    job_title: 'Chuyên Viên Phân Tích Dữ Liệu Senior (Data Analytics Lead)',
    department: 'Khối Phân Tích Dữ Liệu & BI',
    offered_salary: 45000000,
    standard_salary_min: 30000000,
    standard_salary_max: 40000000,
    is_over_budget: true,
    over_percentage: 12.5, // 45tr so với trần 40tr = vượt 12.5%
    probation_salary_percentage: 85,
    probation_duration_months: 2,
    start_date: '01/11/2026',
    work_location: 'Hà Nội',
    notes:
      'Ứng viên có 6 năm kinh nghiệm, từng lead hệ thống Data Warehouse lớn tại ngân hàng số. Kỹ năng vượt trội về dbt, BigQuery và Apache Superset. Mức lương hiện tại của ứng viên đã là 42tr nên đề xuất 45tr để thu hút nhân tài.',
    created_by: 'Trần Thị Thu Hà (HR Manager)',
    created_by_role: 'Giám Đốc Nhân Sự',
    created_at: '10:00 - 11/10/2026',
    status: 'pending',
    timeline: [
      {
        id: 201,
        step_name: 'Đề xuất Offer từ Tuyển Dụng',
        approver_name: 'Vũ Minh Anh',
        approver_role: 'Chuyên Viên Tuyển Dụng (Recruiter)',
        action: 'submitted',
        comment: 'Đã phỏng vấn 3 vòng, chuyên môn xếp loại Xuất sắc (9.2/10).',
        created_at: '10:00 - 11/10/2026',
      },
      {
        id: 202,
        step_name: 'Thẩm định dải lương HR Manager',
        approver_name: 'Trần Thị Thu Hà',
        approver_role: 'Giám Đốc Nhân Sự',
        action: 'approved',
        comment: 'Xác nhận vượt trần dải chuẩn 12.5% (+5.000.000 VNĐ). Đề xuất chuyển Ban Giám Đốc phê duyệt hạn mức đặc biệt.',
        created_at: '15:30 - 11/10/2026',
      },
    ],
  },
  {
    id: 92,
    code: 'OFFER-2026-092',
    candidate_name: 'Nguyễn Thị Mai Anh',
    candidate_email: 'maianh.nguyen@example.com',
    candidate_phone: '0912 345 678',
    job_title: 'Chuyên Viên Thiết Kế UI/UX Senior',
    department: 'Khối Thiết Kế Trải Nghiệm Người Dùng',
    offered_salary: 32000000,
    standard_salary_min: 28000000,
    standard_salary_max: 36000000,
    is_over_budget: false,
    over_percentage: 0,
    probation_salary_percentage: 85,
    probation_duration_months: 2,
    start_date: '15/11/2026',
    work_location: 'Hà Nội',
    notes:
      'Ứng viên hoàn thành bài test xuất sắc, đạt portfolio thẩm mỹ quốc tế. Mức lương nằm hoàn toàn trong khung ngân sách vị trí.',
    created_by: 'Lê Văn Khang',
    created_by_role: 'Talent Acquisition Specialist',
    created_at: '14:00 - 11/10/2026',
    status: 'pending',
    timeline: [
      {
        id: 203,
        step_name: 'Đề xuất Offer từ Tuyển Dụng',
        approver_name: 'Lê Văn Khang',
        approver_role: 'Chuyên Viên Tuyển Dụng',
        action: 'submitted',
        comment: 'Ứng viên đồng thuận mức lương 32.000.000 VNĐ, cam kết onboard đúng hạn.',
        created_at: '14:00 - 11/10/2026',
      },
    ],
  },
  {
    id: 95,
    code: 'OFFER-2026-095',
    candidate_name: 'Trần Quốc Tuấn',
    candidate_email: 'tuan.tran@example.com',
    candidate_phone: '0909 888 777',
    job_title: 'Chuyên Gia Kỹ Sư AI/LLM Specialist',
    department: 'Phòng Nghiên Cứu Trí Tuệ Nhân Tạo (AI Lab)',
    offered_salary: 65000000,
    standard_salary_min: 45000000,
    standard_salary_max: 55000000,
    is_over_budget: true,
    over_percentage: 18.2, // 65tr so với trần 55tr = vượt 18.2%
    probation_salary_percentage: 90,
    probation_duration_months: 2,
    start_date: '01/12/2026',
    work_location: 'Hà Nội',
    notes:
      'Ứng viên có bằng Thạc sĩ Khoa học Máy tính từ ĐH Bách Khoa, có 2 bài báo quốc tế về NLP và 3 năm kinh nghiệm fine-tuning mô hình ngôn ngữ lớn (LLM). Mức đề xuất 65tr tuy vượt trần 10tr nhưng rất xứng đáng với dự án chiến lược của công ty.',
    created_by: 'Trần Thị Thu Hà (HR Manager)',
    created_by_role: 'Giám Đốc Nhân Sự',
    created_at: '09:00 - 12/10/2026',
    status: 'pending',
    timeline: [
      {
        id: 204,
        step_name: 'Đề xuất Offer từ Tuyển Dụng',
        approver_name: 'Vũ Minh Anh',
        approver_role: 'Lead Recruiter',
        action: 'submitted',
        comment: 'Đã thẩm định hồ sơ cùng Ban Cố Vấn Kỹ Thuật.',
        created_at: '09:00 - 12/10/2026',
      },
      {
        id: 205,
        step_name: 'Thẩm định HR Manager',
        approver_name: 'Trần Thị Thu Hà',
        approver_role: 'Giám Đốc Nhân Sự',
        action: 'approved',
        comment: 'Cảnh báo vượt trần 18.2%. Kính chuyển Ban Giám Đốc xem xét phê duyệt ngoại lệ.',
        created_at: '11:15 - 12/10/2026',
      },
    ],
  },
];

export default function ApproverWorkspacePage() {
  // 1. Tab State: 'requisitions' | 'offers'
  const [activeTab, setActiveTab] = useState<'requisitions' | 'offers'>('requisitions');

  // 2. Data State
  const [requisitions, setRequisitions] = useState<RequisitionApprovalItem[]>(INITIAL_REQUISITIONS);
  const [offers, setOffers] = useState<OfferApprovalItem[]>(INITIAL_OFFERS);

  // 3. Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');

  // 4. Modal / Slide-over State
  const [selectedReq, setSelectedReq] = useState<RequisitionApprovalItem | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<OfferApprovalItem | null>(null);

  // 5. Action Bar & Mandatory Reason State
  // Chosen action inside modal: null | 'approved' | 'rejected' | 'changes_requested' | 'renegotiate'
  const [modalAction, setModalAction] = useState<string | null>(null);
  const [actionComment, setActionComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 6. Toast Feedback Notification
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Fetch data từ Backend khi mount (với fallback)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const backendReqs = await apiRequest<any[]>('/requisitions');
        if (backendReqs && Array.isArray(backendReqs) && backendReqs.length > 0) {
          // Merge hoặc cập nhật nếu có
        }
      } catch (err) {
        // Giữ mock data hoàn chỉnh
      }
    };
    fetchData();
  }, []);

  // Filtered lists
  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((item) => {
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = selectedDept === 'ALL' || item.department.includes(selectedDept);
      const matchPriority = selectedPriority === 'ALL' || item.priority === selectedPriority;
      return matchSearch && matchDept && matchPriority;
    });
  }, [requisitions, searchQuery, selectedDept, selectedPriority]);

  const filteredOffers = useMemo(() => {
    return offers.filter((item) => {
      const matchSearch =
        item.candidate_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = selectedDept === 'ALL' || item.department.includes(selectedDept);
      const matchOverBudget =
        selectedPriority === 'ALL' ||
        (selectedPriority === 'OVER_BUDGET' && item.is_over_budget) ||
        (selectedPriority === 'NORMAL' && !item.is_over_budget);
      return matchSearch && matchDept && matchOverBudget;
    });
  }, [offers, searchQuery, selectedDept, selectedPriority]);

  // KPIs
  const pendingReqCount = requisitions.filter((r) => r.status.startsWith('pending')).length;
  const pendingOfferCount = offers.filter((o) => o.status === 'pending').length;
  const overBudgetOfferCount = offers.filter((o) => o.is_over_budget && o.status === 'pending').length;
  const totalPending = pendingReqCount + pendingOfferCount;

  // Xử lý mở Modal Requisition
  const handleOpenReqModal = (req: RequisitionApprovalItem) => {
    setSelectedReq(req);
    setSelectedOffer(null);
    setModalAction(null);
    setActionComment('');
  };

  // Xử lý mở Modal Offer
  const handleOpenOfferModal = (offer: OfferApprovalItem) => {
    setSelectedOffer(offer);
    setSelectedReq(null);
    setModalAction(null);
    setActionComment('');
  };

  // Đóng Modal
  const handleCloseModal = () => {
    setSelectedReq(null);
    setSelectedOffer(null);
    setModalAction(null);
    setActionComment('');
  };

  // Xử lý Phê duyệt / Từ chối / Yêu cầu bổ sung cho REQUISITION
  const handleSubmitReqAction = async (action: 'approved' | 'rejected' | 'changes_requested') => {
    if (!selectedReq) return;

    // Logic Bắt buộc: Nếu là rejected hoặc changes_requested thì bắt buộc phải có ý kiến
    if ((action === 'rejected' || action === 'changes_requested') && !actionComment.trim()) {
      showToast('Vui lòng nhập lý do thẩm định cụ thể trước khi xác nhận!', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // Gọi Backend nếu có thể
      try {
        await apiRequest(`/requisitions/${selectedReq.id}/approve`, {
          method: 'POST',
          body: JSON.stringify({
            action: action === 'approved' ? 'approved' : 'rejected',
            comment: actionComment.trim() || 'Đã thẩm định và thông qua bởi Ban Giám Đốc',
          }),
        });
      } catch (e) {
        // Mock fallback
      }

      const timestamp = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString('vi-VN');

      let actionText = '';
      let newStatus: RequisitionApprovalItem['status'] = 'approved';

      if (action === 'approved') {
        actionText = 'ĐÃ DUYỆT HOÀN TẤT: Tờ trình đã được phê duyệt chính thức và chuyển sang trạng thái tuyển dụng!';
        newStatus = 'approved';
      } else if (action === 'rejected') {
        actionText = `ĐÃ TỪ CHỐI TỜ TRÌNH: ${actionComment.trim()}`;
        newStatus = 'rejected';
      } else {
        actionText = `YÊU CẦU BỔ SUNG: Trả hồ sơ về Trưởng Bộ Phận để làm rõ: "${actionComment.trim()}"`;
        newStatus = 'changes_requested';
      }

      const newTimelineLog: ApprovalTimelineItem = {
        id: Date.now(),
        step_name: 'Phê duyệt Ban Giám Đốc',
        approver_name: 'Phạm Văn Hùng',
        approver_role: 'Phó Tổng Giám Đốc / Ban Giám Đốc',
        action: action,
        comment: actionComment.trim() || (action === 'approved' ? 'Phê duyệt hoàn tất theo định biên công ty.' : ''),
        created_at: timestamp,
      };

      // Cập nhật state danh sách
      setRequisitions((prev) =>
        prev.map((r) =>
          r.id === selectedReq.id
            ? {
                ...r,
                status: newStatus,
                current_approval_step: 'completed',
                timeline: [...r.timeline, newTimelineLog],
              }
            : r
        )
      );

      showToast(actionText, action === 'approved' ? 'success' : action === 'rejected' ? 'error' : 'warning');
      handleCloseModal();
    } catch (err) {
      showToast('Có lỗi xảy ra trong quá trình xử lý phê duyệt.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý Phê duyệt / Từ chối / Yêu cầu sửa cho OFFER
  const handleSubmitOfferAction = async (action: 'approved' | 'rejected' | 'renegotiate') => {
    if (!selectedOffer) return;

    // Logic Bắt buộc: Nếu là rejected hoặc renegotiate thì bắt buộc phải có ý kiến
    if ((action === 'rejected' || action === 'renegotiate') && !actionComment.trim()) {
      showToast('Vui lòng nhập lý do cụ thể trước khi xác nhận!', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      try {
        await apiRequest(`/offers/${selectedOffer.id}/status`, {
          method: 'PUT',
          body: JSON.stringify({
            status: action === 'approved' ? 'sent' : 'declined',
            decline_reason: actionComment.trim(),
          }),
        });
      } catch (e) {
        // Mock fallback
      }

      const timestamp = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString('vi-VN');

      let actionText = '';
      let newStatus: OfferApprovalItem['status'] = 'sent';

      if (action === 'approved') {
        actionText = `ĐÃ DUYỆT OFFER: Đề xuất lương ${selectedOffer.offered_salary.toLocaleString('vi-VN')} VNĐ cho ứng viên ${selectedOffer.candidate_name} đã được Ban Giám Đốc thông qua!`;
        newStatus = 'sent';
      } else if (action === 'rejected') {
        actionText = `ĐÃ BÁC BỎ OFFER: Hồ sơ đề xuất của ứng viên ${selectedOffer.candidate_name} đã bị từ chối.`;
        newStatus = 'rejected';
      } else {
        actionText = `YÊU CẦU ĐÀM PHÁN LẠI: Đã gửi thông báo yêu cầu HR Manager đàm phán lại mức lương với ứng viên!`;
        newStatus = 'changes_requested';
      }

      const newTimelineLog: ApprovalTimelineItem = {
        id: Date.now(),
        step_name: 'Thẩm định Hạn Mức Ban Giám Đốc',
        approver_name: 'Phạm Văn Hùng',
        approver_role: 'Phó Tổng Giám Đốc / Ban Giám Đốc',
        action: action,
        comment: actionComment.trim() || (action === 'approved' ? 'Đã phê duyệt mức lương theo thẩm quyền Ban Giám Đốc.' : ''),
        created_at: timestamp,
      };

      setOffers((prev) =>
        prev.map((o) =>
          o.id === selectedOffer.id
            ? {
                ...o,
                status: newStatus,
                timeline: [...o.timeline, newTimelineLog],
              }
            : o
        )
      );

      showToast(actionText, action === 'approved' ? 'success' : action === 'rejected' ? 'error' : 'warning');
      handleCloseModal();
    } catch (err) {
      showToast('Có lỗi xảy ra trong quá trình xử lý phê duyệt.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 max-w-md animate-in slide-in-from-top-3 fade-in duration-300">
          <div
            className={clsx(
              'rounded-2xl p-4 shadow-xl border flex items-start gap-3 backdrop-blur-md',
              toast.type === 'success' && 'bg-emerald-50/95 border-emerald-200 text-emerald-900',
              toast.type === 'error' && 'bg-rose-50/95 border-rose-200 text-rose-900',
              toast.type === 'warning' && 'bg-amber-50/95 border-amber-200 text-amber-900',
              toast.type === 'info' && 'bg-blue-50/95 border-blue-200 text-blue-900'
            )}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />}
            <div className="flex-1 text-xs font-semibold leading-relaxed">{toast.message}</div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 1. Header Banner & Quick Summary */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-100/40 via-amber-100/20 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200/80">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Cổng Thẩm Định Tối Cao</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>{totalPending} Hồ Sơ Chờ Bạn Quyết Định</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Trung Tâm Phê Duyệt Tuyển Dụng
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Thẩm định các Tờ trình Tuyển dụng (REQ) mở mới định biên và Đề xuất Offer ứng viên vượt hạn mức dải lương chuẩn của công ty.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-right">
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Hội Đồng Phê Duyệt</span>
              <span className="text-sm font-extrabold text-slate-900 block">Ban Giám Đốc (BOD)</span>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center justify-end gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Quyền Duyệt Cấp Cuối
              </span>
            </div>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
          {/* Card 1: Tổng hồ sơ chờ duyệt */}
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">Tổng Chờ Duyệt</span>
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{totalPending}</div>
            <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1 mt-1">
              <Flame className="w-3 h-3 text-amber-500" />
              Cần xử lý trong tuần
            </span>
          </div>

          {/* Card 2: REQ chờ duyệt */}
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">REQ Chờ Duyệt</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{pendingReqCount}</div>
            <span className="text-[11px] text-slate-500 font-medium">Tờ trình định biên</span>
          </div>

          {/* Card 3: Offer chờ duyệt */}
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">Offer Chờ Duyệt</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{pendingOfferCount}</div>
            <span className="text-[11px] text-slate-500 font-medium">Đề xuất lương ứng viên</span>
          </div>

          {/* Card 4: Offer vượt khung lương */}
          <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-700">Vượt Khung Lương</span>
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold animate-pulse">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-700">{overBudgetOfferCount}</div>
            <span className="text-[11px] text-rose-600 font-bold">Cần Ban Giám Đốc lưu ý</span>
          </div>
        </div>
      </div>

      {/* 2. Main Workspace: Tabs, Filters, Content */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Tab Navigation Header */}
        <div className="border-b border-slate-100 px-6 pt-5 pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* Tab 1: Yêu Cầu Tuyển Dụng */}
            <button
              onClick={() => setActiveTab('requisitions')}
              className={clsx(
                'relative flex items-center gap-2.5 px-5 py-3.5 text-xs sm:text-sm font-bold transition-all cursor-pointer rounded-t-xl active:scale-95',
                activeTab === 'requisitions'
                  ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              )}
            >
              <FileText className="w-4 h-4" />
              <span>Yêu Cầu Tuyển Dụng (REQ)</span>
              <span
                className={clsx(
                  'px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-colors',
                  activeTab === 'requisitions' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                )}
              >
                {pendingReqCount}
              </span>
            </button>

            {/* Tab 2: Đề Xuất Offer */}
            <button
              onClick={() => setActiveTab('offers')}
              className={clsx(
                'relative flex items-center gap-2.5 px-5 py-3.5 text-xs sm:text-sm font-bold transition-all cursor-pointer rounded-t-xl active:scale-95',
                activeTab === 'offers'
                  ? 'text-blue-600 bg-blue-50/50 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              )}
            >
              <DollarSign className="w-4 h-4" />
              <span>Đề Xuất Offer Lương</span>
              <span
                className={clsx(
                  'px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-colors flex items-center gap-1',
                  activeTab === 'offers' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                )}
              >
                <span>{pendingOfferCount}</span>
                {overBudgetOfferCount > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                )}
              </span>
            </button>
          </div>

          <div className="pb-3 flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:inline">
              Hiển thị các hồ sơ ở trạng thái <span className="font-bold text-amber-600">Chờ Duyệt</span>
            </span>
            <Link
              href={activeTab === 'requisitions' ? '/approver/requisitions' : '/approver/offers'}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200/60"
            >
              <span>Xem trang chuyên biệt</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/40 flex flex-col md:flex-row items-center gap-4">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'requisitions'
                  ? 'Tìm kiếm theo mã REQ, vị trí tuyển dụng, phòng ban...'
                  : 'Tìm kiếm theo mã Offer, tên ứng viên, vị trí, phòng ban...'
              }
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Phòng ban */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="ALL">Tất Cả Phòng Ban</option>
              <option value="Công Nghệ">Công Nghệ Thông Tin</option>
              <option value="Marketing">Marketing & Truyền Thông</option>
              <option value="Sản Phẩm">Khối Sản Phẩm</option>
              <option value="Dữ Liệu">Phân Tích Dữ Liệu</option>
            </select>

            {/* Filter Priority / Budget */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              {activeTab === 'requisitions' ? (
                <>
                  <option value="ALL">Mọi Mức Ưu Tiên</option>
                  <option value="urgent">Khẩn Cấp (Urgent)</option>
                  <option value="high">Cao (High)</option>
                  <option value="medium">Trung Bình (Medium)</option>
                </>
              ) : (
                <>
                  <option value="ALL">Mọi Khung Lương</option>
                  <option value="OVER_BUDGET">⚠️ Vượt Dải Lương Chuẩn</option>
                  <option value="NORMAL">✅ Trong Dải Lương Chuẩn</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* 3. TAB 1: REQUISITIONS LIST */}
        {activeTab === 'requisitions' && (
          <div className="p-6">
            {filteredRequisitions.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-[1.5]" />
                <p className="text-sm font-bold text-slate-700">Không có yêu cầu tuyển dụng nào phù hợp</p>
                <p className="text-xs text-slate-400 mt-1">
                  Tất cả các tờ trình tuyển dụng đã được xử lý hoặc không khớp bộ lọc tìm kiếm.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      <th className="pb-3.5 pl-2">Mã & Vị Trí Tuyển Dụng</th>
                      <th className="pb-3.5 px-4">Phòng Ban</th>
                      <th className="pb-3.5 px-4">Định Biên</th>
                      <th className="pb-3.5 px-4">Dải Ngân Sách</th>
                      <th className="pb-3.5 px-4">Ưu Tiên</th>
                      <th className="pb-3.5 px-4">Cấp Hiện Tại</th>
                      <th className="pb-3.5 pr-2 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {filteredRequisitions.map((req) => {
                      const isPending = req.status.startsWith('pending');
                      return (
                        <tr
                          key={req.id}
                          className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                          onClick={() => handleOpenReqModal(req)}
                        >
                          {/* Mã & Vị trí */}
                          <td className="py-4 pl-2">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block group-hover:text-blue-600 transition-colors">
                                  {req.title}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[11px] font-mono text-slate-400 font-semibold">{req.code}</span>
                                  <span className="text-[10px] text-slate-400">• Gửi bởi {req.created_by}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Phòng ban */}
                          <td className="py-4 px-4 font-medium text-slate-700">
                            {req.department}
                          </td>

                          {/* Định biên */}
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center gap-1 font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                              <Users className="w-3 h-3 text-slate-500" />
                              {req.quantity} nhân sự
                            </span>
                          </td>

                          {/* Dải ngân sách */}
                          <td className="py-4 px-4 font-semibold text-slate-700">
                            {req.salary_range}
                          </td>

                          {/* Mức độ ưu tiên */}
                          <td className="py-4 px-4">
                            {req.priority === 'urgent' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                                <Flame className="w-3 h-3" />
                                Khẩn cấp
                              </span>
                            )}
                            {req.priority === 'high' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                                Ưu tiên cao
                              </span>
                            )}
                            {req.priority === 'medium' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600">
                                Tiêu chuẩn
                              </span>
                            )}
                          </td>

                          {/* Cấp hiện tại */}
                          <td className="py-4 px-4">
                            {isPending ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                Chờ Bạn Duyệt
                              </span>
                            ) : req.status === 'approved' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                Đã Duyệt
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <XCircle className="w-3 h-3" />
                                Đã Từ Chối
                              </span>
                            )}
                          </td>

                          {/* Nút thao tác */}
                          <td className="py-4 pr-2 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenReqModal(req);
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-xs"
                            >
                              Xem & Thẩm Định
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 4. TAB 2: OFFERS LIST */}
        {activeTab === 'offers' && (
          <div className="p-6">
            {filteredOffers.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <DollarSign className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-[1.5]" />
                <p className="text-sm font-bold text-slate-700">Không có đề xuất offer nào phù hợp</p>
                <p className="text-xs text-slate-400 mt-1">
                  Tất cả các thư mời nhận việc đã được phê duyệt hoặc không khớp bộ lọc tìm kiếm.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      <th className="pb-3.5 pl-2">Mã & Ứng Viên Nhận Offer</th>
                      <th className="pb-3.5 px-4">Vị Trí & Phòng Ban</th>
                      <th className="pb-3.5 px-4">Lương Đề Xuất</th>
                      <th className="pb-3.5 px-4">Dải Lương Chuẩn</th>
                      <th className="pb-3.5 px-4">Cảnh Báo Hạn Mức</th>
                      <th className="pb-3.5 px-4">Trạng Thái</th>
                      <th className="pb-3.5 pr-2 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {filteredOffers.map((offer) => {
                      return (
                        <tr
                          key={offer.id}
                          className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                          onClick={() => handleOpenOfferModal(offer)}
                        >
                          {/* Mã & Ứng viên */}
                          <td className="py-4 pl-2">
                            <div className="flex items-start gap-3">
                              <div
                                className={clsx(
                                  'w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors',
                                  offer.is_over_budget
                                    ? 'bg-rose-100 text-rose-700 group-hover:bg-rose-600 group-hover:text-white'
                                    : 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white'
                                )}
                              >
                                <User className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block group-hover:text-blue-600 transition-colors">
                                  {offer.candidate_name}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[11px] font-mono text-slate-400 font-semibold">{offer.code}</span>
                                  <span className="text-[10px] text-slate-400">• {offer.candidate_email}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Vị trí & Phòng ban */}
                          <td className="py-4 px-4">
                            <span className="font-semibold text-slate-800 block">{offer.job_title}</span>
                            <span className="text-[11px] text-slate-400">{offer.department}</span>
                          </td>

                          {/* Lương đề xuất */}
                          <td className="py-4 px-4 font-black text-slate-900 text-sm">
                            {offer.offered_salary.toLocaleString('vi-VN')} VNĐ
                          </td>

                          {/* Dải chuẩn vị trí */}
                          <td className="py-4 px-4 text-slate-500 font-medium">
                            {offer.standard_salary_min.toLocaleString('vi-VN')} -{' '}
                            {offer.standard_salary_max.toLocaleString('vi-VN')} VNĐ
                          </td>

                          {/* Cảnh báo động (Dải chuẩn / Vượt dải) */}
                          <td className="py-4 px-4">
                            {offer.is_over_budget ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-300 animate-pulse shadow-xs">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Vượt dải chuẩn (+{offer.over_percentage}%)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Trong dải chuẩn</span>
                              </span>
                            )}
                          </td>

                          {/* Trạng thái */}
                          <td className="py-4 px-4">
                            {offer.status === 'pending' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                Chờ Bạn Duyệt
                              </span>
                            ) : offer.status === 'sent' || offer.status === 'accepted' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                Đã Thông Qua
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <XCircle className="w-3 h-3" />
                                Đã Từ Chối
                              </span>
                            )}
                          </td>

                          {/* Nút thao tác */}
                          <td className="py-4 pr-2 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenOfferModal(offer);
                              }}
                              className={clsx(
                                'px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-xs',
                                offer.is_over_budget
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white border border-rose-200'
                                  : 'bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white'
                              )}
                            >
                              Xem & Thẩm Định
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL 2 CỘT CHO REQUISITION (SLIDE-OVER / DIALOG)                       */}
      {/* ========================================================================= */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl w-full max-w-5xl max-h-[92vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-slate-900">
                      Thẩm Định Tờ Trình Tuyển Dụng
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
                      {selectedReq.code}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Người tạo: {selectedReq.created_by} ({selectedReq.created_by_role}) • Gửi lúc {selectedReq.created_at}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseModal}
                className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: 2 Columns */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
              {/* CỘT TRÁI: CHI TIẾT YÊU CẦU TUYỂN DỤNG (7 Cột) */}
              <div className="lg:col-span-7 p-6 space-y-6">
                {/* Title & Badge */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                      {selectedReq.department}
                    </span>
                    {selectedReq.priority === 'urgent' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                        Khẩn cấp
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {selectedReq.employment_type}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 leading-snug">
                    {selectedReq.title}
                  </h3>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">Số lượng cần tuyển</span>
                    <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                      {selectedReq.quantity} nhân sự
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">Dải ngân sách dự kiến</span>
                    <span className="text-sm font-extrabold text-emerald-700 mt-0.5 block">
                      {selectedReq.salary_range}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">Onboard mục tiêu</span>
                    <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                      {selectedReq.target_onboard_date || 'Càng sớm càng tốt'}
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">Lý do đề xuất:</span>
                    <span className="font-bold text-slate-800 text-[11px]">
                      {selectedReq.reason === 'expansion' ? 'Mở rộng quy mô khối' : 'Bổ sung nhân sự thay thế'} ({selectedReq.reason_detail})
                    </span>
                  </div>
                </div>

                {/* Mô tả công việc (JD) */}
                {selectedReq.job_description && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                      Mô Tả Công Việc (Job Description)
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200/80">
                      {selectedReq.job_description}
                    </p>
                  </div>
                )}

                {/* Yêu cầu chuyên môn */}
                {selectedReq.requirements && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Yêu Cầu Năng Lực & Kinh Nghiệm
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200/80">
                      {selectedReq.requirements}
                    </p>
                  </div>
                )}

                {/* Quyền lợi */}
                {selectedReq.benefits && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      Chế Độ Đãi Ngộ & Phúc Lợi
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200/80">
                      {selectedReq.benefits}
                    </p>
                  </div>
                )}
              </div>

              {/* CỘT PHẢI: LỊCH SỬ DUYỆT (TIMELINE) & KHUNG Ý KIẾN HÀNH ĐỘNG (5 Cột) */}
              <div className="lg:col-span-5 p-6 flex flex-col justify-between space-y-6 bg-slate-50/30">
                <div className="space-y-5">
                  {/* Lịch sử duyệt bất biến */}
                  <ApprovalTimeline items={selectedReq.timeline} />

                  {/* Khu vực chọn hình thức & nhập lý do */}
                  <div className="pt-4 border-t border-slate-200/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Ý Kiến Thẩm Định Của Bạn</span>
                        {(modalAction === 'rejected' || modalAction === 'changes_requested') && (
                          <span className="text-rose-600 text-[11px] font-extrabold">* (Bắt buộc)</span>
                        )}
                      </label>
                      <span className="text-[10px] text-slate-400">
                        {actionComment.length}/500 ký tự
                      </span>
                    </div>

                    <textarea
                      value={actionComment}
                      onChange={(e) => setActionComment(e.target.value)}
                      rows={3}
                      placeholder={
                        modalAction === 'rejected'
                          ? 'Nhập lý do từ chối tờ trình (Bắt buộc để người tạo nắm rõ nguyên nhân)...'
                          : modalAction === 'changes_requested'
                          ? 'Nhập các nội dung cần bổ sung, chỉnh sửa lại trước khi trình duyệt tiếp...'
                          : 'Nhập ghi chú hoặc ý kiến chỉ đạo (Tùy chọn khi phê duyệt)...'
                      }
                      className={clsx(
                        'w-full p-3 text-xs rounded-xl border bg-white focus:outline-none transition-all placeholder-slate-400',
                        (modalAction === 'rejected' || modalAction === 'changes_requested') && !actionComment.trim()
                          ? 'border-amber-300 ring-2 ring-amber-100'
                          : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                      )}
                    />

                    {/* Cảnh báo nếu chưa nhập lý do khi chọn từ chối/bổ sung */}
                    {(modalAction === 'rejected' || modalAction === 'changes_requested') && !actionComment.trim() && (
                      <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        Bạn phải nhập ý kiến/lý do để nút Xác Nhận có hiệu lực!
                      </p>
                    )}
                  </div>
                </div>

                {/* DẢI NÚT HÀNH ĐỘNG DÍNH Ở ĐÁY (ACTION BAR STICKY) */}
                <div className="pt-4 border-t border-slate-200/80 space-y-2.5">
                  {modalAction ? (
                    // Trạng thái đang xác nhận một hành động cụ thể
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl text-xs font-bold flex items-center justify-between bg-slate-100">
                        <span>
                          {modalAction === 'approved' && 'Xác nhận: DUYỆT TỜ TRÌNH HOÀN TẤT'}
                          {modalAction === 'rejected' && 'Xác nhận: TỪ CHỐI TỜ TRÌNH NÀY'}
                          {modalAction === 'changes_requested' && 'Xác nhận: YÊU CẦU BỔ SUNG TỜ TRÌNH'}
                        </span>
                        <button
                          onClick={() => setModalAction(null)}
                          className="text-slate-500 hover:text-slate-800 text-[11px] underline cursor-pointer"
                        >
                          Hủy chọn
                        </button>
                      </div>

                      <button
                        onClick={() => handleSubmitReqAction(modalAction as any)}
                        disabled={
                          isSubmitting ||
                          ((modalAction === 'rejected' || modalAction === 'changes_requested') && !actionComment.trim())
                        }
                        className={clsx(
                          'w-full py-3 px-4 rounded-xl font-extrabold text-xs text-white shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2',
                          modalAction === 'approved' && 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20',
                          modalAction === 'rejected' && 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20',
                          modalAction === 'changes_requested' && 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20',
                          (isSubmitting ||
                            ((modalAction === 'rejected' || modalAction === 'changes_requested') && !actionComment.trim())) &&
                            'opacity-50 cursor-not-allowed active:scale-100'
                        )}
                      >
                        {isSubmitting ? (
                          <span>Đang xử lý thẩm định...</span>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Xác Nhận Quyết Định</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    // 3 Nút hành động chính
                    <div className="grid grid-cols-3 gap-2">
                      {/* Nút 1: Duyệt (Xanh lá) */}
                      <button
                        onClick={() => setModalAction('approved')}
                        className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Duyệt REQ</span>
                      </button>

                      {/* Nút 2: Yêu cầu bổ sung (Vàng/Cam) */}
                      <button
                        onClick={() => setModalAction('changes_requested')}
                        className="py-2.5 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>YC Bổ Sung</span>
                      </button>

                      {/* Nút 3: Từ chối (Đỏ) */}
                      <button
                        onClick={() => setModalAction('rejected')}
                        className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Từ Chối</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL 2 CỘT CHO OFFER (SLIDE-OVER / DIALOG VỚI CẢNH BÁO ĐỘNG)          */}
      {/* ========================================================================= */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-3xl w-full max-w-5xl max-h-[92vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={clsx(
                    'w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-md',
                    selectedOffer.is_over_budget ? 'bg-rose-600 shadow-rose-500/20' : 'bg-emerald-600 shadow-emerald-500/20'
                  )}
                >
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-slate-900">
                      Thẩm Định Đề Xuất Offer Lương
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-200 text-slate-800">
                      {selectedOffer.code}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Ứng viên: <strong className="text-slate-800">{selectedOffer.candidate_name}</strong> • Đề xuất bởi {selectedOffer.created_by}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseModal}
                className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors flex items-center justify-center cursor-pointer active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: 2 Columns */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
              {/* CỘT TRÁI: CHI TIẾT OFFER & CẢNH BÁO ĐỘNG (7 Cột) */}
              <div className="lg:col-span-7 p-6 space-y-6">
                {/* 1. CẢNH BÁO ĐỘNG HẠN MỨC LƯƠNG */}
                {selectedOffer.is_over_budget ? (
                  <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 shadow-sm animate-pulse flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-rose-700">
                          Cảnh Báo: Vượt Dải Lương Chuẩn Vị Trí (+{selectedOffer.over_percentage}%)
                        </span>
                        <span className="bg-rose-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                          Cần BOD Phê Chuẩn
                        </span>
                      </div>
                      <p className="text-xs text-rose-700/90 mt-1 leading-relaxed">
                        Mức đề xuất <strong>{selectedOffer.offered_salary.toLocaleString('vi-VN')} VNĐ</strong> đã vượt trần ngân sách chuẩn{' '}
                        <strong>{selectedOffer.standard_salary_max.toLocaleString('vi-VN')} VNĐ</strong> thêm{' '}
                        <strong>{(selectedOffer.offered_salary - selectedOffer.standard_salary_max).toLocaleString('vi-VN')} VNĐ</strong>.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div className="text-xs">
                      <span className="font-extrabold block text-emerald-800">Mức lương nằm trong dải chuẩn phê duyệt</span>
                      <span className="text-emerald-700 text-[11px]">
                        Không phát sinh vượt trần định biên phòng ban.
                      </span>
                    </div>
                  </div>
                )}

                {/* Candidate & Position Identity */}
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                    {selectedOffer.department}
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-1.5 leading-snug">
                    {selectedOffer.job_title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                    <span>Email: <strong>{selectedOffer.candidate_email}</strong></span>
                    <span>• SĐT: <strong>{selectedOffer.candidate_phone}</strong></span>
                  </div>
                </div>

                {/* Salary Comparison Grid */}
                <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    So Sánh & Định Mức Lương Thẩm Định
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Lương Đề Xuất (Offer)</span>
                      <span className="text-base font-black text-blue-700 mt-0.5 block">
                        {selectedOffer.offered_salary.toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Khung Chuẩn Vị Trí</span>
                      <span className="text-xs font-extrabold text-slate-800 mt-0.5 block">
                        {selectedOffer.standard_salary_min.toLocaleString('vi-VN')} - {selectedOffer.standard_salary_max.toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Lương Thử Việc ({selectedOffer.probation_salary_percentage}%)</span>
                      <span className="text-xs font-extrabold text-slate-800 mt-0.5 block">
                        {((selectedOffer.offered_salary * selectedOffer.probation_salary_percentage) / 100).toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/60 text-xs">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Thời gian thử việc:</span>
                      <span className="font-bold text-slate-800">{selectedOffer.probation_duration_months} tháng</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Ngày nhận việc dự kiến:</span>
                      <span className="font-bold text-slate-800">{selectedOffer.start_date}</span>
                    </div>
                  </div>
                </div>

                {/* Ghi chú & Đề xuất từ HR Manager */}
                {selectedOffer.notes && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-blue-600" />
                      Lý Do & Giải Trình Từ Ban Nhân Sự
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200/80 whitespace-pre-wrap">
                      {selectedOffer.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* CỘT PHẢI: LỊCH SỬ DUYỆT (TIMELINE) & DẢI NÚT HÀNH ĐỘNG OFFER (5 Cột) */}
              <div className="lg:col-span-5 p-6 flex flex-col justify-between space-y-6 bg-slate-50/30">
                <div className="space-y-5">
                  {/* Timeline bất biến */}
                  <ApprovalTimeline items={selectedOffer.timeline} />

                  {/* Khu vực ý kiến */}
                  <div className="pt-4 border-t border-slate-200/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Ý Kiến Thẩm Định Của Bạn</span>
                        {(modalAction === 'rejected' || modalAction === 'renegotiate') && (
                          <span className="text-rose-600 text-[11px] font-extrabold">* (Bắt buộc)</span>
                        )}
                      </label>
                      <span className="text-[10px] text-slate-400">
                        {actionComment.length}/500 ký tự
                      </span>
                    </div>

                    <textarea
                      value={actionComment}
                      onChange={(e) => setActionComment(e.target.value)}
                      rows={3}
                      placeholder={
                        modalAction === 'rejected'
                          ? 'Nhập lý do không phê chuẩn mức lương offer này (Bắt buộc)...'
                          : modalAction === 'renegotiate'
                          ? 'Ghi rõ mức trần tối đa chấp nhận để HR Manager đàm phán lại với ứng viên...'
                          : 'Nhập ghi chú hoặc phê duyệt hạn mức đặc biệt...'
                      }
                      className={clsx(
                        'w-full p-3 text-xs rounded-xl border bg-white focus:outline-none transition-all placeholder-slate-400',
                        (modalAction === 'rejected' || modalAction === 'renegotiate') && !actionComment.trim()
                          ? 'border-amber-300 ring-2 ring-amber-100'
                          : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                      )}
                    />

                    {(modalAction === 'rejected' || modalAction === 'renegotiate') && !actionComment.trim() && (
                      <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        Bạn phải nhập ý kiến/lý do để nút Xác Nhận có hiệu lực!
                      </p>
                    )}
                  </div>
                </div>

                {/* DẢI NÚT HÀNH ĐỘNG OFFER (STICKY BOTTOM) */}
                <div className="pt-4 border-t border-slate-200/80 space-y-2.5">
                  {modalAction ? (
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-xl text-xs font-bold flex items-center justify-between bg-slate-100">
                        <span>
                          {modalAction === 'approved' && 'Xác nhận: DUYỆT OFFER LƯƠNG'}
                          {modalAction === 'rejected' && 'Xác nhận: TỪ CHỐI MỨC OFFER'}
                          {modalAction === 'renegotiate' && 'Xác nhận: YÊU CẦU ĐÀM PHÁN LẠI'}
                        </span>
                        <button
                          onClick={() => setModalAction(null)}
                          className="text-slate-500 hover:text-slate-800 text-[11px] underline cursor-pointer"
                        >
                          Hủy chọn
                        </button>
                      </div>

                      <button
                        onClick={() => handleSubmitOfferAction(modalAction as any)}
                        disabled={
                          isSubmitting ||
                          ((modalAction === 'rejected' || modalAction === 'renegotiate') && !actionComment.trim())
                        }
                        className={clsx(
                          'w-full py-3 px-4 rounded-xl font-extrabold text-xs text-white shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2',
                          modalAction === 'approved' && 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20',
                          modalAction === 'rejected' && 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20',
                          modalAction === 'renegotiate' && 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20',
                          (isSubmitting ||
                            ((modalAction === 'rejected' || modalAction === 'renegotiate') && !actionComment.trim())) &&
                            'opacity-50 cursor-not-allowed active:scale-100'
                        )}
                      >
                        {isSubmitting ? (
                          <span>Đang xử lý phê duyệt...</span>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Xác Nhận Quyết Định</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {/* 1. Duyệt (Nút Xanh) */}
                      <button
                        onClick={() => setModalAction('approved')}
                        className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Duyệt Offer</span>
                      </button>

                      {/* 2. Yêu cầu sửa / Đàm phán lại (Nút Vàng) */}
                      <button
                        onClick={() => setModalAction('renegotiate')}
                        className="py-2.5 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Yêu Cầu Sửa</span>
                      </button>

                      {/* 3. Từ chối (Nút Đỏ) */}
                      <button
                        onClick={() => setModalAction('rejected')}
                        className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Từ Chối</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
