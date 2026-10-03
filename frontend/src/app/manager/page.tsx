"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Copy,
  Search,
  Filter,
  Eye,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronRight,
  Bell,
  LogOut,
  User as UserIcon,
  Mail,
  Building,
  DollarSign,
  Calendar,
  AlertCircle,
  FileText,
  Check,
  X,
  Camera,
  Star,
  Sparkles,
  ArrowUpRight,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  UserCheck,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  AlertTriangle,
  Info,
  Send,
  LayoutGrid,
  Table as TableIcon,
  ShieldCheck,
  Lock,
  Circle,
  GitBranch,
  History,
  Hash,
  LayoutDashboard,
  Settings,
  FileEdit,
  FileClock,
  Video,
  MapPin,
  Award,
  ExternalLink,
  FileCheck
} from "lucide-react";
import { UserProfileModal } from "@/components/UserProfileModal";
import { AvatarCropModal } from "@/components/AvatarCropModal";
import { ApprovalWorkflowTimeline } from "@/components/ApprovalWorkflowTimeline";
import { CroppedAvatarResult } from "@/lib/cropImage";

// Types
export interface JobRequisition {
  id: string;
  title: string;
  department: string;
  level: "Junior" | "Middle" | "Senior" | "Lead" | "Manager";
  targetCount: number; // Chỉ tiêu tuyển dụng
  receivedCount: number; // Đã nộp CV
  interviewingCount: number; // Đang phỏng vấn
  hiredCount: number; // Đã chốt offer
  status: "Draft" | "Pending" | "Active" | "Closed";
  salaryRange: string;
  createdAt: string;
  deadline: string;
  description?: string;
  requirements?: string;
  workType?: string;
  proposedSalary?: number;
  salaryJustification?: string;
  recruitmentReason?: string;
  recruitmentReasonDetail?: string;
}

export interface ShortlistCandidate {
  id: string;
  name: string;
  avatarColor: string;
  email: string;
  phone: string;
  positionId: string;
  positionTitle: string;
  experienceYears: number;
  appliedDate: string;
  round1: {
    interviewer: string;
    score: number; // Max 10
    comment: string;
    status: "Passed" | "Failed";
  };
  round2: {
    interviewer: string;
    score: number; // Max 10
    stars?: number; // Điểm trung bình dạng sao (ví dụ: 4.5/5 sao)
    comment: string;
    status: "Passed" | "Failed";
  };
  overallAssessment: string;
  proposedSalary: string;
  decision: "Pending" | "Hired" | "Rejected";
  decisionNote?: string;
  decidedAt?: string;
}

// Approval Workflow & Audit Trail Types
export interface ApprovalStep {
  id: string;
  stepNumber: number;
  stepName: string;
  approverName: string;
  approverRole: string;
  department: string;
  status: "APPROVED" | "PENDING" | "NOT_REACHED" | "REJECTED";
  timestamp: string; // Chi tiết ngày, giờ (ví dụ: "01/10/2026 - 14:30") hoặc "Đang chờ xử lý..."
  comment: string; // Ý kiến của người duyệt
  slaHours?: number;
}

export interface ApprovalWorkflowRecord {
  id: string;
  itemCode: string; // REQ-2026-001 hoặc OFFER-CAN-001
  itemType: "REQUISITION" | "OFFER";
  itemTitle: string;
  department: string;
  creator: string;
  createdAt: string;
  overallStatus: "APPROVED" | "IN_PROGRESS" | "DRAFT" | "REJECTED";
  auditHash: string; // Mã băm bảo toàn nhật ký kiểm toán (SHA-256)
  lastAuditedAt: string;
  steps: ApprovalStep[];
}

// Initial Mock Data: Approval Workflows & Audit Trails
const MOCK_APPROVAL_WORKFLOWS: Record<string, ApprovalWorkflowRecord> = {
  "REQ-2026-001": {
    id: "WF-REQ-001",
    itemCode: "REQ-2026-001",
    itemType: "REQUISITION",
    itemTitle: "Lập trình viên Frontend (React/Next.js)",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    creator: "Lê Trưởng Nhóm",
    createdAt: "10/01/2026 - 09:15",
    overallStatus: "APPROVED",
    auditHash: "sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    lastAuditedAt: "12/01/2026 - 16:05",
    steps: [
      {
        id: "STP-01",
        stepNumber: 1,
        stepName: "Cấp 1: Khởi tạo & Đề xuất Nhu cầu Tuyển dụng",
        approverName: "Lê Trưởng Nhóm",
        approverRole: "Trưởng Bộ Phận (Hiring Manager)",
        department: "Khối Công Nghệ",
        status: "APPROVED",
        timestamp: "10/01/2026 - 09:15",
        comment:
          "Kế hoạch sprint 2026 mở rộng module Core Platform, cần bổ sung 5 nhân sự Senior FE có kinh nghiệm Next.js. Đã đính kèm bản mô tả công việc (JD) và chỉ tiêu tuyển dụng rõ ràng.",
      },
      {
        id: "STP-02",
        stepNumber: 2,
        stepName: "Cấp 2: Thẩm định Định biên & Ngân sách Headcount",
        approverName: "Nguyễn Thị Thu Hà",
        approverRole: "Trưởng phòng Nhân sự",
        department: "Phòng Quản Trị Nhân Sự (HR)",
        status: "APPROVED",
        timestamp: "03/10/2026 - 14:30",
        comment:
          "Đồng ý tuyển, ngân sách hợp lệ. Mức lương 28 - 38 triệu nằm đúng khung dải lương quy chế ban hành của Khối Công nghệ.",
      },
      {
        id: "STP-03",
        stepNumber: 3,
        stepName: "Cấp 3: Phê duyệt Tài chính & Quỹ lương Dự toán",
        approverName: "Trần Đức Thắng",
        approverRole: "Giám đốc Tài chính (CFO)",
        department: "Khối Tài Chính - Kế Toán",
        status: "APPROVED",
        timestamp: "11/01/2026 - 11:20",
        comment:
          "Ngân sách quỹ lương Q1/2026 của Khối Công nghệ đáp ứng được định mức. Đã cấp mã ngân sách dự toán #BUD-IT-2026.",
      },
      {
        id: "STP-04",
        stepNumber: 4,
        stepName: "Cấp 4: Phê duyệt Ký ban hành Đăng tuyển",
        approverName: "Phạm Hoàng Nam",
        approverRole: "Tổng Giám Đốc (CEO)",
        department: "Ban Giám Đốc (BOD)",
        status: "APPROVED",
        timestamp: "12/01/2026 - 16:05",
        comment:
          "Phê duyệt triển khai đăng tuyển công khai nội bộ và đối ngoại. Ưu tiên tuyển dụng nguồn lực chất lượng cao, đúng tiến độ cam kết.",
      },
    ],
  },
  "REQ-2026-002": {
    id: "WF-REQ-002",
    itemCode: "REQ-2026-002",
    itemType: "REQUISITION",
    itemTitle: "Chuyên viên Marketing & Truyền thông Nội bộ",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    creator: "Lê Trưởng Nhóm",
    createdAt: "08/01/2026 - 08:30",
    overallStatus: "IN_PROGRESS",
    auditHash: "sha256:3b9ac93e81f14a6e8b2a1a4574944b20a3a93a67710c228ec53298a0d92f58ab",
    lastAuditedAt: "08/01/2026 - 08:30",
    steps: [
      {
        id: "STP-21",
        stepNumber: 1,
        stepName: "Cấp 1: Khởi tạo & Đề xuất Nhu cầu Tuyển dụng",
        approverName: "Lê Trưởng Nhóm",
        approverRole: "Trưởng Bộ Phận (Hiring Manager)",
        department: "Khối Công Nghệ",
        status: "APPROVED",
        timestamp: "08/01/2026 - 08:30",
        comment:
          "Đề xuất mở tuyển 2 chuyên viên truyền thông nội bộ hỗ trợ chuyển đổi số văn hóa doanh nghiệp và chiến dịch thu hút nhân tài.",
      },
      {
        id: "STP-22",
        stepNumber: 2,
        stepName: "Cấp 2: Thẩm định Định biên & Ngân sách Headcount",
        approverName: "Nguyễn Thị Thu Hà",
        approverRole: "Trưởng phòng Nhân sự",
        department: "Phòng Quản Trị Nhân Sự (HR)",
        status: "PENDING",
        timestamp: "Đang chờ xử lý...",
        comment:
          "Đang đối soát định biên nhân sự bộ phận truyền thông và rà soát lại KPI định lượng với Trưởng khối trước khi xác nhận.",
      },
      {
        id: "STP-23",
        stepNumber: 3,
        stepName: "Cấp 3: Phê duyệt Tài chính & Quỹ lương Dự toán",
        approverName: "Trần Đức Thắng",
        approverRole: "Giám đốc Tài chính (CFO)",
        department: "Khối Tài Chính - Kế Toán",
        status: "NOT_REACHED",
        timestamp: "Chưa đến lượt xử lý",
        comment:
          "Chờ phê duyệt từ Trưởng phòng Nhân sự trước khi thẩm định quỹ lương.",
      },
      {
        id: "STP-24",
        stepNumber: 4,
        stepName: "Cấp 4: Phê duyệt Ký ban hành Đăng tuyển",
        approverName: "Phạm Hoàng Nam",
        approverRole: "Tổng Giám Đốc (CEO)",
        department: "Ban Giám Đốc (BOD)",
        status: "NOT_REACHED",
        timestamp: "Chưa đến lượt xử lý",
        comment:
          "Chờ phê duyệt từ các cấp chuyên môn.",
      },
    ],
  },
  "REQ-2026-003": {
    id: "WF-REQ-003",
    itemCode: "REQ-2026-003",
    itemType: "REQUISITION",
    itemTitle: "Senior Backend Engineer (Golang/Python)",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    creator: "Lê Trưởng Nhóm",
    createdAt: "15/01/2026 - 10:00",
    overallStatus: "APPROVED",
    auditHash: "sha256:1a84f33b1e779ac9a8c1f045239a58432a93b4827018c18ec53298a0d92f5901",
    lastAuditedAt: "17/01/2026 - 09:30",
    steps: [
      {
        id: "STP-31",
        stepNumber: 1,
        stepName: "Cấp 1: Khởi tạo & Đề xuất Nhu cầu Tuyển dụng",
        approverName: "Lê Trưởng Nhóm",
        approverRole: "Trưởng Bộ Phận (Hiring Manager)",
        department: "Khối Công Nghệ",
        status: "APPROVED",
        timestamp: "15/01/2026 - 10:00",
        comment:
          "Bổ sung 3 vị trí Senior Backend phục vụ kiến trúc Microservices và dự án Data Lake nội bộ. Yêu cầu chuyên môn cao về Golang.",
      },
      {
        id: "STP-32",
        stepNumber: 2,
        stepName: "Cấp 2: Thẩm định Định biên & Ngân sách Headcount",
        approverName: "Nguyễn Thị Thu Hà",
        approverRole: "Trưởng phòng Nhân sự",
        department: "Phòng Quản Trị Nhân Sự (HR)",
        status: "APPROVED",
        timestamp: "15/01/2026 - 16:20",
        comment:
          "Đồng ý chỉ tiêu và dải lương 30 - 45 triệu, đã phê duyệt mô tả công việc (JD) tiêu chuẩn.",
      },
      {
        id: "STP-33",
        stepNumber: 3,
        stepName: "Cấp 3: Phê duyệt Tài chính & Quỹ lương Dự toán",
        approverName: "Trần Đức Thắng",
        approverRole: "Giám đốc Tài chính (CFO)",
        department: "Khối Tài Chính - Kế Toán",
        status: "APPROVED",
        timestamp: "16/01/2026 - 14:10",
        comment:
          "Đã phê duyệt nguồn kinh phí tuyển dụng và dự phòng ngân sách lương.",
      },
      {
        id: "STP-34",
        stepNumber: 4,
        stepName: "Cấp 4: Phê duyệt Ký ban hành Đăng tuyển",
        approverName: "Phạm Hoàng Nam",
        approverRole: "Tổng Giám Đốc (CEO)",
        department: "Ban Giám Đốc (BOD)",
        status: "APPROVED",
        timestamp: "17/01/2026 - 09:30",
        comment:
          "Đã duyệt mở tuyển công khai.",
      },
    ],
  },
  "CAN-001": {
    id: "WF-OFFER-001",
    itemCode: "OFFER-CAN-001",
    itemType: "OFFER",
    itemTitle: "Đề xuất Tuyển dụng (Offer): Trần Minh Quang",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    creator: "Lê Trưởng Nhóm",
    createdAt: "25/01/2026 - 10:15",
    overallStatus: "IN_PROGRESS",
    auditHash: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    lastAuditedAt: "25/01/2026 - 15:40",
    steps: [
      {
        id: "STP-O1",
        stepNumber: 1,
        stepName: "Cấp 1: Đề xuất Quyết định Tuyển & Mức lương (Hiring Manager)",
        approverName: "Lê Trưởng Nhóm",
        approverRole: "Trưởng Bộ Phận (Hiring Manager)",
        department: "Khối Công Nghệ",
        status: "APPROVED",
        timestamp: "25/01/2026 - 10:15",
        comment:
          "Ứng viên thể hiện xuất sắc ở vòng phỏng vấn chuyên môn (4.5/5 sao), tư duy giải quyết bài toán UI/UX tối ưu. Đề xuất tuyển với mức lương 34.000.000 VNĐ/tháng.",
      },
      {
        id: "STP-O2",
        stepNumber: 2,
        stepName: "Cấp 2: Thẩm định Đãi ngộ & Khung chính sách Phúc lợi (C&B)",
        approverName: "Vũ Thùy Linh",
        approverRole: "Trưởng nhóm Đãi ngộ & Phúc lợi (C&B)",
        department: "Phòng Quản Trị Nhân Sự (HR)",
        status: "APPROVED",
        timestamp: "25/01/2026 - 15:40",
        comment:
          "Mức lương 34 triệu hoàn toàn phù hợp với 4 năm kinh nghiệm và nằm trong ngân sách phê duyệt của vị trí REQ-2026-001. Đã soạn thảo dự thảo hợp đồng và các gói bảo hiểm sức khỏe cao cấp.",
      },
      {
        id: "STP-O3",
        stepNumber: 3,
        stepName: "Cấp 3: Duyệt Thư mời Nhận việc (HR Director)",
        approverName: "Nguyễn Thị Thu Hà",
        approverRole: "Trưởng phòng Nhân sự",
        department: "Phòng Quản Trị Nhân Sự (HR)",
        status: "PENDING",
        timestamp: "Đang chờ xử lý...",
        comment:
          "Đang kiểm tra lịch tiếp nhận bàn giao và đối chiếu tham chiếu (Reference Check) trước khi phát hành thư mời chính thức.",
      },
      {
        id: "STP-O4",
        stepNumber: 4,
        stepName: "Cấp 4: Phê duyệt Ban Giám Đốc & Ký phát hành Thư mời (BOD)",
        approverName: "Phạm Hoàng Nam",
        approverRole: "Tổng Giám Đốc (CEO)",
        department: "Ban Giám Đốc (BOD)",
        status: "NOT_REACHED",
        timestamp: "Chưa đến lượt xử lý",
        comment:
          "Chờ hoàn tất xác nhận từ Trưởng phòng Nhân sự để trình ký phát hành thư mời nhận việc (Offer Letter).",
      },
    ],
  },
  "CAN-004": {
    id: "WF-OFFER-004",
    itemCode: "OFFER-CAN-004",
    itemType: "OFFER",
    itemTitle: "Đề xuất Tuyển dụng (Offer): Lê Hoàng Long",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    creator: "Lê Trưởng Nhóm",
    createdAt: "28/01/2026 - 09:00",
    overallStatus: "IN_PROGRESS",
    auditHash: "sha256:d41d8cd98f00b204e9800998ecf8427e02d4b1fa3d677284addd200126d9069",
    lastAuditedAt: "28/01/2026 - 09:00",
    steps: [
      {
        id: "STP-O41",
        stepNumber: 1,
        stepName: "Cấp 1: Đề xuất Quyết định Tuyển & Mức lương (Hiring Manager)",
        approverName: "Lê Trưởng Nhóm",
        approverRole: "Trưởng Bộ Phận (Hiring Manager)",
        department: "Khối Công Nghệ",
        status: "APPROVED",
        timestamp: "28/01/2026 - 09:00",
        comment:
          "Ứng viên có kỹ năng Golang/Python vững, kinh nghiệm xử lý tải lớn 100k CCU. Đề xuất mức lương 42.000.000 VNĐ.",
      },
      {
        id: "STP-O42",
        stepNumber: 2,
        stepName: "Cấp 2: Thẩm định Đãi ngộ & Khung chính sách Phúc lợi (C&B)",
        approverName: "Vũ Thùy Linh",
        approverRole: "Trưởng nhóm C&B",
        department: "Phòng Quản Trị Nhân Sự (HR)",
        status: "PENDING",
        timestamp: "Đang chờ xử lý...",
        comment:
          "Mức lương 42 triệu vượt mức trần tiêu chuẩn (30 triệu), đang kiểm tra bản giải trình lương đặc cách đính kèm từ Hiring Manager.",
      },
      {
        id: "STP-O43",
        stepNumber: 3,
        stepName: "Cấp 3: Duyệt Thư mời Nhận việc (HR Director)",
        approverName: "Nguyễn Thị Thu Hà",
        approverRole: "Trưởng phòng Nhân sự",
        department: "Phòng Quản Trị Nhân Sự (HR)",
        status: "NOT_REACHED",
        timestamp: "Chưa đến lượt xử lý",
        comment:
          "Chờ ý kiến C&B về quỹ lương đặc cách.",
      },
      {
        id: "STP-O44",
        stepNumber: 4,
        stepName: "Cấp 4: Phê duyệt Ban Giám Đốc & Ký phát hành Thư mời (BOD)",
        approverName: "Phạm Hoàng Nam",
        approverRole: "Tổng Giám Đốc (CEO)",
        department: "Ban Giám Đốc (BOD)",
        status: "NOT_REACHED",
        timestamp: "Chưa đến lượt xử lý",
        comment:
          "Chờ thẩm định từ các bộ phận.",
      },
    ],
  },
};

// Initial Mock Data: Requisitions
const INITIAL_REQUISITIONS: JobRequisition[] = [
  {
    id: "REQ-2026-001",
    title: "Lập trình viên Frontend (React/Next.js)",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    level: "Senior",
    targetCount: 5, // Chỉ tiêu: Cần tuyển 5
    receivedCount: 20, // Đã nộp CV: 20
    interviewingCount: 8, // Đang phỏng vấn: 8
    hiredCount: 2, // Đã chốt: 2
    status: "Active",
    salaryRange: "28 - 38 triệu VNĐ",
    createdAt: "10/01/2026",
    deadline: "15/02/2026",
    description: "Chịu trách nhiệm kiến trúc Frontend, xây dựng hệ thống UI Design System và tối ưu hiệu năng web nội bộ.",
    requirements: "Tối thiểu 3 năm kinh nghiệm React, TypeScript, Tailwind CSS, có kinh nghiệm Next.js App Router.",
  },
  {
    id: "REQ-2026-002",
    title: "Chuyên viên Marketing & Truyền thông Nội bộ",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    level: "Middle",
    targetCount: 2,
    receivedCount: 14,
    interviewingCount: 5,
    hiredCount: 1,
    status: "Active",
    salaryRange: "18 - 25 triệu VNĐ",
    createdAt: "15/01/2026",
    deadline: "20/02/2026",
    description: "Lên chiến dịch truyền thông tuyển dụng nội bộ, xây dựng thương hiệu tuyển dụng kỹ thuật (Tech Branding).",
    requirements: "Tối thiểu 2 năm kinh nghiệm Tech Marketing, thành thạo content & tổ chức Tech Talk.",
  },
  {
    id: "REQ-2026-003",
    title: "Senior Backend Engineer (Golang/Python)",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    level: "Senior",
    targetCount: 4,
    receivedCount: 28,
    interviewingCount: 10,
    hiredCount: 3,
    status: "Active",
    salaryRange: "35 - 50 triệu VNĐ",
    createdAt: "18/01/2026",
    deadline: "28/02/2026",
    description: "Phát triển hệ thống microservices phục vụ tuyển dụng, xử lý dữ liệu lớn và bảo mật phân quyền.",
    requirements: "Thành thạo Golang hoặc Python FastAPI, hiểu sâu SQL, Redis, Docker, Kubernetes.",
  },
  {
    id: "REQ-2026-004",
    title: "Chuyên viên Thiết Kế Trải Nghiệm (UI/UX Designer)",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    level: "Middle",
    targetCount: 1,
    receivedCount: 6,
    interviewingCount: 2,
    hiredCount: 0,
    status: "Pending",
    salaryRange: "20 - 28 triệu VNĐ",
    createdAt: "28/01/2026",
    deadline: "05/03/2026",
    description: "Thiết kế luồng trải nghiệm người dùng cho ứng dụng tuyển dụng nội bộ, chuẩn hóa Design System Figma.",
    requirements: "Có Portfolio chỉn chu, thành thạo Figma, Design Tokens, thấu hiểu tư duy người dùng sản phẩm B2B.",
  },
  {
    id: "REQ-2026-005",
    title: "QA Automation Engineer Lead",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    level: "Lead",
    targetCount: 1,
    receivedCount: 8,
    interviewingCount: 3,
    hiredCount: 1,
    status: "Closed",
    salaryRange: "32 - 42 triệu VNĐ",
    createdAt: "02/01/2026",
    deadline: "25/01/2026",
    description: "Xây dựng khung kiểm thử tự động toàn diện (CI/CD Test Automation Framework).",
    requirements: "Kinh nghiệm Playwright, Cypress, Selenium, tích hợp kiểm thử vào GitLab CI.",
    recruitmentReason: "Thay thế nhân sự nghỉ việc",
  },
  {
    id: "REQ-2026-006",
    title: "Kỹ sư Cầu nối Dự án Nhật Bản (BrSE)",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    level: "Senior",
    targetCount: 2,
    receivedCount: 0,
    interviewingCount: 0,
    hiredCount: 0,
    status: "Draft",
    salaryRange: "38.000.000 VNĐ",
    proposedSalary: 38000000,
    salaryJustification: "Vị trí đặc thù yêu cầu tiếng Nhật N2 chuyên ngành kỹ thuật và có năng lực phân tích kiến trúc phần mềm với đối tác Tokyo, mức lương thị trường dao động 35 - 45 triệu VNĐ.",
    workType: "Toàn thời gian (Full-time)",
    createdAt: "29/01/2026",
    deadline: "15/03/2026",
    description: "Cầu nối kỹ thuật giữa khách hàng đối tác Nhật Bản và team kỹ thuật nội bộ, phân tích tài liệu thiết kế nghiệp vụ.",
    requirements: "Tiếng Nhật N2 trở lên, tối thiểu 3 năm kinh nghiệm phát triển phần mềm và 1 năm kinh nghiệm BrSE.",
    recruitmentReason: "Phục vụ dự án mới",
    recruitmentReasonDetail: "Dự án chuyển đổi số ERP đối tác Tokyo ký kết Q1/2026",
  },
  {
    id: "REQ-2026-007",
    title: "Chuyên viên Kiểm Thử Hiệu Năng Hệ Thống (Performance QA)",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    level: "Middle",
    targetCount: 1,
    receivedCount: 0,
    interviewingCount: 0,
    hiredCount: 0,
    status: "Draft",
    salaryRange: "24.000.000 VNĐ",
    proposedSalary: 24000000,
    salaryJustification: "",
    workType: "Toàn thời gian (Full-time)",
    createdAt: "30/01/2026",
    deadline: "20/03/2026",
    description: "Thực hiện kiểm thử tải (Load/Stress testing) cho các đợt phát hành lớn của hệ thống tuyển dụng nội bộ.",
    requirements: "Sử dụng thành thạo JMeter hoặc k6, phân tích APM và phát hiện thắt cổ chai hệ thống.",
    recruitmentReason: "Bổ sung định biên",
    recruitmentReasonDetail: "Mở rộng team QA chịu tải dự án Q2/2026",
  },
];

