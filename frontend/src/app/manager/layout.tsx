import React from 'react';
import { ManagerAppShell } from '@/components/layout/ManagerAppShell';

export const metadata = {
  title: 'Hiring Manager Workspace | Enterprise ATS',
  description: 'Không gian làm việc chuyên biệt dành cho Trưởng bộ phận tuyển dụng',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ManagerAppShell>{children}</ManagerAppShell>;
}
