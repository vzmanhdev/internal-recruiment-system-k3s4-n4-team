import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icons";
import { jobService } from "@/services/job.service";

export const dynamic = "force-dynamic";

export default async function JobDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let jobData = null;
  try {
    jobData = await jobService.getJobByIdOrSlug(id);
  } catch (err) {
    // Return notFound if job doesn't exist
    notFound();
  }

  if (!jobData) {
    notFound();
  }

  const job = {
    title: jobData.title,
    department: jobData.department_name || jobData.department || "Khối Công Nghệ",
    location: jobData.location || "Hà Nội",
    employmentType: jobData.type || "Toàn thời gian",
    openings: "Tuyển dụng",
    deadline: jobData.deadline || "31/12/2026",
    description: jobData.description,
    responsibilities: ["Thực hiện các nhiệm vụ chuyên môn theo yêu cầu dự án"],
    requirements: jobData.requirements ? jobData.requirements.split("\n") : ["Kỹ năng phù hợp vị trí"],
    skills: jobData.requirements ? jobData.requirements.split(",").map(s => s.trim()) : ["Tuyển dụng nội bộ"]
  };

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
            <h2>Trách nhiệm</h2>
            <ul>
              {job.responsibilities.map((val) => (
                <li key={val}>{val}</li>
              ))}
            </ul>
            <h2>Yêu cầu</h2>
            <ul>
              {job.requirements.map((val) => (
                <li key={val}>{val}</li>
              ))}
            </ul>
          </article>
          <aside>
            <h2>Kỹ năng phù hợp</h2>
            <div className="tags">
              {job.skills.map((val) => (
                <span key={val}>{val}</span>
              ))}
            </div>
            <p>Trao đổi với quản lý trực tiếp và bộ phận Nhân sự trước khi ứng tuyển.</p>
          </aside>
        </div>
      </main>
    </>
  );
}
