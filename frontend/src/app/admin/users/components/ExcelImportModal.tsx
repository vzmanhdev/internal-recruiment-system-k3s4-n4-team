"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  FileSpreadsheet,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
} from "lucide-react";
import { UserItem } from "./types";

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (importedCount: number, sampleUsers: UserItem[]) => void;
}

export function ExcelImportModal({
  isOpen,
  onClose,
  onImportSuccess,
}: ExcelImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [isDone, setIsDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (
        droppedFile.name.endsWith(".xlsx") ||
        droppedFile.name.endsWith(".xls") ||
        droppedFile.name.endsWith(".csv")
      ) {
        setFile(droppedFile);
      } else {
        alert("Vui lòng tải lên file định dạng Excel (.xlsx, .xls) hoặc CSV");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleDownloadTemplate = () => {
    // Generate a downloadable CSV template directly in browser
    const csvContent =
      "data:text/csv;charset=utf-8," +
      encodeURIComponent(
        "Mã nhân viên,Họ và tên,Email công ty,Số điện thoại,Phòng ban,Vai trò\n" +
        "NV-201,Trần Văn Mẫu,mau.tran@company.com,0987111222,Khối Công nghệ & Kỹ thuật,hiring_manager;interviewer\n" +
        "NV-202,Lê Thị Hằng,hang.le@company.com,0987333444,Phòng Quản trị Nhân sự,recruiter\n" +
        "NV-203,Vũ Đức Hoàng,hoang.vu@company.com,0987555666,Khối Kinh doanh,employee\n"
      );
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", csvContent);
    downloadAnchor.setAttribute("download", "Mau_Nhap_Nhan_Su_ATS.csv");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleUploadAndProcess = () => {
    if (!file && !isDone) {
      // Auto assign a default demo file if user clicks directly
      const dummyFile = new File(["dummy content"], "danh_sach_nhan_su_2026.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      setFile(dummyFile);
    }

    setIsProcessing(true);
    setProgress(15);
    setStatusText("Đang phân tích cấu trúc bảng tính Excel...");

    setTimeout(() => {
      setProgress(40);
      setStatusText("Đang kiểm tra trùng lặp email và chuẩn hóa mã nhân viên...");
    }, 700);

    setTimeout(() => {
      setProgress(75);
      setStatusText("Đang thiết lập ma trận phân quyền Multi-Role RBAC...");
    }, 1500);

    setTimeout(() => {
      setProgress(100);
      setStatusText("Hoàn tất xử lý! Đã nhập thành công 15 tài khoản nhân sự mới.");
      setIsProcessing(false);
      setIsDone(true);

      // Create 15 sample newly imported users
      const newImportedUsers: UserItem[] = Array.from({ length: 15 }, (_, idx) => {
        const id = 151 + idx;
        return {
          id,
          employee_code: `NV-${String(id).padStart(3, "0")}`,
          full_name: `Nhân sự mới ${idx + 1} (Excel)`,
          email: `imported.user${idx + 1}@company.com`,
          phone: `0988${String(100000 + idx * 1111).slice(0, 6)}`,
          department: "Khối Công nghệ & Kỹ thuật",
          role: idx % 3 === 0 ? "hiring_manager" : idx % 2 === 0 ? "interviewer" : "employee",
          roles: idx % 3 === 0 ? ["hiring_manager", "interviewer"] : ["employee"],
          is_active: true,
          account_status: "active",
          created_at: new Date().toISOString().slice(0, 10),
          avatar_color: "bg-emerald-600 text-white",
        };
      });

      onImportSuccess(15, newImportedUsers);
    }, 2300);
  };

  const handleReset = () => {
    setFile(null);
    setIsProcessing(false);
    setProgress(0);
    setStatusText("");
    setIsDone(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/80 shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                Nhập Tài Khoản Hàng Loạt từ Excel
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Tạo nhanh danh sách tài khoản nhân sự từ file bảng tính
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Download Template Bar */}
          <div className="flex items-center justify-between p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100">
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-xs font-semibold text-blue-900">
                Chưa có định dạng file chuẩn?
              </span>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-white hover:bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file Excel mẫu (Template)</span>
            </button>
          </div>

          {/* Drag & Drop Zone */}
          {!isDone ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${
                isDragging
                  ? "border-blue-500 bg-blue-50/50 scale-[0.99]"
                  : file
                  ? "border-emerald-300 bg-emerald-50/20"
                  : "border-slate-300 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/20"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />

              {file ? (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900">{file.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB • Định dạng hợp lệ
                    </div>
                  </div>
                  <p className="text-[11px] text-blue-600 font-semibold pt-1">
                    Nhấn vào đây để chọn file khác
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Kéo thả file Excel vào đây, hoặc{" "}
                      <span className="text-blue-600 underline">duyệt từ máy tính</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 font-medium">
                      Hỗ trợ định dạng .xlsx, .xls, .csv (Tối đa 10MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-emerald-900">
                  Nhập dữ liệu thành công!
                </h4>
                <p className="text-xs text-emerald-700 mt-1">
                  Đã thêm thành công 15 tài khoản nhân sự mới vào hệ thống.
                </p>
              </div>
            </div>
          )}

          {/* Progress Bar (Simulated UI) */}
          {isProcessing && (
            <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  {statusText}
                </span>
                <span className="font-mono font-bold text-blue-600">{progress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            {isDone ? "Đóng" : "Hủy"}
          </button>
          {!isDone && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleUploadAndProcess}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isProcessing ? "Đang xử lý..." : "Tải lên và Xử lý"}</span>
            </button>
          )}
          {isDone && (
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all"
            >
              Nhập thêm file khác
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
