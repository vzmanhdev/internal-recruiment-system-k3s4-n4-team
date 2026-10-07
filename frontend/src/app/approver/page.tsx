"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Eye,
  ChevronDown,
  Bell,
  LogOut,
  User as UserIcon,
  Building,
  DollarSign,
  Calendar,
  AlertCircle,
  FileText,
  Check,
  X,
  TrendingUp,
  AlertTriangle,
  Info,
  Send,
  Lock,
  History,
  LayoutDashboard,
  Settings,
  FileEdit,
  Award,
  Briefcase,
  Laptop,
  MessageSquareQuote,
  Camera
} from "lucide-react";
import {
  ApprovalWorkflowTimeline,
  ApprovalStep,
} from "@/components/ApprovalWorkflowTimeline";
import { UserProfileModal } from "@/components/UserProfileModal";
import { AvatarCropModal } from "@/components/AvatarCropModal";
import { CroppedAvatarResult } from "@/lib/cropImage";

// ==========================================
// 1. DATA TYPES & INTERFACES (STRICT WORKFLOW)
// ==========================================

export type ItemType = "REQUISITION" | "OFFER";
export type DecisionType = "APPROVED" | "REJECTED" | "NEEDS_REVISION";
export type DossierStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "REVISION_REQUESTED";

export interface RequisitionItem {
  id: string;
  code: string;
  type: "REQUISITION";
  status: DossierStatus;
  currentStepIndex: number; // 0-indexed: vị trí cấp duyệt hiện tại trong mảng steps
  currentApproverId: string; // ID người duyệt ở cấp hiện tại
  currentApproverName: string;
  proposerId: string;
  proposerName: string;
  proposerRole: string;
  title: string;
  department: string;
  level: "Junior" | "Middle" | "Senior" | "Lead" | "Manager";
  headcount: number;
  createdAt: string;
  slaDeadline: string; // e.g. "Còn 14 giờ"
  isSlaUrgent: boolean;
  proposedSalary: number; // in VND
  minStandardSalary: number;
  maxStandardSalary: number;
  isExceeded: boolean;
  exceededPercent: number; // e.g. 22.2%
  justification: string;
  description: string;
  requirements: string;
  budgetQuarter: string;
  auditHash: string;
  lastAuditedAt: string;
  steps: ApprovalStep[];
}

export interface OfferItem {
  id: string;
  code: string;
  type: "OFFER";
  status: DossierStatus;
  currentStepIndex: number;
  currentApproverId: string;
  currentApproverName: string;
  proposerId: string;
  proposerName: string;
  proposerRole: string;
  title: string; // Job position
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  candidateExperience: string;
  department: string;
  level: string;
  requisitionCode: string;
  createdAt: string;
  slaDeadline: string;
  isSlaUrgent: boolean;
  proposedSalary: number; // in VND
  minStandardSalary: number;
  maxStandardSalary: number;
  isExceeded: boolean;
  exceededPercent: number;
  probationRate: string; // e.g. "100% lương" or "85% lương"
  signOnBonus?: number;
  interviewScore: string; // e.g. "9.6 / 10"
  justification: string;
  workStartDate: string;
  auditHash: string;
  lastAuditedAt: string;
  steps: ApprovalStep[];
}

export type ApproverItem = RequisitionItem | OfferItem;

export interface HistoryRecord {
  id: string;
  itemCode: string;
  itemTitle: string;
  itemType: ItemType;
  department: string;
  decision: DecisionType;
  decisionAt: string;
  comment: string;
  proposedSalary: number;
  isExceeded: boolean;
  dossierSnapshot: ApproverItem;
}

// Thông tin người duyệt hiện tại đăng nhập vào hệ thống
export const CURRENT_APPROVER = {
  id: "USR-APPROVER-01",
  email: "nguoiduyet@company.com",
  name: "Trần Đức Nam",
  role: "Người phê duyệt",
  subRole: "Thành viên Hội đồng Phê duyệt Nhân tài Cấp cao",
  department: "Hội đồng Phê duyệt Tuyển dụng",
  phone: "0908 999 888",
  avatarUrl: "",
  bio: "Chịu trách nhiệm thẩm định và phê duyệt các yêu cầu tuyển dụng cũng như gói đãi ngộ nhân sự theo ngân sách định biên.",
};

// ==========================================
// 2. INITIAL MOCK DATASETS
// ==========================================

const INITIAL_REQUISITIONS: RequisitionItem[] = [
  {
    id: "req-1",
    code: "REQ-2026-089",
    type: "REQUISITION",
    status: "PENDING",
    currentStepIndex: 2, // Đang ở cấp 3: Trưởng phòng Nhân sự (Trần Đức Nam)
    currentApproverId: "USR-APPROVER-01",
    currentApproverName: "Trần Đức Nam",
    proposerId: "USR-PROPOSER-01",
    proposerName: "Nguyễn Văn Hùng",
    proposerRole: "Engineering Manager",
    title: "Senior DevOps / SRE Lead",
    department: "Khối Hạ Tầng & Công Nghệ Điện Toán Đám Mây",
    level: "Lead",
    headcount: 2,
    createdAt: "04/10/2026 - 09:15",
    slaDeadline: "Còn 14 giờ",
    isSlaUrgent: true,
    proposedSalary: 55000000,
    minStandardSalary: 35000000,
    maxStandardSalary: 45000000,
    isExceeded: true,
    exceededPercent: 22.2,
    justification:
      "Dự án di chuyển hạ tầng sang Kubernetes đa vùng và kiểm toán an ninh SOC2 cấp thiết trong Q4/2026. Thị trường nhân sự Cloud/SRE chứng chỉ CKA/AWS Professional đang cạnh tranh gay gắt.",
    description:
      "Chịu trách nhiệm thiết kế kiến trúc đám mây an toàn, xây dựng đường ống CI/CD tự động hoá cho hơn 60 microservices, đảm bảo SLA hệ thống đạt 99.99%.",
    requirements:
      "Tối thiểu 5 năm kinh nghiệm quản trị AWS/GCP, Terraform, Kubernetes, thành thạo giám sát Datadog/Prometheus, ưu tiên ứng viên có chứng chỉ bảo mật.",
    budgetQuarter: "Q4/2026 - Dự phòng ngân sách công nghệ",
    auditHash: "9a7f3e8b41cd892fa612bc4501aed48f654bce430291ba2045e0321fed98a120",
    lastAuditedAt: "04/10/2026 - 09:15",
    steps: [
      {
        id: "step-1",
        stepNumber: 1,
        stepName: "Khởi tạo & Thẩm định chuyên môn",
        approverName: "Nguyễn Văn Hùng",
        approverRole: "Engineering Manager",
        department: "Khối Hạ Tầng & Cloud",
        status: "APPROVED",
        timestamp: "04/10/2026 - 09:30",
        comment: "Đã xác nhận sự thiếu hụt nhân sự chủ chốt cho đợt nâng cấp core hệ thống quý 4.",
        slaHours: 24,
      },
      {
        id: "step-2",
        stepNumber: 2,
        stepName: "Thẩm định thị trường & Khung lương HR",
        approverName: "Trần Thị Mai",
        approverRole: "HR Talent Acquisition Lead",
        department: "Khối Thu Hút Nhân Tài (TA)",
        status: "APPROVED",
        timestamp: "04/10/2026 - 11:45",
        comment: "Mức lương 55M nằm ở phân vị P75-P80 của thị trường Tech Lead hiện tại. Khuyến nghị thông qua để chốt ứng viên Tier-1.",
        slaHours: 24,
      },
      {
        id: "step-3",
        stepNumber: 3,
        stepName: "Phê duyệt Trưởng phòng Nhân sự",
        approverName: "Trần Đức Nam",
        approverRole: "Người phê duyệt (Bạn)",
        department: "Phòng Nhân Sự & Văn Hóa",
        status: "PENDING",
        timestamp: "Đang chờ bạn xử lý...",
        comment: "",
        slaHours: 24,
      },
      {
        id: "step-4",
        stepNumber: 4,
        stepName: "Duyệt ngân sách Ban Giám Đốc",
        approverName: "Ban Tổng Giám Đốc (CEO/CFO)",
        approverRole: "Phó Tổng Giám Đốc Điều Hành",
        department: "Ban Điều Hành",
        status: "NOT_REACHED",
        timestamp: "Chưa đến lượt",
        comment: "",
        slaHours: 48,
      },
    ],
  },
  {
    id: "req-2",
    code: "REQ-2026-092",
    type: "REQUISITION",
    status: "PENDING",
    currentStepIndex: 2, // Cấp 3: Trưởng phòng Nhân sự (Cấp duyệt cuối cùng cho vị trí Middle)
    currentApproverId: "USR-APPROVER-01",
    currentApproverName: "Trần Đức Nam",
    proposerId: "USR-PROPOSER-02",
    proposerName: "Vũ Khánh Linh",
    proposerRole: "Product Design Lead",
    title: "Chuyên Viên UI/UX Designer & Design System",
    department: "Phòng Trải Nghiệm Khách Hàng & Thiết Kế Sản Phẩm",
    level: "Middle",
    headcount: 1,
    createdAt: "04/10/2026 - 14:20",
    slaDeadline: "Còn 28 giờ",
    isSlaUrgent: false,
    proposedSalary: 28000000,
    minStandardSalary: 24000000,
    maxStandardSalary: 30000000,
    isExceeded: false,
    exceededPercent: 0,
    justification: "Nằm trong kế hoạch tuyển dụng định biên đã được duyệt đầu năm 2026, ngân sách cân đối chuẩn xác.",
    description:
      "Phụ trách chuẩn hóa hệ thống Design Tokens trên Figma, thiết kế giao diện ứng dụng web responsive, phối hợp cùng team Frontend thực thi chuẩn WCAG 2.1 AA.",
    requirements:
      "Tối thiểu 3 năm kinh nghiệm thiết kế sản phẩm số B2B/SaaS, nắm vững auto-layout, quy trình bàn giao thiết kế sang code React.",
    budgetQuarter: "Q4/2026 - Ngân sách hoạt động định biên",
    auditHash: "4c1e7a55099bf216de4b9c1d09f7a6b2c019d88e4531ac991b5d63f03409ae11",
    lastAuditedAt: "04/10/2026 - 14:20",
    steps: [
      {
        id: "step-21",
        stepNumber: 1,
        stepName: "Khởi tạo & Thẩm định chuyên môn",
        approverName: "Vũ Khánh Linh",
        approverRole: "Product Design Lead",
        department: "Phòng Thiết Kế Sản Phẩm",
        status: "APPROVED",
        timestamp: "04/10/2026 - 14:35",
        comment: "Bản mô tả công việc và bài test thiết kế chuyên môn đã hoàn tất.",
        slaHours: 24,
      },
      {
        id: "step-22",
        stepNumber: 2,
        stepName: "Thẩm định định biên nhân sự",
        approverName: "Đỗ Phương Thảo",
        approverRole: "HR Business Partner",
        department: "Phòng Nhân Sự & Văn Hóa",
        status: "APPROVED",
        timestamp: "04/10/2026 - 16:10",
        comment: "Đúng chỉ tiêu định biên, ngân sách phù hợp dải chuẩn bậc Middle Designer.",
        slaHours: 24,
      },
      {
        id: "step-23",
        stepNumber: 3,
        stepName: "Phê duyệt Trưởng phòng Nhân sự",
        approverName: "Trần Đức Nam",
        approverRole: "Người phê duyệt (Bạn - Cấp cuối)",
        department: "Phòng Nhân Sự & Văn Hóa",
        status: "PENDING",
        timestamp: "Đang chờ bạn xử lý...",
        comment: "",
        slaHours: 24,
      },
    ],
  },
  {
    id: "req-3",
    code: "REQ-2026-095",
    type: "REQUISITION",
    status: "PENDING",
    currentStepIndex: 1, // Đang ở cấp 2: Trưởng phòng Nhân sự
    currentApproverId: "USR-APPROVER-01",
    currentApproverName: "Trần Đức Nam",
    proposerId: "USR-PROPOSER-03",
    proposerName: "Hoàng Minh Tuấn",
    proposerRole: "Phó Giám Đốc Kinh Doanh",
    title: "Trưởng Nhóm Phát Triển Kinh Doanh Quốc Tế (BD Manager)",
    department: "Khối Phát Triển Thị Trường Châu Á - TBD",
    level: "Manager",
    headcount: 1,
    createdAt: "03/10/2026 - 16:45",
    slaDeadline: "Còn 3 giờ (Sắp quá hạn)",
    isSlaUrgent: true,
    proposedSalary: 62000000,
    minStandardSalary: 45000000,
    maxStandardSalary: 52000000,
    isExceeded: true,
    exceededPercent: 19.2,
    justification:
      "Vị trí phụ trách mở rộng thị trường trọng điểm Singapore và Nhật Bản. Đòi hỏi kinh nghiệm đàm phán hợp đồng Enterprise đa quốc gia và có mạng lưới quan hệ B2B ngành công nghệ tài chính sẵn có.",
    description:
      "Xây dựng chiến lược mở rộng thị trường, đàm phán ký kết đối tác chiến lược cấp cao, quản lý và huấn luyện đội ngũ 5 chuyên viên BD quốc tế.",
    requirements:
      "Tối thiểu 6 năm kinh nghiệm B2B Sales/BD, thành thạo tiếng Anh thương mại C1/IELTS 7.5+, từng đem về doanh số tối thiểu 1.5 triệu USD/năm.",
    budgetQuarter: "Q4/2026 - Quỹ mở rộng thị trường toàn cầu",
    auditHash: "1e5f8a023b9cde471092a83efc8901ba6452ed7839401bf56289ca1149e85da3",
    lastAuditedAt: "03/10/2026 - 16:45",
    steps: [
      {
        id: "step-31",
        stepNumber: 1,
        stepName: "Khởi tạo & Giải trình doanh thu",
        approverName: "Hoàng Minh Tuấn",
        approverRole: "Phó Giám Đốc Kinh Doanh",
        department: "Khối Kinh Doanh Quốc Tế",
        status: "APPROVED",
        timestamp: "03/10/2026 - 17:00",
        comment: "Kế hoạch doanh thu cam kết mang lại dòng tiền ngay từ tháng thứ 3 sau onboard.",
        slaHours: 24,
      },
      {
        id: "step-32",
        stepNumber: 2,
        stepName: "Phê duyệt Trưởng phòng Nhân sự",
        approverName: "Trần Đức Nam",
        approverRole: "Người phê duyệt (Bạn)",
        department: "Phòng Nhân Sự & Văn Hóa",
        status: "PENDING",
        timestamp: "Đang chờ bạn xử lý...",
        comment: "",
        slaHours: 24,
      },
      {
        id: "step-33",
        stepNumber: 3,
        stepName: "Phê duyệt Ban Giám Đốc (CEO)",
        approverName: "Phạm Nhật Minh",
        approverRole: "Tổng Giám Đốc (CEO)",
        department: "Ban Điều Hành",
        status: "NOT_REACHED",
        timestamp: "Chưa đến lượt",
        comment: "",
        slaHours: 48,
      },
    ],
  },
  // BẢN NHÁP CỦA NGƯỜI KHÁC (Tuyệt đối KHÔNG hiển thị trong danh sách Chờ duyệt của người duyệt hiện tại)
  {
    id: "req-draft-1",
    code: "REQ-2026-DRAFT-01",
    type: "REQUISITION",
    status: "DRAFT",
    currentStepIndex: 0,
    currentApproverId: "",
    currentApproverName: "",
    proposerId: "USR-PROPOSER-03",
    proposerName: "Hoàng Minh Tuấn",
    proposerRole: "Phó Giám Đốc Kinh Doanh",
    title: "Chuyên Viên Phân Tích Nghiệp Vụ (BA)",
    department: "Phòng Phân Tích Dữ Liệu & Nghiệp Vụ",
    level: "Middle",
    headcount: 1,
    createdAt: "05/10/2026 - 08:00",
    slaDeadline: "Bản nháp",
    isSlaUrgent: false,
    proposedSalary: 25000000,
    minStandardSalary: 20000000,
    maxStandardSalary: 28000000,
    isExceeded: false,
    exceededPercent: 0,
    justification: "Đang soạn thảo dở nội dung.",
    description: "Soạn thảo tài liệu đặc tả yêu cầu.",
    requirements: "2 năm kinh nghiệm BA.",
    budgetQuarter: "Q4/2026",
    auditHash: "0000000000000000000000000000000000000000000000000000000000000000",
    lastAuditedAt: "05/10/2026 - 08:00",
    steps: [],
  },
  // HỒ SƠ ĐANG Ở CẤP KHÁC (Không gán cho người duyệt hiện tại -> KHÔNG hiển thị)
  {
    id: "req-other-level-1",
    code: "REQ-2026-071",
    type: "REQUISITION",
    status: "PENDING",
    currentStepIndex: 3,
    currentApproverId: "USR-BOD-01", // Đang chờ Phó Tổng Giám Đốc duyệt, không phải Trần Đức Nam
    currentApproverName: "Phó Tổng Giám Đốc (BOD)",
    proposerId: "USR-PROPOSER-01",
    proposerName: "Nguyễn Văn Hùng",
    proposerRole: "Engineering Manager",
    title: "Chief Information Security Officer (CISO)",
    department: "Ban An Ninh Thông Tin & Rủi Ro",
    level: "Manager",
    headcount: 1,
    createdAt: "01/10/2026 - 10:00",
    slaDeadline: "Còn 8 giờ",
    isSlaUrgent: false,
    proposedSalary: 90000000,
    minStandardSalary: 70000000,
    maxStandardSalary: 85000000,
    isExceeded: true,
    exceededPercent: 5.8,
    justification: "Yêu cầu cấp thiết về C-Level an ninh bảo mật.",
    description: "Quản trị chiến lược an ninh mạng toàn tập đoàn.",
    requirements: "CISSP, CISM, 10 năm kinh nghiệm.",
    budgetQuarter: "Q4/2026",
    auditHash: "8888888888888888888888888888888888888888888888888888888888888888",
    lastAuditedAt: "01/10/2026 - 10:00",
    steps: [],
  },
];

