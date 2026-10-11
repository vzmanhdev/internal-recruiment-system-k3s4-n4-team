import type { JobPostingItem } from "@/services/job.service";
import type { Job } from "@/types/job";

type ApiPosting = JobPostingItem & { is_expired?: boolean; required_skills?: string[]; openings?: number | null };

const lines = (text?: string) => (text || "").split(/\r?\n/).map((s) => s.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);

/** Map a posting from the API to the card/detail shape. Only real fields are shown — nothing is invented. */
export function toJob(j: ApiPosting): Job {
  const deadline = j.deadline ? new Date(j.deadline) : null;
  const daysLeft = deadline ? Math.ceil((deadline.getTime() - Date.now()) / 86_400_000) : null;
  const expired = Boolean(j.is_expired) || j.status !== "published";
  return {
    id: String(j.id),
    title: j.title,
    department: j.department_name || j.department || "",
    location: j.location || "",
    employmentType: j.type || "",
    openings: j.openings ? `Tuyển ${j.openings} người` : "",
    status: expired ? "closed" : daysLeft !== null && daysLeft <= 7 ? "closingSoon" : "open",
    description: j.description || "",
    skills: j.required_skills && j.required_skills.length ? j.required_skills : [],
    deadline: deadline ? deadline.toLocaleDateString("vi-VN") : "Không giới hạn",
    responsibilities: [],
    requirements: lines(j.requirements),
    benefits: lines(j.benefits),
    isExpired: expired,
  };
}
