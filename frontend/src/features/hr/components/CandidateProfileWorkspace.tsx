"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, History, Mail, MessageSquareText, Phone, Save, Tags, UserRound } from "lucide-react";
import { HrShell } from "./HrShell";
import { fetchApplicationDetail, updateCandidateProfile, type ApplicationItem } from "@/features/applications/services/application.service";

type Tab = "profile" | "history" | "tags" | "notes";

const statusLabels: Record<string,string> = { applied:"Mới nộp", screening:"Sơ tuyển", interviewing:"Phỏng vấn", offered:"Đã gửi Offer", hired:"Đã tuyển", rejected:"Từ chối", withdrawn:"Đã rút" };

export function CandidateProfileWorkspace({ id }: { id: number }) {
  const [application, setApplication] = useState<ApplicationItem | null>(null);
  const [tab, setTab] = useState<Tab>("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [form, setForm] = useState({ full_name:"", email:"", phone:"", current_company:"", current_position:"", years_of_experience:0, skills:"", education:"", experience_summary:"", recruiter_notes:"", tags:[] as string[] });

  useEffect(() => { fetchApplicationDetail(id).then((data) => {
    setApplication(data);
    const parsed = data.cv_extracted_data || {};
    setForm({ full_name:data.full_name, email:data.email, phone:data.phone, current_company:data.current_company || "", current_position:data.current_position || "", years_of_experience:data.years_of_experience || 0, skills:Array.isArray(parsed.skills) ? parsed.skills.join(", ") : "", education:String(parsed.education || ""), experience_summary:String(parsed.experience_summary || ""), recruiter_notes:data.recruiter_notes || "", tags:data.tags || [] });
  }).catch((reason)=>setError(reason instanceof Error?reason.message:"Không tải được hồ sơ.")).finally(()=>setLoading(false)); }, [id]);

  const cvUrl = useMemo(() => {
    if (!application?.cv_url) return "";
    if (/^https?:/.test(application.cv_url)) return application.cv_url;
    const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    return `${api.replace(/\/api\/v1\/?$/, "")}${application.cv_url}`;
  }, [application]);
  const canPreview = application?.cv_content_type === "application/pdf" || cvUrl.toLowerCase().endsWith(".pdf");

  async function save() {
    setSaving(true); setError(""); setNotice("");
    try {
      const updated = await updateCandidateProfile(id, { full_name:form.full_name, email:form.email, phone:form.phone, current_company:form.current_company, current_position:form.current_position, years_of_experience:form.years_of_experience, tags:form.tags, recruiter_notes:form.recruiter_notes, cv_extracted_data:{ full_name:form.full_name, email:form.email, phone:form.phone, skills:form.skills.split(",").map((item)=>item.trim()).filter(Boolean), education:form.education, experience_summary:form.experience_summary } });
      setApplication(updated); setNotice("Đã lưu thông tin đối chiếu hồ sơ.");
    } catch (reason) { setError(reason instanceof Error?reason.message:"Không thể lưu hồ sơ."); }
    finally { setSaving(false); }
  }
  function addTag() { const value=tagInput.trim(); if(value && !form.tags.includes(value)) setForm({...form,tags:[...form.tags,value]}); setTagInput(""); }

  if (loading) return <HrShell><div className="rounded-3xl bg-white p-10 text-center text-slate-500">Đang tải hồ sơ ứng viên...</div></HrShell>;
  if (!application) return <HrShell><div className="rounded-3xl bg-white p-10 text-center text-rose-600">{error || "Không tìm thấy hồ sơ."}</div></HrShell>;

  const tabs = [
    {id:"profile" as Tab,label:"Thông tin & CV",icon:UserRound},
    {id:"history" as Tab,label:"Lịch sử",icon:History},
    {id:"tags" as Tab,label:"Nhãn",icon:Tags},
    {id:"notes" as Tab,label:"Ghi chú",icon:MessageSquareText},
  ];
  return <HrShell><div className="space-y-6">
    <div className="workspace-hero"><Link href="/hr/applications" className="inline-flex items-center gap-2 text-sm font-bold text-blue-600"><ArrowLeft className="h-4 w-4" /> Danh sách hồ sơ</Link><div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="font-mono text-xs font-bold text-blue-600">{application.code}</div><h1 className="mt-1 text-3xl font-black text-slate-950">{application.full_name}</h1><div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600"><span className="flex items-center gap-2"><Mail className="h-4 w-4" />{application.email}</span><span className="flex items-center gap-2"><Phone className="h-4 w-4" />{application.phone}</span></div></div><div className="rounded-2xl border border-blue-200 bg-white px-5 py-3"><p className="text-xs font-bold uppercase text-slate-400">Vị trí / Trạng thái</p><p className="font-black text-slate-950">{application.job_title}</p><p className="text-sm font-bold text-blue-600">{statusLabels[application.status] || application.status}</p></div></div></div>
    {(notice||error)&&<div className={`rounded-2xl border p-4 text-sm ${error?"border-rose-200 bg-rose-50 text-rose-700":"border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{error||notice}</div>}
    <div className="flex gap-2 overflow-x-auto border-b border-slate-200">{tabs.map((item)=><button key={item.id} onClick={()=>setTab(item.id)} className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold ${tab===item.id?"border-blue-600 text-blue-600":"border-transparent text-slate-500"}`}><item.icon className="h-4 w-4" />{item.label}</button>)}</div>
    {tab==="profile"&&<div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]"><section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-xl font-black">Dữ liệu CV bóc tách</h2><p className="text-sm text-slate-500">Recruiter đối chiếu và chỉnh sửa trước khi lưu.</p></div><button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" />{saving?"Đang lưu":"Lưu đối chiếu"}</button></div><div className="mt-6 grid gap-4 sm:grid-cols-2">
      {[["Họ và tên","full_name"],["Email","email"],["Số điện thoại","phone"],["Công ty hiện tại","current_company"],["Chức danh hiện tại","current_position"]].map(([label,key])=><label key={key} className="text-sm font-bold">{label}<input value={String(form[key as keyof typeof form]??"")} onChange={(e)=>setForm({...form,[key]:e.target.value})} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-blue-500" /></label>)}
      <label className="text-sm font-bold">Số năm kinh nghiệm<input type="number" min={0} max={60} value={form.years_of_experience} onChange={(e)=>setForm({...form,years_of_experience:Number(e.target.value)})} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-blue-500" /></label>
      <label className="text-sm font-bold sm:col-span-2">Kỹ năng (phân cách bằng dấu phẩy)<input value={form.skills} onChange={(e)=>setForm({...form,skills:e.target.value})} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-blue-500" /></label>
      <label className="text-sm font-bold sm:col-span-2">Học vấn<textarea rows={3} value={form.education} onChange={(e)=>setForm({...form,education:e.target.value})} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-blue-500" /></label>
      <label className="text-sm font-bold sm:col-span-2">Tóm tắt kinh nghiệm<textarea rows={4} value={form.experience_summary} onChange={(e)=>setForm({...form,experience_summary:e.target.value})} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-blue-500" /></label>
    </div></section><section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-200 p-5"><div><h2 className="font-black">Xem trước CV</h2><p className="text-xs text-slate-500">{application.cv_filename || "Tệp hồ sơ ứng viên"}</p></div><a href={cvUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-600">Mở tệp ↗</a></div>{canPreview?<iframe title="Xem trước CV" src={cvUrl} className="h-[720px] w-full bg-slate-100" />:<div className="grid h-96 place-items-center p-8 text-center"><div><FileText className="mx-auto h-12 w-12 text-blue-400" /><p className="mt-4 font-bold">DOCX không xem trực tiếp trong trình duyệt</p><a href={cvUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-bold text-blue-600">Tải CV để xem</a></div></div>}</section></div>}
    {tab==="history"&&<section className="rounded-3xl border border-slate-200 bg-white p-6"> <h2 className="text-xl font-black">Lịch sử hồ sơ</h2><div className="mt-6 space-y-5">{application.logs.map((log)=><div key={log.id} className="flex gap-4"><div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-blue-500 ring-4 ring-blue-100" /><div><p className="font-bold">{statusLabels[log.to_status]||log.to_status}</p><p className="text-sm text-slate-600">{log.note}</p><p className="mt-1 text-xs text-slate-400">{new Date(log.created_at).toLocaleString("vi-VN")} · {log.user_name||"Hệ thống"}</p></div></div>)}</div></section>}
    {tab==="tags"&&<section className="rounded-3xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-black">Nhãn hồ sơ</h2><div className="mt-5 flex gap-2"><input value={tagInput} onChange={(e)=>setTagInput(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter"){e.preventDefault();addTag();}}} placeholder="Ví dụ: Tiềm năng, Senior" className="h-11 flex-1 rounded-xl border border-slate-200 px-3 outline-none focus:border-blue-500"/><button onClick={addTag} className="rounded-xl bg-blue-600 px-5 font-bold text-white">Thêm</button></div><div className="mt-5 flex flex-wrap gap-2">{form.tags.map((tag)=><button key={tag} onClick={()=>setForm({...form,tags:form.tags.filter((item)=>item!==tag)})} className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">{tag} ×</button>)}</div><button onClick={save} className="mt-6 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white">Lưu nhãn</button></section>}
    {tab==="notes"&&<section className="rounded-3xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-black">Ghi chú nội bộ</h2><p className="mt-1 text-sm text-slate-500">Chỉ Admin, HR Manager và Recruiter có quyền xem.</p><textarea rows={10} value={form.recruiter_notes} onChange={(e)=>setForm({...form,recruiter_notes:e.target.value})} placeholder="Ghi nhận thông tin trao đổi, điểm cần xác minh..." className="mt-5 w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-blue-500"/><button onClick={save} className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white">Lưu ghi chú</button></section>}
  </div></HrShell>;
}
