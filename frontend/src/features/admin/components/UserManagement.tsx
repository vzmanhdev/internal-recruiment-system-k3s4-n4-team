"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, LockKeyhole, Mail, Plus, Search, ShieldCheck, UnlockKeyhole, Users } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ApiError } from "@/lib/api-client";
import { AccountStatus, ManagedUser, userService, UsersPage } from "../services/user.service";

const ROLE_OPTIONS = [
  {value:"interviewer",label:"Người phỏng vấn"},
  {value:"approver",label:"Ban phê duyệt ngoại lệ"},
  {value:"recruiter",label:"Nhân viên tuyển dụng"},
  {value:"employee",label:"Nhân sự nội bộ"},
  {value:"candidate",label:"Ứng viên"},
  {value:"manager",label:"Quản lý"},
  {value:"hr_manager",label:"Nhân sự"},
  {value:"admin",label:"Quản trị viên"},
];
const STATUS_LABELS: Record<AccountStatus,string> = {active:"Đang hoạt động",pending:"Chờ phê duyệt",locked:"Đã khóa"};
const STATUS_STYLES: Record<AccountStatus,string> = {active:"bg-emerald-50 text-emerald-700",pending:"bg-amber-50 text-amber-700",locked:"bg-red-50 text-red-700"};
const roleLabel=(role:string)=>ROLE_OPTIONS.find(item=>item.value===role)?.label??role;

function Modal({title,children,onClose}:{title:string;children:React.ReactNode;onClose:()=>void}) {
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/45 p-3 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"><div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-xl font-extrabold text-slate-950">{title}</h2><button onClick={onClose} className="rounded-lg px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100">Đóng</button></div>{children}</div></div>;
}

