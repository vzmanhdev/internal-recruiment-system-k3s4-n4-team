'use client';

import React, { useState, useEffect } from 'react';
import UnifiedAppShell from '@/components/layout/UnifiedAppShell';
import {
  Lock,
  ShieldCheck,
  Check,
  X,
  Save,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { apiRequest } from '@/lib/api-client';

interface ModulePermission {
  id: string;
  module: string;
  permissions: {
    [role: string]: string[];
  };
}

const ROLES_LIST = [
  { code: 'admin', label: 'ADMIN', name: 'Quản trị viên', badge: 'bg-blue-100 text-blue-700 border-blue-200' },
  { code: 'hr_manager', label: 'HR MANAGER', name: 'Trưởng phòng HR', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  { code: 'recruiter', label: 'RECRUITER', name: 'Chuyên viên Recruiter', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { code: 'hiring_manager', label: 'HIRING MANAGER', name: 'Trưởng bộ phận', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  { code: 'interviewer', label: 'INTERVIEWER', name: 'Người phỏng vấn', badge: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { code: 'approver', label: 'APPROVER', name: 'Người duyệt', badge: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { code: 'employee', label: 'EMPLOYEE', name: 'Nhân sự nội bộ', badge: 'bg-[#F1F5F9] text-slate-600 border-slate-200' },
];

const PERMISSIONS_LIST = [
  { code: 'user:view', name: 'Xem người dùng', module: 'users' },
  { code: 'user:create', name: 'Tạo mới người dùng', module: 'users' },
  { code: 'user:edit', name: 'Chỉnh sửa người dùng', module: 'users' },
  { code: 'user:lock', name: 'Khóa / Mở khóa tài khoản', module: 'users' },
  { code: 'user:reset_password', name: 'Đặt lại mật khẩu', module: 'users' },
  { code: 'permission:manage', name: 'Quản lý Phân quyền RBAC', module: 'users' },

  { code: 'requisition:view', name: 'Xem yêu cầu tuyển dụng', module: 'requisition' },
  { code: 'requisition:create', name: 'Tạo mới yêu cầu tuyển dụng', module: 'requisition' },
  { code: 'requisition:approve', name: 'Phê duyệt yêu cầu tuyển dụng', module: 'requisition' },

  { code: 'candidate:view', name: 'Xem hồ sơ ứng viên', module: 'candidate' },
  { code: 'candidate:evaluate', name: 'Đánh giá & chuyển vòng', module: 'candidate' },

  { code: 'offer:create', name: 'Tạo thư mời nhận việc (Offer)', module: 'offer' },
  { code: 'offer:approve', name: 'Phê duyệt Offer', module: 'offer' },

  { code: 'audit:view', name: 'Xem Nhật ký Audit Logs', module: 'audit' },
  { code: 'master_data:manage', name: 'Quản lý Danh mục dùng chung', module: 'audit' },
];

export default function PermissionsMatrixPage() {
  const [matrix, setMatrix] = useState<ModulePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<ModulePermission[]>('/admin/permissions/matrix');
      if (Array.isArray(data)) {
        setMatrix(data);
      }
    } catch (err) {
      setToast({ message: 'Tải ma trận phân quyền từ CSDL thất bại', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, []);

  const handleToggle = (roleCode: string, permCode: string, currentAllowed: boolean) => {
    if (roleCode === 'admin') {
      setToast({
        message: 'Quyền của vai trò Quản trị hệ thống là quyền toàn phần và không thể thay đổi.',
        type: 'error',
      });
      return;
    }

    setDirty(true);
    setMatrix((prev) =>
      prev.map((mod) => {
        const rolePerms = mod.permissions[roleCode] || [];
        const updated = currentAllowed
          ? rolePerms.filter((p) => p !== permCode)
          : [...rolePerms, permCode];

        return {
          ...mod,
          permissions: {
            ...mod.permissions,
            [roleCode]: updated,
          },
        };
      })
    );
  };

  const handleBatchSave = async () => {
    setSaving(true);
    try {
      const batchChanges: { role_code: string; permission_code: string; allowed: boolean }[] = [];

      for (const mod of matrix) {
        for (const roleCode of Object.keys(mod.permissions)) {
          if (roleCode === 'admin') continue; // Enforce: never send admin changes
          const grantedSet = new Set(mod.permissions[roleCode]);

          const modulePerms = PERMISSIONS_LIST.filter((p) => p.module === mod.id);
          for (const p of modulePerms) {
            batchChanges.push({
              role_code: roleCode,
              permission_code: p.code,
              allowed: grantedSet.has(p.code),
            });
          }
        }
      }

      await apiRequest('/admin/permissions/matrix', {
        method: 'PUT',
        body: JSON.stringify({ batch: batchChanges }),
      });

      setDirty(false);
      setToast({ message: 'Lưu thay đổi Ma trận Phân quyền RBAC thành công vào CSDL!', type: 'success' });
      setTimeout(() => setToast(null), 4000);
    } catch (err: any) {
      const errMsg = err?.detail || 'Lỗi khi cập nhật ma trận phân quyền';
      setToast({ message: errMsg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const filteredPermissions = PERMISSIONS_LIST.filter((p) => {
    const matchesModule = selectedModule === 'ALL' || p.module === selectedModule;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesModule && matchesSearch;
  });

  return (
    <UnifiedAppShell>
      <div className="space-y-6">
        {/* TOAST ALERTS */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border font-semibold text-xs flex items-center space-x-2.5 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-200 ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{toast.message}</span>
          </div>
        )}

        {/* UNSAVED CHANGES FLOATING BANNER */}
        {dirty && (
          <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3 text-amber-800 text-xs font-semibold">
              <AlertCircle size={18} className="text-amber-600 shrink-0" />
              <span>Bạn có thay đổi chưa được lưu vào CSDL. Hãy nhấn "Lưu Thay Đổi" để cập nhật.</span>
            </div>
            <button
              onClick={handleBatchSave}
              disabled={saving}
              className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 shrink-0"
            >
              <Save size={14} />
              <span>{saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
            </button>
          </div>
        )}

        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A] flex items-center space-x-2.5">
              <ShieldCheck className="w-7 h-7 text-[#2563EB]" />
              <span>Ma Trận Phân Quyền Vai Trò (Permission Matrix)</span>
            </h1>
            <p className="text-xs text-[#64748B] mt-1">
              Quản lý phân quyền tập trung cho các vai trò. Vai trò Quản trị hệ thống (Admin) luôn sở hữu toàn bộ quyền và không thể thay đổi.
            </p>
          </div>

          <button
            onClick={handleBatchSave}
            disabled={saving || !dirty}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              dirty
                ? 'bg-[#2563EB] text-white hover:bg-blue-700 shadow-md cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Save size={16} />
            <span>{saving ? 'Đang lưu CSDL...' : 'Lưu Thay Đổi'}</span>
          </button>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 text-[#64748B]" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm mã quyền hoặc tên quyền..."
              className="w-full pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <Filter size={16} className="text-[#64748B]" />
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-medium rounded-lg px-3 py-2 text-[#0F172A] focus:outline-none focus:border-[#2563EB]"
            >
              <option value="ALL">Tất cả Phân Hệ Module</option>
              <option value="users">Quản lý Người dùng & RBAC</option>
              <option value="requisition">Yêu cầu tuyển dụng</option>
              <option value="candidate">Hồ sơ ứng viên</option>
              <option value="offer">Thư mời Offer</option>
              <option value="audit">Nhật ký Audit Log</option>
            </select>
          </div>
        </div>

        {/* MATRIX DATA TABLE */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-[#64748B] space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#2563EB]" />
              <p className="text-xs">Đang tải dữ liệu phân quyền...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                    <th className="py-4 px-4 min-w-[220px] sticky left-0 bg-[#F8FAFC] border-r border-[#E2E8F0] z-10">
                      Tên Quyền & Mã Quyền
                    </th>
                    {ROLES_LIST.map((r) => (
                      <th key={r.code} className="py-4 px-3 text-center min-w-[130px]">
                        <div className="flex flex-col items-center">
                          <span className={`px-2.5 py-1 rounded-md border text-[10px] font-bold ${r.badge}`}>
                            {r.label}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5 font-normal">
                            {r.name}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-xs font-medium">
                  {filteredPermissions.map((perm) => {
                    const modObj = matrix.find((m) => m.id === perm.module);

                    return (
                      <tr key={perm.code} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#0F172A] border-r border-[#E2E8F0] bg-white sticky left-0 z-10">
                          <div>{perm.name}</div>
                          <div className="text-[11px] font-mono text-[#64748B]">{perm.code}</div>
                        </td>

                        {ROLES_LIST.map((r) => {
                          const isSuperAdminRole = r.code === 'admin';
                          const grantedList = modObj?.permissions[r.code] || [];
                          const isAllowed = isSuperAdminRole || grantedList.includes(perm.code);

                          if (isSuperAdminRole) {
                            return (
                              <td key={r.code} className="py-2.5 px-2 text-center bg-emerald-50/30">
                                <div
                                  title="Quản trị hệ thống luôn có toàn quyền và không thể thay đổi."
                                  className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold inline-flex items-center justify-center space-x-1 cursor-not-allowed opacity-90"
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                                  <span>Cho phép</span>
                                  <HelpCircle size={12} className="text-emerald-600 ml-1" />
                                </div>
                              </td>
                            );
                          }

                          return (
                            <td key={r.code} className="py-2.5 px-2 text-center">
                              <button
                                onClick={() => handleToggle(r.code, perm.code, isAllowed)}
                                className={`w-full py-1.5 px-2.5 rounded-lg border font-bold text-[11px] inline-flex items-center justify-center space-x-1 transition-all cursor-pointer ${
                                  isAllowed
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                    : 'bg-slate-50 text-slate-400 border-[#E2E8F0] hover:bg-slate-100 hover:text-slate-600'
                                }`}
                              >
                                {isAllowed ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                                    <span>Cho phép</span>
                                  </>
                                ) : (
                                  <>
                                    <X className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-slate-400 font-normal">Từ chối</span>
                                  </>
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </UnifiedAppShell>
  );
}
