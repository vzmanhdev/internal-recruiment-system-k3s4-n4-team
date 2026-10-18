'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { masterDataService } from '@/services/master-data.service';
import { useApiData } from '@/hooks/useApiData';
import { ErrorState, LoadingState } from '@/components/ui/DataStates';

// Known lookup groups used by the workflow (S2-08); any other category_type is shown with its code
const LOOKUP_GROUPS: Record<string, { name: string; description: string }> = {
  candidate_source: { name: 'Nguồn Tuyển Dụng (Candidate Sources)', description: 'Các kênh thu hút hồ sơ ứng viên' },
  tag: { name: 'Nhãn Ứng Viên (Tags)', description: 'Nhãn dùng để gắn và lọc hồ sơ ứng viên' },
  rejection_reason: { name: 'Lý Do Loại Hồ Sơ (Rejection Reasons)', description: 'Danh mục lý do bắt buộc khi loại ứng viên' },
  work_location: { name: 'Địa Điểm Làm Việc (Work Locations)', description: 'Các văn phòng, chi nhánh làm việc' },
  work_locations: { name: 'Địa Điểm Làm Việc (Work Locations)', description: 'Các văn phòng, chi nhánh làm việc' },
  work_type: { name: 'Hình Thức Làm Việc (Work Types)', description: 'Toàn thời gian, bán thời gian, linh hoạt, từ xa' },
  contract_type: { name: 'Loại Hợp Đồng (Contract Types)', description: 'Thử việc, xác định thời hạn, không xác định thời hạn' },
  approval_type: { name: 'Loại Luồng Phê Duyệt', description: 'Các loại luồng phê duyệt tờ trình và offer' },
  skill: { name: 'Danh Mục Kỹ Năng (Skill Tags)', description: 'Các kỹ năng chuyên môn chuẩn phục vụ tìm kiếm & lọc hồ sơ' },
};
import { 
  Layers, Plus, Tag, MapPin, Share2, HelpCircle, CheckCircle2, Search, Check, ChevronRight
} from 'lucide-react';
import { 
  CreateLookupCategoryModal, 
  NewLookupCategoryData 
} from '@/features/hr/components/CreateLookupCategoryModal';

interface LookupCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  items_count: number;
  sample_items: string[];
  status?: 'active' | 'inactive';
}

export default function HRLookupsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const router = useRouter();
  const { data, error, loading, reload } = useApiData(() => masterDataService.categories(), []);
  const categories: LookupCategory[] = Array.from(new Set((data || []).map((c) => c.category_type))).map((type) => {
    const items = (data || []).filter((c) => c.category_type === type);
    return {
      id: type,
      code: type.toUpperCase(),
      name: LOOKUP_GROUPS[type]?.name || type,
      description: LOOKUP_GROUPS[type]?.description || 'Nhóm danh mục do HR khai báo',
      items_count: items.length,
      sample_items: items.filter((c) => c.is_active).slice(0, 6).map((c) => c.name),
      status: items.some((c) => c.is_active) ? 'active' : 'inactive',
    };
  });

  // A group exists once it has its first value: continue in the category editor with the new group selected
  const handleCreateCategory = (form: NewLookupCategoryData) => {
    const code = form.code.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_');
    setSuccessMessage(`Nhóm "${form.name}" (${code}) đã sẵn sàng — hãy thêm giá trị đầu tiên cho nhóm.`);
    router.push(`/hr/categories?type=${encodeURIComponent(code)}`);
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-6">
      {/* Toast thông báo thành công */}
      {successMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Danh Mục Dùng Chung (System Lookups)</h1>
            <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">
              Master Lookups
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Quản lý thẻ kỹ năng, nguồn ứng viên, danh mục địa điểm & lý do từ chối dùng chung toàn hệ thống</p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Danh Mục Mới</span>
        </button>
      </div>

      {/* Main List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3 hover:shadow-md transition-all relative overflow-hidden group">
            {cat.status === 'inactive' && (
              <div className="absolute top-0 right-0 bg-slate-200 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">
                Đã Khóa
              </div>
            )}
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono bg-slate-100 text-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded">{cat.code}</span>
                <h2 className="text-sm font-bold text-slate-900 mt-1">{cat.name}</h2>
              </div>
              <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                {cat.items_count} mục
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed min-h-[32px]">{cat.description}</p>

            <div className="pt-2 border-t border-slate-100">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">Mẫu Giá Trị</div>
              <div className="flex flex-wrap gap-1.5">
                {cat.sample_items.map((item, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 mt-2">
              <Link
                href={`/hr/categories?type=${encodeURIComponent(cat.id)}`}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white text-xs font-bold transition-all shadow-2xs group-hover:bg-blue-600 group-hover:text-white"
              >
                <span>Quản lý & Sắp xếp giá trị</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Component Form Thêm Danh Mục Mới */}
      <CreateLookupCategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateCategory}
      />
    </div>
  );
}