// Initial Mock Data: Shortlist Candidates
const INITIAL_CANDIDATES: ShortlistCandidate[] = [
  {
    id: "CAN-001",
    name: "Trần Minh Quang",
    avatarColor: "bg-blue-600",
    email: "quang.tran@gmail.com",
    phone: "0903 112 334",
    positionId: "REQ-2026-001",
    positionTitle: "Lập trình viên Frontend (React/Next.js)",
    experienceYears: 4,
    appliedDate: "12/01/2026",
    round1: {
      interviewer: "Hoàng Long (Senior FE)",
      score: 8.5,
      comment: "Nắm vững React internals, tối ưu re-render và Component Life Cycle tốt. Code bài test thuật toán sáng sủa.",
      status: "Passed",
    },
    round2: {
      interviewer: "Lê Trưởng Nhóm",
      score: 9.0,
      stars: 4.5,
      comment: "Tư duy sản phẩm sắc bén, giao tiếp tự tin, có kinh nghiệm lead nhóm nhỏ 3 người. Rất phù hợp văn hóa team.",
      status: "Passed",
    },
    overallAssessment: "Ứng viên nổi bật nhất đợt tuyển này. Đề xuất mức lương 34 triệu/tháng, sẵn sàng onboard đầu tháng sau.",
    proposedSalary: "34.000.000 VNĐ",
    decision: "Pending",
  },
  {
    id: "CAN-002",
    name: "Nguyễn Hải Đăng",
    avatarColor: "bg-emerald-600",
    email: "haidang.dev@gmail.com",
    phone: "0918 554 221",
    positionId: "REQ-2026-001",
    positionTitle: "Lập trình viên Frontend (React/Next.js)",
    experienceYears: 3,
    appliedDate: "14/01/2026",
    round1: {
      interviewer: "Hoàng Long (Senior FE)",
      score: 8.0,
      comment: "Thành thạo Tailwind CSS và Next.js App Router. Kinh nghiệm về State Management Redux/Zustand vững.",
      status: "Passed",
    },
    round2: {
      interviewer: "Lê Trưởng Nhóm",
      score: 7.5,
      stars: 3.8,
      comment: "Kỹ năng mềm tốt, cầu tiến. Tuy nhiên chưa có nhiều kinh nghiệm xử lý bài toán Web Vitals quy mô lớn.",
      status: "Passed",
    },
    overallAssessment: "Phù hợp vị trí Middle-Strong Frontend. Dự phòng tốt nếu ứng viên hàng đầu từ chối offer.",
    proposedSalary: "29.000.000 VNĐ",
    decision: "Pending",
  },
  {
    id: "CAN-006",
    name: "Bùi Thị Mai Anh",
    avatarColor: "bg-teal-600",
    email: "maianh.fe@gmail.com",
    phone: "0938 776 543",
    positionId: "REQ-2026-001",
    positionTitle: "Lập trình viên Frontend (React/Next.js)",
    experienceYears: 5,
    appliedDate: "16/01/2026",
    round1: {
      interviewer: "Hoàng Long (Senior FE)",
      score: 9.0,
      comment: "Kiến trúc CSS vững vàng, am hiểu sâu Design System, Webpack, Turbopack và CI/CD.",
      status: "Passed",
    },
    round2: {
      interviewer: "Lê Trưởng Nhóm",
      score: 9.5,
      stars: 4.8,
      comment: "Kỹ năng chuyên môn xuất sắc, tư duy kiến trúc hệ thống rõ ràng, nhiệt huyết và có tinh thần mentor tốt.",
      status: "Passed",
    },
    overallAssessment: "Ứng viên Senior toàn diện, tư duy giải pháp thực tế và đóng góp tích cực cho chuẩn hóa quy trình kỹ thuật.",
    proposedSalary: "36.000.000 VNĐ",
    decision: "Pending",
  },
  {
    id: "CAN-003",
    name: "Phạm Thùy Linh",
    avatarColor: "bg-purple-600",
    email: "linh.pham@yahoo.com",
    phone: "0977 443 219",
    positionId: "REQ-2026-002",
    positionTitle: "Chuyên viên Marketing & Truyền thông Nội bộ",
    experienceYears: 3,
    appliedDate: "18/01/2026",
    round1: {
      interviewer: "Thu Hà (HR Manager)",
      score: 9.0,
      comment: "Kỹ năng viết lách cuốn hút, có kinh nghiệm chạy chiến dịch tuyển dụng cho startup công nghệ kỳ lân.",
      status: "Passed",
    },
    round2: {
      interviewer: "Lê Trưởng Nhóm",
      score: 8.5,
      stars: 4.3,
      comment: "Hiểu rõ insight của kỹ sư công nghệ, thuyết trình kế hoạch quý 1 rất thuyết phục và sáng tạo.",
      status: "Passed",
    },
    overallAssessment: "Rất phù hợp để thúc đẩy phong trào Tech Branding cho phòng ban. Đề xuất tuyển ngay mức 22 triệu.",
    proposedSalary: "22.000.000 VNĐ",
    decision: "Hired",
    decisionNote: "Đã chốt tuyển mức 22.500.000 VNĐ, bắt đầu nhận việc từ ngày 15/02/2026.",
    decidedAt: "28/01/2026",
  },
  {
    id: "CAN-004",
    name: "Đỗ Quốc Bảo",
    avatarColor: "bg-amber-600",
    email: "baodo.cloud@gmail.com",
    phone: "0934 887 990",
    positionId: "REQ-2026-003",
    positionTitle: "Senior Backend Engineer (Golang/Python)",
    experienceYears: 5,
    appliedDate: "20/01/2026",
    round1: {
      interviewer: "Minh Quân (Tech Lead)",
      score: 8.5,
      comment: "Chuyên sâu kiến trúc vi dịch vụ Golang, am hiểu distributed locking và PostgreSQL query optimization.",
      status: "Passed",
    },
    round2: {
      interviewer: "Lê Trưởng Nhóm",
      score: 8.0,
      stars: 4.0,
      comment: "Thái độ làm việc chuyên nghiệp, chịu được áp lực cao. Đã từng làm việc với khối lượng tải 100k CCU.",
      status: "Passed",
    },
    overallAssessment: "Đáp ứng đầy đủ yêu cầu cho vị trí Senior Backend trọng điểm. Kỳ vọng mức lương 42 triệu.",
    proposedSalary: "42.000.000 VNĐ",
    decision: "Pending",
  },
  {
    id: "CAN-005",
    name: "Vũ Đình Trọng",
    avatarColor: "bg-rose-600",
    email: "trongvu.tech@gmail.com",
    phone: "0966 332 118",
    positionId: "REQ-2026-003",
    positionTitle: "Senior Backend Engineer (Golang/Python)",
    experienceYears: 4,
    appliedDate: "22/01/2026",
    round1: {
      interviewer: "Minh Quân (Tech Lead)",
      score: 7.0,
      comment: "Kỹ năng lập trình đạt chuẩn, tuy nhiên tư duy hệ thống phân tán còn hạn chế, chưa chủ động về CI/CD.",
      status: "Passed",
    },
    round2: {
      interviewer: "Lê Trưởng Nhóm",
      score: 6.5,
      stars: 3.3,
      comment: "Mục tiêu nghề nghiệp chưa tương thích với định hướng dự án dài hạn của công ty. Yêu cầu mức lương quá cao so với năng lực.",
      status: "Passed",
    },
    overallAssessment: "Chưa đạt kỳ vọng đối với cấp bậc Senior. Cần xem xét loại hoặc điều chỉnh sang ứng viên khác.",
    proposedSalary: "45.000.000 VNĐ",
    decision: "Rejected",
    decisionNote: "Chưa đáp ứng tiêu chuẩn chuyên môn cấp Senior và định hướng phát triển chung của phòng ban.",
    decidedAt: "27/01/2026",
  },
];

// =============================================================================
// INTERVIEW SCHEDULE TYPES & INITIAL MOCK DATA
// =============================================================================
export interface InterviewPanelMember {
  name: string;
  role: string;
  avatarColor: string;
  initials: string;
}

export interface InterviewSchedule {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  candidateAvatarColor: string;
  candidateExperience: string;
  candidateEducation: string;
  candidateSkills: string[];
  positionId: string;
  positionTitle: string;
  department: string;
  round: string;
  date: string; // YYYY-MM-DD
  dateLabel: string;
  time: string; // HH:mm - HH:mm
  type: "ONLINE" | "OFFLINE";
  locationOrPlatform: string;
  room?: string;
  meetingLink?: string;
  interviewers: InterviewPanelMember[];
  status: "UPCOMING" | "COMPLETED" | "CANCELLED";
  feedbackStatus?: "PENDING" | "SUBMITTED";
  score?: number;
  evalComment?: string;
  notes?: string;
}

const INITIAL_INTERVIEWS: InterviewSchedule[] = [
  {
    id: "INT-2026-001",
    candidateId: "CAN-004",
    candidateName: "Đỗ Quốc Bảo",
    candidateEmail: "baodo.cloud@gmail.com",
    candidatePhone: "0934 887 990",
    candidateAvatarColor: "bg-amber-600",
    candidateExperience: "5 năm kinh nghiệm High Concurrency Golang, PostgreSQL, Kafka",
    candidateEducation: "Đại học Bách Khoa Hà Nội - Kỹ sư CNTT",
    candidateSkills: ["Golang", "Python", "Microservices", "Docker", "PostgreSQL", "Kafka"],
    positionId: "REQ-2026-003",
    positionTitle: "Senior Backend Engineer (Golang/Python)",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    round: "Vòng 2: Phỏng vấn Chuyên môn & Kiến trúc",
    date: "2026-10-03",
    dateLabel: "Hôm nay, 03/10/2026",
    time: "09:00 - 10:00",
    type: "ONLINE",
    locationOrPlatform: "Microsoft Teams",
    meetingLink: "https://teams.microsoft.com/l/meetup-join/int001",
    interviewers: [
      { name: "Lê Trưởng Nhóm", role: "Hiring Manager", avatarColor: "bg-blue-600", initials: "LT" },
      { name: "Minh Quân", role: "Tech Lead", avatarColor: "bg-indigo-600", initials: "MQ" },
      { name: "Thu Hà", role: "Trưởng phòng HR", avatarColor: "bg-purple-600", initials: "TH" },
    ],
    status: "UPCOMING",
    feedbackStatus: "PENDING",
    notes: "Tập trung đánh giá kiến trúc Microservices và xử lý High Concurrency 100k CCU.",
  },
  {
    id: "INT-2026-002",
    candidateId: "CAN-001",
    candidateName: "Trần Minh Quang",
    candidateEmail: "quang.tran@gmail.com",
    candidatePhone: "0903 112 334",
    candidateAvatarColor: "bg-blue-600",
    candidateExperience: "4 năm kinh nghiệm Next.js, Redux, Tailwind CSS, TypeScript",
    candidateEducation: "Đại học Công Nghệ - ĐHQGHN",
    candidateSkills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Web Vitals"],
    positionId: "REQ-2026-001",
    positionTitle: "Lập trình viên Frontend (React/Next.js)",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    round: "Vòng 2: Phỏng vấn Đánh giá Năng lực Kỹ thuật",
    date: "2026-10-03",
    dateLabel: "Hôm nay, 03/10/2026",
    time: "14:30 - 15:30",
    type: "OFFLINE",
    locationOrPlatform: "Phòng họp Tokyo (Tầng 3)",
    room: "Phòng họp Tokyo (Tầng 3)",
    interviewers: [
      { name: "Lê Trưởng Nhóm", role: "Hiring Manager", avatarColor: "bg-blue-600", initials: "LT" },
      { name: "Hoàng Long", role: "Senior FE", avatarColor: "bg-emerald-600", initials: "HL" },
    ],
    status: "UPCOMING",
    feedbackStatus: "PENDING",
    notes: "Trao đổi về dự án thương mại điện tử trước đây và kiểm tra năng lực tối ưu hóa Core Web Vitals.",
  },
  {
    id: "INT-2026-003",
    candidateId: "CAN-006",
    candidateName: "Bùi Thị Mai Anh",
    candidateEmail: "maianh.bui@gmail.com",
    candidatePhone: "0945 667 889",
    candidateAvatarColor: "bg-rose-500",
    candidateExperience: "3.5 năm BrSE dự án ERP đối tác Tokyo, Chứng chỉ N2 (145/180)",
    candidateEducation: "Đại học Ngoại Ngữ & ĐH Bách Khoa",
    candidateSkills: ["Japanese N2", "System Design", "Bridge SE", "Agile/Scrum"],
    positionId: "REQ-2026-006",
    positionTitle: "Kỹ sư Cầu nối Dự án Nhật Bản (BrSE)",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    round: "Vòng 1: Đánh giá Ngoại ngữ N2 & Kỹ thuật",
    date: "2026-10-04",
    dateLabel: "Ngày mai, 04/10/2026",
    time: "10:00 - 11:00",
    type: "ONLINE",
    locationOrPlatform: "Microsoft Teams",
    meetingLink: "https://teams.microsoft.com/l/meetup-join/int003",
    interviewers: [
      { name: "Lê Trưởng Nhóm", role: "Hiring Manager", avatarColor: "bg-blue-600", initials: "LT" },
      { name: "Kenji Sato", role: "Technical Advisor", avatarColor: "bg-cyan-600", initials: "KS" },
      { name: "Mai Linh", role: "HR Tech Recruiter", avatarColor: "bg-pink-600", initials: "ML" },
    ],
    status: "UPCOMING",
    feedbackStatus: "PENDING",
    notes: "Phỏng vấn 50% thời lượng bằng tiếng Nhật chuyên ngành CNTT và kiểm tra năng lực dịch spec nghiệp vụ.",
  },
  {
    id: "INT-2026-004",
    candidateId: "CAN-007",
    candidateName: "Phạm Hoàng Nam",
    candidateEmail: "nam.pham.design@gmail.com",
    candidatePhone: "0978 223 445",
    candidateAvatarColor: "bg-teal-600",
    candidateExperience: "3 năm thiết kế B2B Enterprise Apps, Figma Design System, Usability Testing",
    candidateEducation: "Đại học Mỹ thuật Công nghiệp",
    candidateSkills: ["Figma", "Design Tokens", "Wireframing", "User Research"],
    positionId: "REQ-2026-004",
    positionTitle: "Chuyên viên Thiết Kế Trải Nghiệm (UI/UX Designer)",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    round: "Vòng 2: Thuyết trình Portfolio & Design Challenge",
    date: "2026-10-06",
    dateLabel: "Thứ Hai, 06/10/2026",
    time: "15:00 - 16:00",
    type: "OFFLINE",
    locationOrPlatform: "Phòng họp Osaka (Tầng 3)",
    room: "Phòng họp Osaka (Tầng 3)",
    interviewers: [
      { name: "Lê Trưởng Nhóm", role: "Hiring Manager", avatarColor: "bg-blue-600", initials: "LT" },
      { name: "Thúy Hạnh", role: "Lead UI/UX", avatarColor: "bg-amber-600", initials: "TH" },
    ],
    status: "UPCOMING",
    feedbackStatus: "PENDING",
    notes: "Ứng viên chuẩn bị bài thuyết trình 20 phút về bài test thiết kế luồng onboarding.",
  },
  {
    id: "INT-2026-005",
    candidateId: "CAN-002",
    candidateName: "Nguyễn Hải Đăng",
    candidateEmail: "haidang.dev@gmail.com",
    candidatePhone: "0918 554 221",
    candidateAvatarColor: "bg-emerald-600",
    candidateExperience: "3 năm kinh nghiệm React, Next.js, Redux Toolkit",
    candidateEducation: "Học viện Công nghệ Bưu chính Viễn thông",
    candidateSkills: ["React", "JavaScript", "TypeScript", "Tailwind CSS"],
    positionId: "REQ-2026-001",
    positionTitle: "Lập trình viên Frontend (React/Next.js)",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    round: "Vòng 2: Phỏng vấn Chuyên môn Trưởng Bộ Phận",
    date: "2026-10-01",
    dateLabel: "Thứ Năm, 01/10/2026",
    time: "14:00 - 15:00",
    type: "ONLINE",
    locationOrPlatform: "Microsoft Teams",
    meetingLink: "https://teams.microsoft.com/l/meetup-join/int005",
    interviewers: [
      { name: "Lê Trưởng Nhóm", role: "Hiring Manager", avatarColor: "bg-blue-600", initials: "LT" },
      { name: "Hoàng Long", role: "Senior FE", avatarColor: "bg-emerald-600", initials: "HL" },
    ],
    status: "COMPLETED",
    feedbackStatus: "SUBMITTED",
    score: 8.5,
    evalComment: "Kỹ năng nền tảng vững, giải quyết tình huống mượt mà. Đề xuất chuẩn bị offer.",
    notes: "Đã hoàn thành đánh giá xuất sắc.",
  },
  {
    id: "INT-2026-006",
    candidateId: "CAN-005",
    candidateName: "Vũ Đình Trọng",
    candidateEmail: "trongvu.tech@gmail.com",
    candidatePhone: "0966 332 118",
    candidateAvatarColor: "bg-rose-600",
    candidateExperience: "4 năm kinh nghiệm Backend Golang, Docker, MySQL",
    candidateEducation: "Đại học Bách Khoa Hà Nội",
    candidateSkills: ["Golang", "Docker", "MySQL", "Redis"],
    positionId: "REQ-2026-003",
    positionTitle: "Senior Backend Engineer (Golang/Python)",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    round: "Vòng 2: Phỏng vấn Kỹ thuật Chuyên sâu",
    date: "2026-09-29",
    dateLabel: "Thứ Ba, 29/09/2026",
    time: "09:30 - 10:30",
    type: "OFFLINE",
    locationOrPlatform: "Phòng họp Hà Nội (Tầng 2)",
    room: "Phòng họp Hà Nội (Tầng 2)",
    interviewers: [
      { name: "Lê Trưởng Nhóm", role: "Hiring Manager", avatarColor: "bg-blue-600", initials: "LT" },
      { name: "Minh Quân", role: "Tech Lead", avatarColor: "bg-indigo-600", initials: "MQ" },
    ],
    status: "COMPLETED",
    feedbackStatus: "SUBMITTED",
    score: 6.5,
    evalComment: "Chưa đạt kỳ vọng đối với cấp bậc Senior. Mục tiêu nghề nghiệp chưa tương thích định hướng dự án.",
    notes: "Đã gửi phản hồi từ chối cho HR.",
  },
  {
    id: "INT-2026-007",
    candidateId: "CAN-008",
    candidateName: "Lê Quốc Cường",
    candidateEmail: "cuong.le.qa@gmail.com",
    candidatePhone: "0908 776 554",
    candidateAvatarColor: "bg-purple-600",
    candidateExperience: "5 năm kinh nghiệm QA Automation Lead (Playwright, CI/CD)",
    candidateEducation: "Đại học FPT",
    candidateSkills: ["Playwright", "Cypress", "Selenium", "CI/CD", "Python"],
    positionId: "REQ-2026-005",
    positionTitle: "QA Automation Engineer Lead",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    round: "Vòng 1: Sơ loại Năng lực Tự động hóa",
    date: "2026-09-28",
    dateLabel: "Thứ Hai, 28/09/2026",
    time: "16:00 - 17:00",
    type: "ONLINE",
    locationOrPlatform: "Microsoft Teams",
    meetingLink: "https://teams.microsoft.com/l/meetup-join/int007",
    interviewers: [
      { name: "Lê Trưởng Nhóm", role: "Hiring Manager", avatarColor: "bg-blue-600", initials: "LT" },
      { name: "Thu Hà", role: "Trưởng phòng HR", avatarColor: "bg-purple-600", initials: "TH" },
    ],
    status: "CANCELLED",
    evalComment: "Ứng viên xin dời lịch vì lý do cá nhân đột xuất. HR đang sắp xếp lại lịch sau ngày 10/10.",
    notes: "Lịch đã hủy và chờ HR sắp xếp lại.",
  },
];

