'use client';

import React, { useState } from 'react';
import { 
  Building2, Plus, Edit2, Trash2, Users, ChevronRight, ChevronDown, 
  User, CheckCircle2, Search, Layers
} from 'lucide-react';

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
  const [departments, setDepartments] = useState<DepartmentNode[]>([
    {
      id: "DEP-01",
      code: "IT",
      name: "Khối Công Nghệ Thông Tin",
      manager_name: "Lê Văn Mạnh",
      total_members: 45,
      open_positions: 5,
      sub_departments: [
        {
          id: "DEP-01-1",
          code: "DEV",
          name: "Phòng Phát Triển Phần Mềm (Software Dev)",
          manager_name: "Trần Anh Tuấn",
          total_members: 30,
          open_positions: 3
        },
        {
          id: "DEP-01-2",
          code: "DEVOPS",
          name: "Phòng Hạ Tầng & DevOps",
          manager_name: "Nguyễn Văn Hùng",
          total_members: 15,
          open_positions: 2
        }
      ]
    },
    {
      id: "DEP-02",
      code: "DATA",
      name: "Khối Dữ Liệu & Phân Tích (Data & BI)",
      manager_name: "Phạm Quốc Tuấn",
      total_members: 18,
      open_positions: 3
    },
    {
      id: "DEP-03",
      code: "MKT",
      name: "Phòng Marketing & Growth",
      manager_name: "Nguyễn Thị Phương",
      total_members: 12,
      open_positions: 2
    }
  ]);

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ "DEP-01": true });
  const [modalOpen, setModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptManager, setNewDeptManager] = useState('');

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddDept = () => {
    if (!newDeptName || !newDeptCode) {
      alert("Vui lòng nhập đầy đủ tên và mã phòng ban!");
      return;
    }

    const newDept: DepartmentNode = {
      id: `DEP-${Date.now()}`,
      code: newDeptCode.toUpperCase(),
      name: newDeptName,
      manager_name: newDeptManager || "Chưa gán",
      total_members: 0,
      open_positions: 0
    };

    setDepartments(prev => [...prev, newDept]);
    alert(`Đã thêm phòng ban "${newDeptName}" thành công!`);
    setModalOpen(false);
    setNewDeptName('');
    setNewDeptCode('');
  };

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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Thêm Phòng Ban Mới</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên Phòng Ban *</label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: Phòng Quản Lý Chất Lượng QA/QC"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mã Phòng Ban (Code) *</label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: QAQC"
                  value={newDeptCode}
                  onChange={(e) => setNewDeptCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Trưởng Phòng Phụ Trách</label>
                <input 
                  type="text" 
                  placeholder="Tên nhân sự quản lý..."
                  value={newDeptManager}
                  onChange={(e) => setNewDeptManager(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold">Hủy</button>
              <button onClick={handleAddDept} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold">Lưu Phòng Ban</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
