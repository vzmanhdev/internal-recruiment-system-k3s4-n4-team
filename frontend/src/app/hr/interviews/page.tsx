'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { apiRequest, ApiError } from '@/lib/api-client';
import { interviewService, type InterviewItem } from '@/services/interview.service';
import { masterDataService } from '@/services/master-data.service';
import type { ApiApplication } from '@/features/candidates/api';
import { getLocalTodayDateString, isPastDate } from '@/utils/dateUtils';
import { useApiData } from '@/hooks/useApiData';
import { ErrorState, LoadingState } from '@/components/ui/DataStates';
import { 
  Calendar, Clock, Users, Video, MapPin, CheckCircle2, XCircle, 
  Plus, Search, Filter, AlertCircle, Eye, UserCheck, Sparkles, X, Check,
  Edit3, Trash2, RotateCcw, AlertTriangle, ExternalLink, Copy, FileText, ChevronRight
} from 'lucide-react';

// =============================================================================
// TYPES & DATA STRUCTURES
// =============================================================================

export interface InterviewSchedule {
  id: string;
  interviewId: number;
  code: string;
  candidate_name: string;
  candidate_email: string;
  position: string;
  round_number: number;
  round_name: string;
  datetime: string;
  dateStr: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  duration_minutes: number;
  type: 'online' | 'offline';
  location_or_link: string;
  meeting_link?: string | null;
  location: string;
  interviewers: Array<{ id?: number; name: string }>;
  interviewer_ids: number[];
  status: 'scheduled' | 'completed' | 'cancelled';
  evaluation_submitted: number;
  total_evaluators: number;
  feedback_notes?: string;
  score?: number;
  passed?: boolean;
  cancel_reason?: string;
  application_id: number;
  cv_url?: string | null;
}

export interface InterviewFormData {
  candidateName: string;
  position: string;
  roundName: string;
  interviewDate: string;
  startTime: string;
  endTime: string;
  type: 'online' | 'offline';
  locationOrLink: string;
  applicationId: number;
  interviewerIds: number[];
  notes?: string;
  overrideReason?: string;
}

interface CandidateOption { id: number; name: string; position: string; email?: string }
interface EvaluatorOption { id: number; label: string }

// =============================================================================
// MODAL 1: TẠO LỊCH PHỎNG VẤN MỚI (CREATE MODAL)
// =============================================================================

interface CreateInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InterviewFormData) => Promise<void>;
  candidateOptions: CandidateOption[];
  evaluatorOptions: EvaluatorOption[];
}