export default function HiringManagerDashboardPage() {
  const router = useRouter();

  // State: Requisitions & Shortlist Candidates
  const [requisitions, setRequisitions] = useState<JobRequisition[]>(INITIAL_REQUISITIONS);
  const [candidates, setCandidates] = useState<ShortlistCandidate[]>(INITIAL_CANDIDATES);

  // View modes
  const [reqViewMode, setReqViewMode] = useState<"cards" | "table">("cards");
  const [candidateViewMode, setCandidateViewMode] = useState<"table" | "grid">("table");

  // Active Sidebar Nav Menu
  const [activeNavMenu, setActiveNavMenu] = useState<
    "overview" | "requisitions" | "drafts" | "candidates" | "interviews" | "settings"
  >("overview");

  // Filters & Search
  const [reqSearch, setReqSearch] = useState("");
  const [reqStatusFilter, setReqStatusFilter] = useState<string>("ALL");

  const [candidateSearch, setCandidateSearch] = useState("");
  const [candidatePosFilter, setCandidatePosFilter] = useState<string>("ALL");
  const [candidateDecisionFilter, setCandidateDecisionFilter] = useState<string>("ALL");

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Profile State
  const [managerProfile, setManagerProfile] = useState({
    name: "Lê Trưởng Nhóm",
    email: "truongbophan@company.com",
    phone: "0912 345 678",
    role: "Trưởng Bộ Phận (Hiring Manager)",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    avatarUrl: "",
    bio: "Chịu trách nhiệm hoạch định nhu cầu tuyển dụng, phỏng vấn chuyên môn và ra quyết định nhân sự then chốt cho khối Công nghệ.",
  });

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<"profile" | "security">("profile");
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [selectedRawAvatar, setSelectedRawAvatar] = useState<string | null>(null);
  const [isAvatarCropOpen, setIsAvatarCropOpen] = useState(false);

  // Modals State
  const [isCreateReqOpen, setIsCreateReqOpen] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [draftSearch, setDraftSearch] = useState("");
  const [isCloneReqOpen, setIsCloneReqOpen] = useState(false);
  const [selectedReqForClone, setSelectedReqForClone] = useState<string>("");

  // Interview Management State
  const [interviews, setInterviews] = useState<InterviewSchedule[]>(INITIAL_INTERVIEWS);
  const [interviewTab, setInterviewTab] = useState<"UPCOMING" | "COMPLETED" | "CANCELLED">("UPCOMING");
  const [interviewTimeFilter, setInterviewTimeFilter] = useState<"ALL" | "TODAY" | "WEEK" | "MONTH">("ALL");
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("");
  const [interviewSearch, setInterviewSearch] = useState<string>("");

  // Modals for Interviews
  const [isCvModalOpen, setIsCvModalOpen] = useState(false);
  const [activeInterviewForCv, setActiveInterviewForCv] = useState<InterviewSchedule | null>(null);
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [activeInterviewForEval, setActiveInterviewForEval] = useState<InterviewSchedule | null>(null);
  const [evalScore, setEvalScore] = useState<number>(8.5);
  const [evalComment, setEvalComment] = useState<string>("");
  const [evalRecommendation, setEvalRecommendation] = useState<"HIRE" | "REJECT" | "CONSIDER">("HIRE");

  // Candidate Decisions Modals
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isCandidateDetailOpen, setIsCandidateDetailOpen] = useState(false);
  const [activeCandidate, setActiveCandidate] = useState<ShortlistCandidate | null>(null);

  // Approval Workflow & Audit Trail Modal State
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedApprovalType, setSelectedApprovalType] = useState<"REQUISITION" | "OFFER">("REQUISITION");
  const [selectedApprovalId, setSelectedApprovalId] = useState<string>("REQ-2026-001");

  const handleOpenApprovalWorkflow = (type: "REQUISITION" | "OFFER", id: string) => {
    setSelectedApprovalType(type);
    setSelectedApprovalId(id);
    setIsApprovalModalOpen(true);
  };

  // Get active approval workflow record with dynamic fallback
  const currentWorkflowRecord: ApprovalWorkflowRecord = useMemo(() => {
    if (MOCK_APPROVAL_WORKFLOWS[selectedApprovalId]) {
      return MOCK_APPROVAL_WORKFLOWS[selectedApprovalId];
    }
    // Dynamic fallback for any other Requisition or Candidate
    if (selectedApprovalType === "REQUISITION") {
      const foundReq = requisitions.find((r) => r.id === selectedApprovalId);
      const title = foundReq ? foundReq.title : "Yêu cầu tuyển dụng";
      const dept = foundReq ? foundReq.department : "Khối Công Nghệ";
      return {
        id: `WF-${selectedApprovalId}`,
        itemCode: selectedApprovalId,
        itemType: "REQUISITION",
        itemTitle: title,
        department: dept,
        creator: "Lê Trưởng Nhóm",
        createdAt: "10/01/2026 - 09:15",
        overallStatus: foundReq?.status === "Active" ? "APPROVED" : "IN_PROGRESS",
        auditHash: `sha256:${selectedApprovalId.toLowerCase().replace(/-/g, "")}8f1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`,
        lastAuditedAt: "12/01/2026 - 16:05",
        steps: [
          {
            id: "STP-FB1",
            stepNumber: 1,
            stepName: "Cấp 1: Khởi tạo & Đề xuất Nhu cầu Tuyển dụng",
            approverName: "Lê Trưởng Nhóm",
            approverRole: "Trưởng Bộ Phận (Hiring Manager)",
            department: dept,
            status: "APPROVED",
            timestamp: "10/01/2026 - 09:15",
            comment: `Đề xuất phê duyệt mở tuyển vị trí ${title} nhằm đáp ứng khối lượng công việc của dự án.`,
          },
          {
            id: "STP-FB2",
            stepNumber: 2,
            stepName: "Cấp 2: Thẩm định Định biên & Ngân sách Headcount",
            approverName: "Nguyễn Thị Thu Hà",
            approverRole: "Trưởng phòng Nhân sự",
            department: "Phòng Quản Trị Nhân Sự (HR)",
            status: foundReq?.status === "Active" ? "APPROVED" : "PENDING",
            timestamp: foundReq?.status === "Active" ? "10/01/2026 - 14:30" : "Đang chờ xử lý...",
            comment:
              foundReq?.status === "Active"
                ? "Đã kiểm tra ngân sách headcount, đồng ý tuyển."
                : "Đang đối soát định biên nhân sự bộ phận trước khi phê duyệt.",
          },
          {
            id: "STP-FB3",
            stepNumber: 3,
            stepName: "Cấp 3: Phê duyệt Tài chính & Quỹ lương Dự toán",
            approverName: "Trần Đức Thắng",
            approverRole: "Giám đốc Tài chính (CFO)",
            department: "Khối Tài Chính - Kế Toán",
            status: foundReq?.status === "Active" ? "APPROVED" : "NOT_REACHED",
            timestamp: foundReq?.status === "Active" ? "11/01/2026 - 11:20" : "Chưa đến lượt xử lý",
            comment:
              foundReq?.status === "Active"
                ? "Đã cấp mã ngân sách dự toán, đảm bảo chi phí nhân sự."
                : "Chờ phê duyệt từ Trưởng phòng Nhân sự trước khi thẩm định quỹ lương.",
          },
          {
            id: "STP-FB4",
            stepNumber: 4,
            stepName: "Cấp 4: Phê duyệt Ký ban hành Đăng tuyển",
            approverName: "Phạm Hoàng Nam",
            approverRole: "Tổng Giám Đốc (CEO)",
            department: "Ban Giám Đốc (BOD)",
            status: foundReq?.status === "Active" ? "APPROVED" : "NOT_REACHED",
            timestamp: foundReq?.status === "Active" ? "12/01/2026 - 16:05" : "Chưa đến lượt xử lý",
            comment:
              foundReq?.status === "Active"
                ? "Phê duyệt triển khai đăng tuyển công khai."
                : "Chờ phê duyệt từ các cấp chuyên môn.",
          },
        ],
      };
    } else {
      const foundCandidate = candidates.find((c) => c.id === selectedApprovalId);
      const name = foundCandidate ? foundCandidate.name : "Ứng viên";
      const posTitle = foundCandidate ? foundCandidate.positionTitle : "Vị trí tuyển dụng";
      const salary = foundCandidate ? foundCandidate.proposedSalary : "Thỏa thuận";
      const isHired = foundCandidate?.decision === "Hired";
      return {
        id: `WF-OFFER-${selectedApprovalId}`,
        itemCode: `OFFER-${selectedApprovalId}`,
        itemType: "OFFER",
        itemTitle: `Đề xuất Tuyển dụng (Offer): ${name}`,
        department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
        creator: "Lê Trưởng Nhóm",
        createdAt: "25/01/2026 - 10:15",
        overallStatus: isHired ? "APPROVED" : "IN_PROGRESS",
        auditHash: `sha256:${selectedApprovalId.toLowerCase()}e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`,
        lastAuditedAt: isHired ? "26/01/2026 - 15:00" : "25/01/2026 - 10:15",
        steps: [
          {
            id: "STP-FBO1",
            stepNumber: 1,
            stepName: "Cấp 1: Đề xuất Quyết định Tuyển & Mức lương (Hiring Manager)",
            approverName: "Lê Trưởng Nhóm",
            approverRole: "Trưởng Bộ Phận (Hiring Manager)",
            department: "Khối Công Nghệ",
            status: "APPROVED",
            timestamp: "25/01/2026 - 10:15",
            comment: `Ứng viên ${name} đáp ứng tốt yêu cầu vị trí ${posTitle}. Đề xuất tuyển mức lương ${salary}.`,
          },
          {
            id: "STP-FBO2",
            stepNumber: 2,
            stepName: "Cấp 2: Thẩm định Đãi ngộ & Khung chính sách Phúc lợi (C&B)",
            approverName: "Vũ Thùy Linh",
            approverRole: "Trưởng nhóm Đãi ngộ & Phúc lợi (C&B)",
            department: "Phòng Quản Trị Nhân Sự (HR)",
            status: isHired ? "APPROVED" : "PENDING",
            timestamp: isHired ? "25/01/2026 - 15:40" : "Đang chờ xử lý...",
            comment: isHired
              ? "Mức đãi ngộ phù hợp quy chế công ty, đã chuẩn bị hợp đồng."
              : "Đang rà soát khung dải lương và chế độ đãi ngộ.",
          },
          {
            id: "STP-FBO3",
            stepNumber: 3,
            stepName: "Cấp 3: Duyệt Thư mời Nhận việc (HR Director)",
            approverName: "Nguyễn Thị Thu Hà",
            approverRole: "Trưởng phòng Nhân sự",
            department: "Phòng Quản Trị Nhân Sự (HR)",
            status: isHired ? "APPROVED" : "NOT_REACHED",
            timestamp: isHired ? "26/01/2026 - 11:00" : "Chưa đến lượt xử lý",
            comment: isHired
              ? "Đã kiểm tra tham chiếu đạt yêu cầu, đồng ý gửi Offer."
              : "Chờ ý kiến thẩm định từ nhóm C&B.",
          },
          {
            id: "STP-FBO4",
            stepNumber: 4,
            stepName: "Cấp 4: Phê duyệt Ban Giám Đốc & Ký phát hành Thư mời (BOD)",
            approverName: "Phạm Hoàng Nam",
            approverRole: "Tổng Giám Đốc (CEO)",
            department: "Ban Giám Đốc (BOD)",
            status: isHired ? "APPROVED" : "NOT_REACHED",
            timestamp: isHired ? "26/01/2026 - 15:00" : "Chưa đến lượt xử lý",
            comment: isHired
              ? "Phê duyệt ký phát hành thư mời nhận việc chính thức."
              : "Chờ trình ký từ phòng Nhân sự.",
          },
        ],
      };
    }
  }, [selectedApprovalId, selectedApprovalType, requisitions, candidates]);

  // Decision Form Inputs
  const [hireNote, setHireNote] = useState("");
  const [hireSalary, setHireSalary] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  // Sprint 2: Date helpers
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const defaultTargetDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Standard salary ceiling: 30,000,000 VNĐ
  const SALARY_STANDARD_CEILING = 30000000;

  // Create Requisition Form State (Sprint 2)
  const [reqFormData, setReqFormData] = useState({
    title: "",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    level: "Senior" as JobRequisition["level"],
    workType: "Toàn thời gian (Full-time)",
    targetCount: 1,
    targetDate: defaultTargetDate,
    proposedSalary: 35000000, // Default 35M to demonstrate justification logic (> 30M)
    salaryJustification: "",
    recruitmentReason: "Bổ sung định biên",
    recruitmentReasonDetail: "",
    description: "",
    requirements: "",
  });

  // Validation errors
  const [reqFormErrors, setReqFormErrors] = useState<{
    title?: string;
    targetDate?: string;
    proposedSalary?: string;
    salaryJustification?: string;
    description?: string;
  }>({});

  // Rich Text Editor formatting state
  const [editorActiveFormats, setEditorActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    align: "left" as "left" | "center" | "right",
  });
  const jdTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Rich text formatting actions
  const applyFormatting = (format: "bold" | "italic" | "underline") => {
    const textarea = jdTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = reqFormData.description;
    const selectedText = currentText.substring(start, end);

    let prefix = "";
    let suffix = "";
    if (format === "bold") {
      prefix = "**";
      suffix = "**";
      setEditorActiveFormats((prev) => ({ ...prev, bold: !prev.bold }));
    } else if (format === "italic") {
      prefix = "*";
      suffix = "*";
      setEditorActiveFormats((prev) => ({ ...prev, italic: !prev.italic }));
    } else if (format === "underline") {
      prefix = "<u>";
      suffix = "</u>";
      setEditorActiveFormats((prev) => ({ ...prev, underline: !prev.underline }));
    }

    const insertContent = selectedText || (format === "bold" ? "văn bản in đậm" : format === "italic" ? "văn bản in nghiêng" : "văn bản gạch chân");
    const newText = currentText.substring(0, start) + prefix + insertContent + suffix + currentText.substring(end);

    setReqFormData((prev) => ({ ...prev, description: newText }));
    if (reqFormErrors.description) {
      setReqFormErrors((prev) => {
        const next = { ...prev };
        delete next.description;
        return next;
      });
    }

    setTimeout(() => {
      textarea.focus();
    }, 50);
  };

  const applyListFormatting = (type: "bullet" | "ordered") => {
    const textarea = jdTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const currentText = reqFormData.description;
    const bullet = type === "bullet" ? "• " : "1. ";
    const newText = currentText.substring(0, start) + `\n${bullet}` + currentText.substring(start);

    setReqFormData((prev) => ({ ...prev, description: newText }));
    setTimeout(() => {
      textarea.focus();
    }, 50);
  };

  const insertJDTemplate = () => {
    const sampleJD = `I. MỤC TIÊU & MÔ TẢ CÔNG VIỆC:
• Chịu trách nhiệm thiết kế, phát triển và tối ưu hóa hệ thống phần mềm cốt lõi của công ty.
• Phối hợp chặt chẽ với Product Owner, Tech Lead và UI/UX Designer để hoàn thiện các tính năng tuyển dụng.
• Tham gia review mã nguồn, hướng dẫn các thành viên junior và đảm bảo chất lượng kỹ thuật theo chuẩn Clean Architecture.
• Đề xuất giải pháp cải tiến hiệu năng, mở rộng hệ thống và nâng cao trải nghiệm ứng viên.

II. YÊU CẦU CHUYÊN MÔN:
• Tối thiểu 3+ năm kinh nghiệm làm việc thực tế ở vị trí tương đương.
• Nắm vững React, TypeScript, Next.js (hoặc Golang/Python), Microservices và RESTful API.
• Có tư duy giải thuật, cấu trúc dữ liệu tốt và thấu hiểu các nguyên tắc bảo mật thông tin.
• Kỹ năng giao tiếp tự tin, tinh thần làm việc nhóm và chủ động giải quyết sự cố.

III. QUYỀN LỢI ĐÃI NGỘ:
• Thu nhập cạnh tranh theo năng lực, thưởng hiệu suất định kỳ và thưởng dự án.
• Được tham gia các chương trình đào tạo chuyên môn và lộ trình thăng tiến rõ ràng (Tech Lead / Architect).
• Gói chăm sóc sức khỏe cao cấp cho nhân viên, thiết bị làm việc hiện đại và môi trường làm việc cởi mở.`;

    setReqFormData((prev) => ({ ...prev, description: sampleJD }));
    setReqFormErrors((prev) => {
      const next = { ...prev };
      delete next.description;
      return next;
    });
    showToast("Đã chèn nội dung Mô tả công việc (JD) mẫu thành công!");
  };

  const handleDateChange = (val: string) => {
    setReqFormData((prev) => ({ ...prev, targetDate: val }));
    if (val && val < todayStr) {
      setReqFormErrors((prev) => ({
        ...prev,
        targetDate: "Ngày cần nhân sự không thể ở trong quá khứ. Vui lòng chọn một ngày trong tương lai (tối thiểu sau hôm nay)."
      }));
    } else {
      setReqFormErrors((prev) => {
        const next = { ...prev };
        delete next.targetDate;
        return next;
      });
    }
  };

  const handleSalaryChange = (amount: number) => {
    setReqFormData((prev) => ({ ...prev, proposedSalary: amount }));
    if (amount <= SALARY_STANDARD_CEILING) {
      setReqFormErrors((prev) => {
        const next = { ...prev };
        delete next.salaryJustification;
        delete next.proposedSalary;
        return next;
      });
    } else {
      if (reqFormData.salaryJustification.trim()) {
        setReqFormErrors((prev) => {
          const next = { ...prev };
          delete next.salaryJustification;
          return next;
        });
      }
    }
  };

  // Edit Profile Form State
  const [editProfileForm, setEditProfileForm] = useState({
    name: "Lê Trưởng Nhóm",
    phone: "0912 345 678",
    department: "Phòng Phát Triển Công Nghệ & Phần Mềm",
    bio: "Chịu trách nhiệm hoạch định nhu cầu tuyển dụng, phỏng vấn chuyên môn và ra quyết định nhân sự then chốt cho khối Công nghệ.",
  });

  // Sync profile from localStorage if user logged in
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user_info");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.email) {
          setManagerProfile((prev) => ({
            ...prev,
            email: parsed.email,
            name: parsed.full_name || prev.name,
          }));
          setEditProfileForm((prev) => ({
            ...prev,
            name: parsed.full_name || prev.name,
          }));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Click outside to close profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Logout Handler
  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_info");
      localStorage.removeItem("internal-recruitment-session");
    }
    showToast("Đã đăng xuất khỏi phiên làm việc!");
    setTimeout(() => {
      router.push("/login");
    }, 600);
  };

  // Avatar Upload Handler: Đọc file và mở Modal Crop
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        showToast("Vui lòng chọn file hình ảnh hợp lệ!");
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
    setManagerProfile((prev) => ({
      ...prev,
      avatarUrl: result.avatarUrl,
    }));
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    showToast("Đã cắt và cập nhật ảnh đại diện chuẩn thành công!");
  };

  // Filtered Requisitions (Danh sách chính: ẨN HOÀN TOÀN các yêu cầu có trạng thái "Draft")
  const filteredRequisitions = useMemo(() => {
    return requisitions.filter((req) => {
      if (req.status === "Draft") return false;

      const matchesSearch =
        req.title.toLowerCase().includes(reqSearch.toLowerCase()) ||
        req.id.toLowerCase().includes(reqSearch.toLowerCase()) ||
        req.department.toLowerCase().includes(reqSearch.toLowerCase());
      const matchesStatus =
        reqStatusFilter === "ALL" || req.status === reqStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requisitions, reqSearch, reqStatusFilter]);

  // Draft Requisitions (Danh sách chỉ chứa các bản nháp chưa gửi duyệt)
  const draftRequisitions = useMemo(() => {
    return requisitions.filter((req) => {
      if (req.status !== "Draft") return false;
      const matchesSearch =
        !draftSearch.trim() ||
        req.title.toLowerCase().includes(draftSearch.toLowerCase()) ||
        req.id.toLowerCase().includes(draftSearch.toLowerCase()) ||
        req.department.toLowerCase().includes(draftSearch.toLowerCase());
      return matchesSearch;
    });
  }, [requisitions, draftSearch]);

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((can) => {
      const matchesSearch =
        can.name.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        can.email.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        can.id.toLowerCase().includes(candidateSearch.toLowerCase());
      const matchesPos =
        candidatePosFilter === "ALL" || can.positionId === candidatePosFilter;
      const matchesDecision =
        candidateDecisionFilter === "ALL" || can.decision === candidateDecisionFilter;
      return matchesSearch && matchesPos && matchesDecision;
    });
  }, [candidates, candidateSearch, candidatePosFilter, candidateDecisionFilter]);

  // Metric Stats
  const totalRequisitions = requisitions.length;
  const activeRequisitions = requisitions.filter((r) => r.status === "Active").length;
  const draftCount = requisitions.filter((r) => r.status === "Draft").length;
  const pendingCandidates = candidates.filter((c) => c.decision === "Pending").length;
  const hiredCandidates = candidates.filter((c) => c.decision === "Hired").length;

  // Interview statistics & counts
  const upcomingInterviewsCount = useMemo(
    () => interviews.filter((i) => i.status === "UPCOMING").length,
    [interviews]
  );
  const completedInterviewsCount = useMemo(
    () => interviews.filter((i) => i.status === "COMPLETED").length,
    [interviews]
  );
  const cancelledInterviewsCount = useMemo(
    () => interviews.filter((i) => i.status === "CANCELLED").length,
    [interviews]
  );

  // Filtered Interviews
  const filteredInterviews = useMemo(() => {
    return interviews.filter((item) => {
      // 1. Status Filter
      if (item.status !== interviewTab) return false;

      // 2. Search query
      if (interviewSearch.trim()) {
        const query = interviewSearch.toLowerCase();
        const matchesName = item.candidateName.toLowerCase().includes(query);
        const matchesPos = item.positionTitle.toLowerCase().includes(query);
        const matchesDept = item.department.toLowerCase().includes(query);
        const matchesInterviewer = item.interviewers.some((inv) =>
          inv.name.toLowerCase().includes(query)
        );
        if (!matchesName && !matchesPos && !matchesDept && !matchesInterviewer) return false;
      }

      // 3. Time Filter
      if (selectedDateFilter) {
        if (item.date !== selectedDateFilter) return false;
      } else if (interviewTimeFilter === "TODAY") {
        if (item.date !== "2026-10-03") return false;
      } else if (interviewTimeFilter === "WEEK") {
        if (item.date < "2026-09-28" || item.date > "2026-10-08") return false;
      } else if (interviewTimeFilter === "MONTH") {
        if (!item.date.startsWith("2026-10")) return false;
      }

      return true;
    });
  }, [interviews, interviewTab, interviewSearch, selectedDateFilter, interviewTimeFilter]);

  // Grouped Interviews by Date
  const groupedInterviews = useMemo(() => {
    const groups: { [key: string]: { label: string; date: string; items: InterviewSchedule[] } } = {};
    filteredInterviews.forEach((item) => {
      if (!groups[item.date]) {
        groups[item.date] = {
          label: item.dateLabel,
          date: item.date,
          items: [],
        };
      }
      groups[item.date].items.push(item);
    });

    const list = Object.values(groups);
    if (interviewTab === "UPCOMING") {
      list.sort((a, b) => a.date.localeCompare(b.date));
    } else {
      list.sort((a, b) => b.date.localeCompare(a.date));
    }
    return list;
  }, [filteredInterviews, interviewTab]);

  // Handlers for Interviews
  const handleViewCv = (item: InterviewSchedule) => {
    setActiveInterviewForCv(item);
    setIsCvModalOpen(true);
  };

  const handleJoinMeeting = (item: InterviewSchedule) => {
    showToast(`Đang kết nối vào phòng họp Teams cho ứng viên ${item.candidateName}...`);
    if (typeof window !== "undefined") {
      window.open(item.meetingLink || "https://teams.microsoft.com", "_blank");
    }
  };

  const handleOpenEvaluation = (item: InterviewSchedule) => {
    setActiveInterviewForEval(item);
    setEvalScore(item.score || 8.5);
    setEvalComment(item.evalComment || "");
    setEvalRecommendation(item.score && item.score >= 8 ? "HIRE" : "CONSIDER");
    setIsEvalModalOpen(true);
  };

  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInterviewForEval) return;

    setInterviews((prev) =>
      prev.map((i) =>
        i.id === activeInterviewForEval.id
          ? {
              ...i,
              score: evalScore,
              evalComment: evalComment,
              feedbackStatus: "SUBMITTED",
              status: "COMPLETED",
            }
          : i
      )
    );

    // Also update candidate in shortlist if applicable
    if (activeInterviewForEval.candidateId) {
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === activeInterviewForEval.candidateId
            ? {
                ...c,
                round2: {
                  ...c.round2,
                  score: evalScore,
                  comment: evalComment || c.round2.comment,
                  status: evalScore >= 7 ? "Passed" : "Failed",
                },
              }
            : c
        )
      );
    }

    setIsEvalModalOpen(false);
    showToast(`Đã lưu kết quả đánh giá ứng viên ${activeInterviewForEval.candidateName} (${evalScore}/10) thành công!`);
  };

  // Helper: Format date for input YYYY-MM-DD
  const formatDateForInput = (dateStr?: string): string => {
    if (!dateStr) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const day = parts[0].padStart(2, "0");
      const month = parts[1].padStart(2, "0");
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    return "";
  };

  // Handler: Mở Modal tạo yêu cầu tuyển dụng mới
  const handleOpenCreateModal = () => {
    setEditingDraftId(null);
    setReqFormData({
      title: "",
      department: managerProfile.department,
      level: "Senior",
      workType: "Toàn thời gian (Full-time)",
      targetCount: 1,
      targetDate: defaultTargetDate,
      proposedSalary: 35000000,
      salaryJustification: "",
      recruitmentReason: "Bổ sung định biên",
      recruitmentReasonDetail: "",
      description: "",
      requirements: "",
    });
    setReqFormErrors({});
    setIsCreateReqOpen(true);
  };

  // Handler: Mở Modal chỉnh sửa bản nháp (Pre-fill toàn bộ dữ liệu)
  const handleEditDraft = (draftId: string) => {
    const draft = requisitions.find((r) => r.id === draftId);
    if (!draft) return;

    setEditingDraftId(draftId);

    let parsedDate = defaultTargetDate;
    if (draft.deadline && draft.deadline !== "Chưa xác định") {
      const iso = formatDateForInput(draft.deadline);
      if (iso) parsedDate = iso;
    }

    setReqFormData({
      title: draft.title || "",
      department: draft.department || managerProfile.department,
      level: draft.level || "Senior",
      workType: draft.workType || "Toàn thời gian (Full-time)",
      targetCount: draft.targetCount || 1,
      targetDate: parsedDate,
      proposedSalary: draft.proposedSalary || 35000000,
      salaryJustification: draft.salaryJustification || "",
      recruitmentReason: draft.recruitmentReason || "Bổ sung định biên",
      recruitmentReasonDetail: draft.recruitmentReasonDetail || "",
      description: draft.description || "",
      requirements: draft.requirements || "",
    });

    setReqFormErrors({});
    setIsCreateReqOpen(true);
  };

  // Handler: Cập nhật bản nháp (Lưu lại nhưng vẫn giữ trạng thái Draft)
  const handleUpdateDraft = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!editingDraftId) return;

    const draftTitle = reqFormData.title.trim() || "Yêu cầu tuyển dụng (Bản nháp)";
    const formattedSalary = reqFormData.proposedSalary
      ? new Intl.NumberFormat("vi-VN").format(reqFormData.proposedSalary) + " VNĐ"
      : "Thỏa thuận";

    setRequisitions((prev) =>
      prev.map((r) =>
        r.id === editingDraftId
          ? {
              ...r,
              title: draftTitle,
              department: reqFormData.department || managerProfile.department,
              level: reqFormData.level,
              targetCount: Number(reqFormData.targetCount) || 1,
              status: "Draft", // Vẫn giữ nguyên trạng thái Bản nháp
              salaryRange: formattedSalary,
              deadline: reqFormData.targetDate
                ? new Date(reqFormData.targetDate).toLocaleDateString("vi-VN")
                : r.deadline,
              description: reqFormData.description,
              requirements: reqFormData.requirements,
              workType: reqFormData.workType,
              proposedSalary: reqFormData.proposedSalary,
              salaryJustification: reqFormData.salaryJustification,
              recruitmentReason: reqFormData.recruitmentReason,
              recruitmentReasonDetail: reqFormData.recruitmentReasonDetail,
            }
          : r
      )
    );

    setIsCreateReqOpen(false);
    setEditingDraftId(null);
    setReqFormErrors({});

    // Reset Form to initial values
    setReqFormData({
      title: "",
      department: managerProfile.department,
      level: "Senior",
      workType: "Toàn thời gian (Full-time)",
      targetCount: 1,
      targetDate: defaultTargetDate,
      proposedSalary: 35000000,
      salaryJustification: "",
      recruitmentReason: "Bổ sung định biên",
      recruitmentReasonDetail: "",
      description: "",
      requirements: "",
    });

    showToast(`Đã lưu các thay đổi cho bản nháp: "${draftTitle}"!`);
  };

  // Handler: Xóa bản nháp
  const handleDeleteDraft = (draftId: string, title?: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa bản nháp "${title || draftId}" không?`)) {
      setRequisitions((prev) => prev.filter((r) => r.id !== draftId));
      showToast(`Đã xóa bản nháp "${title || draftId}" thành công!`);
    }
  };

  // Handlers: Gửi yêu cầu duyệt (Dùng cho cả Tạo mới và Gửi duyệt từ Bản nháp)
  const handleCreateRequisition = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};

    // 1. Validate Title
    if (!reqFormData.title.trim()) {
      errors.title = "Vui lòng nhập vị trí/chức danh cần tuyển";
    }

    // 2. Validate Target Date (Không cho phép ngày trong quá khứ)
    if (!reqFormData.targetDate) {
      errors.targetDate = "Vui lòng chọn ngày cần nhân sự";
    } else if (reqFormData.targetDate < todayStr) {
      errors.targetDate =
        "Ngày cần nhân sự không thể ở trong quá khứ. Vui lòng chọn một ngày trong tương lai (tối thiểu sau hôm nay).";
    }

    // 3. Validate Proposed Salary & Justification (> 30.000.000 VNĐ)
    if (!reqFormData.proposedSalary || reqFormData.proposedSalary <= 0) {
      errors.proposedSalary = "Vui lòng nhập mức lương đề xuất hợp lệ";
    } else if (reqFormData.proposedSalary > SALARY_STANDARD_CEILING) {
      if (!reqFormData.salaryJustification.trim()) {
        errors.salaryJustification =
          "Bắt buộc giải trình lý do đề xuất mức lương vượt khung ngân sách chuẩn (> 30.000.000 VNĐ).";
      }
    }

    // 4. Validate Job Description
    if (!reqFormData.description.trim()) {
      errors.description = "Vui lòng nhập nội dung mô tả công việc (Job Description)";
    }

    if (Object.keys(errors).length > 0) {
      setReqFormErrors(errors);
      showToast("Vui lòng kiểm tra và hoàn thiện các trường thông tin bắt buộc!");
      return;
    }

    const formattedSalary =
      new Intl.NumberFormat("vi-VN").format(reqFormData.proposedSalary) + " VNĐ";

    if (editingDraftId) {
      // ĐỔI TRẠNG THÁI TỪ "NHÁP" THÀNH "CHỜ DUYỆT" & ĐƯA SANG DANH SÁCH CHÍNH
      setRequisitions((prev) =>
        prev.map((r) =>
          r.id === editingDraftId
            ? {
                ...r,
                title: reqFormData.title.trim(),
                department: reqFormData.department || managerProfile.department,
                level: reqFormData.level,
                targetCount: Number(reqFormData.targetCount) || 1,
                status: "Pending", // Chuyển từ Draft thành Pending
                salaryRange: formattedSalary,
                deadline: new Date(reqFormData.targetDate).toLocaleDateString("vi-VN"),
                description: reqFormData.description,
                requirements: reqFormData.requirements,
                workType: reqFormData.workType,
                proposedSalary: reqFormData.proposedSalary,
                salaryJustification: reqFormData.salaryJustification,
                recruitmentReason: reqFormData.recruitmentReason,
                recruitmentReasonDetail: reqFormData.recruitmentReasonDetail,
              }
            : r
        )
      );

      showToast(`Đã gửi duyệt yêu cầu: "${reqFormData.title}" thành công! Yêu cầu đã chuyển sang danh sách chính.`);
    } else {
      // TẠO YÊU CẦU MỚI (CHỜ DUYỆT)
      const newReq: JobRequisition = {
        id: `REQ-2026-00${requisitions.length + 1}`,
        title: reqFormData.title.trim(),
        department: reqFormData.department || managerProfile.department,
        level: reqFormData.level,
        targetCount: Number(reqFormData.targetCount) || 1,
        receivedCount: 0,
        interviewingCount: 0,
        hiredCount: 0,
        status: "Pending",
        salaryRange: formattedSalary,
        createdAt: new Date().toLocaleDateString("vi-VN"),
        deadline: new Date(reqFormData.targetDate).toLocaleDateString("vi-VN"),
        description: reqFormData.description,
        requirements: reqFormData.requirements,
        workType: reqFormData.workType,
        proposedSalary: reqFormData.proposedSalary,
        salaryJustification: reqFormData.salaryJustification,
        recruitmentReason: reqFormData.recruitmentReason,
        recruitmentReasonDetail: reqFormData.recruitmentReasonDetail,
      };

      setRequisitions([newReq, ...requisitions]);
      showToast(`Đã gửi yêu cầu mở tuyển: "${newReq.title}" với ngân sách ${formattedSalary} (Đang chờ duyệt)!`);
    }

    setIsCreateReqOpen(false);
    setEditingDraftId(null);
    setReqFormErrors({});

    // Reset Form to initial values
    setReqFormData({
      title: "",
      department: managerProfile.department,
      level: "Senior",
      workType: "Toàn thời gian (Full-time)",
      targetCount: 1,
      targetDate: defaultTargetDate,
      proposedSalary: 35000000,
      salaryJustification: "",
      recruitmentReason: "Bổ sung định biên",
      recruitmentReasonDetail: "",
      description: "",
      requirements: "",
    });
  };

  // Handler: Lưu nháp yêu cầu tuyển dụng mới (Save Draft Requisition)
  const handleSaveDraftRequisition = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const draftTitle = reqFormData.title.trim() || "Yêu cầu tuyển dụng (Bản nháp)";
    const formattedSalary = reqFormData.proposedSalary
      ? new Intl.NumberFormat("vi-VN").format(reqFormData.proposedSalary) + " VNĐ"
      : "Thỏa thuận";

    const draftReq: JobRequisition = {
      id: `REQ-2026-00${requisitions.length + 1}`,
      title: draftTitle,
      department: reqFormData.department || managerProfile.department,
      level: reqFormData.level,
      targetCount: Number(reqFormData.targetCount) || 1,
      receivedCount: 0,
      interviewingCount: 0,
      hiredCount: 0,
      status: "Draft",
      salaryRange: formattedSalary,
      createdAt: new Date().toLocaleDateString("vi-VN"),
      deadline: reqFormData.targetDate
        ? new Date(reqFormData.targetDate).toLocaleDateString("vi-VN")
        : "Chưa xác định",
      description: reqFormData.description,
      requirements: reqFormData.requirements,
      workType: reqFormData.workType,
      proposedSalary: reqFormData.proposedSalary,
      salaryJustification: reqFormData.salaryJustification,
      recruitmentReason: reqFormData.recruitmentReason,
      recruitmentReasonDetail: reqFormData.recruitmentReasonDetail,
    };

    setRequisitions([draftReq, ...requisitions]);
    setIsCreateReqOpen(false);
    setEditingDraftId(null);
    setReqFormErrors({});

    // Reset Form to initial values
    setReqFormData({
      title: "",
      department: managerProfile.department,
      level: "Senior",
      workType: "Toàn thời gian (Full-time)",
      targetCount: 1,
      targetDate: defaultTargetDate,
      proposedSalary: 35000000,
      salaryJustification: "",
      recruitmentReason: "Bổ sung định biên",
      recruitmentReasonDetail: "",
      description: "",
      requirements: "",
    });

    showToast(`Đã lưu bản nháp: "${draftReq.title}" thành công!`);
  };

  // Handlers: Clone Requisition
  const handleOpenCloneModal = (prefillId?: string) => {
    if (prefillId) {
      setSelectedReqForClone(prefillId);
    } else if (requisitions.length > 0) {
      setSelectedReqForClone(requisitions[0].id);
    }
    setIsCloneReqOpen(true);
  };

  const handleConfirmClone = () => {
    const sourceReq = requisitions.find((r) => r.id === selectedReqForClone);
    if (!sourceReq) return;

    const clonedReq: JobRequisition = {
      ...sourceReq,
      id: `REQ-2026-00${requisitions.length + 1}`,
      title: `${sourceReq.title} (Bổ sung)`,
      status: "Pending",
      receivedCount: 0,
      interviewingCount: 0,
      hiredCount: 0,
      createdAt: new Date().toLocaleDateString("vi-VN"),
      deadline: "20/03/2026",
    };

    setRequisitions([clonedReq, ...requisitions]);
    setIsCloneReqOpen(false);
    showToast(`Đã sao chép thành công yêu cầu: ${clonedReq.title}!`);
  };

  // Handlers: Hire Candidate
  const handleOpenHireModal = (can: ShortlistCandidate) => {
    setActiveCandidate(can);
    setHireSalary(can.proposedSalary || "");
    setHireNote(can.overallAssessment || "");
    setIsHireModalOpen(true);
  };

  const handleConfirmHire = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCandidate) return;

    setCandidates((prev) =>
      prev.map((c) =>
        c.id === activeCandidate.id
          ? {
              ...c,
              decision: "Hired",
              decisionNote: hireNote || "Đồng ý tuyển dụng theo đề xuất chuyên môn.",
              proposedSalary: hireSalary || c.proposedSalary,
              decidedAt: new Date().toLocaleDateString("vi-VN"),
            }
          : c
      )
    );

    setIsHireModalOpen(false);
    showToast(`Đã đưa ra quyết định TUYỂN DỤNG cho ứng viên ${activeCandidate.name}!`);
    setActiveCandidate(null);
  };

  // Handlers: Reject Candidate
  const handleOpenRejectModal = (can: ShortlistCandidate) => {
    setActiveCandidate(can);
    setRejectReason("");
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCandidate) return;

    setCandidates((prev) =>
      prev.map((c) =>
        c.id === activeCandidate.id
          ? {
              ...c,
              decision: "Rejected",
              decisionNote: rejectReason || "Chưa phù hợp với yêu cầu hiện tại của dự án.",
              decidedAt: new Date().toLocaleDateString("vi-VN"),
            }
          : c
      )
    );

    setIsRejectModalOpen(false);
    showToast(`Đã lưu kết quả KHÔNG CHỌN ứng viên ${activeCandidate.name}.`);
    setActiveCandidate(null);
  };

  // Profile Save Handler
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setManagerProfile((prev) => ({
      ...prev,
      name: editProfileForm.name,
      phone: editProfileForm.phone,
      department: editProfileForm.department,
      bio: editProfileForm.bio,
    }));
    setIsEditProfileModalOpen(false);
    showToast("Đã cập nhật hồ sơ cá nhân thành công!");
  };

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

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOP HEADER */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Left: Branding & Role Badge */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#4285F4] to-[#6ba5ff] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-slate-900 tracking-tight">
                    Tuyển Dụng Nội Bộ
                  </span>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-[#4285F4] border border-blue-100">
                    Trưởng Bộ Phận
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {managerProfile.department}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Actions, Notifications & Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Notification Bell */}
            <button
              title="Thông báo tuyển dụng"
              className="relative w-10 h-10 rounded-full bg-slate-50 border border-gray-100 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#4285F4] ring-2 ring-white"></span>
            </button>

            {/* User Profile Dropdown Menu */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-3 pl-3 border-l border-gray-100 hover:bg-slate-50/80 p-1.5 rounded-2xl transition-all cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-[#4285F4]/20"
                aria-expanded={isProfileDropdownOpen}
              >
                <div className="relative shrink-0">
                  {managerProfile.avatarUrl ? (
                    <img
                      src={managerProfile.avatarUrl}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-100 shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#4285F4] to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-blue-100">
                      LT
                    </div>
                  )}
                  <span
                    className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
                    title="Đang hoạt động"
                  ></span>
                </div>
                <div className="text-left hidden sm:block">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900 leading-tight">
                      {managerProfile.name}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        isProfileDropdownOpen ? "rotate-180 text-[#4285F4]" : ""
                      }`}
                    />
                  </div>
                  <span className="text-xs text-slate-500 block leading-tight">
                    {managerProfile.email}
                  </span>
                </div>
              </button>

              {/* DROPDOWN POPUP */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-[24px] border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.08)] p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Summary Card */}
                  <div className="p-3 bg-slate-50 rounded-2xl flex items-center gap-3 mb-2 border border-gray-100/70">
                    <div
                      onClick={() => avatarInputRef.current?.click()}
                      className="relative group cursor-pointer shrink-0"
                      title="Nhấp để tải lên ảnh mới"
                    >
                      {managerProfile.avatarUrl ? (
                        <img
                          src={managerProfile.avatarUrl}
                          alt="Avatar"
                          className="w-12 h-12 rounded-xl object-cover ring-2 ring-blue-200 shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#4285F4] text-white flex items-center justify-center font-bold text-base shadow-sm">
                          LT
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {managerProfile.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {managerProfile.email}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-[#4285F4]">
                        Hiring Manager
                      </span>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="space-y-1 text-sm font-medium text-slate-700">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setProfileModalTab("profile");
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-blue-50/70 hover:text-[#4285F4] transition-colors text-left cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400 group-hover:text-[#4285F4]" />
                      <span>Hồ sơ cá nhân</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        setProfileModalTab("security");
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-blue-50/70 hover:text-[#4285F4] transition-colors text-left cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-slate-400 group-hover:text-[#4285F4]" />
                      <span>Đổi mật khẩu & Bảo mật</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        avatarInputRef.current?.click();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-blue-50/70 hover:text-[#4285F4] transition-colors text-left cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-slate-400 group-hover:text-[#4285F4]" />
                      <span>Upload ảnh đại diện</span>
                    </button>

                    <div className="pt-1.5 mt-1.5 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors text-left font-semibold cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Standalone Logout Button */}
            <button
              onClick={handleLogout}
              title="Đăng xuất khỏi tài khoản"
              className="w-10 h-10 rounded-full bg-slate-50 border border-gray-100 flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. BODY LAYOUT: SIDEBAR + MAIN CONTENT (FLEXBOX) */}
      {/* ========================================================================= */}
      <div className="flex gap-4 w-full max-w-full px-4 sm:px-6 py-8 flex-1">
        {/* LEFT SIDEBAR (Thanh menu dọc bên trái) */}
        <aside className="w-[260px] shrink-0 bg-white rounded-3xl border border-gray-100 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.03)] h-fit sticky top-24">
          <h3 className="text-xs font-bold text-gray-400 tracking-wider mb-4 uppercase">
            MENU TRƯỞNG BỘ PHẬN
          </h3>

          <nav className="space-y-1.5">
            {/* 1. Tổng quan */}
            <button
              type="button"
              onClick={() => {
                setActiveNavMenu("overview");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`flex items-center gap-3 px-4 py-3 w-full rounded-2xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                activeNavMenu === "overview"
                  ? "bg-[#4285F4] text-white shadow-md shadow-blue-500/20 font-semibold"
                  : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              <LayoutDashboard className="w-5 h-5 shrink-0" />
              <span className="flex-1 text-left whitespace-nowrap">Tổng quan</span>
            </button>

            {/* 2. Yêu cầu tuyển dụng */}
            <button
              type="button"
              onClick={() => {
                setActiveNavMenu("requisitions");
                setReqStatusFilter("ALL");
                document.getElementById("section-requisitions")?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`flex items-center gap-3 px-4 py-3 w-full rounded-2xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                activeNavMenu === "requisitions"
                  ? "bg-[#4285F4] text-white shadow-md shadow-blue-500/20 font-semibold"
                  : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              <FileText className="w-5 h-5 shrink-0" />
              <span className="flex-1 text-left whitespace-nowrap">Yêu cầu tuyển dụng</span>
              <span
                className={`ml-auto flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeNavMenu === "requisitions"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {requisitions.filter((r) => r.status !== "Draft").length}
              </span>
            </button>

            {/* 2.1 Bản nháp của tôi (Sub-menu xem lưu nháp) */}
            <button
              type="button"
              onClick={() => {
                setActiveNavMenu("drafts");
                window.scrollTo({ top: 0, behavior: "smooth" });
                showToast(`Đang hiển thị danh sách ${draftCount} bản nháp của bạn`);
              }}
              className={`flex items-center gap-2.5 pl-8 pr-4 py-2.5 w-full rounded-2xl font-medium text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                activeNavMenu === "drafts"
                  ? "bg-blue-50 text-[#4285F4] font-bold border border-blue-200/80 shadow-xs"
                  : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              <FileEdit className={`w-4 h-4 shrink-0 ${activeNavMenu === "drafts" ? "text-[#4285F4]" : "text-gray-400"}`} />
              <span className="flex-1 text-left whitespace-nowrap">Bản nháp của tôi</span>
              {draftCount > 0 && (
                <span
                  className={`ml-auto flex-shrink-0 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    activeNavMenu === "drafts"
                      ? "bg-[#4285F4] text-white"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {draftCount}
                </span>
              )}
            </button>

            {/* 3. Đánh giá ứng viên */}
            <button
              type="button"
              onClick={() => {
                setActiveNavMenu("candidates");
                document.getElementById("candidate-decision-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`flex items-center gap-3 px-4 py-3 w-full rounded-2xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                activeNavMenu === "candidates"
                  ? "bg-[#4285F4] text-white shadow-md shadow-blue-500/20 font-semibold"
                  : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              <UserCheck className="w-5 h-5 shrink-0" />
              <span className="flex-1 text-left whitespace-nowrap">Đánh giá ứng viên</span>
              {pendingCandidates > 0 && (
                <span
                  className={`ml-auto flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-bold ${
                    activeNavMenu === "candidates"
                      ? "bg-white/20 text-white"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {pendingCandidates}
                </span>
              )}
            </button>

            {/* 4. Lịch phỏng vấn */}
            <button
              type="button"
              onClick={() => {
                setActiveNavMenu("interviews");
                window.scrollTo({ top: 0, behavior: "smooth" });
                showToast(`Đang hiển thị ${upcomingInterviewsCount} lịch phỏng vấn sắp tới`);
              }}
              className={`flex items-center gap-3 px-4 py-3 w-full rounded-2xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                activeNavMenu === "interviews"
                  ? "bg-[#4285F4] text-white shadow-md shadow-blue-500/20 font-semibold"
                  : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              <Calendar className="w-5 h-5 shrink-0" />
              <span className="flex-1 text-left whitespace-nowrap">Lịch phỏng vấn</span>
              <span
                className={`ml-auto flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeNavMenu === "interviews"
                    ? "bg-white/20 text-white"
                    : "bg-blue-50 text-[#4285F4]"
                }`}
              >
                {upcomingInterviewsCount}
              </span>
            </button>

            {/* 5. Cài đặt & Hồ sơ */}
            <button
              type="button"
              onClick={() => {
                setActiveNavMenu("settings");
                setProfileModalTab("profile");
                setIsProfileModalOpen(true);
              }}
              className={`flex items-center gap-3 px-4 py-3 w-full rounded-2xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                activeNavMenu === "settings"
                  ? "bg-[#4285F4] text-white shadow-md shadow-blue-500/20 font-semibold"
                  : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              <Settings className="w-5 h-5 shrink-0" />
              <span className="flex-1 text-left whitespace-nowrap">Cài đặt & Hồ sơ</span>
            </button>
          </nav>

          {/* Sidebar Note / Mini Guide */}
          <div className="mt-8 pt-4 border-t border-gray-100/80">
            <div className="p-3 rounded-2xl bg-blue-50/50 border border-blue-100/60 text-xs">
              <p className="font-semibold text-slate-800">Quyền Hạn Bộ Phận</p>
              <p className="text-slate-500 mt-1 text-[11px] leading-relaxed">
                Trưởng bộ phận sở hữu nhu cầu nhân sự, trực tiếp đánh giá và ra quyết định Offer.
              </p>
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT (Khu vực Nội dung chính) */}
        <div className="flex-1 flex flex-col min-w-0 gap-8">
          {activeNavMenu === "drafts" ? (
            /* ========================================================================= */
            /* GIAO DIỆN "BẢN NHÁP CỦA TÔI" (DEDICATED DRAFTS LIST VIEW) */
            /* ========================================================================= */
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
              {/* Top Navigation & Breadcrumb */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveNavMenu("requisitions")}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#4285F4] transition-all cursor-pointer group"
                >
                  <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
                  <span>Quay lại Theo dõi tiến độ tuyển dụng</span>
                </button>

                <span className="text-xs text-slate-400 font-medium">
                  Trưởng Bộ Phận / Bản nháp của tôi
                </span>
              </div>

              {/* Header Banner for Drafts */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-blue-500/5 p-6 sm:p-8 rounded-[32px] border border-amber-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] relative overflow-hidden">
                <div className="flex items-start sm:items-center gap-4 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/25">
                    <FileEdit className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        Bản Nháp Của Tôi
                      </h1>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 shadow-xs">
                        {draftCount} bản nháp chưa gửi
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed max-w-2xl">
                      Khu vực lưu trữ các yêu cầu tuyển dụng đang soạn thảo dở dang. Các bản nháp này được lưu nội bộ, ẩn hoàn toàn khỏi danh sách chính để tránh gửi nhầm, và bạn có thể mở lại để chỉnh sửa hoặc gửi phê duyệt bất cứ lúc nào.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 relative z-10 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="bg-[#4285F4] hover:bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-full text-xs sm:text-sm transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tạo yêu cầu mới</span>
                  </button>
                </div>

                {/* Decorative background circle */}
                <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full bg-amber-400/10 blur-2xl pointer-events-none"></div>
              </div>

              {/* Search & Statistics Filter Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm bản nháp theo chức danh, mã yêu cầu, phòng ban..."
                    value={draftSearch}
                    onChange={(e) => setDraftSearch(e.target.value)}
                    className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20 transition-all"
                  />
                  {draftSearch && (
                    <button
                      type="button"
                      onClick={() => setDraftSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-500">
                  <span>
                    Hiển thị <strong>{draftRequisitions.length}</strong> / <strong>{draftCount}</strong> bản nháp
                  </span>
                  <span className="hidden md:inline text-slate-200">|</span>
                  <span className="hidden md:inline text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60 font-medium">
                    🔒 Lưu bảo mật cá nhân
                  </span>
                </div>
              </div>

              {/* Draft List Content */}
              {draftRequisitions.length === 0 ? (
                /* Empty State */
                <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-100/80">
                    <FileEdit className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    {draftSearch ? "Không tìm thấy bản nháp phù hợp" : "Bạn hiện không có bản nháp nào"}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
                    {draftSearch
                      ? `Không có bản nháp nào khớp với từ khóa tìm kiếm "${draftSearch}". Vui lòng thử tìm với từ khóa khác.`
                      : "Tất cả yêu cầu tuyển dụng của bạn đã được gửi phê duyệt hoặc bạn chưa lưu nháp yêu cầu nào."}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap justify-center">
                    {draftSearch ? (
                      <button
                        type="button"
                        onClick={() => setDraftSearch("")}
                        className="px-5 py-2.5 rounded-full border border-gray-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                      >
                        Xóa bộ lọc tìm kiếm
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleOpenCreateModal}
                        className="px-5 py-2.5 rounded-full bg-[#4285F4] text-white hover:bg-blue-600 text-xs font-semibold shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tạo yêu cầu mới ngay</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveNavMenu("requisitions")}
                      className="px-5 py-2.5 rounded-full border border-gray-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                    >
                      Xem danh sách đã gửi duyệt
                    </button>
                  </div>
                </div>
              ) : (
                /* Cards List of Drafts */
                <div className="grid grid-cols-1 gap-4 sm:gap-5">
                  {draftRequisitions.map((draft) => (
                    <div
                      key={draft.id}
                      className="bg-white rounded-3xl border border-gray-100 p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-lg transition-all duration-200 border-l-4 border-l-amber-400 flex flex-col gap-4 relative group"
                    >
                      {/* Top Header of Card */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                            {draft.id}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Bản nháp (Chưa gửi duyệt)
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Lưu ngày: {draft.createdAt}
                          </span>
                        </div>

                        {/* Action buttons: Nút "Chỉnh sửa" nổi bật màu xanh dương */}
                        <div className="flex items-center gap-2.5 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleEditDraft(draft.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#4285F4] bg-blue-50 hover:bg-[#4285F4] hover:text-white border border-blue-200/80 transition-all cursor-pointer shadow-xs group/btn"
                            title="Mở lại form để chỉnh sửa và gửi duyệt"
                          >
                            <Edit3 className="w-4 h-4 text-[#4285F4] group-hover/btn:text-white transition-colors" />
                            <span>Chỉnh sửa</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteDraft(draft.id, draft.title)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-gray-100 hover:border-rose-100 transition-all cursor-pointer"
                            title="Xóa bản nháp này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Title and details */}
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#4285F4] transition-colors">
                          {draft.title || "Yêu cầu tuyển dụng chưa đặt tên"}
                        </h3>

                        {/* Metadata Grid */}
                        <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
                          <div className="p-3 rounded-2xl bg-slate-50/80 border border-gray-100">
                            <span className="text-slate-400 block text-[11px] font-medium mb-0.5">Phòng ban</span>
                            <span className="font-semibold text-slate-700 line-clamp-1">{draft.department}</span>
                          </div>
                          <div className="p-3 rounded-2xl bg-slate-50/80 border border-gray-100">
                            <span className="text-slate-400 block text-[11px] font-medium mb-0.5">Cấp bậc & Hình thức</span>
                            <span className="font-semibold text-slate-700">{draft.level} • {draft.workType || "Toàn thời gian"}</span>
                          </div>
                          <div className="p-3 rounded-2xl bg-slate-50/80 border border-gray-100">
                            <span className="text-slate-400 block text-[11px] font-medium mb-0.5">Chỉ tiêu / Hạn cần</span>
                            <span className="font-semibold text-slate-700">
                              {draft.targetCount} nhân sự • {draft.deadline || "Chưa chọn ngày"}
                            </span>
                          </div>
                          <div className="p-3 rounded-2xl bg-slate-50/80 border border-gray-100">
                            <span className="text-slate-400 block text-[11px] font-medium mb-0.5">Lương đề xuất</span>
                            <span className="font-bold text-[#4285F4]">
                              {draft.proposedSalary
                                ? new Intl.NumberFormat("vi-VN").format(draft.proposedSalary) + " VNĐ"
                                : draft.salaryRange || "Thỏa thuận"}
                            </span>
                          </div>
                        </div>

                        {/* Lý do tuyển & Giải trình lương nếu có */}
                        {(draft.recruitmentReason || draft.salaryJustification) && (
                          <div className="mt-3 flex flex-wrap gap-2 text-xs">
                            {draft.recruitmentReason && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50/80 text-blue-900 border border-blue-100/80 font-medium">
                                <span className="text-blue-600 font-bold">Lý do:</span>
                                <span>{draft.recruitmentReason}</span>
                                {draft.recruitmentReasonDetail && (
                                  <span className="text-blue-700">({draft.recruitmentReasonDetail})</span>
                                )}
                              </span>
                            )}
                            {draft.salaryJustification && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50/80 text-amber-900 border border-amber-200/80 font-medium">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span className="text-amber-700 font-bold">Giải trình lương:</span>
                                <span className="line-clamp-1">{draft.salaryJustification}</span>
                              </span>
                            )}
                          </div>
                        )}

                        {/* JD Description Preview */}
                        {draft.description && (
                          <div className="mt-3 p-3 rounded-2xl bg-slate-50/60 border border-dashed border-gray-200 text-xs text-slate-500">
                            <span className="font-bold text-slate-700 block mb-0.5">Mô tả công việc (JD tóm tắt):</span>
                            <p className="line-clamp-2 leading-relaxed">
                              {draft.description.replace(/\*\*/g, "").replace(/\*/g, "").replace(/<u>/g, "").replace(/<\/u>/g, "")}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Card Bottom Quick Note */}
                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-gray-100/60">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-slate-400" />
                          Nhấn <strong>"Chỉnh sửa"</strong> để mở lại form với toàn bộ thông tin đã lưu nháp và gửi phê duyệt.
                        </span>
                        <button
                          type="button"
                          onClick={() => handleEditDraft(draft.id)}
                          className="text-xs font-bold text-[#4285F4] hover:underline inline-flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                        >
                          <span>Mở form chỉnh sửa & gửi duyệt</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeNavMenu === "interviews" ? (
            /* ========================================================================= */
            /* GIAO DIỆN "LỊCH PHỎNG VẤN CỦA TÔI" (DEDICATED INTERVIEWS VIEW) */
            /* ========================================================================= */
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
              {/* Top Navigation & Breadcrumb */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveNavMenu("overview")}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#4285F4] transition-all cursor-pointer group"
                >
                  <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
                  <span>Quay lại Bảng điều khiển chính</span>
                </button>

                <span className="text-xs text-slate-400 font-medium">
                  Trưởng Bộ Phận / Lịch phỏng vấn của tôi
                </span>
              </div>

              {/* Header Banner for Interviews */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 sm:p-8 rounded-[32px] text-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative overflow-hidden">
                <div className="flex items-start sm:items-center gap-4 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 text-blue-300 backdrop-blur-md border border-white/15 flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/30">
                    <Calendar className="w-7 h-7 text-blue-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        Lịch Phỏng Vấn Của Tôi
                      </h1>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 shadow-xs">
                        {upcomingInterviewsCount} buổi sắp diễn ra
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-blue-100/80 mt-1.5 leading-relaxed max-w-2xl">
                      Theo dõi, điều phối và trực tiếp tham gia đánh giá năng lực chuyên môn của ứng viên Shortlist theo định biên tuyển dụng.
                    </p>
                  </div>
                </div>

                {/* Quick metrics in banner */}
                <div className="flex items-center gap-2.5 relative z-10 shrink-0 self-start sm:self-center">
                  <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
                    <span className="block text-lg font-black text-white leading-tight">
                      {interviews.filter((i) => i.date === "2026-10-03" && i.status === "UPCOMING").length}
                    </span>
                    <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Hôm nay</span>
                  </div>
                  <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
                    <span className="block text-lg font-black text-white leading-tight">
                      {upcomingInterviewsCount}
                    </span>
                    <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Tuần này</span>
                  </div>
                </div>

                {/* Decorative background circle */}
                <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full bg-blue-500/10 blur-2xl pointer-events-none"></div>
              </div>

              {/* Toolbar & Filters (Flexbox ngang) */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                {/* 1. View Mode Tabs: "Sắp tới", "Đã hoàn thành", "Đã hủy" */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setInterviewTab("UPCOMING");
                      setSelectedDateFilter("");
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      interviewTab === "UPCOMING"
                        ? "bg-[#4285F4] text-white shadow-sm shadow-blue-500/25"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>Sắp tới</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        interviewTab === "UPCOMING"
                          ? "bg-white/20 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {upcomingInterviewsCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setInterviewTab("COMPLETED");
                      setSelectedDateFilter("");
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      interviewTab === "COMPLETED"
                        ? "bg-[#4285F4] text-white shadow-sm shadow-blue-500/25"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>Đã hoàn thành</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        interviewTab === "COMPLETED"
                          ? "bg-white/20 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {completedInterviewsCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setInterviewTab("CANCELLED");
                      setSelectedDateFilter("");
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      interviewTab === "CANCELLED"
                        ? "bg-[#4285F4] text-white shadow-sm shadow-blue-500/25"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>Đã hủy</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        interviewTab === "CANCELLED"
                          ? "bg-white/20 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {cancelledInterviewsCount}
                    </span>
                  </button>
                </div>

                {/* 2. Right Filters: Time Filter + Datepicker + Search */}
                <div className="flex flex-wrap items-center gap-2.5 justify-start lg:justify-end flex-1">
                  {/* Quick Time Filter Pills */}
                  <div className="flex items-center gap-1 bg-slate-50 border border-gray-200 rounded-xl p-1 text-xs font-semibold">
                    {[
                      { key: "ALL", label: "Tất cả" },
                      { key: "TODAY", label: "Hôm nay" },
                      { key: "WEEK", label: "Tuần này" },
                      { key: "MONTH", label: "Tháng này" },
                    ].map((pill) => (
                      <button
                        key={pill.key}
                        type="button"
                        onClick={() => {
                          setInterviewTimeFilter(pill.key as any);
                          setSelectedDateFilter("");
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          !selectedDateFilter && interviewTimeFilter === pill.key
                            ? "bg-white text-[#4285F4] shadow-xs font-bold"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>

                  {/* Small Datepicker Input */}
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="date"
                      value={selectedDateFilter}
                      onChange={(e) => {
                        setSelectedDateFilter(e.target.value);
                        setInterviewTimeFilter("ALL");
                      }}
                      className="bg-transparent text-xs text-slate-700 focus:outline-none cursor-pointer"
                      title="Lọc theo ngày cụ thể"
                    />
                    {selectedDateFilter && (
                      <button
                        type="button"
                        onClick={() => setSelectedDateFilter("")}
                        className="text-slate-400 hover:text-slate-600 text-xs ml-0.5 cursor-pointer"
                        title="Xóa lọc theo ngày"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Search Input */}
                  <div className="relative min-w-[190px] sm:min-w-[220px]">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm ứng viên, vị trí..."
                      value={interviewSearch}
                      onChange={(e) => setInterviewSearch(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20 transition-all"
                    />
                    {interviewSearch && (
                      <button
                        type="button"
                        onClick={() => setInterviewSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Grouped Interviews List (Nhóm theo ngày) */}
              {groupedInterviews.length === 0 ? (
                /* Empty State */
                <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#4285F4] flex items-center justify-center mb-4 border border-blue-100/80">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    {interviewSearch || selectedDateFilter || interviewTimeFilter !== "ALL"
                      ? "Không tìm thấy lịch phỏng vấn phù hợp"
                      : "Không có lịch phỏng vấn nào"}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
                    {interviewSearch || selectedDateFilter || interviewTimeFilter !== "ALL"
                      ? "Không có buổi phỏng vấn nào khớp với bộ lọc tìm kiếm hiện tại. Vui lòng thử xóa bộ lọc để xem toàn bộ lịch."
                      : interviewTab === "UPCOMING"
                      ? "Hiện tại không có buổi phỏng vấn nào sắp diễn ra trong giai đoạn này."
                      : interviewTab === "COMPLETED"
                      ? "Chưa có buổi phỏng vấn nào trong danh sách đã hoàn thành."
                      : "Không có buổi phỏng vấn nào bị hủy bỏ."}
                  </p>
                  {(interviewSearch || selectedDateFilter || interviewTimeFilter !== "ALL") && (
                    <button
                      type="button"
                      onClick={() => {
                        setInterviewSearch("");
                        setSelectedDateFilter("");
                        setInterviewTimeFilter("ALL");
                      }}
                      className="px-5 py-2.5 rounded-full border border-gray-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                    >
                      Xóa tất cả bộ lọc
                    </button>
                  )}
                </div>
              ) : (
                /* Grouped list */
                <div className="space-y-6">
                  {groupedInterviews.map((group) => (
                    <div key={group.date} className="space-y-3">
                      {/* Dòng phân cách mờ nhóm theo ngày */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-slate-100/80 border border-slate-200/60 px-3.5 py-1.5 rounded-full shadow-xs">
                          <Calendar className="w-3.5 h-3.5 text-[#4285F4]" />
                          <span className="text-xs font-bold text-slate-800 tracking-wide">
                            {group.label}
                          </span>
                          <span className="text-[11px] font-bold text-[#4285F4] bg-white px-2 py-0.5 rounded-full border border-blue-100">
                            {group.items.length} buổi
                          </span>
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-r from-gray-200/90 to-transparent"></div>
                      </div>

                      {/* Danh sách các thẻ phỏng vấn trong ngày */}
                      <div className="space-y-3.5">
                        {group.items.map((interview) => (
                          <div
                            key={interview.id}
                            className="bg-white rounded-2xl border border-gray-100/90 hover:border-blue-200 p-5 sm:p-6 hover:shadow-md transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-5 group"
                          >
                            {/* Cột Trái (Thời gian & Hình thức) */}
                            <div className="flex sm:flex-col items-start justify-between sm:justify-center gap-2 sm:gap-2.5 sm:w-48 shrink-0 pb-3 sm:pb-0 border-b sm:border-b-0 sm:border-r border-gray-100 sm:pr-5">
                              <div>
                                <div className="flex items-center gap-1.5 text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                                  <Clock className="w-4 h-4 text-[#4285F4] shrink-0" />
                                  <span>{interview.time}</span>
                                </div>
                                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                  Thời lượng: 60 phút
                                </p>
                              </div>

                              {/* Badge Hình thức */}
                              {interview.type === "ONLINE" ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 shadow-xs">
                                  <Video className="w-3.5 h-3.5 text-[#4285F4]" />
                                  <span>Online (Microsoft Teams)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200/60 shadow-xs">
                                  <MapPin className="w-3.5 h-3.5 text-orange-500" />
                                  <span>Trực tiếp ({interview.room || "Phòng họp tầng 3"})</span>
                                </span>
                              )}
                            </div>

                            {/* Cột Giữa (Thông tin Ứng viên & Hội đồng) */}
                            <div className="flex-1 min-w-0 flex flex-col gap-3">
                              <div className="flex items-start gap-3.5">
                                <div
                                  className={`w-12 h-12 rounded-2xl ${interview.candidateAvatarColor} text-white flex items-center justify-center font-bold text-base shrink-0 shadow-sm`}
                                >
                                  {interview.candidateName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .slice(-2)
                                    .join("")}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                    <h3 className="text-base font-bold text-slate-900 group-hover:text-[#4285F4] transition-colors">
                                      {interview.candidateName}
                                    </h3>
                                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                                      {interview.round}
                                    </span>
                                  </div>
                                  <p className="text-xs font-medium text-slate-600 mt-0.5">
                                    Vị trí: <strong className="text-slate-800">{interview.positionTitle}</strong>
                                  </p>
                                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                                    <span>{interview.candidateEmail}</span>
                                    <span>•</span>
                                    <span>{interview.candidatePhone}</span>
                                  </p>
                                </div>
                              </div>

                              {/* Ghi chú trọng tâm phỏng vấn (nếu có) */}
                              {interview.notes && (
                                <p className="text-xs text-slate-500 bg-slate-50/70 p-2 rounded-xl border border-gray-100/80 line-clamp-1 italic">
                                  💡 {interview.notes}
                                </p>
                              )}

                              {/* Hội đồng phỏng vấn (Avatar Group xếp chồng nhau) */}
                              <div className="flex items-center gap-2.5 pt-1 border-t border-gray-50 text-xs">
                                <span className="text-slate-400 font-medium text-[11px] shrink-0">
                                  Hội đồng:
                                </span>
                                <div className="flex items-center -space-x-2 overflow-hidden shrink-0">
                                  {interview.interviewers.map((inv, idx) => (
                                    <div
                                      key={idx}
                                      className={`w-7 h-7 rounded-full ${inv.avatarColor} text-white font-bold text-[10px] flex items-center justify-center border-2 border-white shadow-xs cursor-pointer hover:z-10 hover:scale-110 transition-transform`}
                                      title={`${inv.name} (${inv.role})`}
                                    >
                                      {inv.initials}
                                    </div>
                                  ))}
                                </div>
                                <span className="text-slate-600 text-[11px] font-medium truncate">
                                  {interview.interviewers.map((i) => i.name).join(", ")}
                                </span>
                              </div>
                            </div>

                            {/* Cột Phải (Hành động: Xem CV, Tham gia, Đánh giá) */}
                            <div className="flex flex-wrap sm:flex-nowrap lg:flex-col xl:flex-row items-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100 justify-end">
                              {/* Nút "Xem CV": Nền xám nhạt, viền không, chữ xám đậm */}
                              <button
                                type="button"
                                onClick={() => handleViewCv(interview)}
                                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                                title="Xem hồ sơ ứng viên"
                              >
                                <FileText className="w-3.5 h-3.5 text-slate-500" />
                                <span>Xem CV</span>
                              </button>

                              {/* Nút "Tham gia" (Chỉ hiện nếu là Online): Nền xanh dương #4285F4, chữ trắng kèm icon Video */}
                              {interview.type === "ONLINE" && interview.status !== "CANCELLED" && (
                                <button
                                  type="button"
                                  onClick={() => handleJoinMeeting(interview)}
                                  className="px-4 py-2 rounded-xl bg-[#4285F4] hover:bg-blue-600 text-white font-semibold text-xs transition-all shadow-sm shadow-blue-500/25 cursor-pointer inline-flex items-center gap-1.5"
                                  title="Mở phòng họp trực tuyến Microsoft Teams"
                                >
                                  <Video className="w-3.5 h-3.5" />
                                  <span>Tham gia</span>
                                </button>
                              )}

                              {/* Nút "Đánh giá": Nền xanh lá, chữ trắng để Trưởng bộ phận mở form điền điểm */}
                              {interview.status !== "CANCELLED" && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEvaluation(interview)}
                                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                                    interview.feedbackStatus === "SUBMITTED"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100"
                                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20"
                                  }`}
                                  title="Chấm điểm & Nhận xét phỏng vấn"
                                >
                                  <Award className="w-3.5 h-3.5" />
                                  <span>
                                    {interview.feedbackStatus === "SUBMITTED"
                                      ? `Đã chấm: ${interview.score}/10`
                                      : "Đánh giá"}
                                  </span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Banner Welcome & Fast Summary: Cấu trúc flex justify-between items-center, lời chào bên trái */}
          <div id="section-overview" className="flex justify-between items-center bg-gradient-to-r from-blue-900 to-indigo-900 rounded-[32px] p-6 sm:p-8 text-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative overflow-hidden">
            <div className="relative z-10 max-w-3xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-blue-200 backdrop-blur-sm border border-white/10 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                Cổng Điều Phối Tuyển Dụng Bộ Phận
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Xin chào, {managerProfile.name}! 👋
              </h1>
              <p className="text-sm text-blue-100 mt-2 leading-relaxed">
                Bạn có <span className="font-bold text-white underline">{pendingCandidates} ứng viên Shortlist</span> đã qua 2 vòng phỏng vấn đang chờ quyết định chốt tuyển.
              </p>
            </div>

            {/* Decorative Background Circles */}
            <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-blue-500/10 blur-2xl pointer-events-none"></div>
            <div className="absolute right-40 -top-10 w-48 h-48 rounded-full bg-indigo-500/10 blur-xl pointer-events-none"></div>
          </div>

          {/* 4 Metric Cards (Bo tròn rounded-[32px]) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Tổng yêu cầu */}
          <div className="bg-[#ffffff] rounded-[32px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Tổng yêu cầu tuyển
              </span>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#4285F4] flex items-center justify-center">
                <Briefcase className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {totalRequisitions}
              </span>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                Vị trí
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Bao gồm cả các yêu cầu đang mở tuyển và dự thảo
            </p>
          </div>

          {/* Card 2: Đang mở tuyển */}
          <div className="bg-[#ffffff] rounded-[32px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Vị trí đang tuyển
              </span>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-600 tracking-tight">
                {activeRequisitions}
              </span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Đang nhận CV
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              HR đang tích cực lọc hồ sơ và phỏng vấn vòng 1
            </p>
          </div>

          {/* Card 3: Ứng viên Shortlist chờ duyệt */}
          <div className="bg-[#ffffff] rounded-[32px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Ứng viên Shortlist
              </span>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-600 tracking-tight">
                {pendingCandidates}
              </span>
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                Chờ quyết định
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Đã hoàn thành 2 vòng phỏng vấn chuyên môn
            </p>
          </div>

          {/* Card 4: Đã chốt tuyển */}
          <div className="bg-[#ffffff] rounded-[32px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Đã chốt tuyển dụng
              </span>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-purple-600 tracking-tight">
                {hiredCandidates}
              </span>
              <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                Thành công
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Đã chấp nhận Offer và chuẩn bị gia nhập bộ phận
            </p>
          </div>
        </div>

        {/* Banner nhắc nhở Bản nháp chưa gửi duyệt (nếu có) */}
        {draftCount > 0 && (
          <div className="p-4 sm:p-5 rounded-3xl bg-blue-50/80 border border-blue-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#4285F4] text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
                <FileClock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-blue-900">
                  Bạn đang có {draftCount} bản nháp yêu cầu tuyển dụng chưa gửi duyệt
                </p>
                <p className="text-xs text-blue-700/80 mt-0.5">
                  Các bản nháp được lưu riêng và ẩn hoàn toàn khỏi danh sách chính dưới đây để tránh gửi nhầm.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveNavMenu("drafts");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="px-5 py-2 rounded-full bg-white hover:bg-blue-100/70 text-[#4285F4] border border-blue-200 text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 inline-flex items-center gap-1.5"
            >
              <span>Xem và gửi duyệt ({draftCount})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PHẦN 1: THEO DÕI TIẾN ĐỘ TUYỂN DỤNG (TIẾN ĐỘ CỦA VỊ TRÍ MÌNH SỞ HỮU) */}
        {/* ========================================================================= */}
        <section id="section-requisitions" className="bg-white rounded-3xl sm:rounded-[32px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          {/* Section Header */}
          <div className="p-6 sm:p-8 border-b border-gray-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 w-full">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#4285F4] flex items-center justify-center font-bold text-sm shadow-sm border border-blue-100/60">
                  1
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Theo Dõi Tiến Độ Tuyển Dụng
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1 pl-11">
                Tiến độ của các vị trí tuyển dụng bạn đang sở hữu (đã gửi duyệt). Theo dõi phễu tuyển dụng từ Chỉ tiêu đến Chốt tuyển dụng.
              </p>
            </div>

            {/* Toolbar Buttons, Search & Filter */}
            <div className="flex flex-wrap items-center justify-start xl:justify-end gap-3 w-full xl:w-auto">
              {/* View Mode Toggle (Cards vs Table) */}
              <div className="inline-flex items-center p-1 bg-slate-100 rounded-full border border-gray-200 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setReqViewMode("cards")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                    reqViewMode === "cards"
                      ? "bg-white text-[#4285F4] shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Xem dạng thẻ (Cards)"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Dạng thẻ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReqViewMode("table")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                    reqViewMode === "table"
                      ? "bg-white text-[#4285F4] shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Xem dạng bảng (Table)"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Dạng bảng</span>
                </button>
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-48 xl:w-52 shrink-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={reqSearch}
                  onChange={(e) => setReqSearch(e.target.value)}
                  placeholder="Tìm tên vị trí..."
                  className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-gray-200 rounded-full text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                />
              </div>

              {/* Status Filter (Chỉ các trạng thái đã gửi duyệt) */}
              <div className="relative shrink-0">
                <select
                  value={reqStatusFilter}
                  onChange={(e) => setReqStatusFilter(e.target.value)}
                  className="appearance-none bg-slate-50 border border-gray-200 rounded-full pl-3.5 pr-8 py-2 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 cursor-pointer"
                >
                  <option value="ALL">Tất cả trạng thái (Đã gửi)</option>
                  <option value="Active">Đang tuyển</option>
                  <option value="Pending">Chờ duyệt</option>
                  <option value="Closed">Đã đóng</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Nút: Sao chép yêu cầu cũ */}
              <button
                type="button"
                onClick={() => handleOpenCloneModal()}
                className="inline-flex items-center gap-1.5 border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-[#4285F4] px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-sm shrink-0 whitespace-nowrap"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Sao chép</span>
              </button>

              {/* Nút: Tạo yêu cầu tuyển dụng */}
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="bg-[#4285F4] hover:bg-blue-600 text-white px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-all shadow-sm shadow-blue-500/20 cursor-pointer shrink-0 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tạo yêu cầu</span>
              </button>
            </div>
          </div>

          {/* Body Content: Dạng Thẻ (Cards) hoặc Dạng Bảng (Table) */}
          {filteredRequisitions.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Briefcase className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-slate-700 text-base">
                Không tìm thấy yêu cầu tuyển dụng nào phù hợp
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Hãy thử tìm kiếm với từ khóa khác hoặc tạo một yêu cầu tuyển dụng mới cho bộ phận của bạn.
              </p>
            </div>
          ) : reqViewMode === "cards" ? (
            /* =============================================================== */
            /* DANH SÁCH THẺ (CARDS) CHI TIẾT CÓ THANH TIẾN ĐỘ PHỄU TUYỂN DỤNG */
            /* =============================================================== */
            <div className="p-6 sm:p-8 bg-slate-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredRequisitions.map((req) => {
                  const hired = req.hiredCount ?? 0;
                  const target = req.targetCount || 1;
                  const interviewing = req.interviewingCount ?? 0;
                  const received = req.receivedCount || 0;
                  const percentage = Math.min(100, Math.round((hired / target) * 100));

                  return (
                    <div
                      key={req.id}
                      className="bg-white rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between group relative overflow-hidden"
                    >
                      {/* Top Card Row: Title, Department, Status */}
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60">
                                {req.id}
                              </span>
                              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-blue-50 text-[#4285F4] border border-blue-100">
                                {req.level}
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#4285F4] transition-colors leading-snug">
                              {req.title}
                            </h3>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 font-medium">
                              <Building className="w-3.5 h-3.5 text-slate-400" />
                              <span>{req.department}</span>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="shrink-0">
                            {req.status === "Active" ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Đang tuyển
                              </span>
                            ) : req.status === "Pending" ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                Chờ duyệt
                              </span>
                            ) : req.status === "Closed" ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                Đã đóng
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <span className="w-2 h-2 rounded-full bg-[#4285F4]"></span>
                                Bản nháp
                              </span>
                            )}
                          </div>
                        </div>

                        {/* ======================================================== */}
                        {/* PHỄU TUYỂN DỤNG VÀ THANH TIẾN ĐỘ (PROGRESS BAR #4285F4) */}
                        {/* ======================================================== */}
                        <div className="mt-5 p-4 rounded-2xl bg-slate-50/80 border border-gray-100">
                          {/* Funnel 4 Stages Grid */}
                          <div className="grid grid-cols-4 gap-2 text-center pb-3 border-b border-gray-200/60">
                            {/* 1. Chỉ tiêu */}
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-tight">
                                Chỉ tiêu
                              </span>
                              <span className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5">
                                {target}
                              </span>
                              <span className="text-[10px] text-slate-400 hidden sm:inline">Cần tuyển</span>
                            </div>

                            {/* 2. Đã nộp CV */}
                            <div className="flex flex-col items-center border-l border-gray-200/60">
                              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-tight">
                                Đã nộp CV
                              </span>
                              <span className="text-sm sm:text-base font-extrabold text-blue-600 mt-0.5">
                                {received}
                              </span>
                              <span className="text-[10px] text-slate-400 hidden sm:inline">Hồ sơ</span>
                            </div>

                            {/* 3. Đang phỏng vấn */}
                            <div className="flex flex-col items-center border-l border-gray-200/60">
                              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-tight">
                                Đang PV
                              </span>
                              <span className="text-sm sm:text-base font-extrabold text-amber-600 mt-0.5">
                                {interviewing}
                              </span>
                              <span className="text-[10px] text-slate-400 hidden sm:inline">Ứng viên</span>
                            </div>

                            {/* 4. Đã chốt */}
                            <div className="flex flex-col items-center border-l border-gray-200/60">
                              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-tight">
                                Đã chốt
                              </span>
                              <span className="text-sm sm:text-base font-extrabold text-emerald-600 mt-0.5">
                                {hired}
                              </span>
                              <span className="text-[10px] text-slate-400 hidden sm:inline">Offer</span>
                            </div>
                          </div>

                          {/* Progress Bar with Color #4285F4 */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="text-slate-600 font-medium">
                                Phễu: <strong className="text-slate-900">Chỉ tiêu ({target})</strong> - Đã nộp CV ({received}) - Đang PV ({interviewing}) - <strong className="text-[#4285F4]">Đã chốt ({hired})</strong>
                              </span>
                              <span className="font-bold text-[#4285F4] text-xs">
                                {percentage}%
                              </span>
                            </div>
                            {/* Main Progress Bar using #4285F4 */}
                            <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden p-0.5 shadow-inner">
                              <div
                                className="h-full rounded-full transition-all duration-700 shadow-sm"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: "#4285F4",
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Extra details: Salary & Deadline */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-gray-100 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5 font-medium">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{req.salaryRange}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>Hạn: <strong className="text-slate-700">{req.deadline}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Card Actions Footer */}
                      <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenCloneModal(req.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4285F4] hover:text-blue-700 py-1.5 px-2.5 rounded-lg hover:bg-blue-50/70 transition-all cursor-pointer"
                            title="Sao chép yêu cầu này"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Nhân bản</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenApprovalWorkflow("REQUISITION", req.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 py-1.5 px-2.5 rounded-lg hover:bg-emerald-50/70 transition-all cursor-pointer"
                            title="Xem chuỗi cấp duyệt và nhật ký thẩm định (Audit Trail)"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Chuỗi duyệt</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setCandidatePosFilter(req.id);
                            showToast(`Đang lọc ứng viên vị trí: ${req.title}`);
                            const section2 = document.getElementById("candidate-decision-section");
                            if (section2) {
                              section2.scrollIntoView({ behavior: "smooth" });
                            }
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 py-1.5 px-3.5 rounded-full transition-all cursor-pointer shrink-0"
                        >
                          <span>Xem ứng viên</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* =============================================================== */
            /* BẢNG THEO DÕI TIẾN ĐỘ TUYỂN DỤNG (TABLE VIEW)                    */
            /* =============================================================== */
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[950px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-gray-100 text-[13px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-4 px-6">Mã & Vị trí tuyển dụng</th>
                    <th className="py-4 px-6">Trạng thái</th>
                    <th className="py-4 px-6">Phễu tuyển dụng & Tiến độ (#4285F4)</th>
                    <th className="py-4 px-6">Mức lương dự kiến</th>
                    <th className="py-4 px-6">Hạn chót</th>
                    <th className="py-4 px-6 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredRequisitions.map((req, idx) => {
                    const hired = req.hiredCount ?? 0;
                    const target = req.targetCount || 1;
                    const interviewing = req.interviewingCount ?? 0;
                    const received = req.receivedCount || 0;
                    const percentage = Math.min(100, Math.round((hired / target) * 100));

                    return (
                      <tr
                        key={req.id}
                        className={`hover:bg-blue-50/30 transition-colors ${
                          idx % 2 === 1 ? "bg-slate-50/50" : "bg-white"
                        }`}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              {req.id}
                            </span>
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-50 text-[#4285F4]">
                              {req.level}
                            </span>
                          </div>
                          <p className="font-bold text-slate-900">{req.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{req.department}</p>
                        </td>

                        <td className="py-4 px-6 whitespace-nowrap">
                          {req.status === "Active" ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Đang tuyển
                            </span>
                          ) : req.status === "Pending" ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Chờ duyệt
                            </span>
                          ) : req.status === "Closed" ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              Đã đóng
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4]"></span>
                              Bản nháp
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6 min-w-[280px]">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-600 font-medium">
                              Chỉ tiêu: <strong className="text-slate-900">{target}</strong> | CV: {received} | PV: {interviewing} | Chốt: <strong className="text-[#4285F4]">{hired}</strong>
                            </span>
                            <span className="font-bold text-[#4285F4] text-xs">
                              {percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: "#4285F4",
                              }}
                            />
                          </div>
                        </td>

                        <td className="py-4 px-6 text-slate-700 font-medium whitespace-nowrap">
                          {req.salaryRange}
                        </td>

                        <td className="py-4 px-6 text-slate-500 whitespace-nowrap text-xs">
                          {req.deadline}
                        </td>

                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenCloneModal(req.id)}
                              className="p-1.5 text-slate-400 hover:text-[#4285F4] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Sao chép yêu cầu này"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenApprovalWorkflow("REQUISITION", req.id)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Xem chuỗi cấp duyệt & Audit Trail"
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCandidatePosFilter(req.id);
                                showToast(`Đang lọc ứng viên vị trí: ${req.title}`);
                                const section2 = document.getElementById("candidate-decision-section");
                                if (section2) {
                                  section2.scrollIntoView({ behavior: "smooth" });
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Xem ứng viên"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* PHẦN 2: BẢNG SO SÁNH ỨNG VIÊN & RA QUYẾT ĐỊNH (SAU PHỎNG VẤN)             */}
        {/* ========================================================================= */}
        <section
          id="candidate-decision-section"
          className="bg-white rounded-3xl sm:rounded-[32px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden"
        >
          {/* Section Header */}
          <div className="p-6 sm:p-8 border-b border-gray-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 w-full">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shadow-sm border border-emerald-100/60">
                  2
                </div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Đánh Giá & Quyết Định Ứng Viên
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1 pl-11">
                Bảng so sánh chi tiết kết quả các vòng phỏng vấn của các ứng viên vòng cuối. Trưởng bộ phận trực tiếp đối chiếu và đưa ra quyết định tuyển dụng.
              </p>
            </div>

            {/* Controls & Filters */}
            <div className="flex flex-wrap items-center justify-start xl:justify-end gap-3 w-full xl:w-auto">
              {/* Toggle Table vs Side-by-Side Grid */}
              <div className="inline-flex items-center p-1 bg-slate-100 rounded-full border border-gray-200 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setCandidateViewMode("table")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                    candidateViewMode === "table"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Xem dạng bảng so sánh đối chiếu"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Bảng so sánh</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCandidateViewMode("grid")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
                    candidateViewMode === "grid"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Xem dạng lưới Side-by-side"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lưới so sánh</span>
                </button>
              </div>

              {/* Search candidate */}
              <div className="relative w-full sm:w-48 xl:w-52 shrink-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  placeholder="Tìm tên ứng viên..."
                  className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-gray-200 rounded-full text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              {/* Filter by Position */}
              <div className="relative">
                <select
                  value={candidatePosFilter}
                  onChange={(e) => setCandidatePosFilter(e.target.value)}
                  className="appearance-none bg-slate-50 border border-gray-200 rounded-full pl-3.5 pr-8 py-2 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer max-w-[190px] truncate"
                >
                  <option value="ALL">Tất cả vị trí</option>
                  {requisitions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Filter by Decision */}
              <div className="relative">
                <select
                  value={candidateDecisionFilter}
                  onChange={(e) => setCandidateDecisionFilter(e.target.value)}
                  className="appearance-none bg-slate-50 border border-gray-200 rounded-full pl-3.5 pr-8 py-2 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
                >
                  <option value="ALL">Tất cả quyết định</option>
                  <option value="Pending">Chờ quyết định</option>
                  <option value="Hired">Đã chọn tuyển</option>
                  <option value="Rejected">Đã loại</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Candidates Content: Striped Comparison Table hoặc Grid Side-by-Side */}
          {filteredCandidates.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-slate-700 text-base">
                Không tìm thấy ứng viên nào phù hợp
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Hiện chưa có ứng viên nào thuộc tiêu chí lọc được chọn. Vui lòng kiểm tra lại bộ lọc vị trí hoặc trạng thái quyết định.
              </p>
            </div>
          ) : candidateViewMode === "table" ? (
            /* =============================================================== */
            /* BẢNG SO SÁNH ỨNG VIÊN (STRIPED ROWS VÀ BORDER MỀM)             */
            /* =============================================================== */
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-gray-200 text-[12px] sm:text-[13px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-4 px-6 min-w-[240px]">Thông tin ứng viên</th>
                    <th className="py-4 px-6 min-w-[170px]">Kết quả Vòng 1 (Sơ vấn)</th>
                    <th className="py-4 px-6 min-w-[200px]">Kết quả Vòng 2 (PV Chuyên môn)</th>
                    <th className="py-4 px-6 min-w-[260px]">Nhận xét tổng hợp</th>
                    <th className="py-4 px-6 text-center min-w-[230px]">Hành động (Ra quyết định)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100/90 text-sm">
                  {filteredCandidates.map((candidate, idx) => {
                    const starVal = candidate.round2.stars || Number((candidate.round2.score / 2).toFixed(1));

                    return (
                      <tr
                        key={candidate.id}
                        className={`transition-colors hover:bg-blue-50/30 ${
                          idx % 2 === 1 ? "bg-slate-50/60" : "bg-white"
                        }`}
                      >
                        {/* Cột 1: Thông tin ứng viên (Avatar, Tên, Vị trí ứng tuyển) */}
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-3.5">
                            {/* Avatar */}
                            <div className="relative shrink-0">
                              <div
                                className={`w-12 h-12 rounded-2xl ${
                                  candidate.avatarColor || "bg-gradient-to-br from-blue-500 to-indigo-600"
                                } text-white font-bold flex items-center justify-center text-sm shadow-sm`}
                              >
                                {candidate.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .slice(-2)
                                  .join("")}
                              </div>
                              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white"></span>
                            </div>

                            {/* Tên & Vị trí ứng tuyển */}
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                                  {candidate.name}
                                </h4>
                                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                  {candidate.id}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-[#4285F4] mt-0.5">
                                {candidate.positionTitle}
                              </p>
                              <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-1.5">
                                <span>Kinh nghiệm: <strong className="text-slate-700">{candidate.experienceYears} năm</strong></span>
                                <span>•</span>
                                <span>{candidate.email}</span>
                                <span>•</span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenApprovalWorkflow("OFFER", candidate.id)}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200/60"
                                  title="Xem chuỗi cấp duyệt đề xuất tuyển dụng & Audit Trail"
                                >
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                  <span>Chuỗi duyệt Offer</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Cột 2: Kết quả Vòng 1 (Sàng lọc/Sơ vấn) */}
                        <td className="py-5 px-6 align-top">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Check className="w-3 h-3 stroke-[2.5]" />
                                Đạt ({candidate.round1.score}/10)
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2 italic">
                              &ldquo;{candidate.round1.comment}&rdquo;
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              Sơ vấn: {candidate.round1.interviewer}
                            </p>
                          </div>
                        </td>

                        {/* Cột 3: Kết quả Vòng 2 (Phỏng vấn chuyên môn: Điểm trung bình sao) */}
                        <td className="py-5 px-6 align-top">
                          <div className="space-y-1.5">
                            {/* Điểm trung bình sao */}
                            <div className="flex items-center gap-2">
                              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <div className="flex items-center">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      className={`w-3.5 h-3.5 ${
                                        s <= Math.round(starVal)
                                          ? "text-amber-500 fill-amber-500"
                                          : "text-amber-200"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="ml-1 font-extrabold text-xs">
                                  {starVal}/5 sao
                                </span>
                              </div>
                              <span className="text-[11px] font-bold text-slate-600">
                                ({candidate.round2.score}/10)
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2 italic">
                              &ldquo;{candidate.round2.comment}&rdquo;
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              PV chuyên môn: {candidate.round2.interviewer}
                            </p>
                          </div>
                        </td>

                        {/* Cột 4: Nhận xét tổng hợp */}
                        <td className="py-5 px-6 align-top">
                          <div className="space-y-2 max-w-sm">
                            <p className="text-xs text-slate-700 leading-relaxed font-normal bg-slate-50 p-2.5 rounded-xl border border-gray-100">
                              {candidate.overallAssessment}
                            </p>
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className="text-slate-500 font-medium">Mức lương mong muốn:</span>
                              <span className="font-bold text-emerald-700 bg-emerald-50/70 px-2 py-0.5 rounded-md border border-emerald-100">
                                {candidate.proposedSalary}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Cột 5: Hành động (Ra quyết định) */}
                        <td className="py-5 px-6 text-center align-middle whitespace-nowrap">
                          {candidate.decision === "Pending" ? (
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                              {/* Nút: Quyết định Tuyển (Nền màu xanh lá, chữ trắng, icon checkmark) */}
                              <button
                                type="button"
                                onClick={() => handleOpenHireModal(candidate)}
                                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl inline-flex items-center justify-center gap-1.5 shadow-sm shadow-green-600/25 hover:shadow transition-all cursor-pointer"
                              >
                                <Check className="w-4 h-4 text-white stroke-[2.5]" />
                                <span>Quyết định Tuyển</span>
                              </button>

                              {/* Nút: Loại (Trắng viền đỏ hoặc nền đỏ nhạt bg-red-50 text-red-600, có icon X) */}
                              <button
                                type="button"
                                onClick={() => handleOpenRejectModal(candidate)}
                                className="w-full sm:w-auto bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl inline-flex items-center justify-center gap-1.5 hover:border-red-300 transition-all cursor-pointer"
                              >
                                <X className="w-4 h-4 text-red-600 stroke-[2.5]" />
                                <span>Loại</span>
                              </button>
                            </div>
                          ) : candidate.decision === "Hired" ? (
                            <div className="flex flex-col items-center gap-1.5">
                              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200 shadow-xs">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                Đã chọn tuyển
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                Ngày chốt: {candidate.decidedAt}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenHireModal(candidate)}
                                className="text-[11px] text-[#4285F4] hover:underline cursor-pointer font-medium mt-0.5"
                              >
                                Xem & sửa Offer
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1.5">
                              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <XCircle className="w-4 h-4 text-rose-600" />
                                Đã loại
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                Ngày loại: {candidate.decidedAt}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenRejectModal(candidate)}
                                className="text-[11px] text-slate-500 hover:text-slate-800 hover:underline cursor-pointer font-medium mt-0.5"
                              >
                                Xem lý do loại
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* =============================================================== */
            /* DẠNG LƯỚI SO SÁNH (GRID SIDE-BY-SIDE)                          */
            /* =============================================================== */
            <div className="p-6 sm:p-8 bg-slate-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCandidates.map((candidate) => {
                  const starVal = candidate.round2.stars || Number((candidate.round2.score / 2).toFixed(1));

                  return (
                    <div
                      key={candidate.id}
                      className="bg-white rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between"
                    >
                      <div>
                        {/* Candidate Card Top Info */}
                        <div className="flex items-start gap-3.5 mb-4">
                          <div
                            className={`w-14 h-14 rounded-2xl ${
                              candidate.avatarColor || "bg-gradient-to-br from-blue-500 to-indigo-600"
                            } text-white font-bold flex items-center justify-center text-base shadow-sm shrink-0`}
                          >
                            {candidate.name
                              .split(" ")
                              .map((n) => n[0])
                              .slice(-2)
                              .join("")}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                {candidate.id}
                              </span>
                              {candidate.decision === "Hired" ? (
                                <span className="text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                  Đã tuyển
                                </span>
                              ) : candidate.decision === "Rejected" ? (
                                <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                  Đã loại
                                </span>
                              ) : (
                                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  Chờ quyết định
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-slate-900 text-base mt-1 truncate">
                              {candidate.name}
                            </h4>
                            <p className="text-xs font-semibold text-[#4285F4] truncate">
                              {candidate.positionTitle}
                            </p>
                          </div>
                        </div>

                        {/* Multi-round Comparison Details */}
                        <div className="space-y-3 pt-3 border-t border-gray-100 text-xs">
                          {/* Vòng 1 */}
                          <div className="p-3 rounded-xl bg-slate-50 border border-gray-100">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-slate-700">Vòng 1 (Sơ vấn)</span>
                              <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 text-[11px] border border-emerald-200 inline-flex items-center gap-1">
                                <Check className="w-3 h-3 stroke-[2.5]" />
                                Đạt ({candidate.round1.score}/10)
                              </span>
                            </div>
                            <p className="text-slate-600 italic text-[11px]">
                              &ldquo;{candidate.round1.comment}&rdquo;
                            </p>
                          </div>

                          {/* Vòng 2 */}
                          <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-amber-900">Vòng 2 (PV Chuyên môn)</span>
                              <div className="flex items-center gap-1 font-bold text-amber-800 text-[11px]">
                                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                <span>{starVal}/5 sao</span>
                              </div>
                            </div>
                            <p className="text-slate-700 italic text-[11px]">
                              &ldquo;{candidate.round2.comment}&rdquo;
                            </p>
                          </div>

                          {/* Nhận xét tổng hợp */}
                          <div className="p-3 rounded-xl bg-blue-50/30 border border-blue-100/60">
                            <p className="font-semibold text-slate-700 mb-1">Nhận xét tổng hợp:</p>
                            <p className="text-slate-600 text-[11px] leading-relaxed">
                              {candidate.overallAssessment}
                            </p>
                          </div>

                          {/* Lương đề xuất */}
                          <div className="flex items-center justify-between py-1 text-slate-600">
                            <span>Mức lương mong muốn:</span>
                            <span className="font-bold text-emerald-700">{candidate.proposedSalary}</span>
                          </div>

                          {/* Chuỗi cấp duyệt Offer */}
                          <div className="pt-2 border-t border-gray-100 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleOpenApprovalWorkflow("OFFER", candidate.id)}
                              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/70 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-emerald-200/60"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Chuỗi duyệt Offer & Audit</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-5 pt-4 border-t border-gray-100">
                        {candidate.decision === "Pending" ? (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenHireModal(candidate)}
                              className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs py-2.5 rounded-xl inline-flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Quyết định Tuyển</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenRejectModal(candidate)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold text-xs py-2.5 rounded-xl inline-flex items-center justify-center gap-1 transition-all cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Loại</span>
                            </button>
                          </div>
                        ) : candidate.decision === "Hired" ? (
                          <div className="flex items-center justify-between text-xs">
                            <span className="inline-flex items-center gap-1 font-bold text-green-700">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              Đã tuyển ({candidate.decidedAt})
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenHireModal(candidate)}
                              className="text-[#4285F4] hover:underline font-semibold"
                            >
                              Sửa Offer
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-xs">
                            <span className="inline-flex items-center gap-1 font-bold text-rose-700">
                              <XCircle className="w-4 h-4 text-rose-600" />
                              Đã loại ({candidate.decidedAt})
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenRejectModal(candidate)}
                              className="text-slate-500 hover:underline font-semibold"
                            >
                              Xem lý do
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: TẠO YÊU CẦU TUYỂN DỤNG (SPRINT 2 - MODAL LỚN 75-80%) */}
      {/* ========================================================================= */}
      {isCreateReqOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreateReqOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl sm:rounded-[28px] border border-gray-100 shadow-2xl w-full max-w-4xl lg:w-[75vw] max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
            {/* Modal Header */}
            <div className="p-6 sm:p-7 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#4285F4] flex items-center justify-center font-bold shadow-sm border border-blue-100/60">
                  {editingDraftId ? <FileEdit className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                      {editingDraftId ? "Chỉnh Sửa Bản Nháp Yêu Cầu Tuyển Dụng" : "Tạo Yêu Cầu Tuyển Dụng Mới"}
                    </h3>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-[#4285F4] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                      {editingDraftId ? `Bản nháp ${editingDraftId}` : "Sprint 2"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {editingDraftId
                      ? "Cập nhật lại thông tin đã lưu nháp, bạn có thể lưu tiếp bản nháp hoặc gửi yêu cầu phê duyệt ngay."
                      : "Thiết lập thông tin vị trí, tiến độ nhân sự, ngân sách đề xuất và bản mô tả công việc (JD)"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateReqOpen(false);
                  setEditingDraftId(null);
                }}
                className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Form Body */}
            <form
              id="create-requisition-form"
              onSubmit={handleCreateRequisition}
              className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 text-slate-800"
            >
              {/* KHỐI 1: THÔNG TIN CƠ BẢN */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#4285F4] text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                    Thông tin cơ bản vị trí
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Chức danh/Vị trí tuyển dụng */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Chức danh / Vị trí tuyển dụng <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Senior Frontend Developer (React/Next.js), Data Engineer..."
                      value={reqFormData.title}
                      onChange={(e) => {
                        setReqFormData({ ...reqFormData, title: e.target.value });
                        if (reqFormErrors.title) {
                          setReqFormErrors((prev) => {
                            const next = { ...prev };
                            delete next.title;
                            return next;
                          });
                        }
                      }}
                      className={`w-full px-4 py-2.5 bg-slate-50 border ${
                        reqFormErrors.title ? "border-rose-400 ring-2 ring-rose-200" : "border-gray-200"
                      } rounded-xl text-sm focus:outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20 transition-all`}
                    />
                    {reqFormErrors.title && (
                      <p className="text-xs text-rose-600 font-medium mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {reqFormErrors.title}
                      </p>
                    )}
                  </div>

                  {/* Số lượng cần tuyển */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Số lượng cần tuyển <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      required
                      value={reqFormData.targetCount}
                      onChange={(e) =>
                        setReqFormData({
                          ...reqFormData,
                          targetCount: Math.max(1, parseInt(e.target.value) || 1),
                        })
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Phòng ban */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Phòng ban <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={reqFormData.department}
                      onChange={(e) =>
                        setReqFormData({ ...reqFormData, department: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20 transition-all cursor-pointer"
                    >
                      <option value="Phòng Phát Triển Công Nghệ & Phần Mềm">Phòng Phát Triển Công Nghệ & Phần Mềm</option>
                      <option value="Phòng Sản Phẩm & Trải Nghiệm (Product & UI/UX)">Phòng Sản Phẩm & Trải Nghiệm (Product & UI/UX)</option>
                      <option value="Phòng Hạ Tầng Kỹ Thuật & Cloud DevOps">Phòng Hạ Tầng Kỹ Thuật & Cloud DevOps</option>
                      <option value="Phòng Kiểm Thử Chất Lượng (QA/QC)">Phòng Kiểm Thử Chất Lượng (QA/QC)</option>
                      <option value="Phòng Marketing & Truyền Thông">Phòng Marketing & Truyền Thông</option>
                      <option value="Phòng Nhân Sự & Đào Tạo (HR)">Phòng Nhân Sự & Đào Tạo (HR)</option>
                    </select>
                  </div>

                  {/* Cấp bậc */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Cấp bậc (Level) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={reqFormData.level}
                      onChange={(e) =>
                        setReqFormData({
                          ...reqFormData,
                          level: e.target.value as JobRequisition["level"],
                        })
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20 transition-all cursor-pointer"
                    >
                      <option value="Junior">Junior (1-2 năm kinh nghiệm)</option>
                      <option value="Middle">Middle (2-4 năm kinh nghiệm)</option>
                      <option value="Senior">Senior (4+ năm kinh nghiệm)</option>
                      <option value="Lead">Team Lead / Tech Lead</option>
                      <option value="Manager">Quản lý / Manager</option>
                    </select>
                  </div>

                  {/* Hình thức làm việc */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Hình thức làm việc
                    </label>
                    <select
                      value={reqFormData.workType}
                      onChange={(e) =>
                        setReqFormData({ ...reqFormData, workType: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20 transition-all cursor-pointer"
                    >
                      <option value="Toàn thời gian (Full-time)">Toàn thời gian (Full-time)</option>
                      <option value="Linh hoạt (Hybrid)">Linh hoạt (Hybrid)</option>
                      <option value="Làm việc từ xa (Remote)">Làm việc từ xa (Remote)</option>
                      <option value="Bán thời gian (Part-time)">Bán thời gian (Part-time)</option>
                    </select>
                  </div>
                </div>

                {/* Lý do tuyển nhân sự (Trường bắt buộc) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Lý do tuyển nhân sự <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={reqFormData.recruitmentReason}
                      onChange={(e) =>
                        setReqFormData({ ...reqFormData, recruitmentReason: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20 transition-all cursor-pointer"
                    >
                      <option value="Bổ sung định biên">Bổ sung định biên</option>
                      <option value="Thay thế nhân sự nghỉ việc">Thay thế nhân sự nghỉ việc</option>
                      <option value="Phục vụ dự án mới">Phục vụ dự án mới</option>
                      <option value="Khác">Khác (Nhu cầu phát sinh đặc thù)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Chi tiết lý do / Dự án (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="Nhập tên dự án hoặc ghi chú bổ sung..."
                      value={reqFormData.recruitmentReasonDetail}
                      onChange={(e) =>
                        setReqFormData({ ...reqFormData, recruitmentReasonDetail: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* KHỐI 2: THỜI HẠN & NGÀY CẦN NHÂN SỰ (DATE PICKER VỚI VALIDATE QUÁ KHỨ) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#4285F4] text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                    Kế hoạch & Thời gian cần nhân sự
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ô Date Picker: Ngày cần nhân sự */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Ngày cần nhân sự (Onboard Target Date) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={reqFormData.targetDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none transition-all ${
                          reqFormErrors.targetDate
                            ? "bg-rose-50/60 border-2 border-rose-400 text-rose-900 focus:ring-2 focus:ring-rose-200"
                            : "bg-slate-50 border border-gray-200 text-slate-900 focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20"
                        }`}
                      />
                    </div>

                    {/* Dòng ghi chú nhỏ màu đỏ hoặc thông báo lỗi nếu chọn ngày trong quá khứ */}
                    {reqFormErrors.targetDate ? (
                      <div className="flex items-start gap-1.5 text-xs text-rose-600 font-semibold mt-1.5 p-2 bg-rose-50 rounded-lg border border-rose-200 animate-in fade-in duration-150">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                        <span>{reqFormErrors.targetDate}</span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>Thời hạn kỳ vọng nhân sự mới hoàn tất thủ tục và bắt đầu nhận việc.</span>
                      </p>
                    )}
                  </div>

                  {/* Thông tin hỗ trợ tuyển dụng */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-gray-100 flex flex-col justify-center text-xs space-y-1.5 text-slate-600">
                    <span className="font-bold text-slate-800">Quy chuẩn thời gian tuyển dụng (SLA):</span>
                    <p>• Vị trí Junior / Middle: Khuyến nghị tối thiểu 2 - 3 tuần chuẩn bị.</p>
                    <p>• Vị trí Senior / Lead: Khuyến nghị tối thiểu 4 - 6 tuần để đảm bảo tìm đúng nhân sự then chốt.</p>
                  </div>
                </div>
              </div>

              {/* KHỐI 3: NGÂN SÁCH & DẢI LƯƠNG ĐỀ XUẤT + GIẢI TRÌNH (> 30M VNĐ) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#4285F4] text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                      Ngân sách & Mức lương đề xuất
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      Trần chuẩn: 30.000.000 VNĐ
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  {/* Ô nhập Mức lương đề xuất */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Mức lương đề xuất (VNĐ/tháng) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="1000000"
                        min="5000000"
                        max="200000000"
                        required
                        value={reqFormData.proposedSalary}
                        onChange={(e) => handleSalaryChange(parseInt(e.target.value) || 0)}
                        placeholder="Ví dụ: 25000000 hoặc 35000000"
                        className={`w-full pl-4 pr-16 py-2.5 bg-slate-50 border ${
                          reqFormData.proposedSalary > SALARY_STANDARD_CEILING
                            ? "border-amber-300 ring-2 ring-amber-100 bg-amber-50/20"
                            : "border-gray-200"
                        } rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20 transition-all`}
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        VNĐ
                      </span>
                    </div>

                    {/* Hiển thị định dạng tiền tệ trực quan */}
                    <div className="mt-1.5 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">
                        Quy đổi:{" "}
                        <strong className="text-slate-800 font-bold">
                          {new Intl.NumberFormat("vi-VN").format(reqFormData.proposedSalary)} VNĐ
                        </strong>
                      </span>
                      {reqFormData.proposedSalary > SALARY_STANDARD_CEILING ? (
                        <span className="font-bold text-amber-600 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Vượt khung chuẩn (+{(reqFormData.proposedSalary - SALARY_STANDARD_CEILING).toLocaleString("vi-VN")} đ)
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          Trong khung chuẩn
                        </span>
                      )}
                    </div>

                    {/* Quick presets */}
                    <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[11px] text-slate-400 mr-1">Mức nhanh:</span>
                      {[
                        { label: "18 triệu", val: 18000000 },
                        { label: "25 triệu", val: 25000000 },
                        { label: "30 triệu (Trần)", val: 30000000 },
                        { label: "35 triệu", val: 35000000 },
                        { label: "45 triệu", val: 45000000 },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => handleSalaryChange(item.val)}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                            reqFormData.proposedSalary === item.val
                              ? "bg-[#4285F4] text-white border-[#4285F4] shadow-sm"
                              : "bg-white text-slate-600 border-gray-200 hover:bg-slate-50"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Thẻ ghi chú chính sách ngân sách */}
                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-xs space-y-1.5 text-slate-600">
                    <span className="font-bold text-blue-900 flex items-center gap-1">
                      <Info className="w-4 h-4 text-[#4285F4]" />
                      Chính sách phê duyệt ngân sách lương:
                    </span>
                    <p>• <strong>Dưới 30.000.000 VNĐ:</strong> Trưởng bộ phận có thẩm quyền đề xuất và HR duyệt tiêu chuẩn.</p>
                    <p>• <strong>Trên 30.000.000 VNĐ:</strong> Bắt buộc có bản giải trình chi tiết gửi Ban Giám Đốc phê duyệt.</p>
                  </div>
                </div>

                {/* TÍNH NĂNG GIẢI TRÌNH TỰ ĐỘNG KHI MỨC LƯƠNG > 30,000,000 VNĐ */}
                {reqFormData.proposedSalary > SALARY_STANDARD_CEILING && (
                  <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-3 duration-200">
                    {/* Banner cảnh báo màu vàng/cam */}
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-sm">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs leading-relaxed">
                        <span className="font-bold text-amber-800 uppercase tracking-wide block mb-0.5">
                          Yêu cầu giải trình bắt buộc (Vượt khung chuẩn)
                        </span>
                        Mức lương đề xuất <strong className="font-bold text-amber-950">{new Intl.NumberFormat("vi-VN").format(reqFormData.proposedSalary)} VNĐ</strong> vượt quá khung tiêu chuẩn (30.000.000 VNĐ). Trưởng bộ phận bắt buộc phải giải trình lý do cụ thể vào ô bên dưới trước khi gửi yêu cầu.
                      </div>
                    </div>

                    {/* Textarea Giải trình bắt buộc */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-rose-700">
                          Giải trình lý do đề xuất mức lương vượt khung chuẩn <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          Bắt buộc điền
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        required
                        placeholder="Nêu rõ lý do: Vị trí cấp bách ảnh hưởng trực tiếp đến deadline dự án, yêu cầu kỹ năng chuyên sâu hiếm có trên thị trường (AI/Cloud/SecOps), mức lương mặt bằng ngành đối thủ, bằng cấp hoặc chứng chỉ quốc tế..."
                        value={reqFormData.salaryJustification}
                        onChange={(e) => {
                          setReqFormData({ ...reqFormData, salaryJustification: e.target.value });
                          if (reqFormErrors.salaryJustification) {
                            setReqFormErrors((prev) => {
                              const next = { ...prev };
                              delete next.salaryJustification;
                              return next;
                            });
                          }
                        }}
                        className={`w-full px-4 py-3 bg-white border ${
                          reqFormErrors.salaryJustification
                            ? "border-rose-400 ring-2 ring-rose-200 bg-rose-50/20"
                            : "border-amber-300 ring-1 ring-amber-200"
                        } rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none shadow-sm transition-all`}
                      />
                      {reqFormErrors.salaryJustification && (
                        <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {reqFormErrors.salaryJustification}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* KHỐI 4: SOẠN THẢO MÔ TẢ CÔNG VIỆC (GIẢ LẬP TRÌNH SOẠN THẢO RICH TEXT EDITOR) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#4285F4] text-xs font-bold flex items-center justify-center">
                      4
                    </span>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                      Soạn thảo Mô tả công việc (Job Description)
                    </h4>
                    <span className="text-rose-500 font-bold">*</span>
                  </div>
                  <span className="text-xs text-slate-400 hidden sm:inline">
                    Trình soạn thảo văn bản trực quan
                  </span>
                </div>

                {/* Simulated Rich Text Editor Wrapper */}
                <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm focus-within:border-[#4285F4] focus-within:ring-2 focus-within:ring-[#4285F4]/20 transition-all">
                  {/* Toolbar */}
                  <div className="bg-slate-50 border-b border-gray-200 px-3 py-2 flex flex-wrap items-center justify-between gap-1.5 text-slate-700">
                    {/* Left: Format actions */}
                    <div className="flex items-center gap-1">
                      {/* Bold (B) */}
                      <button
                        type="button"
                        onClick={() => applyFormatting("bold")}
                        title="In đậm (Bold)"
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all cursor-pointer ${
                          editorActiveFormats.bold
                            ? "bg-[#4285F4] text-white shadow-sm"
                            : "hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        <Bold className="w-4 h-4" />
                      </button>

                      {/* Italic (I) */}
                      <button
                        type="button"
                        onClick={() => applyFormatting("italic")}
                        title="In nghiêng (Italic)"
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm italic transition-all cursor-pointer ${
                          editorActiveFormats.italic
                            ? "bg-[#4285F4] text-white shadow-sm"
                            : "hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        <Italic className="w-4 h-4" />
                      </button>

                      {/* Underline (U) */}
                      <button
                        type="button"
                        onClick={() => applyFormatting("underline")}
                        title="Gạch chân (Underline)"
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm underline transition-all cursor-pointer ${
                          editorActiveFormats.underline
                            ? "bg-[#4285F4] text-white shadow-sm"
                            : "hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        <Underline className="w-4 h-4" />
                      </button>

                      <div className="h-4 w-px bg-gray-300 mx-1.5" />

                      {/* Align Left */}
                      <button
                        type="button"
                        onClick={() =>
                          setEditorActiveFormats((prev) => ({ ...prev, align: "left" }))
                        }
                        title="Căn lề trái"
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          editorActiveFormats.align === "left"
                            ? "bg-slate-200 text-slate-900 font-bold"
                            : "hover:bg-slate-200 text-slate-600"
                        }`}
                      >
                        <AlignLeft className="w-4 h-4" />
                      </button>

                      {/* Align Center */}
                      <button
                        type="button"
                        onClick={() =>
                          setEditorActiveFormats((prev) => ({ ...prev, align: "center" }))
                        }
                        title="Căn lề giữa"
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          editorActiveFormats.align === "center"
                            ? "bg-slate-200 text-slate-900 font-bold"
                            : "hover:bg-slate-200 text-slate-600"
                        }`}
                      >
                        <AlignCenter className="w-4 h-4" />
                      </button>

                      {/* Align Right */}
                      <button
                        type="button"
                        onClick={() =>
                          setEditorActiveFormats((prev) => ({ ...prev, align: "right" }))
                        }
                        title="Căn lề phải"
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          editorActiveFormats.align === "right"
                            ? "bg-slate-200 text-slate-900 font-bold"
                            : "hover:bg-slate-200 text-slate-600"
                        }`}
                      >
                        <AlignRight className="w-4 h-4" />
                      </button>

                      <div className="h-4 w-px bg-gray-300 mx-1.5" />

                      {/* Bullet list */}
                      <button
                        type="button"
                        onClick={() => applyListFormatting("bullet")}
                        title="Danh sách dấu đầu dòng (Bullet List)"
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                      >
                        <List className="w-4 h-4" />
                      </button>

                      {/* Numbered list */}
                      <button
                        type="button"
                        onClick={() => applyListFormatting("ordered")}
                        title="Danh sách đánh số (Numbered List)"
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                      >
                        <ListOrdered className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Right: Quick JD Template Button */}
                    <div>
                      <button
                        type="button"
                        onClick={insertJDTemplate}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#4285F4] hover:bg-blue-100 border border-blue-200 transition-all cursor-pointer shadow-sm"
                        title="Điền tự động mẫu JD chuẩn chuyên nghiệp"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#4285F4]" />
                        <span>Chèn mẫu JD gợi ý</span>
                      </button>
                    </div>
                  </div>

                  {/* Main Textarea Area */}
                  <textarea
                    ref={jdTextareaRef}
                    required
                    rows={8}
                    placeholder="Nhập nội dung mô tả chi tiết vị trí tuyển dụng:
- Mục tiêu vai trò & khối lượng trách nhiệm chính
- Các yêu cầu kỹ năng chuyên môn, kinh nghiệm thực chiến
- Quyền lợi, chế độ đãi ngộ & lộ trình thăng tiến..."
                    value={reqFormData.description}
                    onChange={(e) => {
                      setReqFormData({ ...reqFormData, description: e.target.value });
                      if (reqFormErrors.description) {
                        setReqFormErrors((prev) => {
                          const next = { ...prev };
                          delete next.description;
                          return next;
                        });
                      }
                    }}
                    className={`w-full p-4 sm:p-5 text-sm text-slate-800 focus:outline-none resize-y min-h-[200px] leading-relaxed ${
                      editorActiveFormats.align === "center"
                        ? "text-center"
                        : editorActiveFormats.align === "right"
                        ? "text-right"
                        : "text-left"
                    } ${editorActiveFormats.bold ? "font-semibold" : "font-normal"} ${
                      editorActiveFormats.italic ? "italic" : ""
                    } ${editorActiveFormats.underline ? "underline" : ""}`}
                  />

                  {/* Editor Bottom Info Bar */}
                  <div className="bg-slate-50/80 px-4 py-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span>
                        {reqFormData.description.trim().split(/\s+/).filter(Boolean).length} từ
                      </span>
                      <span>•</span>
                      <span>{reqFormData.description.length} ký tự</span>
                    </div>
                    <span className="hidden sm:inline">
                      Có thể sử dụng Markdown: **in đậm**, *in nghiêng*, • danh sách
                    </span>
                  </div>
                </div>

                {reqFormErrors.description && (
                  <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {reqFormErrors.description}
                  </p>
                )}
              </div>
            </form>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-6 border-t border-gray-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-400 text-center sm:text-left">
                Các trường có dấu (<span className="text-rose-500 font-bold">*</span>) là bắt buộc theo quy định Sprint 2.
              </span>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {/* Nút "Hủy bỏ" (Nền trắng, chữ xám, đóng popup không lưu) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateReqOpen(false);
                    setEditingDraftId(null);
                  }}
                  className="flex-1 sm:flex-initial px-6 py-2.5 rounded-full border border-gray-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all cursor-pointer shadow-sm"
                >
                  Hủy bỏ
                </button>

                {editingDraftId ? (
                  /* Nút "Cập nhật nháp" (Nền trắng, viền xanh dương, chữ xanh dương) */
                  <button
                    type="button"
                    onClick={handleUpdateDraft}
                    className="flex-1 sm:flex-initial px-6 py-2.5 rounded-full border border-[#4285F4] text-[#4285F4] bg-white hover:bg-blue-50 text-sm font-semibold transition-all cursor-pointer shadow-sm inline-flex items-center justify-center gap-1.5"
                  >
                    <FileClock className="w-4 h-4" />
                    <span>Cập nhật nháp</span>
                  </button>
                ) : (
                  /* Nút "Lưu nháp" khi tạo mới */
                  <button
                    type="button"
                    onClick={handleSaveDraftRequisition}
                    className="flex-1 sm:flex-initial px-6 py-2.5 rounded-full border border-[#4285F4] text-[#4285F4] bg-white hover:bg-blue-50 text-sm font-semibold transition-all cursor-pointer shadow-sm inline-flex items-center justify-center gap-1.5"
                  >
                    <FileClock className="w-4 h-4" />
                    <span>Lưu nháp</span>
                  </button>
                )}

                {/* Nút "Gửi yêu cầu duyệt" (Primary Button: Nền xanh #4285F4, chữ trắng, rounded-full) */}
                <button
                  type="submit"
                  form="create-requisition-form"
                  className="flex-1 sm:flex-initial bg-[#4285F4] hover:bg-blue-600 text-white px-7 py-2.5 rounded-full text-sm font-semibold transition-all shadow-md shadow-blue-500/25 inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Gửi yêu cầu duyệt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SAO CHÉP YÊU CẦU CŨ (CLONE REQUISITION) */}
      {/* ========================================================================= */}
      {isCloneReqOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCloneReqOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#4285F4] flex items-center justify-center">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Sao Chép Yêu Cầu Cũ
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tái sử dụng mẫu yêu cầu tuyển dụng đã có để tiết kiệm thời gian
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCloneReqOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Chọn một yêu cầu tuyển dụng trong danh sách mẫu bên dưới. Hệ thống sẽ tạo một bản sao mới kèm toàn bộ mô tả và yêu cầu:
              </p>

              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {requisitions.map((req) => (
                  <label
                    key={req.id}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedReqForClone === req.id
                        ? "border-[#4285F4] bg-blue-50/50 shadow-sm"
                        : "border-gray-100 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="clone_req"
                      checked={selectedReqForClone === req.id}
                      onChange={() => setSelectedReqForClone(req.id)}
                      className="mt-1 text-[#4285F4] focus:ring-[#4285F4]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {req.title}
                        </h4>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {req.level}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <span>Lương: {req.salaryRange}</span>
                        <span>•</span>
                        <span>Mục tiêu: {req.targetCount} người</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCloneReqOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-gray-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClone}
                  className="bg-[#4285F4] hover:bg-blue-600 text-white px-6 py-2.5 rounded-full font-medium text-sm transition-all shadow-sm shadow-blue-500/20 inline-flex items-center gap-2 cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>Xác nhận sao chép</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: XÁC NHẬN "QUYẾT ĐỊNH TUYỂN" (HIRE CONFIRMATION) */}
      {/* ========================================================================= */}
      {isHireModalOpen && activeCandidate && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsHireModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ThumbsUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Xác Nhận Quyết Định Tuyển Dụng
                  </h3>
                  <p className="text-xs text-slate-500">
                    Phê duyệt ứng viên và gửi thông tin sang HR ban hành thư mời nhận việc (Offer)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHireModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmHire} className="p-6 space-y-4">
              {/* Candidate Info Box */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-full ${activeCandidate.avatarColor} text-white flex items-center justify-center font-bold text-base shrink-0 shadow-sm`}
                >
                  {activeCandidate.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(-2)
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm truncate">
                      {activeCandidate.name}
                    </h4>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white border border-emerald-200 text-emerald-700">
                      Điểm: {((activeCandidate.round1.score + activeCandidate.round2.score) / 2).toFixed(1)}/10
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 truncate">
                    {activeCandidate.positionTitle}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {activeCandidate.email} • {activeCandidate.phone}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Mức lương đề xuất (Gross/tháng) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 32.000.000 VNĐ"
                  value={hireSalary}
                  onChange={(e) => setHireSalary(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Ghi chú đề xuất & Điều kiện tuyển dụng
                </label>
                <textarea
                  rows={3}
                  placeholder="Nhận xét tóm tắt năng lực, dự kiến ngày onboard, thời gian thử việc..."
                  value={hireNote}
                  onChange={(e) => setHireNote(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsHireModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-gray-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-full font-medium text-sm transition-all shadow-md shadow-emerald-600/20 inline-flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác nhận Tuyển</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: XÁC NHẬN "LOẠI ỨNG VIÊN" (REJECT CONFIRMATION) */}
      {/* ========================================================================= */}
      {isRejectModalOpen && activeCandidate && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsRejectModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <ThumbsDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Xác Nhận Không Chọn Ứng Viên
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ghi nhận kết quả từ chối và chuyển lưu hồ sơ nhân tài tiềm năng
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="p-6 space-y-4">
              {/* Candidate Info */}
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-full ${activeCandidate.avatarColor} text-white flex items-center justify-center font-bold text-base shrink-0 shadow-sm`}
                >
                  {activeCandidate.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(-2)
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm truncate">
                    {activeCandidate.name}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5 truncate">
                    {activeCandidate.positionTitle}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {activeCandidate.email}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Lý do từ chối / Đóng góp cho HR <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Nhập lý do chưa phù hợp (kỹ năng, kỳ vọng lương, định hướng công việc...)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-gray-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-full font-medium text-sm transition-all shadow-md shadow-rose-600/20 inline-flex items-center gap-2 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Xác nhận Loại</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: QUẢN LÝ HỒ SƠ CÁ NHÂN & ĐỔI MẬT KHẨU (REUSABLE USER PROFILE MODAL) */}
      {/* ========================================================================= */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userRole="Trưởng Bộ Phận (Hiring Manager)"
        initialTab={profileModalTab}
        initialData={{
          employeeCode: "NV-2026-088",
          name: managerProfile.name,
          email: managerProfile.email,
          role: managerProfile.role,
          department: managerProfile.department,
          phone: managerProfile.phone,
          avatarUrl: managerProfile.avatarUrl,
          bio: managerProfile.bio,
          gender: "Nam",
          dateOfBirth: "1990-08-15",
        }}
        onSaveProfile={(updated) => {
          setManagerProfile((prev) => ({
            ...prev,
            name: updated.name,
            phone: updated.phone,
            avatarUrl: updated.avatarUrl || prev.avatarUrl,
            bio: updated.bio || prev.bio,
          }));
          showToast("Đã lưu thông tin hồ sơ thành công!");
        }}
        onChangePassword={async ({ currentPass, newPass }) => {
          await new Promise((resolve) => setTimeout(resolve, 600));
          showToast("Đổi mật khẩu thành công! Mật khẩu mới đã được lưu.");
        }}
      />

      {/* MODAL CẮT ẢNH CHO HEADER UPLOAD NHAH */}
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

      {/* ========================================================================= */}
      {/* MODAL 6: CHỈNH SỬA HỒ SƠ (EDIT PROFILE) */}
      {/* ========================================================================= */}
      {isEditProfileModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditProfileModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#4285F4] flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Chỉnh Sửa Hồ Sơ
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cập nhật thông tin cá nhân Trưởng bộ phận
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editProfileForm.name}
                  onChange={(e) =>
                    setEditProfileForm({ ...editProfileForm, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Email công việc (Cố định)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={managerProfile.email}
                    className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={editProfileForm.phone}
                    onChange={(e) =>
                      setEditProfileForm({ ...editProfileForm, phone: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Phòng ban / Bộ phận
                </label>
                <input
                  type="text"
                  value={editProfileForm.department}
                  onChange={(e) =>
                    setEditProfileForm({ ...editProfileForm, department: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Mô tả trách nhiệm & Chuyên môn
                </label>
                <textarea
                  rows={3}
                  value={editProfileForm.bio}
                  onChange={(e) =>
                    setEditProfileForm({ ...editProfileForm, bio: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-gray-200 text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-[#4285F4] text-white px-6 py-2.5 rounded-full hover:bg-blue-600 transition-all font-medium text-sm shadow-sm cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: CHUỖI CẤP DUYỆT & NHẬT KÝ THẨM ĐỊNH (APPROVAL WORKFLOW & AUDIT TRAIL) */}
      {/* ========================================================================= */}
      {isApprovalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn font-sans">
          <div className="bg-white w-full max-w-4xl rounded-[24px] sm:rounded-[28px] shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh] my-auto">
            {/* Modal Header */}
            <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-gray-100 flex items-start justify-between bg-gradient-to-r from-slate-50 via-white to-blue-50/30">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[#4285F4] flex items-center justify-center shrink-0 shadow-sm">
                  <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                      Chuỗi Cấp Duyệt & Nhật Ký Thẩm Định
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      Read-only • Audit Trail
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Bảo toàn toàn vẹn lịch sử xét duyệt đa cấp • Không thể sửa đổi hoặc xóa theo chuẩn bảo mật ISO/SOC2
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsApprovalModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Switcher Bar (Requisitions vs Offer Proposals) */}
            <div className="px-6 sm:px-8 py-3 bg-slate-50/80 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-gray-200 shadow-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedApprovalType("REQUISITION");
                    setSelectedApprovalId("REQ-2026-001");
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedApprovalType === "REQUISITION"
                      ? "bg-[#4285F4] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  Yêu Cầu Tuyển Dụng ({requisitions.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedApprovalType("OFFER");
                    setSelectedApprovalId("CAN-001");
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedApprovalType === "OFFER"
                      ? "bg-[#4285F4] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  Đề Xuất Offer Ứng Viên ({candidates.length})
                </button>
              </div>

              {/* Quick Select Item Dropdown / Pills */}
              <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
                <span className="text-xs font-medium text-slate-500 shrink-0">Hồ sơ:</span>
                {selectedApprovalType === "REQUISITION" ? (
                  requisitions.map((req) => (
                    <button
                      key={req.id}
                      type="button"
                      onClick={() => setSelectedApprovalId(req.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                        selectedApprovalId === req.id
                          ? "bg-slate-900 text-white font-bold shadow-xs"
                          : "bg-white border border-gray-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {req.id}
                    </button>
                  ))
                ) : (
                  candidates.map((can) => (
                    <button
                      key={can.id}
                      type="button"
                      onClick={() => setSelectedApprovalId(can.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                        selectedApprovalId === can.id
                          ? "bg-slate-900 text-white font-bold shadow-xs"
                          : "bg-white border border-gray-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {can.name}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Modal Body: Scrollable */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-white">
              {/* Document Overview Summary Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/50 via-slate-50 to-indigo-50/30 border border-blue-100/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-white text-slate-700 border border-slate-200 shadow-xs">
                      {currentWorkflowRecord.itemCode}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      Loại: {currentWorkflowRecord.itemType === "REQUISITION" ? "Yêu cầu tuyển dụng" : "Đề xuất Offer nhân sự"}
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900">
                    {currentWorkflowRecord.itemTitle}
                  </h4>
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600">
                    <span>Phòng ban: <strong>{currentWorkflowRecord.department}</strong></span>
                    <span>Người khởi tạo: <strong>{currentWorkflowRecord.creator}</strong></span>
                    <span>Khởi tạo lúc: <strong>{currentWorkflowRecord.createdAt}</strong></span>
                  </div>
                </div>

                <div className="flex md:flex-col items-start md:items-end justify-between md:justify-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-blue-100 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-xs ${
                      currentWorkflowRecord.overallStatus === "APPROVED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : currentWorkflowRecord.overallStatus === "IN_PROGRESS"
                        ? "bg-blue-50 text-[#4285F4] border-blue-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {currentWorkflowRecord.overallStatus === "APPROVED" ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Đã Hoàn Tất Phê Duyệt
                      </>
                    ) : currentWorkflowRecord.overallStatus === "IN_PROGRESS" ? (
                      <>
                        <Clock className="w-3.5 h-3.5 animate-spin-slow" />
                        Đang Trong Tiến Trình Duyệt
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        Không Được Duyệt
                      </>
                    )}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Audit Log: {currentWorkflowRecord.lastAuditedAt}
                  </span>
                </div>
              </div>

              {/* VERTICAL TIMELINE SECTION: CHUỖI CẤP DUYỆT & NHẬT KÝ THẨM ĐỊNH */}
              <div className="bg-white rounded-2xl p-4 sm:p-7 border border-slate-100 shadow-xs">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-500" />
                    <h4 className="text-sm sm:text-base font-bold text-slate-900">
                      Tiến Trình Phê Duyệt Theo Tuyến Thẩm Quyền
                    </h4>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {currentWorkflowRecord.steps.filter((s) => s.status === "APPROVED").length} / {currentWorkflowRecord.steps.length} cấp hoàn thành
                  </span>
                </div>

                {/* COMPONENT: APPROVAL WORKFLOW & AUDIT TRAIL TIMELINE */}
                <ApprovalWorkflowTimeline
                  steps={currentWorkflowRecord.steps}
                  auditHash={currentWorkflowRecord.auditHash}
                  lastAuditedAt={currentWorkflowRecord.lastAuditedAt}
                  bannerPosition="bottom"
                />
              </div>
            </div>

            {/* Modal Footer: READ ONLY - Strictly NO Edit/Delete buttons */}
            <div className="px-6 py-4 sm:px-8 sm:py-4.5 bg-slate-50 border-t border-gray-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Trạng thái: <strong>Dữ liệu chuẩn hóa & Khóa chỉnh sửa</strong></span>
              </div>
              <button
                type="button"
                onClick={() => setIsApprovalModalOpen(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-full font-semibold text-sm transition-all shadow-sm cursor-pointer hover:shadow-md"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: XEM NHANH HỒ SƠ CV ỨNG VIÊN (CV VIEWER MODAL) */}
      {/* ========================================================================= */}
      {isCvModalOpen && activeInterviewForCv && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCvModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
        >
          <div className="bg-white rounded-[28px] border border-gray-100 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#4285F4] flex items-center justify-center font-bold">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Hồ Sơ CV Ứng Viên
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mã ứng viên: {activeInterviewForCv.candidateId} • Vị trí: {activeInterviewForCv.positionTitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCvModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200/80 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm">
              {/* Candidate Info Card */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-gray-100">
                <div
                  className={`w-14 h-14 rounded-2xl ${activeInterviewForCv.candidateAvatarColor} text-white flex items-center justify-center font-extrabold text-xl shrink-0 shadow-sm`}
                >
                  {activeInterviewForCv.candidateName
                    .split(" ")
                    .map((n) => n[0])
                    .slice(-2)
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-slate-900 text-base">
                      {activeInterviewForCv.candidateName}
                    </h4>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-[#4285F4]">
                      Ứng viên Shortlist
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-600 mt-0.5">
                    {activeInterviewForCv.positionTitle} • {activeInterviewForCv.department}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-3">
                    <span>📧 {activeInterviewForCv.candidateEmail}</span>
                    <span>📞 {activeInterviewForCv.candidatePhone}</span>
                  </p>
                </div>
              </div>

              {/* Học vấn & Bằng cấp */}
              <div className="space-y-1.5">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Học Vấn & Đào Tạo
                </h5>
                <div className="p-3.5 rounded-xl bg-white border border-gray-200/80 text-xs">
                  <strong className="text-slate-800 font-semibold block text-sm">
                    {activeInterviewForCv.candidateEducation}
                  </strong>
                  <span className="text-slate-500 mt-0.5 block">
                    Tốt nghiệp chuyên ngành Công nghệ thông tin / Phần mềm
                  </span>
                </div>
              </div>

              {/* Kinh nghiệm làm việc & Dự án thực tế */}
              <div className="space-y-1.5">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Kinh Nghiệm & Dự Án Thực Chiến
                </h5>
                <div className="p-3.5 rounded-xl bg-white border border-gray-200/80 text-xs leading-relaxed text-slate-700">
                  <p className="font-semibold text-slate-900 mb-1">
                    {activeInterviewForCv.candidateExperience}
                  </p>
                  <p className="text-slate-500">
                    Đã từng tham gia xây dựng hệ thống quy mô lớn, tối ưu hóa database và xây dựng các dịch vụ microservices chịu tải cao. Có tinh thần làm việc nhóm và giao tiếp kỹ thuật chủ động.
                  </p>
                </div>
              </div>

              {/* Kỹ năng chuyên môn */}
              <div className="space-y-1.5">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Kỹ Năng & Công Nghệ
                </h5>
                <div className="flex flex-wrap gap-2">
                  {activeInterviewForCv.candidateSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/80 text-xs font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Trọng tâm phỏng vấn */}
              {activeInterviewForCv.notes && (
                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 space-y-1">
                  <strong className="font-bold flex items-center gap-1.5 text-amber-800">
                    <Info className="w-4 h-4 text-amber-600" />
                    Lưu ý từ HR / Trưởng Bộ Phận:
                  </strong>
                  <p className="leading-relaxed">{activeInterviewForCv.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-gray-100 bg-slate-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  showToast(`Đang tải file CV bản PDF của ứng viên ${activeInterviewForCv.candidateName}...`);
                }}
                className="px-4 py-2 rounded-full border border-gray-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Tải CV PDF (Bản gốc)</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCvModalOpen(false)}
                  className="px-5 py-2 rounded-full border border-gray-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Đóng
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsCvModalOpen(false);
                    handleOpenEvaluation(activeInterviewForCv);
                  }}
                  className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-sm shadow-emerald-600/20 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Chấm điểm ngay</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: ĐÁNH GIÁ & ĐIỀN ĐIỂM PHỎNG VẤN (EVALUATION MODAL) */}
      {/* ========================================================================= */}
      {isEvalModalOpen && activeInterviewForEval && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEvalModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
        >
          <div className="bg-white rounded-[28px] border border-gray-100 shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/60 to-white">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Đánh Giá & Chấm Điểm Phỏng Vấn
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeInterviewForEval.candidateName} • {activeInterviewForEval.round}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEvalModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEvaluation} className="p-6 space-y-4 overflow-y-auto text-sm">
              {/* Score Slider & Preset */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-gray-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Điểm đánh giá chuyên môn (Thang điểm 10) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-baseline gap-1 bg-white px-3 py-1 rounded-xl border border-emerald-200 shadow-xs">
                    <span className="text-2xl font-black text-emerald-600">{evalScore}</span>
                    <span className="text-xs font-bold text-slate-400">/ 10</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={evalScore}
                  onChange={(e) => setEvalScore(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />

                <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                  <span>1.0 (Kém)</span>
                  <span>5.0 (Trung bình)</span>
                  <span>7.0 (Đạt yêu cầu)</span>
                  <span>8.5 (Tốt)</span>
                  <span>10.0 (Xuất sắc)</span>
                </div>
              </div>

              {/* Recommendation Radio Group */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Đề xuất của Trưởng Bộ Phận <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { val: "HIRE", label: "Đạt (Đề xuất tuyển)", color: "text-emerald-700 border-emerald-300 bg-emerald-50/50" },
                    { val: "CONSIDER", label: "Xem xét / Phỏng vấn thêm", color: "text-amber-700 border-amber-300 bg-amber-50/50" },
                    { val: "REJECT", label: "Chưa phù hợp (Loại)", color: "text-rose-700 border-rose-300 bg-rose-50/50" },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setEvalRecommendation(item.val as any)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-center ${
                        evalRecommendation === item.val
                          ? `${item.color} ring-2 ring-emerald-500/20 shadow-xs`
                          : "border-gray-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nhận xét chuyên môn */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nhận xét chuyên môn & Năng lực giải quyết vấn đề <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Đánh giá kỹ năng lập trình, tư duy giải thuật, kinh nghiệm dự án thực tế..."
                  value={evalComment}
                  onChange={(e) => setEvalComment(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none leading-relaxed"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEvalModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-gray-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-600/20 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Lưu kết quả đánh giá</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
