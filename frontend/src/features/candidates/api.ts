/**
 * Candidate data layer for recruiter screens: real applications grouped per person (person_key / email),
 * the unified profile (notes, tags, timeline, previous applications) and real actions.
 * Replaces features/candidates/mockCandidates.ts.
 */
import { apiRequest, API_BASE_URL, ApiError } from "@/lib/api-client";
import type { CandidateApplication, CandidateEmailLog, CandidateNote, UnifiedCandidate } from "./types";

export interface ApiApplication {
  id: number;
  job_posting_id: number;
  job_title?: string | null;
  department?: string | null;
  full_name: string;
  email: string;
  phone?: string | null;
  current_company?: string | null;
  current_position?: string | null;
  years_of_experience?: number | null;
  cv_url?: string | null;
  status: string;
  rating?: number | null;
  tags?: string[];
  source?: string | null;
  person_key?: string | null;
  match_score?: number | null;
  tracking_code?: string | null;
  parsed_cv?: { skills?: string[]; education?: string } | null;
  created_at?: string | null;
  updated_at?: string | null;
  applied_date?: string | null;
}

export const STAGE_LABEL: Record<string, string> = {
  submitted: "Hồ sơ mới", screening: "Sàng lọc", interviewing: "Phỏng vấn", offered: "Đề xuất offer",
  hired: "Đã nhận việc", onboarded: "Đã onboard", rejected: "Đã loại", withdrawn: "Ứng viên rút",
};

const appStatus = (s: string): CandidateApplication["status"] =>
  s === "rejected" ? "rejected" : s === "withdrawn" ? "withdrawn" : s === "hired" || s === "onboarded" ? "hired" : "active";

const vnDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : "");

function toApplication(a: ApiApplication): CandidateApplication {
  return {
    id: String(a.id),
    jobTitle: a.job_title || "",
    jobCode: a.tracking_code || `APP-${a.id}`,
    department: a.department || "",
    appliedDate: a.applied_date || vnDate(a.created_at),
    stage: STAGE_LABEL[a.status] || a.status,
    status: appStatus(a.status),
    matchScore: a.match_score ?? 0,
    recruiter: "",
  };
}

/** Group applications of the same person into one candidate record (latest application first). */
export function toCandidates(apps: ApiApplication[]): UnifiedCandidate[] {
  const groups = new Map<string, ApiApplication[]>();
  for (const a of apps) {
    const key = (a.person_key || a.email || String(a.id)).toLowerCase();
    groups.set(key, [...(groups.get(key) || []), a]);
  }
  return Array.from(groups.values()).map((list) => {
    const sorted = [...list].sort((x, y) => (y.created_at || "").localeCompare(x.created_at || ""));
    const latest = sorted[0];
    const tags = Array.from(new Set(sorted.flatMap((a) => a.tags || [])));
    const skills = Array.from(new Set(sorted.flatMap((a) => a.parsed_cv?.skills || [])));
    return {
      id: String(latest.id),
      name: latest.full_name,
      email: latest.email,
      phone: latest.phone || "",
      linkedInUrl: "",
      address: "",
      dob: "",
      avatar: "",
      latestPosition: latest.job_title || latest.current_position || "",
      latestStatus: STAGE_LABEL[latest.status] || latest.status,
      source: latest.source || "Không rõ",
      expectedSalary: "",
      salaryRange: "",
      skills,
      tags,
      university: latest.parsed_cv?.education || "",
      experienceYears: latest.years_of_experience != null ? `${latest.years_of_experience} năm kinh nghiệm` : "",
      updatedAt: vnDate(latest.updated_at || latest.created_at),
      cvFileName: latest.cv_url ? latest.cv_url.split("/").pop() || "CV" : "",
      applications: sorted.map(toApplication),
      evaluation: { technicalSkill: 0, softSkill: 0, cultureFit: 0, recommendationLevel: "", summary: "" },
      notes: [],
    };
  });
}

interface ProfileResponse {
  application: ApiApplication;
  previous_applications: ApiApplication[];
  notes: Array<{ id: number; content: string; author_name?: string | null; created_at?: string }>;
  timeline: Array<{ at: string | null; type: string; text: string; application_id: number }>;
}

