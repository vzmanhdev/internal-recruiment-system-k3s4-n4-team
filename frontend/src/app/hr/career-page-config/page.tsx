"use client";

import React, { useState } from "react";
import { apiRequest, ApiError } from "@/lib/api-client";
import { useApiData } from "@/hooks/useApiData";
import { ErrorState, LoadingState } from "@/components/ui/DataStates";

interface CareerSettings {
  configured?: boolean; company_name?: string; slogan?: string; logo_url?: string; banner_url?: string; about_us?: string;
  benefits?: Array<{ title: string; description: string; icon: string }>;
}
import {
  Globe,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  Save,
  Sparkles,
  Building2,
  Heart,
  ShieldCheck,
  Laptop,
  Plane,
  Award,
  Coffee,
  Check,
} from "lucide-react";

interface BenefitItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export default function HRCareerPageConfig() {
  // what the public career page currently shows (empty until HR saves it the first time)
  const { data, error, loading, reload } = useApiData(() => apiRequest<CareerSettings>("/public/career-page"), []);
  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState error={error} onRetry={reload} />;
  return <CareerPageEditor initial={data} />;
}

function CareerPageEditor({ initial }: { initial: CareerSettings }) {
  // Brand & Media CMS State
  const [companyName, setCompanyName] = useState(initial.company_name || "");
  const [slogan, setSlogan] = useState(initial.slogan || "");
  const [logoUrl, setLogoUrl] = useState(initial.logo_url || "");
  const [bannerUrl, setBannerUrl] = useState(initial.banner_url || "");
  const [aboutUs, setAboutUs] = useState(initial.about_us || "");

  // Benefits list
  const [benefits, setBenefits] = useState<BenefitItem[]>(
    (initial.benefits || []).map((b, i) => ({ id: `b${i + 1}`, title: b.title, description: b.description, iconName: b.icon })),
  );
  const [saving, setSaving] = useState(false);

  // Tab preview vs editor
  const [previewMode, setPreviewMode] = useState<"editor" | "preview">("editor");

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Add benefit
  const handleAddBenefit = () => {
    const newId = `b-${Date.now()}`;
    setBenefits((prev) => [
      ...prev,
      {
        id: newId,
        title: "Phúc lợi mới",
        description: "Mô tả chi tiết quyền lợi dành cho nhân viên...",
        iconName: "Coffee",
      },
    ]);
    showToast("Đã thêm một mục phúc lợi mới!");
  };

  // Remove benefit
  const handleRemoveBenefit = (id: string) => {
    if (benefits.length < 1) {
      showToast("Cần giữ lại ít nhất một mục phúc lợi!", "error");
      return;
    }
    setBenefits((prev) => prev.filter((b) => b.id !== id));
    showToast("Đã xóa mục phúc lợi!");
  };

  // Update benefit
  const handleUpdateBenefit = (id: string, field: "title" | "description", value: string) => {
    setBenefits((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  // Save CMS
  const handleSaveCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      showToast("Vui lòng nhập tên công ty!", "error");
      return;
    }
    setSaving(true);
    try {
      await apiRequest("/hr/career-page", {
        method: "PUT",
        body: JSON.stringify({
          company_name: companyName.trim(), slogan, logo_url: logoUrl.trim(), banner_url: bannerUrl.trim(), about_us: aboutUs,
          benefits: benefits.map((b) => ({ title: b.title, description: b.description, icon: b.iconName })),
        }),
      });
      showToast("Đã xuất bản cấu hình Career Page lên Cổng tuyển dụng thành công!", "success");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Không lưu được cấu hình.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Container Card */}
      <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-extrabold text-[10px] tracking-wider uppercase border border-emerald-200">
                Career Site CMS
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Xây dựng thương hiệu nhà tuyển dụng (Employer Branding)
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 mt-1 tracking-tight">
              Cấu Hình Cổng Tuyển Dụng (Career Page)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Tùy biến Logo thương hiệu, Banner bìa, câu chuyện &ldquo;Về chúng tôi&rdquo; và các đãi ngộ đặc quyền hiển thị trên Cổng sự nghiệp công khai.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setPreviewMode("editor")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  previewMode === "editor"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Trình chỉnh sửa CMS
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("preview")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  previewMode === "preview"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem trước Portal</span>
              </button>
            </div>
          </div>
        </div>

        {previewMode === "editor" ? (
          /* TRÌNH CHỈNH SỬA CMS (EDITOR) */
          <form onSubmit={handleSaveCMS} className="space-y-6">
            {/* PHẦN 1: THƯƠNG HIỆU & HÌNH ẢNH (LOGO & BANNER COVER) */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  1. Nhận Diện Thương Hiệu & Banner Bìa
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Logo Upload Simulation */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Logo Doanh Nghiệp (PNG / SVG trong suốt, kích thước khuyến nghị 400x120px)
                  </label>
                  <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-dashed border-slate-300">
                    <div className="w-16 h-16 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <Building2 className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <input
                        type="text"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="Nhập đường dẫn logo hoặc tải lên file..."
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => showToast("Đã chọn file logo thành công!")}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Tải logo mới</span>
                        </button>
                        <span className="text-[10px] text-slate-400">Tối đa 2MB</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Banner Cover Upload Simulation */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Banner Cover Trang Chủ Tuyển Dụng (Khuyến nghị 1920x600px, JPG/WebP)
                  </label>
                  <div className="space-y-2">
                    <div className="relative h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                      {bannerUrl && (
                        <img src={bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => showToast("Mở hộp thoại tải lên Banner mới!")}
                          className="px-3 py-1.5 bg-white/90 hover:bg-white text-slate-900 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Thay đổi ảnh bìa</span>
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={bannerUrl}
                      onChange={(e) => setBannerUrl(e.target.value)}
                      placeholder="URL Banner ảnh bìa..."
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên Hiển Thị Công Ty
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Khẩu Hiệu / Slogan Tuyển Dụng
                  </label>
                  <input
                    type="text"
                    required
                    value={slogan}
                    onChange={(e) => setSlogan(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* PHẦN 2: GIỚI THIỆU "VỀ CHÚNG TÔI" */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">
                    2. Giới Thiệu &ldquo;Về Chúng Tôi&rdquo; (About Us Narrative)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  {aboutUs.length} ký tự
                </span>
              </div>

              <div>
                <textarea
                  rows={5}
                  required
                  value={aboutUs}
                  onChange={(e) => setAboutUs(e.target.value)}
                  placeholder="Viết câu chuyện doanh nghiệp, tầm nhìn, sứ mệnh và văn hóa công ty..."
                  className="w-full px-4 py-3 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden leading-relaxed font-medium"
                />
              </div>
            </div>

            {/* PHẦN 3: PHÚC LỢI CÔNG TY (COMPANY BENEFITS) */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <h3 className="text-sm font-extrabold text-slate-900">
                    3. Phúc Lợi & Đãi Ngộ Đặc Quyền (Company Benefits)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddBenefit}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm phúc lợi</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {benefits.map((b, idx) => (
                  <div
                    key={b.id}
                    className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        Phúc lợi #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBenefit(b.id)}
                        className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                        title="Xóa mục này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={b.title}
                        onChange={(e) => handleUpdateBenefit(b.id, "title", e.target.value)}
                        placeholder="Tiêu đề phúc lợi..."
                        className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                      />
                    </div>

                    <div>
                      <textarea
                        rows={2}
                        value={b.description}
                        onChange={(e) => handleUpdateBenefit(b.id, "description", e.target.value)}
                        placeholder="Mô tả chi tiết quyền lợi..."
                        className="w-full px-2.5 py-1.5 text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Xuất bản & Cập nhật Career Page</span>
              </button>
            </div>
          </form>
        ) : (
          /* TRÌNH XEM TRƯỚC PORTAL (LIVE PREVIEW) */
          <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-xl bg-white space-y-0">
            {/* Banner Cover Section */}
            <div className="relative h-64 md:h-80 w-full overflow-hidden">
              {bannerUrl && (
                <img src={bannerUrl} alt="Career Cover" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent flex flex-col justify-end p-8 text-white space-y-2">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/20 w-fit">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>{companyName}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight max-w-2xl">
                  {slogan}
                </h2>
              </div>
            </div>

            {/* About Us Preview */}
            <div className="p-8 md:p-12 space-y-6 max-w-5xl mx-auto">
              <div className="text-center space-y-2">
                <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                  Về Chúng Tôi
                </span>
                <h3 className="text-xl md:text-2xl font-black text-slate-900">
                  Văn Hóa Làm Việc & Sứ Mệnh Tổ Chức
                </h3>
              </div>
              <p className="text-xs md:text-sm text-slate-600 leading-relaxed text-center max-w-3xl mx-auto">
                {aboutUs}
              </p>

              {/* Benefits Grid */}
              <div className="pt-8">
                <div className="text-center mb-6">
                  <span className="text-[11px] font-black uppercase text-emerald-600 tracking-wider">
                    Quyền Lợi & Đãi Ngộ
                  </span>
                  <h4 className="text-lg md:text-xl font-black text-slate-900 mt-0.5">
                    Tại Sao Bạn Sẽ Thích Làm Việc Tại Đây?
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {benefits.map((b) => (
                    <div
                      key={b.id}
                      className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 hover:border-blue-300 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        <Award className="w-5 h-5" />
                      </div>
                      <h5 className="text-sm font-bold text-slate-900">{b.title}</h5>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {b.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-100 border-t border-slate-200 text-center text-xs text-slate-500 font-medium">
              Giao diện mô phỏng trang Career Portal dành cho ứng viên công khai.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
