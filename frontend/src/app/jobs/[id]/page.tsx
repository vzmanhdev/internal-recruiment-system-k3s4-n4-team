import { PublicJobDetail } from "@/features/jobs/components/PublicJobDetail";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PublicJobDetail id={id} />;
}
