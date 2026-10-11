"use client";

import React, { useState } from "react";
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
  // Brand & Media CMS State
  const [companyName, setCompanyName] = useState("Enterprise ATS Tech Corp");
  const [slogan, setSlogan] = useState("Kiến tạo tương lai số cùng những tài năng xuất sắc nhất");
  const [logoUrl, setLogoUrl] = useState("/images/company-logo.png");
  const [bannerUrl, setBannerUrl] = useState("https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80");
  const [aboutUs, setAboutUs] = useState(
    "Chúng tôi là tập đoàn công nghệ tiên phong cung cấp giải pháp chuyển đổi số toàn diện cho các doanh nghiệp hàng đầu Đông Nam Á. Tại Enterprise ATS, con người luôn là tài sản quý giá nhất. Chúng tôi kiến tạo môi trường làm việc minh bạch, linh hoạt và không ngừng trao quyền để mỗi cá nhân phát huy tối đa năng lực sáng tạo của mình."
  );

  // Benefits list
  const [benefits, setBenefits] = useState<BenefitItem[]>([
    {
      id: "b1",
      title: "Chế độ đãi ngộ & Thưởng vượt trội",
      description: "Tháng lương 13++, thưởng hiệu quả dự án hàng quý và cơ chế ESOP cổ phần hấp dẫn cho nhân sự tài năng.",
      iconName: "Award",
    },
    {
      id: "b2",
      title: "Chăm sóc sức khỏe toàn diện",
      description: "Gói bảo hiểm sức khỏe cao cấp Bảo Việt / PVI hạng Kim Cương cho nhân viên và người thân trong gia đình.",
      iconName: "Heart",
    },
    {
      id: "b3",
      title: "Trang thiết bị làm việc đỉnh cao",
      description: "Cung cấp Macbook Pro M-Series mới nhất, màn hình kép 4K và ngân sách thiết lập góc làm việc công thái học.",
      iconName: "Laptop",
    },
    {
      id: "b4",
      title: "Du lịch & Cân bằng cuộc sống",
      description: "Chuyến nghỉ dưỡng 5 sao thường niên, 16 ngày nghỉ phép năm có lương và chế độ làm việc Hybrid linh hoạt.",
      iconName: "Plane",
    },
  ]);

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
    if (benefits.length <= 1) {
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
  const handleSaveCMS = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Đã xuất bản cấu hình Career Page lên Cổng tuyển dụng thành công!", "success");
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
              Tùy biến Logo thương hiệu, Banner bìa, câu chuyện "Về chúng tôi" và các đãi ngộ đặc quyền hiển thị trên Cổng sự nghiệp công khai.
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
                      <img
                        src={bannerUrl}
                        alt="Banner Preview"
                        className="w-full h-full object-cover"
                      />
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
                    2. Giới Thiệu "Về Chúng Tôi" (About Us Narrative)
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
              <img
                src={bannerUrl}
                alt="Career Cover"
                className="w-full h-full object-cover"
              />
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
