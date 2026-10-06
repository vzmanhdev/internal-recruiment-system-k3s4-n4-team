"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Folder,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  DollarSign,
  Search,
  Pencil,
  AlertTriangle,
  Users,
  CheckCircle2,
  X,
} from "lucide-react";

// =========================================================================
// DATA STRUCTURES
// =========================================================================

export interface DepartmentNode {
  id: string;
  code: string;
  name: string;
  managerName: string;
  managerTitle: string;
  headcountCurrent: number;
  headcountBudget: number;
  active_jobs: number; // Số yêu cầu tuyển dụng đang mở
  status: "active" | "inactive";
  children?: DepartmentNode[];
}

export interface JobTitleSalaryBand {
  id: string;
  code: string;
  title: string;
  level: "Junior" | "Middle" | "Senior" | "Lead" | "Manager" | "Director";
  minSalary: number; // Lương Min (VND)
  maxSalary: number; // Lương Max (VND)
  department: string;
  status: "active" | "inactive";
}

// Initial Department Tree Data
const INITIAL_DEPARTMENTS: DepartmentNode[] = [
  {
    id: "dept-1",
    code: "BGD",
    name: "Ban Giám Đốc & Khối Điều Hành",
    managerName: "Trần Viết Long",
    managerTitle: "Tổng Giám Đốc (CEO)",
    headcountCurrent: 5,
    headcountBudget: 5,
    active_jobs: 0,
    status: "active",
    children: [
      {
        id: "dept-2",
        code: "TECH",
        name: "Khối Công Nghệ & Sản Phẩm (Technology)",
        managerName: "Đỗ Văn Lâm",
        managerTitle: "Giám Đốc Công Nghệ (CTO)",
        headcountCurrent: 28,
        headcountBudget: 35,
        active_jobs: 4, // Có tin mở -> Khóa Xóa, thay bằng Ngừng áp dụng
        status: "active",
        children: [
          {
            id: "dept-2-1",
            code: "DEV",
            name: "Trung Tâm Phát Triển Phần Mềm (Software Center)",
            managerName: "Lê Trưởng Nhóm",
            managerTitle: "Trưởng Bộ Phận Dev",
            headcountCurrent: 18,
            headcountBudget: 22,
            active_jobs: 3, // Có tin mở -> Khóa Xóa
            status: "active",
          },
          {
            id: "dept-2-2",
            code: "INFRA",
            name: "Phòng Hạ Tầng & Bảo Mật Đám Mây (Cloud & DevOps)",
            managerName: "Hoàng Minh Tuấn",
            managerTitle: "Lead DevOps Architect",
            headcountCurrent: 6,
            headcountBudget: 8,
            active_jobs: 1, // Có tin mở -> Khóa Xóa
            status: "active",
          },
          {
            id: "dept-2-3",
            code: "DESIGN",
            name: "Phòng Thiết Kế Trải Nghiệm Người Dùng (UI/UX)",
            managerName: "Vũ Hải Đăng",
            managerTitle: "Design Lead",
            headcountCurrent: 4,
            headcountBudget: 5,
            active_jobs: 0, // 0 tin mở -> Cho phép Xóa
            status: "active",
          },
        ],
      },
      {
        id: "dept-3",
        code: "MKT",
        name: "Khối Tiếp Thị & Tăng Trưởng Số (Marketing & Growth)",
        managerName: "Nguyễn Hương Giang",
        managerTitle: "Giám Đốc Tiếp Thị (CMO)",
        headcountCurrent: 14,
        headcountBudget: 16,
        active_jobs: 2,
        status: "active",
        children: [
          {
            id: "dept-3-1",
            code: "DIGITAL",
            name: "Phòng Digital Marketing & Ads Performance",
            managerName: "Phạm Quỳnh Nga",
            managerTitle: "Marketing Manager",
            headcountCurrent: 9,
            headcountBudget: 10,
            active_jobs: 2,
            status: "active",
          },
          {
            id: "dept-3-2",
            code: "PARTNER",
            name: "Ban Phát Triển Đối Tác & Tài Trợ",
            managerName: "Trần Quốc Bảo",
            managerTitle: "Partnership Lead",
            headcountCurrent: 5,
            headcountBudget: 6,
            active_jobs: 0, // Không có tin mở -> Cho phép Xóa
            status: "active",
          },
        ],
      },
      {
        id: "dept-4",
        code: "HR",
        name: "Ban Quản Trị & Phát Triển Nguồn Nhân Lực",
        managerName: "Trưởng Phòng Nhân Sự",
        managerTitle: "Chủ Nhiệm Ban Nhân Sự (CHRO)",
        headcountCurrent: 8,
        headcountBudget: 9,
        active_jobs: 1,
        status: "active",
        children: [
          {
            id: "dept-4-1",
            code: "TA",
            name: "Phòng Tuyển Dụng & Thu Hút Nhân Tài (Talent Acquisition)",
            managerName: "Trần Thị Mai",
            managerTitle: "Senior TA Lead",
            headcountCurrent: 5,
            headcountBudget: 6,
            active_jobs: 1,
            status: "active",
          },
          {
            id: "dept-4-2",
            code: "L&D",
            name: "Ban Đào Tạo & Phát Triển Năng Lực Tổ Chức",
            managerName: "Nguyễn Hải Yến",
            managerTitle: "L&D Manager",
            headcountCurrent: 3,
            headcountBudget: 3,
            active_jobs: 0, // Không có tin mở -> Cho phép Xóa
            status: "active",
          },
        ],
      },
    ],
  },
];

