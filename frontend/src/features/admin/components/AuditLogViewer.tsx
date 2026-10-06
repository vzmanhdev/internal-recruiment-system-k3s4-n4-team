"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Filter,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
  UserX,
  Briefcase,
  Sliders,
} from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { apiRequest, ApiError } from "@/lib/api-client";

export interface AuditLogItem {
  id: number;
  actor_name: string;
  actor_email: string;
  action: string;
  target: string;
  details: string;
  ip_address: string;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  "Tạo tài khoản": "bg-blue-50 text-blue-700 border-blue-200",
  "Khóa tài khoản": "bg-red-50 text-red-700 border-red-200",
  "Mở khóa tài khoản": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Cập nhật vai trò": "bg-purple-50 text-purple-700 border-purple-200",
  "Phê duyệt bài đăng": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Từ chối bài đăng": "bg-amber-50 text-amber-700 border-amber-200",
  "Phê duyệt tài khoản": "bg-teal-50 text-teal-700 border-teal-200",
};

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLogs = async (currentPage = page) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (actionFilter !== "all") params.append("action", actionFilter);
      params.append("page", String(currentPage));
      params.append("page_size", "15");

      const res = await apiRequest<{
        items: AuditLogItem[];
        total: number;
        page: number;
        pages: number;
      }>(`/admin/audit-logs?${params.toString()}`);

      setLogs(res.items || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch (caught: unknown) {
      setError(
        caught instanceof ApiError ? caught.message : "Không thể tải danh sách nhật ký hệ thống."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(page);
  }, [page, actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadLogs(1);
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-blue-600">
            <FileText className="h-4 w-4" />
            Nhật ký kiểm toán
          </div>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">
            Nhật ký hoạt động hệ thống (Audit Logs)
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Theo dõi, tra cứu toàn bộ các tác vụ quản trị, thay đổi quyền hạn và phê duyệt theo thời gian thực.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => loadLogs(page)}
          leftIcon={<RefreshCw className="h-4 w-4" />}
        >
          Làm mới
        </Button>
      </header>

      {error && <Alert variant="error" title="Không thể tải dữ liệu">{error}</Alert>}

      {/* Filter and Search Bar */}
      <Card>
        <form onSubmit={handleSearchSubmit} className="grid gap-3 sm:grid-cols-[1fr_240px_auto]">
          <Input
            aria-label="Tìm kiếm nhật ký"
            placeholder="Tìm theo người thực hiện, mục tiêu hoặc chi tiết..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
          <Select
            aria-label="Lọc theo hành động"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: "all", label: "Tất cả hành động" },
              { value: "Tạo tài khoản", label: "Tạo tài khoản" },
              { value: "Khóa tài khoản", label: "Khóa tài khoản" },
              { value: "Mở khóa tài khoản", label: "Mở khóa tài khoản" },
              { value: "Cập nhật vai trò", label: "Cập nhật vai trò" },
              { value: "Phê duyệt bài đăng", label: "Phê duyệt bài đăng" },
              { value: "Từ chối bài đăng", label: "Từ chối bài đăng" },
              { value: "Phê duyệt tài khoản", label: "Phê duyệt tài khoản" },
            ]}
          />
          <Button type="submit">Tìm kiếm</Button>
        </form>
      </Card>

      {/* Audit Logs Table */}
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <p className="text-sm font-bold text-slate-900">{total} bản ghi nhật ký</p>
          <span className="text-xs text-slate-500">Trang {page}/{pages}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Đang tải dữ liệu nhật ký...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Không tìm thấy bản ghi nhật ký nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3.5">Thời gian</th>
                  <th className="px-4 py-3.5">Người thực hiện</th>
                  <th className="px-4 py-3.5">Hành động</th>
                  <th className="px-4 py-3.5">Đối tượng</th>
                  <th className="px-5 py-3.5">Chi tiết thay đổi</th>
                  <th className="px-4 py-3.5 text-right">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 font-mono">
                      {log.created_at}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-slate-900">{log.actor_name}</p>
                      <p className="text-slate-500">{log.actor_email}</p>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 font-bold ${
                          ACTION_COLORS[log.action] || "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">
                      {log.target || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 max-w-xs truncate" title={log.details}>
                      {log.details || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-slate-400 whitespace-nowrap">
                      {log.ip_address}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-slate-500">
            Hiển thị tối đa 15 bản ghi mỗi trang
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Trang trước
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= pages}
              onClick={() => setPage((current) => current + 1)}
            >
              Trang sau
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
