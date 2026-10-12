"use client";

import React, { useState, useEffect } from "react";
import { AdminAppShell } from "@/components/layout/AdminAppShell";
import { Sliders, Building, Briefcase, Plus, RefreshCw, CheckCircle2, X } from "lucide-react";
import { authService } from "@/features/auth/services/auth.service";

interface Department {
  id: number;
  name: string;
  code: string;
  parent_id?: number | null;
  sort_order?: number;
}

interface JobTitle {
  id: number;
  name: string;
  department_id?: number | null;
  description?: string;
}

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<"departments" | "titles">("departments");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states for creating new Master Data
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [jobName, setJobName] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
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
          body: JSON.stringify({ name: deptName, code: deptCode.toUpperCase() }),
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
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || "Không thể tạo chức danh mới");
        }
      }

      // Reset & Refresh
      setDeptName("");
      setDeptCode("");
      setJobName("");
      setSelectedDeptId("");
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
            className="px-4 py-2.5 rounded-xl bg-[#4285F4] text-white hover:bg-blue-600 text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 shrink-0 cursor-pointer"
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
                      <th className="py-3.5 px-4">Trạng thái Database</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {departments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400">
                          Chưa có dữ liệu phòng ban trong Database. Bấm nút Thêm mới ở trên để tạo.
                        </td>
                      </tr>
                    ) : (
                      departments.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4 font-bold text-slate-400">#{d.id}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">{d.name}</td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{d.code}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-extrabold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Live DB
                            </span>
                          </td>
                        </tr>
                      ))
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

      {/* Modal create new Master Data */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">
                Thêm {activeTab === "departments" ? "Phòng Ban" : "Chức Danh"} Mới Vào Database
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateMasterData} className="space-y-4 text-xs font-medium">
              {activeTab === "departments" ? (
                <>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Tên phòng ban *</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Phòng Kỹ Thuật"
                      value={deptName}
                      onChange={(e) => setDeptName(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#4285F4]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Mã phòng ban (Code) *</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: TECH"
                      value={deptCode}
                      onChange={(e) => setDeptCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#4285F4] uppercase font-mono"
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Tên chức danh công việc *</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Senior Software Engineer"
                      value={jobName}
                      onChange={(e) => setJobName(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#4285F4]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Phòng ban liên kết (Tùy chọn)</label>
                    <select
                      value={selectedDeptId}
                      onChange={(e) => setSelectedDeptId(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#4285F4]"
                    >
                      <option value="">Toàn hệ thống (Không chọn)</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#4285F4] text-white hover:bg-blue-600 font-bold shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? "Đang lưu..." : "Lưu vào Database"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminAppShell>
  );
}
