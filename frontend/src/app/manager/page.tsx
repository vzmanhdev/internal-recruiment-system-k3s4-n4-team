"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
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
import { CroppedAvatarResult } from "@/lib/cropImage";
import { authService } from "@/features/auth/services/auth.service";
import { apiRequest, ApiError } from "@/lib/api-client";
import { requisitionService, type RequisitionItem } from "@/services/requisition.service";
import { applicationService, type ApplicationItem } from "@/services/application.service";
import { interviewService, type InterviewItem } from "@/services/interview.service";
import { referralService, type EvaluationItem } from "@/services/referral.service";

// Types
export interface JobRequisition {
  id: string;
  backendId?: number;
  backendStatus?: string;
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
  applicationId?: number;
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
  backendId?: number;
  applicationId?: number;
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


export default function HiringManagerDashboardPage() {
  const router = useRouter();

  const [requisitions, setRequisitions] = useState<JobRequisition[]>([]);
  const [candidates, setCandidates] = useState<ShortlistCandidate[]>([]);
  const [interviews, setInterviews] = useState<InterviewSchedule[]>([]);
  const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([]);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);

  // ------------------------------------------------------------------ real data (backend is the source of truth)
  const AVATAR_COLORS = ["bg-blue-600", "bg-indigo-600", "bg-emerald-600", "bg-amber-600", "bg-rose-600", "bg-purple-600", "bg-cyan-600"];
  const colorFor = (n: number) => AVATAR_COLORS[Math.abs(n) % AVATAR_COLORS.length];
  const initialsOf = (name: string) => name.split(" ").filter(Boolean).slice(-2).map((x) => x[0]).join("").toUpperCase();
  const fmtDate = (iso?: string | null) => (iso ? new Date(iso.length <= 10 ? iso : iso + (iso.endsWith("Z") ? "" : "Z")).toLocaleDateString("vi-VN") : "");
  const levelFrom = (title: string): JobRequisition["level"] =>
    /lead|trưởng nhóm/i.test(title) ? "Lead" : /manager|quản lý/i.test(title) ? "Manager" : /senior/i.test(title) ? "Senior" : /junior|fresher/i.test(title) ? "Junior" : "Middle";
  const reqStatusLabel = (st: string): JobRequisition["status"] =>
    ["draft", "changes_requested"].includes(st) ? "Draft" : st.startsWith("pending_") ? "Pending" : st === "approved" ? "Active" : "Closed";

  type HmDashboardRow = { requisition_id: number; stage_counts: Record<string, number> };

  const mapRequisition = (r: RequisitionItem, counts?: Record<string, number>): JobRequisition => {
    const c = counts || {};
    const raw = r as RequisitionItem & { salary_justification?: string; reason_detail?: string };
    return {
      id: r.code,
      backendId: r.id,
      backendStatus: r.status,
      title: r.title,
      department: r.department_name || "",
      level: levelFrom(r.title),
      targetCount: r.quantity || 1,
      receivedCount: Object.values(c).reduce((x, y) => x + y, 0),
      interviewingCount: c.interviewing || 0,
      hiredCount: c.hired || 0,
      status: reqStatusLabel(r.status),
      salaryRange: r.max_salary ? new Intl.NumberFormat("vi-VN").format(r.max_salary) + " VNĐ" : "Thỏa thuận",
      createdAt: fmtDate(r.created_at),
      deadline: r.target_onboard_date ? fmtDate(r.target_onboard_date) : "Chưa xác định",
      description: r.job_description || "",
      requirements: r.requirements || "",
      workType: r.employment_type,
      proposedSalary: r.max_salary,
      salaryJustification: raw.salary_justification || "",
      recruitmentReason: r.reason === "replacement" ? "Thay thế nhân sự" : "Bổ sung định biên",
      recruitmentReasonDetail: raw.reason_detail || "",
    };
  };

