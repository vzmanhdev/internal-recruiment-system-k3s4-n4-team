"use client";

import { useEffect, useState } from "react";
import {
  Award,
  CheckCircle,
  Clock,
  DollarSign,
  Gift,
  HelpCircle,
  MoreVertical,
  Search,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { recruiterService } from "../services/recruiter.service";
import type { ReferralItem } from "../types/recruiter.types";
import { Spinner } from "@/components/ui/Spinner";

export function ReferralManagement() {
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadReferrals = async () => {
    try {
      setLoading(true);
      const res = await recruiterService.getReferrals(statusFilter);
      setReferrals(res.items);
    } catch (err) {
      console.error("Failed to load referrals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferrals();
  }, [statusFilter]);

  const handleUpdateStatus = async (item: ReferralItem, newStatus: string, bonusStatus: string) => {
    try {
      const updated = await recruiterService.updateReferral(item.id, {
        status: newStatus,
        bonus_status: bonusStatus,
      });
      setReferrals((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setToastMessage(`Đã cập nhật trạng thái giới thiệu của ${item.candidate_name}.`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error(err);
      alert("Đã xảy ra lỗi khi cập nhật.");
    }
  };

  const totalBonus = referrals
    .filter((r) => r.bonus_status === "eligible" || r.bonus_status === "paid")
    .length * 10;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-xl">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header section */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Chương Trình Giới Thiệu Nhân Tài (Referral)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Theo dõi các hồ sơ ứng viên do nhân viên nội bộ đề xuất, xác nhận điều kiện chi trả hoa hồng thưởng giới thiệu.
        </p>
      </div>

      {/* Program Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tổng hồ sơ giới thiệu
            </span>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <UserPlus className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900">{referrals.length}</p>
          <p className="mt-1 text-xs text-slate-500">Được nhân viên các khối giới thiệu</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Đã trúng tuyển thành công
            </span>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900">
            {referrals.filter((r) => r.status === "hired").length}
          </p>
          <p className="mt-1 text-xs text-emerald-600 font-medium">Tỷ lệ chuyển đổi cao</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Quỹ thưởng giải ngân
            </span>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <Gift className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-900">{totalBonus} Triệu VNĐ</p>
          <p className="mt-1 text-xs text-slate-500">Dành cho nhân viên giới thiệu</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 w-fit">
        {[
          { id: "all", label: "Tất cả hồ sơ" },
          { id: "processing", label: "Đang xử lý" },
          { id: "interviewed", label: "Đã phỏng vấn" },
          { id: "hired", label: "Đã tuyển dụng" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
              statusFilter === tab.id
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : referrals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Gift className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-3 text-sm font-bold text-slate-800">Chưa có bản ghi giới thiệu nào</h3>
          <p className="mt-1 text-xs text-slate-500">Các ứng viên do nhân viên nội bộ giới thiệu sẽ hiển thị ở đây.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Ứng viên được giới thiệu</th>
                  <th className="px-4 py-3.5">Người giới thiệu (Đồng nghiệp)</th>
                  <th className="px-4 py-3.5">Vị trí giới thiệu</th>
                  <th className="px-4 py-3.5">Tiền thưởng</th>
                  <th className="px-4 py-3.5">Trạng thái hồ sơ</th>
                  <th className="px-4 py-3.5 text-right">Phê duyệt thưởng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {referrals.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{r.candidate_name}</div>
                      <div className="text-[11px] text-slate-500">{r.candidate_email} • {r.candidate_phone}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-bold text-blue-700">{r.referrer_name}</div>
                      <div className="text-[11px] text-slate-500">
                        {r.referrer_department} ({r.relationship})
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-semibold text-slate-700">
                      {r.job_title}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-extrabold text-slate-900">{r.bonus_amount}</div>
                      <span
                        className={`inline-block mt-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          r.bonus_status === "paid"
                            ? "bg-emerald-600 text-white"
                            : r.bonus_status === "eligible"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {r.bonus_status === "paid"
                          ? "Đã chi trả ✓"
                          : r.bonus_status === "eligible"
                          ? "Đủ điều kiện thưởng"
                          : "Chờ xét duyệt"}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold ${
                          r.status === "hired"
                            ? "bg-emerald-600 text-white"
                            : r.status === "interviewed"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {r.status === "hired"
                          ? "Đã trúng tuyển"
                          : r.status === "interviewed"
                          ? "Đã phỏng vấn"
                          : "Đang thẩm định"}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right space-x-1">
                      {r.status !== "hired" ? (
                        <button
                          onClick={() => handleUpdateStatus(r, "hired", "eligible")}
                          className="rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 shadow-xs"
                        >
                          Duyệt trúng tuyển
                        </button>
                      ) : r.bonus_status !== "paid" ? (
                        <button
                          onClick={() => handleUpdateStatus(r, "hired", "paid")}
                          className="rounded-lg bg-blue-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-blue-700 shadow-xs"
                        >
                          Xác nhận trả thưởng
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-700">
                          Hoàn tất ✓
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
