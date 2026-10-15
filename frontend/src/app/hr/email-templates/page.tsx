"use client";

import React, { useState, useMemo, useRef } from "react";
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
  Code,
  FileText,
  Sliders,
  X,
  Play,
  RotateCcw,
} from "lucide-react";
import { apiRequest, ApiError } from "@/lib/api-client";
import { useApiData } from "@/hooks/useApiData";
import { ErrorState, LoadingState } from "@/components/ui/DataStates";

// =============================================================================
// TYPES & DATA STRUCTURES
// =============================================================================

export interface EmailTemplateItem {
  id: string;
  code: string;
  name: string;
  category: "Thư cảm ơn" | "Mời phỏng vấn" | "Thư Offer" | "Thư từ chối" | "Onboarding";
  subject: string;
  body: string;
  isAutoSend: boolean;
  triggerEvent: string;
  updatedAt: string;
}

export interface InterpolationVariable {
  key: string;
  label: string;
  sampleValue: string;
  description: string;
}

// =============================================================================
// INITIAL MOCK DATA
// =============================================================================

const AVAILABLE_VARIABLES: InterpolationVariable[] = [
  { key: "[Tên ứng viên]", label: "[Tên ứng viên]", sampleValue: "Nguyễn Văn Tuấn", description: "Họ và tên đầy đủ của ứng viên" },
  { key: "[Tên vị trí]", label: "[Tên vị trí]", sampleValue: "Senior Backend Developer (Python/Go)", description: "Chức danh vị trí tuyển dụng" },
  { key: "[Tên công ty]", label: "[Tên công ty]", sampleValue: "Enterprise ATS Tech Corp", description: "Tên thương hiệu doanh nghiệp" },
  { key: "[Giờ phỏng vấn]", label: "[Giờ phỏng vấn]", sampleValue: "09:30 - Thứ Năm, 15/10/2026", description: "Thời gian lịch hẹn phỏng vấn" },
  { key: "[Địa điểm / Link họp]", label: "[Địa điểm / Link họp]", sampleValue: "Phòng họp 402, Tòa nhà Tech Hub (Hoặc Google Meet: meet.google.com/abc-xyz)", description: "Địa điểm hoặc liên kết họp online" },
  { key: "[Người phỏng vấn]", label: "[Người phỏng vấn]", sampleValue: "Vũ Hải Đăng (CTO) & Trần Thị Bích (HR Director)", description: "Thành viên ban phỏng vấn" },
  { key: "[Mức lương Offer]", label: "[Mức lương Offer]", sampleValue: "45,000,000 VNĐ / tháng", description: "Mức lương phê duyệt trong thư mời" },
  { key: "[Hạn phản hồi Offer]", label: "[Hạn phản hồi Offer]", sampleValue: "17:00 ngày 20/10/2026", description: "Hạn chót ứng viên xác nhận nhận việc" },
  { key: "[Portal Link]", label: "[Portal Link]", sampleValue: "https://careers.company.com/portal/my-application", description: "Đường dẫn tra cứu kết quả ứng tuyển" },
];

// editor placeholder <-> variable used by the e-mail engine ({candidate_name}, ...)
const VAR_MAP: Array<[string, string]> = [
  ["[Tên ứng viên]", "{candidate_name}"], ["[Tên vị trí]", "{job_title}"], ["[Tên công ty]", "{company_name}"],
  ["[Giờ phỏng vấn]", "{interview_time}"], ["[Địa điểm / Link họp]", "{interview_location}"], ["[Người phỏng vấn]", "{interviewer_name}"],
  ["[Mức lương Offer]", "{offer_salary}"], ["[Hạn phản hồi Offer]", "{offer_deadline}"], ["[Portal Link]", "{portal_link}"],
];
const TEMPLATE_META: Record<string, { category: EmailTemplateItem["category"]; trigger: string }> = {
  CONFIRM_APPLICATION: { category: "Thư cảm ơn", trigger: "Gửi ngay khi ứng viên nộp hồ sơ thành công" },
  THANK_INTERVIEW: { category: "Thư cảm ơn", trigger: "Gửi sau buổi phỏng vấn (thủ công hoặc hàng loạt)" },
  INVITE_INTERVIEW: { category: "Mời phỏng vấn", trigger: "Gửi khi đặt / dời lịch phỏng vấn" },
  INTERVIEW_CANCELLED: { category: "Mời phỏng vấn", trigger: "Gửi khi hủy lịch phỏng vấn" },
  OFFER_LETTER: { category: "Thư Offer", trigger: "Gửi khi recruiter phát hành offer đã được duyệt" },
  REJECT_CANDIDATE: { category: "Thư từ chối", trigger: "Gửi khi loại ứng viên (thủ công hoặc hàng loạt)" },
  REQ_APPROVED: { category: "Onboarding", trigger: "Gửi khi tờ trình tuyển dụng được phê duyệt" },
};
const CATEGORIES: EmailTemplateItem["category"][] = ["Thư cảm ơn", "Mời phỏng vấn", "Thư Offer", "Thư từ chối", "Onboarding"];