interface EvaluationRow {
  technical_score?: number | null; culture_fit_score?: number | null; communication_score?: number | null;
  overall_score?: number | null; weighted_score?: number | null; recommendation: string; comments?: string | null;
}

const REC_LABEL: Record<string, string> = { hire: "Hire", hold: "Consider", reject: "No Hire" };

export const candidatesApi = {
  async list(): Promise<UnifiedCandidate[]> {
    return toCandidates(await apiRequest<ApiApplication[]>("/applications"));
  },

  /** Unified profile of the person behind application `appId` (S4-09, S5-07). */
  async profile(appId: number): Promise<UnifiedCandidate & { cvUrl: string | null; applicationId: number; timeline: ProfileResponse["timeline"] }> {
    const [p, evals] = await Promise.all([
      apiRequest<ProfileResponse>(`/applications/${appId}/profile`),
      apiRequest<EvaluationRow[]>(`/referrals/evaluations?application_id=${appId}`).catch(() => [] as EvaluationRow[]),
    ]);
    const base = toCandidates([p.application, ...p.previous_applications]).find((c) => c.applications.some((a) => a.id === String(appId)))
      || toCandidates([p.application])[0];
    const notes: CandidateNote[] = p.notes.map((n) => ({
      id: String(n.id), author: n.author_name || "—", role: "", createdAt: n.created_at ? new Date(n.created_at).toLocaleString("vi-VN") : "", content: n.content,
    }));
    const emailLogs: CandidateEmailLog[] = p.timeline.filter((t) => t.type === "email").map((t, i) => ({
      id: `mail-${i}`, subject: t.text, templateType: "email", sentAt: t.at ? new Date(t.at).toLocaleString("vi-VN") : "",
      sender: "Hệ thống", recipientEmail: p.application.email, status: t.text.includes("sent") ? "sent" : t.text.split(": ").pop() || "", contentSnippet: "",
    }));
    const avg = (xs: Array<number | null | undefined>) => {
      const v = xs.filter((x): x is number => typeof x === "number");
      return v.length ? Math.round((v.reduce((s, x) => s + x, 0) / v.length / 2) * 10) / 10 : 0; // 1–10 → 1–5
    };
    return {
      ...base,
      tags: p.application.tags || base.tags,
      notes,
      emailLogs,
      evaluation: {
        technicalSkill: avg(evals.map((e) => e.technical_score)),
        softSkill: avg(evals.map((e) => e.communication_score)),
        cultureFit: avg(evals.map((e) => e.culture_fit_score)),
        recommendationLevel: evals.length ? REC_LABEL[evals[evals.length - 1].recommendation] || evals[evals.length - 1].recommendation : "",
        summary: evals.map((e) => e.comments).filter(Boolean).join("\n"),
      },
      cvUrl: p.application.cv_url || null,
      applicationId: p.application.id,
      timeline: p.timeline,
    };
  },

  async setTags(appId: number, tags: string[], rating?: number | null) {
    return apiRequest(`/applications/${appId}/tags`, { method: "PUT", body: JSON.stringify({ tags, ...(rating ? { rating } : {}) }) });
  },

  async addNote(appId: number, content: string) {
    return apiRequest<{ id: number; content: string; author_name?: string; created_at?: string }>(`/applications/${appId}/notes`, {
      method: "POST", body: JSON.stringify({ content }),
    });
  },

  /** S5-08: a candidate sourced by a recruiter (goes through duplicate detection on the server). */
  async addManual(data: { job_posting_id: number; full_name: string; email: string; phone: string; cv_url?: string; source?: string }) {
    return apiRequest<ApiApplication>("/applications/manual", { method: "POST", body: JSON.stringify(data) });
  },

  /** S6-01: server-side export (scoped, no internal notes, formula-safe), downloaded as a file. */
  async downloadExport(jobId?: number): Promise<string> {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const res = await fetch(`${API_BASE_URL}/applications/export${jobId ? `?job_id=${jobId}` : ""}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
    });
    if (!res.ok) throw new ApiError(res.status, res.status === 403 ? "Bạn không có quyền xuất danh sách ứng viên." : "Không xuất được danh sách ứng viên.");
    const disposition = res.headers.get("content-disposition") || "";
    const name = /filename="?([^"]+)"?/.exec(disposition)?.[1] || "ung_vien.xlsx";
    const url = URL.createObjectURL(await res.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
    return name;
  },
};
