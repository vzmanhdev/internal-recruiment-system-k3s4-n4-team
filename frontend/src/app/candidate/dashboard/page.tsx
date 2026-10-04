import { PersonalWorkspaceShell } from "@/components/layout/PersonalWorkspaceShell";
import { CandidateDashboard } from "@/features/candidate/components/CandidateDashboard";

export default function CandidateDashboardPage() {
  return <PersonalWorkspaceShell candidate><CandidateDashboard /></PersonalWorkspaceShell>;
}
