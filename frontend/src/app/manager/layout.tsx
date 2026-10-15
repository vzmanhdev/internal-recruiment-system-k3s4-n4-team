import React from 'react';

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
  // The unified, permission-driven AppShell is mounted once in the root layout.
  return <>{children}</>;
}
