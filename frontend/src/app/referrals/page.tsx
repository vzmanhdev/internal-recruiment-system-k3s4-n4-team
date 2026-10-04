"use client";

import { useEffect, useState } from "react";
import { AccountWorkspaceShell } from "@/components/layout/AccountWorkspaceShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Icon } from "@/components/ui/Icons";
import { fetchPublicJobs, JobPostingItem } from "@/features/jobs/services/job-posting.service";
import {
  createReferral,
  fetchMyReferrals,
  ReferralItem,
} from "@/features/referrals/services/referral.service";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ HR liên hệ", color: "bg-amber-50 text-amber-700 border-amber-200" },
  contacted: { label: "Đã liên hệ", color: "bg-blue-50 text-blue-700 border-blue-200" },
  interviewed: { label: "Đã phỏng vấn", color: "bg-purple-50 text-purple-700 border-purple-200" },
  hired: { label: "Đã trúng tuyển", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  bonus_paid: { label: "Đã chi trả thưởng", color: "bg-teal-50 text-teal-700 border-teal-200" },
  rejected: { label: "Chưa phù hợp", color: "bg-slate-100 text-slate-600 border-slate-200" },
};

export default function EmployeeReferralPage() {
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [jobs, setJobs] = useState<JobPostingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    job_id: "",
    candidate_name: "",
    candidate_email: "",
    candidate_phone: "",
    cv_url: "",
    relationship_note: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [refRes, jobRes] = await Promise.all([
        fetchMyReferrals(),
        fetchPublicJobs({ page_size: 100 }),
      ]);
      setReferrals(refRes.items);
      setJobs(jobRes.items);
    } catch (err: any) {
      setError(err.message || "Không thể tải dữ liệu giới thiệu nhân sự.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.job_id) {
      setError("Vui lòng chọn vị trí tuyển dụng giới thiệu.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await createReferral({
        job_id: Number(form.job_id),
        candidate_name: form.candidate_name,
        candidate_email: form.candidate_email,
        candidate_phone: form.candidate_phone,
        cv_url: form.cv_url,
        relationship_note: form.relationship_note,
      });
      setNotice("Cảm ơn bạn! Thông tin giới thiệu ứng viên đã được gửi tới Bộ phận Nhân sự.");
      setShowModal(false);
      setForm({
        job_id: "",
        candidate_name: "",
        candidate_email: "",
        candidate_phone: "",
        cv_url: "",
        relationship_note: "",
      });
      loadData();
    } catch (err: any) {
      setError(err.message || "Không thể nộp hồ sơ giới thiệu.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalEarned = referrals
    .filter((r) => r.status === "bonus_paid" || r.status === "hired")
    .reduce((acc, curr) => acc + (curr.bonus_amount || 0), 0);

  return (
    <AccountWorkspaceShell>
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Cổng Giới thiệu Nhân sự Nội bộ (Internal Referral)</h1>
            <p className="text-sm text-slate-500">Giới thiệu bạn bè, đồng nghiệp cũ và nhận tiền thưởng tuyển dụng hấp dẫn từ Công ty.</p>
          </div>
          <Button onClick={() => setShowModal(true)}>
            Giới thiệu Ứng viên ngay <Icon name="arrow" />
          </Button>
        </div>

        {error && <Alert variant="error">{error}</Alert>}
        {notice && <Alert variant="success">{notice}</Alert>}

        {/* Dashboard Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-white border-blue-100">
            <span className="text-xs text-blue-600 font-bold uppercase tracking-wider block">Tổng ứng viên giới thiệu</span>
            <div className="text-3xl font-black text-slate-900 mt-1">{referrals.length} người</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
            <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider block">Ứng viên trúng tuyển</span>
            <div className="text-3xl font-black text-slate-900 mt-1">
              {referrals.filter((r) => r.status === "hired" || r.status === "bonus_paid").length} người
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-amber-50 to-white border-amber-100">
            <span className="text-xs text-amber-600 font-bold uppercase tracking-wider block">Tiền thưởng đã tích lũy</span>
            <div className="text-3xl font-black text-amber-600 mt-1">
              {totalEarned.toLocaleString("vi-VN")} VNĐ
            </div>
          </Card>
        </div>

        {/* Referral History Table */}
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-100 font-bold text-slate-900 text-sm">
            Danh sách Hồ sơ Giới thiệu của Tôi
          </div>
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">Đang tải lịch sử giới thiệu...</div>
          ) : referrals.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">Bạn chưa giới thiệu ứng viên nào. Hãy bấm "Giới thiệu Ứng viên ngay" để bắt đầu!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Mã & Ứng viên</th>
                    <th className="px-5 py-3">Vị trí giới thiệu</th>
                    <th className="px-5 py-3">Thông tin liên hệ</th>
                    <th className="px-5 py-3">Trạng thái xử lý</th>
                    <th className="px-5 py-3 text-right">Tiền thưởng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {referrals.map((ref) => {
                    const st = STATUS_CONFIG[ref.status] || STATUS_CONFIG.pending;
                    return (
                      <tr key={ref.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4">
                          <span className="text-xs font-mono font-bold text-blue-600 block">{ref.code}</span>
                          <span className="font-bold text-slate-900">{ref.candidate_name}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-semibold text-slate-800 block">{ref.job_title}</span>
                          <span className="text-xs text-slate-500">{ref.department_name}</span>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-600">
                          <span className="block font-medium">{ref.candidate_email}</span>
                          <span className="text-slate-400">{ref.candidate_phone}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${st.color}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-slate-900">
                          {ref.bonus_amount > 0 ? `${ref.bonus_amount.toLocaleString("vi-VN")} VNĐ` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Modal Introduce Candidate */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 overflow-y-auto">
            <Card className="w-full max-w-lg p-6 bg-white space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Giới Thiệu Ứng Viên Mới</h2>
              <p className="text-xs text-slate-500">
                Nhập thông tin người quen hoặc đồng nghiệp cũ để gửi tới Bộ phận Tuyển dụng Nhân sự.
              </p>

              <form onSubmit={handleReferralSubmit} className="space-y-3 text-left">
                <label className="block text-xs font-semibold text-slate-700">
                  Vị trí tuyển dụng giới thiệu *
                  <select
                    required
                    value={form.job_id}
                    onChange={(e) => setForm({ ...form, job_id: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">-- Chọn vị trí đang đăng tuyển --</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title} ({j.department_name || "Công ty"})
                      </option>
                    ))}
                  </select>
                </label>

                <Input
                  label="Họ và tên ứng viên *"
                  required
                  placeholder="Nguyễn Văn B"
                  value={form.candidate_name}
                  onChange={(e) => setForm({ ...form, candidate_name: e.target.value })}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Email ứng viên *"
                    type="email"
                    required
                    placeholder="candidate@gmail.com"
                    value={form.candidate_email}
                    onChange={(e) => setForm({ ...form, candidate_email: e.target.value })}
                  />
                  <Input
                    label="Số điện thoại *"
                    required
                    placeholder="0909123456"
                    value={form.candidate_phone}
                    onChange={(e) => setForm({ ...form, candidate_phone: e.target.value })}
                  />
                </div>
                <Input
                  label="Link/URL File CV ứng viên *"
                  required
                  placeholder="https://drive.google.com/cv_file.pdf"
                  value={form.cv_url}
                  onChange={(e) => setForm({ ...form, cv_url: e.target.value })}
                />
                <label className="block text-xs font-semibold text-slate-700">
                  Mối quan hệ & Đánh giá sơ bộ
                  <textarea
                    rows={3}
                    placeholder="Mối quan hệ đồng nghiệp cũ, thế mạnh nổi bật của ứng viên..."
                    value={form.relationship_note}
                    onChange={(e) => setForm({ ...form, relationship_note: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </label>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                    Hủy bỏ
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Đang gửi..." : "Gửi thông tin giới thiệu"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </section>
    </AccountWorkspaceShell>
  );
}
