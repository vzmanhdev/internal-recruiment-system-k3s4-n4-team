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
  AlertTriangle,
} from "lucide-react";
import { UserItem } from "./types";
import { userService, ImportPreviewResponse, ImportCommitResponse } from "@/services/user.service";
import { API_BASE_URL } from "@/lib/api-client";

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (importedCount: number, sampleUsers?: UserItem[]) => void;
}

export function ExcelImportModal({
  isOpen,
  onClose,
  onImportSuccess,
}: ExcelImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [previewResult, setPreviewResult] = useState<ImportPreviewResponse | null>(null);
  const [commitResult, setCommitResult] = useState<ImportCommitResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
        droppedFile.name.endsWith(".xls")
      ) {
        setFile(droppedFile);
        setErrorMessage(null);
        setPreviewResult(null);
        setCommitResult(null);
      } else {
        setErrorMessage("Vui lòng tải lên file định dạng Excel (.xlsx hoặc .xls)");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setErrorMessage(null);
      setPreviewResult(null);
      setCommitResult(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await userService.downloadTemplate();
    } catch (err: any) {
      setErrorMessage(err.message || "Không thể tải file mẫu. Vui lòng thử lại.");
    }
  };

  const handleUploadAndProcess = async () => {
    if (!file) {
      setErrorMessage("Vui lòng chọn một file Excel trước khi tiến hành xử lý.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setStatusText("Đang tải lên và kiểm tra tính hợp lệ của dữ liệu...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Phase 1: Upload & Staged Preview Validation
      const preview = await userService.previewImport(formData);
      setPreviewResult(preview);

      if (preview.valid_count === 0 && preview.error_count > 0) {
        setIsProcessing(false);
        setErrorMessage(
          `Tất cả ${preview.total} dòng đều có lỗi hoặc trùng lặp email. Vui lòng kiểm tra lại file dữ liệu.`
        );
        return;
      }

      // Phase 2: Batch commit
      setStatusText(
        `Đang tiến hành nhập ${preview.valid_count} tài khoản hợp lệ vào cơ sở dữ liệu...`
      );

      const commit = await userService.commitImport(preview.job_id, true);
      setCommitResult(commit);
      setIsProcessing(false);

      if (commit.imported > 0) {
        onImportSuccess(commit.imported);
      }
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(
        err.message || "Đã xảy ra lỗi trong quá trình xử lý file Excel. Vui lòng thử lại."
      );
    }
  };

  const handleReset = () => {
    setFile(null);
    setIsProcessing(false);
    setStatusText("");
    setPreviewResult(null);
    setCommitResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
                Tạo nhanh danh sách tài khoản nhân sự và phân quyền RBAC
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
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-blue-200/60 shadow-2xs hover:shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file mẫu (.xlsx)</span>
            </button>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Lỗi xử lý file</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Success Summary View */}
          {commitResult ? (
            <div className="space-y-4">
              <div className="p-5 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-emerald-950">
                    Nhập dữ liệu hoàn tất!
                  </h4>
                  <p className="text-xs text-emerald-700">
                    Đã nhập thành công <strong>{commitResult.imported}</strong> trên tổng số{" "}
                    <strong>{commitResult.total}</strong> tài khoản từ file.
                  </p>
                  {commitResult.failed > 0 && (
                    <p className="text-xs text-amber-700 font-medium">
                      Bỏ qua {commitResult.failed} dòng không hợp lệ hoặc trùng email.
                    </p>
                  )}
                </div>
              </div>

              {commitResult.errors && commitResult.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1">
                  <div className="font-bold text-slate-700 mb-1">Chi tiết lỗi các dòng bỏ qua:</div>
                  {commitResult.errors.map((err, idx) => (
                    <div key={idx} className="text-rose-600">
                      • Dòng {err.row_number} ({err.email}): {err.reason}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : !isProcessing ? (
            /* Upload Drop Area */
            <div>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-blue-500 bg-blue-50/50 scale-[1.01]"
                    : file
                    ? "border-emerald-400 bg-emerald-50/20"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx, .xls"
                  className="hidden"
                />

                {file ? (
                  <div className="space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100/70 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                      <FileSpreadsheet className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-900 line-clamp-1">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {(file.size / 1024).toFixed(1)} KB • Sẵn sàng tải lên và xử lý
                      </p>
                    </div>
                    <span className="inline-block text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                      Nhấn để chọn file khác
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-800">
                        Kéo thả file Excel vào đây, hoặc{" "}
                        <span className="text-blue-600 hover:underline">duyệt tìm file</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Hỗ trợ định dạng .xlsx, .xls (Dung lượng tối đa 10MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Real Processing State */
            <div className="py-8 space-y-5 text-center">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">Đang xử lý dữ liệu</p>
                <p className="text-xs text-slate-500">{statusText}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
          {commitResult ? (
            <button
              onClick={() => {
                handleReset();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20"
            >
              Hoàn tất & Đóng
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>

              <div className="flex items-center gap-2">
                {file && (
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isProcessing}
                    className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Chọn lại
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleUploadAndProcess}
                  disabled={!file || isProcessing}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isProcessing ? "Đang xử lý..." : "Tải lên & Xử lý"}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
