'use client';

import CandidateTrackPage from '@/app/candidate/track/page';

/**
 * Canonical redirect/re-export:
 * Unifies /candidate/tracking onto /candidate/track to eliminate duplicate routes
 * and removes all fake mock data.
 */
export default function CandidateTrackingRedirectPage() {
  return <CandidateTrackPage />;
}
