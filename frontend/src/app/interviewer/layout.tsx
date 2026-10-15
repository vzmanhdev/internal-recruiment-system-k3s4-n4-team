import React from "react";

export const metadata = {
  title: "Không gian Người phỏng vấn | Enterprise ATS",
  description: "Lịch phỏng vấn, phiếu đánh giá và ngân hàng câu hỏi của người phỏng vấn",
};

// The unified, permission-driven AppShell is mounted once in the root layout.
export default function InterviewerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
