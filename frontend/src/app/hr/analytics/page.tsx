"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  Users,
  Briefcase,
  Gift,
  Building2,
  Award,
  BarChart3,
  ArrowUpRight,
} from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { HrShell } from "@/features/hr/components/HrShell";
import {
  fetchAnalyticsOverview,
  fetchFunnelAnalytics,
  fetchDepartmentAnalytics,
  fetchReferralAnalytics,
  AnalyticsOverview,
  FunnelStageCount,
  DepartmentStat,
  ReferralAnalytics,
} from "@/features/analytics/services/analytics.service";
import { ApiError } from "@/lib/api-client";

export default function HrAnalyticsPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [funnel, setFunnel] = useState<FunnelStageCount[]>([]);
  const [departments, setDepartments] = useState<DepartmentStat[]>([]);
  const [referrals, setReferrals] = useState<ReferralAnalytics | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAllAnalytics = async () => {
    setLoading(true);
    setError("");
    try {
      const [ovData, funData, deptData, refData] = await Promise.all([
        fetchAnalyticsOverview(),
        fetchFunnelAnalytics(),
        fetchDepartmentAnalytics(),
        fetchReferralAnalytics(),
      ]);
      setOverview(ovData);
      setFunnel(funData);
      setDepartments(deptData);
      setReferrals(refData);
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : "Không thể tải dữ liệu báo cáo thống kê.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => void loadAllAnalytics());
  }, []);

  return (
    <HrShell>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Báo cáo & Thống kê Tuyển dụng</h1>
            <p className="text-sm text-slate-500">
              Phân tích chỉ số hiệu suất tuyển dụng (KPIs), phễu ứng viên, phân bổ theo phòng ban và tiền thưởng giới thiệu nhân sự.
            </p>
          </div>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        {loading ? (
          <Card className="p-8 text-center text-sm text-slate-500">Đang tổng hợp dữ liệu phân tích hệ thống...</Card>
        ) : (
          <>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-5 bg-white border border-slate-200/80 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tin Tuyển dụng</span>
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Briefcase className="h-5 w-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">{overview?.active_jobs || 0}</span>
                  <span className="text-xs text-slate-500">/ {overview?.total_jobs || 0} tổng vị trí</span>
                </div>
                <p className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">
                  <ArrowUpRight className="h-3.5 w-3.5" /> {overview?.total_requisitions || 0} Tờ trình đã duyệt
                </p>
              </Card>

              <Card className="p-5 bg-white border border-slate-200/80 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hồ sơ Ứng tuyển</span>
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">{overview?.total_applications || 0}</span>
                  <span className="text-xs text-slate-500">ứng viên</span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Toàn bộ ứng viên qua Job Portal & Referral</p>
              </Card>

              <Card className="p-5 bg-white border border-slate-200/80 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tỷ lệ Tuyển Thành Công</span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-600">{overview?.conversion_rate_pct || 0}%</span>
                </div>
                <p className="text-xs text-slate-600 font-semibold">
                  <strong className="text-slate-900">{overview?.hired_applications || 0}</strong> ứng viên đã nhận việc (Hired)
                </p>
              </Card>

              <Card className="p-5 bg-white border border-slate-200/80 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thưởng Giới Thiệu</span>
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                    <Gift className="h-5 w-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(overview?.total_bonus_paid_vnd || 0)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">{overview?.total_referrals || 0} hồ sơ được nhân viên giới thiệu</p>
              </Card>
            </div>

            {/* Section 1: Candidate Funnel Breakdown */}
            <Card className="p-6 bg-white space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" /> Phễu Tuyển dụng (Candidate Pipeline Funnel)
                  </h2>
                  <p className="text-xs text-slate-500">Tỷ lệ phân bổ ứng viên qua từng giai đoạn tuyển dụng trong hệ thống.</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {funnel.map((item) => {
                  let barBg = "bg-blue-600";
                  if (item.stage === "hired") barBg = "bg-emerald-600";
                  if (item.stage === "rejected") barBg = "bg-rose-500";
                  if (item.stage === "interviewing") barBg = "bg-purple-600";

                  return (
                    <div key={item.stage} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-800">{item.stage_label}</span>
                        <span className="text-slate-600">
                          {item.count} ứng viên ({item.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3">
                        <div
                          className={`${barBg} h-3 rounded-full transition-all duration-500`}
                          style={{ width: `${Math.max(item.percentage, item.count > 0 ? 3 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Section 2: Department Stats & Referral Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Department Statistics */}
              <Card className="p-6 bg-white space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-purple-600" /> Tuyển dụng Theo Phòng Ban
                    </h2>
                    <p className="text-xs text-slate-500">Phân bổ tin đăng và ứng viên theo khối ban.</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold">
                        <th className="py-2.5 px-3">Phòng Ban</th>
                        <th className="py-2.5 px-3 text-center">Tin tuyển</th>
                        <th className="py-2.5 px-3 text-center">Ứng viên</th>
                        <th className="py-2.5 px-3 text-center">Đã tuyển</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {departments.map((dept) => (
                        <tr key={dept.department_id} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{dept.department_name}</td>
                          <td className="py-2.5 px-3 text-center">{dept.job_count}</td>
                          <td className="py-2.5 px-3 text-center">{dept.application_count}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-emerald-600">{dept.hired_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Referral Leaderboard */}
              <Card className="p-6 bg-white space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Award className="h-5 w-5 text-amber-500" /> Top Nhân Viên Giới Thiệu Xuất Sắc
                    </h2>
                    <p className="text-xs text-slate-500">Bảng vinh danh nhân viên tích cực giới thiệu tài năng.</p>
                  </div>
                </div>

                {referrals?.top_referrers.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">Chưa có dữ liệu vinh danh giới thiệu nhân sự.</p>
                ) : (
                  <div className="space-y-3">
                    {referrals?.top_referrers.map((rf, idx) => (
                      <div key={rf.user_id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full font-black text-xs ${
                              idx === 0
                                ? "bg-amber-100 text-amber-800"
                                : idx === 1
                                ? "bg-slate-200 text-slate-800"
                                : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 block">{rf.full_name}</span>
                            <span className="text-slate-500 text-[11px]">{rf.email}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-bold text-emerald-600 block">
                            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(rf.total_bonus_vnd)}
                          </span>
                          <span className="text-slate-500 text-[11px]">
                            {rf.total_referrals} giới thiệu ({rf.hired_referrals} trúng tuyển)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </HrShell>
  );
}
