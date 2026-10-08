import React from 'react';
import { HRAppShell } from '@/features/hr/components/HRAppShell';

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
  return <HRAppShell>{children}</HRAppShell>;
}
