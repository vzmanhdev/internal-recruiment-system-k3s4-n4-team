'use client';

import React from 'react';
import Link from 'next/link';
import { UserCircle, Mail, Phone, MapPin, DollarSign, Download, FileText, CheckCircle2 } from 'lucide-react';

export default function CandidateProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
          <Link href="/candidate/jobs" className="hover:text-blue-600 transition-colors">
            Candidate Workspace
          </Link>
          <span>&rsaquo;</span>
          <span className="text-slate-700 font-bold">Hồ sơ của tôi</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <UserCircle className="w-7 h-7 text-blue-600" />
              <span>Hồ Sơ Năng Lực & CV Ứng Viên</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Thông tin cá nhân, CV đã tải lên và các kỹ năng chuyên môn được tự động đồng bộ khi ứng tuyển.
            </p>
          </div>
          <Link
            href="/candidate/applications"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition-colors self-start sm:self-auto cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Xem Tiến Trình Hồ Sơ Ứng Tuyển &rarr;</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 text-center">
          <img
            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=240&auto=format&fit=crop"
            alt="Nguyễn Văn An"
            className="w-24 h-24 rounded-3xl object-cover mx-auto border-4 border-blue-50 shadow-md"
          />
          <div>
            <h3 className="font-black text-base text-slate-900">Nguyễn Văn An</h3>
            <p className="text-xs text-blue-600 font-bold">Senior Backend Engineer</p>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">UV-2026-085</p>
          </div>

          <div className="border-t border-slate-100 pt-4 text-left space-y-2.5 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Email:</span>
              <span className="font-bold text-slate-800">candidate@company.com</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Điện thoại:</span>
              <span className="font-bold text-slate-800">0912 345 678</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Địa chỉ:</span>
              <span className="font-bold text-slate-800">Cầu Giấy, Hà Nội</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Kỳ vọng:</span>
              <span className="font-bold text-blue-600">45 - 55 Triệu VNĐ</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4 text-xs">
          <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>CV Đã Tải Lên Hệ Thống</span>
          </h3>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 font-black flex items-center justify-center text-xs">
                PDF
              </div>
              <div>
                <span className="font-extrabold text-xs text-slate-900 block">
                  CV_NguyenVanAn_Backend_Senior.pdf
                </span>
                <span className="text-[10px] text-slate-400">
                  Cập nhật ngày 10/10/2026 &bull; 2.4 MB
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => alert('Đang tải xuống file CV...')}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 font-bold text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải Xuống</span>
            </button>
          </div>

          <div className="space-y-2">
            <span className="font-extrabold text-slate-900 block">Kỹ năng chuyên môn chính:</span>
            <div className="flex flex-wrap gap-2">
              {['Golang', 'Python', 'Kafka', 'Kubernetes', 'PostgreSQL', 'Microservices', 'System Design'].map((skill) => (
                <span key={skill} className="px-3 py-1 rounded-xl bg-blue-50 text-blue-800 font-extrabold text-[11px] border border-blue-200">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
