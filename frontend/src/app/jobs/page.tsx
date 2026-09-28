import { Header } from "@/components/layout/Header";
import { JobExplorer } from "@/features/jobs/components/JobExplorer";
export default function JobsPage(){return <><Header/><main className="inner-page container"><header className="page-intro"><span className="eyebrow">Cơ hội dành cho bạn</span><h1>Vị trí tuyển dụng nội bộ</h1><p>Tìm vai trò phù hợp để phát huy thế mạnh và tiếp tục phát triển trong tổ chức.</p></header><JobExplorer/></main></>}
