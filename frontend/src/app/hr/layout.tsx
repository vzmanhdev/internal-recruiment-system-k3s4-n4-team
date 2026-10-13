import React from 'react';

export const metadata = {
  title: 'HR Manager Control Center | Enterprise ATS',
  description: 'Trung tâm điều hành tuyển dụng dành riêng cho Trưởng phòng Nhân sự (HR Manager)',
  robots: {
    index: false,
    follow: false,
  },
};

export default function HRLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The unified, permission-driven AppShell is mounted once in the root layout.
  return <>{children}</>;
}
