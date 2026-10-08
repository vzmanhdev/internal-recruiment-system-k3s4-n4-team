"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { CheckCircle2, ClipboardCheck, FileText, Users, Wallet, X } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ApiError } from "@/lib/api-client";
import { HrShell } from "./HrShell";
import { fetchDepartments, type Department } from "../services/hr.service";
import { approveRequisition, fetchRequisitions, rejectRequisition, requestRequisitionChange, copyRequisition, isRequisitionOverdue, type RequisitionItem } from "../services/requisition.service";
import { ApprovalTimeline } from "./ApprovalTimeline";
import { DecisionDialog } from "./DecisionDialog";
import { PublicJobContent } from "@/features/jobs/components/PublicJobContent";
import { headcountService, type BudgetCheck, type HeadcountBudget, type Recruiter } from "../services/headcount.service";
import { publishJobPosting, updateJobPosting, type JobPostingItem } from "@/features/jobs/services/job-posting.service";

const money = (value: number) => `${value.toLocaleString("vi-VN")} đ`;
const message = (error: unknown) => error instanceof ApiError ? error.message : "Không thể thực hiện. Vui lòng thử lại.";
const selectClass = "w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm text-slate-700";

function WorkflowDialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close.current();
      if (event.key !== "Tab") return;
      const elements = ref.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea, select, a[href]');
      if (!elements?.length) return;
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", keydown);
    return () => { window.removeEventListener("keydown", keydown); document.body.style.overflow = overflow; previous?.focus(); };
  }, []);
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm"><div ref={ref} role="dialog" aria-modal="true" aria-labelledby="workflow-title" className="max-h-[calc(100dvh-24px)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-xl sm:p-7"><div className="mb-5 flex items-center justify-between gap-3"><h2 id="workflow-title" className="text-xl font-bold text-slate-900">{title}</h2><button aria-label="Đóng" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>{children}</div></div>;
}

