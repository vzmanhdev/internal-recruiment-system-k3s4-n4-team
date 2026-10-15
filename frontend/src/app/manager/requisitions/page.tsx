import type { Metadata } from "next";
import { ManagerRequisitionWorkspace } from "@/features/manager/components/ManagerRequisitionWorkspace";

export const metadata: Metadata = { title: "Duyệt yêu cầu tuyển dụng | Tuyển dụng nội bộ" };

export default function ManagerRequisitionsPage() {
  return <ManagerRequisitionWorkspace view="all" />;
}
