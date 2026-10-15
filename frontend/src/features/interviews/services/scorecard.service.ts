import { apiRequest } from "@/lib/api-client";

export interface ScoreCriterion {
  id: number;
  name: string;
  description?: string;
  weight: number;
  required_level: number;
  score?: number;
  comment?: string;
}

export interface ScorecardDefinition {
  framework_name: string;
  criteria: ScoreCriterion[];
  evaluation: { recommendation: string; feedback: string } | null;
}

export function fetchScorecard(
  interviewId: number,
): Promise<ScorecardDefinition> {
  return apiRequest(`/interviews/${interviewId}/scorecard`);
}

export function submitScorecard(
  interviewId: number,
  payload: {
    criteria: Array<{ criterion_id: number; score: number; comment: string }>;
    recommendation: string;
    feedback: string;
  },
) {
  return apiRequest(`/interviews/${interviewId}/scorecard`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
