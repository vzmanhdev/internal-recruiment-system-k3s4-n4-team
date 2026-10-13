"use client";

import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Search,
  Filter,
  Star,
  Mail,
  Send,
  Phone,
  Tag,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Users,
  Eye,
  Plus,
  ShieldAlert,
  ChevronRight,
  X,
  Check,
  Building2,
  Calendar,
  Layers,
  FileText,
  ThumbsUp,
  Download,
} from "lucide-react";

// =============================================================================
// TYPES & DATA STRUCTURES
// =============================================================================

export interface TalentCandidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: "Công Nghệ & Kỹ Thuật" | "Dữ Liệu & AI" | "Sản Phẩm & Thiết Kế" | "Kinh Doanh & Marketing" | "Nhân Sự & Vận Hành";
  appliedPosition: string;
  finalRoundStopped: string; // Vòng dừng chân (VD: Rớt Final Round với CTO / BOD)
  ratingStars: number; // 1 to 5 sao (Đánh dấu sao ứng viên tiềm năng)
  skills: string[];
  rejectionReason: string; // Lý do chưa nhận lúc đó (VD: Thừa năng lực, Ngân sách năm nay ưu tiên onsite)
  talentNote: string; // Nhận xét lưu lại cho tương lai
  isSilverMedalist: boolean; // Á quân vòng cuối
  lastContactDate: string;
  isBlacklisted: boolean;
}

// =============================================================================
// INITIAL MOCK DATA
// =============================================================================

