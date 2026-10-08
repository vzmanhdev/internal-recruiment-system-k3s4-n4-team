"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, BriefcaseBusiness, Building2, CheckCircle2, Clock3, FileText, MapPin, Send, UploadCloud } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { fetchPublicJobDetail, type JobPostingItem } from "@/features/jobs/services/job-posting.service";
import { submitApplication, uploadCv } from "@/features/applications/services/application.service";

const MAX_CV_BYTES = 10 * 1024 * 1024;
const validCvTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

export function PublicJobDetail({ id }: { id: string }) {
  const [job, setJob] = useState<JobPostingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [successCode, setSuccessCode] = useState("");
  const [startedAt] = useState(() => new Date().toISOString());
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", cv_url: "", cv_filename: "", cv_content_type: "", cover_letter: "", current_department: "", website: "" });

  useEffect(() => {
    fetchPublicJobDetail(Number(id)).then(setJob).catch(() => setJob(null)).finally(() => setLoading(false));
  }, [id]);

  const expired = useMemo(() => Boolean(job?.deadline && new Date(job.deadline).getTime() < Date.now()), [job]);

  async function handleCv(file?: File) {
    setError("");
    if (!file) return;
    if (!validCvTypes.includes(file.type)) return setError("CV chỉ chấp nhận tệp PDF hoặc DOCX.");
    if (file.size > MAX_CV_BYTES) return setError("Dung lượng CV tối đa là 10MB.");
    setUploading(true);
    try {
      const result = await uploadCv(file);
      setForm((current) => ({ ...current, cv_url: result.url, cv_filename: result.filename, cv_content_type: result.content_type }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể tải CV.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!job || expired) return;
    setSubmitting(true);
    setError("");
    try {
      const application = await submitApplication({
        job_id: job.id,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        cv_url: form.cv_url,
        cv_filename: form.cv_filename,
        cv_content_type: form.cv_content_type,
        cover_letter: form.cover_letter,
        current_department: form.current_department,
        website: form.website,
        started_at: startedAt,
      });
      setSuccessCode(application.code);
      setShowForm(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể nộp hồ sơ.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <><Header /><main className="container py-20 text-center text-slate-500">Đang tải tin tuyển dụng...</main></>;
  if (!job) return <><Header /><main className="container py-20 text-center"><AlertCircle className="mx-auto h-10 w-10 text-slate-300" /><h1 className="mt-4 text-2xl font-black">Tin tuyển dụng không còn khả dụng</h1><Link href="/jobs" className="mt-4 inline-block font-bold text-blue-600">Quay lại danh sách</Link></main></>;

  return (
    <div className="public-site min-h-screen">
      <Header />
      <main>
        <section className="border-b border-blue-100 bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 text-white">
          <div className="container py-10 sm:py-16">
            <Link href="/jobs" className="inline-flex items-center gap-2 text-sm font-bold text-blue-200 hover:text-white"><ArrowLeft className="h-4 w-4" /> Danh sách việc làm</Link>
            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px] lg:items-end">
              <div>
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold">{job.code}</span>
                <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">{job.title}</h1>
                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm text-blue-100">
                  <span className="flex items-center gap-2"><Building2 className="h-4 w-4" />{job.department_name || "Phòng ban tuyển dụng"}</span>
                  <span className="flex items-center gap-2"><MapPin className="h-4 w-4" />{job.work_location}</span>
                  <span className="flex items-center gap-2"><BriefcaseBusiness className="h-4 w-4" />{job.quantity} chỉ tiêu</span>
                </div>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-200">Hạn nhận hồ sơ</p>
                <p className="mt-1 text-lg font-black">{job.deadline ? new Date(job.deadline).toLocaleDateString("vi-VN") : "Không giới hạn"}</p>
                {expired ? <div className="mt-4 rounded-xl bg-amber-400/15 p-3 text-sm font-bold text-amber-200">Vị trí đã hết hạn nhận hồ sơ</div> : <button onClick={() => setShowForm(true)} className="mt-4 h-12 w-full rounded-xl bg-white font-black text-blue-700 shadow-lg transition hover:bg-blue-50">Ứng tuyển ngay</button>}
              </div>
            </div>
          </div>
        </section>

        <section className="container grid gap-7 py-10 lg:grid-cols-[1fr_330px]">
          <article className="space-y-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
            <div><h2 className="text-xl font-black text-slate-950">Mô tả công việc</h2><p className="mt-3 whitespace-pre-line leading-7 text-slate-600">{job.job_description || "Thông tin đang được cập nhật."}</p></div>
            <div><h2 className="text-xl font-black text-slate-950">Yêu cầu</h2><p className="mt-3 whitespace-pre-line leading-7 text-slate-600">{job.requirements || "Trao đổi chi tiết trong quá trình tuyển dụng."}</p></div>
            <div><h2 className="text-xl font-black text-slate-950">Quyền lợi</h2><p className="mt-3 whitespace-pre-line leading-7 text-slate-600">{job.benefits || "Áp dụng theo chính sách của công ty."}</p></div>
          </article>
          <aside className="space-y-4">
            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6"><Clock3 className="h-7 w-7 text-blue-600" /><h2 className="mt-4 font-black text-slate-950">Quy trình minh bạch</h2><p className="mt-2 text-sm leading-6 text-slate-600">Sau khi nộp, hệ thống cấp mã để bạn tự tra cứu tiến độ hồ sơ.</p><Link href="/application-status" className="mt-4 inline-block text-sm font-bold text-blue-600">Tra cứu hồ sơ →</Link></div>
          </aside>
        </section>
      </main>

      {successCode && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"><div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl"><CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" /><h2 className="mt-4 text-2xl font-black">Nộp hồ sơ thành công</h2><p className="mt-2 text-sm text-slate-500">Hãy lưu mã này để tra cứu lịch sử hồ sơ.</p><div className="mt-5 rounded-2xl bg-blue-50 p-4 font-mono text-2xl font-black text-blue-700">{successCode}</div><div className="mt-6 flex gap-3"><Link href="/application-status" className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white">Tra cứu ngay</Link><button onClick={() => setSuccessCode("")} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-bold">Đóng</button></div></div></div>}

      {showForm && !expired && <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/65 p-4 sm:p-8"><form onSubmit={handleSubmit} className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-600">Ứng tuyển vị trí</p><h2 className="mt-1 text-2xl font-black">{job.title}</h2></div><button type="button" onClick={() => setShowForm(false)} className="rounded-full border px-3 py-1.5 text-sm font-bold">Đóng</button></div>
        {error && <div className="mt-5 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div>}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold">Họ và tên *<input required value={form.full_name} onChange={(e) => setForm({...form, full_name:e.target.value})} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-blue-500" /></label>
          <label className="text-sm font-bold">Email *<input required type="email" value={form.email} onChange={(e) => setForm({...form, email:e.target.value})} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-blue-500" /></label>
          <label className="text-sm font-bold">Số điện thoại *<input required value={form.phone} onChange={(e) => setForm({...form, phone:e.target.value})} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-blue-500" /></label>
          <label className="text-sm font-bold">Phòng ban hiện tại<input value={form.current_department} onChange={(e) => setForm({...form, current_department:e.target.value})} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-blue-500" /></label>
        </div>
        <label className="mt-4 block text-sm font-bold">CV (PDF/DOCX, tối đa 10MB) *<span className="mt-2 flex min-h-24 cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-4 text-blue-700"><UploadCloud />{uploading ? "Đang tải CV..." : form.cv_filename || "Chọn tệp CV"}<input required={!form.cv_url} disabled={uploading} type="file" accept=".pdf,.docx" onChange={(e) => handleCv(e.target.files?.[0])} className="sr-only" /></span></label>
        <label className="mt-4 block text-sm font-bold">Thư giới thiệu<textarea rows={4} value={form.cover_letter} onChange={(e) => setForm({...form, cover_letter:e.target.value})} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-blue-500" /></label>
        <label className="absolute -left-[9999px]" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({...form, website:e.target.value})} /></label>
        <button disabled={submitting || uploading || !form.cv_url} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" />{submitting ? "Đang gửi hồ sơ..." : "Gửi hồ sơ ứng tuyển"}</button>
      </form></div>}
      <Footer />
    </div>
  );
}
