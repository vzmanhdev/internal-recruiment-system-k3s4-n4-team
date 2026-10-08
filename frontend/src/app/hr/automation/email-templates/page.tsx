"use client";

import { existingApiFetch } from "@/lib/existing-api-fetch";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Edit3,
  Trash2,
  Sparkles,
  Layers,
  Send,
  Check,
  AlertTriangle,
  RefreshCw,
  Copy,
  ToggleLeft,
  ToggleRight,
  Code
} from "lucide-react";

interface EmailTemplate {
  id: number;
  code: string;
  name: string;
  category: string;
  subject: string;
  body_html: string;
  is_auto_send: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const AVAILABLE_VARIABLES = [
  { key: "{candidate_name}", label: "Tên ứng viên", desc: "Ví dụ: Tống Thị Quỳnh Ngoo" },
  { key: "{job_title}", label: "Tên vị trí tuyển dụng", desc: "Ví dụ: Senior Software Engineer" },
  { key: "{company_name}", label: "Tên công ty", desc: "Ví dụ: Enterprise ATS" },
  { key: "{interview_time}", label: "Thời gian phỏng vấn", desc: "Ví dụ: 09:30 - 15/10/2026" },
  { key: "{interview_location}", label: "Địa điểm / Link họp", desc: "Ví dụ: Google Meet..." },
  { key: "{interviewer_name}", label: "Người phỏng vấn", desc: "Ví dụ: Trần Thị Thu Hà" },
  { key: "{offer_salary}", label: "Mức lương offer", desc: "Ví dụ: 38,000,000 VNĐ" },
  { key: "{requisition_code}", label: "Mã tờ trình", desc: "Ví dụ: REQ-2026-IT-004" },
  { key: "{portal_link}", label: "Link cổng thông tin", desc: "Ví dụ: http://localhost:3000/..." }
];

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<EmailTemplate> | null>(null);
  
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{ subject: string; body_html: string; name: string } | null>(null);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await existingApiFetch("http://localhost:8000/api/v1/email-automation/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleToggleAutoSend = async (tpl: EmailTemplate) => {
    try {
      const res = await existingApiFetch(`http://localhost:8000/api/v1/email-automation/templates/${tpl.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_auto_send: !tpl.is_auto_send })
      });
      if (res.ok) {
        const updated = await res.json();
        setTemplates((prev) => prev.map((t) => (t.id === tpl.id ? updated : t)));
        showToast(`Đã ${updated.is_auto_send ? "bật" : "tắt"} tự động gửi cho mẫu "${tpl.name}"`);
      }
    } catch (err) {
      showToast("Lỗi khi cập nhật trạng thái tự động gửi!", "error");
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate || !editingTemplate.name || !editingTemplate.subject || !editingTemplate.body_html) {
      showToast("Vui lòng điền đầy đủ tiêu đề và nội dung mẫu email", "error");
      return;
    }

    try {
      if (editingTemplate.id) {
        // Update
        const res = await existingApiFetch(`http://localhost:8000/api/v1/email-automation/templates/${editingTemplate.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingTemplate)
        });
        if (res.ok) {
          const updated = await res.json();
          setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
          showToast("Cập nhật mẫu email thành công!");
          setIsEditModalOpen(false);
        }
      } else {
        // Create new
        const newCode = editingTemplate.code || `TPL_${Date.now()}`;
        const res = await existingApiFetch("http://localhost:8000/api/v1/email-automation/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...editingTemplate, code: newCode })
        });
        if (res.ok) {
          const created = await res.json();
          setTemplates((prev) => [...prev, created]);
          showToast("Tạo mẫu email mới thành công!");
          setIsEditModalOpen(false);
        }
      }
    } catch (err) {
      showToast("Không thể lưu mẫu email!", "error");
    }
  };

  const handlePreview = async (tpl: EmailTemplate) => {
    try {
      const res = await existingApiFetch(`http://localhost:8000/api/v1/email-automation/templates/${tpl.id}/preview`, {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewData({
          name: tpl.name,
          subject: data.rendered_subject,
          body_html: data.rendered_body_html
        });
        setIsPreviewModalOpen(true);
      }
    } catch (err) {
      showToast("Lỗi khi tải bản xem trước!", "error");
    }
  };

  const insertVariable = (varKey: string) => {
    if (!editingTemplate) return;
    setEditingTemplate((prev) => ({
      ...prev,
      body_html: (prev?.body_html || "") + ` ${varKey} `
    }));
  };

  const filteredTemplates = templates.filter((tpl) => {
    const matchesSearch =
      tpl.name.toLowerCase().includes(search.toLowerCase()) ||
      tpl.code.toLowerCase().includes(search.toLowerCase()) ||
      tpl.subject.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || tpl.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(templates.map((t) => t.category)));

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* EDIT / CREATE TEMPLATE MODAL */}
      {isEditModalOpen && editingTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 space-y-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {editingTemplate.id ? "Chỉnh Sửa Mẫu Email Tự Động" : "Tạo Mẫu Email Tự Động Mới"}
                  </h3>
                  <p className="text-xs text-slate-400">Cấu hình tiêu đề, nội dung và các biến dữ liệu thông minh</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã mẫu Email (Unique Code) *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingTemplate.id}
                    value={editingTemplate.code || ""}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, code: e.target.value.toUpperCase() })}
                    placeholder="VD: CONFIRM_APPLICATION"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-[#2563EB] disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tên hiển thị mẫu *</label>
                  <input
                    type="text"
                    required
                    value={editingTemplate.name || ""}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    placeholder="VD: Xác nhận đã nhận hồ sơ ứng tuyển"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phân loại *</label>
                  <select
                    value={editingTemplate.category || "Tuyển dụng"}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="Tuyển dụng">Tuyển dụng</option>
                    <option value="Phỏng vấn">Phỏng vấn</option>
                    <option value="Offer">Offer</option>
                    <option value="Hệ thống">Hệ thống</option>
                  </select>
                </div>

                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={editingTemplate.is_auto_send ?? true}
                      onChange={(e) => setEditingTemplate({ ...editingTemplate, is_auto_send: e.target.checked })}
                      className="w-4 h-4 rounded text-[#2563EB] focus:ring-blue-500"
                    />
                    <span>Tự động gửi khi kích hoạt sự kiện</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tiêu đề Email (Subject) *</label>
                <input
                  type="text"
                  required
                  value={editingTemplate.subject || ""}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                  placeholder="VD: [{company_name}] Xác nhận đã nhận hồ sơ ứng tuyển vị trí {job_title}"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              {/* Dynamic Variables Picker Toolbar */}
              <div className="space-y-2 bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100">
                <div className="flex items-center justify-between text-[11px] font-bold text-blue-900">
                  <span className="flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-[#2563EB]" />
                    Chèn nhanh biến dữ liệu tự động (Placeholders):
                  </span>
                  <span className="text-blue-600 text-[10px]">Bấm vào thẻ để chèn vào nội dung</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {AVAILABLE_VARIABLES.map((v, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => insertVariable(v.key)}
                      title={v.desc}
                      className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-blue-700 font-bold hover:bg-blue-600 hover:text-white transition-all text-[11px] shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>{v.key}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nội dung Email HTML *</label>
                <textarea
                  rows={8}
                  required
                  value={editingTemplate.body_html || ""}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, body_html: e.target.value })}
                  placeholder="<p>Kính gửi {candidate_name},...</p>"
                  className="w-full p-3 bg-slate-50 border border-gray-200 rounded-xl font-mono text-slate-900 text-xs focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#2563EB] text-white hover:bg-blue-700 font-extrabold shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Lưu Mẫu Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {isPreviewModalOpen && previewData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Xem Trước Email Thực Tế (Live Preview)</h3>
                  <p className="text-[11px] text-slate-400">{previewData.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 text-xs">
              <div className="border-b border-slate-200 pb-2">
                <span className="text-slate-400 font-medium">Tiêu đề: </span>
                <span className="font-extrabold text-slate-900">{previewData.subject}</span>
              </div>
              
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs min-h-[180px]">
                <div dangerouslySetInnerHTML={{ __html: previewData.body_html }} />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 shadow-md cursor-pointer"
              >
                Đóng Bản Xem Trước
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Title & Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Mail className="w-7 h-7 text-[#2563EB]" />
            Cấu Hình Mẫu Email Tự Động (Email Templates)
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Quản lý danh sách mẫu email gửi tự động cho ứng viên và thành viên theo từng giai đoạn tuyển dụng (S8-01).
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingTemplate({ category: "Tuyển dụng", is_auto_send: true, is_active: true });
            setIsEditModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-[#2563EB] text-white hover:bg-blue-700 font-extrabold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo mẫu email mới</span>
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-slate-900">{templates.length}</div>
            <div className="text-[11px] text-slate-400 font-medium">Tổng mẫu email</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-slate-900">
              {templates.filter((t) => t.is_auto_send).length}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Đang bật tự động gửi</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-slate-900">{categories.length}</div>
            <div className="text-[11px] text-slate-400 font-medium">Danh mục phỏng vấn/offer</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-slate-900">9</div>
            <div className="text-[11px] text-slate-400 font-medium">Biến tự động sẵn sàng</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm mã, tên mẫu, tiêu đề..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-bold text-slate-600">Phân loại:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#2563EB]"
          >
            <option value="ALL">Tất cả phân loại</option>
            {categories.map((c, i) => (
              <option key={i} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Data Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-medium flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#2563EB]" />
            <span>Đang tải danh sách mẫu email...</span>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-2">
            <Mail className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700">Không tìm thấy mẫu email nào</p>
            <p>Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-gray-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Mã Mẫu / Tên Mẫu</th>
                  <th className="py-3.5 px-4">Phân Loại</th>
                  <th className="py-3.5 px-4">Tiêu Đề Mặc Định (Subject)</th>
                  <th className="py-3.5 px-4 text-center">Tự Động Gửi</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-slate-800">
                {filteredTemplates.map((tpl) => (
                  <tr key={tpl.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900 flex items-center gap-2">
                        <span>{tpl.name}</span>
                      </div>
                      <div className="text-[10px] font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md inline-block mt-1">
                        {tpl.code}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                        {tpl.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-md truncate">
                      <span className="text-slate-700 font-medium">{tpl.subject}</span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleAutoSend(tpl)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                          tpl.is_auto_send
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${tpl.is_auto_send ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
                        <span>{tpl.is_auto_send ? "Đang Bật" : "Đã Tắt"}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handlePreview(tpl)}
                          title="Xem trước mẫu dữ liệu thật"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 font-bold cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingTemplate(tpl);
                            setIsEditModalOpen(true);
                          }}
                          title="Chỉnh sửa mẫu"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#2563EB] hover:bg-blue-50 font-bold cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
