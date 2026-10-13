"use client";

import React, { useState } from "react";
import { AdminAppShell } from "@/components/layout/AdminAppShell";
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  X,
  HelpCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import {
  userService,
  ImportPreviewResponse,
  ImportRowPreview,
  ImportCommitResponse,
} from "@/services/user.service";
import { API_BASE_URL } from "@/lib/api-client";
import { Pagination } from "@/components/ui/Pagination";

export default function ImportUsersPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Select, 2: Preview, 3: Processing, 4: Summary
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Staged Preview data from backend
  const [previewData, setPreviewData] = useState<ImportPreviewResponse | null>(null);
  const [previewFilter, setPreviewFilter] = useState<"all" | "valid" | "error">("all");
  const [previewPage, setPreviewPage] = useState(1);
  const [previewPageSize, setPreviewPageSize] = useState(20);

  // Commit Summary from backend
  const [commitSummary, setCommitSummary] = useState<ImportCommitResponse | null>(null);

  // Handle Download Excel Template from backend
  const handleDownloadTemplate = async () => {
    try {
      await userService.downloadTemplate();
    } catch (err: any) {
      setFileError(err.message || "Không thể tải file mẫu. Vui lòng thử lại.");
    }
  };

  // Upload to Preview endpoint
  const uploadAndPreview = async (uploadFile: File) => {
    setIsProcessing(true);
    setFileError(null);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);

      const preview = await userService.previewImport(formData);
      setPreviewData(preview);
      setPreviewPage(1);
      setStep(2);
    } catch (err: any) {
      setFileError(err.message || "Không thể tải lên hoặc xử lý file Excel. Vui lòng kiểm tra lại định dạng.");
    } finally {
      setIsProcessing(false);
    }
  };

  // File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      uploadAndPreview(selected);
    }
  };

  // Switch preview filter or page
  const handleFilterOrPageChange = async (newFilter: "all" | "valid" | "error", newPage: number, newPageSize?: number) => {
    if (!previewData?.job_id) return;
    setIsProcessing(true);
    try {
      const size = newPageSize || previewPageSize;
      const res = await userService.getImportPreview(previewData.job_id, {
        page: newPage,
        pageSize: size,
        statusFilter: newFilter,
      });
      setPreviewData(res);
      setPreviewFilter(newFilter);
      setPreviewPage(newPage);
      if (newPageSize) setPreviewPageSize(newPageSize);
    } catch (err: any) {
      console.error("Lỗi khi tải dữ liệu preview:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirm Import Execution (S2-01 Chunked Batch Processing in backend)
  const handleConfirmImport = async () => {
    if (!previewData?.job_id) return;
    setStep(3);
    setIsProcessing(true);

    try {
      const commitRes = await userService.commitImport(previewData.job_id, true);
      setCommitSummary(commitRes);
      setStep(4);
    } catch (err: any) {
      setFileError(err.message || "Lỗi trong quá trình lưu dữ liệu.");
      setStep(2);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AdminAppShell activeTab="import">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <FileSpreadsheet className="w-7 h-7 text-emerald-600" />
              Import Nhân Sự Hàng Loạt Từ Excel (S2-01)
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Tải lên file dữ liệu nhân sự (.xlsx) để tự động khởi tạo tài khoản, phân vai trò RBAC và kích hoạt hệ thống.
            </p>
          </div>
          <Link
            href="/admin/users"
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách người dùng</span>
          </Link>
        </div>

        {/* Step Indicator */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-xs text-xs font-bold">
          <div className={`flex items-center gap-2 ${step >= 1 ? "text-blue-600" : "text-slate-400"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${step >= 1 ? "bg-blue-100 text-blue-600" : "bg-slate-100"}`}>1</span>
            <span>1. Chọn file Excel</span>
          </div>
          <div className={`flex items-center gap-2 ${step >= 2 ? "text-blue-600" : "text-slate-400"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${step >= 2 ? "bg-blue-100 text-blue-600" : "bg-slate-100"}`}>2</span>
            <span>2. Kiểm tra dữ liệu</span>
          </div>
          <div className={`flex items-center gap-2 ${step >= 3 ? "text-blue-600" : "text-slate-400"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${step >= 3 ? "bg-blue-100 text-blue-600" : "bg-slate-100"}`}>3</span>
            <span>3. Xử lý Import</span>
          </div>
          <div className={`flex items-center gap-2 ${step >= 4 ? "text-emerald-600" : "text-slate-400"}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${step >= 4 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100"}`}>4</span>
            <span>4. Báo cáo kết quả</span>
          </div>
        </div>

        {/* STEP 1: DOWNLOAD & UPLOAD */}
        {step === 1 && (
          <div className="w-full space-y-6">
            {/* File Error Banner */}
            {fileError && (
              <div className="w-full p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-3 animate-in fade-in duration-200 shadow-xs">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-extrabold text-sm text-rose-900">Lỗi Cấu Trúc File Excel!</div>
                  <p className="leading-relaxed">{fileError}</p>
                </div>
              </div>
            )}

            {/* Download Template Box */}
            <div className="w-full bg-blue-50/50 border border-blue-100 rounded-2xl p-5 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Tải File Mẫu Excel (.XLSX) Chuẩn Hệ Thống</h3>
                  <p className="text-xs text-slate-500">Tải file mẫu được định dạng sẵn tiêu đề các cột để tránh lỗi nhập liệu.</p>
                </div>
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="px-4 py-2.5 rounded-xl bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-bold transition-all shadow-xs shrink-0 flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Tải Mẫu Excel (.XLSX)</span>
              </button>
            </div>

            {/* Upload Zone */}
            <div className="w-full bg-white rounded-3xl border-2 border-dashed border-gray-200 p-8 md:p-12 text-center hover:border-blue-400 transition-colors shadow-xs">
              <input
                type="file"
                id="excel-file-input"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                disabled={isProcessing}
                className="hidden"
              />
              <label htmlFor="excel-file-input" className="cursor-pointer space-y-3 block w-full">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center border border-blue-100">
                  {isProcessing ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <UploadCloud className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-900 block">
                    {isProcessing ? "Đang đọc và xác thực dữ liệu trên máy chủ..." : "Kéo thả hoặc Bấm vào đây để tải lên file Excel"}
                  </span>
                  <span className="text-xs text-slate-400 block mt-1">
                    Hỗ trợ định dạng .XLSX, .XLS (Dung lượng tối đa 10MB)
                  </span>
                </div>
              </label>
            </div>

            {/* Field Requirements List */}
            <div className="w-full bg-white rounded-2xl border border-gray-100 p-5 md:p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm border-b border-gray-100 pb-3">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <span>Hướng Dẫn Cấu Trúc Cột File Excel Chuẩn</span>
              </div>

              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-gray-100 space-y-1">
                  <span className="font-bold text-slate-800 block">Các Cột Bắt Buộc (Dòng 1):</span>
                  <div className="text-[11px] text-slate-600 space-y-0.5">
                    <div>• <strong>Họ và tên</strong>: Tên đầy đủ của nhân sự (bắt buộc)</div>
                    <div>• <strong>Email</strong>: Email công ty duy nhất (bắt buộc, không trùng lặp)</div>
                    <div>• <strong>Vai trò</strong>: Mã vai trò hệ thống (admin, hr_manager, recruiter, hiring_manager, interviewer, approver, employee)</div>
                    <div>• <strong>Số điện thoại</strong>: Số điện thoại liên hệ (tùy chọn)</div>
                    <div>• <strong>Phòng ban</strong>: Tên phòng ban công tác (tùy chọn)</div>
                  </div>
                </div>

                <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-100 space-y-1 text-amber-900">
                  <span className="font-bold block flex items-center gap-1.5 text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> Quy Tắc S2-01 Partial Import:
                  </span>
                  <ul className="text-[11px] space-y-1 text-amber-800 font-medium">
                    <li>• Hệ thống kiểm tra từng dòng: email sai định dạng hoặc trùng lặp sẽ được đánh dấu <strong>ERROR / DUPLICATE</strong>.</li>
                    <li>• Khi quản trị viên xác nhận import, các dòng hợp lệ sẽ được tạo tài khoản thật và phân quyền normalized trong cơ sở dữ liệu.</li>
                    <li>• Các dòng lỗi sẽ tự động bỏ qua và liệt kê chi tiết trong báo cáo tổng kết.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PREVIEW & VALIDATION TABLE */}
        {step === 2 && previewData && (
          <div className="w-full bg-white rounded-2xl border border-gray-100 p-5 md:p-6 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Xem Trước & Kiểm Tra Tính Hợp Lệ Dữ Liệu</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Đã đọc <strong>{previewData.total}</strong> dòng từ file{" "}
                  <span className="font-bold text-slate-700">{file?.name}</span>.
                </p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer self-start sm:self-auto shrink-0"
              >
                Chọn file khác
              </button>
            </div>

            {/* Filter Tabs & Stats Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 pb-1 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFilterOrPageChange("all", 1)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    previewFilter === "all"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Tất cả ({previewData.total})
                </button>
                <button
                  onClick={() => handleFilterOrPageChange("valid", 1)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    previewFilter === "valid"
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  Hợp lệ ({previewData.valid_count})
                </button>
                <button
                  onClick={() => handleFilterOrPageChange("error", 1)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    previewFilter === "error"
                      ? "bg-rose-600 text-white"
                      : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                  }`}
                >
                  Lỗi & Trùng ({previewData.error_count})
                </button>
              </div>

              <div className="text-xs text-slate-500">
                Sẵn sàng import: <strong className="text-emerald-600">{previewData.valid_count}</strong> dòng
              </div>
            </div>

            {/* Preview Table */}
            <div className="w-full border border-gray-100 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-gray-100 font-extrabold text-slate-500 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Dòng</th>
                    <th className="p-3">Họ và tên</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Vai trò</th>
                    <th className="p-3">Phòng ban</th>
                    <th className="p-3">Trạng thái</th>
                    <th className="p-3">Ghi chú kiểm tra</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {previewData.items.map((row: ImportRowPreview, idx: number) => {
                    const rowNumber = row.row_num ?? row.row_number ?? idx + 1;
                    const rolesDisplay =
                      Array.isArray(row.roles) && row.roles.length > 0
                        ? row.roles.join(", ")
                        : row.role || "employee";

                    return (
                      <tr
                        key={`import-row-${rowNumber}-${row.email || idx}`}
                        className="hover:bg-slate-50/50"
                      >
                        <td className="p-3 font-mono text-slate-400">{rowNumber}</td>
                        <td className="p-3 font-bold text-slate-900">{row.full_name}</td>
                        <td className="p-3 text-slate-600">{row.email}</td>
                        <td className="p-3 font-mono text-blue-600 font-semibold">{rolesDisplay}</td>
                        <td className="p-3 text-slate-500">{row.department || "---"}</td>
                        <td className="p-3">
                          {row.status === "VALID" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Hợp lệ
                            </span>
                          ) : row.status === "DUPLICATE" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Trùng email
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <X className="w-3 h-3 text-rose-600" />
                              Lỗi dữ liệu
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-500 text-[11px]">
                          {row.error_reason ? (
                            <span className="text-rose-600 font-medium">{row.error_reason}</span>
                          ) : (
                            <span className="text-emerald-600">Đủ điều kiện tạo tài khoản</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={previewPage}
              totalPages={previewData.pages}
              onPageChange={(p) => handleFilterOrPageChange(previewFilter, p)}
              totalItems={previewData.total}
              pageSize={previewPageSize}
              onPageSizeChange={(newSize) => handleFilterOrPageChange(previewFilter, 1, newSize)}
              itemLabel="dòng"
            />

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
              >
                Quay lại
              </button>

              <button
                onClick={handleConfirmImport}
                disabled={previewData.valid_count === 0}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <span>Xác nhận Import ({previewData.valid_count} tài khoản hợp lệ)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PROCESSING */}
        {step === 3 && (
          <div className="w-full bg-white rounded-3xl border border-gray-100 p-12 text-center space-y-4 shadow-xs">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
            <h3 className="font-extrabold text-base text-slate-900">Đang thực hiện import vào cơ sở dữ liệu</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Hệ thống đang tiến hành tạo tài khoản theo các lô chunk 50 bản ghi, thiết lập bảng vai trò normalized multi-role và ghi nhật ký kiểm toán hệ thống...
            </p>
          </div>
        )}

        {/* STEP 4: SUMMARY REPORT */}
        {step === 4 && commitSummary && (
          <div className="w-full bg-white rounded-3xl border border-gray-100 p-6 md:p-8 space-y-6 shadow-xs">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Báo Cáo Tổng Kết Import Nhân Sự (S2-01)</h2>
                <p className="text-xs text-slate-500">{commitSummary.message}</p>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs text-slate-500 font-bold block">Tổng số dòng xử lý</span>
                <span className="text-2xl font-extrabold text-slate-900 block mt-1">{commitSummary.total}</span>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <span className="text-xs text-emerald-700 font-bold block">Nhập thành công</span>
                <span className="text-2xl font-extrabold text-emerald-700 block mt-1">{commitSummary.imported}</span>
              </div>
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                <span className="text-xs text-rose-700 font-bold block">Bỏ qua / Lỗi</span>
                <span className="text-2xl font-extrabold text-rose-700 block mt-1">{commitSummary.failed}</span>
              </div>
            </div>

            {/* Errors List */}
            {commitSummary.errors && commitSummary.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700">Chi tiết các dòng bị bỏ qua:</h4>
                <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-xl p-3 bg-slate-50 space-y-1.5 text-xs">
                  {commitSummary.errors.map((err: any, idx: number) => {
                    const rowNum = err.row ?? err.row_number ?? idx + 1;
                    return (
                      <div key={`commit-err-${rowNum}-${err.email || idx}`} className="flex items-start gap-2 text-rose-700">
                        <span className="font-mono font-bold shrink-0">Dòng {rowNum}:</span>
                        <span>{err.email} — {err.reason}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Finish Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setStep(1);
                  setFile(null);
                  setPreviewData(null);
                  setCommitSummary(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer"
              >
                Nhập thêm file khác
              </button>

              <Link
                href="/admin/users"
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20"
              >
                Xem danh sách người dùng
              </Link>
            </div>
          </div>
        )}
      </div>
    </AdminAppShell>
  );
}
