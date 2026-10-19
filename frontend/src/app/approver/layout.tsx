import React from 'react';

export const metadata = {
  title: 'Trung Tâm Phê Duyệt | Ban Giám Đốc | Enterprise ATS',
  description: 'Phân hệ thẩm định và phê duyệt tờ trình tuyển dụng REQ & Đề xuất Offer ứng viên',
};

export default function ApproverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The unified, permission-driven AppShell is mounted once in the root layout.
  return <>{children}</>;
}
