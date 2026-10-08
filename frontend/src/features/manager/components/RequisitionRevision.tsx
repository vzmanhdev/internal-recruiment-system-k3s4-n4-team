"use client";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { updateRequisition, submitRequisition, type RequisitionItem } from "@/features/hr/services/requisition.service";

export function RequisitionRevision({req,onSaved}:{req:RequisitionItem;onSaved:()=>Promise<void>}) {
  const [title,setTitle]=useState(req.title);
  const [description,setDescription]=useState(req.job_description ?? "");
  const [deadline,setDeadline]=useState(req.deadline?.slice(0,10) ?? "");
  const [quantity,setQuantity]=useState(req.quantity);
  const [salary,setSalary]=useState(String(req.max_salary ?? ""));
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  async function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault(); setBusy(true);setError("");
    try {await updateRequisition(req.id,{title,job_description:description,quantity,max_salary:salary?Number(salary):undefined,deadline:deadline||null});await submitRequisition(req.id);await onSaved();}
    catch(error){setError(error instanceof Error?error.message:"Không thể gửi lại yêu cầu.");}
    finally{setBusy(false);}
  }
  return <form onSubmit={save} className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4"><h3 className="font-bold">Chỉnh sửa và gửi phê duyệt</h3>{error&&<Alert variant="error">{error}</Alert>}<Input label="Tên vị trí" required minLength={3} maxLength={255} value={title} onChange={event=>setTitle(event.target.value)}/><div className="grid gap-3 sm:grid-cols-2"><Input label="Số lượng" type="number" min={1} max={100} required value={quantity} onChange={event=>setQuantity(Number(event.target.value))}/><Input label="Lương tối đa / người" type="number" min={req.min_salary??0} required value={salary} onChange={event=>setSalary(event.target.value)}/></div><Input label="Hạn tuyển dụng" type="date" value={deadline} onChange={event=>setDeadline(event.target.value)}/><label className="block text-sm font-semibold">Mô tả bổ sung<textarea required rows={4} value={description} onChange={event=>setDescription(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 p-3 font-normal"/></label><Button type="submit" disabled={busy}>{busy?"Đang gửi...":"Lưu và gửi phê duyệt"}</Button></form>;
}