const INITIAL_TALENTS: TalentCandidate[] = [
  {
    id: "TP-001",
    name: "Phạm Minh Hoàng",
    email: "hoang.pham@gmail.com",
    phone: "0908 123 456",
    category: "Công Nghệ & Kỹ Thuật",
    appliedPosition: "Senior Backend Engineer (Python/Go)",
    finalRoundStopped: "Vòng 3: System Design & CTO Interview",
    ratingStars: 5,
    skills: ["Python", "Go", "Kubernetes", "PostgreSQL", "Kafka"],
    rejectionReason: "Chuyên môn rất xuất sắc, điểm phỏng vấn 4.8/5. Nhưng đợt tuyển Q3 công ty cần người vào việc ngay trong 1 tuần, ứng viên cần notice period 2 tháng.",
    talentNote: "Ưu tiên số 1 khi có đợt tuyển Backend/Tech Lead mới. Phong thái điềm đạm, tư duy kiến trúc phân tán rất sâu.",
    isSilverMedalist: true,
    lastContactDate: "15/09/2026",
    isBlacklisted: false,
  },
  {
    id: "TP-002",
    name: "Trần Mai Phương",
    email: "phuong.tran@outlook.com",
    phone: "0912 345 678",
    category: "Sản Phẩm & Thiết Kế",
    appliedPosition: "Senior UI/UX Designer",
    finalRoundStopped: "Vòng 2: Portfolio Challenge & Design Lead",
    ratingStars: 5,
    skills: ["Figma", "Design Systems", "User Research", "Prototyping"],
    rejectionReason: "Rớt vòng cuối do ứng viên thiên hướng B2C Marketplace trong khi dự án đợt này cần chuyên gia B2B ERP.",
    talentNote: "Portfolio cực kỳ thẩm mỹ, tư duy Micro-interactions tinh tế. Mời ngay khi mở dự án Mobile App khách hàng mới.",
    isSilverMedalist: true,
    lastContactDate: "20/09/2026",
    isBlacklisted: false,
  },
  {
    id: "TP-003",
    name: "Đặng Quốc Bảo",
    email: "bao.dang@yahoo.com",
    phone: "0933 888 999",
    category: "Công Nghệ & Kỹ Thuật",
    appliedPosition: "Senior Frontend Engineer (React/Next.js)",
    finalRoundStopped: "Vòng 3: Final Culture Fit với BOD",
    ratingStars: 4,
    skills: ["Next.js", "TypeScript", "Tailwind CSS", "Web Performance", "Redux"],
    rejectionReason: "Kỹ năng chuyên môn đạt 85%, nhưng mức lương kỳ vọng thời điểm đó vượt dải lương trần phê duyệt 3 triệu.",
    talentNote: "Ứng viên rất thiện chí, hẹn kết nối lại vào đợt review ngân sách năm 2027.",
    isSilverMedalist: true,
    lastContactDate: "02/10/2026",
    isBlacklisted: false,
  },
  {
    id: "TP-004",
    name: "Lê Thị Thảo Trang",
    email: "trang.le@gmail.com",
    phone: "0987 654 321",
    category: "Dữ Liệu & AI",
    appliedPosition: "Senior Data Scientist (LLM & GenAI)",
    finalRoundStopped: "Vòng 3: Case Study & AI Director",
    ratingStars: 5,
    skills: ["Python", "PyTorch", "LangChain", "RAG Pipeline", "Vector DB"],
    rejectionReason: "Dự án AI tạm hoãn 1 quý để chờ duyệt ngân sách GPU Cloud.",
    talentNote: "Hồ sơ R&D cực mạnh, có công bố nghiên cứu quốc tế. Cần giữ liên lạc thường xuyên qua LinkedIn.",
    isSilverMedalist: true,
    lastContactDate: "28/09/2026",
    isBlacklisted: false,
  },
  {
    id: "TP-005",
    name: "Nguyễn Hải Đăng",
    email: "dang.nguyen@company.com",
    phone: "0944 111 222",
    category: "Kinh Doanh & Marketing",
    appliedPosition: "B2B Enterprise Sales Manager",
    finalRoundStopped: "Vòng 2: Thuyết trình Kế hoạch Doanh thu với CCO",
    ratingStars: 4,
    skills: ["B2B SaaS", "Solution Selling", "Key Account", "Negotiation"],
    rejectionReason: "Kinh nghiệm phong phú nhưng mạng lưới quan hệ khách hàng chủ yếu mảng Bán lẻ thay vì Tài chính Ngân hàng.",
    talentNote: "Khả năng đàm phán thuyết phục, phong thái chuyên nghiệp. Giữ cho khối Bán lẻ quý sau.",
    isSilverMedalist: true,
    lastContactDate: "05/10/2026",
    isBlacklisted: false,
  },
  {
    id: "TP-006",
    name: "Vũ Đình Cường",
    email: "cuong.vu@gmail.com",
    phone: "0966 333 444",
    category: "Công Nghệ & Kỹ Thuật",
    appliedPosition: "DevOps & Cloud Engineer",
    finalRoundStopped: "Vòng 1: Kỹ thuật",
    ratingStars: 2,
    skills: ["Linux", "Bash", "Docker"],
    rejectionReason: "Khai man kinh nghiệm thực tế về AWS và Terraform.",
    talentNote: "Cảnh báo Blacklist: Không mời lại vào các vị trí phụ trách Production quan trọng.",
    isSilverMedalist: false,
    lastContactDate: "10/08/2026",
    isBlacklisted: true,
  },
];

