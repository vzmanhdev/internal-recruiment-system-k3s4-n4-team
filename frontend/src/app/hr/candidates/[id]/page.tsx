'use client';

import { UnifiedCandidateDetailView } from '@/app/recruiter/candidates/[id]/page';

export default function HRCandidateDetailPage() {
  return <UnifiedCandidateDetailView backHref="/hr/candidates" backLabel="Quản lý ứng viên" />;
}
