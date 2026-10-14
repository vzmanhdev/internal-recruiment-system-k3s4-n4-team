'use client';

import React, { useState } from 'react';
import { 
  Building2, Plus, Edit2, Trash2, Users, ChevronRight, ChevronDown, 
  User, CheckCircle2, Search, Layers
} from 'lucide-react';
import { masterDataService, type Department } from '@/services/master-data.service';
import { useApiData } from '@/hooks/useApiData';
import { ErrorState, LoadingState } from '@/components/ui/DataStates';
import { ApiError } from '@/lib/api-client';

type DepartmentRow = Department & { head_name?: string | null; member_count?: number; open_positions?: number };

/** Flat department list -> two-level tree (root departments and their direct children). */
function toTree(rows: DepartmentRow[]): DepartmentNode[] {
  const node = (d: DepartmentRow): DepartmentNode => ({
    id: String(d.id), code: d.code, name: d.name, manager_name: d.head_name || 'Chưa gán',
    total_members: d.member_count || 0, open_positions: d.open_positions || 0,
  });
  const ids = new Set(rows.map((d) => d.id));
  return rows.filter((d) => !d.parent_id || !ids.has(d.parent_id)).map((root) => ({
    ...node(root),
    sub_departments: rows.filter((d) => d.parent_id === root.id).map(node),
  }));
}

interface DepartmentNode {
  id: string;
  code: string;
  name: string;
  manager_name: string;
  total_members: number;
  open_positions: number;
  sub_departments?: DepartmentNode[];
}

export default function HRDepartmentsPage() {
  const { data, error, loading, reload } = useApiData(() => masterDataService.departments(false) as Promise<DepartmentRow[]>, []);
  const departments = toTree(data || []);
  const { data: managers } = useApiData(async () => {
    const [hm, hr] = await Promise.all([masterDataService.people('hiring_manager'), masterDataService.people('hr_manager')]);
    return [...hm, ...hr.filter((u) => !hm.some((x) => x.id === u.id))];
  }, []);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptManager, setNewDeptManager] = useState('');
  const [newDeptParentId, setNewDeptParentId] = useState('');

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddDept = async () => {
    if (!newDeptName.trim() || !newDeptCode.trim()) {
      setFormError("Vui lòng nhập đầy đủ tên và mã phòng ban!");
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await masterDataService.saveDepartment({
        name: newDeptName.trim(),
        code: newDeptCode.trim().toUpperCase(),
        head_user_id: newDeptManager ? Number(newDeptManager) : null,
        parent_id: newDeptParentId ? Number(newDeptParentId) : null,
        sort_order: 0,
        is_active: true,
      });
      if (newDeptParentId) setExpandedNodes(prev => ({ ...prev, [newDeptParentId]: true }));
      setModalOpen(false);
      setNewDeptName('');
      setNewDeptCode('');
      setNewDeptManager('');
      setNewDeptParentId('');
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Không lưu được phòng ban.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cơ Cấu Phòng Ban & Tổ Chức</h1>
            <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">
              [S2-04] Tree Hierarchy
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Quản lý sơ đồ tổ chức cây phòng ban đa cấp, gán Trưởng phòng & theo dõi nhân sự</p>
        </div>

        <button 
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Phòng Ban Mới</span>
        </button>
      </div>

      {/* Tree Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sơ Đồ Cây Cơ Cấu Doanh Nghiệp</div>
        
        <div className="space-y-2">
          {departments.map((dept) => (
            <div key={dept.id} className="border border-slate-200/80 rounded-xl overflow-hidden">
              <div 
                className="p-4 bg-slate-50/70 hover:bg-slate-100/80 transition-colors flex items-center justify-between cursor-pointer"
                onClick={() => toggleNode(dept.id)}
              >
                <div className="flex items-center gap-3">
                  {dept.sub_departments && dept.sub_departments.length > 0 ? (
                    expandedNodes[dept.id] ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />
                  ) : (
                    <div className="w-4" />
                  )}
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{dept.name}</span>
                      <span className="font-mono bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold">{dept.code}</span>
                    </div>
                    <div className="text-xs text-slate-500">Trưởng phòng: <strong>{dept.manager_name}</strong></div>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs text-slate-600">
                  <div>Nhân sự: <strong className="text-slate-900">{dept.total_members}</strong></div>
                  <div>Vị trí mở: <strong className="text-blue-600 font-bold">{dept.open_positions}</strong></div>
                </div>
              </div>

              {/* Sub Departments Level 2 */}
              {dept.sub_departments && expandedNodes[dept.id] && (
                <div className="p-4 pl-12 bg-white space-y-2 border-t border-slate-100">
                  {dept.sub_departments.map((sub) => (
                    <div key={sub.id} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="font-bold text-slate-800">{sub.name}</span>
                        <span className="font-mono bg-slate-200/60 text-slate-600 px-1.5 py-0.5 rounded text-[9px]">{sub.code}</span>
                      </div>
                      <div className="text-slate-500">
                        Quản lý: <strong>{sub.manager_name}</strong> | Nhân sự: <strong>{sub.total_members}</strong> | Vị trí mở: <strong className="text-blue-600 font-bold">{sub.open_positions}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal Add Department */}
      {modalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 transition-all"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          {/* 1. Nới rộng Modal Wrapper: w-full max-w-2xl kèm p-6 md:p-8 */}
          <div 
            className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-2xl p-6 md:p-8 transform transition-all max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Thêm Phòng Ban Mới</h3>
                  <p className="text-xs text-slate-500 font-medium">Thiết lập cơ cấu tổ chức và phân cấp quản lý đơn vị</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setModalOpen(false)} 
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer text-base"
              >
                ✕
              </button>
            </div>

            {/* 2. Chia lại bố cục các trường nhập liệu (Grid Layout) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {/* Tên Phòng Ban: Chiếm 1 cột (mặc định) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                  Tên Phòng Ban <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: Phòng Quản Lý Chất Lượng QA/QC"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Mã Phòng Ban (Code): Chiếm 1 cột (mặc định) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                  Mã Phòng Ban (Code) <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: QAQC"
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Trưởng Phòng Phụ Trách: Cho chiếm toàn bộ chiều ngang bằng class col-span-1 md:col-span-2 */}
              <div className="col-span-1 md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                  Trưởng Phòng Phụ Trách
                </label>
                <select
                  value={newDeptManager}
                  onChange={(e) => setNewDeptManager(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="">-- Chưa gán người phụ trách --</option>
                  {(managers || []).map((u) => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                  ))}
                </select>
              </div>

              {/* Phòng ban cha (Thuộc phòng ban nào - nếu có): Cho chiếm toàn bộ chiều ngang md:col-span-2 */}
              <div className="col-span-1 md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1.5 uppercase tracking-wider text-[11px]">
                  Phòng Ban Cha (Thuộc phòng ban nào - nếu có)
                </label>
                <select
                  value={newDeptParentId}
                  onChange={(e) => setNewDeptParentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="">-- Trực thuộc Công ty (Phòng ban gốc cấp 1) --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">Để trống nếu đây là Khối hoặc Phòng ban cấp cao trực thuộc Ban Giám Đốc</p>
              </div>
            </div>

            {formError && <p className="mt-4 text-xs font-semibold text-rose-600">{formError}</p>}

            {/* 3. Footer: Nút bấm căn phải */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => setModalOpen(false)} 
                className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button 
                type="button"
                onClick={handleAddDept}
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer active:scale-95"
              >
                Lưu Phòng Ban
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
