import React from 'react';
import { RecruiterAppShell } from '@/components/layout/RecruiterAppShell';

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
  return <RecruiterAppShell>{children}</RecruiterAppShell>;
}
