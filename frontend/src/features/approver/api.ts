/**
 * Approver data layer: real requisitions and offers from the backend, mapped onto the approver UI types.
 * Replaces features/approver/mock-data.ts (INITIAL_REQUISITIONS / INITIAL_OFFERS).
 */
import { requisitionService, type RequisitionItem, type RequisitionApprovalLog } from "@/services/requisition.service";
import { offerService, type OfferItem, type OfferDecisionAction } from "@/services/offer.service";
import type { ApprovalTimelineItem, OfferApprovalItem, RequisitionApprovalItem } from "./types";

const STEP_LABEL: Record<string, string> = {
  manager: "Trưởng bộ phận", hr: "Trưởng phòng Nhân sự", executive: "Ban Giám đốc", hr_manager: "Trưởng phòng Nhân sự", approver: "Ban Giám đốc",
};

const money = (n?: number | null) => (n ? `${Math.round(n / 1_000_000)}` : "?");
export const salaryRange = (min?: number | null, max?: number | null) =>
  min || max ? `${money(min)} - ${money(max)} triệu VNĐ` : "Thỏa thuận";

function reqStatus(s: string): RequisitionApprovalItem["status"] {
  if (s === "pending_executive") return "pending_board";
  if (s === "pending_manager" || s === "pending_hr" || s === "approved" || s === "rejected" || s === "changes_requested") return s;
  return s as RequisitionApprovalItem["status"];
}

function reqStep(r: RequisitionItem): RequisitionApprovalItem["current_approval_step"] {
  if (r.status === "pending_manager") return "manager";
  if (r.status === "pending_hr") return "hr";
  if (r.status === "pending_executive") return "board";
  return "completed";
}

function reqTimeline(r: RequisitionItem): ApprovalTimelineItem[] {
  const logs: RequisitionApprovalLog[] = r.approval_logs || [];
  return logs.map((l) => ({
    id: l.id,
    step_name: l.step_name || "",
    approver_name: l.approver_name || "—",
    approver_role: STEP_LABEL[l.step_name || ""] || l.step_name || "",
    action: (["submitted", "approved", "rejected", "changes_requested"].includes(l.action) ? l.action : "submitted") as ApprovalTimelineItem["action"],
    comment: l.comment || undefined,
    created_at: l.created_at || "",
  }));
}

export function toRequisitionApproval(r: RequisitionItem): RequisitionApprovalItem {
  return {
    id: r.id,
    code: r.code,
    title: r.title,
    department: r.department_name || "",
    quantity: r.quantity,
    reason: r.reason,
    reason_detail: r.reason_detail,
    priority: (r.priority as RequisitionApprovalItem["priority"]) || "medium",
    employment_type: r.employment_type,
    work_location: r.work_location,
    salary_range: salaryRange(r.min_salary, r.max_salary),
    min_salary: r.min_salary,
    max_salary: r.max_salary,
    target_onboard_date: r.target_onboard_date,
    job_description: r.job_description,
    requirements: r.requirements,
    benefits: r.benefits,
    created_by: r.creator_name || "—",
    created_at: r.created_at || "",
    status: reqStatus(r.status),
    current_approval_step: reqStep(r),
    timeline: reqTimeline(r),
  };
}

function offerStatus(s: string): OfferApprovalItem["status"] {
  if (s === "pending_approval") return "pending";
  if (["sent", "accepted", "declined", "rejected", "changes_requested"].includes(s)) return s as OfferApprovalItem["status"];
  return s as OfferApprovalItem["status"];
}

