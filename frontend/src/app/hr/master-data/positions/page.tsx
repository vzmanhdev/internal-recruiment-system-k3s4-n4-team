'use client';

import React, { useState } from 'react';
import { 
  Award, Plus, Search, Filter, DollarSign, Building2, CheckCircle2, 
  Edit2, Trash2, ShieldCheck, Check
} from 'lucide-react';
import { CreateJobTitleModal, JobTitleFormData } from '@/features/hr/components/CreateJobTitleModal';
import { masterDataService } from '@/services/master-data.service';
import { useApiData } from '@/hooks/useApiData';
import { ErrorState, LoadingState } from '@/components/ui/DataStates';
import { ApiError } from '@/lib/api-client';

const M = 1_000_000;
// the short code entered in the form is kept at the start of the description: "[SWE-SR] ..."
const codeOf = (description?: string | null) => /^\[([^\]]+)\]/.exec(description || '')?.[1] || '';

interface PositionItem {
  id: string;
  code: string;
  title: string;
  department: string;
  level: string;
  min_salary: number;
  mid_salary: number;
  max_salary: number;
  status: 'active' | 'inactive';
}

export default function HRPositionsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data, error, loading, reload } = useApiData(async () => {
    const [titles, depts] = await Promise.all([masterDataService.jobTitles(), masterDataService.departments(false)]);
    return { titles, depts };
  }, []);
  const deptName = (id: number | null) => data?.depts.find((d) => d.id === id)?.name || 'Tất cả phòng ban';
  const positions: PositionItem[] = (data?.titles || []).map((t) => ({
    id: String(t.id),
    code: codeOf(t.description) || `JT-${t.id}`,
    title: t.name,
    department: deptName(t.department_id),
    level: t.level,
    min_salary: Math.round(((t.min_salary || 0) / M) * 10) / 10,
    mid_salary: Math.round((((t.min_salary || 0) + (t.max_salary || 0)) / 2 / M) * 10) / 10,
    max_salary: Math.round(((t.max_salary || 0) / M) * 10) / 10,
    status: t.is_active ? 'active' : 'inactive',
  }));

  const [searchQuery, setSearchQuery] = useState('');

  const handleCreatePosition = async (form: JobTitleFormData) => {
    try {
      await masterDataService.saveJobTitle({
        name: form.title,
        department_id: data?.depts.find((d) => d.name === form.department)?.id ?? null,
        level: form.level,
        min_salary: form.minSalary * M,
        max_salary: form.maxSalary * M,
        description: form.code ? `[${form.code.toUpperCase()}]` : undefined,
      });
      reload();
    } catch (err) {
      setToastMessage(err instanceof ApiError ? err.message : 'Không lưu được chức danh.');
      return;
    }
    const data_ = form;
    setIsModalOpen(false);

    setToastMessage(`Đã thêm chức danh "${data_.title} (${data_.code})" với dải lương ${data_.minSalary} - ${data_.maxSalary} TR VNĐ thành công!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const filtered = positions.filter(
    p => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
         p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
         p.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-xs text-emerald-600 hover:text-emerald-800 underline font-medium cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Chức Danh & Dải Lương Chuẩn (Salary Bands)</h1>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
              [S2-05] Standard Pay Bands
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Quản lý danh mục chức danh chuẩn doanh nghiệp, khung cấp bậc & dải lương tối thiểu / trung vị / tối đa</p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Chức Danh Mới</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm theo tên chức danh, mã chức danh, phòng ban..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all font-medium"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Tổng cộng: <strong className="text-slate-800 font-bold">{filtered.length}</strong> chức danh
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="p-4">Chức Danh & Mã Cấp Bậc</th>
                <th className="p-4">Phòng Ban Hạn Định</th>
                <th className="p-4">Khung Cấp Bậc (Level)</th>
                <th className="p-4 text-center">Mức Lương Tối Thiểu (Min)</th>
                <th className="p-4 text-center">Trung Vị (Mid)</th>
                <th className="p-4 text-center">Mức Lương Tối Đa (Max)</th>
                <th className="p-4 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Không tìm thấy chức danh nào phù hợp.
                  </td>
                </tr>
              ) : (
                filtered.map((pos) => (
                  <tr key={pos.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{pos.title}</div>
                      <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">{pos.code}</span>
                    </td>

                    <td className="p-4 font-semibold text-slate-800">
                      {pos.department}
                    </td>

                    <td className="p-4 text-blue-700 font-bold">
                      {pos.level}
                    </td>

                    <td className="p-4 text-center font-mono font-bold text-slate-700">
                      {pos.min_salary} TR VNĐ
                    </td>

                    <td className="p-4 text-center font-mono font-bold text-blue-700">
                      {pos.mid_salary} TR VNĐ
                    </td>

                    <td className="p-4 text-center font-mono font-bold text-emerald-700">
                      {pos.max_salary} TR VNĐ
                    </td>

                    <td className="p-4 text-center">
                      {pos.status === 'active' ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-extrabold">
                          Hoạt Động
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] font-extrabold">
                          Đang Khóa
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm Chức Danh Mới */}
      <CreateJobTitleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreatePosition}
        departmentOptions={(data?.depts || []).map((d) => d.name)}
      />
    </div>
  );
}
