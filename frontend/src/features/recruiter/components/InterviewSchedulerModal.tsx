"use client";

import React, { useState } from "react";
import { AlertCircle, Calendar, Clock, MapPin, UserCheck, Video, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Candidate, Interview } from "../types/recruiter.types";
import { recruiterService } from "../services/recruiter.service";

interface InterviewSchedulerModalProps {
  isOpen: boolean;
  candidate: Candidate | null;
  onClose: () => void;
  onSuccess: (interview: Interview) => void;
}

export function InterviewSchedulerModal({
  isOpen,
  candidate,
  onClose,
  onSuccess,
}: InterviewSchedulerModalProps) {
  const [round, setRound] = useState<Interview["round"]>("Vòng 1 - Chuyên môn");
  const [date, setDate] = useState("2026-10-06");
  const [time, setTime] = useState("14:00");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [format, setFormat] = useState<"online" | "in_person">("online");
  const [locationOrLink, setLocationOrLink] = useState("https://meet.google.com/vina-interview-room");
  const [interviewers, setInterviewers] = useState("Nguyễn Minh Anh (Tech Lead)");
  const [notes, setNotes] = useState("");
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [overrideAllowed, setOverrideAllowed] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [error, setError] = useState("");

  if (!isOpen || !candidate) return null;

  const handleValidateConflict = () => {
    const scheduledAt = `${date}T${time}:00`;
    const interviewerList = interviewers.split(",").map((s) => s.trim()).filter(Boolean);
    const result = recruiterService.checkInterviewConflict(
      scheduledAt,
      durationMinutes,
      interviewerList,
      locationOrLink
    );
    if (result.hasConflict && result.reason) {
      setConflictWarning(result.reason);
      setOverrideAllowed(true);
      return false;
    } else {
      setConflictWarning(null);
      setOverrideAllowed(false);
      return true;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!date || !time) {
      setError("Vui lòng chọn ngày và giờ phỏng vấn.");
      return;
    }

    const scheduledAt = `${date}T${time}:00`;
    const interviewerList = interviewers.split(",").map((s) => s.trim()).filter(Boolean);

    // Kiểm tra trùng lịch (S6-04)
    const result = recruiterService.checkInterviewConflict(
      scheduledAt,
      durationMinutes,
      interviewerList,
      locationOrLink
    );

    if (result.hasConflict && !overrideReason.trim()) {
      setConflictWarning(result.reason || "Phát hiện xung đột lịch phỏng vấn!");
      setOverrideAllowed(true);
      return;
    }

    const newInterview = recruiterService.scheduleInterview(
      candidate.id,
      round,
      scheduledAt,
      durationMinutes,
      format,
      locationOrLink,
      interviewerList,
      notes + (overrideReason ? ` [Ghi đè trùng lịch: ${overrideReason}]` : "")
    );

    onSuccess(newInterview);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-blue-600">
              <Calendar className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">Đặt lịch phỏng vấn</h2>
              <p className="text-xs text-slate-500">Ứng viên: <strong>{candidate.fullName}</strong> — #{candidate.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && <p className="text-xs font-bold text-red-600">{error}</p>}

          {conflictWarning && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-red-800">CẢNH BÁO XUNG ĐỘT TRÙNG LỊCH (S6-04)</h4>
                  <p className="text-xs text-red-700 mt-1">{conflictWarning}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-red-200">
                <label className="block text-xs font-bold text-red-900 mb-1">
                  Nhập lý do xác nhận ghi đè (Bắt buộc nếu vẫn muốn lưu buổi này):
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đã thống nhất đổi giờ nội bộ với phỏng vấn viên..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full h-9 rounded-lg border border-red-300 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Vòng phỏng vấn *
            </label>
            <Select
              value={round}
              onChange={(e) => setRound(e.target.value as Interview["round"])}
              options={[
                { value: "Vòng 1 - Chuyên môn", label: "Vòng 1 - Chuyên môn" },
                { value: "Vòng 2 - Phù hợp văn hóa", label: "Vòng 2 - Phù hợp văn hóa" },
                { value: "Vòng 3 - Phỏng vấn BGĐ", label: "Vòng 3 - Phỏng vấn BGĐ" },
              ]}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Ngày phỏng vấn *"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setConflictWarning(null);
              }}
            />
            <Input
              label="Giờ bắt đầu *"
              type="time"
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                setConflictWarning(null);
              }}
            />
            <Select
              label="Thời lượng"
              value={String(durationMinutes)}
              onChange={(e) => {
                setDurationMinutes(Number(e.target.value));
                setConflictWarning(null);
              }}
              options={[
                { value: "30", label: "30 phút" },
                { value: "45", label: "45 phút" },
                { value: "60", label: "60 phút (1 giờ)" },
                { value: "90", label: "90 phút (1.5 giờ)" },
              ]}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Hình thức phỏng vấn *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormat("online");
                    setLocationOrLink("https://meet.google.com/vina-interview-room");
                    setConflictWarning(null);
                  }}
                  className={`flex items-center justify-center gap-2 h-10 rounded-xl border text-xs font-bold transition-all ${
                    format === "online"
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Video className="h-4 w-4" />
                  Trực tuyến
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormat("in_person");
                    setLocationOrLink("Phòng họp 402 (Tòa nhà VinaTech)");
                    setConflictWarning(null);
                  }}
                  className={`flex items-center justify-center gap-2 h-10 rounded-xl border text-xs font-bold transition-all ${
                    format === "in_person"
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                  Trực tiếp
                </button>
              </div>
            </div>

            <Input
              label={format === "online" ? "Đường dẫn phòng họp online *" : "Địa điểm / Phòng họp *"}
              value={locationOrLink}
              onChange={(e) => {
                setLocationOrLink(e.target.value);
                setConflictWarning(null);
              }}
            />
          </div>

          <div>
            <Input
              label="Người phỏng vấn (cách nhau dấu phẩy) *"
              value={interviewers}
              onChange={(e) => {
                setInterviewers(e.target.value);
                setConflictWarning(null);
              }}
              placeholder="Nguyễn Minh Anh (Tech Lead), Trần Hoàng Nam (HR Manager)"
            />
            <p className="mt-1 text-[11px] text-slate-400">Hệ thống sẽ tự động quét trùng lịch của các phỏng vấn viên này.</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Ghi chú cho hội đồng phỏng vấn
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Yêu cầu chuẩn bị, trọng tâm đánh giá chuyên môn hoặc tình huống cần hỏi..."
              className="w-full min-h-20 rounded-xl border border-slate-200 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleValidateConflict}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              🔍 Kiểm tra xung đột lịch ngay
            </button>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={onClose}>
                Hủy bỏ
              </Button>
              <Button size="sm" type="submit" leftIcon={<Calendar className="h-4 w-4" />}>
                Xác nhận đặt lịch
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
