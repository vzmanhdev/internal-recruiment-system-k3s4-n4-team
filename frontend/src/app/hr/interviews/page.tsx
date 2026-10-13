'use client';

import React, { useState } from 'react';
import { 
  Calendar, Clock, Users, Video, MapPin, CheckCircle2, XCircle, 
  Plus, Search, Filter, AlertCircle, Eye, UserCheck, Sparkles, X, Check
} from 'lucide-react';

// =============================================================================
// TYPES & MOCK DATA
// =============================================================================

export interface InterviewSchedule {
  id: string;
  code: string;
  candidate_name: string;
  position: string;
  datetime: string;
  type: 'online' | 'offline';
  location_or_link: string;
  interviewers: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
  evaluation_submitted: number;
}

export interface InterviewFormData {
  candidateName: string;
  position: string;
  interviewDate: string;
  startTime: string;
  endTime: string;
  type: 'online' | 'offline';
  locationOrLink: string;
  interviewers: string[];
  notes?: string;
}

const CANDIDATE_OPTIONS = [
  { name: "Nguyễn Thu Thủy", position: "Senior Backend Engineer" },
  { name: "Trần Minh Quang", position: "Trưởng nhóm Data Analyst" },
  { name: "Phạm Minh Hoàng", position: "Senior Backend Engineer (Python/Go)" },
  { name: "Trần Mai Phương", position: "Senior UI/UX Designer" },
  { name: "Đặng Quốc Bảo", position: "Senior Frontend Engineer (React/Next.js)" },
  { name: "Lê Thị Thảo Trang", position: "Senior Data Scientist (LLM & GenAI)" },
  { name: "Vũ Đình Cường", position: "DevOps & Cloud Engineer" },
];

const POSITION_OPTIONS = [
  "Senior Backend Engineer",
  "Trưởng nhóm Data Analyst",
  "Senior Backend Engineer (Python/Go)",
  "Senior UI/UX Designer",
  "Senior Frontend Engineer (React/Next.js)",
  "Senior Data Scientist (LLM & GenAI)",
  "DevOps & Cloud Engineer",
  "Product Manager (Enterprise Solutions)",
];

const EVALUATOR_OPTIONS = [
  "Lê Văn Mạnh (Tech Lead)",
  "Trần Thị Thu Hà (HR Manager)",
  "Phạm Quốc Tuấn (Solution Architect)",
  "Vũ Hải Đăng (CTO)",
  "Bùi Quốc Đạt (CCO)",
  "Đỗ Hoàng Long (Lead QA/QC)",
];

// =============================================================================
// COMPONENT MODAL TẠO LỊCH PHỎNG VẤN (INLINE TRONG FILE ĐẢM BẢO HOẠT ĐỘNG 100%)
// =============================================================================

export interface CreateInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InterviewFormData) => void;
}

