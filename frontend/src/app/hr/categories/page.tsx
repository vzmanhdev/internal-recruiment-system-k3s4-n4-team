"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingState } from "@/components/ui/DataStates";

function HRCategoriesRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const type = searchParams.get("type");
    if (type) {
      router.replace(`/hr/master-data/lookups?type=${encodeURIComponent(type)}`);
    } else {
      router.replace("/hr/master-data/lookups");
    }
  }, [router, searchParams]);

  return <LoadingState label="Đang chuyển hướng sang Danh mục dùng chung..." />;
}

export default function HRCategoriesPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <HRCategoriesRedirect />
    </Suspense>
  );
}
