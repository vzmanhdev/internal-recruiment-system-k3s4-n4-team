import { PublicJobDetail } from "@/features/jobs/components/PublicJobDetail";

export default async function JobDetailPage({ params }: PageProps<"/jobs/[id]">) {
  const { id } = await params;
  return <PublicJobDetail id={id} />;
}