export function CreateInterviewModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateInterviewModalProps) {
  const [candidateName, setCandidateName] = useState(CANDIDATE_OPTIONS[0].name);
  const [position, setPosition] = useState(CANDIDATE_OPTIONS[0].position);
  const [interviewDate, setInterviewDate] = useState("2026-10-15");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [interviewType, setInterviewType] = useState<"online" | "offline">("online");
  const [locationOrLink, setLocationOrLink] = useState("https://meet.google.com/abc-xyz-123");
  const [selectedInterviewers, setSelectedInterviewers] = useState<string[]>([
    EVALUATOR_OPTIONS[0],
    EVALUATOR_OPTIONS[1],
  ]);
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleCandidateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    setCandidateName(selectedName);
    const matched = CANDIDATE_OPTIONS.find((c) => c.name === selectedName);
    if (matched) {
      setPosition(matched.position);
    }
  };

  const handleToggleInterviewer = (interviewer: string) => {
    if (selectedInterviewers.includes(interviewer)) {
      if (selectedInterviewers.length === 1) {
        setErrorMsg("Phải chọn ít nhất 1 người trong hội đồng phỏng vấn!");
        return;
      }
      setSelectedInterviewers((prev) => prev.filter((i) => i !== interviewer));
      setErrorMsg("");
    } else {
      setSelectedInterviewers((prev) => [...prev, interviewer]);
      setErrorMsg("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim()) {
      setErrorMsg("Vui lòng chọn hoặc nhập tên ứng viên!");
      return;
    }
    if (!locationOrLink.trim()) {
      setErrorMsg(
        interviewType === "online"
          ? "Vui lòng nhập đường dẫn Link Meet / Zoom!"
          : "Vui lòng nhập phòng họp hoặc địa điểm phỏng vấn!"
      );
      return;
    }
    if (selectedInterviewers.length === 0) {
      setErrorMsg("Vui lòng chọn ít nhất 1 thành viên hội đồng phỏng vấn!");
      return;
    }

    onSubmit({
      candidateName,
      position,
      interviewDate,
      startTime,
      endTime,
      type: interviewType,
      locationOrLink: locationOrLink.trim(),
      interviewers: selectedInterviewers,
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    // 1. Cấu trúc Modal (Modal Wrapper): Overlay mờ toàn màn hình + z-[9999] cực cao
    <div 
      className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      {/* Khối form chính: bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 relative */}
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 relative my-8 border border-slate-200 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Tiêu đề "Tạo Lịch Phỏng Vấn Mới" (text-lg font-bold) và nút X (Close) */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Tạo Lịch Phỏng Vấn Mới
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Thiết lập thời gian, địa điểm và hội đồng đánh giá cho ứng viên
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thông báo lỗi nếu có */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 2. Form Fields: Lưới grid grid-cols-2 gap-4 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* TRƯỜNG 1 & 2: ỨNG VIÊN & VỊ TRÍ (col-span-2) */}
            <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chọn Ứng viên <span className="text-rose-500">*</span>
                </label>
                <select
                  value={candidateName}
                  onChange={handleCandidateChange}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-blue-500"
                >
                  {CANDIDATE_OPTIONS.map((c, idx) => (
                    <option key={idx} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vị trí ứng tuyển <span className="text-rose-500">*</span>
                </label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500"
                >
                  {POSITION_OPTIONS.map((p, idx) => (
                    <option key={idx} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* TRƯỜNG 3: NGÀY PHỎNG VẤN (col-span-1) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ngày phỏng vấn <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            {/* TRƯỜNG 4 & 5: GIỜ BẮT ĐẦU & GIỜ KẾT THÚC (col-span-1) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Giờ bắt đầu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Giờ kết thúc <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>

            {/* TRƯỜNG 6: HÌNH THỨC PHỎNG VẤN (col-span-1) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hình thức phỏng vấn <span className="text-rose-500">*</span>
              </label>
              <select
                value={interviewType}
                onChange={(e) => {
                  const val = e.target.value as "online" | "offline";
                  setInterviewType(val);
                  setLocationOrLink(
                    val === "online"
                      ? "https://meet.google.com/abc-xyz-123"
                      : "Phòng họp 402 - Trụ sở chính Hà Nội"
                  );
                }}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:border-blue-500"
              >
                <option value="online">🖥️ Online (Meet / Zoom trực tuyến)</option>
                <option value="offline">🏢 Offline (Trực tiếp tại văn phòng)</option>
              </select>
            </div>

            {/* TRƯỜNG 7: LOGIC HIỂN THỊ ĐỘNG - LINK MEET HOẶC PHÒNG HỌP (col-span-1) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {interviewType === "online" ? (
                  <span className="flex items-center gap-1">
                    <Video className="w-3.5 h-3.5 text-blue-600" />
                    <span>Link Meet / Zoom</span>
                    <span className="text-rose-500">*</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Phòng họp / Địa điểm</span>
                    <span className="text-rose-500">*</span>
                  </span>
                )}
              </label>
              <input
                type="text"
                required
                value={locationOrLink}
                onChange={(e) => setLocationOrLink(e.target.value)}
                placeholder={
                  interviewType === "online"
                    ? "https://meet.google.com/abc-xyz-123"
                    : "Phòng họp 402 - Tầng 4 Trụ sở Hà Nội"
                }
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            {/* TRƯỜNG 8: HỘI ĐỒNG PHỎNG VẤN (MULTI-SELECT CHIP - col-span-2) */}
            <div className="col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">
                  Hội đồng phỏng vấn (Panel / Evaluators) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  Đã chọn: <strong className="text-blue-600">{selectedInterviewers.length}</strong> người
                </span>
              </div>

              {/* Danh sách thẻ chọn đa luồng (Multi-select Chips) */}
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                {EVALUATOR_OPTIONS.map((interviewer, idx) => {
                  const isSelected = selectedInterviewers.includes(interviewer);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleToggleInterviewer(interviewer)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span>{interviewer}</span>
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TRƯỜNG 9: GHI CHÚ / LỜI NHẮN CHO ỨNG VIÊN (col-span-2) */}
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ghi chú / Lời nhắn cho ứng viên (Tùy chọn)
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ví dụ: Vui lòng chuẩn bị sẵn bài tập kỹ thuật (Coding Challenge) và trang bị webcam, micro trước 5 phút..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:border-blue-500 leading-relaxed"
              />
            </div>
          </div>

          {/* 3. Footer Actions: Nút Hủy (Outline) & Nút Tạo lịch phỏng vấn (Primary rounded-full px-6) */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              <span>Tạo lịch phỏng vấn</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// TRANG CHÍNH: QUẢN LÝ LỊCH PHỎNG VẤN (HR INTERVIEWS PAGE)
// =============================================================================

export default function HRInterviewsPage() {
  // State quản lý hiển thị Modal tạo lịch phỏng vấn
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Danh sách lịch phỏng vấn
  const [interviews, setInterviews] = useState<InterviewSchedule[]>([
    {
      id: "INT-001",
      code: "INT-2026-045",
      candidate_name: "Nguyễn Thu Thủy",
      position: "Senior Backend Engineer",
      datetime: "08/10/2026 14:00 - 15:00",
      type: "online",
      location_or_link: "https://meet.google.com/abc-xyz-123",
      interviewers: ["Lê Văn Mạnh (Tech Lead)", "Phạm Quốc Tuấn (Solution Architect)"],
      status: "scheduled",
      evaluation_submitted: 0
    },
    {
      id: "INT-002",
      code: "INT-2026-042",
      candidate_name: "Trần Minh Quang",
      position: "Trưởng nhóm Data Analyst",
      datetime: "05/10/2026 10:00 - 11:30",
      type: "offline",
      location_or_link: "Phòng họp 402 - Trụ sở chính Hà Nội",
      interviewers: ["Trần Thị Thu Hà (HR Manager)", "Phạm Quốc Tuấn (Data Director)"],
      status: "completed",
      evaluation_submitted: 2
    }
  ]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Hàm xử lý khi submit tạo lịch mới từ Modal
  const handleCreateInterview = (data: InterviewFormData) => {
    const dateParts = data.interviewDate.split('-');
    const formattedDate = dateParts.length === 3 
      ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` 
      : data.interviewDate;

    const formattedDatetime = `${formattedDate} ${data.startTime} - ${data.endTime}`;
    const nextIndex = interviews.length + 1;
    const newCode = `INT-2026-${String(45 + nextIndex).padStart(3, '0')}`;

    const newInterview: InterviewSchedule = {
      id: `INT-${Date.now()}`,
      code: newCode,
      candidate_name: data.candidateName,
      position: data.position,
      datetime: formattedDatetime,
      type: data.type,
      location_or_link: data.locationOrLink,
      interviewers: data.interviewers,
      status: 'scheduled',
      evaluation_submitted: 0,
    };

    setInterviews((prev) => [newInterview, ...prev]);
    showToast(`Đã tạo lịch phỏng vấn thành công cho ứng viên ${data.candidateName}!`);
  };

  return (
    <div className="space-y-6">
      {/* Toast thông báo */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[10001] px-4 py-3 rounded-2xl shadow-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-200/80 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lịch Phỏng Vấn & Hội Đồng Evaluators</h1>
            <span className="bg-blue-50 text-blue-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-blue-200">
              [S6-01] Interview Operations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Lên lịch phỏng vấn Online/Offline, gán Hội đồng phỏng vấn & theo dõi tiến độ nộp phiếu đánh giá</p>
        </div>

        {/* Nút Tạo Lịch Phỏng Vấn Mới */}
        <button 
          id="btn-create-interview"
          type="button"
          onClick={() => {
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tạo Lịch Phỏng Vấn Mới</span>
        </button>
      </div>

      {/* Main List */}
      <div className="space-y-4">
        {interviews.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4 hover:shadow-md transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">{item.code}</span>
                    <h2 className="text-base font-bold text-slate-900">{item.candidate_name}</h2>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">Vị trí: <strong>{item.position}</strong></div>
                </div>
              </div>

              {item.status === 'scheduled' ? (
                <span className="bg-blue-50 text-blue-700 font-extrabold text-[10px] px-2.5 py-1 rounded-full border border-blue-200">
                  Sắp Phỏng Vấn
                </span>
              ) : (
                <span className="bg-emerald-50 text-emerald-700 font-extrabold text-[10px] px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Đã Phỏng Vấn</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
              <div className="space-y-1">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase">Thời Gian & Hình Thức</div>
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>{item.datetime}</span>
                </div>
                <div className="text-[11px] text-slate-500 break-all">
                  {item.type === 'online' ? `🖥️ Online: ${item.location_or_link}` : `🏢 Offline: ${item.location_or_link}`}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase">Hội Đồng Phỏng Vấn (Panel)</div>
                <div className="space-y-0.5">
                  {item.interviewers.map((person, idx) => (
                    <div key={idx} className="font-semibold text-slate-800 flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-slate-400" />
                      <span>{person}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase">Phiếu Đánh Giá</div>
                <div className="font-bold text-slate-900">
                  Đã nộp: <span className="text-blue-600 font-extrabold">{item.evaluation_submitted}/{item.interviewers.length}</span> người
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal tạo lịch phỏng vấn */}
      <CreateInterviewModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateInterview}
      />
    </div>
  );
}
