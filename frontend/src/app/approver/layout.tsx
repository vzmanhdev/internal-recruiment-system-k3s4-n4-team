import React from 'react';
import { ApproverAppShell } from '@/components/layout/ApproverAppShell';

export const metadata = {
  title: 'Trung Tâm Phê Duyệt | Ban Giám Đốc | Enterprise ATS',
  description: 'Phân hệ thẩm định và phê duyệt tờ trình tuyển dụng REQ & Đề xuất Offer ứng viên',
};

export default function ApproverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ApproverAppShell>{children}</ApproverAppShell>;
}
