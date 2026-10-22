/**
 * Hiring-manager data layer: real requisitions (and pipeline counts) mapped onto the manager UI types.
 * Replaces the INITIAL_* arrays that the manager pages used to render.
 */
import { apiRequest } from "@/lib/api-client";
import { requisitionService, type RequisitionItem } from "@/services/requisition.service";
import { salaryRange } from "@/features/approver/api";

export type ManagerReqStatus = "Pending" | "Active" | "Closed" | "Draft";

export interface ManagerRequisitionItem {
  /** Requisition code shown to users (e.g. REQ-2026-001). */
  id: string;
  /** Database id used for API calls and links. */
  dbId: number;
  title: string;
  department: string;
  departmentId?: number;
  level: string;
  jobTitleId?: number | null;
  targetCount: number;
  hiredCount: number;
  salaryRange: string;
  minSalary?: number;
  maxSalary?: number;
  isSalaryNegotiable?: boolean;
  salaryJustification?: string | null;
  createdAt: string;
  targetDate: string;
  status: ManagerReqStatus;
  rawStatus: string;
  description: string;
  requirements: string;
  benefits?: string;
  reason: string;
  rawReason?: string;
  reasonDetail?: string;
}

export interface HiringManagerRow {
  requisition_id: number;
  code: string;
  title: string;
  status: string;
  stage_counts: Record<string, number>;
  upcoming_interviews: Array<{ interview_id: number; candidate: string; at: string; round: string }>;
  waiting_for_my_feedback: Array<{ application_id: number; candidate: string; interview_id: number }>;
  days_until_needed: number | null;
}

export function managerStatus(s: string): ManagerReqStatus {
  if (s === "draft" || s === "changes_requested") return "Draft";
  if (s.startsWith("pending")) return "Pending";
  if (s === "approved" || s === "paused") return "Active";
  return "Closed"; // filled, cancelled, rejected
}

const vnDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "—");
const REASONS: Record<string, string> = { replacement: "Tuyển thay thế", expansion: "Tăng định biên", seasonal: "Thời vụ / Dự án" };

export function toManagerRequisition(r: RequisitionItem, hired = 0): ManagerRequisitionItem {
  return {
    id: r.code,
    dbId: r.id,
    title: r.title,
    department: r.department_name || "",
    departmentId: r.department_id,
    level: r.job_title_name || "—",
    jobTitleId: r.job_title_id,
    targetCount: r.quantity,
    hiredCount: hired,
    salaryRange: salaryRange(r.min_salary, r.max_salary),
    minSalary: r.min_salary,
    maxSalary: r.max_salary,
    isSalaryNegotiable: r.is_salary_negotiable,
    salaryJustification: r.salary_justification,
    createdAt: vnDate(r.created_at),
    targetDate: r.target_onboard_date || "",
    status: managerStatus(r.status),
    rawStatus: r.status,
    description: r.job_description || "",
    requirements: r.requirements || "",
    benefits: r.benefits || "",
    reason: [REASONS[r.reason] || r.reason, r.reason_detail].filter(Boolean).join(" — "),
    rawReason: r.reason,
    reasonDetail: r.reason_detail,
  };
}

