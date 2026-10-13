/**
 * Interviewer data layer — the signed-in user's own interviews (GET /interviews?mine=true), scorecards and
 * question bank. Replaces the hardcoded arrays of the interviewer pages.
 */
import { interviewService, type InterviewItem } from "@/services/interview.service";
import { referralService, type EvaluationItem } from "@/services/referral.service";

/** S6-08 / S7-01: a scorecard is expected within 24 hours of the interview. */
export const SCORECARD_DUE_HOURS = 24;

const hm = (d: Date) => d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
const dayLabel = (d: Date) => {
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86_400_000);
  if (d.toDateString() === today.toDateString()) return "Hôm nay";
  if (d.toDateString() === tomorrow.toDateString()) return "Ngày mai";
  return d.toLocaleDateString("vi-VN");
};

export interface UpcomingInterviewCard {
  id: number;
  applicationId: number;
  candidateName: string;
  position: string;
  department: string;
  time: string;
  format: string;
  meetingLink?: string;
  status: string;
  statusColor: string;
  experience: string;
  education: string;
  skills: string[];
  cvUrl?: string | null;
}

export interface PendingScorecard {
  id: number;
  applicationId: number;
  candidateName: string;
  position: string;
  department: string;
  interviewDate: string;
  timeSlot: string;
  interviewedAt: string;
  dueWarning: string;
  isOverdue: boolean;
  dueClass: string;
  urgency: string;
  urgencyClass: string;
}

export interface EvaluationHistoryRow {
  id: number;
  interviewId?: number | null;
  candidate: string;
  position: string;
  department: string;
  score: string;
  recommendation: string;
  date: string;
}

const RECOMMENDATION_LABEL: Record<string, string> = { hire: "Nên tuyển", hold: "Cân nhắc", reject: "Không nên tuyển" };

export function toUpcoming(i: InterviewItem): UpcomingInterviewCard {
  const start = new Date(i.scheduled_time);
  const end = new Date(start.getTime() + (i.duration_minutes || 60) * 60000);
  const confirmed = i.candidate_response === "confirmed";
  const reschedule = i.candidate_response === "reschedule_requested";
  return {
    id: i.id,
    applicationId: i.application_id,
    candidateName: i.candidate_name || "—",
    position: i.job_title || "",
    department: "",
    time: `${hm(start)} - ${hm(end)}, ${dayLabel(start)}`,
    format: i.meeting_link ? "Trực tuyến" : i.location ? `Trực tiếp (${i.location})` : "Trực tiếp",
    meetingLink: i.meeting_link || undefined,
    status: reschedule ? "Ứng viên xin đổi lịch" : confirmed ? "Ứng viên đã xác nhận" : "Chờ ứng viên xác nhận",
    statusColor: reschedule
      ? "bg-amber-50 text-amber-700 border-amber-200/80"
      : confirmed ? "bg-blue-50 text-blue-700 border-blue-200/80" : "bg-slate-100 text-slate-700 border-slate-200",
    experience: "",
    education: "",
    skills: [],
    cvUrl: i.cv_url,
  };
}

export function toPending(i: InterviewItem): PendingScorecard {
  const start = new Date(i.scheduled_time);
  const end = new Date(start.getTime() + (i.duration_minutes || 60) * 60000);
  const due = new Date(start.getTime() + SCORECARD_DUE_HOURS * 3_600_000);
  const overdueHours = (Date.now() - due.getTime()) / 3_600_000;
  const isOverdue = overdueHours > 0;
  return {
    id: i.id,
    applicationId: i.application_id,
    candidateName: i.candidate_name || "—",
    position: i.job_title || "",
    department: "",
    interviewDate: start.toLocaleDateString("vi-VN"),
    timeSlot: `${hm(start)} - ${hm(end)}`,
    interviewedAt: `Phỏng vấn lúc ${hm(start)} ${dayLabel(start).toLowerCase()}`,
    dueWarning: isOverdue
      ? `Quá hạn ${overdueHours >= 24 ? `${Math.floor(overdueHours / 24)} ngày` : `${Math.max(1, Math.floor(overdueHours))} giờ`}`
      : `Cần nộp trước ${hm(due)} ${dayLabel(due).toLowerCase()}`,
    isOverdue,
    dueClass: isOverdue ? "text-rose-600 bg-rose-50 border-rose-200/80" : "text-amber-700 bg-amber-50 border-amber-200/80",
    urgency: isOverdue ? "Quá hạn" : "Chờ nộp",
    urgencyClass: isOverdue ? "bg-rose-100 text-rose-800 border-rose-300 font-extrabold" : "bg-amber-50 text-amber-700 border-amber-200/80",
  };
}

export const interviewerApi = {
  async mine(): Promise<InterviewItem[]> {
    return (await interviewService.getMine()).filter((i) => i.status !== "cancelled");
  },
  /** Upcoming interviews (not finished yet) and scorecards still to submit (interview already started). */
  async home() {
    const list = await interviewerApi.mine();
    const now = Date.now();
    const upcoming = list.filter((i) => new Date(i.scheduled_time).getTime() >= now - 60 * 60000 && i.status !== "completed")
      .sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));
    const pending = list.filter((i) => !i.my_evaluation_submitted && new Date(i.scheduled_time).getTime() <= now)
      .sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));
    return { upcoming: upcoming.map(toUpcoming), pending: pending.map(toPending), all: list };
  },
  async pendingScorecards(): Promise<PendingScorecard[]> {
    return (await interviewerApi.home()).pending;
  },
  /** Every scorecard this user submitted (one request per application they interviewed). */
  async history(userId: number): Promise<EvaluationHistoryRow[]> {
    const list = (await interviewerApi.mine()).filter((i) => i.my_evaluation_submitted);
    const apps = Array.from(new Map(list.map((i) => [i.application_id, i])).values());
    const rows: EvaluationHistoryRow[] = [];
    await Promise.all(apps.map(async (i) => {
      const evals: EvaluationItem[] = await referralService.listEvaluations(i.application_id).catch(() => []);
      for (const e of evals.filter((x) => x.evaluator_id === userId)) {
        const score = e.weighted_score != null ? `${(e.weighted_score / 20).toFixed(1)} / 5.0` : `${e.overall_score} / 10`;
        rows.push({
          id: e.id,
          interviewId: e.interview_id,
          candidate: i.candidate_name || "—",
          position: i.job_title || "",
          department: "",
          score,
          recommendation: RECOMMENDATION_LABEL[e.recommendation] || e.recommendation,
          date: e.created_at ? new Date(e.created_at).toLocaleDateString("vi-VN") : "",
        });
      }
    }));
    return rows.sort((a, b) => b.id - a.id);
  },
};