export function HeadcountWorkspace() {
  const [budgets, setBudgets] = useState<HeadcountBudget[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [items, setItems] = useState<RequisitionItem[]>([]);
  const [status, setStatus] = useState("pending_hr");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ department: "", count: "", salary: "" });
  const [selected, setSelected] = useState<RequisitionItem | null>(null);
  const [check, setCheck] = useState<BudgetCheck | null>(null);
  const [checking, setChecking] = useState(false);
  const [recruiter, setRecruiter] = useState("");
  const [supportRecruiter, setSupportRecruiter] = useState("");
  const [decision, setDecision] = useState<"reject"|"change"|"override"|null>(null);
  const [search,setSearch] = useState("");
  const [departmentFilter,setDepartmentFilter] = useState("");
  const [lateOnly,setLateOnly] = useState(false);
  const [comment, setComment] = useState("");
  const [dialogError, setDialogError] = useState("");
  const [posting, setPosting] = useState<JobPostingItem | null>(null);
  const [preview, setPreview] = useState(false);
  const [postForm, setPostForm] = useState({ title: "", description: "", requirements: "", benefits: "", deadline: "" });

  const load = useCallback(async () => {
    try {
      const [limits, depts, staff, requests] = await Promise.all([headcountService.budgets(), fetchDepartments(), headcountService.recruiters(), fetchRequisitions({status, search, department_id:departmentFilter?Number(departmentFilter):undefined, page, page_size:20, overdue:lateOnly})]);
      setBudgets(limits); setDepartments(depts); setRecruiters(staff); setItems(requests.items); setPages(requests.pages); setError("");
    } catch (caught) { setError(message(caught)); }
    finally { setLoading(false); }
  }, [page, status, search, departmentFilter, lateOnly]);
  useEffect(() => { queueMicrotask(() => void load()); }, [load]);

  async function saveBudget(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      await headcountService.saveBudget(Number(budgetForm.department), {headcount_limit:Number(budgetForm.count),monthly_salary_limit:Number(budgetForm.salary)});
      setNotice("Đã lưu ngân sách phòng ban."); await load();
    } catch (caught) { setError(message(caught)); }
    finally { setBusy(false); }
  }
  function chooseDepartment(id: string) {
    const current = budgets.find((budget) => budget.department_id === Number(id));
    setBudgetForm({department:id,count:current ? String(current.headcount_limit) : "",salary:current ? String(current.monthly_salary_limit) : ""});
  }
  async function open(req: RequisitionItem) {
    setSupportRecruiter(String(req.support_recruiter_id ?? ""));
    setSelected(req); setCheck(null); setChecking(true); setDialogError(""); setComment(""); setRecruiter(String(req.recruiter_id ?? ""));
    try { setCheck(await headcountService.check(req.id)); }
    catch (caught) { setDialogError(message(caught)); }
    finally { setChecking(false); }
  }
  async function act(action: "approve" | "reject" | "change" | "assign" | "posting", opinion=comment, override=false) {
    if (!selected) return;
    if (["reject","change"].includes(action) && opinion.trim().length<5) throw new Error("Nhập ý kiến có ít nhất 5 ký tự.");
    if (action === "assign" && !recruiter) return setDialogError("Vui lòng chọn nhân viên tuyển dụng.");
    setBusy(true); setDialogError("");
    try {
      if (action === "posting") {
        const job = await headcountService.posting(selected.id);
        setPosting(job); setPreview(false); setPostForm({title:job.title,description:job.job_description ?? "",requirements:job.requirements ?? "",benefits:job.benefits ?? "",deadline:job.deadline?.slice(0,10) ?? ""});
        setSelected(null);
      } else {
        const result = action === "approve" ? await approveRequisition(selected.id, opinion, override) : action === "reject" ? await rejectRequisition(selected.id, opinion) : action === "change" ? await requestRequisitionChange(selected.id, opinion) : await headcountService.assign(selected.id, Number(recruiter),supportRecruiter?Number(supportRecruiter):null);
        setSelected(["reject","change"].includes(action) ? null : result);
        setNotice(action === "approve" ? "Đã duyệt và giữ ngân sách. Tiếp tục phân công nhân viên tuyển dụng." : action === "assign" ? "Đã phân công nhân viên tuyển dụng." : action==="change"?"Đã gửi ý kiến yêu cầu bổ sung.":"Đã từ chối tờ trình.");
        if (action === "approve") setCheck(await headcountService.check(selected.id));
      }
      await load();
    } catch (caught) { setDialogError(message(caught)); if (["reject","change"].includes(action)||override) throw caught; }
    finally { setBusy(false); }
  }
  async function savePosting(publish: boolean) {
    if (!posting) return;
    if(publish&&!preview)return setDialogError("Vui lòng xem trước giao diện công khai trước khi xuất bản.");
    if (publish && (!postForm.description.trim() || !postForm.requirements.trim())) return setDialogError("Bổ sung mô tả công việc và yêu cầu ứng viên trước khi xuất bản.");
    const today = new Date(); const date = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
    if (postForm.deadline && postForm.deadline < date) return setDialogError("Hạn tuyển dụng không được ở quá khứ.");
    if (postForm.title.trim().length < 3) return setDialogError("Tiêu đề tin cần ít nhất 3 ký tự.");
    setBusy(true); setDialogError("");
    try {
      const updated = await updateJobPosting(posting.id, {title:postForm.title.trim(),job_description:postForm.description,requirements:postForm.requirements,benefits:postForm.benefits,deadline:postForm.deadline ? `${postForm.deadline}T23:59:59` : null});
      setPosting(publish ? await publishJobPosting(updated.id) : updated);
      setNotice(publish ? "Đã xuất bản tin. Ứng viên có thể xem tại trang Cơ hội nghề nghiệp." : "Đã lưu nội dung tin tuyển dụng.");
      await load();
    } catch (caught) { setDialogError(message(caught)); }
    finally { setBusy(false); }
  }

  return <HrShell><div className="space-y-6">
    <div className="workspace-hero"><p className="flex items-center gap-2 text-sm font-bold text-blue-600"><Wallet className="h-4 w-4" />Trưởng phòng Nhân sự</p><h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">Headcount & xuất bản tuyển dụng</h1><p className="mt-2 text-sm text-slate-500">Kiểm soát ngân sách → Duyệt tờ trình → Phân công tuyển dụng → Soạn và xuất bản tin.</p></div>
    {error && <Alert variant="error">{error}</Alert>}{notice && <Alert variant="success">{notice}</Alert>}
    <div className="grid gap-4 sm:grid-cols-3">{[
      {label:"Headcount đã phê duyệt",value:budgets.reduce((sum,b)=>sum+b.reserved_headcount,0),icon:Users},
      {label:"Headcount còn lại",value:budgets.reduce((sum,b)=>sum+b.remaining_headcount,0),icon:ClipboardCheck},
      {label:"Quỹ lương còn lại / tháng",value:money(budgets.reduce((sum,b)=>sum+b.remaining_monthly_salary,0)),icon:Wallet},
    ].map(({label,value,icon:Icon})=><Card key={label}><Icon className="h-5 w-5 text-blue-600"/><p className="mt-3 text-xs text-slate-500">{label}</p><p className="mt-2 break-words text-2xl font-bold text-slate-950">{loading ? "…" : value}</p></Card>)}</div>
    <Card><h2 className="text-lg font-bold text-slate-900">Ngân sách theo phòng ban</h2><p className="mt-1 text-xs leading-5 text-slate-500">Quỹ lương tính bằng mức lương tối đa × số người, đơn vị VND/tháng. Ngân sách được giữ khi HR duyệt; tạm dừng tin không giải phóng định biên đã duyệt.</p>
      <form onSubmit={saveBudget} className="mt-5 grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]"><label className="text-sm font-semibold text-slate-700">Phòng ban<select aria-label="Phòng ban ngân sách" className={`mt-2 ${selectClass}`} required value={budgetForm.department} onChange={event=>chooseDepartment(event.target.value)}><option value="">Chọn phòng ban</option>{departments.map(dept=><option key={dept.id} value={dept.id}>{dept.name}</option>)}</select></label><Input label="Hạn mức headcount" type="number" min={0} max={100000} step={1} required value={budgetForm.count} onChange={event=>setBudgetForm({...budgetForm,count:event.target.value})}/><Input label="Quỹ lương tháng (VND)" type="number" min={0} max={10**15} step={1} required value={budgetForm.salary} onChange={event=>setBudgetForm({...budgetForm,salary:event.target.value})}/><Button type="submit" disabled={busy || !budgetForm.department}>Lưu ngân sách</Button></form>
      <div className="mt-5 overflow-x-auto rounded-xl border border-[var(--color-border)]"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["Phòng ban","Đã duyệt / hạn mức","Quỹ lương đã giữ / tháng","Quỹ lương còn lại"].map(label=><th key={label} className="px-4 py-3">{label}</th>)}</tr></thead><tbody>{budgets.map(budget=><tr key={budget.id} className="border-t border-slate-100"><td className="px-4 py-3 font-semibold">{budget.department_name}</td><td className="px-4 py-3">{budget.reserved_headcount} / {budget.headcount_limit}</td><td className="px-4 py-3">{money(budget.reserved_monthly_salary)}</td><td className="px-4 py-3 text-blue-600">{money(budget.remaining_monthly_salary)}</td></tr>)}</tbody></table></div>{!budgets.length && !loading && <p className="mt-3 text-sm text-slate-500">Chưa có ngân sách. Khai báo hạn mức để bắt đầu phê duyệt.</p>}
    </Card>
    <Card><div className="grid gap-3 sm:grid-cols-2"><Input label="Tìm yêu cầu" placeholder="Mã hoặc vị trí tuyển dụng" value={search} onChange={event=>{setSearch(event.target.value);setPage(1)}}/><Select label="Phòng ban" value={departmentFilter} onChange={event=>{setDepartmentFilter(event.target.value);setPage(1)}} options={[{value:"",label:"Tất cả phòng ban"},...departments.map(dept=>({value:String(dept.id),label:dept.name}))]}/></div><label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={lateOnly} onChange={event=>{setLateOnly(event.target.checked);setPage(1)}}/>Chỉ hiện yêu cầu trễ hạn</label></Card>
    <Card className="overflow-hidden p-0"><div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center"><h2 className="text-lg font-bold text-slate-900">Tờ trình và tin tuyển dụng</h2><Select aria-label="Trạng thái tờ trình" value={status} onChange={event=>{setStatus(event.target.value);setPage(1);}} options={[{value:"pending_hr",label:"Chờ HR phê duyệt"},{value:"approved",label:"Đã duyệt / Đăng tin"},{value:"changes_requested",label:"Yêu cầu bổ sung"},{value:"draft",label:"Bản nháp"},{value:"all",label:"Tất cả tờ trình"}]} className="sm:max-w-60"/></div>
      {loading ? <p className="p-8 text-center text-sm text-slate-500">Đang tải tờ trình...</p> : !items.length ? <p className="p-8 text-center text-sm text-slate-500">Không có tờ trình trong trạng thái này. <Link href="/hr/requisitions" className="text-blue-600">Mở yêu cầu tuyển dụng</Link></p> : items.map(req=><div key={req.id} className={`flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center ${isRequisitionOverdue(req)?"border-l-4 border-l-rose-500 bg-rose-50/60":""}`}><div className="min-w-0"><p className="text-xs font-semibold text-blue-600">{req.code} · {req.department_name}</p><h3 className="mt-1 font-bold text-slate-900">{req.title}</h3><p className="mt-1 text-xs text-slate-500">{req.quantity} nhân sự · Quỹ lương tối đa {money((req.max_salary??0)*req.quantity)}/tháng</p><p className="mt-1 text-xs text-slate-500">{req.status === "approved" ? `Đã duyệt · ${req.recruiter_name ?? "Chưa phân công tuyển dụng"}` : req.status === "pending_hr" ? "Chờ HR kiểm soát ngân sách và duyệt" : req.status==="changes_requested"?"Chờ người đề xuất bổ sung":"Chưa đến bước phê duyệt HR"}</p>{isRequisitionOverdue(req)&&<p className="mt-1 text-xs font-bold text-rose-600">Trễ hạn · {new Date(req.deadline!).toLocaleDateString("vi-VN")}</p>}</div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={busy} onClick={()=>void copyRequisition(req.id).then(()=>{setNotice("Đã sao chép thành bản nháp. Mở Yêu cầu tuyển dụng để chỉnh và gửi duyệt.");return load()}).catch(error=>setError(message(error)))}>Sao chép</Button><Button variant="outline" disabled={busy} onClick={()=>void open(req)} leftIcon={<FileText className="h-4 w-4"/>}>{req.status==="approved"?"Phân công / Đăng tin":"Xem & xử lý"}</Button></div></div>)}
      <div className="flex items-center justify-between gap-3 p-5"><span className="text-xs text-slate-500">Trang {page}/{pages}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page<=1} onClick={()=>setPage(page-1)}>Trước</Button><Button size="sm" variant="outline" disabled={page>=pages} onClick={()=>setPage(page+1)}>Sau</Button></div></div>
    </Card>
    {selected && <WorkflowDialog title={selected.title} onClose={()=>{if(!busy)setSelected(null);}}><div className="space-y-5"><p className="text-xs text-slate-500">{selected.code} · {selected.department_name} · {selected.quantity} nhân sự</p>{dialogError&&<Alert variant="error">{dialogError}</Alert>}{checking?<p className="text-sm text-slate-500">Đang kiểm tra ngân sách...</p>:check&&<Alert variant={check.blocked?"error":"success"} title={check.blocked?"Chặn phê duyệt":check.reserved?"Ngân sách đã được giữ":"Trong ngân sách"}>{check.reason??`${selected.quantity} headcount, dự kiến ${money(check.requested_monthly_salary)}/tháng.`}{check.budget&&<p className="mt-2 text-xs">Còn lại: {check.budget.remaining_headcount} người · {money(check.budget.remaining_monthly_salary)}/tháng</p>}</Alert>}
      <ApprovalTimeline req={selected}/>
      {selected.status==="pending_hr"&&<><Input label="Ghi chú phê duyệt" value={comment} onChange={event=>setComment(event.target.value)}/><div className="flex flex-wrap justify-end gap-3"><Button variant="danger" disabled={busy} onClick={()=>setDecision("reject")}>Từ chối</Button><Button variant="outline" disabled={busy} onClick={()=>setDecision("change")}>Yêu cầu bổ sung</Button><Button disabled={busy||checking||!check||(check.blocked&&!check.overridable)} onClick={()=>check?.blocked?setDecision("override"):void act("approve")} leftIcon={<CheckCircle2 className="h-4 w-4"/>}>{check?.blocked?"Xác nhận ghi đè ngân sách":"Phê duyệt headcount"}</Button></div></>}
      {selected.status==="approved"&&<><label className="block text-sm font-semibold text-slate-700">Recruiter chính<select aria-label="Nhân viên tuyển dụng" value={recruiter} onChange={event=>setRecruiter(event.target.value)} className={`mt-2 ${selectClass}`}><option value="">Chọn nhân viên phụ trách</option>{recruiters.map(user=><option key={user.id} value={user.id}>{user.full_name} · {user.email}</option>)}</select></label><label className="block text-sm font-semibold text-slate-700">Recruiter hỗ trợ<select aria-label="Recruiter hỗ trợ" value={supportRecruiter} onChange={event=>setSupportRecruiter(event.target.value)} className={`mt-2 ${selectClass}`}><option value="">Không có</option>{recruiters.filter(user=>String(user.id)!==recruiter).map(user=><option key={user.id} value={user.id}>{user.full_name} · {user.email}</option>)}</select></label>{!recruiters.length&&<Alert variant="warning">Chưa có nhân viên tuyển dụng đang hoạt động. Admin cần tạo hoặc gán vai trò “Nhân viên tuyển dụng” cho tài khoản.</Alert>}<div className="flex flex-wrap justify-end gap-3"><Button variant="outline" disabled={busy||!recruiter||recruiter===supportRecruiter} onClick={()=>void act("assign")}>Lưu phân công</Button><Button disabled={busy||!selected.recruiter_id||checking||!check||check.blocked} onClick={()=>void act("posting")}>Soạn tin tuyển dụng</Button></div></>}
    </div></WorkflowDialog>}
    {decision&&<DecisionDialog kind={decision} onClose={()=>setDecision(null)} onConfirm={opinion=>act(decision==="override"?"approve":decision,opinion,decision==="override")}/>}
    {posting&&<WorkflowDialog title={posting.status==="published"?"Tin đã xuất bản":"Soạn tin tuyển dụng"} onClose={()=>{if(!busy)setPosting(null);}}><div className="space-y-4">{dialogError&&<Alert variant="error">{dialogError}</Alert>}<Alert variant="info">{posting.requisition_code} · {posting.quantity} nhân sự · {posting.department_name}. Headcount và dải lương lấy từ tờ trình đã duyệt.</Alert><Input label="Tiêu đề tin" minLength={3} maxLength={255} value={postForm.title} onChange={event=>{setPreview(false);setPostForm({...postForm,title:event.target.value})}}/>{([['description','Mô tả công việc'],['requirements','Yêu cầu ứng viên'],['benefits','Quyền lợi']] as const).map(([key,label])=><label key={key} className="block text-sm font-semibold text-slate-700">{label}<textarea aria-label={label} rows={4} value={postForm[key]} onChange={event=>{setPreview(false);setPostForm({...postForm,[key]:event.target.value})}} className="mt-2 w-full rounded-xl border border-[var(--color-border)] p-3 text-sm font-normal"/></label>)}<Input label="Hạn tuyển dụng" type="date" value={postForm.deadline} onChange={event=>{setPreview(false);setPostForm({...postForm,deadline:event.target.value})}}/><Button variant="ghost" onClick={()=>setPreview(!preview)}>Xem trước giao diện công khai</Button>{preview&&<section aria-label="Xem trước tin công khai" className="job-preview space-y-4"><PublicJobContent benefits={postForm.benefits} job={{id:String(posting.id),title:postForm.title,department:posting.department_name??"Tuyển dụng nội bộ",location:posting.work_location,employmentType:posting.employment_type==="full_time"?"Toàn thời gian":posting.employment_type==="part_time"?"Bán thời gian":"Hợp đồng",openings:`${posting.quantity} người`,status:"open",description:postForm.description,skills:postForm.requirements.split(",").filter(Boolean),requirements:postForm.requirements.split("\n").filter(Boolean),responsibilities:[],deadline:postForm.deadline?new Date(postForm.deadline).toLocaleDateString("vi-VN"):"Không giới hạn"}} action={<Button disabled>Ứng tuyển ngay</Button>}/></section>}{posting.status==="published"&&<Link href={`/jobs/${posting.id}`} target="_blank" className="block text-sm font-semibold text-blue-600">Xem tin trên trang công khai →</Link>}<div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4"><Button variant="outline" disabled={busy} onClick={()=>void savePosting(false)}>Lưu nội dung</Button><Button disabled={busy||!preview} onClick={()=>void savePosting(true)}>{busy?"Đang xử lý...":"Xuất bản tin"}</Button></div></div></WorkflowDialog>}
  </div></HrShell>;
}
