import { CandidateProfileWorkspace } from "@/features/hr/components/CandidateProfileWorkspace";

export default async function CandidateProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CandidateProfileWorkspace id={Number(id)} />;
}
