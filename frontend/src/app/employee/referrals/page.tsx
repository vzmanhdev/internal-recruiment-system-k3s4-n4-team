'use client';

import React, { useState } from 'react';
import { EmployeeAppShell } from '@/components/layout/EmployeeAppShell';
import {
  Gift,
  Plus,
  Search,
  Upload,
  Calendar,
  Briefcase,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  ChevronRight,
  X,
  FileText,
  User,
  Phone,
  Mail,
  AlertCircle,
  Check,
} from 'lucide-react';
import clsx from 'clsx';
import { referralService, type ReferralItem } from '@/services/referral.service';
import { jobService } from '@/services/job.service';
import { uploadFile } from '@/services/file.service';
import { useApiData } from '@/hooks/useApiData';
import { ErrorState, LoadingState } from '@/components/ui/DataStates';
import { ApiError } from '@/lib/api-client';

const vnd = (n: number) => `${n.toLocaleString('vi-VN')} VNĐ`;

// The referrer only sees the general status of the referred person (S4-07 AC3)
function toReferral(r: ReferralItem): ReferralCandidate & { earned: boolean; closed: boolean } {
  const hired = r.status === 'hired' || r.payout_status === 'eligible' || r.payout_status === 'paid';
  const closed = !hired && r.candidate_status === 'Kết thúc';
  const step: StepKey = hired ? 'hired' : r.candidate_status === 'Mời phỏng vấn' ? 'interviewing' : 'applied';
  return {
    id: `REF-${r.id}`,
    name: r.candidate_name,
    position: r.job_title || '',
    department: '',
    appliedDate: r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN') : '',
    currentStep: step,
    stepIndex: PROGRESS_STEPS.findIndex((x) => x.key === step),
    bonus: vnd(r.bonus_amount) + (r.payout_status === 'paid' ? ' (Đã nhận)' : ''),
    note: closed ? 'Quy trình tuyển dụng của ứng viên đã kết thúc.' : r.candidate_status ? `Trạng thái: ${r.candidate_status}` : (r.relationship_note || ''),
    cvFileName: r.cv_url ? r.cv_url.split('/').pop() : undefined,
    earned: hired,
    closed,
  };
}

// 4 Progress Steps: Đã nộp -> Đang phỏng vấn -> Offer -> Đã nhận việc
const PROGRESS_STEPS = [
  { key: 'applied', label: 'Đã nộp' },
  { key: 'interviewing', label: 'Đang phỏng vấn' },
  { key: 'offer', label: 'Offer' },
  { key: 'hired', label: 'Đã nhận việc' },
] as const;

type StepKey = (typeof PROGRESS_STEPS)[number]['key'];

interface ReferralCandidate {
  id: string;
  name: string;
  position: string;
  department: string;
  appliedDate: string;
  currentStep: StepKey;
  stepIndex: number; // 0: Đã nộp, 1: Đang phỏng vấn, 2: Offer, 3: Đã nhận việc
  bonus: string;
  note: string;
  cvFileName?: string;
}

