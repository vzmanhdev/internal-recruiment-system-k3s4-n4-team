import type { Metadata } from "next";
import { ManagerRequisitionWorkspace } from "@/features/manager/components/ManagerRequisitionWorkspace";

export const metadata: Metadata = { title: "Trưởng bộ phận | Tuyển dụng nội bộ" };

export default function ManagerDashboardPage() {
  return <ManagerRequisitionWorkspace view="dashboard" />;
}
