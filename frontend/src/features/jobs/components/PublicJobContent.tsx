import type { ReactNode } from "react";
import type { Job } from "@/types/job";
import { Icon } from "@/components/ui/Icons";

export function PublicJobContent({job,benefits,action}:{job:Job;benefits?:string;action?:ReactNode}) {
 return <><div className="detail-hero"><div><span className="eyebrow">{job.department}</span><h1>{job.title}</h1><div className="job-meta"><span><Icon name="location"/>{job.location}</span><span><Icon name="briefcase"/>{job.employmentType}</span><span><Icon name="people"/>{job.openings}</span><span><Icon name="calendar"/>Hạn {job.deadline}</span></div></div>{action}</div><div className="detail-grid"><article><h2>Mô tả công việc</h2><p className="whitespace-pre-line">{job.description}</p>{job.requirements.length>0&&<><h2>Yêu cầu ứng viên</h2><ul>{job.requirements.map((item,index)=><li key={index}>{item}</li>)}</ul></>}{benefits&&<><h2>Quyền lợi</h2><p className="whitespace-pre-line">{benefits}</p></>}</article><aside><h2>Kỹ năng & Yêu cầu chính</h2><div className="tags">{job.skills.map((item,index)=><span key={index}>{item}</span>)}</div><p className="mt-4 text-xs text-slate-500">Ứng viên nội bộ được ưu tiên phỏng vấn trực tiếp cùng Quản lý chuyên môn.</p></aside></div></>;
}