export const managerApi = {
  /** Pipeline numbers for requisitions owned by this manager (S8-06). */
  async dashboard(): Promise<HiringManagerRow[]> {
    return apiRequest<HiringManagerRow[]>("/analytics/hiring-manager");
  },
  async requisitions(): Promise<ManagerRequisitionItem[]> {
    const [reqs, dash] = await Promise.all([
      requisitionService.getRequisitions(),
      managerApi.dashboard().catch(() => [] as HiringManagerRow[]),
    ]);
    const hired = new Map(dash.map((d) => [d.requisition_id, d.stage_counts?.hired || 0]));
    return reqs.map((r) => toManagerRequisition(r, hired.get(r.id) || 0));
  },
  /**
   * S2-10: Tạo mới yêu cầu tuyển dụng với đầy đủ thông số nghiệp vụ (AC01 - AC04),
   * không hardcode, hỗ trợ cả lưu nháp và nộp duyệt trực tiếp.
   */
  async createRequisition(data: {
    title: string;
    department_id: number;
    job_title_id?: number;
    quantity: number;
    reason: "replacement" | "expansion" | "seasonal";
    reason_detail?: string;
    min_salary?: number;
    max_salary?: number;
    is_salary_negotiable?: boolean;
    salary_justification?: string;
    target_onboard_date?: string;
    job_description?: string;
    requirements?: string;
    benefits?: string;
    save_as_draft?: boolean;
  }) {
    const created = await requisitionService.createRequisition(data as Partial<RequisitionItem>);
    return toManagerRequisition(created);
  },

  /** Cập nhật yêu cầu tuyển dụng ở trạng thái nháp. */
  async updateRequisition(
    id: number,
    data: {
      title?: string;
      department_id?: number;
      job_title_id?: number;
      quantity?: number;
      reason?: "replacement" | "expansion" | "seasonal";
      reason_detail?: string;
      min_salary?: number;
      max_salary?: number;
      is_salary_negotiable?: boolean;
      salary_justification?: string;
      target_onboard_date?: string;
      job_description?: string;
      requirements?: string;
      benefits?: string;
    }
  ) {
    const updated = await requisitionService.updateRequisition(id, data as Partial<RequisitionItem>);
    return toManagerRequisition(updated);
  },

  /** Gửi duyệt yêu cầu từ bản nháp. */
  async submitRequisition(id: number) {
    const submitted = await requisitionService.submitRequisition(id);
    return toManagerRequisition(submitted);
  },

  /** S2-10 legacy wrapper for backwards-compatibility */
  async createAndSubmit(data: { title: string; department_id: number; job_title_id?: number; quantity: number; target_onboard_date?: string; job_description: string; requirements: string; reason_detail: string }) {
    const created = await requisitionService.createRequisition({ ...data, reason: "expansion", save_as_draft: false } as Partial<RequisitionItem>);
    return toManagerRequisition(created);
  },

  async copyAndSubmit(sourceId: number, edits: { title: string; quantity: number; target_onboard_date?: string; job_description: string; requirements: string; reason_detail: string }) {
    const draft = await requisitionService.copyRequisition(sourceId);
    const updated = await requisitionService.updateRequisition(draft.id, {
      department_id: draft.department_id,
      job_title_id: draft.job_title_id,
      title: edits.title,
      quantity: edits.quantity,
      target_onboard_date: edits.target_onboard_date,
      job_description: edits.job_description,
      requirements: edits.requirements,
      reason_detail: edits.reason_detail,
    });
    try {
      const submitted = await requisitionService.submitRequisition(updated.id);
      return { requisition: toManagerRequisition(submitted), submitted: true as const, error: null };
    } catch (error) {
      return { requisition: toManagerRequisition(updated), submitted: false as const, error };
    }
  },

  async copyAsDraft(sourceId: number, edits: { title: string; quantity: number; target_onboard_date?: string; job_description: string; requirements: string; reason_detail: string }) {
    const draft = await requisitionService.copyRequisition(sourceId);
    const updated = await requisitionService.updateRequisition(draft.id, {
      department_id: draft.department_id,
      job_title_id: draft.job_title_id,
      title: edits.title,
      quantity: edits.quantity,
      target_onboard_date: edits.target_onboard_date,
      job_description: edits.job_description,
      requirements: edits.requirements,
      reason_detail: edits.reason_detail,
    });
    return toManagerRequisition(updated);
  },
};

export interface CandidateApproverView {
  id: number;
  fullName: string;
  email: string;
  role: string;
  department?: string;
}

export interface ApprovalStepView {
  stepNumber: number;
  stepCode: string;
  stepName: string;
  approverName: string;
  approverEmail?: string;
  approverRole: string;
  department: string;
  status: "APPROVED" | "IN_PROGRESS" | "REJECTED" | "CHANGES_REQUESTED" | "PENDING";
  actionLabel?: string;
  timestamp?: string;
  waitingTime?: string;
  isOverdue?: boolean;
  comment?: string;
  avatarColor: string;
  initials: string;
  candidateApprovers?: CandidateApproverView[];
}

export interface ManagerRequisitionDetail extends ManagerRequisitionItem {
  workType: string;
  pipeline: { submitted: number; screening: number; interview: number; offered: number; hired: number };
  approvalSteps: ApprovalStepView[];
  currentApproverInfo?: RequisitionItem["current_approver_info"];
}

const STEP_NAMES: Record<string, string> = {
  manager: "Phê duyệt cấp quản lý",
  hr: "Trưởng phòng Nhân sự thẩm định",
  executive: "Ban Giám đốc phê duyệt",
};

const STEP_ROLES: Record<string, string> = {
  manager: "Người duyệt cấp quản lý",
  hr: "Trưởng phòng Nhân sự",
  executive: "Ban Giám đốc",
};

const STEP_LABELS_MAP: Record<string, string> = {
  "Trưởng Khối Duyệt": "manager",
  "HR Manager Phê Duyệt": "hr",
  "Ban Giám Đốc Phê Duyệt": "executive",
};

const WAIT_SLA_HOURS = 48;
const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((x) => x[0])
    .join("")
    .toUpperCase() || "?";
const fmt = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : undefined;

