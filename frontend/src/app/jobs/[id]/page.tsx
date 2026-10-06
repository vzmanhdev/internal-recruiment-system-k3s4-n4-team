import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icons";
import { jobs } from "@/features/jobs/data/jobs";
import type { Job, JobStatus } from "@/types/job";

export const dynamicParams = true;

export function generateStaticParams() {
  return jobs.map((job) => ({ id: job.id }));
}

async function getJobById(id: string): Promise<Job | null> {
  const staticJob = jobs.find((item) => item.id === id);
  if (staticJob) return staticJob;

  try {
    const res = await fetch(`http://localhost:8000/api/v1/jobs/${id}`, {
      next: { revalidate: 10 },
    });
    if (res.ok) {
      const dbJob = await res.json();
      const reqs = Array.isArray(dbJob.requirements)
        ? dbJob.requirements
        : (dbJob.requirements ? dbJob.requirements.split("\n").map((r: string) => r.trim()).filter(Boolean) : []);
      const bens = Array.isArray(dbJob.benefits)
        ? dbJob.benefits
        : (dbJob.benefits ? dbJob.benefits.split("\n").map((b: string) => b.trim()).filter(Boolean) : []);

      return {
        id: String(dbJob.id),
        title: dbJob.title,
        department: dbJob.department,
        location: dbJob.location,
        employmentType: dbJob.employment_type || "Toàn thời gian",
        openings: `${dbJob.openings} vị trí`,
        status: (dbJob.status as JobStatus) || "open",
        description: dbJob.description,
        skills: reqs.slice(0, 3).map((r: string) => r.replace(/^[-•*]\s*/, "")),
        deadline: dbJob.deadline,
        responsibilities: bens,
        requirements: reqs,
      };
    }
  } catch {
    // Backend offline or unreachable, ignore
  }

  return null;
}

export default async function JobDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getJobById(id);

  if (!job) notFound();

  return (
    <>
      <Header />
      <main className="inner-page container">
        <div className="detail-hero">
          <div>
            <span className="eyebrow">{job.department}</span>
            <h1>{job.title}</h1>
            <div className="job-meta">
              <span>
                <Icon name="location" />
                {job.location}
              </span>
              <span>
                <Icon name="briefcase" />
                {job.employmentType}
              </span>
              <span>
                <Icon name="people" />
                {job.openings}
              </span>
              <span>
                <Icon name="calendar" />
                Hạn {job.deadline}
              </span>
            </div>
          </div>
          <Button>
            Ứng tuyển ngay <Icon name="arrow" />
          </Button>
        </div>
        <div className="detail-grid">
          <article>
            <h2>Mô tả công việc</h2>
            <p>{job.description}</p>
            {job.responsibilities && job.responsibilities.length > 0 && (
              <>
                <h2>Quyền lợi & Đãi ngộ</h2>
                <ul>
                  {job.responsibilities.map((value) => (
                    <li key={value}>{value}</li>
                  ))}
                </ul>
              </>
            )}
            {job.requirements && job.requirements.length > 0 && (
              <>
                <h2>Yêu cầu ứng viên</h2>
                <ul>
                  {job.requirements.map((value) => (
                    <li key={value}>{value}</li>
                  ))}
                </ul>
              </>
            )}
          </article>
          <aside>
            <h2>Kỹ năng phù hợp</h2>
            <div className="tags">
              {job.skills.map((value) => (
                <span key={value}>{value}</span>
              ))}
            </div>
            <p style={{ marginTop: "20px", color: "var(--color-text-secondary)", fontSize: "14px" }}>
              Trao đổi với quản lý trực tiếp và bộ phận Nhân sự trước khi ứng tuyển.
            </p>
          </aside>
        </div>
      </main>
    </>
  );
}