function CreateInterviewModal({
  isOpen,
  onClose,
  onSubmit,
  candidateOptions,
  evaluatorOptions,
}: CreateInterviewModalProps) {
  const [applicationId, setApplicationId] = useState<number>(0);
  const [candidateName, setCandidateName] = useState("");
  const [position, setPosition] = useState("");
  const [roundName, setRoundName] = useState("Vòng 1: HR Screening & Văn hóa");
  const [interviewDate, setInterviewDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [interviewType, setInterviewType] = useState<"online" | "offline">("online");
  const [locationOrLink, setLocationOrLink] = useState("");
  const [selectedInterviewerIds, setSelectedInterviewerIds] = useState<number[]>([]);
  const [notes, setNotes] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [checkingConflict, setCheckingConflict] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleCandidateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const appId = Number(e.target.value);
    setApplicationId(appId);
    const matched = candidateOptions.find((c) => c.id === appId);
    if (matched) {
      setCandidateName(matched.name);
      setPosition(matched.position);
    } else {
      setCandidateName("");
      setPosition("");
    }
  };

  const handleToggleInterviewer = (id: number) => {
    setSelectedInterviewerIds((prev) => 
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
    setErrorMsg("");
  };

  // Real-time conflict check
  const checkConflictsAsync = async () => {
    if (!interviewDate || !startTime || !endTime || selectedInterviewerIds.length === 0) return;
    const [h1, m1] = startTime.split(':').map(Number);
    const [h2, m2] = endTime.split(':').map(Number);
    const duration = h2 * 60 + m2 - (h1 * 60 + m1);
    if (duration <= 0) return;

    try {
      setCheckingConflict(true);
      const res = await interviewService.checkConflicts({
        scheduled_time: `${interviewDate}T${startTime}`,
        duration_minutes: duration,
        location: interviewType === 'offline' ? locationOrLink : 'Trực tuyến',
        meeting_link: interviewType === 'online' ? locationOrLink : null,
        interviewer_ids: selectedInterviewerIds,
      });
      if (res?.conflicts && res.conflicts.length > 0) {
        const first = res.conflicts[0];
        const who = first.who ? first.who.join(', ') : `Phòng ${first.room}`;
        setConflictWarning(`⚠️ Cảnh báo xung đột: ${who} đã có lịch phỏng vấn lúc ${new Date(first.at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}. Bạn cần nhập lý do ghi đè để tiếp tục.`);
      } else {
        setConflictWarning(null);
      }
    } catch {
      // ignore check error
    } finally {
      setCheckingConflict(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId) {
      setErrorMsg("Vui lòng chọn ứng viên!");
      return;
    }
    if (!interviewDate) {
      setErrorMsg("Vui lòng chọn ngày phỏng vấn!");
      return;
    }
    if (isPastDate(interviewDate)) {
      setErrorMsg("Không thể đặt lịch phỏng vấn trong quá khứ!");
      return;
    }
    const [h1, m1] = startTime.split(':').map(Number);
    const [h2, m2] = endTime.split(':').map(Number);
    if (h2 * 60 + m2 <= h1 * 60 + m1) {
      setErrorMsg("Giờ kết thúc phải sau giờ bắt đầu!");
      return;
    }
    if (!locationOrLink.trim()) {
      setErrorMsg(interviewType === "online" ? "Vui lòng nhập link họp online (Google Meet / Zoom)!" : "Vui lòng nhập địa điểm phòng họp!");
      return;
    }
    if (selectedInterviewerIds.length === 0) {
      setErrorMsg("Cần chọn ít nhất 1 người trong hội đồng phỏng vấn!");
      return;
    }
    if (conflictWarning && !overrideReason.trim()) {
      setErrorMsg("Phát hiện trùng lịch! Bắt buộc nhập lý do ghi đè để lưu lịch.");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        candidateName,
        position,
        roundName,
        interviewDate,
        startTime,
        endTime,
        type: interviewType,
        locationOrLink,
        applicationId,
        interviewerIds: selectedInterviewerIds,
        notes,
        overrideReason: conflictWarning ? overrideReason : undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err instanceof ApiError ? err.message : "Không tạo được lịch phỏng vấn.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[10px] tracking-wider uppercase border border-blue-200">
              S6-02 Interview Operations
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-1">Tạo Lịch Phỏng Vấn Mới</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {conflictWarning && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{conflictWarning}</span>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">Lý do ghi đè trùng lịch (bắt buộc):</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Người phỏng vấn đã đồng ý linh động đổi giờ / Đổi phòng họp..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* Chọn Ứng viên */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Ứng Viên Tuyển Dụng *</label>
            <select
              value={applicationId || ""}
              onChange={handleCandidateSelect}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500"
            >
              <option value="">-- Chọn hồ sơ ứng viên đang tuyển --</option>
              {candidateOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.position}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Vòng Phỏng Vấn *</label>
              <select
                value={roundName}
                onChange={(e) => setRoundName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500"
              >
                <option value="Vòng 1: HR Screening & Sàng lọc văn hóa">Vòng 1: HR Screening & Sàng lọc</option>
                <option value="Vòng 2: Phỏng vấn chuyên môn Technical">Vòng 2: Phỏng vấn Chuyên Môn</option>
                <option value="Vòng 3: Phỏng vấn Ban Giám Đốc & Deal Offer">Vòng 3: Ban Giám Đốc & Offer</option>
                <option value="Vòng Phỏng Vấn Bổ Sung">Vòng Phỏng Vấn Bổ Sung</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Ngày Phỏng Vấn *</label>
              <input
                type="date"
                min={getLocalTodayDateString()}
                value={interviewDate}
                onChange={(e) => { setInterviewDate(e.target.value); setErrorMsg(""); }}
                onBlur={checkConflictsAsync}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          {/* Giờ bắt đầu & Kết thúc */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Giờ Bắt Đầu *</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                onBlur={checkConflictsAsync}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Giờ Kết Thúc *</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                onBlur={checkConflictsAsync}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          {/* Hình thức */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-700">Hình Thức Phỏng Vấn *</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="radio"
                  name="type"
                  checked={interviewType === "online"}
                  onChange={() => { setInterviewType("online"); setLocationOrLink("https://meet.google.com/new"); }}
                />
                <span>Trực Tuyến (Online Meet / Zoom)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="radio"
                  name="type"
                  checked={interviewType === "offline"}
                  onChange={() => { setInterviewType("offline"); setLocationOrLink("Phòng Họp 302 - Tầng 3 (Keangnam)"); }}
                />
                <span>Trực Tiếp (Offline tại văn phòng)</span>
              </label>
            </div>
            <input
              type="text"
              placeholder={interviewType === "online" ? "Nhập link họp Google Meet / Zoom..." : "Nhập địa điểm / phòng họp cụ thể..."}
              value={locationOrLink}
              onChange={(e) => setLocationOrLink(e.target.value)}
              onBlur={checkConflictsAsync}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Hội đồng phỏng vấn (Multi-Select) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700">Hội Đồng Phỏng Vấn (Panel Evaluators) *</label>
              <span className="text-[11px] text-slate-500">Đã chọn: {selectedInterviewerIds.length} người</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-36 overflow-y-auto space-y-1.5">
              {evaluatorOptions.map((ev) => {
                const checked = selectedInterviewerIds.includes(ev.id);
                return (
                  <label key={ev.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleInterviewer(ev.id)}
                    />
                    <span className={`text-xs ${checked ? "font-bold text-blue-700" : "text-slate-700"}`}>
                      {ev.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Ghi Chú & Hướng Dẫn Chuẩn Bị</label>
            <textarea
              rows={2}
              placeholder="Yêu cầu ứng viên chuẩn bị laptop live coding / Portfolio..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
            >
              {submitting ? "Đang tạo lịch..." : "Xác Nhận Tạo Lịch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// MODAL 2: DỜI LỊCH PHỎNG VẤN (RESCHEDULE MODAL - S6-06)
// =============================================================================

interface RescheduleModalProps {
  session: InterviewSchedule | null;
  onClose: () => void;
  onSubmit: (id: number, data: any) => Promise<void>;
  evaluatorOptions: EvaluatorOption[];
}

function RescheduleModal({ session, onClose, onSubmit, evaluatorOptions }: RescheduleModalProps) {
  const [newDate, setNewDate] = useState("");
  const [newStartTime, setNewStartTime] = useState("09:00");
  const [newEndTime, setNewEndTime] = useState("10:00");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [locationOrLink, setLocationOrLink] = useState("");
  const [selectedInterviewerIds, setSelectedInterviewerIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  React.useEffect(() => {
    if (session) {
      setNewDate(session.dateStr || "");
      setNewStartTime(session.startTime || "09:00");
      setNewEndTime(session.endTime || "10:00");
      setLocationOrLink(session.location_or_link || "");
      setSelectedInterviewerIds(session.interviewer_ids || []);
      setRescheduleReason("");
      setErrorMsg("");
    }
  }, [session]);

  if (!session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) { setErrorMsg("Vui lòng chọn ngày mới!"); return; }
    if (isPastDate(newDate)) { setErrorMsg("Không thể dời lịch vào quá khứ!"); return; }
    if (!rescheduleReason.trim()) { setErrorMsg("Vui lòng nhập lý do dời lịch!"); return; }
    const [h1, m1] = newStartTime.split(':').map(Number);
    const [h2, m2] = newEndTime.split(':').map(Number);
    const duration = h2 * 60 + m2 - (h1 * 60 + m1);
    if (duration <= 0) { setErrorMsg("Giờ kết thúc phải sau giờ bắt đầu!"); return; }

    try {
      setSubmitting(true);
      await onSubmit(session.interviewId, {
        scheduled_time: `${newDate}T${newStartTime}`,
        duration_minutes: duration,
        location: session.type === 'offline' ? locationOrLink : 'Trực tuyến',
        meeting_link: session.type === 'online' ? locationOrLink : null,
        interviewer_ids: selectedInterviewerIds.length > 0 ? selectedInterviewerIds : session.interviewer_ids,
        reason: rescheduleReason.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err instanceof ApiError ? err.message : "Không dời được lịch phỏng vấn.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-extrabold text-[10px] uppercase border border-amber-200">
              S6-06 Reschedule Interview
            </span>
            <h2 className="text-base font-bold text-slate-900 mt-1">Dời Lịch Phỏng Vấn</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl space-y-1">
            <div className="text-[11px] font-bold text-blue-900">Ứng viên: {session.candidate_name}</div>
            <div className="text-[11px] text-blue-700">Vòng: {session.round_name} — Vị trí: {session.position}</div>
            <div className="text-[11px] text-slate-500">Lịch hiện tại: {session.datetime}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Ngày Phỏng Vấn Mới *</label>
              <input
                type="date"
                min={getLocalTodayDateString()}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Bắt đầu *</label>
                <input
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kết thúc *</label>
                <input
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs font-semibold text-slate-800"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Lý Do Dời Lịch (Bắt buộc theo SLA) *</label>
            <textarea
              rows={2}
              placeholder="Ví dụ: Người phỏng vấn bận công tác đột xuất / Ứng viên xin dời ngày..."
              value={rescheduleReason}
              onChange={(e) => setRescheduleReason(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} disabled={submitting} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold">
              Đóng
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white rounded-xl font-bold shadow-md shadow-amber-500/20 flex items-center gap-1.5"
            >
              {submitting ? "Đang xử lý..." : "Xác Nhận Dời Lịch"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// MODAL 3: HỦY LỊCH PHỎNG VẤN (CANCEL MODAL - S6-06)
// =============================================================================

interface CancelModalProps {
  session: InterviewSchedule | null;
  onClose: () => void;
  onSubmit: (id: number, reason: string) => Promise<void>;
}

function CancelModal({ session, onClose, onSubmit }: CancelModalProps) {
  const [cancelReason, setCancelReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      setErrorMsg("Vui lòng nhập lý do hủy lịch!");
      return;
    }
    try {
      setSubmitting(true);
      await onSubmit(session.interviewId, cancelReason.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err instanceof ApiError ? err.message : "Không hủy được lịch phỏng vấn.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-rose-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Hủy Lịch Phỏng Vấn</h2>
              <span className="text-[10px] text-slate-500">Mã: {session.code}</span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="text-slate-600 leading-relaxed">
            Bạn có chắc chắn muốn hủy buổi phỏng vấn của ứng viên <strong className="text-slate-900">{session.candidate_name}</strong>?
            Hệ thống sẽ gửi email và thông báo hủy tự động đến ứng viên và toàn bộ hội đồng phỏng vấn.
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Lý Do Hủy Lịch (Bắt buộc) *</label>
            <textarea
              rows={3}
              placeholder="Nhập lý do hủy: Ứng viên xin rút / Vị trí đã tuyển đủ / Hội đồng bận đột xuất..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-hidden focus:border-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} disabled={submitting} className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold">
              Quay Lại
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white rounded-xl font-bold shadow-md shadow-rose-500/20 flex items-center gap-1.5"
            >
              {submitting ? "Đang hủy..." : "Xác Nhận Hủy Buổi Phỏng Vấn"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// MODAL 4: CHI TIẾT LỊCH PHỎNG VẤN (DETAIL MODAL)
// =============================================================================

interface DetailModalProps {
  session: InterviewSchedule | null;
  onClose: () => void;
  onReschedule: (s: InterviewSchedule) => void;
  onCancel: (s: InterviewSchedule) => void;
}

function DetailModal({ session, onClose, onReschedule, onCancel }: DetailModalProps) {
  if (!session) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[11px] font-bold">{session.code}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                session.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                session.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {session.status === 'completed' ? 'Đã Phỏng Vấn' : session.status === 'cancelled' ? 'Đã Hủy' : 'Sắp Phỏng Vấn'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">{session.candidate_name}</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Vị trí ứng tuyển</span>
              <div className="font-bold text-slate-800 mt-0.5">{session.position}</div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Vòng phỏng vấn</span>
              <div className="font-bold text-blue-700 mt-0.5">{session.round_name}</div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Thời gian diễn ra</span>
              <div className="font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>{session.datetime} ({session.duration_minutes} phút)</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Hình thức</span>
              <div className="font-bold text-slate-800 mt-0.5">
                {session.type === 'online' ? '🖥️ Trực Tuyến' : '🏢 Trực Tiếp'}
              </div>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Địa điểm / Đường dẫn họp</span>
            <div className="p-3 bg-white border border-slate-200 rounded-xl mt-1 flex items-center justify-between gap-2">
              <span className="font-mono text-slate-800 truncate">{session.location_or_link}</span>
              {session.type === 'online' && session.location_or_link && (
                <a
                  href={session.location_or_link}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-bold flex items-center gap-1 shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Vào họp</span>
                </a>
              )}
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Hội đồng phỏng vấn (Panel)</span>
            <div className="mt-1 space-y-1.5">
              {session.interviewers.map((ev, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span>{ev.name}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">Người đánh giá</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <div>
                <span className="font-bold text-slate-800">Tiến độ Phiếu đánh giá:</span>
                <span className="ml-1 text-blue-700 font-extrabold">{session.evaluation_submitted}/{session.total_evaluators} người đã nộp</span>
              </div>
            </div>
            <Link
              href={`/hr/evaluations?application_id=${session.application_id}`}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all"
            >
              Xem Phiếu
            </Link>
          </div>

          {session.cancel_reason && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
              <span className="font-bold">Lý do hủy buổi phỏng vấn:</span>
              <p className="mt-0.5">{session.cancel_reason}</p>
            </div>
          )}

          {session.feedback_notes && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl">
              <span className="font-bold">Nhận xét kết quả:</span>
              <p className="mt-0.5">{session.feedback_notes}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-5 border-t border-slate-100 bg-slate-50/50">
          <div className="flex gap-2">
            {session.status === 'scheduled' && (
              <>
                <button
                  type="button"
                  onClick={() => { onClose(); onReschedule(session); }}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Dời Lịch</span>
                </button>
                <button
                  type="button"
                  onClick={() => { onClose(); onCancel(session); }}
                  className="px-3.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl font-bold transition-all flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Hủy Lịch</span>
                </button>
              </>
            )}
          </div>
          <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-bold">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT: HR INTERVIEWS PAGE
// =============================================================================

export default function HRInterviewsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "scheduled" | "completed" | "cancelled">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "online" | "offline">("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedForDetail, setSelectedForDetail] = useState<InterviewSchedule | null>(null);
  const [selectedForReschedule, setSelectedForReschedule] = useState<InterviewSchedule | null>(null);
  const [selectedForCancel, setSelectedForCancel] = useState<InterviewSchedule | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const pad = (n: number) => String(n).padStart(2, '0');

  // Load interviews, applications, evaluators
  const { data, error, loading, reload } = useApiData(async () => {
    const [rows, apps, people] = await Promise.all([
      interviewService.getInterviews(),
      apiRequest<ApiApplication[]>('/applications').catch(() => []),
      masterDataService.people('interviewer').catch(() => []),
    ]);

    // Count submitted evaluations per interview
    const completed = rows.filter((i) => i.status === 'completed');
    const evals = await Promise.all(
      Array.from(new Set(completed.map((i) => i.application_id))).map((appId) =>
        apiRequest<Array<{ interview_id?: number | null }>>(`/referrals/evaluations?application_id=${appId}`).catch(() => [])
      )
    );
    const evalCount = (id: number) => evals.flat().filter((e) => e.interview_id === id).length;

    const interviews: InterviewSchedule[] = rows.map((i: InterviewItem) => {
      const start = new Date(i.scheduled_time);
      const end = new Date(start.getTime() + (i.duration_minutes || 45) * 60_000);
      const panel = (i.interviewers || []) as Array<{ interviewer_id?: number; interviewer_name?: string | null }>;
      const yyyy = start.getFullYear();
      const mm = pad(start.getMonth() + 1);
      const dd = pad(start.getDate());
      return {
        id: String(i.id),
        interviewId: i.id,
        code: `INT-${pad(i.id)}`,
        candidate_name: i.candidate_name || 'Ứng viên',
        candidate_email: i.candidate_email || '',
        position: i.job_title || 'Chức danh tuyển dụng',
        round_number: i.round_number || 1,
        round_name: i.round_name || `Vòng ${i.round_number || 1}`,
        datetime: `${dd}/${mm}/${yyyy} ${pad(start.getHours())}:${pad(start.getMinutes())} - ${pad(end.getHours())}:${pad(end.getMinutes())}`,
        dateStr: `${yyyy}-${mm}-${dd}`,
        startTime: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
        endTime: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
        duration_minutes: i.duration_minutes || 45,
        type: i.meeting_link ? 'online' : 'offline',
        location_or_link: i.meeting_link || i.location || 'Chưa cập nhật',
        meeting_link: i.meeting_link,
        location: i.location || '',
        interviewers: panel.map((x) => ({ id: x.interviewer_id, name: x.interviewer_name || 'Hội đồng' })),
        interviewer_ids: panel.map((x) => x.interviewer_id).filter(Boolean) as number[],
        status: (i.status as any) || 'scheduled',
        evaluation_submitted: evalCount(i.id),
        total_evaluators: Math.max(panel.length, 1),
        feedback_notes: i.feedback_notes,
        score: i.score,
        passed: i.passed,
        application_id: i.application_id,
        cv_url: i.cv_url,
      };
    });

    const candidateOptions: CandidateOption[] = (apps || [])
      .filter((a) => ['submitted', 'screening', 'interviewing', 'offered'].includes(a.status))
      .map((a) => ({ id: a.id, name: a.full_name, position: a.job_title || '', email: a.email }));

    const evaluatorOptions: EvaluatorOption[] = (people || []).map((u) => ({
      id: u.id,
      label: `${u.full_name} (${u.role === 'hr_manager' ? 'Trưởng phòng HR' : u.role === 'hiring_manager' ? 'Trưởng bộ phận' : 'Interviewer'})`,
    }));

    return { interviews, candidateOptions, evaluatorOptions };
  }, []);

  const interviews = data?.interviews || [];

  // Filtered interviews
  const filteredInterviews = useMemo(() => {
    return interviews.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = item.candidate_name.toLowerCase().includes(q);
        const matchCode = item.code.toLowerCase().includes(q);
        const matchPos = item.position.toLowerCase().includes(q);
        const matchRound = item.round_name.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchPos && !matchRound) return false;
      }
      return true;
    });
  }, [interviews, statusFilter, typeFilter, searchTerm]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = interviews.length;
    const scheduled = interviews.filter((i) => i.status === 'scheduled').length;
    const completed = interviews.filter((i) => i.status === 'completed').length;
    const cancelled = interviews.filter((i) => i.status === 'cancelled').length;
    return { total, scheduled, completed, cancelled };
  }, [interviews]);

  // CRUD Actions Handlers
  const handleCreate = async (form: InterviewFormData) => {
    const [h1, m1] = form.startTime.split(':').map(Number);
    const [h2, m2] = form.endTime.split(':').map(Number);
    const duration = h2 * 60 + m2 - (h1 * 60 + m1);

    await apiRequest('/interviews', {
      method: 'POST',
      body: JSON.stringify({
        application_id: form.applicationId,
        round_name: form.roundName,
        round_number: form.roundName.includes('2') ? 2 : form.roundName.includes('3') ? 3 : 1,
        scheduled_time: `${form.interviewDate}T${form.startTime}`,
        duration_minutes: duration,
        location: form.type === 'offline' ? form.locationOrLink : 'Trực tuyến',
        meeting_link: form.type === 'online' ? form.locationOrLink : null,
        interviewer_ids: form.interviewerIds,
        override_conflict_reason: form.overrideReason,
      }),
    });
    reload();
    showToast(`Đã tạo lịch phỏng vấn thành công cho ứng viên ${form.candidateName}!`);
  };

  const handleReschedule = async (id: number, payload: any) => {
    await interviewService.reschedule(id, payload);
    reload();
    showToast("Đã dời lịch phỏng vấn thành công! Thông báo đã gửi đến ứng viên & hội đồng.");
  };

  const handleCancel = async (id: number, reason: string) => {
    await interviewService.cancel(id, reason);
    reload();
    showToast("Đã hủy lịch phỏng vấn thành công. Email thông báo đã được gửi.");
  };

  const handleDelete = async (id: number, candidateName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn XÓA lịch phỏng vấn #${id} của ứng viên "${candidateName}" khỏi hệ thống?`)) return;
    try {
      setDeletingId(id);
      await interviewService.deleteInterview(id);
      reload();
      showToast(`Đã xóa hoàn toàn lịch phỏng vấn #${id}!`);
    } catch (err: any) {
      showToast(err instanceof ApiError ? err.message : "Không thể xóa lịch phỏng vấn này.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[10001] px-4 py-3 rounded-2xl shadow-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Điều Hành */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[10px] tracking-wider uppercase border border-blue-200">
                [S6-01] Interview Operations Center
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Quản lý điều phối Hội đồng & Phiếu đánh giá
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 mt-1 tracking-tight">
              Lịch Phỏng Vấn & Hội Đồng Tuyển Dụng
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi lịch phỏng vấn toàn công ty, phân công hội đồng, kiểm tra xung đột và giám sát tiến độ nộp phiếu đánh giá.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/hr/evaluations"
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Xem Phiếu Đánh Giá</span>
            </Link>
            <button
              type="button"
              id="btn-create-interview"
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tạo Lịch Phỏng Vấn Mới</span>
            </button>
          </div>
        </div>

        {/* 4 Thẻ KPI Phỏng Vấn Nhanh */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400">Tổng Số Buổi</span>
            <div className="text-xl font-black text-slate-900 mt-0.5">{stats.total}</div>
          </div>
          <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-blue-700">Sắp Diễn Ra</span>
            <div className="text-xl font-black text-blue-900 mt-0.5">{stats.scheduled}</div>
          </div>
          <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-emerald-700">Đã Hoàn Tất</span>
            <div className="text-xl font-black text-emerald-900 mt-0.5">{stats.completed}</div>
          </div>
          <div className="p-3.5 bg-rose-50/60 border border-rose-100 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-rose-700">Đã Hủy</span>
            <div className="text-xl font-black text-rose-900 mt-0.5">{stats.cancelled}</div>
          </div>
        </div>
      </div>

      {/* Toolbar: Tìm kiếm & Bộ Lọc */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo tên ứng viên, vị trí, vòng phỏng vấn, mã INT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status filter */}
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-lg transition-all ${statusFilter === 'all' ? 'bg-white text-blue-600 shadow-2xs' : 'hover:text-slate-900'}`}
            >
              Tất Cả ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("scheduled")}
              className={`px-3 py-1 rounded-lg transition-all ${statusFilter === 'scheduled' ? 'bg-white text-blue-600 shadow-2xs' : 'hover:text-slate-900'}`}
            >
              Sắp Tới ({stats.scheduled})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("completed")}
              className={`px-3 py-1 rounded-lg transition-all ${statusFilter === 'completed' ? 'bg-white text-blue-600 shadow-2xs' : 'hover:text-slate-900'}`}
            >
              Đã Xong ({stats.completed})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("cancelled")}
              className={`px-3 py-1 rounded-lg transition-all ${statusFilter === 'cancelled' ? 'bg-white text-blue-600 shadow-2xs' : 'hover:text-slate-900'}`}
            >
              Đã Hủy ({stats.cancelled})
            </button>
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="all">Mọi hình thức</option>
            <option value="online">🖥️ Online (Meet/Zoom)</option>
            <option value="offline">🏢 Offline (Văn phòng)</option>
          </select>
        </div>
      </div>

      {/* Danh Sách Lịch Phỏng Vấn */}
      <div className="space-y-3.5">
        {filteredInterviews.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="font-bold text-slate-800 text-sm">Không tìm thấy lịch phỏng vấn nào</h3>
            <p className="text-xs text-slate-500 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bấm nút "+ Tạo Lịch Phỏng Vấn Mới".</p>
          </div>
        ) : (
          filteredInterviews.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-md transition-all space-y-4"
            >
              {/* Header card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                    item.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                    item.status === 'cancelled' ? 'bg-rose-50 text-rose-600' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        {item.code}
                      </span>
                      <h2 className="text-base font-bold text-slate-900">{item.candidate_name}</h2>
                      <span className="text-[11px] text-slate-400">•</span>
                      <span className="text-xs font-semibold text-blue-700">{item.round_name}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Vị trí tuyển dụng: <strong className="text-slate-800">{item.position}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.status === 'scheduled' ? (
                    <span className="bg-blue-50 text-blue-700 font-extrabold text-[10px] px-2.5 py-1 rounded-full border border-blue-200 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-600" />
                      <span>Sắp Phỏng Vấn</span>
                    </span>
                  ) : item.status === 'completed' ? (
                    <span className="bg-emerald-50 text-emerald-700 font-extrabold text-[10px] px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Đã Phỏng Vấn</span>
                    </span>
                  ) : (
                    <span className="bg-rose-50 text-rose-700 font-extrabold text-[10px] px-2.5 py-1 rounded-full border border-rose-200 flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-rose-600" />
                      <span>Đã Hủy</span>
                    </span>
                  )}

                  {/* Actions buttons */}
                  <button
                    type="button"
                    onClick={() => setSelectedForDetail(item)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Xem chi tiết buổi phỏng vấn"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {item.status === 'scheduled' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedForReschedule(item)}
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Dời lịch phỏng vấn (S6-06)"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedForCancel(item)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hủy lịch phỏng vấn (S6-06)"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {item.evaluation_submitted === 0 && (
                    <button
                      type="button"
                      disabled={deletingId === item.interviewId}
                      onClick={() => handleDelete(item.interviewId, item.candidate_name)}
                      className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Xóa lịch phỏng vấn (chưa có phiếu)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Body grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
                <div className="space-y-1">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase">Thời Gian & Hình Thức</div>
                  <div className="font-bold text-slate-900 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>{item.datetime}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 break-all truncate" title={item.location_or_link}>
                    {item.type === 'online' ? `🖥️ Online: ${item.location_or_link}` : `🏢 Offline: ${item.location_or_link}`}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase">Hội Đồng Phỏng Vấn (Panel)</div>
                  <div className="space-y-0.5">
                    {item.interviewers.length === 0 ? (
                      <span className="text-slate-400 italic">Chưa chỉ định</span>
                    ) : (
                      item.interviewers.map((person, idx) => (
                        <div key={idx} className="font-semibold text-slate-800 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-slate-400" />
                          <span>{person.name}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] font-extrabold text-slate-400 uppercase">Phiếu Đánh Giá Scorecard</div>
                    <div className="font-bold text-slate-900 mt-0.5">
                      Đã nộp: <span className="text-blue-600 font-extrabold">{item.evaluation_submitted}/{item.total_evaluators}</span> người
                    </div>
                  </div>
                  <div className="pt-1">
                    <Link
                      href={`/hr/evaluations?application_id=${item.application_id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800"
                    >
                      <span>Quản lý kết quả đánh giá</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Hiển thị lý do nếu bị hủy */}
              {item.cancel_reason && (
                <div className="text-[11px] bg-rose-50/70 border border-rose-100 text-rose-700 px-3 py-1.5 rounded-lg">
                  <strong>Lý do hủy:</strong> {item.cancel_reason}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      <CreateInterviewModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
        candidateOptions={data?.candidateOptions || []}
        evaluatorOptions={data?.evaluatorOptions || []}
      />

      <RescheduleModal
        session={selectedForReschedule}
        onClose={() => setSelectedForReschedule(null)}
        onSubmit={handleReschedule}
        evaluatorOptions={data?.evaluatorOptions || []}
      />

      <CancelModal
        session={selectedForCancel}
        onClose={() => setSelectedForCancel(null)}
        onSubmit={handleCancel}
      />

      <DetailModal
        session={selectedForDetail}
        onClose={() => setSelectedForDetail(null)}
        onReschedule={(s) => setSelectedForReschedule(s)}
        onCancel={(s) => setSelectedForCancel(s)}
      />
    </div>
  );
}