export function approvalSteps(r: RequisitionItem): ApprovalStepView[] {
  const logs = r.approval_logs || [];
  const submitted = [...logs].reverse().find((l) => l.action === "submitted");

  const steps: ApprovalStepView[] = [
    {
      stepNumber: 1,
      stepCode: "submit",
      stepName: "Tạo và gửi đề xuất",
      approverName: r.creator_name || "—",
      approverEmail: undefined,
      approverRole: "Người lập tờ trình",
      department: r.department_name || "",
      status: submitted || r.status !== "draft" ? "APPROVED" : "IN_PROGRESS",
      actionLabel: "Đã gửi tờ trình",
      timestamp: fmt(submitted?.created_at || r.created_at),
      comment: submitted?.comment || undefined,
      avatarColor: "bg-blue-600",
      initials: initialsOf(r.creator_name || ""),
    },
  ];

  const chain = r.approval_chain || [];
  const current = r.status.startsWith("pending_") ? r.status.replace("pending_", "") : null;
  const lastEvent = logs.length ? logs[logs.length - 1].created_at : r.created_at;

  chain.forEach((step, idx) => {
    // Find the latest decision log for this specific step (match by step_code or normalized step_name)
    const decided = [...logs].reverse().find(
      (l) =>
        (l.step_code === step ||
          STEP_LABELS_MAP[l.step_name || ""] === step ||
          l.step_name === STEP_NAMES[step]) &&
        l.action !== "submitted"
    );

    const isCurrent = current === step;
    const isDone =
      (!isCurrent && (r.approval_step_index ?? 0) > idx) ||
      r.status === "approved" ||
      Boolean(decided && decided.action === "approved" && !isCurrent);

    const isRejected =
      decided?.action === "rejected" ||
      (r.status === "rejected" && (r.approval_step_index ?? 0) === idx);

    const isChangesRequested =
      decided?.action === "changes_requested" ||
      (r.status === "changes_requested" && (r.approval_step_index ?? 0) === idx);

    let status: ApprovalStepView["status"] = "PENDING";
    let actionLabel = "Chưa tới lượt";
    let avatarColor = "bg-slate-400";

    if (isCurrent) {
      status = "IN_PROGRESS";
      actionLabel = "Đang chờ duyệt";
      avatarColor = "bg-amber-600";
    } else if (isRejected) {
      status = "REJECTED";
      actionLabel = "Đã từ chối";
      avatarColor = "bg-rose-600";
    } else if (isChangesRequested) {
      status = "CHANGES_REQUESTED";
      actionLabel = "Yêu cầu bổ sung";
      avatarColor = "bg-orange-500";
    } else if (isDone) {
      status = "APPROVED";
      actionLabel = "Đã phê duyệt";
      avatarColor = "bg-emerald-600";
    }

    const waitedHours = isCurrent && lastEvent ? (Date.now() - new Date(lastEvent).getTime()) / 3_600_000 : 0;

    // Resolve candidate approvers for the pending step from current_approver_info
    const candidateApprovers =
      isCurrent && r.current_approver_info?.approvers
        ? r.current_approver_info.approvers.map((u) => ({
            id: u.id,
            fullName: u.full_name,
            email: u.email,
            role: u.role,
            department: u.department,
          }))
        : undefined;

    const primaryCandidate = candidateApprovers && candidateApprovers.length > 0 ? candidateApprovers[0] : null;

    const resolvedApproverName =
      decided?.approver_name ||
      (primaryCandidate ? primaryCandidate.fullName : STEP_ROLES[step] || step);

    const resolvedApproverEmail =
      decided?.approver_email ||
      (primaryCandidate ? primaryCandidate.email : undefined);

    const resolvedApproverRole =
      decided?.approver_role ||
      (primaryCandidate ? primaryCandidate.role : STEP_ROLES[step] || step);

    steps.push({
      stepNumber: idx + 2,
      stepCode: step,
      stepName: STEP_NAMES[step] || step,
      approverName: resolvedApproverName,
      approverEmail: resolvedApproverEmail,
      approverRole: resolvedApproverRole,
      department: decided?.approver_department || r.department_name || "",
      status,
      actionLabel,
      timestamp: decided ? fmt(decided.created_at) : isDone ? fmt(lastEvent) : undefined,
      waitingTime: isCurrent
        ? `Đang chờ xử lý: ${Math.floor(waitedHours / 24)} ngày ${Math.floor(waitedHours % 24)} giờ`
        : undefined,
      isOverdue: isCurrent && waitedHours > WAIT_SLA_HOURS,
      comment: decided?.comment || (isRejected && r.reject_reason ? r.reject_reason : undefined),
      avatarColor,
      initials: initialsOf(resolvedApproverName),
      candidateApprovers,
    });
  });

  return steps;
}

export async function managerRequisitionDetail(id: number): Promise<ManagerRequisitionDetail> {
  const [r, dash] = await Promise.all([
    requisitionService.getRequisitionById(id),
    managerApi.dashboard().catch(() => [] as HiringManagerRow[]),
  ]);
  const counts = dash.find((d) => d.requisition_id === r.id)?.stage_counts || {};
  const base = toManagerRequisition(r, counts.hired || 0);
  return {
    ...base,
    workType: r.employment_type || "—",
    pipeline: {
      submitted: Object.entries(counts).reduce((n, [k, v]) => (k === "rejected" ? n : n + (v || 0)), 0),
      screening: counts.screening || 0,
      interview: counts.interviewing || 0,
      offered: counts.offered || 0,
      hired: counts.hired || 0,
    },
    approvalSteps: approvalSteps(r),
    currentApproverInfo: r.current_approver_info,
  };
}