export function toOfferApproval(o: OfferItem): OfferApprovalItem {
  const max = o.band_max || 0;
  const over = max > 0 && o.offered_salary > max;
  return {
    id: o.id,
    code: `OF-${String(o.id).padStart(4, "0")}`,
    candidate_name: o.candidate_name || "—",
    candidate_email: o.candidate_email || "",
    job_title: o.job_title || "",
    department: o.department || "",
    offered_salary: o.offered_salary,
    standard_salary_min: o.band_min || 0,
    standard_salary_max: max,
    is_over_budget: over || !!o.requires_escalation,
    over_percentage: over ? Math.round(((o.offered_salary - max) / max) * 100) : 0,
    probation_salary_percentage: o.probation_salary_percentage,
    probation_duration_months: o.probation_duration_months,
    start_date: o.start_date,
    work_location: o.work_location,
    notes: o.salary_justification || o.notes,
    created_by: o.created_by_name || "—",
    created_at: o.created_at || "",
    status: offerStatus(o.status),
    timeline: (o.approval_logs || []).map((l) => ({
      id: l.id,
      step_name: l.level || "",
      approver_name: l.actor_name || "—",
      approver_role: STEP_LABEL[l.level || ""] || l.level || "",
      action: (["submitted", "approved", "rejected", "changes_requested"].includes(l.action) ? l.action : "submitted") as ApprovalTimelineItem["action"],
      comment: l.comment || undefined,
      created_at: l.created_at || "",
    })),
  };
}

export const approverApi = {
  async requisitions(): Promise<RequisitionApprovalItem[]> {
    return (await requisitionService.getRequisitions()).map(toRequisitionApproval);
  },
  async offers(): Promise<OfferApprovalItem[]> {
    return (await offerService.getOffers()).map(toOfferApproval);
  },
  /** Approve / reject / request changes on a requisition; the backend checks the step and the comment rule. */
  async decideRequisition(id: number, action: "approved" | "rejected" | "changes_requested", comment?: string) {
    return toRequisitionApproval(await requisitionService.approveRequisition(id, action, comment));
  },
  async decideOffer(id: number, action: OfferDecisionAction, comment?: string) {
    return toOfferApproval(await offerService.decide(id, action, comment));
  },
};

/** Requisitions waiting on any step (the backend decides whether this user may act on the current step). */
export const isPendingRequisition = (r: RequisitionApprovalItem) =>
  r.status === "pending_manager" || r.status === "pending_hr" || r.status === "pending_board";

export interface MyDecision {
  id: string;
  type: "REQ" | "OFFER";
  code: string;
  title: string;
  department: string;
  amountOrQuantity: string;
  decision: "approved" | "rejected" | "changes_requested";
  decidedAt: string;
  decidedBy: string;
  note: string;
  timeline: ApprovalTimelineItem[];
}

const DECISIONS = new Set(["approved", "rejected", "changes_requested"]);
const vnDateTime = (iso?: string) => (iso ? new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "");

/** Every approval decision recorded under this user's id (from the append-only approval logs). */
export async function myDecisions(userId: number, userName: string): Promise<MyDecision[]> {
  const [reqs, offers] = await Promise.all([requisitionService.getRequisitions(), offerService.getOffers()]);
  const out: Array<MyDecision & { at: string }> = [];
  for (const r of reqs) {
    for (const l of r.approval_logs || []) {
      if (l.approver_id !== userId || !DECISIONS.has(l.action)) continue;
      const item = toRequisitionApproval(r);
      out.push({
        id: `REQ-${r.id}-${l.id}`, type: "REQ", code: r.code, title: r.title, department: r.department_name || "",
        amountOrQuantity: `${r.quantity} nhân sự (${item.salary_range})`,
        decision: l.action as MyDecision["decision"], decidedAt: vnDateTime(l.created_at), decidedBy: userName,
        note: l.comment || "", timeline: item.timeline, at: l.created_at || "",
      });
    }
  }
  for (const o of offers) {
    for (const l of o.approval_logs || []) {
      if (l.actor_id !== userId || !DECISIONS.has(l.action)) continue;
      const item = toOfferApproval(o);
      out.push({
        id: `OFFER-${o.id}-${l.id}`, type: "OFFER", code: item.code, title: `Offer: ${item.candidate_name} (${item.job_title})`,
        department: item.department, amountOrQuantity: `${o.offered_salary.toLocaleString("vi-VN")} ${o.currency}`,
        decision: l.action as MyDecision["decision"], decidedAt: vnDateTime(l.created_at), decidedBy: userName,
        note: l.comment || "", timeline: item.timeline, at: l.created_at || "",
      });
    }
  }
  return out.sort((a, b) => (a.at < b.at ? 1 : -1));
}
