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
  level: string;
  targetCount: number;
  hiredCount: number;
  salaryRange: string;
  createdAt: string;
  targetDate: string;
  status: ManagerReqStatus;
  rawStatus: string;
  description: string;
  requirements: string;
  reason: string;
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
const REASONS: Record<string, string> = { replacement: "Tuyển thay thế", expansion: "Tăng định biên", new_position: "Vị trí mới" };

export function toManagerRequisition(r: RequisitionItem, hired = 0): ManagerRequisitionItem {
  return {
    id: r.code,
    dbId: r.id,
    title: r.title,
    department: r.department_name || "",
    level: r.job_title_name || "—",
    targetCount: r.quantity,
    hiredCount: hired,
    salaryRange: salaryRange(r.min_salary, r.max_salary),
    createdAt: vnDate(r.created_at),
    targetDate: r.target_onboard_date || "",
    status: managerStatus(r.status),
    rawStatus: r.status,
    description: r.job_description || "",
    requirements: r.requirements || "",
    reason: [REASONS[r.reason] || r.reason, r.reason_detail].filter(Boolean).join(" — "),
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
   * S3-05: copy an existing requisition (always a clean draft without approval history), apply the
   * edited fields, then submit it for approval. Returns the new requisition and whether submit worked.
   */
  /** S2-10: a brand-new requisition, sent straight into the approval chain. */
  async createAndSubmit(data: { title: string; department_id: number; job_title_id?: number; quantity: number; target_onboard_date?: string; job_description: string; requirements: string; reason_detail: string }) {
    const created = await requisitionService.createRequisition({ ...data, reason: "expansion", save_as_draft: false } as Parameters<typeof requisitionService.createRequisition>[0]);
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

export interface ApprovalStepView {
  stepNumber: number;
  stepName: string;
  approverName: string;
  approverRole: string;
  department: string;
  status: "APPROVED" | "IN_PROGRESS" | "PENDING";
  timestamp?: string;
  waitingTime?: string;
  isOverdue?: boolean;
  comment?: string;
  avatarColor: string;
  initials: string;
}

export interface ManagerRequisitionDetail extends ManagerRequisitionItem {
  workType: string;
  pipeline: { submitted: number; screening: number; interview: number; offered: number; hired: number };
  approvalSteps: ApprovalStepView[];
}

const STEP_NAMES: Record<string, string> = {
  manager: "Phê duyệt cấp quản lý", hr: "Trưởng phòng Nhân sự thẩm định", executive: "Ban Giám đốc phê duyệt",
};
const STEP_ROLES: Record<string, string> = { manager: "Người duyệt cấp quản lý", hr: "Trưởng phòng Nhân sự", executive: "Ban Giám đốc" };
const WAIT_SLA_HOURS = 48;
const initialsOf = (name: string) => name.split(" ").filter(Boolean).slice(-2).map((x) => x[0]).join("").toUpperCase() || "?";
const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : undefined);

export function approvalSteps(r: RequisitionItem): ApprovalStepView[] {
  const logs = r.approval_logs || [];
  const submitted = [...logs].reverse().find((l) => l.action === "submitted");
  const steps: ApprovalStepView[] = [{
    stepNumber: 1, stepName: "Tạo và gửi đề xuất", approverName: r.creator_name || "—", approverRole: "Người lập tờ trình",
    department: r.department_name || "", status: submitted || r.status !== "draft" ? "APPROVED" : "IN_PROGRESS",
    timestamp: fmt(submitted?.created_at || r.created_at), avatarColor: "bg-blue-600", initials: initialsOf(r.creator_name || ""),
  }];
  const chain = r.approval_chain || [];
  const current = r.status.startsWith("pending_") ? r.status.replace("pending_", "") : null;
  const lastEvent = logs.length ? logs[logs.length - 1].created_at : r.created_at;
  chain.forEach((step, idx) => {
    const decided = [...logs].reverse().find((l) => l.step_name === step && l.action !== "submitted");
    const isCurrent = current === step;
    const done = !isCurrent && (r.approval_step_index ?? 0) > idx || r.status === "approved" || (decided && decided.action === "approved" && !isCurrent);
    const waitedHours = isCurrent && lastEvent ? (Date.now() - new Date(lastEvent).getTime()) / 3_600_000 : 0;
    steps.push({
      stepNumber: idx + 2,
      stepName: STEP_NAMES[step] || step,
      approverName: decided?.approver_name || STEP_ROLES[step] || step,
      approverRole: STEP_ROLES[step] || step,
      department: "",
      status: isCurrent ? "IN_PROGRESS" : done ? "APPROVED" : "PENDING",
      timestamp: done ? fmt(decided?.created_at) : undefined,
      waitingTime: isCurrent ? `Đang chờ xử lý: ${Math.floor(waitedHours / 24)} ngày ${Math.floor(waitedHours % 24)} giờ` : undefined,
      isOverdue: isCurrent && waitedHours > WAIT_SLA_HOURS,
      comment: decided?.comment || undefined,
      avatarColor: isCurrent ? "bg-amber-600" : done ? "bg-indigo-600" : "bg-slate-400",
      initials: initialsOf(decided?.approver_name || STEP_ROLES[step] || step),
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
  };
}
