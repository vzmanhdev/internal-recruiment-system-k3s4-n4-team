'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  FileEdit,
  CheckCircle,
  AlertCircle,
  Video,
  MapPin,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Award,
  ArrowRight,
  User,
  FileText,
  X,
  ShieldCheck,
  Check,
} from 'lucide-react';
import clsx from 'clsx';

export default function InterviewerOverviewPage() {
  // Modal xem nhanh CV
  const [cvPreviewCandidate, setCvPreviewCandidate] = useState<any>(null);

  // Danh sách lịch phỏng vấn sắp tới
  const upcomingInterviews = [
    {
      id: 1,
      candidateName: 'Lê Hoàng Cường',
      position: 'Senior Frontend Engineer (React/Next.js)',
      department: 'Ban Công Nghệ Thông Tin',
      time: '14:00 - 15:00, Hôm nay',
      format: 'Online (Google Meet)',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      status: 'Sắp diễn ra',
      statusColor: 'bg-amber-50 text-amber-700 border-amber-200/80',
      experience: '6 năm kinh nghiệm',
      education: 'Đại học Bách Khoa Hà Nội',
      skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
    },
    {
      id: 2,
      candidateName: 'Đỗ Hoàng Long',
      position: 'Senior Data Analyst (BI & Modeling)',
      department: 'Khối Phân Tích Dữ Liệu',
      time: '09:30 - 10:30, Ngày mai',
      format: 'Trực tiếp (Phòng Họp A3 - Tầng 8)',
      status: 'Đã xác nhận',
      statusColor: 'bg-blue-50 text-blue-700 border-blue-200/80',
      experience: '4 năm kinh nghiệm',
      education: 'Đại học Kinh Tế Quốc Dân',
      skills: ['SQL', 'Python', 'PowerBI', 'Tableau', 'Data Warehousing'],
    },
    {
      id: 3,
      candidateName: 'Phạm Thuỳ Linh',
      position: 'Product Owner (Digital Banking)',
      department: 'Khối Ngân Hàng Số',
      time: '15:30 - 16:30, 14/10/2026',
      format: 'Online (Microsoft Teams)',
      meetingLink: 'https://teams.microsoft.com/l/meetup-join/...',
      status: 'Chờ phỏng vấn',
      statusColor: 'bg-slate-100 text-slate-700 border-slate-200',
      experience: '5 năm kinh nghiệm',
      education: 'Đại học Ngoại Thương',
      skills: ['Agile/Scrum', 'Fintech', 'Product Roadmapping', 'User Story'],
    },
  ];

  // Danh sách việc cần xử lý (To-do / Phiếu đánh giá chờ nộp)
  const todoEvaluations = [
    {
      id: 2,
      candidateName: 'Ngô Quốc Bảo',
      position: 'DevOps / SRE Engineer',
      department: 'Ban Hạ Tầng & Bảo Mật',
      interviewedAt: 'Đã hoàn tất lúc 11:00 hôm qua',
      dueWarning: 'Quá hạn 2 giờ',
      isOverdue: true,
      dueClass: 'text-rose-600 bg-rose-50 border-rose-200/80',
    },
    {
      id: 3,
      candidateName: 'Trần Thị Mai',
      position: 'UI/UX Designer Senior',
      department: 'Khối Trải Nghiệm Khách Hàng',
      interviewedAt: 'Đã hoàn tất lúc 11:30 hôm nay',
      dueWarning: 'Cần nộp trước 18:00 hôm nay',
      isOverdue: false,
      dueClass: 'text-amber-700 bg-amber-50 border-amber-200/80',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* ========================================================================= */}
      {/* 1. HEADER & CHÀO MỪNG (Hiệu ứng: animate-in fade-in slide-in-from-top-2) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Tổng Quan Phỏng Vấn & Đánh Giá
            </h1>
            <span className="bg-blue-50 text-blue-600 border border-blue-200/60 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Hội Đồng Đánh Giá
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Chào mừng <strong className="text-slate-800">Nguyễn Minh Trí</strong> (Senior Tech Lead). Bạn có{' '}
            <strong className="text-rose-600 font-bold">2 phiếu đánh giá</strong> cần hoàn tất để HR chốt kết quả hội đồng.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/interviewer/schedule"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Xem Lịch Đầy Đủ</span>
          </Link>
          <Link
            href="/interviewer/evaluations/pending"
            className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>Phiếu Chờ Nộp (2)</span>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. KHỐI THỐNG KÊ (KPI CARDS - 3 THẺ SỐ LIỆU ĐẶT NGAY DƯỚI HEADER) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* THẺ 1: Lịch phỏng vấn sắp tới */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out cursor-default">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Lịch Phỏng Vấn Sắp Tới
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">3</span>
            <span className="text-xs font-bold text-slate-500">buổi phỏng vấn</span>
          </div>
          <p className="text-[11px] text-blue-600 font-semibold mt-2 flex items-center gap-1">
            <span>• 1 buổi diễn ra trong chiều nay</span>
          </p>
        </div>

        {/* THẺ 2: Phiếu đánh giá chờ nộp (Có chấm animate-pulse) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out cursor-default relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Phiếu Đánh Giá Chờ Nộp
              </span>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 animate-pulse" />
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
              <FileEdit className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600 tracking-tight">2</span>
            <span className="text-xs font-bold text-slate-500">phiếu chưa gửi</span>
          </div>
          <p className="text-[11px] text-rose-600 font-semibold mt-2 flex items-center gap-1">
            <span>⚠️ 1 phiếu đã quá hạn 2 giờ</span>
          </p>
        </div>

        {/* THẺ 3: Đã đánh giá tháng này */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out cursor-default">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Đã Đánh Giá Tháng Này
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">12</span>
            <span className="text-xs font-bold text-slate-500">hồ sơ hoàn tất</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
            <span>✓ Tỷ lệ hoàn thành đúng hạn 100%</span>
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. KHỐI NỘI DUNG CHÍNH (CHIA GRID TỶ LỆ 2:1 -> lg:grid-cols-3) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ======================================================================= */}
        {/* CỘT TRÁI (CHIẾM 2 PHẦN - lg:col-span-2): LỊCH PHỎNG VẤN SẮP DIỄN RA */}
        {/* Animation: animate-in fade-in slide-in-from-bottom-4 duration-700 */}
        {/* ======================================================================= */}
        <div className="lg:col-span-2 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Lịch Phỏng Vấn Sắp Diễn Ra
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Danh sách ứng viên được phân công cho bạn trong vòng đánh giá chuyên môn
                </p>
              </div>
              <Link
                href="/interviewer/schedule"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Danh sách thẻ phỏng vấn */}
            <div className="space-y-3.5">
              {upcomingInterviews.map((item) => (
                <div
                  key={item.id}
                  className="border border-slate-100 bg-slate-50/50 hover:bg-blue-50/20 hover:border-blue-200/60 rounded-2xl p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                        {item.candidateName}
                      </span>
                      <span
                        className={clsx(
                          'text-[10px] font-bold px-2.5 py-0.5 rounded-full border',
                          item.statusColor
                        )}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 font-medium">
                      Vị trí: <span className="text-slate-800 font-semibold">{item.position}</span> •{' '}
                      <span className="text-slate-500">{item.department}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="font-medium text-slate-700">{item.time}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        {item.meetingLink ? (
                          <Video className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        )}
                        <span className="truncate">{item.format}</span>
                      </span>
                    </div>
                  </div>

                  {/* Nhóm nút hành động */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setCvPreviewCandidate(item)}
                      className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                    >
                      Đọc CV
                    </button>

                    {/* Nút vào phòng Live Interview */}
                    <Link
                      href={`/interviewer/live/${item.id}`}
                      className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                      title="Mở Chế độ Phỏng Vấn Trực Tiếp"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Live Call</span>
                    </Link>

                    {/* Nút Đánh Giá (hiệu ứng active:scale-95) */}
                    <Link
                      href={`/interviewer/evaluations/${item.id}`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer active:scale-95 flex items-center gap-1"
                    >
                      <span>Đánh Giá</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* CỘT PHẢI (CHIẾM 1 PHẦN - lg:col-span-1): VIỆC CẦN XỬ LÝ (TO-DO) */}
        {/* ======================================================================= */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            {/* Header Cột Phải */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <FileEdit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Việc Cần Xử Lý (To-do)</h3>
                  <p className="text-[11px] text-slate-400">Phiếu đánh giá chờ hoàn thiện</p>
                </div>
              </div>
              <span className="bg-rose-100 text-rose-700 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full">
                {todoEvaluations.length} Phiếu
              </span>
            </div>

            {/* Danh sách các phiếu đánh giá chờ nộp */}
            <div className="space-y-3">
              {todoEvaluations.map((todo) => (
                <div
                  key={todo.id}
                  className="p-3.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors space-y-2.5 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {todo.candidateName}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{todo.position}</p>
                    </div>

                    {/* Nút Nộp phiếu nhỏ gọn */}
                    <Link
                      href={`/interviewer/evaluations/${todo.id}`}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs shrink-0 active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <span>Nộp phiếu</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100/80">
                    <span className="text-slate-400">{todo.interviewedAt}</span>
                    <span
                      className={clsx(
                        'px-2 py-0.5 rounded-md font-bold border text-[10px]',
                        todo.dueClass
                      )}
                    >
                      {todo.dueWarning}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Thẻ Lưu Ý Bảo Mật / Blind Evaluation Reminder */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Quy định Đánh Giá Độc Lập</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Để đảm bảo tính khách quan (Blind Evaluation), bạn sẽ không xem được nhận xét của giám khảo khác cho tới khi nộp phiếu của mình.
              </p>
            </div>

            {/* Link Xem tất cả phiếu chờ nộp */}
            <Link
              href="/interviewer/evaluations/pending"
              className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer block text-center"
            >
              <span>Xem Tất Cả Phiếu Chờ Nộp</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL XEM NHANH CV ỨNG VIÊN */}
      {/* ========================================================================= */}
      {cvPreviewCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-100 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm">
                  {cvPreviewCandidate.candidateName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {cvPreviewCandidate.candidateName}
                  </h3>
                  <p className="text-xs text-blue-600 font-medium">
                    {cvPreviewCandidate.position}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCvPreviewCandidate(null)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Kinh nghiệm</span>
                  <strong className="text-slate-800">{cvPreviewCandidate.experience}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Học vấn</span>
                  <strong className="text-slate-800">{cvPreviewCandidate.education}</strong>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-800 block mb-1">Kỹ năng nổi bật:</span>
                <div className="flex flex-wrap gap-1.5">
                  {cvPreviewCandidate.skills.map((s: string) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-100"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-[11px] leading-relaxed text-slate-600 border border-slate-100">
                💡 <em>Gợi ý: Mở trang <strong>Chế Độ Phỏng Vấn Trực Tiếp (Live Call)</strong> để vừa call vừa đối chiếu toàn văn hồ sơ CV và ngân hàng câu hỏi thông minh.</em>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCvPreviewCandidate(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Đóng
              </button>
              <Link
                href={`/interviewer/live/${cvPreviewCandidate.id}`}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 cursor-pointer"
              >
                Vào Live Interview
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