// Initial Salary Bands Data
const INITIAL_SALARY_BANDS: JobTitleSalaryBand[] = [
  {
    id: "band-1",
    code: "DEV-JR",
    title: "Kỹ Sư Phần Mềm Junior (Frontend / Backend)",
    level: "Junior",
    minSalary: 12000000,
    maxSalary: 18000000,
    department: "Trung Tâm Phát Triển Phần Mềm",
    status: "active",
  },
  {
    id: "band-2",
    code: "DEV-MID",
    title: "Chuyên Viên Phát Triển Phần Mềm Middle",
    level: "Middle",
    minSalary: 20000000,
    maxSalary: 32000000,
    department: "Trung Tâm Phát Triển Phần Mềm",
    status: "active",
  },
  {
    id: "band-3",
    code: "DEV-SR",
    title: "Kỹ Sư Phần Mềm Cao Cấp (Senior Engineer)",
    level: "Senior",
    minSalary: 35000000,
    maxSalary: 52000000,
    department: "Trung Tâm Phát Triển Phần Mềm",
    status: "active",
  },
  {
    id: "band-4",
    code: "TECH-LEAD",
    title: "Trưởng Nhóm Kỹ Thuật (Tech Lead / Architect)",
    level: "Lead",
    minSalary: 48000000,
    maxSalary: 68000000,
    department: "Khối Công Nghệ & Sản Phẩm",
    status: "active",
  },
  {
    id: "band-5",
    code: "ENG-MGR",
    title: "Trưởng Phòng Kỹ Thuật (Engineering Manager)",
    level: "Manager",
    minSalary: 60000000,
    maxSalary: 85000000,
    department: "Khối Công Nghệ & Sản Phẩm",
    status: "active",
  },
  {
    id: "band-6",
    code: "MKT-SR",
    title: "Chuyên Viên Tiếp Thị Số Cao Cấp (Senior Marketer)",
    level: "Senior",
    minSalary: 25000000,
    maxSalary: 35000000,
    department: "Khối Tiếp Thị & Tăng Trưởng Số",
    status: "active",
  },
  {
    id: "band-7",
    code: "TA-LEAD",
    title: "Chuyên Viên Tuyển Dụng Cao Cấp (Senior Recruiter)",
    level: "Senior",
    minSalary: 22000000,
    maxSalary: 32000000,
    department: "Ban Quản Trị Nguồn Nhân Lực",
    status: "active",
  },
];

interface MasterDataManagementViewProps {
  initialTab?: "tree_view" | "salary_bands";
  activeTab?: "tree_view" | "salary_bands";
  onTabChange?: (tab: "tree_view" | "salary_bands") => void;
}