const INITIAL_OFFERS: OfferItem[] = [
  {
    id: "off-1",
    code: "OFF-2026-042",
    type: "OFFER",
    status: "PENDING",
    currentStepIndex: 2, // Cấp 3: Trưởng phòng Nhân sự (Trần Đức Nam)
    currentApproverId: "USR-APPROVER-01",
    currentApproverName: "Trần Đức Nam",
    proposerId: "USR-REC-01",
    proposerName: "Trần Thị Mai",
    proposerRole: "Senior Tech Recruiter",
    title: "Senior AI / Machine Learning Engineer",
    candidateName: "Đặng Quang Huy",
    candidateEmail: "quanghuy.dang@email.com",
    candidatePhone: "0912 345 678",
    candidateExperience: "4.5 năm chuyên sâu về Large Language Models (LLM) & RAG",
    department: "Trung Tâm Trí Tuệ Nhân Tạo & Phân Tích Dữ Liệu",
    level: "Senior",
    requisitionCode: "REQ-2026-077",
    createdAt: "04/10/2026 - 11:00",
    slaDeadline: "Còn 10 giờ",
    isSlaUrgent: true,
    proposedSalary: 48000000,
    minStandardSalary: 32000000,
    maxStandardSalary: 40000000,
    isExceeded: true,
    exceededPercent: 20.0,
    probationRate: "100% lương chính thức",
    signOnBonus: 50000000,
    interviewScore: "9.6 / 10 (Xuất sắc)",
    justification:
      "Ứng viên đạt điểm số phỏng vấn 9.6/10 từ Hội đồng công nghệ AI Lab. Tác giả 2 công bố khoa học tại hội nghị hàng đầu. Hiện ứng viên đang có 2 lời mời làm việc (counter-offers) từ các tập đoàn công nghệ khác với mức 50M+. Để thu hút nhân tài then chốt này, TA đề xuất mức 48M kèm Sign-on bonus cam kết 18 tháng.",
    workStartDate: "15/10/2026",
    auditHash: "7b82f0991cae5124803db19ec23746a58140f82319ab4601dfa2985149ce8812",
    lastAuditedAt: "04/10/2026 - 11:00",
    steps: [
      {
        id: "step-o11",
        stepNumber: 1,
        stepName: "Đề xuất & Thỏa thuận sơ bộ ứng viên",
        approverName: "Trần Thị Mai",
        approverRole: "Senior Tech Recruiter",
        department: "Khối Thu Hút Nhân Tài (TA)",
        status: "APPROVED",
        timestamp: "04/10/2026 - 11:15",
        comment: "Ứng viên đồng ý chốt nếu offer được phê duyệt trước 18:00 ngày mai.",
        slaHours: 24,
      },
      {
        id: "step-o12",
        stepNumber: 2,
        stepName: "Xác nhận chuyên môn Trưởng bộ phận",
        approverName: "Lê Trọng Tấn",
        approverRole: "Head of AI Research Lab",
        department: "Trung Tâm Trí Tuệ Nhân Tạo",
        status: "APPROVED",
        timestamp: "04/10/2026 - 13:40",
        comment: "Đánh giá ứng viên xuất sắc, giải quyết được bài toán tối ưu hoá latency mô hình RAG hiện nay.",
        slaHours: 24,
      },
      {
        id: "step-o13",
        stepNumber: 3,
        stepName: "Phê duyệt Trưởng phòng Nhân sự",
        approverName: "Trần Đức Nam",
        approverRole: "Người phê duyệt (Bạn)",
        department: "Phòng Nhân Sự & Văn Hóa",
        status: "PENDING",
        timestamp: "Đang chờ bạn xử lý...",
        comment: "",
        slaHours: 24,
      },
      {
        id: "step-o14",
        stepNumber: 4,
        stepName: "Duyệt vượt ngân sách CFO / Tổng Giám Đốc",
        approverName: "Vũ Đình Cường",
        approverRole: "Giám Đốc Tài Chính (CFO)",
        department: "Khối Tài Chính - Kế Toán",
        status: "NOT_REACHED",
        timestamp: "Chưa đến lượt",
        comment: "",
        slaHours: 48,
      },
    ],
  },
  {
    id: "off-2",
    code: "OFF-2026-045",
    type: "OFFER",
    status: "PENDING",
    currentStepIndex: 2, // Cấp 3: Trưởng phòng Nhân sự (Cấp cuối)
    currentApproverId: "USR-APPROVER-01",
    currentApproverName: "Trần Đức Nam",
    proposerId: "USR-REC-02",
    proposerName: "Vũ Khánh Linh",
    proposerRole: "Talent Acquisition Specialist",
    title: "Senior Backend Golang Developer",
    candidateName: "Ngô Quốc Thái",
    candidateEmail: "quocthai.ngo@email.com",
    candidatePhone: "0988 765 432",
    candidateExperience: "5 năm kinh nghiệm Backend Microservices & High-load",
    department: "Phòng Phát Triển Nền Tảng Giao Dịch Cốt Lõi",
    level: "Senior",
    requisitionCode: "REQ-2026-081",
    createdAt: "04/10/2026 - 15:30",
    slaDeadline: "Còn 36 giờ",
    isSlaUrgent: false,
    proposedSalary: 35000000,
    minStandardSalary: 30000000,
    maxStandardSalary: 38000000,
    isExceeded: false,
    exceededPercent: 0,
    probationRate: "85% lương chính thức (theo luật)",
    signOnBonus: 0,
    interviewScore: "8.8 / 10 (Tốt)",
    justification: "Mức lương đề xuất nằm ở phân vị an toàn (khoảng giữa dải chuẩn 30-38M). Đầy đủ các tiêu chuẩn kỹ thuật về Golang và gRPC.",
    workStartDate: "01/11/2026",
    auditHash: "2d3e91bc448fa560912cb84ef70123ae495167b09823ac5419028e3415cf9801",
    lastAuditedAt: "04/10/2026 - 15:30",
    steps: [
      {
        id: "step-o21",
        stepNumber: 1,
        stepName: "Đề xuất & Thẩm định hồ sơ",
        approverName: "Vũ Khánh Linh",
        approverRole: "Talent Acquisition Specialist",
        department: "Khối Thu Hút Nhân Tài (TA)",
        status: "APPROVED",
        timestamp: "04/10/2026 - 15:45",
        comment: "Hồ sơ tham chiếu (reference check) từ công ty cũ rất tích cực, thái độ tốt.",
        slaHours: 24,
      },
      {
        id: "step-o22",
        stepNumber: 2,
        stepName: "Xác nhận chuyên môn Trưởng bộ phận",
        approverName: "Bùi Quang Huy",
        approverRole: "Technical Director",
        department: "Phòng Phát Triển Phần Mềm",
        status: "APPROVED",
        timestamp: "04/10/2026 - 16:30",
        comment: "Kỹ năng Golang, Redis, Kafka đạt chuẩn Senior, pass bài live-coding kiến trúc 8.8/10.",
        slaHours: 24,
      },
      {
        id: "step-o23",
        stepNumber: 3,
        stepName: "Phê duyệt Trưởng phòng Nhân sự",
        approverName: "Trần Đức Nam",
        approverRole: "Người phê duyệt (Bạn - Cấp cuối)",
        department: "Phòng Nhân Sự & Văn Hóa",
        status: "PENDING",
        timestamp: "Đang chờ bạn xử lý...",
        comment: "",
        slaHours: 24,
      },
    ],
  },
  // BẢN NHÁP OFFER (Tuyệt đối KHÔNG hiển thị trong danh sách Chờ duyệt)
  {
    id: "off-draft-1",
    code: "OFF-2026-DRAFT-01",
    type: "OFFER",
    status: "DRAFT",
    currentStepIndex: 0,
    currentApproverId: "",
    currentApproverName: "",
    proposerId: "USR-REC-02",
    proposerName: "Vũ Khánh Linh",
    proposerRole: "Talent Acquisition Specialist",
    title: "Thực Tập Sinh Thiết Kế Đồ Họa",
    candidateName: "Phạm Thúy An",
    candidateEmail: "thuyan.pham@gmail.com",
    candidatePhone: "0933 222 111",
    candidateExperience: "Sinh viên năm cuối",
    department: "Phòng Trải Nghiệm Khách Hàng",
    level: "Intern",
    requisitionCode: "REQ-2026-050",
    createdAt: "05/10/2026 - 08:30",
    slaDeadline: "Bản nháp",
    isSlaUrgent: false,
    proposedSalary: 6000000,
    minStandardSalary: 5000000,
    maxStandardSalary: 7000000,
    isExceeded: false,
    exceededPercent: 0,
    probationRate: "100%",
    interviewScore: "8.0 / 10",
    justification: "Bản nháp đang thu thập hồ sơ ứng viên.",
    workStartDate: "15/10/2026",
    auditHash: "0000000000000000000000000000000000000000000000000000000000000000",
    lastAuditedAt: "05/10/2026 - 08:30",
    steps: [],
  },
];

