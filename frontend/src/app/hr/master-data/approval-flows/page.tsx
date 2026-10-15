'use client';

import React, { useState } from 'react';
import { 
  Layers, Plus, ShieldCheck, CheckCircle2, ArrowRight, Building2, 
  DollarSign, Edit2, History, Check
} from 'lucide-react';
import { CreateApprovalFlowModal, ApprovalFlowFormData } from '@/features/hr/components/CreateApprovalFlowModal';
import { masterDataService } from '@/services/master-data.service';
import { useApiData } from '@/hooks/useApiData';
import { ErrorState, LoadingState } from '@/components/ui/DataStates';
import { ApiError } from '@/lib/api-client';

const M = 1_000_000;
// workflow approval levels supported by the requisition engine (S3-01)
const STEP_LABEL: Record<string, { role: string; description: string }> = {
  manager: { role: 'HIRING_MANAGER', description: 'Trưởng phòng chuyên môn phê duyệt' },
  hr: { role: 'HR_MANAGER', description: 'Trưởng phòng Nhân sự thẩm định định biên & dải lương' },
  executive: { role: 'EXECUTIVE', description: 'Ban Giám Đốc phê duyệt cuối' },
};
const ROLE_TO_STEP: Record<string, string> = {
  HIRING_MANAGER: 'manager', HR_MANAGER: 'hr', DIRECTOR: 'executive', CFO: 'executive', CEO: 'executive',
};

interface ApprovalFlowRule {
  id: string;
  name: string;
  department: string;
  min_salary_threshold: number;
  max_salary_threshold: number;
  version: string;
  steps: Array<{
    step_num: number;
    role: string;
    description: string;
  }>;
  status: 'active' | 'draft';
}

export default function HRApprovalFlowsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data, error, loading, reload } = useApiData(async () => {
    const [rows, depts] = await Promise.all([masterDataService.approvalFlows(), masterDataService.departments(false)]);
    return { rows, depts };
  }, []);
  const flows: ApprovalFlowRule[] = (data?.rows || []).map((f) => ({
    id: `FLOW-${f.id}`,
    name: f.name,
    department: data?.depts.find((d) => d.id === f.department_id)?.name || 'Toàn Doanh Nghiệp',
    min_salary_threshold: Math.round(f.min_salary_threshold / M),
    max_salary_threshold: Math.round(f.max_salary_threshold / M),
    version: f.status === 'active' ? 'Đang áp dụng' : 'Ngừng áp dụng',
    steps: f.steps.map((code, i) => ({ step_num: i + 1, ...(STEP_LABEL[code] || { role: code, description: '' }) })),
    status: f.status === 'active' ? 'active' : 'draft',
  }));

  const handleCreateFlow = async (form: ApprovalFlowFormData) => {
    const unsupported = form.steps.filter((st) => !ROLE_TO_STEP[st.role]).map((st) => st.role);
    if (unsupported.length) {
      setToastMessage(`Cấp duyệt chưa được hỗ trợ trong quy trình: ${unsupported.join(', ')} (chỉ Trưởng phòng chuyên môn, Trưởng phòng Nhân sự, Ban Giám Đốc).`);
      return;
    }
    try {
      await masterDataService.saveApprovalFlow({
        name: form.name,
        department_id: data?.depts.find((d) => d.name === form.department)?.id ?? null,
        steps: form.steps.map((st) => ROLE_TO_STEP[st.role]),
        min_salary_threshold: form.minSalary * M,
        max_salary_threshold: form.maxSalary * M,
      });
      reload();
    } catch (err) {
      setToastMessage(err instanceof ApiError ? err.message : 'Không lưu được luồng phê duyệt.');
      return;
    }
    const data_ = form;
    setIsModalOpen(false);

    setToastMessage(`Đã thiết lập luồng phê duyệt "${data_.name}" (${data_.steps.length} cấp duyệt) thành công!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-sm font-semibold flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="text-xs text-purple-600 hover:text-purple-800 underline font-medium cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cấu Hình Luồng Phê Duyệt Động (Approval Flows)</h1>
            <span className="bg-purple-50 text-purple-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-purple-200">
              [S3-01] Dynamic Versioning
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Định nghĩa quy trình duyệt 2–3 cấp theo phòng ban & dải lương. Thay đổi luồng mới không ảnh hưởng luồng đang chạy</p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Luồng Duyệt Mới</span>
        </button>
      </div>

      {/* Main Flow List */}
      <div className="space-y-4">
        {flows.map((flow) => (
          <div key={flow.id} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4 hover:shadow-md transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">{flow.name}</h2>
                  <span className="font-mono bg-purple-100 text-purple-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                    {flow.version}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Phòng ban áp dụng: <strong>{flow.department}</strong> | Ngưỡng lương: <strong>{flow.min_salary_threshold} - {flow.max_salary_threshold} TR VNĐ</strong>
                </div>
              </div>

              <span className="bg-emerald-50 text-emerald-700 font-extrabold text-[10px] px-2.5 py-1 rounded-full border border-emerald-200 w-max">
                Đang Áp Dụng
              </span>
            </div>

            {/* Steps Visualizer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {flow.steps.map((step) => (
                <div key={step.step_num} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>Cấp {step.step_num}: {step.role}</span>
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-[11px] text-slate-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Tạo Luồng Duyệt Mới */}
      <CreateApprovalFlowModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateFlow}
        departmentOptions={(data?.depts || []).map((d) => d.name)}
      />
    </div>
  );
}
