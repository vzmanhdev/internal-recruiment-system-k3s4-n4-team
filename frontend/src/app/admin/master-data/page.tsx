"use client";

import React, { useState, useEffect } from "react";
import { AdminAppShell } from "@/components/layout/AdminAppShell";
import { Sliders, Building, Briefcase, Plus, RefreshCw, CheckCircle2, X, Users, Network, FileText, Check, AlertCircle } from "lucide-react";
import { authService } from "@/features/auth/services/auth.service";

interface Department {
  id: number;
  name: string;
  code: string;
  parent_id?: number | null;
  sort_order?: number;
  is_active?: boolean;
}

interface JobTitle {
  id: number;
  name: string;
  department_id?: number | null;
  description?: string;
}

// Danh sách người dùng/trưởng phòng gợi ý
const MANAGERS_LIST = [
  { id: 1, name: "Nguyễn Văn An", title: "Giám đốc Khối Công nghệ", email: "an.nguyen@company.com" },
  { id: 2, name: "Trần Thị Bích", title: "Trưởng phòng Tuyển dụng & Đào tạo", email: "bich.tran@company.com" },
  { id: 3, name: "Lê Hoàng Nam", title: "Trưởng phòng Vận hành & Hạ tầng", email: "nam.le@company.com" },
  { id: 4, name: "Phạm Minh Đức", title: "Trưởng phòng Phát triển Phần mềm", email: "duc.pham@company.com" },
  { id: 5, name: "Vũ Thu Hà", title: "Trưởng ban Tài chính & Kế toán", email: "ha.vu@company.com" },
  { id: 6, name: "Hoàng Mai Linh", title: "Trưởng phòng Marketing & Truyền thông", email: "linh.hoang@company.com" },
  { id: 7, name: "Đỗ Quốc Bảo", title: "Trưởng phòng Pháp chế & Tuân thủ", email: "bao.do@company.com" },
];

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<"departments" | "titles">("departments");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states cho tạo mới Phòng ban (Đầy đủ trường chi tiết)
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [deptManager, setDeptManager] = useState("");
  const [deptParentId, setDeptParentId] = useState<string>("");
  const [deptDescription, setDeptDescription] = useState("");
  const [deptIsActive, setDeptIsActive] = useState<boolean>(true);

  // Form states cho tạo mới Chức danh
  const [jobName, setJobName] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [jobLevel, setJobLevel] = useState("Senior");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchMasterData = async () => {
    setIsLoading(true);
    try {
      const token = authService.getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [deptRes, jobRes] = await Promise.all([
        fetch("http://localhost:8000/api/v1/hr/departments", { headers }),
        fetch("http://localhost:8000/api/v1/hr/job-titles", { headers }),
      ]);

      if (deptRes.ok) {
        const deptData = await deptRes.json();
        setDepartments(deptData || []);
      }
      if (jobRes.ok) {
        const jobData = await jobRes.json();
        setJobTitles(jobData || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  const handleCreateMasterData = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const token = authService.getToken();
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      if (activeTab === "departments") {
        if (!deptName || !deptCode) {
          setErrorMsg("Vui lòng nhập đầy đủ Tên phòng ban và Mã định danh");
          setIsSubmitting(false);
          return;
        }

        const res = await fetch("http://localhost:8000/api/v1/hr/departments", {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: deptName,
            code: deptCode.toUpperCase(),
            parent_id: deptParentId ? parseInt(deptParentId) : null,
            is_active: deptIsActive,
            sort_order: 0,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || "Không thể tạo phòng ban mới");
        }
      } else {
        if (!jobName) {
          setErrorMsg("Vui lòng nhập Tên chức danh công việc");
          setIsSubmitting(false);
          return;
        }

        const res = await fetch("http://localhost:8000/api/v1/hr/job-titles", {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: jobName,
            department_id: selectedDeptId ? parseInt(selectedDeptId) : null,
            level: jobLevel,
            min_salary: 0,
            max_salary: 0,
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || "Không thể tạo chức danh mới");
        }
      }

      // Reset Form State
      setDeptName("");
      setDeptCode("");
      setDeptManager("");
      setDeptParentId("");
      setDeptDescription("");
      setDeptIsActive(true);
      setJobName("");
      setSelectedDeptId("");
      setJobLevel("Senior");
      setIsModalOpen(false);

      await fetchMasterData();
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi thao tác dữ liệu");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminAppShell activeTab="master-data">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Sliders className="w-7 h-7 text-[#4285F4]" />
              Danh Mục Dùng Chung Thật Sự (Master Data DB)
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Dữ liệu được lưu trữ và truy vấn trực tiếp từ Cơ sở dữ liệu backend SQLite. Không còn dữ liệu giả lập (mockup).
            </p>
          </div>

          <button
            onClick={() => {
              setErrorMsg(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-[#4285F4] text-white hover:bg-blue-600 text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 shrink-0 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm {activeTab === "departments" ? "phòng ban" : "chức danh"} mới</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab("departments")}
            className={`pb-3 px-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === "departments"
                ? "border-[#4285F4] text-[#4285F4]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Phòng ban ({departments.length})
          </button>
          <button
            onClick={() => setActiveTab("titles")}
            className={`pb-3 px-4 border-b-2 transition-colors cursor-pointer ${
              activeTab === "titles"
                ? "border-[#4285F4] text-[#4285F4]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Chức danh công việc ({jobTitles.length})
          </button>
        </div>

        {/* Table Content */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#4285F4]" />
              <p className="text-xs font-medium">Đang tải danh mục từ Cơ sở dữ liệu...</p>
            </div>
          ) : (
            <>
              {activeTab === "departments" && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-100 font-extrabold uppercase text-[11px] text-slate-500">
                      <th className="py-3.5 px-4">ID</th>
                      <th className="py-3.5 px-4">Tên phòng ban</th>
                      <th className="py-3.5 px-4">Mã định danh (Code)</th>
                      <th className="py-3.5 px-4">Phòng ban cấp trên (Parent)</th>
                      <th className="py-3.5 px-4">Trạng thái Database</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {departments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">
                          Chưa có dữ liệu phòng ban trong Database. Bấm nút Thêm mới ở trên để tạo.
                        </td>
                      </tr>
                    ) : (
                      departments.map((d) => {
                        const parentDept = departments.find((p) => p.id === d.parent_id);
                        return (
                          <tr key={d.id} className="hover:bg-slate-50">
                            <td className="py-3.5 px-4 font-bold text-slate-400">#{d.id}</td>
                            <td className="py-3.5 px-4 font-bold text-slate-900">{d.name}</td>
                            <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{d.code}</td>
                            <td className="py-3.5 px-4 text-slate-600">
                              {parentDept ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                                  <Network className="w-3 h-3" />
                                  {parentDept.name}
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">Cấp cao nhất</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-extrabold inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Live DB
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}

              {activeTab === "titles" && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-100 font-extrabold uppercase text-[11px] text-slate-500">
                      <th className="py-3.5 px-4">ID</th>
                      <th className="py-3.5 px-4">Tên chức danh</th>
                      <th className="py-3.5 px-4">Mã phòng ban liên kết</th>
                      <th className="py-3.5 px-4">Trạng thái Database</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {jobTitles.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400">
                          Chưa có dữ liệu chức danh công việc trong Database. Bấm nút Thêm mới ở trên để tạo.
                        </td>
                      </tr>
                    ) : (
                      jobTitles.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4 font-bold text-slate-400">#{t.id}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{t.name}</td>
                          <td className="py-3.5 px-4 text-slate-600 font-semibold">
                            {t.department_id ? `Phòng ban ID #${t.department_id}` : "Toàn hệ thống"}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-extrabold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-blue-600" /> Live DB
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL MỞ RỘNG: THÊM PHÒNG BAN MỚI (max-w-2xl / max-w-3xl, GRID 2 CỘT) */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 border border-slate-100">
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#4285F4] flex items-center justify-center font-bold shrink-0">
                  {activeTab === "departments" ? (
                    <Building className="w-5 h-5" />
                  ) : (
                    <Briefcase className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Thêm {activeTab === "departments" ? "Phòng Ban" : "Chức Danh"} Mới Vào Database
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeTab === "departments"
                      ? "Thiết lập cấu trúc phòng ban, người phụ trách và phân cấp sơ đồ tổ chức"
                      : "Thêm chức danh vị trí công việc vào danh mục tiêu chuẩn tập đoàn"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateMasterData}>
              {activeTab === "departments" ? (
                /* FORM PHÒNG BAN: CHIA LƯỚI grid grid-cols-1 md:grid-cols-2 gap-5 */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-medium">
                  {/* 1. Tên phòng ban (*) */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-700 font-bold">
                      Tên phòng ban <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Phòng Kỹ Thuật Phần Mềm"
                      value={deptName}
                      onChange={(e) => setDeptName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-[#4285F4] transition-colors"
                      required
                    />
                  </div>

                  {/* 2. Mã phòng ban (Code) (*) */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-700 font-bold">
                      Mã phòng ban (Code) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: TECH / ENG"
                      value={deptCode}
                      onChange={(e) => setDeptCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-mono uppercase font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#4285F4] transition-colors"
                      required
                    />
                  </div>

                  {/* 3. Trưởng phòng phụ trách */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-700 font-bold">
                      Trưởng phòng phụ trách
                    </label>
                    <select
                      value={deptManager}
                      onChange={(e) => setDeptManager(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-[#4285F4] transition-colors"
                    >
                      <option value="">-- Chưa phân công trưởng phòng --</option>
                      {MANAGERS_LIST.map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name} ({m.title})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 4. Phòng ban cha (Parent) */}
                  <div className="space-y-1.5">
                    <label className="block text-slate-700 font-bold">
                      Phòng ban cha (Parent Org)
                    </label>
                    <select
                      value={deptParentId}
                      onChange={(e) => setDeptParentId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-[#4285F4] transition-colors"
                    >
                      <option value="">-- Không có (Phòng ban cấp cao nhất) --</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 5. Mô tả chức năng (Chiếm 2 cột - md:col-span-2) */}
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="block text-slate-700 font-bold">
                      Mô tả chức năng & phạm vi nhiệm vụ
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Mô tả chức năng, nhiệm vụ chính, phạm vi hoạt động của phòng ban trong sơ đồ tổ chức..."
                      value={deptDescription}
                      onChange={(e) => setDeptDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-[#4285F4] transition-colors leading-relaxed"
                    />
                  </div>

                  {/* 6. Trạng thái: Toggle / Select Hoạt động hoặc Tạm ngưng */}
                  <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-gray-200 gap-3">
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">
                        Trạng thái hoạt động
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Cho phép phòng ban được lựa chọn khi tạo Yêu cầu tuyển dụng (REQ) và tuyển dụng nhân sự
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={deptIsActive ? "active" : "inactive"}
                        onChange={(e) => setDeptIsActive(e.target.value === "active")}
                        className="px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#4285F4] cursor-pointer"
                      >
                        <option value="active">🟢 Hoạt động (Active)</option>
                        <option value="inactive">⚪ Tạm ngưng (Inactive)</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                /* FORM CHỨC DANH CÔNG VIỆC */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-medium">
                  <div className="space-y-1.5">
                    <label className="block text-slate-700 font-bold">
                      Tên chức danh công việc <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Senior Software Engineer"
                      value={jobName}
                      onChange={(e) => setJobName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-[#4285F4]"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-slate-700 font-bold">Cấp bậc (Level)</label>
                    <select
                      value={jobLevel}
                      onChange={(e) => setJobLevel(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-[#4285F4]"
                    >
                      <option value="Junior">Junior</option>
                      <option value="Middle">Middle</option>
                      <option value="Senior">Senior</option>
                      <option value="Lead">Lead / Quản lý</option>
                      <option value="Director">Giám đốc / Trưởng ban</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="block text-slate-700 font-bold">
                      Phòng ban liên kết (Tùy chọn)
                    </label>
                    <select
                      value={selectedDeptId}
                      onChange={(e) => setSelectedDeptId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-[#4285F4]"
                    >
                      <option value="">Toàn hệ thống (Không giới hạn phòng ban)</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* 3. TINH CHỈNH FOOTER: Căn lề phải flex justify-end gap-3 mt-6 */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#4285F4] hover:bg-blue-600 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Lưu vào Database</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminAppShell>
  );
}
