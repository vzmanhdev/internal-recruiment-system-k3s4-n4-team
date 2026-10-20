'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function JobsIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/#jobs');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium">
      Đang chuyển hướng đến danh sách việc làm...
    </div>
  );
}