const INITIAL_HISTORY: HistoryRecord[] = [
  {
    id: "hist-1",
    itemCode: "REQ-2026-080",
    itemTitle: "Frontend Tech Lead (Next.js / React)",
    itemType: "REQUISITION",
    department: "Phòng Phát Triển Trải Nghiệm Số",
    decision: "APPROVED",
    decisionAt: "02/10/2026 - 16:20",
    comment: "Đồng ý phê duyệt tuyển gấp. Đề nghị TA tập trung nguồn lực sàng lọc CV chất lượng cao.",
    proposedSalary: 45000000,
    isExceeded: false,
    dossierSnapshot: {
      id: "req-hist-1",
      code: "REQ-2026-080",
      type: "REQUISITION",
      status: "APPROVED",
      currentStepIndex: 1,
      currentApproverId: "",
      currentApproverName: "Đã hoàn thành",
      proposerId: "USR-PROPOSER-01",
      proposerName: "Đặng Văn Lâm",
      proposerRole: "Software Director",
      title: "Frontend Tech Lead (Next.js / React)",
      department: "Phòng Phát Triển Trải Nghiệm Số",
      level: "Lead",
      headcount: 1,
      createdAt: "02/10/2026 - 10:00",
      slaDeadline: "Đã hoàn thành",
      isSlaUrgent: false,
      proposedSalary: 45000000,
      minStandardSalary: 40000000,
      maxStandardSalary: 50000000,
      isExceeded: false,
      exceededPercent: 0,
      justification: "Nằm trong dải lương chuẩn của công ty.",
      description: "Dẫn dắt đội ngũ Frontend 8 kỹ sư tái thiết kế toàn bộ kiến trúc portal nội bộ.",
      requirements: "6+ năm kinh nghiệm Web Frontend, thành thạo Next.js App Router, SSR, Performance tuning.",
      budgetQuarter: "Q4/2026",
      auditHash: "5f9a12c8b093de458129ac8317e082ba4512903e19ab4601dfa2985149ce8812",
      lastAuditedAt: "02/10/2026 - 16:20",
      steps: [
        {
          id: "step-h1",
          stepNumber: 1,
          stepName: "Khởi tạo yêu cầu",
          approverName: "Đặng Văn Lâm",
          approverRole: "Software Director",
          status: "APPROVED",
          timestamp: "02/10/2026 - 10:15",
          comment: "Đã rà soát kỹ khối lượng công việc.",
        },
        {
          id: "step-h2",
          stepNumber: 2,
          stepName: "Phê duyệt Trưởng phòng Nhân sự",
          approverName: "Trần Đức Nam",
          approverRole: "Người phê duyệt (Bạn)",
          status: "APPROVED",
          timestamp: "02/10/2026 - 16:20",
          comment: "Đồng ý phê duyệt tuyển gấp. Đề nghị TA tập trung nguồn lực sàng lọc CV chất lượng cao.",
        },
      ],
    },
  },
  {
    id: "hist-2",
    itemCode: "OFF-2026-038",
    itemTitle: "Chuyên Viên Quan Hệ Đối Tác Tuyển Dụng",
    itemType: "OFFER",
    department: "Khối Thu Hút Nhân Tài (TA)",
    decision: "NEEDS_REVISION",
    decisionAt: "01/10/2026 - 14:10",
    comment: "Đề nghị HR đàm phán lại mức thử việc 85% và bổ sung chứng chỉ ngoại ngữ của ứng viên vào hồ sơ.",
    proposedSalary: 25000000,
    isExceeded: true,
    dossierSnapshot: {
      id: "off-hist-2",
      code: "OFF-2026-038",
      type: "OFFER",
      status: "REVISION_REQUESTED",
      currentStepIndex: 1,
      currentApproverId: "USR-REC-02",
      currentApproverName: "Vũ Khánh Linh (Người tạo)",
      proposerId: "USR-REC-02",
      proposerName: "Vũ Khánh Linh",
      proposerRole: "Recruitment Lead",
      title: "Chuyên Viên Quan Hệ Đối Tác Tuyển Dụng",
      candidateName: "Phạm Hồng Ngọc",
      candidateEmail: "hongngoc.pham@email.com",
      candidatePhone: "0909 112 233",
      candidateExperience: "2 năm kinh nghiệm nhân sự",
      department: "Khối Thu Hút Nhân Tài (TA)",
      level: "Junior",
      requisitionCode: "REQ-2026-068",
      createdAt: "01/10/2026 - 09:00",
      slaDeadline: "Đã yêu cầu sửa",
      isSlaUrgent: false,
      proposedSalary: 25000000,
      minStandardSalary: 18000000,
      maxStandardSalary: 22000000,
      isExceeded: true,
      exceededPercent: 13.6,
      probationRate: "100% lương",
      interviewScore: "8.0 / 10",
      justification: "Ứng viên có kỹ năng kết nối trường đại học tốt.",
      workStartDate: "10/10/2026",
      auditHash: "8a1e45778099bf216de4b9c1d09f7a6b2c019d88e4531ac991b5d63f03409ae99",
      lastAuditedAt: "01/10/2026 - 14:10",
      steps: [
        {
          id: "step-h21",
          stepNumber: 1,
          stepName: "Đề xuất Offer",
          approverName: "Vũ Khánh Linh",
          approverRole: "Recruitment Lead",
          status: "APPROVED",
          timestamp: "01/10/2026 - 09:20",
          comment: "Đề xuất mức lương 25M để chốt nhanh.",
        },
        {
          id: "step-h22",
          stepNumber: 2,
          stepName: "Phê duyệt Trưởng phòng Nhân sự",
          approverName: "Trần Đức Nam",
          approverRole: "Người phê duyệt (Bạn)",
          status: "REJECTED",
          timestamp: "01/10/2026 - 14:10",
          comment: "Đề nghị HR đàm phán lại mức thử việc 85% và bổ sung chứng chỉ ngoại ngữ của ứng viên vào hồ sơ.",
        },
        {
          id: "step-h23-rev",
          stepNumber: 3,
          stepName: "Yêu cầu Bổ sung & Trả hồ sơ về Người tạo",
          approverName: "Trần Đức Nam",
          approverRole: "Người phê duyệt (Người duyệt)",
          department: "Phòng Nhân Sự & Văn Hóa Doanh Nghiệp",
          status: "REJECTED",
          timestamp: "01/10/2026 - 14:10",
          comment: "Nội dung yêu cầu sửa: Đề nghị HR đàm phán lại mức thử việc 85% và bổ sung chứng chỉ ngoại ngữ của ứng viên vào hồ sơ.",
        },
      ],
    },
  },
  {
    id: "hist-3",
    itemCode: "REQ-2026-074",
    itemTitle: "Trợ Lý Giám Đốc Vận Hành",
    itemType: "REQUISITION",
    department: "Văn Phòng Ban Điều Hành",
    decision: "REJECTED",
    decisionAt: "28/09/2026 - 11:30",
    comment: "Định biên bộ máy hành chính hiện đã tối ưu. Chưa cần thiết bổ sung nhân sự ở thời điểm này theo nghị quyết HĐQT.",
    proposedSalary: 32000000,
    isExceeded: false,
    dossierSnapshot: {
      id: "req-hist-3",
      code: "REQ-2026-074",
      type: "REQUISITION",
      status: "REJECTED",
      currentStepIndex: 1,
      currentApproverId: "",
      currentApproverName: "Bị từ chối",
      proposerId: "USR-PROPOSER-04",
      proposerName: "Lê Quốc Trung",
      proposerRole: "Operations Lead",
      title: "Trợ Lý Giám Đốc Vận Hành",
      department: "Văn Phòng Ban Điều Hành",
      level: "Senior",
      headcount: 1,
      createdAt: "27/09/2026 - 15:00",
      slaDeadline: "Đã kết thúc",
      isSlaUrgent: false,
      proposedSalary: 32000000,
      minStandardSalary: 28000000,
      maxStandardSalary: 35000000,
      isExceeded: false,
      exceededPercent: 0,
      justification: "Nhu cầu hỗ trợ tổng hợp báo cáo tuần.",
      description: "Thực hiện thư ký cuộc họp, theo dõi tiến độ các phòng ban.",
      requirements: "3 năm kinh nghiệm trợ lý hoặc thư ký ban điều hành.",
      budgetQuarter: "Q3/2026",
      auditHash: "3c2a11b8b093de458129ac8317e082ba4512903e19ab4601dfa2985149ce7766",
      lastAuditedAt: "28/09/2026 - 11:30",
      steps: [
        {
          id: "step-h31",
          stepNumber: 1,
          stepName: "Khởi tạo yêu cầu",
          approverName: "Lê Quốc Trung",
          approverRole: "Operations Lead",
          status: "APPROVED",
          timestamp: "27/09/2026 - 15:30",
          comment: "Đề xuất phê duyệt sớm.",
        },
        {
          id: "step-h32",
          stepNumber: 2,
          stepName: "Phê duyệt Trưởng phòng Nhân sự",
          approverName: "Trần Đức Nam",
          approverRole: "Người phê duyệt (Bạn)",
          status: "REJECTED",
          timestamp: "28/09/2026 - 11:30",
          comment: "Định biên bộ máy hành chính hiện đã tối ưu. Chưa cần thiết bổ sung nhân sự ở thời điểm này theo nghị quyết HĐQT.",
        },
      ],
    },
  },
];