  const toRound = (e?: EvaluationItem) => ({
    interviewer: e?.evaluator_name || "Chưa có phiếu",
    score: e ? Math.round((e.weighted_score != null ? e.weighted_score / 10 : e.overall_score) * 10) / 10 : 0,
    comment: e?.comments || e?.strengths || "",
    status: (e && e.recommendation === "reject" ? "Failed" : "Passed") as "Passed" | "Failed",
  });

  const loadWorkspace = useCallback(async () => {
    try {
      const [reqs, apps, ints, dash, depts] = await Promise.all([
        requisitionService.getRequisitions(),
        applicationService.getApplications(),
        interviewService.getInterviews(),
        apiRequest<HmDashboardRow[]>("/analytics/hiring-manager").catch(() => [] as HmDashboardRow[]),
        apiRequest<Array<{ id: number; name: string }>>("/hr/departments").catch(() => []),
      ]);
      const countsByReq = new Map(dash.map((d) => [d.requisition_id, d.stage_counts]));
      setRequisitions(reqs.map((r) => mapRequisition(r, countsByReq.get(r.id))));
      setDepartments(depts);

      const appById = new Map<number, ApplicationItem>(apps.map((a) => [a.id, a]));
      const shortlist = apps.filter((a) => ["interviewing", "offered", "hired", "onboarded", "rejected"].includes(a.status));
      const evals = await Promise.all(shortlist.map((a) => referralService.listEvaluations(a.id).catch(() => [] as EvaluationItem[])));
      setCandidates(shortlist.map((a, idx) => {
        const list = evals[idx];
        const decision: ShortlistCandidate["decision"] = ["offered", "hired", "onboarded"].includes(a.status) ? "Hired" : a.status === "rejected" ? "Rejected" : "Pending";
        return {
          id: `APP-${a.id}`,
          applicationId: a.id,
          name: a.full_name,
          avatarColor: colorFor(a.id),
          email: a.email,
          phone: a.phone,
          positionId: String(a.job_posting_id),
          positionTitle: a.job_title || "",
          experienceYears: a.years_of_experience || 0,
          appliedDate: fmtDate(a.created_at),
          round1: toRound(list[0]),
          round2: toRound(list[1] ?? list[0]),
          overallAssessment: list.map((e) => e.comments).filter(Boolean).join(" · "),
          proposedSalary: "Thỏa thuận",
          decision,
          decisionNote: a.rejection_reason || undefined,
          decidedAt: decision !== "Pending" && a.updated_at ? fmtDate(a.updated_at) : undefined,
        };
      }));

      const pad = (n: number) => String(n).padStart(2, "0");
      setInterviews(ints.map((i: InterviewItem & { my_evaluation_submitted?: boolean; department?: string }) => {
        const start = new Date(i.scheduled_time);
        const end = new Date(start.getTime() + (i.duration_minutes || 45) * 60000);
        const app = appById.get(i.application_id);
        const status: InterviewSchedule["status"] = i.status === "completed" ? "COMPLETED" : i.status === "cancelled" ? "CANCELLED" : "UPCOMING";
        return {
          id: `INT-${i.id}`,
          backendId: i.id,
          applicationId: i.application_id,
          candidateId: `APP-${i.application_id}`,
          candidateName: i.candidate_name || "",
          candidateEmail: i.candidate_email || "",
          candidatePhone: app?.phone || "",
          candidateAvatarColor: colorFor(i.application_id),
          candidateExperience: app ? `${app.years_of_experience} năm kinh nghiệm${app.current_position ? " · " + app.current_position : ""}` : "",
          candidateEducation: "",
          candidateSkills: [],
          positionId: String(app?.job_posting_id ?? ""),
          positionTitle: i.job_title || "",
          department: app?.department || "",
          round: i.round_name,
          date: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
          dateLabel: start.toLocaleDateString("vi-VN"),
          time: `${pad(start.getHours())}:${pad(start.getMinutes())} - ${pad(end.getHours())}:${pad(end.getMinutes())}`,
          type: i.meeting_link ? "ONLINE" : "OFFLINE",
          locationOrPlatform: i.location,
          room: i.meeting_link ? undefined : i.location,
          meetingLink: i.meeting_link,
          interviewers: (i.interviewers || []).map((v: { interviewer_name?: string; role_in_interview?: string; interviewer_id?: number }) => ({
            name: v.interviewer_name || "", role: v.role_in_interview || "Người phỏng vấn",
            avatarColor: colorFor(v.interviewer_id || 0), initials: initialsOf(v.interviewer_name || "?"),
          })),
          status,
          feedbackStatus: i.my_evaluation_submitted ? "SUBMITTED" : "PENDING",
          score: i.score,
          evalComment: i.feedback_notes,
        };
      }));
      setWorkspaceError(null);
    } catch (err) {
      setWorkspaceError(err instanceof ApiError ? err.message : "Không tải được dữ liệu từ máy chủ.");
    }
  }, []);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

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
  const [managerProfile, setManagerProfile] = useState(() => {
    const u = authService.getUserInfo();
    return {
      name: u?.full_name || "",
      email: u?.email || "",
      phone: u?.phone || "",
      role: "Trưởng Bộ Phận (Hiring Manager)",
      department: u?.department || "",
      avatarUrl: u?.avatar_url || "",
      bio: u?.bio || "",
    };
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
  const [selectedApprovalId, setSelectedApprovalId] = useState<string>("");

  const handleOpenApprovalWorkflow = (type: "REQUISITION" | "OFFER", id: string) => {
    setSelectedApprovalType(type);
    setSelectedApprovalId(id);
    setIsApprovalModalOpen(true);
  };

  // Approval history loaded from the server's append-only logs; the hash is a real SHA-256 of those log rows.
  const emptyWorkflow: ApprovalWorkflowRecord = {
    id: "", itemCode: selectedApprovalId, itemType: selectedApprovalType, itemTitle: "Đang tải...", department: "", creator: "",
    createdAt: "", overallStatus: "IN_PROGRESS", auditHash: "", lastAuditedAt: "", steps: [],
  };
  const [currentWorkflowRecord, setCurrentWorkflowRecord] = useState<ApprovalWorkflowRecord>(emptyWorkflow);

  useEffect(() => {
    if (!isApprovalModalOpen) return;
    let cancelled = false;
    const STEP_NAMES: Record<string, string> = { manager: "Trưởng khối duyệt", hr: "Trưởng phòng Nhân sự duyệt", executive: "Ban Giám đốc duyệt" };
    const fmt = (iso?: string) => (iso ? new Date(iso + (iso.endsWith("Z") ? "" : "Z")).toLocaleString("vi-VN") : "");
    const digest = async (data: unknown) => {
      const bytes = new TextEncoder().encode(JSON.stringify(data));
      const hash = await crypto.subtle.digest("SHA-256", bytes);
      return "sha256:" + Array.from(new Uint8Array(hash)).map((x) => x.toString(16).padStart(2, "0")).join("");
    };
    (async () => {
      try {
        if (selectedApprovalType === "REQUISITION") {
          const id = requisitions.find((r) => r.id === selectedApprovalId)?.backendId;
          if (!id) return;
          const detail = (await requisitionService.getRequisitionById(id)) as RequisitionItem & { approval_chain?: string[] };
          const logs = (detail.approval_logs || []) as Array<{ id: number; action: string; step_name: string; comment?: string; approver_name?: string; created_at?: string }>;
          const decisions = logs.filter((l) => ["approved", "rejected", "changes_requested"].includes(l.action));
          const chain = detail.approval_chain || ["manager", "hr"];
          const currentStep = detail.status.startsWith("pending_") ? detail.status.replace("pending_", "") : null;
          const steps = chain.map((code, idx) => {
            const log = decisions[idx];
            const status: ApprovalStep["status"] = log ? (log.action === "approved" ? "APPROVED" : "REJECTED") : code === currentStep ? "PENDING" : "NOT_REACHED";
            return {
              id: `STEP-${idx + 1}`, stepNumber: idx + 1, stepName: `Cấp ${idx + 1}: ${STEP_NAMES[code] || code}`,
              approverName: log?.approver_name || (status === "PENDING" ? "Đang chờ xử lý" : "—"), approverRole: STEP_NAMES[code] || code,
              department: detail.department_name || "", status,
              timestamp: log ? fmt(log.created_at) : status === "PENDING" ? "Đang chờ xử lý..." : "Chưa đến lượt xử lý",
              comment: log?.comment || "",
            };
          });
          const record: ApprovalWorkflowRecord = {
            id: `WF-${detail.id}`, itemCode: detail.code, itemType: "REQUISITION", itemTitle: detail.title, department: detail.department_name || "",
            creator: detail.creator_name || "", createdAt: fmt(detail.created_at),
            overallStatus: detail.status === "approved" ? "APPROVED" : detail.status === "rejected" ? "REJECTED" : ["draft", "changes_requested"].includes(detail.status) ? "DRAFT" : "IN_PROGRESS",
            auditHash: await digest(logs), lastAuditedAt: fmt(logs[logs.length - 1]?.created_at), steps,
          };
          if (!cancelled) setCurrentWorkflowRecord(record);
        } else {
          const appId = candidates.find((c) => c.id === selectedApprovalId)?.applicationId;
          if (!appId) return;
          const { offerService } = await import("@/services/offer.service");
          const offer = (await offerService.getOffers()).find((o) => o.application_id === appId);
          if (!offer) {
            if (!cancelled) setCurrentWorkflowRecord({ ...emptyWorkflow, itemTitle: "Chưa có offer cho ứng viên này", overallStatus: "DRAFT" });
            return;
          }
          const logs = offer.approval_logs || [];
          const steps = logs.map((l, idx) => ({
            id: `OL-${l.id}`, stepNumber: idx + 1, stepName: l.action, approverName: l.actor_name || "", approverRole: l.level || "",
            department: "", status: (l.action === "rejected" ? "REJECTED" : "APPROVED") as ApprovalStep["status"],
            timestamp: fmt(l.created_at), comment: l.comment || "",
          }));
          const record: ApprovalWorkflowRecord = {
            id: `WF-OFFER-${offer.id}`, itemCode: `OFFER-${offer.id}`, itemType: "OFFER", itemTitle: `Offer: ${offer.candidate_name}`,
            department: offer.job_title || "", creator: "", createdAt: fmt(offer.created_at),
            overallStatus: ["approved", "sent", "accepted"].includes(offer.status) ? "APPROVED" : offer.status === "rejected" || offer.status === "declined" ? "REJECTED" : "IN_PROGRESS",
            auditHash: await digest(logs), lastAuditedAt: fmt(logs[logs.length - 1]?.created_at), steps,
          };
          if (!cancelled) setCurrentWorkflowRecord(record);
        }
      } catch (err) {
        if (!cancelled) setCurrentWorkflowRecord({ ...emptyWorkflow, itemTitle: err instanceof ApiError ? err.message : "Không tải được lịch sử duyệt" });
      }
    })();
    return () => { cancelled = true; };
  }, [isApprovalModalOpen, selectedApprovalId, selectedApprovalType]); // eslint-disable-line react-hooks/exhaustive-deps

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
    authService.logout(); // revokes the server-side session too
    router.push("/login");
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

  const handleSaveEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInterviewForEval?.applicationId) return;
    const recommendation = evalRecommendation === "HIRE" ? "hire" : evalRecommendation === "REJECT" ? "reject" : "hold";
    try {
      await referralService.submitEvaluation({
        application_id: activeInterviewForEval.applicationId,
        interview_id: activeInterviewForEval.backendId,
        overall_score: Math.min(10, Math.max(1, Math.round(evalScore))),
        recommendation,
        comments: evalComment || undefined,
      });
      await loadWorkspace();
      setIsEvalModalOpen(false);
      showToast("Đã nộp phiếu đánh giá. Phiếu đã nộp không sửa được (trừ khi Recruiter mở lại trong 24 giờ).");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Nộp phiếu đánh giá thất bại.");
    }
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
  const buildRequisitionPayload = (saveAsDraft: boolean) => {
    const dept = departments.find((d) => d.name === reqFormData.department) || departments[0];
    if (!dept) throw new ApiError(422, "Chưa có phòng ban nào được khai báo — liên hệ Trưởng phòng Nhân sự.");
    return {
      title: reqFormData.title.trim() || "Yêu cầu tuyển dụng (Bản nháp)",
      department_id: dept.id,
      quantity: Number(reqFormData.targetCount) || 1,
      reason: /thay thế/i.test(reqFormData.recruitmentReason) ? "replacement" : "expansion",
      reason_detail: reqFormData.recruitmentReasonDetail || undefined,
      employment_type: reqFormData.workType,
      max_salary: reqFormData.proposedSalary || undefined,
      salary_justification: reqFormData.salaryJustification || undefined,
      target_onboard_date: reqFormData.targetDate || undefined,
      job_description: reqFormData.description,
      requirements: reqFormData.requirements,
      save_as_draft: saveAsDraft,
    } as Partial<RequisitionItem> & { save_as_draft: boolean };
  };

  const resetRequisitionForm = () => {
    setIsCreateReqOpen(false);
    setEditingDraftId(null);
    setReqFormErrors({});
    setReqFormData({
      title: "",
      department: managerProfile.department || departments[0]?.name || "",
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

  const backendIdOf = (code: string | null) => requisitions.find((r) => r.id === code)?.backendId;

  const handleUpdateDraft = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const id = backendIdOf(editingDraftId);
    if (!id) return;
    try {
      const saved = await requisitionService.updateRequisition(id, buildRequisitionPayload(true));
      await loadWorkspace();
      resetRequisitionForm();
      showToast(`Đã lưu các thay đổi cho bản nháp: "${saved.title}"!`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Lưu bản nháp thất bại.");
    }
  };

  // Handler: Xóa bản nháp
  const handleDeleteDraft = async (draftId: string, title?: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bản nháp "${title || draftId}" không?`)) return;
    const id = backendIdOf(draftId);
    if (!id) return;
    try {
      await requisitionService.deleteDraft(id);
      await loadWorkspace();
      showToast(`Đã xóa bản nháp "${title || draftId}" thành công!`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Xóa bản nháp thất bại.");
    }
  };

  // Handlers: Gửi yêu cầu duyệt (Dùng cho cả Tạo mới và Gửi duyệt từ Bản nháp)
  const handleCreateRequisition = async (e: React.FormEvent) => {
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

    try {
      const draftId = backendIdOf(editingDraftId);
      let saved: RequisitionItem;
      if (draftId) {
        await requisitionService.updateRequisition(draftId, buildRequisitionPayload(true));
        saved = await requisitionService.submitRequisition(draftId);
      } else {
        saved = await requisitionService.createRequisition(buildRequisitionPayload(false));
      }
      await loadWorkspace();
      resetRequisitionForm();
      showToast(`Đã gửi duyệt yêu cầu "${saved.title}" (${saved.code}) — đang chờ phê duyệt.`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Gửi yêu cầu thất bại.");
    }
  };

  // Handler: Lưu nháp yêu cầu tuyển dụng mới (Save Draft Requisition)
  const handleSaveDraftRequisition = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    try {
      const saved = await requisitionService.createRequisition(buildRequisitionPayload(true));
      await loadWorkspace();
      resetRequisitionForm();
      showToast(`Đã lưu bản nháp: "${saved.title}" thành công!`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Lưu bản nháp thất bại.");
    }
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

  const handleConfirmClone = async () => {
    const id = backendIdOf(selectedReqForClone);
    if (!id) return;
    try {
      const copy = await requisitionService.copyRequisition(id);
      await loadWorkspace();
      setIsCloneReqOpen(false);
      showToast(`Đã sao chép thành bản nháp mới: ${copy.code} — hãy cập nhật ngày cần người rồi gửi duyệt.`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Sao chép thất bại.");
    }
  };

  // Handlers: Hire Candidate
  const handleOpenHireModal = (can: ShortlistCandidate) => {
    setActiveCandidate(can);
    setHireSalary(can.proposedSalary || "");
    setHireNote(can.overallAssessment || "");
    setIsHireModalOpen(true);
  };

  const handleConfirmHire = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCandidate?.applicationId) return;
    try {
      await applicationService.hiringDecision(activeCandidate.applicationId, "offer",
        [hireNote, hireSalary ? `Lương đề xuất: ${hireSalary}` : ""].filter(Boolean).join(" · ") || undefined);
      await loadWorkspace();
      setIsHireModalOpen(false);
      showToast(`Đã chuyển ${activeCandidate.name} sang Đề xuất offer — Recruiter sẽ soạn offer để duyệt.`);
      setActiveCandidate(null);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Lưu quyết định thất bại.");
    }
  };

  // Handlers: Reject Candidate
  const handleOpenRejectModal = (can: ShortlistCandidate) => {
    setActiveCandidate(can);
    setRejectReason("");
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCandidate?.applicationId) return;
    try {
      await applicationService.hiringDecision(activeCandidate.applicationId, "reject",
        rejectReason.trim() || "Chưa phù hợp với yêu cầu hiện tại của vị trí.");
      await loadWorkspace();
      setIsRejectModalOpen(false);
      showToast(`Đã lưu kết quả KHÔNG CHỌN ứng viên ${activeCandidate.name}.`);
      setActiveCandidate(null);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Lưu quyết định thất bại.");
    }
  };

  // Profile Save Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const saved = await authService.updateProfile({ full_name: editProfileForm.name, phone: editProfileForm.phone, bio: editProfileForm.bio });
      setManagerProfile((prev) => ({ ...prev, name: saved.full_name, phone: saved.phone || "", bio: saved.bio || "" }));
      setIsEditProfileModalOpen(false);
      showToast("Đã cập nhật hồ sơ cá nhân thành công!");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Cập nhật hồ sơ thất bại.");
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 font-sans flex flex-col antialiased">
      {workspaceError && (
        <div className="mx-4 mt-3 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold">{workspaceError}</div>
      )}
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
        onSaveProfile={async (updated) => {
          try {
            const saved = await authService.updateProfile({
              full_name: updated.name, phone: updated.phone, bio: updated.bio,
              ...(updated.avatarUrl && updated.avatarUrl !== managerProfile.avatarUrl ? { avatar_url: updated.avatarUrl } : {}),
            });
            setManagerProfile((prev) => ({ ...prev, name: saved.full_name, phone: saved.phone || "", bio: saved.bio || "", avatarUrl: saved.avatar_url || prev.avatarUrl }));
            showToast("Đã lưu thông tin hồ sơ thành công!");
          } catch (err) {
            showToast(err instanceof ApiError ? err.message : "Lưu hồ sơ thất bại.");
          }
        }}
        onChangePassword={async ({ currentPass, newPass }) => {
          await authService.changePassword({
            current_password: currentPass,
            new_password: newPass,
          });
          showToast("Đổi mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.");
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
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

              {/* VERTICAL TIMELINE SECTION */}
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

                {/* Vertical Timeline container with continuous bar */}
                <div className="relative pl-10 sm:pl-14 space-y-7">
                  {/* Continuous Vertical Bar */}
                  <div className="absolute left-[18px] sm:left-[22px] top-4 bottom-6 w-0.5 bg-slate-200" />

                  {currentWorkflowRecord.steps.map((step, idx) => {
                    const isApproved = step.status === "APPROVED";
                    const isPending = step.status === "PENDING";
                    const isNotReached = step.status === "NOT_REACHED";
                    const isRejected = step.status === "REJECTED";

                    return (
                      <div key={step.id || idx} className="relative group">
                        {/* Node / Icon on the vertical bar */}
                        <div
                          className={`absolute -left-[30px] sm:-left-[36px] top-1.5 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm z-10 transition-transform duration-200 ${
                            isApproved
                              ? "bg-emerald-500 text-white shadow-emerald-500/30"
                              : isPending
                              ? "bg-[#4285F4] text-white shadow-blue-500/40 animate-pulse"
                              : isRejected
                              ? "bg-rose-500 text-white shadow-rose-500/30"
                              : "bg-slate-100 border-2 border-slate-300 text-slate-400"
                          }`}
                        >
                          {isApproved && <Check className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.8]" />}
                          {isPending && <Circle className="w-3.5 h-3.5 fill-white text-white" />}
                          {isRejected && <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.8]" />}
                          {isNotReached && <Circle className="w-2.5 h-2.5 fill-slate-300 text-slate-300" />}
                        </div>

                        {/* Step Card Content */}
                        <div
                          className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
                            isApproved
                              ? "bg-white border-emerald-100 hover:border-emerald-200 shadow-xs"
                              : isPending
                              ? "bg-blue-50/20 border-blue-200 shadow-sm ring-1 ring-blue-100"
                              : isRejected
                              ? "bg-rose-50/20 border-rose-200 shadow-xs"
                              : "bg-slate-50/40 border-slate-200/70"
                          }`}
                        >
                          {/* Step Header Row */}
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-gray-100">
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                              {step.stepName}
                            </span>

                            {/* Status Badge */}
                            <div>
                              {isApproved && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Check className="w-3 h-3 stroke-[2.5]" />
                                  Đã duyệt
                                </span>
                              )}
                              {isPending && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#4285F4] border border-blue-200">
                                  <span className="w-2 h-2 rounded-full bg-[#4285F4] animate-ping inline-block" />
                                  Đang chờ duyệt
                                </span>
                              )}
                              {isNotReached && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                  Chưa đến lượt
                                </span>
                              )}
                              {isRejected && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <X className="w-3 h-3 stroke-[2.5]" />
                                  Từ chối
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Approver & Role & Timestamp */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="font-bold text-slate-900 text-sm sm:text-base">
                                  {step.approverName}
                                </h5>
                                <span className="text-xs text-slate-400">•</span>
                                <span className="text-xs sm:text-sm font-semibold text-slate-700">
                                  {step.approverRole}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 font-medium mt-0.5">
                                {step.department}
                              </p>
                            </div>

                            {/* Detailed Timestamp */}
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0 mt-1 sm:mt-0 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span
                                className={
                                  isPending
                                    ? "text-[#4285F4] font-semibold"
                                    : isNotReached
                                    ? "text-slate-400"
                                    : "text-slate-600"
                                }
                              >
                                {step.timestamp}
                              </span>
                            </div>
                          </div>

                          {/* Comment / Justification Box */}
                          <div className="mt-2 p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-100/90">
                            <p className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
                              <span>Ý kiến phê duyệt:</span>
                            </p>
                            <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">
                              "{step.comment}"
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cryptographic Immutability Notice (Read-only guarantee) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <div className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 shrink-0 shadow-xs">
                  <Lock className="w-5 h-5 text-slate-600" />
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-800">
                      Bảo Toàn Toàn Vẹn Audit Trail (Chỉ Đọc - Read-Only)
                    </p>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100/80 text-emerald-800">
                      Đã Khóa Niêm Phong
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Hồ sơ và nhật ký duyệt được niêm phong mật mã số. Tuyệt đối không có chức năng Chỉnh sửa (Edit) hoặc Xóa (Delete) đối với bất kỳ bước nào trong lịch sử phê duyệt, đảm bảo tính tuân thủ pháp lý và minh bạch nội bộ.
                  </p>
                  <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                      Mã băm khối xác thực:
                    </span>
                    <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 select-all">
                      {currentWorkflowRecord.auditHash}
                    </span>
                  </div>
                </div>
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
