import React from 'react';

export const metadata = {
  title: 'Recruiter Workspace | Enterprise ATS',
  description: 'Không gian làm việc chuyên sâu dành cho Nhân viên tuyển dụng (Recruiter)',
  robots: {
    index: false,
    follow: false,
  },
};

export default function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The unified, permission-driven AppShell is mounted once in the root layout.
  return <>{children}</>;
}
