import type { Metadata } from "next";
import { HrWorkspace } from "@/features/hr/components/HrWorkspace";
export const metadata: Metadata = { title: "Quản trị nhân sự | Tuyển dụng nội bộ" };
export default function HrDashboardPage(){return <HrWorkspace/>;}