/** Stored HTML -> editable text with [placeholders]; and back (escaped, paragraphs). */
function toEditor(html: string): string {
  let text = html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>\s*/gi, "\n\n").replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
  VAR_MAP.forEach(([ui, api]) => { text = text.split(api).join(ui); });
  return text.replace(/\n{3,}/g, "\n\n").trim();
}
function toStored(text: string, html: boolean): string {
  let out = text;
  if (html) {
    out = out.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    out = out.split(/\n{2,}/).map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`).join("");
  }
  VAR_MAP.forEach(([ui, api]) => { out = out.split(ui).join(api); });
  return out;
}

interface ApiTemplate { id: number; code: string; name: string; category: string; subject: string; body_html: string; is_auto_send: boolean; is_active: boolean; updated_at?: string | null }

function toItem(t: ApiTemplate): EmailTemplateItem {
  const meta = TEMPLATE_META[t.code];
  return {
    id: String(t.id),
    code: t.code,
    name: t.name,
    category: meta?.category || (CATEGORIES.find((c) => c === t.category) ?? "Onboarding"),
    subject: toEditor(t.subject),
    body: toEditor(t.body_html),
    isAutoSend: t.is_auto_send,
    triggerEvent: meta?.trigger || "Gửi thủ công từ hồ sơ ứng viên",
    updatedAt: t.updated_at ? new Date(t.updated_at).toLocaleDateString("vi-VN") : "",
  };
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function HREmailTemplatesPage() {
  const { data: rows, error, loading, reload, setData } = useApiData(() => apiRequest<ApiTemplate[]>("/email-automation/templates"), []);
  const templates: EmailTemplateItem[] = useMemo(() => (rows || []).map(toItem), [rows]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Editor Mode: 'edit' or 'preview'
  const [editorViewMode, setEditorViewMode] = useState<"edit" | "preview">("edit");

  // Selected Template Active State in Editor
  const activeTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId) || templates[0];
  }, [templates, selectedTemplateId]);
  // the editor follows the active template until the user starts typing
  const [draft, setDraft] = useState<{ id: string; subject: string; body: string } | null>(null);

  // Form State for active editing
  const editing = draft && draft.id === activeTemplate?.id ? draft : null;
  const editSubject = editing ? editing.subject : activeTemplate?.subject || "";
  const editBody = editing ? editing.body : activeTemplate?.body || "";
  const setEditSubject = (v: string) => setDraft({ id: activeTemplate?.id || "", subject: v, body: editBody });
  const setEditBody = (v: string | ((prev: string) => string)) =>
    setDraft({ id: activeTemplate?.id || "", subject: editSubject, body: typeof v === "function" ? v(editBody) : v });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Synchronize when switching template
  const handleSelectTemplate = (tpl: EmailTemplateItem) => {
    setSelectedTemplateId(tpl.id);
    setDraft(null);
  };

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Toggle Auto-send trigger
  const handleToggleAutoSend = async (id: string) => {
    const current = rows?.find((t) => String(t.id) === id);
    if (!current) return;
    try {
      const updated = await apiRequest<ApiTemplate>(`/email-automation/templates/${id}`, { method: "PUT", body: JSON.stringify({ is_auto_send: !current.is_auto_send }) });
      setData((prev) => (prev || []).map((t) => (t.id === updated.id ? updated : t)));
      showToast("Đã cập nhật trạng thái tự động gửi!");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Không cập nhật được mẫu email.", "error");
    }
  };

  // Insert Variable at Cursor or End of textarea
  const handleInsertVariable = (varKey: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setEditBody((prev) => prev + " " + varKey);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = editBody;

    const newText = currentText.substring(0, start) + varKey + currentText.substring(end);
    setEditBody(newText);

    // Restore focus and cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + varKey.length, start + varKey.length);
    }, 50);

    showToast(`Đã chèn biến "${varKey}" vào nội dung thư!`);
  };

  // HTML5 Drag variable into textarea
  const handleDragStartVariable = (e: React.DragEvent, varKey: string) => {
    e.dataTransfer.setData("text/plain", varKey);
  };

  // Save changes to active template
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTemplate) return;
    try {
      const updated = await apiRequest<ApiTemplate>(`/email-automation/templates/${activeTemplate.id}`, {
        method: "PUT", body: JSON.stringify({ subject: toStored(editSubject, false), body_html: toStored(editBody, true) }),
      });
      setData((prev) => (prev || []).map((t) => (t.id === updated.id ? updated : t)));
      setDraft(null);
      showToast(`Đã lưu thay đổi cho mẫu "${activeTemplate.name}"!`, "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Không lưu được mẫu email.", "error");
    }
  };

  // Dynamic Real-time Preview Renderer
  const dynamicPreviewContent = useMemo(() => {
    let resultSubject = editSubject;
    let resultBody = editBody;

    AVAILABLE_VARIABLES.forEach((v) => {
      resultSubject = resultSubject.split(v.key).join(v.sampleValue);
      resultBody = resultBody.split(v.key).join(v.sampleValue);
    });

    return { subject: resultSubject, body: resultBody };
  }, [editSubject, editBody]);

  // Filtered templates list
  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return templates.filter((t) => {
      const matchSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q);
      const matchCat =
        activeCategoryFilter === "all" || t.category === activeCategoryFilter;
      return matchSearch && matchCat;
    });
  }, [templates, searchQuery, activeCategoryFilter]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="w-full space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Container Card: bg-white rounded-2xl shadow-sm border border-slate-100 */}
      <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-6">
        {/* Header Tiêu đề phân hệ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-extrabold text-[10px] tracking-wider uppercase border border-purple-100">
                Email Automation Engine
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Cá nhân hóa biến nội suy tự động
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 mt-1 tracking-tight">
              Cấu Hình Mẫu Email Tự Động
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Thiết lập các kịch bản gửi thư tự động (Thư cảm ơn, Lời mời phỏng vấn, Thư Offer) kèm công cụ kéo thả biến nội suy thông minh.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                showToast("Đã gửi email thử nghiệm thành công tới hộp thư HR!");
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md shadow-slate-900/15 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4 text-emerald-400" />
              <span>Gửi thử nghiệm (Test)</span>
            </button>
          </div>
        </div>

        {/* 2 CỘT: CỘT TRÁI CHỌN TEMPLATE & CỘT PHẢI SOẠN THẢO VỚI BIẾN NỘI SUY */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI (4 COLUMNS): DANH SÁCH TEMPLATES */}
          <div className="lg:col-span-4 bg-slate-50/70 border border-slate-200 rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                Mẫu Thư Tuyển Dụng ({templates.length})
              </span>
            </div>

            {/* Tìm kiếm */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mẫu thư, mã code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
              />
            </div>

            {/* Filter danh mục */}
            <div className="flex flex-wrap gap-1">
              {["all", "Thư cảm ơn", "Mời phỏng vấn", "Thư Offer", "Thư từ chối"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategoryFilter(cat)}
                  className={`text-[10px] px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    activeCategoryFilter === cat
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {cat === "all" ? "Tất cả" : cat}
                </button>
              ))}
            </div>

            {/* Danh sách Templates */}
            <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
              {filteredTemplates.map((tpl) => {
                const isSelected = tpl.id === selectedTemplateId;

                return (
                  <div
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 ring-2 ring-blue-500/20"
                        : "bg-white border-slate-200 text-slate-800 hover:border-blue-300 hover:bg-blue-50/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-extrabold text-xs tracking-tight leading-snug">
                        {tpl.name}
                      </div>
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase shrink-0 ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {tpl.category}
                      </span>
                    </div>

                    <div
                      className={`text-[11px] font-mono mt-1 line-clamp-1 ${
                        isSelected ? "text-blue-100" : "text-slate-500"
                      }`}
                    >
                      Tiêu đề: {tpl.subject}
                    </div>

                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-200/40 text-[10px]">
                      <span className={isSelected ? "text-blue-100" : "text-slate-400"}>
                        {tpl.code}
                      </span>

                      {/* Auto send toggle */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleAutoSend(tpl.id);
                        }}
                        className="flex items-center gap-1 cursor-pointer"
                        title="Bật/Tắt gửi tự động theo luồng sự kiện"
                      >
                        <span
                          className={`font-bold ${
                            isSelected ? "text-white" : tpl.isAutoSend ? "text-emerald-600" : "text-slate-400"
                          }`}
                        >
                          {tpl.isAutoSend ? "Tự động gửi" : "Gửi thủ công"}
                        </span>
                        {tpl.isAutoSend ? (
                          <ToggleRight className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 opacity-50" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CỘT PHẢI (8 COLUMNS): TRÌNH SOẠN THẢO VÀ THANH CÔNG CỤ BIẾN NỘI SUY */}
          <div className="lg:col-span-8 space-y-4">
            {/* Header Cột phải: Toggle Soạn thảo / Xem trước */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  {activeTemplate.code}
                </span>
                <h2 className="text-sm font-black text-slate-900 mt-1">
                  {activeTemplate.name}
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Sự kiện kích hoạt: {activeTemplate.triggerEvent}
                </p>
              </div>

              {/* Chế độ xem */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setEditorViewMode("edit")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    editorViewMode === "edit"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Soạn thảo & Chèn biến</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditorViewMode("preview")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    editorViewMode === "preview"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem trước thực tế (Preview)</span>
                </button>
              </div>
            </div>

            {/* THANH CÔNG CỤ CÁC BIẾN NỘI SUY (INTERPOLATION VARIABLES CHIPS) */}
            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-indigo-900 flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-indigo-600" />
                  Biến nội suy tự động (Click để chèn vào văn bản hoặc kéo thả):
                </span>
                <span className="text-[10px] text-indigo-600 font-bold">
                  {AVAILABLE_VARIABLES.length} biến khả dụng
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {AVAILABLE_VARIABLES.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    draggable={true}
                    onDragStart={(e) => handleDragStartVariable(e, v.key)}
                    onClick={() => handleInsertVariable(v.key)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 text-indigo-700 font-mono text-xs font-extrabold shadow-2xs transition-all cursor-pointer group"
                    title={`${v.description} (Ví dụ: "${v.sampleValue}")`}
                  >
                    <span>{v.label}</span>
                    <Plus className="w-3 h-3 text-indigo-400 group-hover:text-indigo-600" />
                  </button>
                ))}
              </div>
            </div>

            {/* CHẾ ĐỘ 1: FORM SOẠN THẢO (EDITOR) */}
            {editorViewMode === "edit" ? (
              <form onSubmit={handleSaveTemplate} className="space-y-4">
                {/* Subject Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tiêu đề Email (Subject Line) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-bold text-slate-800"
                  />
                </div>

                {/* Body Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Nội dung Email (Body) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Bấm vào các biến màu tím ở trên để tự động chèn vào con trỏ
                    </span>
                  </div>
                  <textarea
                    ref={textareaRef}
                    rows={15}
                    required
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    className="w-full px-4 py-3 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-mono leading-relaxed text-slate-800"
                  />
                </div>

                {/* Footer buttons */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditSubject(activeTemplate.subject);
                      setEditBody(activeTemplate.body);
                      showToast("Đã hoàn tác nội dung chưa lưu!");
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Khôi phục ban đầu</span>
                  </button>

                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Lưu mẫu thư tuyển dụng</span>
                  </button>
                </div>
              </form>
            ) : (
              /* CHẾ ĐỘ 2: XEM TRƯỚC THỰC TẾ VỚI DỮ LIỆU NỘI SUY (LIVE PREVIEW) */
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                <div className="p-4 bg-slate-100/80 border-b border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-500 w-16">Người nhận:</span>
                    <span className="font-bold text-slate-800">
                      Nguyễn Văn Tuấn &lt;tuan.nguyen@example.com&gt;
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-500 w-16">Tiêu đề:</span>
                    <span className="font-extrabold text-blue-900 text-xs">
                      {dynamicPreviewContent.subject}
                    </span>
                  </div>
                </div>

                <div className="p-6 bg-white font-sans text-xs text-slate-800 whitespace-pre-wrap leading-relaxed min-h-[350px]">
                  {dynamicPreviewContent.body}
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-400">
                  Đây là giao diện thực tế mà ứng viên sẽ nhận được trong hòm thư cá nhân.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