const EMAIL_CAMPAIGN_TEMPLATES = [
  {
    id: "tpl-1",
    title: "Thư mời mở lại cơ hội công việc mới tương đương",
    subject: "Cơ hội nghề nghiệp mới phù hợp tại [Tên công ty] dành cho [Tên ứng viên]",
    content: "Chào [Tên ứng viên],\n\nTrước đây, chúng tôi rất ấn tượng với năng lực và phần thể hiện của bạn trong buổi phỏng vấn vị trí [Vị trí từng ứng tuyển].\n\nHiện tại, công ty vừa mở tuyển vị trí mới rất phù hợp với định hướng phát triển của bạn. Chúng tôi muốn ưu tiên mời bạn tham gia trao đổi trực tiếp mà không cần làm lại các bài test đầu vào.\n\nNếu bạn quan tâm, hãy phản hồi lại email này để HR sắp xếp lịch hẹn thuận tiện nhất nhé!\n\nTrân trọng,\nPhòng Tuyển Dụng Nhân Tài [Tên công ty]",
  },
  {
    id: "tpl-2",
    title: "Khảo sát duy trì kết nối mạng lưới nhân tài (Talent Keep-in-Touch)",
    subject: "Giữ liên lạc cùng Đội ngũ Công nghệ [Tên công ty] - Gửi [Tên ứng viên]",
    content: "Chào [Tên ứng viên],\n\nĐã một khoảng thời gian kể từ lần trao đổi gần nhất giữa bạn và [Tên công ty]. Chúng tôi hy vọng công việc và các dự án của bạn vẫn đang phát triển thuận lợi.\n\nCông ty sắp khởi động nhiều dự án công nghệ đột phá trong quý tới. Chúng tôi rất muốn cập nhật thêm về tình trạng công việc hiện tại của bạn để kịp thời chia sẻ những cơ hội phù hợp nhất.\n\nChúc bạn một tuần làm việc hiệu quả!\n\nHR Team",
  },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function HRTalentPoolPage() {
  const [talents, setTalents] = useState<TalentCandidate[]>(INITIAL_TALENTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRating, setSelectedRating] = useState("all");
  const [onlySilverMedalists, setOnlySilverMedalists] = useState(false);

  // Batch Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal: Chi tiết ứng viên
  const [viewingCandidate, setViewingCandidate] = useState<TalentCandidate | null>(null);

  // Modal: Gửi Email Hàng Loạt (Bulk Email Campaign)
  const [isBulkEmailModalOpen, setIsBulkEmailModalOpen] = useState(false);
  const [selectedCampaignTemplate, setSelectedCampaignTemplate] = useState(EMAIL_CAMPAIGN_TEMPLATES[0].id);
  const [campaignSubject, setCampaignSubject] = useState(EMAIL_CAMPAIGN_TEMPLATES[0].subject);
  const [campaignBody, setCampaignBody] = useState(EMAIL_CAMPAIGN_TEMPLATES[0].content);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Toggle star rating
  const handleToggleStar = (candidateId: string, currentStars: number) => {
    const nextStars = currentStars >= 5 ? 3 : currentStars + 1;
    setTalents((prev) =>
      prev.map((t) => (t.id === candidateId ? { ...t, ratingStars: nextStars } : t))
    );
    showToast(`Đã cập nhật đánh giá ${nextStars} sao cho ứng viên!`, "success");
  };

  // Toggle select candidate
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select all filtered
  const handleSelectAll = () => {
    if (selectedIds.length === filteredTalents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTalents.map((t) => t.id));
    }
  };

  // Filtered Talents
  const filteredTalents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return talents.filter((t) => {
      const matchSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.appliedPosition.toLowerCase().includes(q) ||
        t.skills.some((s) => s.toLowerCase().includes(q));

      const matchCategory = selectedCategory === "all" || t.category === selectedCategory;
      const matchRating =
        selectedRating === "all" || String(t.ratingStars) === selectedRating;
      const matchSilver = !onlySilverMedalists || t.isSilverMedalist;

      return matchSearch && matchCategory && matchRating && matchSilver;
    });
  }, [talents, searchQuery, selectedCategory, selectedRating, onlySilverMedalists]);

  // Handle Send Bulk Email
  const handleSendBulkEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      showToast("Vui lòng chọn ít nhất 1 ứng viên để gửi email!", "error");
      return;
    }

    showToast(
      `Đã phát chiến dịch gửi email mời tuyển dụng tới ${selectedIds.length} ứng viên tiềm năng!`,
      "success"
    );
    setIsBulkEmailModalOpen(false);
    setSelectedIds([]);
  };

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
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
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
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-extrabold text-[10px] tracking-wider uppercase border border-amber-200">
                Talent Pool & Silver Medalists
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Ứng viên rớt vòng cuối chất lượng cao
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 mt-1 tracking-tight">
              Kho Ứng Viên Tiềm Năng (Talent Pool)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Lưu trữ danh sách ứng viên đạt điểm cao nhưng lỡ cơ hội ở vòng cuối (Silver Medalists). Gửi email kích hoạt lại khi có Job tuyển dụng mới.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            {/* Nút Gửi Email Hàng Loạt */}
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={() => {
                setIsBulkEmailModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>Gửi email hàng loạt ({selectedIds.length})</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo tên, email, kỹ năng (Python, Figma, AI...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
              />
            </div>

            {/* Filter Ngành nghề */}
            <div className="flex items-center gap-1.5">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 focus:outline-hidden"
              >
                <option value="all">Tất cả ngành nghề</option>
                <option value="Công Nghệ & Kỹ Thuật">Công Nghệ & Kỹ Thuật</option>
                <option value="Dữ Liệu & AI">Dữ Liệu & AI</option>
                <option value="Sản Phẩm & Thiết Kế">Sản Phẩm & Thiết Kế</option>
                <option value="Kinh Doanh & Marketing">Kinh Doanh & Marketing</option>
                <option value="Nhân Sự & Vận Hành">Nhân Sự & Vận Hành</option>
              </select>
            </div>

            {/* Filter Đánh giá Sao */}
            <div className="flex items-center gap-1.5">
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 focus:outline-hidden"
              >
                <option value="all">Tất cả mức Sao ⭐</option>
                <option value="5">⭐⭐⭐⭐⭐ (5 sao)</option>
                <option value="4">⭐⭐⭐⭐ (4 sao)</option>
                <option value="3">⭐⭐⭐ (3 sao)</option>
              </select>
            </div>

            {/* Checkbox Chỉ lọc Á quân Silver Medalist */}
            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 select-none">
              <input
                type="checkbox"
                checked={onlySilverMedalists}
                onChange={(e) => setOnlySilverMedalists(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span className="flex items-center gap-1">
                🥈 Chỉ Á quân rớt vòng cuối
              </span>
            </label>
          </div>

          <div className="text-xs text-slate-500 font-bold flex items-center gap-2">
            <span>
              Tìm thấy <strong className="text-slate-900">{filteredTalents.length}</strong> ứng viên
            </span>
            <span>•</span>
            <span>
              Đã chọn: <strong className="text-blue-700">{selectedIds.length}</strong> người
            </span>
          </div>
        </div>

        {/* Talent Pool Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredTalents.length > 0 &&
                        selectedIds.length === filteredTalents.length
                      }
                      onChange={handleSelectAll}
                      className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-3">Ứng viên tiềm năng</th>
                  <th className="py-3.5 px-3">Ngành nghề & Kỹ năng</th>
                  <th className="py-3.5 px-3 text-center">Đánh giá Sao</th>
                  <th className="py-3.5 px-4">Vòng dừng chân & Lý do lưu trữ</th>
                  <th className="py-3.5 px-3 text-center">Ngày tương tác</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-medium">
                {filteredTalents.map((c) => {
                  const isChecked = selectedIds.includes(c.id);

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-blue-50/20 transition-colors ${
                        isChecked ? "bg-blue-50/30" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(c.id)}
                          className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                        />
                      </td>

                      {/* Candidate info */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                              <span>{c.name}</span>
                              {c.isSilverMedalist && (
                                <span className="text-[10px]" title="Silver Medalist">
                                  🥈
                                </span>
                              )}
                              {c.isBlacklisted && (
                                <span className="px-1.5 py-0.2 bg-rose-50 text-rose-700 text-[9px] rounded font-bold border border-rose-200">
                                  Cảnh báo
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {c.email} • {c.phone}
                            </div>
                            <div className="text-[10px] text-blue-600 font-semibold mt-0.5">
                              Vị trí từng nộp: {c.appliedPosition}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category & Skills */}
                      <td className="py-3.5 px-3">
                        <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 mb-1.5">
                          {c.category}
                        </span>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {c.skills.slice(0, 4).map((s, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-1.5 py-0.2 bg-blue-50 text-blue-700 rounded font-medium border border-blue-100"
                            >
                              {s}
                            </span>
                          ))}
                          {c.skills.length > 4 && (
                            <span className="text-[10px] text-slate-400 font-bold">
                              +{c.skills.length - 4}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Star Rating Button */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStar(c.id, c.ratingStars)}
                          className="inline-flex items-center gap-0.5 p-1 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer"
                          title="Bấm để đổi số sao"
                        >
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= c.ratingStars
                                  ? "fill-amber-400 text-amber-500"
                                  : "text-slate-200"
                              }`}
                            />
                          ))}
                        </button>
                      </td>

                      {/* Final round stopped & Reason */}
                      <td className="py-3.5 px-4">
                        <div className="text-[11px] font-bold text-slate-800">
                          {c.finalRoundStopped}
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                          {c.talentNote}
                        </p>
                      </td>

                      {/* Last contact date */}
                      <td className="py-3.5 px-3 text-center text-slate-500 text-[11px] font-mono">
                        {c.lastContactDate}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingCandidate(c)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Xem chi tiết nhận xét & lý do dừng"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedIds([c.id]);
                              setIsBulkEmailModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Gửi email mời tái phỏng vấn"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* MODAL 1: GỬI EMAIL HÀNG LOẠT (BULK EMAIL CAMPAIGN MODAL) */}
      {/* =================================================================== */}
      {isBulkEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Send className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Talent Outreach Campaign
                    </span>
                    <span className="text-xs text-slate-400">
                      Gửi đến {selectedIds.length} ứng viên đã chọn
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold tracking-tight mt-0.5">
                    Gửi Email Chiến Dịch Mời Tái Ứng Tuyển
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBulkEmailModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendBulkEmail} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chọn mẫu thư chiến dịch
                </label>
                <select
                  value={selectedCampaignTemplate}
                  onChange={(e) => {
                    setSelectedCampaignTemplate(e.target.value);
                    const tpl = EMAIL_CAMPAIGN_TEMPLATES.find((t) => t.id === e.target.value);
                    if (tpl) {
                      setCampaignSubject(tpl.subject);
                      setCampaignBody(tpl.content);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-bold"
                >
                  {EMAIL_CAMPAIGN_TEMPLATES.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiêu đề email (Subject) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={campaignSubject}
                  onChange={(e) => setCampaignSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Nội dung email <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Tự động nội suy biến: [Tên ứng viên], [Vị trí từng ứng tuyển]
                  </span>
                </div>
                <textarea
                  rows={8}
                  required
                  value={campaignBody}
                  onChange={(e) => setCampaignBody(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden font-mono leading-relaxed"
                />
              </div>

              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs text-amber-900 leading-relaxed">
                Hệ thống sẽ gửi cá nhân hóa theo luồng hàng đợi (Queue), bảo đảm tỷ lệ vào Inbox cao và không bị đánh dấu Spam.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkEmailModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Xác nhận gửi {selectedIds.length} email</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: XEM CHI TIẾT ỨNG VIÊN TIỀM NĂNG */}
      {/* =================================================================== */}
      {viewingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Hồ Sơ Á Quân (Silver Medalist)
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  {viewingCandidate.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {viewingCandidate.appliedPosition}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingCandidate(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-slate-700 block">Vòng dừng chân:</span>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800">
                  {viewingCandidate.finalRoundStopped}
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-700 block">Lý do chưa nhận đợt trước:</span>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {viewingCandidate.rejectionReason}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-700 block">Nhận xét của HR & Hội đồng phỏng vấn:</span>
                <p className="text-slate-800 font-medium leading-relaxed bg-blue-50/60 p-2.5 rounded-xl border border-blue-100">
                  {viewingCandidate.talentNote}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-700 block">Kỹ năng chuyên môn nổi bật:</span>
                <div className="flex flex-wrap gap-1.5">
                  {viewingCandidate.skills.map((s, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setViewingCandidate(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
