"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { apiRequest, ApiError } from "@/lib/api-client";
import { useApiData } from "@/hooks/useApiData";
import { ErrorState, LoadingState } from "@/components/ui/DataStates";
import { uploadFile, fileUrl } from "@/services/file.service";
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
  Zap,
  HeartHandshake,
  TrendingUp,
  GraduationCap,
  Phone,
  Mail,
  MapPin,
  Link2,
  ExternalLink,
  RotateCcw,
  Monitor,
  Tablet,
  Smartphone,
  Loader2,
  Check,
} from "lucide-react";

interface CareerBenefit {
  title: string;
  description: string;
  icon: string;
}

interface CareerSettings {
  configured?: boolean;
  company_name?: string;
  slogan?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  website?: string;
  logo_url?: string;
  banner_url?: string;
  about_us?: string;
  benefits?: CareerBenefit[];
  updated_at?: string | null;
  updated_by_name?: string | null;
}

interface BenefitItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

const BENEFIT_ICONS = [
  { name: "ShieldCheck", label: "Bảo hiểm / An sinh", icon: ShieldCheck },
  { name: "GraduationCap", label: "Đào tạo & Học bổng", icon: GraduationCap },
  { name: "Award", label: "Thưởng & Đãi ngộ", icon: Award },
  { name: "Laptop", label: "Thiết bị & Công nghệ", icon: Laptop },
  { name: "Plane", label: "Du lịch & Nghỉ phép", icon: Plane },
  { name: "Coffee", label: "Không gian làm việc", icon: Coffee },
  { name: "Zap", label: "Phát triển nhanh", icon: Zap },
  { name: "HeartHandshake", label: "Văn hóa gắn kết", icon: HeartHandshake },
  { name: "TrendingUp", label: "Lộ trình thăng tiến", icon: TrendingUp },
];

function resolveBenefitIcon(iconName?: string) {
  const match = BENEFIT_ICONS.find((i) => i.name.toLowerCase() === (iconName || "").toLowerCase());
  return match ? match.icon : ShieldCheck;
}

const DEFAULT_CAREER_VALUES: CareerSettings = {
  configured: true,
  company_name: "Tập Đoàn Doanh Nghiệp Enterprise",
  slogan: "Cùng nhau tạo nên những điều lớn lao và bứt phá nấc thang sự nghiệp",
  contact_email: "tuyendung@enterprise.com",
  contact_phone: "1900 6868",
  address: "Tầng 12, Tòa nhà Enterprise Tower, Cầu Giấy, Hà Nội",
  website: "https://enterprise.com",
  logo_url: "",
  banner_url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop",
  about_us:
    "Về danh tiếng và thị trường, công ty là điểm tựa vững chắc cho sự nghiệp của bạn. Chúng tôi tin rằng tài sản quý giá nhất chính là đội ngũ nhân sự. Sứ mệnh của chúng tôi là tạo nên không gian làm việc mở, công bằng và cơ hội phát triển không giới hạn cho mọi nhân viên.",
  benefits: [
    { title: "Bảo hiểm toàn diện", description: "Bảo hiểm toàn diện nhân lương, bảo hiểm y tế mở rộng cho cả gia đình.", icon: "ShieldCheck" },
    { title: "Đào tạo chuyên sâu", description: "Đào tạo chuyên sâu các kỹ năng mới, hỗ trợ 100% học bổng chứng chỉ quốc tế.", icon: "GraduationCap" },
    { title: "Thưởng thâm niên", description: "Thưởng thâm niên và các chế độ đãi ngộ vượt bậc khi cống hiến lâu dài.", icon: "Award" },
  ],
};

export default function HRCareerPageConfig() {
  const { data, error, loading, reload } = useApiData(
    () => apiRequest<CareerSettings>("/hr/career-page").catch(() => apiRequest<CareerSettings>("/public/career-page")),
    []
  );

  if (loading) return <LoadingState label="Đang tải cấu hình trang giới thiệu công ty..." />;
  if (error || !data) return <ErrorState error={error} onRetry={reload} />;

  return <CareerPageEditor initial={data} onSaved={reload} />;
}