export function MasterDataManagementView({
  initialTab = "tree_view",
  activeTab: controlledActiveTab,
  onTabChange,
}: MasterDataManagementViewProps) {
  // State chuyển đổi Tabs: "tree_view" | "salary_bands"
  const [internalActiveTab, setInternalActiveTab] = useState<"tree_view" | "salary_bands">(
    controlledActiveTab || initialTab
  );

  const activeTab = controlledActiveTab ?? internalActiveTab;

  const handleTabChange = (tab: "tree_view" | "salary_bands") => {
    setInternalActiveTab(tab);
    onTabChange?.(tab);
  };

  // Cập nhật khi controlledActiveTab hoặc initialTab thay đổi từ Sidebar
  useEffect(() => {
    if (controlledActiveTab) {
      setInternalActiveTab(controlledActiveTab);
    } else if (initialTab) {
      setInternalActiveTab(initialTab);
    }
  }, [controlledActiveTab, initialTab]);

  // Departments State
  const [departments, setDepartments] = useState<DepartmentNode[]>(INITIAL_DEPARTMENTS);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    "dept-1": true,
    "dept-2": true,
    "dept-3": true,
    "dept-4": true,
  });

  // Salary Bands State
  const [salaryBands, setSalaryBands] = useState<JobTitleSalaryBand[]>(INITIAL_SALARY_BANDS);
  const [searchSalary, setSearchSalary] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("all");

  // Modal State cho Thêm/Sửa Chức danh
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [editingBand, setEditingBand] = useState<JobTitleSalaryBand | null>(null);
  const [salaryFormData, setSalaryFormData] = useState({
    code: "",
    title: "",
    level: "Senior" as JobTitleSalaryBand["level"],
    department: "Khối Công Nghệ & Sản Phẩm",
    minSalary: "30000000",
    maxSalary: "50000000",
  });

  // Modal Thêm Phòng Ban
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptParentNode, setDeptParentNode] = useState<DepartmentNode | null>(null);
  const [deptFormData, setDeptFormData] = useState({
    code: "",
    name: "",
    managerName: "",
    managerTitle: "",
    headcountBudget: 5,
  });

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => setToastMessage(msg);
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Expand / Collapse Helpers
  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const expandAll = () => {
    const allIds: Record<string, boolean> = {};
    const traverse = (nodes: DepartmentNode[]) => {
      nodes.forEach((n) => {
        allIds[n.id] = true;
        if (n.children) traverse(n.children);
      });
    };
    traverse(departments);
    setExpandedNodes(allIds);
    showToast("Đã mở rộng toàn bộ cây cơ cấu phòng ban.");
  };

  const collapseAll = () => {
    setExpandedNodes({ "dept-1": true });
    showToast("Đã thu gọn cây cơ cấu phòng ban.");
  };

  // Logic Xóa Phòng Ban
  const handleDeleteDepartment = (nodeId: string, nodeName: string) => {
    const removeRecursive = (list: DepartmentNode[]): DepartmentNode[] => {
      return list
        .filter((n) => n.id !== nodeId)
        .map((n) => ({
          ...n,
          children: n.children ? removeRecursive(n.children) : undefined,
        }));
    };

    setDepartments((prev) => removeRecursive(prev));
    showToast(`Đã xóa thành công phòng ban "${nodeName}".`);
  };

  // Logic Ngừng Áp Dụng Phòng Ban
  const handleToggleDeactivateDepartment = (nodeId: string, nodeName: string) => {
    const toggleStatusRecursive = (list: DepartmentNode[]): DepartmentNode[] => {
      return list.map((n) => {
        if (n.id === nodeId) {
          const newStatus = n.status === "active" ? "inactive" : "active";
          return { ...n, status: newStatus };
        }
        if (n.children) {
          return { ...n, children: toggleStatusRecursive(n.children) };
        }
        return n;
      });
    };

    setDepartments((prev) => toggleStatusRecursive(prev));
    showToast(`Đã thay đổi trạng thái áp dụng cho phòng ban "${nodeName}".`);
  };

  // Handler Thêm Phòng Ban
  const handleOpenAddDeptModal = (parentNode?: DepartmentNode) => {
    setDeptParentNode(parentNode || null);
    setDeptFormData({
      code: "",
      name: "",
      managerName: "",
      managerTitle: "",
      headcountBudget: 5,
    });
    setIsDeptModalOpen(true);
  };

  const handleSaveDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptFormData.name.trim() || !deptFormData.code.trim()) {
      alert("Vui lòng nhập đầy đủ mã và tên phòng ban!");
      return;
    }

    const newNode: DepartmentNode = {
      id: `dept-${Date.now()}`,
      code: deptFormData.code.trim().toUpperCase(),
      name: deptFormData.name.trim(),
      managerName: deptFormData.managerName.trim() || "Chưa bổ nhiệm",
      managerTitle: deptFormData.managerTitle.trim() || "Trưởng Đơn Vị",
      headcountCurrent: 0,
      headcountBudget: Number(deptFormData.headcountBudget) || 5,
      active_jobs: 0,
      status: "active",
    };

    if (deptParentNode) {
      const appendChildRecursive = (list: DepartmentNode[]): DepartmentNode[] => {
        return list.map((n) => {
          if (n.id === deptParentNode.id) {
            return {
              ...n,
              children: n.children ? [...n.children, newNode] : [newNode],
            };
          }
          if (n.children) {
            return { ...n, children: appendChildRecursive(n.children) };
          }
          return n;
        });
      };
      setDepartments((prev) => appendChildRecursive(prev));
      setExpandedNodes((prev) => ({ ...prev, [deptParentNode.id]: true }));
      showToast(`Đã thêm đơn vị con "${newNode.name}" vào phòng ban "${deptParentNode.name}"!`);
    } else {
      setDepartments((prev) => [...prev, newNode]);
      showToast(`Đã thêm phòng ban mới "${newNode.name}"!`);
    }

    setIsDeptModalOpen(false);
  };

  // Handler Mở Modal Thêm/Sửa Dải Lương
  const handleOpenSalaryModal = (band?: JobTitleSalaryBand) => {
    if (band) {
      setEditingBand(band);
      setSalaryFormData({
        code: band.code,
        title: band.title,
        level: band.level,
        department: band.department,
        minSalary: String(band.minSalary),
        maxSalary: String(band.maxSalary),
      });
    } else {
      setEditingBand(null);
      setSalaryFormData({
        code: "",
        title: "",
        level: "Senior",
        department: "Khối Công Nghệ & Sản Phẩm",
        minSalary: "25000000",
        maxSalary: "40000000",
      });
    }
    setIsSalaryModalOpen(true);
  };

  const handleSaveSalaryBand = (e: React.FormEvent) => {
    e.preventDefault();
    const min = Number(salaryFormData.minSalary);
    const max = Number(salaryFormData.maxSalary);

    if (max < min) {
      alert("Lương tối đa (Max) phải lớn hơn hoặc bằng lương tối thiểu (Min)!");
      return;
    }
    if (!salaryFormData.title.trim()) {
      alert("Vui lòng nhập tên chức danh!");
      return;
    }

    if (editingBand) {
      setSalaryBands((prev) =>
        prev.map((b) =>
          b.id === editingBand.id
            ? {
                ...b,
                code: salaryFormData.code.toUpperCase(),
                title: salaryFormData.title.trim(),
                level: salaryFormData.level,
                department: salaryFormData.department,
                minSalary: min,
                maxSalary: max,
              }
            : b
        )
      );
      showToast(`Đã cập nhật dải lương cho chức danh "${salaryFormData.title}"!`);
    } else {
      const newBand: JobTitleSalaryBand = {
        id: `band-${Date.now()}`,
        code: salaryFormData.code.toUpperCase() || `JOB-${Date.now().toString().slice(-4)}`,
        title: salaryFormData.title.trim(),
        level: salaryFormData.level,
        department: salaryFormData.department,
        minSalary: min,
        maxSalary: max,
        status: "active",
      };
      setSalaryBands((prev) => [newBand, ...prev]);
      showToast(`Đã thêm mới chức danh "${newBand.title}" vào danh mục dải lương!`);
    }

    setIsSalaryModalOpen(false);
  };

  // Filter Salary Bands
  const filteredSalaryBands = useMemo(() => {
    return salaryBands.filter((b) => {
      const matchSearch =
        b.title.toLowerCase().includes(searchSalary.toLowerCase()) ||
        b.code.toLowerCase().includes(searchSalary.toLowerCase()) ||
        b.department.toLowerCase().includes(searchSalary.toLowerCase());
      const matchLevel = filterLevel === "all" || b.level === filterLevel;
      return matchSearch && matchLevel;
    });
  }, [salaryBands, searchSalary, filterLevel]);

  // =========================================================================
  // RENDER CÂY PHÒNG BAN ĐỆ QUY (RECURSIVE TREE VIEW)
  // =========================================================================
  const renderDepartmentNode = (node: DepartmentNode, level = 0) => {
    const isExpanded = !!expandedNodes[node.id];
    const hasChildren = node.children && node.children.length > 0;
    const isDeactivated = node.status === "inactive";

    return (
      <div key={node.id} className="select-none">
        <div
          className={`group flex flex-col md:flex-row md:items-center justify-between p-3.5 my-1.5 rounded-2xl border transition-all duration-150 ${
            isDeactivated
              ? "bg-slate-100/70 border-slate-200 opacity-60"
              : "bg-white border-gray-100 hover:border-blue-100 hover:shadow-xs"
          }`}
          style={{ marginLeft: `${level * 24}px` }}
        >
          {/* CỘT TRÁI: ICON MŨI TÊN, TÊN PHÒNG BAN (IN ĐẬM), MÃ (BADGE), PIC */}
          <div className="flex items-start md:items-center gap-3 min-w-0">
            {/* Icon mũi tên (Chevron) mở rộng / thu gọn */}
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleNode(node.id)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0 mt-0.5 md:mt-0"
                title={isExpanded ? "Thu gọn" : "Mở rộng"}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <span className="w-7 h-7 flex items-center justify-center shrink-0 text-slate-300">
                •
              </span>
            )}

            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#4285F4] flex items-center justify-center shrink-0">
              <Folder className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Tên phòng ban in đậm */}
                <span className="text-sm font-bold text-slate-900 truncate">
                  {node.name}
                </span>

                {/* Mã phòng ban (badge nhỏ, ví dụ BGD, TECH) */}
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-600 uppercase border border-slate-200/60">
                  {node.code}
                </span>

                {isDeactivated && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                    Ngừng áp dụng
                  </span>
                )}
              </div>

              {/* Tên người phụ trách */}
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                <span>Người phụ trách:</span>
                <strong className="text-slate-800 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  {node.managerName}
                </strong>
                <span className="text-slate-400">({node.managerTitle})</span>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: SỐ NHÂN SỰ (HIỆN TẠI/TỔNG), VỊ TRÍ ĐANG MỞ, NÚT HÀNH ĐỘNG */}
          <div className="flex items-center gap-3 mt-3 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100 shrink-0">
            {/* Hiển thị số nhân sự hiện tại/tổng và số vị trí đang mở */}
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-700">
                {node.headcountCurrent} / {node.headcountBudget} nhân sự
              </div>
              <div className="text-[11px]">
                {node.active_jobs > 0 ? (
                  <span className="text-blue-600 font-semibold">
                    🔥 {node.active_jobs} vị trí đang mở
                  </span>
                ) : (
                  <span className="text-slate-400">0 vị trí mở</span>
                )}
              </div>
            </div>

            {/* Nút hành động từng dòng: "+ Đơn vị con" và nút "Xóa" */}
            <div className="flex items-center gap-1.5">
              {/* Nút "+ Đơn vị con" */}
              <button
                type="button"
                onClick={() => handleOpenAddDeptModal(node)}
                className="px-2.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                title={`Thêm đơn vị trực thuộc ${node.name}`}
              >
                + Đơn vị con
              </button>

              {/* LOGIC XÓA:
                  - active_jobs > 0: Khóa Xóa (Disabled nền xám) và thay thế/kèm bằng "Ngừng áp dụng" (viền cam, chữ cam)
                  - active_jobs == 0: Nút Xóa (viền đỏ, chữ đỏ) */}
              {node.active_jobs > 0 ? (
                <div className="flex items-center gap-1.5">
                  {/* Nút Xóa bị vô hiệu hóa (Khóa Xóa nền xám) */}
                  <button
                    type="button"
                    disabled
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-400 cursor-not-allowed flex items-center gap-1 border border-slate-200"
                    title={`Không thể xóa: Phòng ban đang có ${node.active_jobs} vị trí tuyển dụng mở.`}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Khóa Xóa</span>
                  </button>

                  {/* Nút "Ngừng áp dụng" (viền cam, chữ cam) */}
                  <button
                    type="button"
                    onClick={() => handleToggleDeactivateDepartment(node.id, node.name)}
                    className="px-3 py-1.5 rounded-full text-xs font-bold border border-amber-300 text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer shadow-xs"
                    title="Chuyển sang trạng thái ngừng áp dụng cho tuyển dụng mới"
                  >
                    {isDeactivated ? "Kích hoạt lại" : "Ngừng áp dụng"}
                  </button>
                </div>
              ) : (
                /* Nút Xóa (viền đỏ, chữ đỏ) khi 0 vị trí mở */
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Bạn có chắc chắn muốn xóa phòng ban "${node.name}" không?`)) {
                      handleDeleteDepartment(node.id, node.name);
                    }
                  }}
                  className="px-3 py-1.5 rounded-full text-xs font-bold border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                  title="Xóa phòng ban (Đạt điều kiện: 0 vị trí mở)"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Xóa</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Render con đệ quy nếu mở rộng */}
        {hasChildren && isExpanded && (
          <div className="border-l-2 border-slate-200/60 ml-4 pl-2 space-y-1">
            {node.children!.map((child) => renderDepartmentNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-full bg-slate-900 text-white text-sm font-medium shadow-2xl animate-fade-in border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. HEADER CỦA KHU VỰC NỘI DUNG & THANH TABS CHUYỂN ĐỔI (DẠNG PILL) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          {/* Dòng chữ nhỏ bên trên tiêu đề */}
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            DANH MỤC NỀN TẢNG (MASTER DATA)
          </div>
          {/* Tiêu đề lớn */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Quản lý Cấu trúc Tổ chức & Khung Lương
          </h1>
          {/* Mô tả ngắn */}
          <p className="text-sm text-slate-500 mt-1">
            Thiết lập cấu trúc cây phòng ban đa cấp và khung dải lương chuẩn cho toàn hệ thống
          </p>
        </div>

        {/* ======================================================================= */}
        {/* 2. THANH TABS CHUYỂN ĐỔI (NỀN TRẮNG, BO TRÒN DẠNG PILL) */}
        {/* ======================================================================= */}
        <div className="flex items-center gap-1.5 p-1.5 bg-white rounded-full border border-gray-200 shadow-xs self-start sm:self-auto">
          {/* Tab 1: Sơ đồ phòng ban (Tree) */}
          <button
            type="button"
            onClick={() => handleTabChange("tree_view")}
            className={`px-5 py-2 rounded-full text-xs transition-all cursor-pointer ${
              activeTab === "tree_view"
                ? "border border-blue-200 text-[#4285F4] bg-blue-50/70 font-bold shadow-xs"
                : "border border-transparent text-slate-500 hover:text-slate-800 font-medium"
            }`}
          >
            1. Sơ đồ phòng ban (Tree)
          </button>

          {/* Tab 2: Chức danh & Dải lương */}
          <button
            type="button"
            onClick={() => handleTabChange("salary_bands")}
            className={`px-5 py-2 rounded-full text-xs transition-all cursor-pointer ${
              activeTab === "salary_bands"
                ? "border border-blue-200 text-[#4285F4] bg-blue-50/70 font-bold shadow-xs"
                : "border border-transparent text-slate-500 hover:text-slate-800 font-medium"
            }`}
          >
            2. Chức danh & Dải lương
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. KHU VỰC HIỂN THỊ SƠ ĐỒ PHÒNG BAN (KHI CHỌN TAB 1) */}
      {/* ========================================================================= */}
      {activeTab === "tree_view" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6 animate-fade-in">
          {/* Toolbar với Tiêu đề phụ & Nhóm nút hành động ngang hàng */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Cây Cơ Cấu Phòng Ban Nhiều Cấp (Hierarchical Tree)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mỗi phòng ban có người phụ trách • Phòng ban đang có vị trí mở tuyển sẽ khóa nút xóa
              </p>
            </div>

            {/* Nhóm nút hành động: "Mở rộng tất cả", "Thu gọn", "+ Thêm Phòng Ban" */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={expandAll}
                className="px-3.5 py-2 rounded-full border border-gray-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-xs"
              >
                Mở rộng tất cả
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="px-3.5 py-2 rounded-full border border-gray-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-xs"
              >
                Thu gọn
              </button>
              <button
                type="button"
                onClick={() => handleOpenAddDeptModal()}
                className="px-4 py-2 rounded-full bg-[#4285F4] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Thêm Phòng Ban</span>
              </button>
            </div>
          </div>

          {/* Tree View Container */}
          <div className="space-y-1">
            {departments.map((dept) => renderDepartmentNode(dept, 0))}
          </div>

          {/* Chú thích nghiệp vụ */}
          <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-gray-200/80 text-xs text-slate-600 flex items-start gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0"></span>
            <div>
              <strong className="text-slate-800">Quy tắc an toàn dữ liệu:</strong> Phòng ban đang gắn với yêu cầu tuyển dụng còn mở (<code className="text-blue-600 font-bold">active_jobs &gt; 0</code>) sẽ tự động bị khóa nút Xóa (Disabled) nhằm bảo toàn tính toàn vẹn dữ liệu. Quản trị viên sử dụng tính năng <strong>"Ngừng áp dụng"</strong> để tạm dừng tiếp nhận ứng viên mới.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. KHU VỰC HIỂN THỊ CHỨC DANH & DẢI LƯƠNG (KHI CHỌN TAB 2) */}
      {/* ========================================================================= */}
      {activeTab === "salary_bands" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Danh Mục Khung Dải Lương Chuẩn Theo Chức Danh
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Thiết lập mức Min - Max cho từng Level, kiểm soát chi phí tuyển dụng
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenSalaryModal()}
              className="px-4 py-2 rounded-full bg-[#4285F4] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>+ Thêm Chức Danh</span>
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[260px] flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo chức danh, mã, phòng ban..."
                  value={searchSalary}
                  onChange={(e) => setSearchSalary(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                />
              </div>

              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
              >
                <option value="all">Tất cả cấp bậc</option>
                <option value="Junior">Junior</option>
                <option value="Middle">Middle</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead</option>
                <option value="Manager">Manager</option>
                <option value="Director">Director</option>
              </select>
            </div>

            {searchSalary && (
              <button
                onClick={() => setSearchSalary("")}
                className="text-xs text-[#4285F4] hover:underline font-semibold self-end sm:self-auto"
              >
                Xóa tìm kiếm
              </button>
            )}
          </div>

          {/* Salary Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <th className="py-3.5 px-4">Mã & Chức danh</th>
                  <th className="py-3.5 px-4 text-center">Cấp bậc</th>
                  <th className="py-3.5 px-4">Phòng ban</th>
                  <th className="py-3.5 px-4 text-right">Lương tối thiểu (Min)</th>
                  <th className="py-3.5 px-4 text-right">Lương tối đa (Max)</th>
                  <th className="py-3.5 px-4 text-center">Biên độ lương</th>
                  <th className="py-3.5 px-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSalaryBands.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Không tìm thấy chức danh phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredSalaryBands.map((band) => {
                    const diff = band.maxSalary - band.minSalary;
                    return (
                      <tr key={band.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          <div>{band.title}</div>
                          <span className="text-[10px] text-slate-400 font-mono font-normal">
                            {band.code}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-[#4285F4] border border-blue-100">
                            {band.level}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{band.department}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                          {band.minSalary.toLocaleString("vi-VN")} đ
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                          {band.maxSalary.toLocaleString("vi-VN")} đ
                        </td>
                        <td className="py-3.5 px-4 text-center text-xs text-slate-500">
                          +{(diff / 1000000).toFixed(0)} Triệu
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenSalaryModal(band)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Chỉnh sửa dải lương"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Bạn có chắc muốn xóa chức danh "${band.title}"?`)) {
                                  setSalaryBands((prev) => prev.filter((b) => b.id !== band.id));
                                  showToast(`Đã xóa chức danh "${band.title}"!`);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Xóa chức danh"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL THÊM PHÒNG BAN / ĐƠN VỊ CON */}
      {/* ========================================================================= */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 animate-scale-up space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-lg text-slate-900">
                {deptParentNode
                  ? `Thêm Đơn Vị Con Trực Thuộc: ${deptParentNode.name}`
                  : "Thêm Khối / Phòng Ban Mới"}
              </h3>
              <button
                onClick={() => setIsDeptModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDepartment} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã phòng ban *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: TECH, DEV..."
                    value={deptFormData.code}
                    onChange={(e) => setDeptFormData({ ...deptFormData, code: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Định biên nhân sự
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={deptFormData.headcountBudget}
                    onChange={(e) =>
                      setDeptFormData({ ...deptFormData, headcountBudget: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên phòng ban đầy đủ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Trung Tâm Đổi Mới Sáng Tạo..."
                  value={deptFormData.name}
                  onChange={(e) => setDeptFormData({ ...deptFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Người phụ trách (PIC)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Nguyễn Văn A"
                    value={deptFormData.managerName}
                    onChange={(e) =>
                      setDeptFormData({ ...deptFormData, managerName: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chức danh người phụ trách
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Trưởng Bộ Phận"
                    value={deptFormData.managerTitle}
                    onChange={(e) =>
                      setDeptFormData({ ...deptFormData, managerTitle: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2.5 rounded-full border border-gray-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-[#4285F4] hover:bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/25 cursor-pointer"
                >
                  Lưu Phòng Ban
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL THÊM / CHỈNH SỬA CHỨC DANH & DẢI LƯƠNG */}
      {/* ========================================================================= */}
      {isSalaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 animate-scale-up space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-extrabold text-lg text-slate-900">
                {editingBand ? "Chỉnh Sửa Dải Lương Chức Danh" : "Thêm Chức Danh & Khung Lương Mới"}
              </h3>
              <button
                onClick={() => setIsSalaryModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSalaryBand} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mã chức danh *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: DEV-SR"
                    value={salaryFormData.code}
                    onChange={(e) =>
                      setSalaryFormData({ ...salaryFormData, code: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cấp bậc *</label>
                  <select
                    value={salaryFormData.level}
                    onChange={(e) =>
                      setSalaryFormData({
                        ...salaryFormData,
                        level: e.target.value as JobTitleSalaryBand["level"],
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                  >
                    <option value="Junior">Junior</option>
                    <option value="Middle">Middle</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead</option>
                    <option value="Manager">Manager</option>
                    <option value="Director">Director</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên chức danh chuyên môn *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Senior Frontend Engineer (React/Next.js)"
                  value={salaryFormData.title}
                  onChange={(e) =>
                    setSalaryFormData({ ...salaryFormData, title: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Khối / Phòng ban phụ trách
                </label>
                <input
                  type="text"
                  placeholder="VD: Khối Công Nghệ & Sản Phẩm"
                  value={salaryFormData.department}
                  onChange={(e) =>
                    setSalaryFormData({ ...salaryFormData, department: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lương tối thiểu (Min) VND *
                  </label>
                  <input
                    type="number"
                    step="1000000"
                    required
                    value={salaryFormData.minSalary}
                    onChange={(e) =>
                      setSalaryFormData({ ...salaryFormData, minSalary: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lương tối đa (Max) VND *
                  </label>
                  <input
                    type="number"
                    step="1000000"
                    required
                    value={salaryFormData.maxSalary}
                    onChange={(e) =>
                      setSalaryFormData({ ...salaryFormData, maxSalary: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsSalaryModalOpen(false)}
                  className="px-4 py-2.5 rounded-full border border-gray-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-full bg-[#4285F4] hover:bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/25 cursor-pointer"
                >
                  Lưu Khung Lương
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MasterDataManagementView;