// Helper format currency
const formatVND = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

// ==========================================
// 3. MAIN COMPONENT: APPROVER DASHBOARD PAGE
// ==========================================

export default function ApproverDashboardPage() {
  const router = useRouter();

  // --- Approver Profile State ---
  const [approverProfile, setApproverProfile] = useState(() => {
    const base = {
      ...CURRENT_APPROVER,
      role: "Người phê duyệt",
      avatarUrl: "",
      bio: "Chịu trách nhiệm thẩm định và phê duyệt các yêu cầu tuyển dụng cũng như gói đãi ngộ nhân sự theo ngân sách định biên.",
    };
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("user_info");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.email) {
            return {
              ...base,
              email: parsed.email,
              name: parsed.full_name || CURRENT_APPROVER.name,
              role: "Người phê duyệt",
              avatarUrl: parsed.avatarUrl || "",
            };
          }
        }
      } catch {
        // fallback
      }
    }
    return base;
  });

  // --- Modal & Avatar Crop States ---
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<"profile" | "security">("profile");
  const [selectedRawAvatar, setSelectedRawAvatar] = useState<string | null>(null);
  const [isAvatarCropOpen, setIsAvatarCropOpen] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Avatar Upload Handler: Đọc file và mở Modal Crop
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        showToast("Vui lòng chọn file hình ảnh hợp lệ!", "warning");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedRawAvatar(event.target?.result as string);
        setIsAvatarCropOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarCropComplete = (result: CroppedAvatarResult) => {
    setApproverProfile((prev) => {
      const updated = {
        ...prev,
        avatarUrl: result.avatarUrl,
      };
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("user_info");
          const parsed = stored ? JSON.parse(stored) : {};
          localStorage.setItem(
            "user_info",
            JSON.stringify({ ...parsed, avatarUrl: result.avatarUrl })
          );
        } catch {
          // ignore
        }
      }
      return updated;
    });
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    showToast("Đã cắt và cập nhật ảnh đại diện Người duyệt thành công!");
  };

  // --- Navigation & Tab State ---
  const [activeMenu, setActiveMenu] = useState<"dashboard" | "pending" | "history" | "settings">("pending");
  const [pendingTab, setPendingTab] = useState<"requisitions" | "offers">("requisitions");

  // --- Master Data State (Bao gồm cả các hồ sơ nháp hoặc thuộc cấp duyệt khác) ---
  const [allRequisitions, setAllRequisitions] = useState<RequisitionItem[]>(INITIAL_REQUISITIONS);
  const [allOffers, setAllOffers] = useState<OfferItem[]>(INITIAL_OFFERS);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>(INITIAL_HISTORY);

  // --- Search & Filter State ---
  const [searchTerm, setSearchTerm] = useState("");
  const [budgetFilter, setBudgetFilter] = useState<"ALL" | "EXCEEDED" | "STANDARD">("ALL");
  const [historyDecisionFilter, setHistoryDecisionFilter] = useState<"ALL" | DecisionType>("ALL");

  // --- Modal States ---
  const [selectedDossier, setSelectedDossier] = useState<ApproverItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isHistoryViewMode, setIsHistoryViewMode] = useState(false);

  // --- Feedback / Action Confirmation Modal State ---
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [actionType, setActionType] = useState<DecisionType | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackError, setFeedbackError] = useState("");

  // --- UI Toast & Profile Dropdown ---
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "warning" | "danger" | "info";
  } | null>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const showToast = (text: string, type: "success" | "warning" | "danger" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Logout Handler ---
  const handleLogout = () => {
    try {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_info");
      localStorage.removeItem("internal-recruitment-session");
    } catch {
      // ignore
    }
    showToast("Đã đăng xuất thành công khỏi hệ thống!", "info");
    setTimeout(() => {
      router.push("/login");
    }, 600);
  };

  // =========================================================================
  // YÊU CẦU 1: LỌC NGHIÊM NGẶT (STRICT FILTER)
  // Chỉ hiển thị hồ sơ ở trạng thái PENDING đang gán cho người duyệt hiện tại.
  // Tuyệt đối KHÔNG hiển thị "Bản nháp" (DRAFT) của người khác hoặc cấp khác.
  // =========================================================================
  const filteredRequisitions = useMemo(() => {
    return allRequisitions.filter((item) => {
      // 1. Phải là trạng thái PENDING
      if (item.status !== "PENDING") return false;

      // 2. Phải đang gán trực tiếp cho người duyệt hiện tại
      if (item.currentApproverId !== CURRENT_APPROVER.id) return false;

      // 3. Tìm kiếm & Ngân sách
      const matchSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.proposerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchBudget =
        budgetFilter === "ALL" ||
        (budgetFilter === "EXCEEDED" && item.isExceeded) ||
        (budgetFilter === "STANDARD" && !item.isExceeded);
      return matchSearch && matchBudget;
    });
  }, [allRequisitions, searchTerm, budgetFilter]);

  const filteredOffers = useMemo(() => {
    return allOffers.filter((item) => {
      // 1. Phải là trạng thái PENDING
      if (item.status !== "PENDING") return false;

      // 2. Phải đang gán trực tiếp cho người duyệt hiện tại
      if (item.currentApproverId !== CURRENT_APPROVER.id) return false;

      // 3. Tìm kiếm & Ngân sách
      const matchSearch =
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.proposerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchBudget =
        budgetFilter === "ALL" ||
        (budgetFilter === "EXCEEDED" && item.isExceeded) ||
        (budgetFilter === "STANDARD" && !item.isExceeded);
      return matchSearch && matchBudget;
    });
  }, [allOffers, searchTerm, budgetFilter]);

  const pendingRequisitionsCount = filteredRequisitions.length;
  const pendingOffersCount = filteredOffers.length;
  const totalPendingCount = pendingRequisitionsCount + pendingOffersCount;
  const exceededCount =
    filteredRequisitions.filter((r) => r.isExceeded).length +
    filteredOffers.filter((o) => o.isExceeded).length;

  const filteredHistory = useMemo(() => {
    return historyRecords.filter((record) => {
      const matchSearch =
        record.itemTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.comment.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDecision =
        historyDecisionFilter === "ALL" || record.decision === historyDecisionFilter;
      return matchSearch && matchDecision;
    });
  }, [historyRecords, searchTerm, historyDecisionFilter]);

  // --- Detail Modal Openers ---
  const handleOpenDetailModal = (item: ApproverItem, isReadOnlyHistory = false) => {
    setSelectedDossier(item);
    setIsHistoryViewMode(isReadOnlyHistory);
    setIsDetailModalOpen(true);
  };

  // --- Action Trigger (Opens Feedback Popup) ---
  const handleInitiateAction = (action: DecisionType) => {
    setActionType(action);
    setFeedbackComment("");
    setFeedbackError("");
    setIsFeedbackModalOpen(true);
  };

  // =========================================================================
  // YÊU CẦU 3 & 4: LOGIC STATE MACHINE NGHIÊM NGẶT & BẢO TOÀN LỊCH SỬ (AUDIT TRAIL)
  // =========================================================================
  const handleConfirmAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDossier || !actionType) return;

    // 1. TÍNH NHẤT QUÁN & NGĂN CHẶN NHẢY CẤP (Guard Clauses)
    if (selectedDossier.currentApproverId !== CURRENT_APPROVER.id) {
      showToast(
        "Lỗi bảo mật: Bạn không có quyền duyệt hồ sơ này hoặc hồ sơ không ở cấp của bạn!",
        "danger"
      );
      return;
    }
    if (selectedDossier.status !== "PENDING") {
      showToast("Lỗi: Hồ sơ không ở trạng thái Chờ duyệt!", "danger");
      return;
    }

    const trimmedComment = feedbackComment.trim();

    // 2. RÀNG BUỘC BẮT BUỘC NHẬP Ý KIẾN VỚI TỪ CHỐI & YÊU CẦU BỔ SUNG
    const isCommentMandatory = actionType === "REJECTED" || actionType === "NEEDS_REVISION";
    if (isCommentMandatory && !trimmedComment) {
      setFeedbackError("Vui lòng nhập rõ lý do, các điểm cần sửa về ngân sách, dải lương hoặc năng lực (* bắt buộc)");
      return;
    }

    const nowFormatted = new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());

    const currentIdx = selectedDossier.currentStepIndex;
    let nextStatus: DossierStatus = "PENDING";
    let nextStepIdx = currentIdx;
    let nextApproverId = selectedDossier.currentApproverId;
    let nextApproverName = selectedDossier.currentApproverName;
    let updatedSteps: ApprovalStep[] = [];

    if (actionType === "APPROVED") {
      // ---------------------------------------------------------------
      // LUỒNG DUYỆT (Approve):
      // - Cập nhật bước hiện tại thành APPROVED.
      // - Nếu là cấp cuối cùng: Đổi trạng thái yêu cầu thành APPROVED.
      // - Nếu chưa phải cấp cuối: Tăng currentStepIndex + 1, chuyển sang cấp kế tiếp (PENDING).
      // ---------------------------------------------------------------
      const isFinalStep = currentIdx >= selectedDossier.steps.length - 1;

      updatedSteps = selectedDossier.steps.map((step, idx) => {
        if (idx === currentIdx) {
          return {
            ...step,
            status: "APPROVED" as const,
            timestamp: nowFormatted,
            comment: trimmedComment || "Đồng ý phê duyệt, hoàn tất thẩm định cấp Trưởng phòng Nhân sự.",
          };
        }
        if (!isFinalStep && idx === currentIdx + 1) {
          return {
            ...step,
            status: "PENDING" as const,
            timestamp: "Đang chờ xử lý...",
          };
        }
        return step;
      });

      if (isFinalStep) {
        nextStatus = "APPROVED";
        nextApproverId = "";
        nextApproverName = "Đã phê duyệt hoàn tất (Tất cả cấp đã thông qua)";
      } else {
        nextStepIdx = currentIdx + 1;
        nextStatus = "PENDING";
        const nextStepObj = updatedSteps[nextStepIdx];
        nextApproverId = "USR-BOD-01"; // Cấp kế tiếp (Ban Giám Đốc/CFO)
        nextApproverName = nextStepObj?.approverName || "Ban Giám Đốc / CFO";
      }
    } else if (actionType === "REJECTED") {
      // ---------------------------------------------------------------
      // LUỒNG TỪ CHỐI (Reject):
      // - Bước hiện tại thành REJECTED.
      // - Trạng thái yêu cầu thành REJECTED.
      // ---------------------------------------------------------------
      nextStatus = "REJECTED";
      nextApproverId = "";
      nextApproverName = "Đã dừng quy trình (Bị từ chối)";

      updatedSteps = selectedDossier.steps.map((step, idx) => {
        if (idx === currentIdx) {
          return {
            ...step,
            status: "REJECTED" as const,
            timestamp: nowFormatted,
            comment: trimmedComment,
          };
        }
        return step;
      });
    } else if (actionType === "NEEDS_REVISION") {
      // ---------------------------------------------------------------
      // LUỒNG YÊU CẦU BỔ SUNG (Request Revision):
      // - Trạng thái đổi thành REVISION_REQUESTED (Trả hồ sơ về cho người tạo).
      // - ĐẶC BIỆT LƯU Ý: Hàm cập nhật mảng lịch sử (History/Audit Trail)
      //   phải dùng LOGIC PUSH (thêm mới vào mảng), tuyệt đối KHÔNG ghi đè,
      //   KHÔNG xóa các bước duyệt trước đó để giữ nguyên lịch sử.
      // ---------------------------------------------------------------
      nextStatus = "REVISION_REQUESTED";
      nextApproverId = selectedDossier.proposerId;
      nextApproverName = `${selectedDossier.proposerName} (Người tạo hồ sơ)`;

      // Giữ nguyên các bước trước đó, đánh dấu bước hiện tại
      const preservedSteps = selectedDossier.steps.map((step, idx) => {
        if (idx === currentIdx) {
          return {
            ...step,
            status: "REJECTED" as const, // Đánh dấu điểm dừng để yêu cầu sửa
            timestamp: nowFormatted,
            comment: trimmedComment,
          };
        }
        return step;
      });

      // PUSH: Thêm mới bước ghi nhận yêu cầu bổ sung vào mảng Audit Trail (Không ghi đè, không xóa)
      const revisionEventStep: ApprovalStep = {
        id: `step-rev-${Date.now()}`,
        stepNumber: selectedDossier.steps.length + 1,
        stepName: "Yêu cầu Bổ sung & Trả hồ sơ về Người tạo",
        approverName: CURRENT_APPROVER.name,
        approverRole: `${CURRENT_APPROVER.role} (Người duyệt)`,
        department: CURRENT_APPROVER.department,
        status: "REJECTED",
        timestamp: nowFormatted,
        comment: `Nội dung yêu cầu sửa: ${trimmedComment}`,
      };

      updatedSteps = [...preservedSteps, revisionEventStep]; // PUSH vào mảng
    }

    // Snapshot hồ sơ mới
    const updatedDossier: ApproverItem = {
      ...selectedDossier,
      status: nextStatus,
      currentStepIndex: nextStepIdx,
      currentApproverId: nextApproverId,
      currentApproverName: nextApproverName,
      steps: updatedSteps,
      lastAuditedAt: nowFormatted,
    };

    // Cập nhật Master List
    if (selectedDossier.type === "REQUISITION") {
      setAllRequisitions((prev) =>
        prev.map((item) => (item.id === selectedDossier.id ? (updatedDossier as RequisitionItem) : item))
      );
    } else {
      setAllOffers((prev) =>
        prev.map((item) => (item.id === selectedDossier.id ? (updatedDossier as OfferItem) : item))
      );
    }

    // PUSH vào Danh sách Lịch sử phê duyệt (Giữ nguyên toàn bộ lịch sử)
    const newHistoryRecord: HistoryRecord = {
      id: `hist-${Date.now()}`,
      itemCode: selectedDossier.code,
      itemTitle: selectedDossier.title,
      itemType: selectedDossier.type,
      department: selectedDossier.department,
      decision: actionType,
      decisionAt: nowFormatted,
      comment: trimmedComment || (actionType === "APPROVED" ? "Đồng ý phê duyệt." : ""),
      proposedSalary: selectedDossier.proposedSalary,
      isExceeded: selectedDossier.isExceeded,
      dossierSnapshot: updatedDossier,
    };

    setHistoryRecords((prev) => [newHistoryRecord, ...prev]);

    // Đóng Modals & Reset State
    setIsFeedbackModalOpen(false);
    setIsDetailModalOpen(false);
    setSelectedDossier(null);
    setActionType(null);
    setFeedbackComment("");
    setFeedbackError("");

    // Toast phản hồi nghiệp vụ
    if (actionType === "APPROVED") {
      showToast(
        updatedDossier.status === "APPROVED"
          ? `Đã PHÊ DUYỆT HOÀN TẤT hồ sơ ${selectedDossier.code}!`
          : `Đã DUYỆT và chuyển tiếp hồ sơ ${selectedDossier.code} sang cấp tiếp theo (${nextApproverName})!`,
        "success"
      );
    } else if (actionType === "NEEDS_REVISION") {
      showToast(
        `Đã chuyển trạng thái REVISION_REQUESTED và trả hồ sơ ${selectedDossier.code} về cho ${selectedDossier.proposerName}!`,
        "warning"
      );
    } else {
      showToast(`Đã TỪ CHỐI hồ sơ ${selectedDossier.code}!`, "danger");
    }
  };

  // Kiểm tra validation cho popup submit button
  const isCommentRequired = actionType === "REJECTED" || actionType === "NEEDS_REVISION";
  const isSubmitDisabled = isCommentRequired && !feedbackComment.trim();

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 font-sans flex flex-col antialiased">
      {/* Hidden File Input for Avatar Upload */}
      <input
        type="file"
        ref={avatarInputRef}
        onChange={handleAvatarChange}
        accept="image/*"
        className="hidden"
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-70 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${
            toastMessage.type === "success"
              ? "bg-slate-900 text-white border-slate-700"
              : toastMessage.type === "warning"
              ? "bg-amber-950 text-white border-amber-700"
              : toastMessage.type === "danger"
              ? "bg-rose-950 text-white border-rose-700"
              : "bg-slate-900 text-white border-slate-700"
          }`}
        >
          {toastMessage.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toastMessage.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
          {toastMessage.type === "danger" && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
          {toastMessage.type === "info" && <Info className="w-5 h-5 text-blue-400 shrink-0" />}

          <span className="text-sm font-medium">{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
        <div className="max-w-[1760px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Left: Branding & Role Title */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#4285F4] to-[#2563EB] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-bold text-slate-900 tracking-tight">
                    Tuyển Dụng Nội Bộ
                  </span>
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-50 text-[#4285F4] border border-blue-200 shadow-xs">
                    Người phê duyệt
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Luồng Phê Duyệt Nghiêm Ngặt (Strict Workflow) • Hạn mức Lương & Ngân sách
                </p>
              </div>
            </div>
          </div>

          {/* Right: Quick Alert Stats + Notifications + Approver Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            {exceededCount > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>{exceededCount} hồ sơ vượt dải lương chuẩn</span>
              </div>
            )}

            {/* Notification Bell */}
            <button
              type="button"
              className="relative w-10 h-10 rounded-full bg-slate-50 border border-gray-100 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              title="Thông báo hồ sơ chờ duyệt"
              onClick={() => {
                showToast(`Bạn có ${totalPendingCount} hồ sơ đang gán trực tiếp chờ bạn duyệt!`, "info");
              }}
            >
              <Bell className="w-4 h-4" />
              {totalPendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white animate-pulse">
                  {totalPendingCount}
                </span>
              )}
            </button>

            {/* User Profile Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-3 pl-3 border-l border-gray-100 hover:bg-slate-50/80 p-1.5 rounded-2xl transition-all cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[#4285F4]/20"
                aria-expanded={isProfileDropdownOpen}
              >
                <div className="relative shrink-0">
                  {approverProfile.avatarUrl ? (
                    <img
                      src={approverProfile.avatarUrl}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-100 shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-blue-100">
                      TN
                    </div>
                  )}
                  <span
                    className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
                    title="Đang trực tuyến"
                  ></span>
                </div>
                <div className="text-left hidden sm:block">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900 leading-tight">
                      {approverProfile.name}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        isProfileDropdownOpen ? "rotate-180 text-[#4285F4]" : ""
                      }`}
                    />
                  </div>
                  <span className="text-xs text-slate-500 block leading-tight">
                    {approverProfile.role || "Người phê duyệt"}
                  </span>
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-[24px] border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.08)] p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* User Profile Summary Card */}
                  <div className="p-3 bg-slate-50 rounded-2xl flex items-center gap-3 mb-2 border border-gray-100/70">
                    <div
                      onClick={() => {
                        avatarInputRef.current?.click();
                      }}
                      className="relative group cursor-pointer shrink-0"
                      title="Nhấp để tải lên ảnh mới"
                    >
                      {approverProfile.avatarUrl ? (
                        <img
                          src={approverProfile.avatarUrl}
                          alt="Avatar"
                          className="w-12 h-12 rounded-xl object-cover ring-2 ring-blue-200 shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                          TN
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 truncate">
                        {approverProfile.name}
                      </div>
                      <div className="text-xs text-slate-500 truncate font-mono">
                        {approverProfile.email}
                      </div>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 text-[#4285F4] border border-blue-100">
                        Người phê duyệt • {approverProfile.id}
                      </span>
                    </div>
                  </div>

                  {/* Menu Options */}
                  <div className="space-y-1">
                    {/* Mục 1: Upload ảnh đại diện */}
                    <button
                      type="button"
                      onClick={() => {
                        avatarInputRef.current?.click();
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-[#4285F4] transition-colors text-left cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-[#4285F4]" />
                      <span>Upload ảnh đại diện</span>
                    </button>

                    {/* Mục 2: Hồ sơ cá nhân */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setProfileModalTab("profile");
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>Hồ sơ cá nhân</span>
                    </button>

                    {/* Mục 3: Đổi mật khẩu & Bảo mật */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setProfileModalTab("security");
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-slate-400" />
                      <span>Đổi mật khẩu & Bảo mật</span>
                    </button>
                  </div>

                  <hr className="my-1.5 border-gray-100" />

                  {/* Mục 4: Đăng xuất */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>

            {/* Direct Logout Button */}
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-gray-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all text-xs font-semibold cursor-pointer shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. BODY LAYOUT: SIDEBAR + MAIN CONTENT */}
      <div className="flex-1 max-w-[1760px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        {/* LEFT SIDEBAR */}
        <aside className="w-full lg:w-72 shrink-0">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 lg:sticky lg:top-28 space-y-4">
            <div className="px-4 py-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Menu Người Duyệt
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </div>

            <nav className="space-y-1.5">
              {/* Menu 1: Tổng quan (Dashboard) */}
              <button
                onClick={() => setActiveMenu("dashboard")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                  activeMenu === "dashboard"
                    ? "bg-[#4285F4] text-white shadow-md shadow-blue-500/25 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-5 h-5 shrink-0" />
                  <span>Tổng quan</span>
                </div>
              </button>

              {/* Menu 2: Cần phê duyệt (Pending Approvals - Badge màu đỏ) */}
              <button
                onClick={() => setActiveMenu("pending")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                  activeMenu === "pending"
                    ? "bg-[#4285F4] text-white shadow-md shadow-blue-500/25 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>Cần phê duyệt</span>
                </div>
                {totalPendingCount > 0 && (
                  <span
                    className={`px-2 py-0.5 text-xs font-extrabold rounded-full ${
                      activeMenu === "pending"
                        ? "bg-rose-500 text-white shadow-xs"
                        : "bg-rose-500 text-white"
                    }`}
                  >
                    {totalPendingCount}
                  </span>
                )}
              </button>

              {/* Menu 3: Lịch sử phê duyệt */}
              <button
                onClick={() => setActiveMenu("history")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                  activeMenu === "history"
                    ? "bg-[#4285F4] text-white shadow-md shadow-blue-500/25 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <History className="w-5 h-5 shrink-0" />
                  <span>Lịch sử phê duyệt</span>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    activeMenu === "history" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {historyRecords.length}
                </span>
              </button>

              {/* Menu 4: Cài đặt cá nhân */}
              <button
                onClick={() => setActiveMenu("settings")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                  activeMenu === "settings"
                    ? "bg-[#4285F4] text-white shadow-md shadow-blue-500/25 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 shrink-0" />
                  <span>Cài đặt cá nhân</span>
                </div>
              </button>
            </nav>

            {/* Khối Trạng thái máy chủ (Server Status Widget) */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="bg-slate-50 rounded-2xl p-4 border border-gray-100/80 flex flex-col">
                {/* Dòng 1: Tiêu đề */}
                <div className="flex items-center gap-2 mb-1">
                  <Laptop className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-sm font-semibold text-gray-700">Trạng thái máy chủ</span>
                </div>

                {/* Dòng 2: Trạng thái */}
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
                  <span className="text-sm font-medium text-emerald-600">Hoạt động ổn định (99.98%)</span>
                </div>

                {/* Dòng 3: Phiên bản */}
                <div className="mt-2 text-xs text-gray-400">
                  Phiên bản hệ thống: v2.4.0-prod
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* ======================================================== */}
          {/* TAB 1: CẦN PHÊ DUYỆT (MÀN HÌNH CHÍNH THEO YÊU CẦU) */}
          {/* ======================================================== */}
          {activeMenu === "pending" && (
            <div className="space-y-6">
              {/* Header Box & Strict Filtering Banner */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-7">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                      Hồ Sơ Chờ Bạn Phê Duyệt
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                      Chỉ hiển thị các yêu cầu Chờ duyệt (Pending) đang gán cho bạn. Bản nháp và các cấp duyệt khác được bảo mật ẩn đi.
                    </p>
                  </div>

                  {/* Summary Badges */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>{totalPendingCount} hồ sơ đang chờ bạn</span>
                    </div>
                    {exceededCount > 0 && (
                      <div className="px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>{exceededCount} hồ sơ vượt dải lương</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Strict Rule Notice Pill */}
                <div className="mt-4 px-4 py-2.5 rounded-2xl bg-blue-50/60 border border-blue-100/80 flex items-center gap-2.5 text-xs text-blue-900">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    <strong>Quy tắc xét duyệt nghiêm ngặt:</strong> Bản nháp của người khác không hiển thị. Bạn chỉ thao tác được với hồ sơ đang ở đúng cấp duyệt của mình ({CURRENT_APPROVER.name}).
                  </span>
                </div>

                {/* TAB SWITCHER: 2 DANH SÁCH (Yêu cầu tuyển dụng vs Đề xuất Offer) */}
                <div className="pt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="inline-flex p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/60 max-w-fit">
                    <button
                      type="button"
                      onClick={() => setPendingTab("requisitions")}
                      className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                        pendingTab === "requisitions"
                          ? "bg-white text-slate-900 shadow-md shadow-slate-200/80"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Briefcase className="w-4 h-4 text-[#4285F4]" />
                      <span>Yêu cầu tuyển dụng</span>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          pendingTab === "requisitions"
                            ? "bg-blue-50 text-[#4285F4] font-bold"
                            : "bg-slate-200/80 text-slate-600"
                        }`}
                      >
                        {pendingRequisitionsCount}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPendingTab("offers")}
                      className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                        pendingTab === "offers"
                          ? "bg-white text-slate-900 shadow-md shadow-slate-200/80"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Award className="w-4 h-4 text-purple-600" />
                      <span>Đề xuất Offer</span>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          pendingTab === "offers"
                            ? "bg-purple-50 text-purple-700 font-bold"
                            : "bg-slate-200/80 text-slate-600"
                        }`}
                      >
                        {pendingOffersCount}
                      </span>
                    </button>
                  </div>

                  {/* Search and Budget Filter Bar */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative min-w-[240px] flex-1 sm:flex-initial">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Tìm theo vị trí, phòng ban, mã..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/20 focus:border-[#4285F4] transition-all"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={budgetFilter}
                        onChange={(e) => setBudgetFilter(e.target.value as "ALL" | "EXCEEDED" | "STANDARD")}
                        className="px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/20 cursor-pointer"
                      >
                        <option value="ALL">Mọi hạn mức ngân sách</option>
                        <option value="EXCEEDED">Cảnh báo: Vượt dải lương chuẩn</option>
                        <option value="STANDARD">Trong dải lương chuẩn</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* LIST VIEW (CARD-BASED) */}
              {pendingTab === "requisitions" ? (
                /* ---------------- TAB 1: YÊU CẦU TUYỂN DỤNG ---------------- */
                <div className="space-y-4">
                  {filteredRequisitions.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-xs">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#4285F4] flex items-center justify-center mx-auto mb-3">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <h3 className="text-base font-bold text-slate-800">
                        Không có yêu cầu tuyển dụng nào đang chờ bạn duyệt!
                      </h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                        Hệ thống đã lọc nghiêm ngặt: Các bản nháp hoặc hồ sơ đang ở cấp duyệt khác không xuất hiện tại đây.
                      </p>
                    </div>
                  ) : (
                    filteredRequisitions.map((item) => (
                      <div
                        key={item.id}
                        className={`bg-white rounded-3xl border transition-all duration-200 p-6 sm:p-7 shadow-[0_6px_25px_rgb(0,0,0,0.03)] hover:shadow-[0_12px_35px_rgb(0,0,0,0.06)] relative overflow-hidden ${
                          item.isExceeded
                            ? "border-amber-200 hover:border-amber-300"
                            : "border-gray-100 hover:border-blue-200"
                        }`}
                      >
                        {item.isExceeded && (
                          <div className="absolute top-0 right-0 px-4 py-1 bg-gradient-to-l from-amber-500 to-rose-500 text-white text-[11px] font-bold rounded-bl-2xl shadow-xs flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Vượt dải lương chuẩn +{item.exceededPercent}%</span>
                          </div>
                        )}

                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                          {/* Left Details */}
                          <div className="space-y-3.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                                {item.code}
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                                {item.level}
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-100">
                                Chỉ tiêu: {item.headcount} nhân sự
                              </span>

                              {/* Strict Status Badge */}
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                <span>Đang chờ bạn duyệt (Cấp {item.currentStepIndex + 1}/{item.steps.length})</span>
                              </span>

                              {/* SLA Badge */}
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                  item.isSlaUrgent
                                    ? "bg-rose-50 text-rose-700 border border-rose-200 font-bold"
                                    : "bg-slate-50 text-slate-600 border border-slate-200"
                                }`}
                              >
                                <Clock className="w-3.5 h-3.5" />
                                <span>{item.slaDeadline}</span>
                              </span>
                            </div>

                            {/* Position Title & Department */}
                            <div>
                              <h2
                                className="text-xl font-bold text-slate-900 tracking-tight hover:text-[#4285F4] transition-colors cursor-pointer"
                                onClick={() => handleOpenDetailModal(item)}
                              >
                                {item.title}
                              </h2>
                              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1.5">
                                <span className="flex items-center gap-1">
                                  <Building className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Phòng ban: <strong>{item.department}</strong></span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Đề xuất: <strong>{item.proposerName}</strong> ({item.proposerRole})</span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{item.createdAt}</span>
                                </span>
                              </div>
                            </div>

                            {/* CRITICAL HIGHLIGHT: Mức lương đề xuất vs Dải lương chuẩn */}
                            <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-gray-100 flex flex-wrap items-center gap-4 sm:gap-8">
                              <div>
                                <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                                  Lương đề xuất:
                                </span>
                                <span className={`text-base font-extrabold ${item.isExceeded ? "text-rose-600" : "text-slate-900"}`}>
                                  {formatVND(item.proposedSalary)}
                                </span>
                              </div>

                              <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

                              <div>
                                <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                                  Dải lương chuẩn phòng ban:
                                </span>
                                <span className="text-sm font-bold text-slate-700">
                                  {formatVND(item.minStandardSalary)} - {formatVND(item.maxStandardSalary)}
                                </span>
                              </div>

                              <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

                              <div>
                                <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                                  Đối chiếu hạn mức:
                                </span>
                                {item.isExceeded ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    <span>Vượt trần {(item.proposedSalary - item.maxStandardSalary) / 1000000}M (+{item.exceededPercent}%)</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Trong dải lương chuẩn</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Action Button */}
                          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-center gap-2.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenDetailModal(item)}
                              className="bg-[#4285F4] hover:bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-200 shadow-md shadow-blue-500/20 hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Xem chi tiết & Xử lý</span>
                            </button>
                            <span className="text-[11px] text-slate-400 text-center lg:text-right font-mono">
                              Cấp: {item.currentStepIndex + 1}/{item.steps.length}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                /* ---------------- TAB 2: ĐỀ XUẤT OFFER ---------------- */
                <div className="space-y-4">
                  {filteredOffers.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-xs">
                      <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <h3 className="text-base font-bold text-slate-800">
                        Không có đề xuất Offer nào đang chờ bạn duyệt!
                      </h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                        Hiện không có hồ sơ ứng viên nào gán trực tiếp cho bạn tại bước thẩm định dải lương.
                      </p>
                    </div>
                  ) : (
                    filteredOffers.map((item) => (
                      <div
                        key={item.id}
                        className={`bg-white rounded-3xl border transition-all duration-200 p-6 sm:p-7 shadow-[0_6px_25px_rgb(0,0,0,0.03)] hover:shadow-[0_12px_35px_rgb(0,0,0,0.06)] relative overflow-hidden ${
                          item.isExceeded
                            ? "border-amber-200 hover:border-amber-300"
                            : "border-gray-100 hover:border-purple-200"
                        }`}
                      >
                        {item.isExceeded && (
                          <div className="absolute top-0 right-0 px-4 py-1 bg-gradient-to-l from-amber-500 to-rose-500 text-white text-[11px] font-bold rounded-bl-2xl shadow-xs flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Offer vượt dải lương chuẩn +{item.exceededPercent}%</span>
                          </div>
                        )}

                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                          {/* Left Details */}
                          <div className="space-y-3.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                                {item.code}
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-100">
                                Ứng viên: <strong>{item.candidateName}</strong>
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                                Điểm: {item.interviewScore}
                              </span>

                              {/* Status Pulse */}
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                <span>Đang chờ bạn duyệt (Cấp {item.currentStepIndex + 1}/{item.steps.length})</span>
                              </span>

                              {/* SLA Badge */}
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                  item.isSlaUrgent
                                    ? "bg-rose-50 text-rose-700 border border-rose-200 font-bold"
                                    : "bg-slate-50 text-slate-600 border border-slate-200"
                                }`}
                              >
                                <Clock className="w-3.5 h-3.5" />
                                <span>{item.slaDeadline}</span>
                              </span>
                            </div>

                            {/* Position Title & Department */}
                            <div>
                              <h2
                                className="text-xl font-bold text-slate-900 tracking-tight hover:text-purple-600 transition-colors cursor-pointer"
                                onClick={() => handleOpenDetailModal(item)}
                              >
                                {item.title}
                              </h2>
                              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1.5">
                                <span className="flex items-center gap-1">
                                  <Building className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Phòng ban: <strong>{item.department}</strong></span>
                                </span>
                                <span className="flex items-center gap-1">
                                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                                  <span>HR đề xuất: <strong>{item.proposerName}</strong> ({item.proposerRole})</span>
                                </span>
                                <span className="flex items-center gap-1 font-mono">
                                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Thuộc Yêu cầu: {item.requisitionCode}</span>
                                </span>
                              </div>
                            </div>

                            {/* CRITICAL HIGHLIGHT: Mức lương Offer vs Dải lương chuẩn */}
                            <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-gray-100 flex flex-wrap items-center gap-4 sm:gap-8">
                              <div>
                                <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                                  Mức lương Offer đề xuất:
                                </span>
                                <span className={`text-base font-extrabold ${item.isExceeded ? "text-rose-600" : "text-slate-900"}`}>
                                  {formatVND(item.proposedSalary)} / tháng
                                </span>
                              </div>

                              <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

                              <div>
                                <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                                  Dải lương chuẩn phòng ban:
                                </span>
                                <span className="text-sm font-bold text-slate-700">
                                  {formatVND(item.minStandardSalary)} - {formatVND(item.maxStandardSalary)}
                                </span>
                              </div>

                              <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

                              <div>
                                <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                                  Chế độ & Thưởng:
                                </span>
                                <span className="text-xs font-bold text-slate-700">
                                  Thử việc {item.probationRate} {item.signOnBonus ? `• Bonus: ${formatVND(item.signOnBonus)}` : ""}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right Action Button */}
                          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-center gap-2.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenDetailModal(item)}
                              className="bg-[#4285F4] hover:bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-200 shadow-md shadow-blue-500/20 hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Xem chi tiết & Xử lý</span>
                            </button>
                            <span className="text-[11px] text-slate-400 text-center lg:text-right font-mono">
                              Cấp: {item.currentStepIndex + 1}/{item.steps.length}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: TỔNG QUAN (DASHBOARD KPI METRICS) */}
          {/* ======================================================== */}
          {activeMenu === "dashboard" && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-7">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Tổng Quan Hoạt Động Phê Duyệt
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Số liệu thống kê phê duyệt định biên, tỷ lệ tuân thủ SLA và kiểm toán thẩm tra
                </p>
              </div>

              {/* 4 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Hồ sơ gán cho bạn
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900">{totalPendingCount}</div>
                  <p className="text-xs text-slate-500 mt-2">
                    {pendingRequisitionsCount} yêu cầu • {pendingOffersCount} offer
                  </p>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Vượt dải lương chuẩn
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-rose-600">{exceededCount}</div>
                  <p className="text-xs text-rose-600 font-medium mt-2">
                    Cần giải trình & thẩm định kỹ
                  </p>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Đã xử lý (Lịch sử)
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-emerald-600">
                    {historyRecords.length}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    100% bảo toàn Audit Trail
                  </p>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Tỷ lệ đúng hạn SLA
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold text-purple-600">98.5%</div>
                  <p className="text-xs text-emerald-600 font-medium mt-2">
                    +2.1% so với quý trước
                  </p>
                </div>
              </div>

              {/* Action Banner to Pending Screen */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold">Bạn có {totalPendingCount} hồ sơ đang cần thẩm định & phê duyệt!</h3>
                  <p className="text-xs text-blue-100 mt-1 max-w-xl">
                    Đảm bảo tiến độ tuyển dụng không bị nghẽn (bottleneck) tại cấp Trưởng phòng Nhân sự. Xem danh sách chi tiết để ra quyết định ngay.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMenu("pending")}
                  className="bg-white text-blue-700 hover:bg-blue-50 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer shrink-0"
                >
                  Xử lý ngay
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: LỊCH SỬ PHÊ DUYỆT (AUDIT TRAIL LOGS) */}
          {/* ======================================================== */}
          {activeMenu === "history" && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-7">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                      Lịch Sử & Nhật Ký Phê Duyệt
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                      Nhật ký thẩm định chỉ đọc (Read-only Audit Trail) bảo toàn dữ liệu kiểm toán • Tuyệt đối không xóa/ghi đè
                    </p>
                  </div>

                  {/* Filter by decision */}
                  <div className="flex items-center gap-3">
                    <select
                      value={historyDecisionFilter}
                      onChange={(e) => setHistoryDecisionFilter(e.target.value as "ALL" | DecisionType)}
                      className="px-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/20 cursor-pointer"
                    >
                      <option value="ALL">Tất cả quyết định</option>
                      <option value="APPROVED">Đã phê duyệt</option>
                      <option value="NEEDS_REVISION">Yêu cầu bổ sung/Sửa</option>
                      <option value="REJECTED">Đã từ chối</option>
                    </select>
                  </div>
                </div>

                {/* Table View */}
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-4">Mã hồ sơ</th>
                        <th className="py-3 px-4">Vị trí / Hồ sơ</th>
                        <th className="py-3 px-4">Loại</th>
                        <th className="py-3 px-4">Quyết định của bạn</th>
                        <th className="py-3 px-4">Thời gian</th>
                        <th className="py-3 px-4">Lương đề xuất</th>
                        <th className="py-3 px-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                      {filteredHistory.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">
                            Không tìm thấy bản ghi lịch sử nào phù hợp.
                          </td>
                        </tr>
                      ) : (
                        filteredHistory.map((rec) => (
                          <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-4 px-4 font-mono font-bold text-xs text-slate-700">
                              {rec.itemCode}
                            </td>
                            <td className="py-4 px-4">
                              <div className="font-bold text-slate-900">{rec.itemTitle}</div>
                              <div className="text-xs text-slate-500">{rec.department}</div>
                              {rec.comment && (
                                <div className="mt-1 text-xs text-slate-600 italic bg-slate-50 p-1.5 rounded-lg border border-gray-100 line-clamp-1">
                                  &ldquo;{rec.comment}&rdquo;
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              {rec.itemType === "REQUISITION" ? (
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                  Yêu cầu tuyển
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                                  Đề xuất Offer
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              {rec.decision === "APPROVED" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Check className="w-3 h-3" /> Đã Phê duyệt
                                </span>
                              )}
                              {rec.decision === "NEEDS_REVISION" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <FileEdit className="w-3 h-3" /> Yêu cầu bổ sung
                                </span>
                              )}
                              {rec.decision === "REJECTED" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <X className="w-3 h-3" /> Đã Từ chối
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-xs text-slate-500 font-mono">
                              {rec.decisionAt}
                            </td>
                            <td className="py-4 px-4 font-semibold text-slate-800 text-xs">
                              {formatVND(rec.proposedSalary)}
                              {rec.isExceeded && (
                                <span className="block text-[10px] text-rose-600 font-bold">Vượt dải chuẩn</span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleOpenDetailModal(rec.dossierSnapshot, true)}
                                className="text-xs font-bold text-[#4285F4] hover:text-blue-700 hover:underline cursor-pointer"
                              >
                                Xem hồ sơ & Audit
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: CÀI ĐẶT CÁ NHÂN (SETTINGS & DELEGATION) */}
          {/* ======================================================== */}
          {activeMenu === "settings" && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-7">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Cài Đặt Cá Nhân & Phân Quyền Phê Duyệt
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                  Quản lý thông tin tài khoản người duyệt và chính sách thông báo khi có hồ sơ vượt khung lương
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Box */}
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-slate-800 border-b border-gray-100 pb-3 flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-[#4285F4]" />
                    <span>Thông tin Người phê duyệt</span>
                  </h3>

                  <div className="space-y-3 text-sm">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">Mã định danh (User ID)</label>
                      <input
                        type="text"
                        disabled
                        value={CURRENT_APPROVER.id}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-slate-800 font-mono text-sm cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">Họ và tên</label>
                      <input
                        type="text"
                        disabled
                        value={approverProfile.name}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-slate-800 font-medium text-sm cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">Email công vụ</label>
                      <input
                        type="text"
                        disabled
                        value={approverProfile.email}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-slate-800 font-mono text-sm cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">Chức danh / Vai trò</label>
                      <input
                        type="text"
                        disabled
                        value={approverProfile.role}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-slate-800 font-medium text-sm cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 block mb-1">Phòng ban quản lý</label>
                      <input
                        type="text"
                        disabled
                        value={approverProfile.department}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-slate-800 font-medium text-sm cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Delegation & SLA Alerts */}
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-slate-800 border-b border-gray-100 pb-3 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Chính sách Cảnh báo & Phê duyệt Nghiêm ngặt</span>
                  </h3>

                  <div className="space-y-4 text-sm">
                    <div className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-gray-100">
                      <div>
                        <div className="font-bold text-slate-800">Cảnh báo khẩn khi lương vượt dải chuẩn &gt; 15%</div>
                        <div className="text-xs text-slate-500 mt-0.5">Gửi email tức thời kèm bản giải trình ngân sách của bộ phận đề xuất.</div>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5 accent-[#4285F4] rounded-md mt-1 cursor-pointer" />
                    </div>

                    <div className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-gray-100">
                      <div>
                        <div className="font-bold text-slate-800">Chặn duyệt nhảy cấp (Strict Approval Order)</div>
                        <div className="text-xs text-slate-500 mt-0.5">Không cho phép duyệt khi cấp trước chưa hoàn tất thẩm định.</div>
                      </div>
                      <input type="checkbox" defaultChecked disabled className="w-5 h-5 accent-[#4285F4] rounded-md mt-1 cursor-not-allowed" />
                    </div>

                    <div className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-gray-100">
                      <div>
                        <div className="font-bold text-slate-800">Bắt buộc nhập ý kiến khi Từ chối hoặc Trả hồ sơ</div>
                        <div className="text-xs text-slate-500 mt-0.5">Tuân thủ tiêu chuẩn Audit Trail ISO/SOC2.</div>
                      </div>
                      <input type="checkbox" defaultChecked disabled className="w-5 h-5 accent-[#4285F4] rounded-md mt-1 cursor-not-allowed" />
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => showToast("Đã lưu thiết lập cấu hình thông báo & bảo mật thành công!")}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer"
                      >
                        Lưu thiết lập
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ======================================================== */}
      {/* 3. MODAL REVIEW CHI TIẾT & HÀNH ĐỘNG (MODAL LỚN MAX-W-4XL) */}
      {/* ======================================================== */}
      {isDetailModalOpen && selectedDossier && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDetailModalOpen(false);
          }}
        >
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh] my-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-gray-100 flex items-start justify-between bg-gradient-to-r from-slate-50 via-white to-blue-50/30">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                  selectedDossier.type === "REQUISITION" ? "bg-blue-50 text-[#4285F4]" : "bg-purple-50 text-purple-600"
                }`}>
                  {selectedDossier.type === "REQUISITION" ? (
                    <Briefcase className="w-6 h-6 stroke-[2.2]" />
                  ) : (
                    <Award className="w-6 h-6 stroke-[2.2]" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-white border border-gray-200 text-slate-700 shadow-xs">
                      {selectedDossier.code}
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                      {selectedDossier.title}
                    </h2>
                    {isHistoryViewMode ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        Bản ghi lịch sử (Read-only)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        Đang chờ bạn thẩm định (Cấp {selectedDossier.currentStepIndex + 1}/{selectedDossier.steps.length})
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Phòng ban: <strong>{selectedDossier.department}</strong> • Người đề xuất: {selectedDossier.proposerName} ({selectedDossier.proposerRole})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-3"
                title="Đóng modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-8 flex-1 bg-white">
              {/* NỬA TRÊN MODAL: THÔNG TIN CHI TIẾT & ĐỐI CHIẾU HẠN MỨC LƯƠNG */}
              <div className="space-y-6">
                {/* 1. KHỐI ĐỐI CHIẾU HẠN MỨC LƯƠNG & NGÂN SÁCH (CỰC KỲ QUAN TRỌNG) */}
                <div className={`p-5 rounded-2xl border ${
                  selectedDossier.isExceeded
                    ? "bg-rose-50/40 border-rose-200"
                    : "bg-emerald-50/40 border-emerald-200"
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-[#4285F4]" />
                      Bảng Đối Chiếu Hạn Mức Dải Lương & Ngân Sách Phòng Ban
                    </span>
                    {selectedDossier.isExceeded ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Vượt dải lương chuẩn +{selectedDossier.exceededPercent}%
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Tuân thủ dải lương chuẩn
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-xs text-slate-500 block">Mức lương đề xuất</span>
                      <span className={`text-lg font-extrabold ${selectedDossier.isExceeded ? "text-rose-600" : "text-slate-900"}`}>
                        {formatVND(selectedDossier.proposedSalary)}
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {selectedDossier.type === "OFFER" ? "Gross / tháng (chính thức)" : "Mức tuyển dụng tối đa"}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 block">Dải lương chuẩn vị trí (Grade/Band)</span>
                      <span className="text-base font-bold text-slate-800">
                        {formatVND(selectedDossier.minStandardSalary)} - {formatVND(selectedDossier.maxStandardSalary)}
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">Phân vị thị trường P50 - P75</span>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 block">Chênh lệch ngân sách</span>
                      {selectedDossier.isExceeded ? (
                        <span className="text-base font-extrabold text-rose-600 flex items-center gap-1">
                          +{(selectedDossier.proposedSalary - selectedDossier.maxStandardSalary) / 1000000} Triệu VNĐ
                        </span>
                      ) : (
                        <span className="text-base font-extrabold text-emerald-600 flex items-center gap-1">
                          Trong hạn mức chuẩn
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {selectedDossier.isExceeded ? "Cần Người duyệt thẩm tra giải trình" : "Tối ưu chi phí nhân sự"}
                      </span>
                    </div>
                  </div>

                  {/* LÝ DO GIẢI TRÌNH VƯỢT KHUNG HOẶC LÝ DO ĐỀ XUẤT */}
                  <div className="mt-3.5 p-3.5 rounded-xl bg-white/80 border border-gray-200/80">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                      <MessageSquareQuote className="w-4 h-4 text-[#4285F4]" />
                      <span>Giải trình của Người đề xuất ({selectedDossier.proposerName}):</span>
                    </div>
                    <p className="text-xs text-slate-600 italic leading-relaxed">
                      &ldquo;{selectedDossier.justification}&rdquo;
                    </p>
                  </div>
                </div>

                {/* 2. CHI TIẾT ĐẶC THÙ THEO LOẠI HỒ SƠ */}
                {selectedDossier.type === "REQUISITION" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-gray-100 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Mô tả công việc & Chỉ tiêu</h4>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {(selectedDossier as RequisitionItem).description}
                      </p>
                      <div className="text-xs font-semibold text-slate-600 pt-1">
                        Cấp bậc: <strong>{(selectedDossier as RequisitionItem).level}</strong> • Chỉ tiêu: <strong>{(selectedDossier as RequisitionItem).headcount} người</strong>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-gray-100 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Yêu cầu năng lực bắt buộc</h4>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {(selectedDossier as RequisitionItem).requirements}
                      </p>
                      <div className="text-xs font-semibold text-slate-600 pt-1">
                        Quỹ ngân sách: <strong>{(selectedDossier as RequisitionItem).budgetQuarter}</strong>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-gray-100 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Thông tin ứng viên</h4>
                      <div className="text-xs space-y-1 text-slate-700">
                        <div>Họ tên: <strong>{(selectedDossier as OfferItem).candidateName}</strong></div>
                        <div>Email: {(selectedDossier as OfferItem).candidateEmail} • SĐT: {(selectedDossier as OfferItem).candidatePhone}</div>
                        <div>Kinh nghiệm: {(selectedDossier as OfferItem).candidateExperience}</div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-gray-100 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Điều kiện Offer tuyển dụng</h4>
                      <div className="text-xs space-y-1 text-slate-700">
                        <div>Thử việc: <strong>{(selectedDossier as OfferItem).probationRate}</strong></div>
                        {(selectedDossier as OfferItem).signOnBonus ? (
                          <div>Thưởng gia nhập (Sign-on): <strong className="text-purple-600">{formatVND((selectedDossier as OfferItem).signOnBonus!)}</strong></div>
                        ) : null}
                        <div>Ngày nhận việc dự kiến: <strong>{(selectedDossier as OfferItem).workStartDate}</strong></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* NỬA DƯỚI MODAL: NHÚNG LẠI COMPONENT "CHUỖI CẤP DUYỆT & NHẬT KÝ THẨM ĐỊNH" */}
              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <span>Chuỗi Cấp Duyệt & Nhật Ký Thẩm Định (Audit Trail Timeline)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tiến trình xét duyệt đa cấp • Thấy rõ hồ sơ đã qua tay ai và hiện tại đang ở cấp nào
                    </p>
                  </div>
                  <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                    <Lock className="w-3 h-3 text-slate-500" />
                    Read-only Audit Log
                  </span>
                </div>

                {/* Nhúng component ApprovalWorkflowTimeline */}
                <div className="bg-slate-50/60 rounded-2xl p-4 sm:p-5 border border-gray-100">
                  <ApprovalWorkflowTimeline
                    steps={selectedDossier.steps}
                    auditHash={selectedDossier.auditHash}
                    lastAuditedAt={selectedDossier.lastAuditedAt}
                    bannerPosition="bottom"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer: CỤM 3 HÀNH ĐỘNG PHÊ DUYỆT THEO YÊU CẦU 2 */}
            <div className="px-6 py-4.5 sm:px-8 sm:py-5 bg-slate-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Thao tác phê duyệt sẽ lưu trữ vĩnh viễn vào Audit Log hệ thống.</span>
              </div>

              {isHistoryViewMode ? (
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all cursor-pointer shadow-sm"
                >
                  Đóng
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
                  {/* Nút 1: Yêu cầu bổ sung (Request Revision) - Nền vàng/cam */}
                  <button
                    type="button"
                    onClick={() => handleInitiateAction("NEEDS_REVISION")}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition-all cursor-pointer shadow-xs"
                  >
                    <FileEdit className="w-4 h-4" />
                    <span>Yêu cầu bổ sung</span>
                  </button>

                  {/* Nút 2: Từ chối (Reject) - Nền đỏ */}
                  <button
                    type="button"
                    onClick={() => handleInitiateAction("REJECTED")}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer shadow-md shadow-rose-500/20"
                  >
                    <X className="w-4 h-4" />
                    <span>Từ chối</span>
                  </button>

                  {/* Nút 3: Duyệt (Approve) - Nền xanh lá */}
                  <button
                    type="button"
                    onClick={() => handleInitiateAction("APPROVED")}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-md shadow-emerald-500/25 hover:shadow-lg"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Duyệt</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. POPUP NHẬP Ý KIẾN / FEEDBACK MODAL (ĐÈ LÊN TRÊN Z-60) */}
      {/* ======================================================== */}
      {isFeedbackModalOpen && selectedDossier && actionType && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFeedbackModalOpen(false);
          }}
        >
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Feedback Header */}
            <div className={`px-6 py-5 border-b flex items-start gap-3.5 ${
              actionType === "APPROVED"
                ? "bg-emerald-50/50 border-emerald-100"
                : actionType === "NEEDS_REVISION"
                ? "bg-amber-50/50 border-amber-100"
                : "bg-rose-50/50 border-rose-100"
            }`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                actionType === "APPROVED"
                  ? "bg-emerald-100 text-emerald-700"
                  : actionType === "NEEDS_REVISION"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-rose-100 text-rose-700"
              }`}>
                {actionType === "APPROVED" && <Check className="w-5 h-5 stroke-[2.5]" />}
                {actionType === "NEEDS_REVISION" && <FileEdit className="w-5 h-5" />}
                {actionType === "REJECTED" && <X className="w-5 h-5 stroke-[2.5]" />}
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {actionType === "APPROVED" && "Xác nhận Duyệt hồ sơ"}
                  {actionType === "NEEDS_REVISION" && "Yêu cầu Bổ sung thông tin / Sửa đổi"}
                  {actionType === "REJECTED" && "Xác nhận Từ chối hồ sơ"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hồ sơ: <strong>{selectedDossier.code}</strong> - {selectedDossier.title}
                </p>
              </div>
            </div>

            {/* Feedback Form Body */}
            <form onSubmit={handleConfirmAction}>
              <div className="p-6 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      {isCommentRequired
                        ? "Ý kiến / Lý do của bạn (* Bắt buộc):"
                        : "Ý kiến phê duyệt (Không bắt buộc):"}
                    </label>
                    {isCommentRequired && (
                      <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                        Bắt buộc nhập
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 mb-2">
                    {actionType === "APPROVED" &&
                      "Bạn có thể để lại lời dặn dò cho bộ phận nhân sự (VD: Đồng ý mức đề xuất, tiến hành gửi offer sớm)..."}
                    {actionType === "NEEDS_REVISION" &&
                      "Vui lòng chỉ rõ các điểm cần sửa về ngân sách, dải lương hoặc headcount. Hồ sơ sẽ được trả về cho người tạo."}
                    {actionType === "REJECTED" &&
                      "Vui lòng chỉ rõ căn cứ từ chối (VD: Vượt quá ngân sách quý cho phép, năng lực ứng viên chưa tương xứng)..."}
                  </p>

                  <textarea
                    rows={4}
                    value={feedbackComment}
                    onChange={(e) => {
                      setFeedbackComment(e.target.value);
                      if (feedbackError) setFeedbackError("");
                    }}
                    placeholder={
                      actionType === "APPROVED"
                        ? "Ví dụ: Đồng ý mức đề xuất, tiến hành các bước tiếp theo..."
                        : actionType === "NEEDS_REVISION"
                        ? "Vui lòng nhập rõ lý do, các điểm cần sửa về ngân sách, dải lương chuẩn... (*)"
                        : "Vui lòng nhập rõ lý do từ chối hồ sơ... (*)"
                    }
                    className={`w-full p-3.5 rounded-2xl border text-sm transition-all focus:outline-none resize-none ${
                      isCommentRequired && !feedbackComment.trim()
                        ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                        : actionType === "APPROVED"
                        ? "border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                        : actionType === "NEEDS_REVISION"
                        ? "border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                        : "border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                    }`}
                  />

                  {/* Báo lỗi chữ đỏ theo Yêu cầu 3 */}
                  {isCommentRequired && !feedbackComment.trim() && (
                    <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1 animate-in fade-in duration-200">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>(*) Bắt buộc nhập ý kiến khi chọn Từ chối hoặc Yêu cầu bổ sung.</span>
                    </p>
                  )}
                  {feedbackError && feedbackComment.trim() && (
                    <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{feedbackError}</span>
                    </p>
                  )}
                </div>

                {/* Audit Security note */}
                <div className="p-3 rounded-xl bg-slate-50 border border-gray-100 text-[11px] text-slate-500 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    Ý kiến này sẽ được niêm phong vào lịch sử phê duyệt không thể thu hồi theo chuẩn ISO/SOC2.
                  </span>
                </div>
              </div>

              {/* Feedback Footer: Disable nút Xác nhận nếu bỏ trống ô ý kiến bắt buộc */}
              <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFeedbackModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl border border-gray-200 bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className={`px-6 py-2.5 rounded-2xl text-white text-sm font-bold transition-all shadow-md flex items-center gap-1.5 ${
                    isSubmitDisabled
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                      : actionType === "APPROVED"
                      ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25 cursor-pointer"
                      : actionType === "NEEDS_REVISION"
                      ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/25 cursor-pointer"
                      : "bg-rose-600 hover:bg-rose-700 shadow-rose-500/25 cursor-pointer"
                  }`}
                  title={isSubmitDisabled ? "Vui lòng nhập ý kiến trước khi xác nhận" : "Xác nhận gửi"}
                >
                  <Send className="w-4 h-4" />
                  <span>Xác nhận gửi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL QUẢN LÝ HỒ SƠ CÁ NHÂN & ĐỔI MẬT KHẨU (REUSABLE USER PROFILE MODAL) */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userRole="Người phê duyệt (Approver)"
        initialTab={profileModalTab}
        initialData={{
          employeeCode: approverProfile.id,
          name: approverProfile.name,
          email: approverProfile.email,
          role: approverProfile.role,
          department: approverProfile.department,
          phone: approverProfile.phone,
          avatarUrl: approverProfile.avatarUrl,
          bio: approverProfile.bio,
          gender: "Nam",
          dateOfBirth: "1988-10-20",
        }}
        onSaveProfile={(updated) => {
          setApproverProfile((prev) => ({
            ...prev,
            name: updated.name,
            phone: updated.phone,
            avatarUrl: updated.avatarUrl || prev.avatarUrl,
            bio: updated.bio || prev.bio,
            department: updated.department || prev.department,
          }));
          showToast("Đã cập nhật thông tin hồ sơ Người duyệt thành công!");
        }}
        onAvatarChange={handleAvatarCropComplete}
        onChangePassword={async () => {
          await new Promise((resolve) => setTimeout(resolve, 600));
          showToast("Đổi mật khẩu Người duyệt thành công! Mật khẩu mới đã được lưu.");
        }}
      />

      {/* MODAL CẮT ẢNH CHO HEADER UPLOAD NHANH */}
      <AvatarCropModal
        isOpen={isAvatarCropOpen}
        imageSrc={selectedRawAvatar}
        onClose={() => {
          setIsAvatarCropOpen(false);
          setSelectedRawAvatar(null);
          if (avatarInputRef.current) avatarInputRef.current.value = "";
        }}
        onCropSave={handleAvatarCropComplete}
      />
    </div>
  );
}
