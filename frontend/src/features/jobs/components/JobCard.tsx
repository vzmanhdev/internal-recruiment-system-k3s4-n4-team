import Link from "next/link";
import { Icon } from "@/components/ui/Icons";
import type { Job } from "@/types/job";

const statusText={open:"Đang tuyển",closingSoon:"Sắp hết hạn",closed:"Đã đóng"};
export function JobCard({job}: {job:Job}) { return <article className="job-card"><div className="job-card__top"><span className="feature-icon"><Icon name="briefcase"/></span><span className={`status status--${job.status}`}>{statusText[job.status]}</span></div><h3><Link href={`/jobs/${job.id}`}>{job.title}</Link></h3><p className="muted">{job.department}</p><p>{job.description}</p><div className="job-meta"><span><Icon name="location"/>{job.location}</span><span><Icon name="briefcase"/>{job.employmentType}</span><span><Icon name="people"/>{job.openings}</span></div><div className="tags">{job.skills.map(skill=><span key={skill}>{skill}</span>)}</div></article>; }
