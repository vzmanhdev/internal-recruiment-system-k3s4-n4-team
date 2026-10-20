/**
 * Public career-portal data: published, non-expired postings from the backend mapped onto the portal's
 * CandidateJob view model, and the real application submit (CV upload + POST /applications).
 * Replaces features/candidate/data/candidateJobsData.ts.
 */
import { apiRequest } from "@/lib/api-client";
import { jobService, type JobPostingItem } from "@/services/job.service";
import { uploadFile } from "@/services/file.service";

export interface CandidateJob {
  id: string;
  slug?: string;
  title: string;
  department: string;
  location: string;
  salary: string;
  level: string;
  employmentType: string;
  headcount: number;
  deadline: string;
  postedDate: string;
  isHot?: boolean;
  isUrgent?: boolean;
  tags: string[];
  description: string[];
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  workplaceAddress: string;
  contactEmail: string;
  /** numeric posting id used by the application API */
  postingId: number;
  isExpired: boolean;
}

type ApiJob = JobPostingItem & { required_skills?: string[]; openings?: number | null; is_expired?: boolean };

const DAY_MS = 86_400_000;
const vnDate = (iso?: string | null) => (iso ? new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString("vi-VN") : "");

/** Multi-line / bulleted / simple-HTML text -> list of lines. */
function lines(text?: string | null): string[] {
  return (text || "")
    .replace(/<\/(p|li|div)>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean);
}

export function toCandidateJob(j: ApiJob, now: number): CandidateJob {
  const daysLeft = j.deadline ? Math.ceil((new Date(`${j.deadline.slice(0, 10)}T23:59:59`).getTime() - now) / DAY_MS) : null;
  const posted = j.published_at || j.created_at || null;
  return {
    id: String(j.id),
    slug: j.slug,
    title: j.title,
    department: j.department_name || j.department || "",
    location: j.location,
    salary: j.salary_range || "Thỏa thuận",
    level: j.level,
    employmentType: j.type,
    headcount: j.openings || 1,
    deadline: j.deadline ? vnDate(j.deadline.slice(0, 10)) : "Không giới hạn",
    postedDate: vnDate(posted),
    isHot: !!posted && now - new Date(posted).getTime() < 7 * DAY_MS,
    isUrgent: daysLeft !== null && daysLeft >= 0 && daysLeft <= 5,
    tags: j.required_skills || [],
    description: lines(j.description),
    responsibilities: [],
    requirements: lines(j.requirements),
    benefits: lines(j.benefits),
    workplaceAddress: j.location,
    contactEmail: "",
    postingId: j.id,
    isExpired: !!j.is_expired,
  };
}

export interface CareerPageSettingsData {
  configured: boolean;
  company_name: string;
  slogan: string;
  contact_email: string;
  contact_phone: string;
  banner_url?: string;
  about_us?: string;
  benefits?: Array<{ title: string; description: string; icon?: string }>;
  updated_at?: string | null;
}

export const careerApi = {
  async getCareerPageSettings(): Promise<CareerPageSettingsData> {
    return apiRequest<CareerPageSettingsData>("/public/career-page");
  },

  async list(): Promise<CandidateJob[]> {
    const [rows, settings] = await Promise.all([
      jobService.getJobs() as Promise<ApiJob[]>,
      apiRequest<CareerPageSettingsData>("/public/career-page").catch(() => null),
    ]);
    const now = Date.now();
    return rows.map((j) => {
      const job = toCandidateJob(j, now);
      if (settings?.contact_email) {
        job.contactEmail = settings.contact_email;
      }
      return job;
    });
  },

  async get(idOrSlug: string): Promise<CandidateJob> {
    const [raw, settings] = await Promise.all([
      jobService.getJobByIdOrSlug(idOrSlug) as Promise<ApiJob>,
      apiRequest<CareerPageSettingsData>("/public/career-page").catch(() => null),
    ]);
    const job = toCandidateJob(raw, Date.now());
    if (settings?.contact_email) {
      job.contactEmail = settings.contact_email;
    }
    return job;
  },

  /** Upload the CV (PDF/DOCX ≤ 10MB, validated server-side) and submit the application. */
  async apply(job: CandidateJob, data: { full_name: string; email: string; phone: string; cover_letter?: string; file?: File | null; cv_url?: string; website?: string; referral_code?: string }) {
    const cv_url = data.file ? (await uploadFile("cv", data.file)).url : data.cv_url || undefined;
    return apiRequest<{ id: number; tracking_code: string; job_title?: string; public_status?: string }>("/applications", {
      method: "POST",
      body: JSON.stringify({
        job_posting_id: job.postingId,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        cv_url,
        cover_letter: data.cover_letter || undefined,
        website: data.website || undefined,
        referral_code: data.referral_code || undefined,
      }),
    });
  },
};