export function UserManagement() {
  const [data,setData]=useState<UsersPage>({items:[],total:0,page:1,page_size:20,pages:1});
  const [page,setPage]=useState(1);
  const [search,setSearch]=useState(""); const [status,setStatus]=useState("all"); const [role,setRole]=useState("all");
  const [appliedSearch,setAppliedSearch]=useState(""); const [appliedStatus,setAppliedStatus]=useState("all"); const [appliedRole,setAppliedRole]=useState("all");
  const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const [notice,setNotice]=useState("");
  const [createOpen,setCreateOpen]=useState(false); const [roleUser,setRoleUser]=useState<ManagedUser|null>(null); const [lockUser,setLockUser]=useState<ManagedUser|null>(null);

  const [statistics,setStatistics]=useState<{total:number;active:number;locked:number}|null>(null);
  const [statisticsRevision,setStatisticsRevision]=useState(0);
  useEffect(()=>{
    let current=true;
    Promise.all([userService.list({pageSize:1}),userService.list({status:"active",pageSize:1}),userService.list({status:"locked",pageSize:1})])
      .then(([all,active,locked])=>{if(current)setStatistics({total:all.total,active:active.total,locked:locked.total});})
      .catch(()=>{if(current)setStatistics(null);});
    return()=>{current=false;};
  },[statisticsRevision]);

  const load=(showLoading=true)=>{
    if(showLoading)setLoading(true); setError("");
    return userService.list({search:appliedSearch,status:appliedStatus,role:appliedRole,page,pageSize:20}).then(setData).catch((err:unknown)=>setError(err instanceof ApiError?err.message:"Không thể tải danh sách tài khoản.")).finally(()=>setLoading(false));
  };
  useEffect(()=>{let active=true; userService.list({search:appliedSearch,status:appliedStatus,role:appliedRole,page,pageSize:20}).then(result=>{if(active){setData(result);setLoading(false);}}).catch((err:unknown)=>{if(active){setError(err instanceof ApiError?err.message:"Không thể tải danh sách tài khoản.");setLoading(false);}}); return()=>{active=false};},[appliedSearch,appliedStatus,appliedRole,page]);

  const applyFilters=(event:FormEvent)=>{event.preventDefault();setPage(1);setAppliedSearch(search);setAppliedStatus(status);setAppliedRole(role);};
  const afterAction=(message:string)=>{setNotice(message);setStatisticsRevision(current=>current+1);void load(false);};

  return <div className="mx-auto max-w-[1400px] space-y-6 animate-[fadeIn_.25s_ease-out]">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2 text-sm font-bold text-blue-600"><Users className="h-4 w-4"/>Quản trị người dùng</div><h1 className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">Quản lý Người Dùng & Tài Khoản</h1><p className="mt-2 text-sm text-slate-500">Theo dõi, phân quyền và kiểm soát quyền truy cập của nhân sự trong toàn hệ thống.</p></div></header>
    {error&&<Alert variant="error" title="Không thể thực hiện">{error}</Alert>}{notice&&<Alert variant="success" title="Thành công">{notice}</Alert>}
    <section aria-label="Thống kê tài khoản" className="grid gap-4 sm:grid-cols-3">
      {[
        {label:"Tổng số tài khoản",value:statistics?.total,detail:"Tất cả tài khoản trong hệ thống",icon:Users,tone:"text-blue-600 bg-blue-50"},
        {label:"Tài khoản đang hoạt động",value:statistics?.active,detail:"Có quyền truy cập hệ thống",icon:CheckCircle2,tone:"text-emerald-600 bg-emerald-50"},
        {label:"Tài khoản bị khóa",value:statistics?.locked,detail:"Tạm ngưng quyền truy cập",icon:LockKeyhole,tone:"text-rose-600 bg-rose-50"},
      ].map(({label,value,detail,icon:Icon,tone})=><Card key={label} className="p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tone}`}><Icon className="h-5 w-5"/></span></div><p className={`mt-5 text-3xl font-extrabold ${label==="Tài khoản đang hoạt động"?"text-emerald-600":label==="Tài khoản bị khóa"?"text-rose-600":"text-slate-900"}`}>{value??"—"}</p><p className="mt-2 text-xs text-slate-500">{statistics?detail:"Chưa tải được thống kê"}</p></Card>)}
    </section>
    <Card className="overflow-hidden p-0"><form onSubmit={applyFilters} className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-[minmax(180px,1fr)_180px_180px_auto_auto]"><Input aria-label="Tìm tài khoản" placeholder="Tìm theo tên hoặc email" value={search} onChange={e=>setSearch(e.target.value)} leftIcon={<Search className="h-4 w-4"/>}/><Select aria-label="Lọc trạng thái" value={status} onChange={e=>setStatus(e.target.value)} options={[{value:"all",label:"Tất cả trạng thái"},{value:"active",label:"Đang hoạt động"},{value:"pending",label:"Chờ phê duyệt"},{value:"locked",label:"Đã khóa"}]}/><Select aria-label="Lọc vai trò" value={role} onChange={e=>setRole(e.target.value)} options={[{value:"all",label:"Tất cả vai trò"},...ROLE_OPTIONS]}/><Button type="submit" variant="outline">Lọc</Button><Button onClick={()=>setCreateOpen(true)} leftIcon={<Plus className="h-4 w-4"/>}>Tạo tài khoản mới</Button></form>
    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5"><b className="text-sm text-slate-900">{data.total} tài khoản</b><span className="text-xs text-slate-500">20 dòng mỗi trang</span></div><div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_140px_auto] gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-4 text-xs font-bold uppercase text-slate-500 xl:grid"><span>Họ tên & nhân sự</span><span>Email công việc</span><span>Vai trò</span><span>Trạng thái</span><span className="min-w-44 text-right">Hành động</span></div>{loading?<div className="p-12 text-center text-sm text-slate-500">Đang tải dữ liệu...</div>:data.items.length===0?<div className="p-12 text-center text-sm text-slate-500">Không tìm thấy tài khoản phù hợp.</div>:<div className="divide-y divide-slate-100">{data.items.map(user=><article key={user.id} className="grid gap-4 p-4 transition-colors hover:bg-slate-50 sm:p-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1fr)_140px_auto] xl:items-center"><div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">{user.full_name.split(" ").slice(-2).map(word=>word[0]).join("").toUpperCase()}</span><div className="min-w-0"><h2 className="truncate text-sm font-bold text-slate-950" title={user.full_name}>{user.full_name}</h2><p className="mt-1 text-xs text-slate-400">USR-{String(user.id).padStart(3,"0")}</p></div></div><div className="flex min-w-0 items-center gap-2 text-sm text-slate-500"><Mail className="h-4 w-4 shrink-0"/><span className="truncate" title={user.email}>{user.email}</span></div><div className="flex flex-wrap gap-1.5">{user.roles.map(item=><span key={item} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{roleLabel(item)}</span>)}</div><div><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[user.account_status]}`}>{STATUS_LABELS[user.account_status]}</span>{user.lock_reason&&<p className="mt-1 text-xs text-red-600" title={user.lock_reason}>{user.lock_reason}</p>}</div><div className="flex flex-wrap gap-2 lg:justify-end"><Button size="sm" variant="outline" onClick={()=>setRoleUser(user)} leftIcon={<ShieldCheck className="h-3.5 w-3.5"/>}>Vai trò</Button>{user.account_status==="locked"?<Button size="sm" variant="outline" onClick={()=>void userService.unlock(user.id).then(()=>afterAction(`Đã mở khóa ${user.full_name}.`)).catch((err:unknown)=>setError(err instanceof ApiError?err.message:"Không thể mở khóa."))} leftIcon={<UnlockKeyhole className="h-3.5 w-3.5"/>}>Mở khóa</Button>:<Button size="sm" variant="danger" onClick={()=>setLockUser(user)} leftIcon={<LockKeyhole className="h-3.5 w-3.5"/>}>Khóa</Button>}</div></article>)}</div>}
      <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"><span className="text-sm text-slate-500">Trang {data.page}/{data.pages}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page<=1} onClick={()=>setPage(current=>current-1)}>Trang trước</Button><Button size="sm" variant="outline" disabled={page>=data.pages} onClick={()=>setPage(current=>current+1)}>Trang sau</Button></div></div>
    </Card>
    {createOpen&&<CreateUserModal onClose={()=>setCreateOpen(false)} onCreated={name=>{setCreateOpen(false);afterAction(`Đã tạo tài khoản cho ${name}.`)}}/>}
    {roleUser&&<RoleModal user={roleUser} onClose={()=>setRoleUser(null)} onSaved={()=>{setRoleUser(null);afterAction("Đã cập nhật vai trò tài khoản.")}}/>}
    {lockUser&&<LockModal user={lockUser} onClose={()=>setLockUser(null)} onLocked={()=>{setLockUser(null);afterAction(`Đã khóa tài khoản ${lockUser.full_name}.`)}}/>}
  </div>;
}

function RoleChecks({roles,onChange}:{roles:string[];onChange:(roles:string[])=>void}) {return <div className="grid gap-2 sm:grid-cols-2">{ROLE_OPTIONS.map(item=><label key={item.value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-blue-50"><input type="checkbox" checked={roles.includes(item.value)} onChange={e=>onChange(e.target.checked?[...roles,item.value]:roles.filter(role=>role!==item.value))} className="h-4 w-4 accent-blue-600"/>{item.label}</label>)}</div>}

function CreateUserModal({onClose,onCreated}:{onClose:()=>void;onCreated:(name:string)=>void}) {
  const [form,setForm]=useState({full_name:"",email:"",phone:"",password:"",roles:["employee"]}); const [error,setError]=useState(""); const [fieldErrors,setFieldErrors]=useState<Record<string,string>>({}); const [saving,setSaving]=useState(false);
  const submit=async(event:FormEvent)=>{event.preventDefault();setError("");if(form.roles.length===0){setError("Cần chọn ít nhất một vai trò.");return}setSaving(true);try{await userService.create(form);onCreated(form.full_name)}catch(err:unknown){if(err instanceof ApiError){setError(err.message);setFieldErrors(err.fieldErrors??{})}else setError("Không thể tạo tài khoản.")}finally{setSaving(false)}};
  return <Modal title="Thêm tài khoản mới" onClose={onClose}>{error&&<Alert variant="error" className="mb-4">{error}</Alert>}<form onSubmit={submit} className="space-y-4"><Input label="Họ và tên" required value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/><Input label="Email công ty" type="email" required error={fieldErrors.email} value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><Input label="Số điện thoại" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/><Input label="Mật khẩu tạm thời" type="password" required minLength={8} helperText="Tối thiểu 8 ký tự, gồm chữ và số." value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/><div><p className="mb-2 text-sm font-semibold text-slate-800">Vai trò</p><RoleChecks roles={form.roles} onChange={roles=>setForm({...form,roles})}/></div><Button type="submit" isLoading={saving} className="w-full">Tạo tài khoản</Button></form></Modal>;
}

function RoleModal({user,onClose,onSaved}:{user:ManagedUser;onClose:()=>void;onSaved:()=>void}) {const [roles,setRoles]=useState(user.roles);const [error,setError]=useState("");const [saving,setSaving]=useState(false);const save=async()=>{if(!roles.length){setError("Cần giữ lại ít nhất một vai trò.");return}setSaving(true);try{await userService.updateRoles(user.id,roles);onSaved()}catch(err:unknown){setError(err instanceof ApiError?err.message:"Không thể cập nhật vai trò.")}finally{setSaving(false)}};return <Modal title={`Vai trò của ${user.full_name}`} onClose={onClose}>{error&&<Alert variant="error" className="mb-4">{error}</Alert>}<RoleChecks roles={roles} onChange={setRoles}/><Button onClick={()=>void save()} isLoading={saving} className="mt-5 w-full">Lưu thay đổi</Button></Modal>}

function LockModal({user,onClose,onLocked}:{user:ManagedUser;onClose:()=>void;onLocked:()=>void}) {const [reason,setReason]=useState("");const [error,setError]=useState("");const [saving,setSaving]=useState(false);const submit=async(event:FormEvent)=>{event.preventDefault();if(reason.trim().length<5){setError("Lý do khóa là bắt buộc và phải có ít nhất 5 ký tự.");return}setSaving(true);try{await userService.lock(user.id,reason);onLocked()}catch(err:unknown){setError(err instanceof ApiError?err.message:"Không thể khóa tài khoản.")}finally{setSaving(false)}};return <Modal title={`Khóa tài khoản ${user.full_name}`} onClose={onClose}>{error&&<Alert variant="error" className="mb-4">{error}</Alert>}<form onSubmit={submit}><label className="text-sm font-semibold text-slate-800" htmlFor="lock-reason">Lý do khóa *</label><textarea id="lock-reason" required minLength={5} maxLength={500} value={reason} onChange={e=>setReason(e.target.value)} placeholder="Nhập lý do để lưu vào lịch sử quản trị" className="mt-2 min-h-32 w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"/><Button type="submit" variant="danger" isLoading={saving} className="mt-4 w-full">Xác nhận khóa tài khoản</Button></form></Modal>}
