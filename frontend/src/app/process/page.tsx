"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { 
  Users, Building2, Briefcase, Calculator, GitMerge, ShieldCheck, 
  CheckCircle2, XCircle, RefreshCw, AlertTriangle, ArrowRight, ArrowDown,
  Database, FileCode, Check, X, FileText, Lock, Clock, Send, Eye,
  Sliders, UserCheck, UserPlus, FileCheck, ExternalLink,
  Info, ChevronRight, Layers, CornerDownRight, Workflow
} from "lucide-react";

export default function ProcessPage() {
  const [activeModal, setActiveModal] = useState<"approve" | "reject" | "changes" | "config" | null>(null);
  const [activeSection, setActiveSection] = useState<string>("all");

  return (
    <div className="min-h-screen bg-[#F8FBFF] text-slate-800 font-sans pb-16">
      <Header />

      {/* PAGE HEADER */}
      <div className="bg-white border-b border-slate-200/80 shadow-xs">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 text-[#1677FF] border border-sky-100 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                <Workflow className="w-3.5 h-3.5" />
                Kiến trúc nghiệp vụ hệ thống tuyển dụng
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0F3F8C] tracking-tight">
                Luồng Thiết Kế Chuẩn Theo Product Backlog
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-800">EP-03 — Yêu cầu tuyển dụng & Phê duyệt</span>
                <span>•</span>
                <span className="text-sky-700 font-medium">Sprint 2–3</span>
                <span>•</span>
                <span className="text-slate-500">Cấu hình động theo phòng ban, dải lương & quy tắc nghiệp vụ</span>
              </p>
            </div>

            {/* Quick Interactive Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveModal("config")}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                Demo Cấu hình Flow
              </button>
              <button
                onClick={() => setActiveModal("approve")}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Demo Modal Duyệt
              </button>
              <button
                onClick={() => setActiveModal("changes")}
                className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Demo Modal Bổ sung
              </button>
              <button
                onClick={() => setActiveModal("reject")}
                className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                Demo Modal Từ chối
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CANVAS CONTAINER (1600-1800px) */}
      <main className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-8">
        
        {/* ROW 1: SECTION 1 (STORY LIÊN QUAN) & SECTION 2 (NỀN TẢNG CẤU HÌNH) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* SECTION 1: PHẠM VI STORY LIÊN QUAN (7 COLS) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#1677FF] text-white flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <h2 className="text-base font-extrabold text-[#0F3F8C] tracking-tight uppercase">
                    Phạm Vi Story Liên Quan
                  </h2>
                </div>
                <span className="text-xs text-slate-500 italic">Product Backlog Sprint 2-3</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {/* S2-04 */}
                <div className="p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-sky-50/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">S2-04</span>
                    <Building2 className="w-3 h-3 text-blue-600" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-800 line-clamp-1">HR Manager</p>
                  <p className="text-[10px] text-slate-500 line-clamp-2">Khai báo phòng ban & sơ đồ tổ chức</p>
                </div>

                {/* S2-05 */}
                <div className="p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-sky-50/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">S2-05</span>
                    <Briefcase className="w-3 h-3 text-blue-600" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-800 line-clamp-1">HR Manager</p>
                  <p className="text-[10px] text-slate-500 line-clamp-2">Khai báo chức danh & dải lương</p>
                </div>

                {/* S2-10 */}
                <div className="p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-sky-50/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-sky-100 text-sky-800 rounded">S2-10</span>
                    <Users className="w-3 h-3 text-sky-600" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-800 line-clamp-1">Trưởng bộ phận</p>
                  <p className="text-[10px] text-slate-500 line-clamp-2">Tạo yêu cầu tuyển dụng (Requisition)</p>
                </div>

                {/* S2-01 */}
                <div className="p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-sky-50/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">S2-01</span>
                    <GitMerge className="w-3 h-3 text-blue-600" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-800 line-clamp-1">HR Manager</p>
                  <p className="text-[10px] text-slate-500 line-clamp-2">Cấu hình luồng phê duyệt theo hạn mức</p>
                </div>

                {/* S3-02 */}
                <div className="p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-sky-50/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">S3-02</span>
                    <ShieldCheck className="w-3 h-3 text-amber-600" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-800 line-clamp-1">Người duyệt</p>
                  <p className="text-[10px] text-slate-500 line-clamp-2">Duyệt / Từ chối / Yêu cầu bổ sung</p>
                </div>

                {/* S3-03 */}
                <div className="p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-sky-50/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-sky-100 text-sky-800 rounded">S3-03</span>
                    <Clock className="w-3 h-3 text-sky-600" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-800 line-clamp-1">Trưởng bộ phận</p>
                  <p className="text-[10px] text-slate-500 line-clamp-2">Theo dõi trạng thái & lịch sử duyệt</p>
                </div>

                {/* S3-04 */}
                <div className="p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-sky-50/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">S3-04</span>
                    <Calculator className="w-3 h-3 text-blue-600" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-800 line-clamp-1">HR Manager</p>
                  <p className="text-[10px] text-slate-500 line-clamp-2">Quản lý ngân sách Headcount</p>
                </div>

                {/* S3-06 */}
                <div className="p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-sky-50/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">S3-06</span>
                    <UserPlus className="w-3 h-3 text-blue-600" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-800 line-clamp-1">HR Manager</p>
                  <p className="text-[10px] text-slate-500 line-clamp-2">Phân công Recruiter phụ trách</p>
                </div>

                {/* S3-07 */}
                <div className="p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-sky-50/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">S3-07</span>
                    <AlertTriangle className="w-3 h-3 text-blue-600" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-800 line-clamp-1">HR Manager</p>
                  <p className="text-[10px] text-slate-500 line-clamp-2">Tạm dừng / Đóng / Hủy Requisition</p>
                </div>

                {/* S3-08 */}
                <div className="p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-sky-50/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">S3-08</span>
                    <Eye className="w-3 h-3 text-blue-600" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-800 line-clamp-1">HR Manager</p>
                  <p className="text-[10px] text-slate-500 line-clamp-2">Xem danh sách & cảnh báo trễ hạn</p>
                </div>

                {/* S3-09 */}
                <div className="p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-sky-50/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded">S3-09</span>
                    <FileText className="w-3 h-3 text-indigo-600" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-800 line-clamp-1">Recruiter</p>
                  <p className="text-[10px] text-slate-500 line-clamp-2">Soạn tin tuyển dụng từ Requisition</p>
                </div>

                {/* S3-10 */}
                <div className="p-2.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-sky-50/50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">S3-10</span>
                    <FileCheck className="w-3 h-3 text-blue-600" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-800 line-clamp-1">HR Manager</p>
                  <p className="text-[10px] text-slate-500 line-clamp-2">Duyệt & xuất bản tin tuyển dụng</p>
                </div>
              </div>
            </div>

            <div className="mt-3 p-2 bg-sky-50/60 border border-sky-100 rounded-xl flex items-center justify-between text-[11px] text-sky-800">
              <span>📌 Tất cả 12 User Stories đều được ánh xạ chuẩn xác từ file Product Backlog Excel của dự án.</span>
            </div>
          </div>

          {/* SECTION 2: NỀN TẢNG CẤU HÌNH (5 COLS) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#1677FF] text-white flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h2 className="text-base font-extrabold text-[#0F3F8C] tracking-tight uppercase">
                  Nền Tảng Cấu Hình
                </h2>
              </div>
              <span className="text-xs text-slate-500 italic">Dữ liệu bắt buộc trước khi tạo flow</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Card 1: Phòng Ban */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/30">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F3F8C] mb-1">
                  <Building2 className="w-3.5 h-3.5 text-[#1677FF]" />
                  Phòng ban & Sơ đồ (S2-04)
                </div>
                <ul className="text-[11px] text-slate-600 space-y-0.5 font-mono">
                  <li>• Department / Parent Dept</li>
                  <li>• Manager User ID</li>
                  <li>• Status: Active</li>
                </ul>
              </div>

              {/* Card 2: Chức Danh & Dải Lương */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/30">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F3F8C] mb-1">
                  <Briefcase className="w-3.5 h-3.5 text-[#1677FF]" />
                  Chức danh & Dải lương (S2-05)
                </div>
                <ul className="text-[11px] text-slate-600 space-y-0.5 font-mono">
                  <li>• Position Code & Level</li>
                  <li>• Salary Min - Max</li>
                  <li>• Dept Linkage</li>
                </ul>
              </div>

              {/* Card 3: Headcount Budget */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/30">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F3F8C] mb-1">
                  <Calculator className="w-3.5 h-3.5 text-[#1677FF]" />
                  Ngân sách Headcount (S3-04)
                </div>
                <div className="text-[10px] text-slate-600 font-mono bg-white p-1.5 rounded border border-slate-200 mb-1">
                  Remaining = Approved - Occupied - Committed
                </div>
                <span className="text-[10px] text-amber-700 font-semibold">⚠ Warning khi Request &gt; Remaining</span>
              </div>

              {/* Card 4: Approval Flow Config */}
              <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/30">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 mb-1">
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  Approval Flow Động (S3-01)
                </div>
                <p className="text-[10px] text-slate-600 leading-tight mb-1">
                  Cấu hình theo Dept + Hạn mức lương đề xuất + Cấp duyệt.
                </p>
                <div className="text-[9px] bg-white p-1 rounded text-slate-700 font-mono">
                  Salary &lt;= 25M: 1 cấp<br/>
                  Salary &gt; 40M: 3 cấp
                </div>
              </div>
            </div>

            <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-900 font-medium">
              ⚠ <strong>Lưu ý nghiệp vụ quan trọng:</strong> Hệ thống KHÔNG hardcode danh tính người duyệt. Người duyệt được lấy ĐỘNG từ Approval Flow Version snapshot tại thời điểm gửi duyệt.
            </div>
          </div>

        </div>


        {/* ROW 2: SECTION 3 — LUỒNG NGHIỆP VỤ CHÍNH (FULL WIDTH) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#1677FF] text-white flex items-center justify-center font-black text-base shadow-sm">
                3
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#0F3F8C] tracking-tight uppercase">
                  Luồng Nghiệp Vụ Chính (End-to-End Approval Flow)
                </h2>
                <p className="text-xs text-slate-500">Từ Tạo Yêu Cầu $\rightarrow$ Phê Duyệt Nhiều Cấp $\rightarrow$ Phân Công Recruiter $\rightarrow$ Tạo & Xuất Bản Tin Tuyển Dụng</p>
              </div>
            </div>
          </div>

          {/* FLOW STEPS HORIZONTAL SCROLL CANVAS */}
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[1400px] flex items-stretch gap-3">
              
              {/* STEP 1 */}
              <div className="w-[170px] shrink-0 bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-700 mb-1">
                    <span className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px]">1</span>
                    Tạo Yêu Cầu
                  </div>
                  <p className="text-[11px] font-bold text-slate-800">Trưởng bộ phận</p>
                  <p className="text-[10px] text-slate-500 mt-1">Nhập Chức danh, Số lượng, Lý do, Dải lương đề xuất, JD.</p>
                </div>
                <span className="mt-2 text-[10px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded text-center">Status: DRAFT</span>
              </div>

              <div className="flex items-center text-slate-400"><ChevronRight className="w-4 h-4" /></div>

              {/* STEP 2 */}
              <div className="w-[150px] shrink-0 bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                    <span className="w-4 h-4 rounded-full bg-slate-600 text-white flex items-center justify-center text-[10px]">2</span>
                    Lưu Nháp
                  </div>
                  <p className="text-[11px] font-bold text-slate-800">Requisition Draft</p>
                  <p className="text-[10px] text-slate-500 mt-1">Cho phép chỉnh sửa nhiều lần trước khi Submit.</p>
                </div>
                <span className="mt-2 text-[10px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded text-center">Editable</span>
              </div>

              <div className="flex items-center text-slate-400"><ChevronRight className="w-4 h-4" /></div>

              {/* STEP 3 */}
              <div className="w-[160px] shrink-0 bg-indigo-50/50 border border-indigo-200 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 mb-1">
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">3</span>
                    Backend Check
                  </div>
                  <p className="text-[11px] font-bold text-indigo-950">Validate Ràng Buộc</p>
                  <p className="text-[10px] text-slate-600 mt-1">• Dept & Position ID<br/>• Quyền người dùng<br/>• Dải lương chuẩn</p>
                </div>
                <span className="mt-2 text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded text-center">System Check</span>
              </div>

              <div className="flex items-center text-slate-400"><ChevronRight className="w-4 h-4" /></div>

              {/* STEP 4: DIAMOND HEADCOUNT CHECK */}
              <div className="w-[170px] shrink-0 bg-amber-50/60 border border-amber-300 rounded-xl p-3 flex flex-col justify-between relative">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
                    <span className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">4</span>
                    Check Headcount
                  </div>
                  <p className="text-[11px] font-bold text-amber-950">Vượt chỉ tiêu?</p>
                  <p className="text-[10px] text-amber-800 mt-1">
                    Nếu VƯỢT: Yêu cầu HR Manager nhập <strong>Lý do ghi đè (Override)</strong>.
                  </p>
                </div>
                <div className="mt-2 text-[9px] text-amber-900 bg-amber-200/70 p-1 rounded font-mono text-center">
                  Audit log recorded
                </div>
              </div>

              <div className="flex items-center text-slate-400"><ChevronRight className="w-4 h-4" /></div>

              {/* STEP 5 & 6 & 7: FLOW ENGINE & INSTANCE */}
              <div className="w-[200px] shrink-0 bg-sky-50/50 border border-sky-200 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900 mb-1">
                    <span className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px]">5-7</span>
                    Rule Engine & Instance
                  </div>
                  <p className="text-[11px] font-bold text-slate-800">Tạo Approval Instance</p>
                  <p className="text-[10px] text-slate-600 mt-1">
                    Xác định `approval_flow_version` và Snapshot copy danh sách người duyệt khóa theo phiên bản.
                  </p>
                </div>
                <span className="mt-2 text-[10px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded text-center">Status: PENDING</span>
              </div>

              <div className="flex items-center text-slate-400"><ChevronRight className="w-4 h-4" /></div>

              {/* STEP 8: MULTI-STEP APPROVAL BOX (DOTTED CONTAINER) */}
              <div className="w-[380px] shrink-0 border-2 border-dashed border-sky-300 bg-sky-50/20 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-extrabold text-[#0F3F8C]">
                  <span>8. PHÊ DUYỆT NHIỀU CẤP (Tối đa 3 cấp)</span>
                  <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded">Động</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                  <div className="p-2 bg-white border border-slate-200 rounded-lg text-center shadow-2xs">
                    <span className="font-bold text-slate-700 block">Cấp duyệt 1</span>
                    <span className="text-slate-500 block text-[9px]">Approver theo config</span>
                    <span className="inline-block mt-1 text-[8px] bg-emerald-100 text-emerald-800 px-1 rounded font-bold">✓ Approved</span>
                  </div>

                  <div className="p-2 bg-white border border-slate-200 rounded-lg text-center shadow-2xs">
                    <span className="font-bold text-slate-700 block">Cấp duyệt 2</span>
                    <span className="text-slate-500 block text-[9px]">(Tùy chọn)</span>
                    <span className="inline-block mt-1 text-[8px] bg-sky-100 text-sky-800 px-1 rounded font-bold">● Pending</span>
                  </div>

                  <div className="p-2 bg-white border border-slate-200 rounded-lg text-center shadow-2xs">
                    <span className="font-bold text-slate-700 block">Cấp duyệt 3</span>
                    <span className="text-slate-500 block text-[9px]">(Tùy chọn)</span>
                    <span className="inline-block mt-1 text-[8px] bg-slate-100 text-slate-500 px-1 rounded">Wait</span>
                  </div>
                </div>

                {/* 3 Approver Actions */}
                <div className="pt-1 flex items-center justify-between gap-1">
                  <button 
                    onClick={() => setActiveModal("approve")}
                    className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
                  >
                    <Check className="w-3 h-3" /> Duyệt
                  </button>
                  <button 
                    onClick={() => setActiveModal("reject")}
                    className="flex-1 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
                  >
                    <X className="w-3 h-3" /> Từ chối
                  </button>
                  <button 
                    onClick={() => setActiveModal("changes")}
                    className="flex-1 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Bổ sung
                  </button>
                </div>
              </div>

              <div className="flex items-center text-slate-400"><ChevronRight className="w-4 h-4" /></div>

              {/* STEP 9: CÁC BƯỚC TIẾP THEO SAU KHU DUYỆT */}
              <div className="w-[220px] shrink-0 bg-emerald-50/50 border border-emerald-300 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-1">
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">9</span>
                    Sau Khi Phê Duyệt
                  </div>
                  <p className="text-[11px] font-bold text-emerald-950">HR Manager & Recruiter</p>
                  <ol className="text-[10px] text-slate-700 mt-1 space-y-1 list-decimal pl-3">
                    <li>HR Manager phân công Recruiter phụ trách (S3-06).</li>
                    <li>Recruiter tạo Job Posting từ Requisition (S3-09).</li>
                    <li>HR Manager duyệt & xuất bản tin (S3-10).</li>
                  </ol>
                </div>
                <span className="mt-2 text-[10px] font-bold text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded text-center">Status: APPROVED</span>
              </div>

            </div>
          </div>
        </div>


        {/* ROW 3: SECTION 4 (TRẠNG THÁI & LỊCH SỬ) | SECTION 5 (DATABASE ERD) | SECTION 6 (API FLOW) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* SECTION 4: TRẠNG THÁI & LỊCH SỬ (4 COLS) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#1677FF] text-white flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                  <h2 className="text-base font-extrabold text-[#0F3F8C] tracking-tight uppercase">
                    Trạng Thái & Lịch Sử (S3-03)
                  </h2>
                </div>
              </div>

              {/* State Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2">Trạng thái</th>
                      <th className="p-2">Mô tả</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2 font-bold"><span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px]">DRAFT</span></td>
                      <td className="p-2 text-[11px] text-slate-600">Nháp, chưa gửi duyệt</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold"><span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded-full text-[10px]">PENDING</span></td>
                      <td className="p-2 text-[11px] text-slate-600">Đang trong quy trình duyệt</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold"><span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px]">CHANGES</span></td>
                      <td className="p-2 text-[11px] text-slate-600">Yêu cầu bổ sung thông tin</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold"><span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full text-[10px]">REJECTED</span></td>
                      <td className="p-2 text-[11px] text-slate-600">Từ chối, kết thúc luồng</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px]">APPROVED</span></td>
                      <td className="p-2 text-[11px] text-slate-600">Đã duyệt toàn bộ các cấp</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Timeline Demo */}
              <h3 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#1677FF]" />
                Approval History Timeline (Immutable Audit)
              </h3>
              <div className="space-y-2 relative pl-4 border-l-2 border-slate-200 text-[11px]">
                <div className="relative">
                  <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  <span className="font-bold text-slate-700">01/10 09:10</span> — Hiring Manager tạo & Submit Requisition.
                </div>
                <div className="relative">
                  <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="font-bold text-slate-700">01/10 10:32</span> — HR Manager yêu cầu bổ sung JD.
                </div>
                <div className="relative">
                  <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="font-bold text-slate-700">02/10 09:20</span> — Approver Level 1 đã phê duyệt.
                </div>
              </div>
            </div>

            <div className="mt-4 p-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-600">
              🔒 Lịch sử phê duyệt được ghi nhận vĩnh viễn (Immutable Audit Log), không thể xóa hay chỉnh sửa lại quá khứ.
            </div>
          </div>

          {/* SECTION 5: DATABASE CHUẨN (4 COLS) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#1677FF] text-white flex items-center justify-center font-bold text-sm">
                    5
                  </div>
                  <h2 className="text-base font-extrabold text-[#0F3F8C] tracking-tight uppercase">
                    Database Schema & ERD
                  </h2>
                </div>
              </div>

              <div className="space-y-2 font-mono text-[10px]">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-bold text-[#0F3F8C]">departments</span>: id(PK), code, name, manager_user_id
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-bold text-[#0F3F8C]">job_positions</span>: id(PK), dept_id(FK), code, name, salary_min, salary_max
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="font-bold text-[#0F3F8C]">headcount_budgets</span>: id(PK), dept_id(FK), year, approved_headcount, used_quantity
                </div>
                <div className="p-2 bg-sky-50 rounded-lg border border-sky-200">
                  <span className="font-bold text-sky-900">job_requisitions</span>: id(PK), code, dept_id, position_id, quantity, headcount_overridden
                </div>
                <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-200">
                  <span className="font-bold text-indigo-900">approval_flows</span> & <span className="font-bold text-indigo-900">versions</span>: id(PK), version, effective_from
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="font-bold text-emerald-900">approval_instances</span> & <span className="font-bold text-emerald-900">steps</span>: instance_id, approver_user_id, status
                </div>
              </div>
            </div>

            <div className="mt-4 p-2 bg-indigo-50 border border-indigo-200 rounded-xl text-[10px] text-indigo-900 font-medium">
              💡 <strong>Flow Versioning Rule:</strong> Khi HR chỉnh sửa Approval Flow, hệ thống tạo Version mới (`approval_flow_versions`). Các Requisition đang duyệt giữ nguyên Version cũ!
            </div>
          </div>

          {/* SECTION 6: API FLOW CHUẨN & AUTHORIZATION (4 COLS) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#1677FF] text-white flex items-center justify-center font-bold text-sm">
                    6
                  </div>
                  <h2 className="text-base font-extrabold text-[#0F3F8C] tracking-tight uppercase">
                    API Flow & Security
                  </h2>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded border border-slate-200">
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-1 rounded text-[9px]">POST</span>
                  <span className="font-mono text-slate-800 text-[10px]">/api/v1/requisitions</span>
                  <span className="text-slate-500 text-[9px]">Tạo Draft</span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded border border-slate-200">
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-1 rounded text-[9px]">POST</span>
                  <span className="font-mono text-slate-800 text-[10px]">.../{`{id}`}/submit</span>
                  <span className="text-slate-500 text-[9px]">Gửi duyệt</span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded border border-slate-200">
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-1 rounded text-[9px]">POST</span>
                  <span className="font-mono text-slate-800 text-[10px]">.../{`{id}`}/approve</span>
                  <span className="text-slate-500 text-[9px]">Duyệt cấp</span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded border border-slate-200">
                  <span className="font-bold text-rose-700 bg-rose-100 px-1 rounded text-[9px]">POST</span>
                  <span className="font-mono text-slate-800 text-[10px]">.../{`{id}`}/reject</span>
                  <span className="text-slate-500 text-[9px]">Từ chối</span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded border border-slate-200">
                  <span className="font-bold text-amber-700 bg-amber-100 px-1 rounded text-[9px]">POST</span>
                  <span className="font-mono text-slate-800 text-[10px]">.../{`{id}`}/request-changes</span>
                  <span className="text-slate-500 text-[9px]">Yêu cầu bổ sung</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-2 bg-rose-50 border border-rose-200 rounded-xl text-[10px] text-rose-900 font-medium">
              🛡 <strong>Backend Security & Concurrency:</strong> Check `current_step.approver_user_id == current_user.id` (HTTP 403 nếu sai cấp). Dùng Row Locking chống double-click (HTTP 409).
            </div>
          </div>

        </div>

      </main>

      {/* ========================================================================= */}
      {/* DEMO MODALS FOR INTERACTIVE PREVIEW */}
      {/* ========================================================================= */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl relative space-y-4">
            
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            {/* MODAL: DUYỆT */}
            {activeModal === "approve" && (
              <>
                <div className="flex items-center gap-3 text-emerald-600">
                  <CheckCircle2 className="w-7 h-7" />
                  <h3 className="text-lg font-bold text-slate-900">Duyệt Yêu Cầu Tuyển Dụng?</h3>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-slate-800">REQ-2026-001 — Senior Backend Developer</p>
                  <p className="text-slate-600">Số lượng: 3 nhân sự | Dải lương: 30M - 45M</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ý kiến phê duyệt (Không bắt buộc):</label>
                  <textarea className="w-full p-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" rows={3} placeholder="Đồng ý tuyển dụng cho quý 4..." />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button onClick={() => setActiveModal(null)} className="px-4 py-2 border border-slate-200 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-50">Hủy</button>
                  <button onClick={() => setActiveModal(null)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs">Xác nhận Duyệt</button>
                </div>
              </>
            )}

            {/* MODAL: TỪ CHỐI */}
            {activeModal === "reject" && (
              <>
                <div className="flex items-center gap-3 text-rose-600">
                  <XCircle className="w-7 h-7" />
                  <h3 className="text-lg font-bold text-slate-900">Từ Chối Yêu Cầu</h3>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl text-xs text-rose-900">
                  ⚠ Hành động này sẽ dừng quy trình duyệt và chuyển trạng thái Requisition thành REJECTED.
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lý do từ chối <span className="text-rose-500">*</span>:</label>
                  <textarea className="w-full p-2.5 text-xs border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none" rows={3} placeholder="Nhập lý do chi tiết từ chối yêu cầu..." required />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button onClick={() => setActiveModal(null)} className="px-4 py-2 border border-slate-200 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-50">Hủy</button>
                  <button onClick={() => setActiveModal(null)} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs">Xác nhận Từ chối</button>
                </div>
              </>
            )}

            {/* MODAL: YÊU CẦU BỔ SUNG */}
            {activeModal === "changes" && (
              <>
                <div className="flex items-center gap-3 text-amber-600">
                  <RefreshCw className="w-7 h-7" />
                  <h3 className="text-lg font-bold text-slate-900">Yêu Cầu Bổ Sung Thông Tin</h3>
                </div>
                <p className="text-xs text-slate-600">Yêu cầu sẽ được chuyển về trạng thái CHANGES_REQUESTED cho người tạo cập nhật.</p>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nội dung cần bổ sung / chỉnh sửa <span className="text-amber-500">*</span>:</label>
                  <textarea className="w-full p-2.5 text-xs border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none" rows={3} placeholder="Ví dụ: Cần làm rõ mô tả công việc (JD) và chỉ tiêu KPI..." required />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button onClick={() => setActiveModal(null)} className="px-4 py-2 border border-slate-200 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-50">Hủy</button>
                  <button onClick={() => setActiveModal(null)} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs">Gửi yêu cầu bổ sung</button>
                </div>
              </>
            )}

            {/* MODAL: CẤU HÌNH FLOW */}
            {activeModal === "config" && (
              <>
                <div className="flex items-center gap-3 text-indigo-600">
                  <Sliders className="w-7 h-7" />
                  <h3 className="text-lg font-bold text-slate-900">Cấu Hình Approval Flow Động</h3>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phòng ban áp dụng:</label>
                    <select className="w-full p-2 border border-slate-200 rounded-lg">
                      <option>Khối Công nghệ Thông tin (IT)</option>
                      <option>Khối Nhân sự (HR)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Lương từ (VNĐ):</label>
                      <input className="w-full p-2 border border-slate-200 rounded-lg" defaultValue="25,000,000" />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Lương đến (VNĐ):</label>
                      <input className="w-full p-2 border border-slate-200 rounded-lg" defaultValue="50,000,000" />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Số cấp duyệt: 2 Cấp</label>
                    <div className="p-2 bg-slate-50 rounded-lg space-y-1 text-[11px]">
                      <p><strong>Cấp 1:</strong> Trưởng phòng Nhân sự</p>
                      <p><strong>Cấp 2:</strong> Giám đốc Khối</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button onClick={() => setActiveModal(null)} className="px-4 py-2 border border-slate-200 text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-50">Hủy</button>
                  <button onClick={() => setActiveModal(null)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs">Lưu phiên bản mới (Version 2)</button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
