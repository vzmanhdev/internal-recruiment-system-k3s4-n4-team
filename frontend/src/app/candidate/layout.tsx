import React from 'react';
import { CandidateAppShell } from '@/components/layout/CandidateAppShell';

export const metadata = {
  title: 'Cổng Thông Tin Ứng Viên | Enterprise ATS',
  description: 'Khám phá cơ hội việc làm, nộp hồ sơ trực tuyến, theo dõi lịch phỏng vấn và nhận đề xuất tuyển dụng.',
};

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CandidateAppShell>{children}</CandidateAppShell>;
}
