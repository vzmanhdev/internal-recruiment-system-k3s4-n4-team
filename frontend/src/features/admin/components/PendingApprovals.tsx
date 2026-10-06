"use client";

import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  Building,
  Calendar,
  CheckCircle2,
  Clock3,
  DollarSign,
  RefreshCw,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ApiError } from "@/lib/api-client";
import { approvalService, type PendingUser } from "../services/approval.service";
import { recruiterService } from "@/features/recruiter/services/recruiter.service";
import type { RecruiterJob } from "@/features/recruiter/types/recruiter.types";

export function PendingApprovals() {
  const [activeTab, setActiveTab] = useState<"users" | "jobs">("users");

  // Users state
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [approvingUserId, setApprovingUserId] = useState<number | null>(null);

  // Jobs state
  const [pendingJobs, setPendingJobs] = useState<RecruiterJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [actionJobId, setActionJobId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadPendingUsers() {
    setLoadingUsers(true);
    setError("");
    try {
      setUsers(await approvalService.listPending());
    } catch (caught: unknown) {
      setError(caught instanceof ApiError ? caught.message : "Không thể tải danh sách yêu cầu đăng ký.");
    } finally {
      setLoadingUsers(false);
    }
  }

  async function loadPendingJobs() {
    setLoadingJobs(true);
    setError("");
    try {
      const res = await recruiterService.getJobs({ status: "pending_approval" });
      setPendingJobs(res.items || []);
    } catch (caught: unknown) {
      setError(caught instanceof ApiError ? caught.message : "Không thể tải danh sách bài đăng chờ duyệt.");
    } finally {
      setLoadingJobs(false);
    }
  }

  useEffect(() => {
    loadPendingUsers();
    loadPendingJobs();
  }, []);

  async function approveUser(user: PendingUser) {
    setApprovingUserId(user.id);
    setError("");
    setSuccess("");
    try {
      await approvalService.approve(user.id);
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setSuccess(`Đã phê duyệt tài khoản ${user.email}. Người dùng có thể đăng nhập ngay.`);
    } catch (caught: unknown) {
      setError(caught instanceof ApiError ? caught.message : "Không thể phê duyệt tài khoản.");
    } finally {
      setApprovingUserId(null);
    }
  }

  async function approveJob(job: RecruiterJob) {
    setActionJobId(job.id);
    setError("");
    setSuccess("");
    try {
      await recruiterService.approveJob(job.id);
      setPendingJobs((current) => current.filter((item) => item.id !== job.id));
      setSuccess(`Đã phê duyệt bài đăng "${job.title}". Bài đăng đã sẵn sàng để đăng tin tuyển dụng.`);
    } catch (caught: unknown) {
      setError(caught instanceof ApiError ? caught.message : "Không thể phê duyệt bài đăng tuyển dụng.");
    } finally {
      setActionJobId(null);
    }
  }

  async function rejectJob(job: RecruiterJob) {
    if (!confirm(`Bạn có chắc muốn từ chối bài đăng "${job.title}"?`)) return;
    setActionJobId(job.id);
    setError("");
    setSuccess("");
    try {
      await recruiterService.rejectJob(job.id);
      setPendingJobs((current) => current.filter((item) => item.id !== job.id));
      setSuccess(`Đã từ chối bài đăng "${job.title}".`);
    } catch (caught: unknown) {
      setError(caught instanceof ApiError ? caught.message : "Không thể từ chối bài đăng tuyển dụng.");
    } finally {
      setActionJobId(null);
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-blue-600">
            <UserCheck className="h-4 w-4" />
            Trung tâm kiểm duyệt Quản trị
          </div>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">
            Yêu cầu chờ phê duyệt
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Kiểm tra và xét duyệt tài khoản đăng ký mới cũng như các vị trí tuyển dụng do Nhân sự đề xuất.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            loadPendingUsers();
            loadPendingJobs();
          }}
          leftIcon={<RefreshCw className="h-4 w-4" />}
        >
          Làm mới
        </Button>
      </header>

      {error && <Alert variant="error" title="Không thể tải dữ liệu">{error}</Alert>}
      {success && <Alert variant="success" title="Thành công">{success}</Alert>}

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("users")}
          className={`relative flex items-center gap-2 px-5 py-3 text-sm font-bold transition-colors ${
            activeTab === "users"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>Tài khoản đăng ký</span>
          {users.length > 0 && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs text-white">
              {users.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("jobs")}
          className={`relative flex items-center gap-2 px-5 py-3 text-sm font-bold transition-colors ${
            activeTab === "jobs"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <BriefcaseBusiness className="h-4 w-4" />
          <span>Bài đăng tuyển dụng chờ duyệt</span>
          {pendingJobs.length > 0 && (
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
              {pendingJobs.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Pending Users */}
      {activeTab === "users" && (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-slate-200 px-5 py-4">
            <p className="text-sm font-bold text-slate-900">{users.length} yêu cầu đăng ký đang chờ</p>
          </div>
          {loadingUsers ? (
            <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Đang tải danh sách tài khoản...
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
              <h2 className="mt-3 font-bold text-slate-900">Không còn tài khoản chờ duyệt</h2>
              <p className="mt-1 text-sm text-slate-500">Tất cả tài khoản đăng ký đã được xử lý xong.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {users.map((user) => (
                <article key={user.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-50 font-bold text-amber-700">
                    {user.full_name.split(" ").slice(-2).map((part) => part[0]).join("")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-slate-900">{user.full_name}</h2>
                    <p className="truncate text-sm text-slate-500">{user.email}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-amber-700">
                      <Clock3 className="h-3.5 w-3.5" />
                      Đăng ký {user.created_at ? new Date(user.created_at).toLocaleDateString("vi-VN") : "gần đây"}
                    </p>
                  </div>
                  <Button
                    onClick={() => void approveUser(user)}
                    isLoading={approvingUserId === user.id}
                    leftIcon={<UserCheck className="h-4 w-4" />}
                  >
                    Phê duyệt kích hoạt
                  </Button>
                </article>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 2: Pending Job Postings */}
      {activeTab === "jobs" && (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-slate-200 px-5 py-4">
            <p className="text-sm font-bold text-slate-900">{pendingJobs.length} bài đăng đang chờ phê duyệt</p>
          </div>
          {loadingJobs ? (
            <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Đang tải danh sách bài đăng...
            </div>
          ) : pendingJobs.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
              <h2 className="mt-3 font-bold text-slate-900">Không có bài đăng nào cần duyệt</h2>
              <p className="mt-1 text-sm text-slate-500">Tất cả bài đăng tuyển dụng đã được xử lý hoặc đã duyệt.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingJobs.map((job) => (
                <article key={job.id} className="p-5 sm:p-6 space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                          #{job.id}
                        </span>
                        {job.requisition_id && (
                          <span className="rounded-lg bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                            REQ #{job.requisition_id}
                          </span>
                        )}
                        <span className="rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                          Chờ Admin duyệt
                        </span>
                      </div>
                      <h3 className="mt-2 text-lg font-extrabold text-slate-900">{job.title}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Người đề xuất: <span className="font-semibold text-slate-700">{job.created_by || "Nhân sự"}</span> • Ngày tạo: {job.created_at || "Gần đây"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => void approveJob(job)}
                        isLoading={actionJobId === job.id}
                        leftIcon={<CheckCircle2 className="h-4 w-4" />}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        Phê duyệt tin
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => void rejectJob(job)}
                        isLoading={actionJobId === job.id}
                        leftIcon={<XCircle className="h-4 w-4" />}
                      >
                        Từ chối
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 border-t border-slate-100 pt-3">
                    <span className="flex items-center gap-1">
                      <Building className="h-3.5 w-3.5 text-slate-400" />
                      {job.department} ({job.location})
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                      {job.salary_range}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      Chỉ tiêu: {job.openings} người
                    </span>
                    <span className="flex items-center gap-1 text-amber-700 font-medium">
                      <Calendar className="h-3.5 w-3.5" />
                      Hạn: {job.deadline}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
