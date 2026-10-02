"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Briefcase,
  Mail,
  Laptop,
  UserPlus,
  FileCheck,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { HrShell } from "@/features/hr/components/HrShell";
import {
  fetchManageOffers,
  fetchManageOnboarding,
  updateOfferStatus,
  updateOnboarding,
  OfferItem,
  OnboardingItem,
} from "@/features/offers/services/offer.service";

const OFFER_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  draft: { label: "Nháp", bg: "bg-slate-100", text: "text-slate-600" },
  sent: { label: "Đã gửi Offer", bg: "bg-blue-50", text: "text-blue-700" },
  accepted: { label: "Đã chấp nhận", bg: "bg-emerald-50", text: "text-emerald-700" },
  declined: { label: "Từ chối Offer", bg: "bg-rose-50", text: "text-rose-700" },
  expired: { label: "Hết hạn", bg: "bg-amber-50", text: "text-amber-700" },
};

export default function HrOffersPage() {
  const [activeTab, setActiveTab] = useState<"offers" | "onboarding">("offers");
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [onboardings, setOnboardings] = useState<OnboardingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadOffersData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchManageOffers();
      setOffers(res.items);
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách Thư mời nhận việc.");
    } finally {
      setLoading(false);
    }
  };

  const loadOnboardingData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchManageOnboarding();
      setOnboardings(res.items);
    } catch (err: any) {
      setError(err.message || "Không thể tải tiến độ Onboarding nhân sự mới.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "offers") {
      loadOffersData();
    } else {
      loadOnboardingData();
    }
  }, [activeTab]);

  const handleUpdateOffer = async (id: number, status: string) => {
    try {
      await updateOfferStatus(id, status);
      setNotice(
        status === "accepted"
          ? "Ứng viên đã chấp nhận Offer! Tiến độ Onboarding Nhân sự Mới đã được tự động kích hoạt."
          : `Đã cập nhật trạng thái Offer thành: ${OFFER_STATUS_CONFIG[status]?.label || status}`
      );
      loadOffersData();
    } catch (err: any) {
      setError(err.message || "Không thể cập nhật trạng thái Offer.");
    }
  };

  const handleToggleOnboardingItem = async (
    onboardingId: number,
    field: keyof OnboardingItem,
    currentVal: boolean
  ) => {
    try {
      await updateOnboarding(onboardingId, { [field]: !currentVal });
      loadOnboardingData();
    } catch (err: any) {
      setError(err.message || "Không thể cập nhật danh mục Onboarding.");
    }
  };

  return (
    <HrShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Quản lý Offer & Quy trình Onboarding Nhân sự Mới</h1>
          <p className="text-sm text-slate-500">
            Phát hành Thư mời Nhận việc (Offer Letter), theo dõi phản hồi ứng viên và quản lý danh mục hội nhập nhân sự mới.
          </p>
        </div>

        {error && <Alert variant="error">{error}</Alert>}
        {notice && <Alert variant="success">{notice}</Alert>}

        {/* View Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-200 gap-2 pb-px">
          <button
            onClick={() => setActiveTab("offers")}
            className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-bold transition-colors ${
              activeTab === "offers" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Thư mời Nhận việc (Job Offers)
          </button>
          <button
            onClick={() => setActiveTab("onboarding")}
            className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-bold transition-colors ${
              activeTab === "onboarding" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Tiến độ Onboarding Nhân sự Mới
          </button>
        </div>

        {/* OFFERS TAB CONTENT */}
        {activeTab === "offers" && (
          <div className="space-y-4">
            {loading ? (
              <Card className="p-8 text-center text-sm text-slate-500">Đang tải danh sách Offer...</Card>
            ) : offers.length === 0 ? (
              <Card className="p-8 text-center text-sm text-slate-500">Chưa có Thư mời nhận việc nào được phát hành.</Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {offers.map((item) => {
                  const st = OFFER_STATUS_CONFIG[item.status] || OFFER_STATUS_CONFIG.sent;
                  return (
                    <Card key={item.id} className="p-5 space-y-4 hover:shadow-md transition-shadow bg-white">
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <span className="text-xs font-mono font-bold text-blue-600 block">{item.code}</span>
                          <h3 className="font-bold text-slate-900 text-base">{item.position_title}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Ứng viên: <strong className="text-slate-800">{item.candidate_name || "N/A"}</strong> ({item.candidate_email})
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${st.bg} ${st.text}`}>
                          {st.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="block font-bold text-slate-800">
                              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.offered_salary)}
                            </span>
                            <span className="text-slate-500">Mức lương đề xuất</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600 shrink-0" />
                          <div>
                            <span className="block font-bold text-slate-800">
                              {new Date(item.start_date).toLocaleDateString("vi-VN")}
                            </span>
                            <span className="text-slate-500">Ngày bắt đầu (Thử việc {item.probation_period_months} tháng)</span>
                          </div>
                        </div>
                      </div>

                      {item.notes && (
                        <p className="text-xs text-slate-600 italic bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                          Ghi chú: {item.notes}
                        </p>
                      )}

                      {/* Actions */}
                      {item.status === "sent" && (
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateOffer(item.id, "accepted")}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Ứng viên Đã đồng ý
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleUpdateOffer(item.id, "declined")}
                          >
                            <XCircle className="h-3.5 w-3.5" /> Ứng viên Từ chối
                          </Button>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ONBOARDING TAB CONTENT */}
        {activeTab === "onboarding" && (
          <div className="space-y-4">
            {loading ? (
              <Card className="p-8 text-center text-sm text-slate-500">Đang tải danh mục Onboarding...</Card>
            ) : onboardings.length === 0 ? (
              <Card className="p-8 text-center text-sm text-slate-500">Chưa có ứng viên trúng tuyển nào trong danh sách Onboarding.</Card>
            ) : (
              <div className="space-y-4">
                {onboardings.map((ob) => {
                  const tasks = [
                    { id: "welcome_email_sent", label: "Gửi Email Chào mừng & Hướng dẫn ngày đầu tiên", icon: Mail, checked: ob.welcome_email_sent },
                    { id: "equipment_prepared", label: "Cấp phát Laptop, Thiết bị làm việc & Vấn phòng phẩm", icon: Laptop, checked: ob.equipment_prepared },
                    { id: "account_created", label: "Khởi tạo Tài khoản Email & Hệ thống Nội bộ Công ty", icon: UserPlus, checked: ob.account_created },
                    { id: "documents_submitted", label: "Thu nộp Hồ sơ Nhân sự, Bằng cấp & Hợp đồng Lao động", icon: FileCheck, checked: ob.documents_submitted },
                    { id: "orientation_scheduled", label: "Lên lịch Buổi Đào tạo Định hướng (Orientation Day)", icon: Calendar, checked: ob.orientation_scheduled },
                  ];

                  const completedCount = tasks.filter((t) => t.checked).length;
                  const progressPct = Math.round((completedCount / tasks.length) * 100);

                  return (
                    <Card key={ob.id} className="p-5 space-y-4 bg-white hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                            <UserCheck className="h-5 w-5 text-blue-600" /> {ob.candidate_name || "Nhân sự Mới"}
                          </h3>
                          <p className="text-xs text-slate-500">
                            Vị trí: <strong className="text-slate-800">{ob.job_title}</strong> — {ob.department_name}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-xs font-bold text-blue-600">{progressPct}% Hoàn thành</span>
                            <div className="w-32 bg-slate-100 rounded-full h-2 mt-1">
                              <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                            </div>
                          </div>
                          {ob.status === "completed" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                              <Sparkles className="h-3.5 w-3.5" /> Hoàn tất Nhập môn
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                              <Clock className="h-3.5 w-3.5" /> Đang triển khai
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Checklist Items */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {tasks.map((task) => {
                          const IconComp = task.icon;
                          return (
                            <label
                              key={task.id}
                              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                                task.checked ? "bg-emerald-50/40 border-emerald-200 text-slate-900" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/70"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={task.checked}
                                onChange={() => handleToggleOnboardingItem(ob.id, task.id as keyof OnboardingItem, task.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <IconComp className={`h-4 w-4 shrink-0 ${task.checked ? "text-emerald-600" : "text-slate-400"}`} />
                              <span className="text-xs font-medium flex-1">{task.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </HrShell>
  );
}