export default function EmployeeReferralsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    candidateName: '',
    email: '',
    phone: '',
    position: '', // job posting id
    note: '',
    cvFile: null as File | null,
  });
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { data: openJobs } = useApiData(() => jobService.getJobs(), []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const { data, error, loading, reload } = useApiData(() => referralService.getReferrals(), []);
  const referrals = (data || []).map(toReferral);
  const expectedBonus = (data || []).filter((r, i) => !referrals[i].closed).reduce((sum, r) => sum + (r.bonus_amount || 0), 0);

  const filteredReferrals = referrals.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmitReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.candidateName.trim() || !form.position) return;
    setSaving(true);
    try {
      let url = cvUrl;
      if (form.cvFile && !url) {
        url = (await uploadFile('cv', form.cvFile)).url;
        setCvUrl(url);
      }
      await referralService.createReferral({
        candidate_name: form.candidateName.trim(),
        candidate_email: form.email.trim(),
        candidate_phone: form.phone.trim(),
        job_posting_id: Number(form.position),
        cv_url: url || undefined,
        relationship_note: form.note.trim() || undefined,
      });
      setIsModalOpen(false);
      setForm({ candidateName: '', email: '', phone: '', position: '', note: '', cvFile: null });
      setCvUrl(null);
      reload();
      showToast('Giới thiệu ứng viên thành công! HR sẽ sớm xem xét hồ sơ.');
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Không gửi được giới thiệu.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <EmployeeAppShell activeTab="my-referrals"><LoadingState /></EmployeeAppShell>;
  if (error) return <EmployeeAppShell activeTab="my-referrals"><ErrorState error={error} onRetry={reload} /></EmployeeAppShell>;

  return (
    <EmployeeAppShell activeTab="my-referrals">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2 shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[10px] uppercase tracking-wider">
                Chương Trình Referral Nội Bộ
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
              <Gift className="w-6 h-6 text-blue-600" />
              <span>Giới Thiệu Ứng Viên & Theo Dõi Tiến Độ</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Giới thiệu bạn bè, đồng nghiệp gia nhập đội ngũ và nhận thưởng referral hấp dẫn theo từng mốc tuyển dụng.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer active:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Giới Thiệu Ứng Viên Mới</span>
          </button>
        </div>

        {/* Quick KPI Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-400">Tổng ứng viên giới thiệu</span>
            <div className="text-2xl font-black text-slate-900">{referrals.length}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-400">Đang phỏng vấn</span>
            <div className="text-2xl font-black text-amber-600">
              {referrals.filter((r) => r.currentStep === 'interviewing').length}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-400">Đã nhận việc thành công</span>
            <div className="text-2xl font-black text-emerald-600">
              {referrals.filter((r) => r.currentStep === 'hired').length}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-400">Thưởng tích lũy dự kiến</span>
            <div className="text-2xl font-black text-blue-600">{expectedBonus.toLocaleString('vi-VN')} đ</div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Tìm theo tên người quen, vị trí ứng tuyển..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
            />
          </div>
          <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
            Hiển thị <strong>{filteredReferrals.length}</strong> ứng viên
          </span>
        </div>

        {/* Tracking Board: Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredReferrals.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-5 flex flex-col justify-between"
            >
              {/* Card Top: Candidate Info & Badge */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-base flex items-center justify-center shadow-sm">
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-slate-900">{item.name}</h3>
                      <span className="text-[10px] font-mono text-slate-400 block">{item.id}</span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={clsx(
                      'px-2.5 py-1 rounded-full text-[10px] font-extrabold border shrink-0',
                      item.currentStep === 'hired'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : item.currentStep === 'offer'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : item.currentStep === 'interviewing'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    )}
                  >
                    {item.currentStep === 'hired'
                      ? '✓ Đã nhận việc'
                      : item.currentStep === 'offer'
                      ? 'Đề xuất Offer'
                      : item.currentStep === 'interviewing'
                      ? 'Đang phỏng vấn'
                      : 'Đã nộp hồ sơ'}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                    <span>{item.position}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Ngày nộp: {item.appliedDate}</span>
                  </div>
                </div>

                {/* Note */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1">
                  <span className="font-bold text-slate-700 block">Tiến độ cập nhật:</span>
                  <p className="leading-relaxed">{item.note}</p>
                </div>
              </div>

              {/* Progress Steps: Đã nộp -> Đang phỏng vấn -> Offer -> Đã nhận việc */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                  <span>Tiến trình tuyển dụng</span>
                  <span className="text-blue-600 font-bold lowercase">
                    bước {item.stepIndex + 1}/4
                  </span>
                </div>

                {/* Progress Stepper Bar */}
                <div className="relative flex items-center justify-between">
                  {/* Connector Line */}
                  <div className="absolute top-1/2 left-2 right-2 -translate-y-1/2 h-1 bg-slate-100 z-0 rounded-full" />
                  <div
                    className="absolute top-1/2 left-2 -translate-y-1/2 h-1 bg-emerald-500 z-0 rounded-full transition-all duration-300"
                    style={{
                      width: `${(item.stepIndex / (PROGRESS_STEPS.length - 1)) * 92}%`,
                    }}
                  />

                  {PROGRESS_STEPS.map((step, idx) => {
                    const isCompleted = idx < item.stepIndex;
                    const isCurrent = idx === item.stepIndex;
                    const isPending = idx > item.stepIndex;

                    return (
                      <div key={step.key} className="relative z-10 flex flex-col items-center">
                        <div
                          className={clsx(
                            'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all',
                            isCompleted
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : isCurrent
                              ? 'bg-amber-400 border-amber-500 text-white shadow-md ring-4 ring-amber-100'
                              : 'bg-slate-200 border-slate-300 text-slate-500'
                          )}
                        >
                          {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                        </div>
                        <span
                          className={clsx(
                            'text-[9px] font-extrabold mt-1 text-center whitespace-nowrap',
                            isCompleted
                              ? 'text-emerald-700 font-bold'
                              : isCurrent
                              ? 'text-amber-700 font-black'
                              : 'text-slate-400'
                          )}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Bonus Footer */}
                <div className="pt-3 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Thưởng Referral:</span>
                  <span className="font-extrabold text-blue-600">{item.bonus}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Giới thiệu ứng viên mới */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-blue-600" />
                  <span>Giới Thiệu Ứng Viên Mới</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Điền thông tin và đính kèm CV người quen để HR xử lý ưu tiên
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReferral} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ và tên ứng viên *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={form.candidateName}
                  onChange={(e) => setForm({ ...form, candidateName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email ứng viên</label>
                  <input
                    type="email"
                    placeholder="ungvien@gmail.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số điện thoại liên hệ</label>
                  <input
                    type="tel"
                    placeholder="09xx xxx xxx"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Chọn vị trí đang tuyển *</label>
                <select
                  required
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600 font-semibold"
                >
                  <option value="">-- Chọn vị trí đang tuyển --</option>
                  {(openJobs || []).map((j) => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tải lên hồ sơ CV (PDF, DOCX) *</label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setForm({ ...form, cvFile: e.target.files[0] });
                        setCvUrl(null);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                    <Upload className="w-6 h-6 text-blue-600" />
                    <span className="text-xs font-bold text-slate-700">
                      {form.cvFile ? form.cvFile.name : 'Bấm để chọn file CV hoặc kéo thả vào đây'}
                    </span>
                    <span className="text-[10px] text-slate-400">Hỗ trợ định dạng PDF, DOCX tối đa 15MB</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lời nhắn / Đánh giá sơ bộ</label>
                <textarea
                  rows={2}
                  placeholder="Ứng viên từng làm cùng dự án tại công ty cũ, có kinh nghiệm Golang vững..."
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-500/20 cursor-pointer active:scale-95"
                >
                  Gửi Giới Thiệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EmployeeAppShell>
  );
}
