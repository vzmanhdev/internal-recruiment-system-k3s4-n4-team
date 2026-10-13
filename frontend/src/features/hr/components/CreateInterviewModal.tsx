"use client";

import React, { useState } from "react";
import { 
  X, Calendar, Clock, Video, MapPin, Users, 
  Check, AlertCircle, Plus 
} from "lucide-react";

export interface InterviewFormData {
  candidateName: string;
  position: string;
  interviewDate: string;
  startTime: string;
  endTime: string;
  type: "online" | "offline";
  locationOrLink: string;
  interviewers: string[];
  notes?: string;
}

interface CreateInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InterviewFormData) => void;
}

// Danh sách gợi ý sẵn cho Ứng viên & Vị trí
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

// Danh sách Hội đồng phỏng vấn (Panel / Evaluators)
const EVALUATOR_OPTIONS = [
  "Lê Văn Mạnh (Tech Lead)",
  "Trần Thị Thu Hà (HR Manager)",
  "Phạm Quốc Tuấn (Solution Architect)",
  "Vũ Hải Đăng (CTO)",
  "Bùi Quốc Đạt (CCO)",
  "Đỗ Hoàng Long (Lead QA/QC)",
];

export const CreateInterviewModal: React.FC<CreateInterviewModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  // Form State
  const [candidateName, setCandidateName] = useState(CANDIDATE_OPTIONS[0].name);
  const [position, setPosition] = useState(CANDIDATE_OPTIONS[0].position);
  const [interviewDate, setInterviewDate] = useState(
    new Date().toISOString().split("T")[0]
  );
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

  // Tự động đồng bộ vị trí khi chọn ứng viên gợi ý
  const handleCandidateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    setCandidateName(selectedName);
    const matched = CANDIDATE_OPTIONS.find((c) => c.name === selectedName);
    if (matched) {
      setPosition(matched.position);
    }
  };

  // Toggle người phỏng vấn trong Multi-select
  const handleToggleInterviewer = (interviewer: string) => {
    if (selectedInterviewers.includes(interviewer)) {
      if (selectedInterviewers.length === 1) {
        setErrorMsg("Phải có ít nhất 1 người trong hội đồng phỏng vấn!");
        return;
      }
      setSelectedInterviewers((prev) => prev.filter((i) => i !== interviewer));
      setErrorMsg("");
    } else {
      setSelectedInterviewers((prev) => [...prev, interviewer]);
      setErrorMsg("");
    }
  };

  // Submit form
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
    // 1. Cấu trúc Modal (Modal Wrapper): Overlay mờ + Flex căn giữa + z-50
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Khối form chính: bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 */}
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 relative max-h-[92vh] overflow-y-auto space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Tiêu đề "Tạo Lịch Phỏng Vấn Mới" (text-lg font-bold) và nút X (Close) */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
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
            <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chọn Ứng viên <span className="text-rose-500">*</span>
                </label>
                <select
                  value={candidateName}
                  onChange={handleCandidateChange}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
              <div className="relative">
                <input
                  type="date"
                  required
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
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
                  className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                  className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="online">🖥️ Online (Trực tuyến qua Meet/Zoom)</option>
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
                    ? "Nhập link họp (Ví dụ: https://meet.google.com/xyz)"
                    : "Nhập phòng họp (Ví dụ: Phòng họp 402 - Tầng 4)"
                }
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* TRƯỜNG 8: HỘI ĐỒNG PHỎNG VẤN (MULTI-SELECT CHIP / BADGE - col-span-2) */}
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
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 leading-relaxed"
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
};
