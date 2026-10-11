export type JobStatus = "open" | "closingSoon" | "closed";

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  openings: string;
  status: JobStatus;
  description: string;
  skills: string[];
  deadline: string;
  responsibilities: string[];
  requirements: string[];
  benefits?: string[];
  isExpired?: boolean;
}
