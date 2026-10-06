import type { Metadata } from "next";
import { ReferralManagement } from "@/features/recruiter/components/ReferralManagement";

export const metadata: Metadata = {
  title: "Giới thiệu nhân tài nội bộ | HR Recruiter Workspace",
  description: "Theo dõi hồ sơ giới thiệu và phê duyệt hoa hồng thưởng",
};

export default function RecruiterReferralsPage() {
  return <ReferralManagement />;
}