function CareerPageEditor({ initial, onSaved }: { initial: CareerSettings; onSaved: () => void }) {
  // Brand & Content CMS States
  const [companyName, setCompanyName] = useState(initial.company_name || DEFAULT_CAREER_VALUES.company_name || "");
  const [slogan, setSlogan] = useState(initial.slogan || DEFAULT_CAREER_VALUES.slogan || "");
  const [contactEmail, setContactEmail] = useState(initial.contact_email || DEFAULT_CAREER_VALUES.contact_email || "");
  const [contactPhone, setContactPhone] = useState(initial.contact_phone || DEFAULT_CAREER_VALUES.contact_phone || "");
  const [address, setAddress] = useState(initial.address || DEFAULT_CAREER_VALUES.address || "");
  const [website, setWebsite] = useState(initial.website || DEFAULT_CAREER_VALUES.website || "");
  const [logoUrl, setLogoUrl] = useState(initial.logo_url || "");
  const [bannerUrl, setBannerUrl] = useState(initial.banner_url || DEFAULT_CAREER_VALUES.banner_url || "");
  const [logoError, setLogoError] = useState(false);
  const [bannerError, setBannerError] = useState(false);
  const [aboutUs, setAboutUs] = useState(initial.about_us || DEFAULT_CAREER_VALUES.about_us || "");

  // Benefits list
  const initialBenefits = (initial.benefits && initial.benefits.length > 0) ? initial.benefits : (DEFAULT_CAREER_VALUES.benefits || []);
  const [benefits, setBenefits] = useState<BenefitItem[]>(
    initialBenefits.map((b, i) => ({
      id: `b-${i + 1}-${Date.now()}`,
      title: b.title,
      description: b.description,
      iconName: b.icon || "Award",
    }))
  );

  // Upload States
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Tab & Preview States
  const [previewMode, setPreviewMode] = useState<"editor" | "preview">("editor");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Mark changes
  const markDirty = () => setHasUnsavedChanges(true);

  // Warn on tab exit if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Handle Logo Upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Logo không được vượt quá 5MB!", "error");
      return;
    }
    const validTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      showToast("Logo chỉ nhận định dạng PNG, JPG, WebP hoặc SVG!", "error");
      return;
    }

    setUploadingLogo(true);
    try {
      const res = await uploadFile("company_logo", file);
      const publicPath = res.url;
      setLogoUrl(fileUrl(publicPath));
      setLogoError(false);
      markDirty();
      showToast("Tải Logo doanh nghiệp thành công!");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Tải Logo thất bại. Vui lòng thử lại.", "error");
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  // Handle Banner Upload
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast("Ảnh bìa không được vượt quá 10MB!", "error");
      return;
    }
    const validTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      showToast("Ảnh bìa chỉ nhận định dạng PNG, JPG hoặc WebP!", "error");
      return;
    }

    setUploadingBanner(true);
    try {
      const res = await uploadFile("company_banner", file);
      const publicPath = res.url;
      setBannerUrl(fileUrl(publicPath));
      setBannerError(false);
      markDirty();
      showToast("Tải ảnh bìa Banner thành công!");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Tải ảnh bìa thất bại. Vui lòng thử lại.", "error");
    } finally {
      setUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  // Add benefit
  const handleAddBenefit = () => {
    if (benefits.length >= 12) {
      showToast("Tối đa 12 mục phúc lợi để đảm bảo tính tinh gọn của Cổng tuyển dụng!", "error");
      return;
    }
    const newId = `b-${Date.now()}`;
    setBenefits((prev) => [
      ...prev,
      {
        id: newId,
        title: "Quyền lợi đặc quyền mới",
        description: "Mô tả chi tiết chính sách và đãi ngộ hấp dẫn dành cho nhân viên...",
        iconName: "Award",
      },
    ]);
    markDirty();
    showToast("Đã thêm một mục phúc lợi mới!");
  };

  // Remove benefit
  const handleRemoveBenefit = (id: string) => {
    if (benefits.length <= 1) {
      showToast("Cần giữ lại ít nhất một mục phúc lợi!", "error");
      return;
    }
    setBenefits((prev) => prev.filter((b) => b.id !== id));
    markDirty();
    showToast("Đã xóa mục phúc lợi!");
  };

  // Update benefit
  const handleUpdateBenefit = (id: string, field: "title" | "description" | "iconName", value: string) => {
    setBenefits((prev) => prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
    markDirty();
  };

  // Reset to default
  const handleResetDefaults = () => {
    if (confirm("Bạn có chắc chắn muốn khôi phục về các giá trị chuẩn mặc định của công ty không?")) {
      setCompanyName(DEFAULT_CAREER_VALUES.company_name || "");
      setSlogan(DEFAULT_CAREER_VALUES.slogan || "");
      setContactEmail(DEFAULT_CAREER_VALUES.contact_email || "");
      setContactPhone(DEFAULT_CAREER_VALUES.contact_phone || "");
      setAddress(DEFAULT_CAREER_VALUES.address || "");
      setWebsite(DEFAULT_CAREER_VALUES.website || "");
      setLogoUrl("");
      setBannerUrl(DEFAULT_CAREER_VALUES.banner_url || "");
      setAboutUs(DEFAULT_CAREER_VALUES.about_us || "");
      setBenefits(
        (DEFAULT_CAREER_VALUES.benefits || []).map((b, i) => ({
          id: `b-${i + 1}-${Date.now()}`,
          title: b.title,
          description: b.description,
          iconName: b.icon || "Award",
        }))
      );
      markDirty();
      showToast("Đã khôi phục về giá trị mặc định!");
    }
  };

  // Save CMS
  const handleSaveCMS = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!companyName.trim()) {
      showToast("Vui lòng nhập tên công ty!", "error");
      return;
    }
    setSaving(true);
    try {
      await apiRequest("/hr/career-page", {
        method: "PUT",
        body: JSON.stringify({
          company_name: companyName.trim(),
          slogan: slogan.trim(),
          contact_email: contactEmail.trim(),
          contact_phone: contactPhone.trim(),
          address: address.trim(),
          website: website.trim(),
          logo_url: logoUrl.trim(),
          banner_url: bannerUrl.trim(),
          about_us: aboutUs.trim(),
          benefits: benefits.map((b) => ({
            title: b.title.trim(),
            description: b.description.trim(),
            icon: b.iconName,
          })),
        }),
      });
      setHasUnsavedChanges(false);
      showToast("Đã xuất bản cấu hình Cổng tuyển dụng thành công!", "success");
      onSaved();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Không thể lưu cấu hình. Vui lòng thử lại.", "error");
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
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-500/10"
              : "bg-rose-50 text-rose-800 border-rose-200 shadow-rose-500/10"
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
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[10px] tracking-wider uppercase border border-blue-200">
                Career Page CMS (S2-09)
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Thương hiệu nhà tuyển dụng (Employer Branding)
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 mt-1 tracking-tight">
              Cấu Hình Trang Giới Thiệu Công Ty
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Tùy biến Logo thương hiệu, Banner bìa, câu chuyện &ldquo;Về chúng tôi&rdquo;, văn hóa làm việc và đãi ngộ nhân sự hiển thị trên Cổng tuyển dụng công khai.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle */}
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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  previewMode === "preview"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem trước Portal</span>
              </button>
            </div>

            {/* Quick Open Public Site */}
            <Link
              href="/"
              target="_blank"
              title="Mở cổng tuyển dụng thực tế trong tab mới"
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cổng công khai</span>
            </Link>
          </div>
        </div>

        {/* Audit Metadata Info */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Trạng thái: <strong>{initial.configured ? "Đã xuất bản công khai" : "Đang sử dụng cấu hình mặc định"}</strong></span>
          </div>
          {initial.updated_at && (
            <div className="text-slate-500">
              Cập nhật lần cuối: <strong className="text-slate-700">{new Date(initial.updated_at).toLocaleString("vi-VN")}</strong>
              {initial.updated_by_name && <span> bởi <strong>{initial.updated_by_name}</strong></span>}
            </div>
          )}
        </div>

        {previewMode === "editor" ? (
          /* ========================================================================= */
          /* TAB 1: TRÌNH CHỈNH SỬA CMS (EDITOR) */
          /* ========================================================================= */
          <form onSubmit={handleSaveCMS} className="space-y-6">
            {/* PHẦN 1: THƯƠNG HIỆU & HÌNH ẢNH (LOGO & BANNER COVER) */}
            <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  1. Nhận Diện Thương Hiệu & Ảnh Bìa (Logo & Banner)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Logo Upload Dropzone */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Logo Doanh Nghiệp (PNG, JPG, WebP hoặc SVG, tối đa 5MB)
                  </label>
                  <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-dashed border-slate-300 hover:border-blue-400 transition-colors">
                    {/* Logo Preview Box */}
                    <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center p-1.5 shrink-0 overflow-hidden relative group">
                      {logoUrl && !logoError ? (
                        <img
                          src={logoUrl}
                          alt="Company Logo"
                          className="w-full h-full object-contain"
                          onError={() => setLogoError(true)}
                        />
                      ) : logoError ? (
                        <div className="flex flex-col items-center justify-center text-center p-1">
                          <AlertCircle className="w-5 h-5 text-amber-500 mb-0.5" />
                          <span className="text-[9px] text-amber-600 font-bold leading-tight">Lỗi ảnh</span>
                        </div>
                      ) : (
                        <Building2 className="w-8 h-8 text-slate-400" />
                      )}
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setLogoUrl("");
                            setLogoError(false);
                            markDirty();
                            showToast("Đã xóa Logo");
                          }}
                          className="absolute inset-0 bg-slate-900/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[10px] font-bold"
                        >
                          Xóa
                        </button>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <input
                        type="file"
                        ref={logoInputRef}
                        onChange={handleLogoUpload}
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={uploadingLogo}
                          onClick={() => logoInputRef.current?.click()}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {uploadingLogo ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          <span>{uploadingLogo ? "Đang tải lên..." : "Tải logo từ máy tính"}</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={logoUrl}
                        onChange={(e) => {
                          setLogoUrl(e.target.value);
                          setLogoError(false);
                          markDirty();
                        }}
                        placeholder="Hoặc dán đường dẫn ảnh logo (URL)..."
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Banner Cover Upload Dropzone */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Ảnh Bìa Cổng Tuyển Dụng (Banner Cover, tối đa 10MB)
                  </label>
                  <div className="space-y-2">
                    <div className="relative h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
                      {bannerUrl && !bannerError ? (
                        <img
                          src={bannerUrl}
                          alt="Banner Preview"
                          className="w-full h-full object-cover"
                          onError={() => setBannerError(true)}
                        />
                      ) : bannerError ? (
                        <div className="w-full h-full flex items-center justify-center bg-amber-50 text-amber-700 text-xs font-semibold gap-1.5 p-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Không thể tải ảnh từ URL này (vui lòng kiểm tra lại)</span>
                        </div>
                      ) : null}
                      <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center gap-2">
                        <input
                          type="file"
                          ref={bannerInputRef}
                          onChange={handleBannerUpload}
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                        />
                        <button
                          type="button"
                          disabled={uploadingBanner}
                          onClick={() => bannerInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white/95 hover:bg-white text-slate-900 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {uploadingBanner ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          <span>{uploadingBanner ? "Đang tải ảnh..." : "Thay đổi ảnh bìa"}</span>
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={bannerUrl}
                      onChange={(e) => {
                        setBannerUrl(e.target.value);
                        setBannerError(false);
                        markDirty();
                      }}
                      placeholder="URL Banner ảnh bìa..."
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Tên công ty & Slogan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên Hiển Thị Công Ty <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      markDirty();
                    }}
                    placeholder="VD: Tập Đoàn Doanh Nghiệp Enterprise"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Khẩu Hiệu / Slogan Tuyển Dụng
                  </label>
                  <input
                    type="text"
                    value={slogan}
                    onChange={(e) => {
                      setSlogan(e.target.value);
                      markDirty();
                    }}
                    placeholder="VD: Cùng nhau tạo nên những điều lớn lao và bứt phá nấc thang sự nghiệp"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* PHẦN 2: THÔNG TIN LIÊN HỆ & TRỤ SỞ */}
            <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  2. Thông Tin Trụ Sở & Hotline Tuyển Dụng
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" /> Email nhận hồ sơ
                    </span>
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => {
                      setContactEmail(e.target.value);
                      markDirty();
                    }}
                    placeholder="tuyendung@company.com"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> Hotline tuyển dụng
                    </span>
                  </label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => {
                      setContactPhone(e.target.value);
                      markDirty();
                    }}
                    placeholder="1900 6868 hoặc 024 3999 8888"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    <span className="flex items-center gap-1">
                      <Link2 className="w-3.5 h-3.5 text-slate-400" /> Website chính thức
                    </span>
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => {
                      setWebsite(e.target.value);
                      markDirty();
                    }}
                    placeholder="https://company.com"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> Địa chỉ trụ sở chính
                    </span>
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      markDirty();
                    }}
                    placeholder="Tầng 12, Tòa nhà Enterprise Tower, Cầu Giấy, Hà Nội"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* PHẦN 3: GIỚI THIỆU "VỀ CHÚNG TÔI & MÔI TRƯỜNG LÀM VIỆC" */}
            <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-extrabold text-slate-900">
                    3. Giới Thiệu &ldquo;Về Chúng Tôi & Môi Trường Làm Việc&rdquo; (About Us Narrative)
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">
                  {aboutUs.length} / 10,000 ký tự
                </span>
              </div>

              <div>
                <textarea
                  rows={6}
                  required
                  value={aboutUs}
                  onChange={(e) => {
                    setAboutUs(e.target.value);
                    markDirty();
                  }}
                  placeholder="Soạn thảo câu chuyện doanh nghiệp, tầm nhìn, sứ mệnh, giá trị cốt lõi và môi trường làm việc..."
                  className="w-full px-4 py-3 text-xs bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:outline-hidden leading-relaxed font-medium"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 Gợi ý: Nêu rõ thế mạnh về quy mô, định hướng phát triển, chính sách bình đẳng cơ hội và bảo lưu thâm niên khi thuyên chuyển nội bộ.
                </p>
              </div>
            </div>

            {/* PHẦN 4: PHÚC LỢI CÔNG TY (COMPANY BENEFITS) */}
            <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <h3 className="text-sm font-extrabold text-slate-900">
                    4. Phúc Lợi & Đãi Ngộ Đặc Quyền (Company Benefits)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddBenefit}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm phúc lợi</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {benefits.map((b, idx) => {
                  const IconComp = resolveBenefitIcon(b.iconName);
                  return (
                    <div
                      key={b.id}
                      className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3 relative group hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <IconComp className="w-4 h-4" />
                          </div>
                          <span className="text-[11px] font-extrabold text-blue-700">
                            Phúc lợi #{idx + 1}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveBenefit(b.id)}
                          className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                          title="Xóa mục này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Icon Selector */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                          Biểu tượng (Icon)
                        </label>
                        <select
                          value={b.iconName}
                          onChange={(e) => handleUpdateBenefit(b.id, "iconName", e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700"
                        >
                          {BENEFIT_ICONS.map((opt) => (
                            <option key={opt.name} value={opt.name}>
                              {opt.label} ({opt.name})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                          Tiêu đề quyền lợi
                        </label>
                        <input
                          type="text"
                          value={b.title}
                          onChange={(e) => handleUpdateBenefit(b.id, "title", e.target.value)}
                          placeholder="Tiêu đề phúc lợi..."
                          className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                          Mô tả chi tiết
                        </label>
                        <textarea
                          rows={2}
                          value={b.description}
                          onChange={(e) => handleUpdateBenefit(b.id, "description", e.target.value)}
                          placeholder="Mô tả chi tiết chính sách..."
                          className="w-full px-2.5 py-1.5 text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white leading-relaxed"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Khôi phục mẫu chuẩn mặc định</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPreviewMode("preview")}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>Xem trước trước khi lưu</span>
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{saving ? "Đang xuất bản..." : "Xuất bản & Cập nhật Career Page"}</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* ========================================================================= */
          /* TAB 2: TRÌNH XEM TRƯỚC PORTAL TRUNG THỰC 100% (HIGH-FIDELITY LIVE PREVIEW) */
          /* ========================================================================= */
          <div className="space-y-6">
            {/* Viewport & Device Switcher Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-900 text-white rounded-2xl shadow-lg">
              <div className="flex items-center gap-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-400">
                  Mô Phỏng Hiển Thị:
                </span>
                <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("desktop")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      previewDevice === "desktop"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Desktop (1440px)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("tablet")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      previewDevice === "tablet"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Tablet className="w-3.5 h-3.5" />
                    <span>Tablet (768px)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("mobile")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      previewDevice === "mobile"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Mobile (375px)</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPreviewMode("editor")}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Quay lại sửa
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveCMS()}
                  disabled={saving}
                  className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Xuất bản ngay</span>
                </button>
              </div>
            </div>

            {/* Container simulator */}
            <div className="w-full flex justify-center bg-slate-100 p-2 sm:p-6 rounded-3xl border border-slate-200 overflow-x-auto">
              <div
                className={`bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transition-all duration-300 ${
                  previewDevice === "desktop"
                    ? "w-full max-w-6xl"
                    : previewDevice === "tablet"
                    ? "w-[768px] shrink-0"
                    : "w-[375px] shrink-0"
                }`}
              >
                {/* 1. MOCK PUBLIC HEADER */}
                <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                    {logoUrl ? (
                      <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-50 border border-slate-200 p-0.5 flex items-center justify-center shrink-0">
                        <img src={logoUrl} alt={companyName} className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shadow-xs">
                        TD
                      </div>
                    )}
                    <div className="leading-tight">
                      <span className="font-bold text-slate-900 text-sm block line-clamp-1">
                        {companyName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        Cổng Cơ Hội Nghề Nghiệp Nội Bộ
                      </span>
                    </div>
                  </div>

                  {previewDevice !== "mobile" && (
                    <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-slate-600">
                      <span className="text-blue-600 font-bold">Về chúng tôi</span>
                      <span>Vị trí tuyển dụng</span>
                      <span>Quy trình</span>
                      <span>Đãi ngộ</span>
                    </div>
                  )}

                  <button
                    type="button"
                    className="px-3 sm:px-4 py-1.5 bg-blue-600 text-white rounded-full text-[11px] sm:text-xs font-bold shadow-xs hover:bg-blue-700 shrink-0"
                  >
                    Ứng tuyển
                  </button>
                </div>

                {/* 2. MOCK HERO COVER SECTION */}
                <div className="relative h-64 sm:h-80 w-full overflow-hidden">
                  <img
                    src={bannerUrl && !bannerError ? bannerUrl : (DEFAULT_CAREER_VALUES.banner_url || "")}
                    alt="Career Cover"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      if (DEFAULT_CAREER_VALUES.banner_url) {
                        e.currentTarget.src = DEFAULT_CAREER_VALUES.banner_url;
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-transparent flex flex-col justify-end p-6 sm:p-10 text-white space-y-3">
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/20 w-fit">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      <span>{companyName}</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight max-w-2xl leading-tight">
                      {slogan}
                    </h2>
                  </div>
                </div>

                {/* 3. MOCK "VỀ CHÚNG TÔI & MÔI TRƯỜNG LÀM VIỆC" SECTION */}
                <div className="p-6 sm:p-12 space-y-10 max-w-5xl mx-auto">
                  <div className="text-center space-y-2 max-w-2xl mx-auto">
                    <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                      Về Chúng Tôi & Môi Trường Làm Việc
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      Khám Phá Văn Hóa Gắn Kết & Phát Triển
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Nơi mỗi thành viên được trao quyền phát huy tối đa tiềm năng tại {companyName}.
                    </p>
                  </div>

                  {/* 2-column layout: Story + Photo */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    <div className="md:col-span-5 relative">
                      <div className="rounded-3xl overflow-hidden border-4 border-slate-100 shadow-xl aspect-[4/3] bg-slate-50">
                        <img
                          src={bannerUrl && !bannerError ? bannerUrl : (DEFAULT_CAREER_VALUES.banner_url || "")}
                          alt="Văn hóa làm việc"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            if (DEFAULT_CAREER_VALUES.banner_url) {
                              e.currentTarget.src = DEFAULT_CAREER_VALUES.banner_url;
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="md:col-span-7 space-y-4">
                      <h4 className="text-xl font-bold text-slate-900">
                        Giới thiệu chung về doanh nghiệp
                      </h4>
                      <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-3 whitespace-pre-line font-normal">
                        {aboutUs}
                      </div>
                      <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
                        {contactPhone && <span>📞 {contactPhone}</span>}
                        {contactEmail && <span>✉️ {contactEmail}</span>}
                        {website && <span>🌐 {website}</span>}
                      </div>
                    </div>
                  </div>

                  {/* 4. MOCK BENEFITS GRID */}
                  <div className="pt-8 border-t border-slate-100 space-y-6">
                    <div className="text-center space-y-1">
                      <span className="text-[11px] font-black uppercase text-emerald-600 tracking-wider">
                        Quyền Lợi & Đãi Ngộ Nhân Sự
                      </span>
                      <h4 className="text-xl sm:text-2xl font-black text-slate-900">
                        Tại Sao Bạn Sẽ Tự Hào Khi Làm Việc Tại Đây?
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {benefits.map((b) => {
                        const IconComponent = resolveBenefitIcon(b.iconName);
                        return (
                          <div
                            key={b.id}
                            className="p-6 rounded-2xl bg-white border border-sky-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                          >
                            <div className="space-y-3">
                              <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                                <IconComponent className="w-5 h-5" />
                              </div>
                              <h5 className="text-sm font-bold text-slate-900">{b.title}</h5>
                              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                                {b.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 5. MOCK PUBLIC FOOTER */}
                <div className="p-8 bg-slate-900 text-slate-400 border-t border-slate-800 text-xs space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {logoUrl ? (
                        <img src={logoUrl} alt={companyName} className="h-7 object-contain brightness-200" />
                      ) : (
                        <span className="font-extrabold text-white text-sm">{companyName}</span>
                      )}
                    </div>
                    <div className="text-center sm:text-right space-y-1">
                      {address && <p>Địa chỉ: {address}</p>}
                      <p>Hotline: {contactPhone} • Email: {contactEmail}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-800 text-center text-[11px] text-slate-500">
                    © 2026 {companyName.toUpperCase()}. Giao diện mô phỏng trung thực Cổng tuyển dụng công khai.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
