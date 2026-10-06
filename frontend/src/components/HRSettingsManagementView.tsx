"use client";

import React, { useState, useRef, useMemo } from "react";
import {
  Globe,
  Mail,
  Eye,
  Save,
  Upload,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  X,
  Code2,
  Bold,
  Italic,
  Underline,
  List,
  Laptop,
  Smartphone,
  Clock,
  User,
  Briefcase,
  Building2,
  TrendingUp,
} from "lucide-react";

// =========================================================================
// 1. DATA MODELS & TYPES
// =========================================================================

export type EmailTemplateType =
  | "application_confirm" // Xác nhận tiếp nhận hồ sơ
  | "interview_invite" // Mời phỏng vấn
  | "thank_you" // Cảm ơn sau phỏng vấn
  | "rejection" // Từ chối lịch sự
  | "offer_letter"; // Thư mời nhận việc (Offer)

export interface EmailTemplateItem {
  id: EmailTemplateType;
  name: string;
  badge: string;
  description: string;
  subject: string;
  body: string;
  isAutoSend: boolean;
  category: "Giai đoạn đầu" | "Phỏng vấn" | "Kết quả";
}

// =========================================================================
// 2. MOCK DATA: EMAIL TEMPLATES
// =========================================================================

export const INITIAL_EMAIL_TEMPLATES: Record<EmailTemplateType, EmailTemplateItem> = {
  application_confirm: {
    id: "application_confirm",
    name: "Xác nhận tiếp nhận hồ sơ",
    badge: "Auto-Reply",
    category: "Giai đoạn đầu",
    description: "Tự động gửi ngay khi ứng viên nộp hồ sơ ứng tuyển nội bộ.",
    subject: "Xác nhận tiếp nhận hồ sơ ứng tuyển vị trí [Vị trí] - [Tên ứng viên]",
    body: `<p>Xin chào <strong>[Tên ứng viên]</strong>,</p>

<p>Hội đồng Tuyển dụng Nội bộ xin chân thành cảm ơn bạn đã quan tâm và nộp hồ sơ ứng tuyển cho vị trí <strong>[Vị trí]</strong> tại công ty.</p>

<p>Hồ sơ của bạn đã được ghi nhận thành công trên hệ thống. Đội ngũ Tuyển dụng cùng Trưởng bộ phận sẽ tiến hành đánh giá năng lực trong vòng <strong>03 ngày làm việc</strong>. Chúng tôi sẽ sớm liên hệ lại với bạn để cập nhật tiến độ tiếp theo.</p>

<p>Chúc bạn một ngày làm việc tràn đầy năng lượng!</p>

<p>Trân trọng,<br>
<strong>Ban Quản Trị Nguồn Nhân Lực (HR Team)</strong></p>`,
    isAutoSend: true,
  },
  interview_invite: {
    id: "interview_invite",
    name: "Thư mời phỏng vấn",
    badge: "Interview",
    category: "Phỏng vấn",
    description: "Gửi kèm thời gian, địa điểm và hình thức phỏng vấn.",
    subject: "Thư mời tham gia phỏng vấn vị trí [Vị trí] - [Tên ứng viên]",
    body: `<p>Thân gửi <strong>[Tên ứng viên]</strong>,</p>

<p>Sau khi xem xét hồ sơ ứng tuyển của bạn cho vị trí <strong>[Vị trí]</strong>, Ban Tuyển dụng rất ấn tượng với kinh nghiệm của bạn và trân trọng kính mời bạn tham gia buổi phỏng vấn trực tiếp với Hội đồng Đánh giá.</p>

<div style="background-color: #f8fafc; padding: 16px; border-left: 4px solid #4285F4; margin: 16px 0; border-radius: 8px;">
  <p style="margin: 0 0 8px 0;"><strong>THÔNG TIN BUỔI PHỎNG VẤN:</strong></p>
  <p style="margin: 4px 0;">• <strong>Thời gian:</strong> [Thời gian phỏng vấn]</p>
  <p style="margin: 4px 0;">• <strong>Vị trí ứng tuyển:</strong> [Vị trí]</p>
  <p style="margin: 4px 0;">• <strong>Hình thức:</strong> Phỏng vấn trực tiếp tại Phòng Họp Sáng Tạo Tầng 4 (hoặc Google Meet)</p>
  <p style="margin: 4px 0;">• <strong>Người liên hệ:</strong> Bộ phận Nhân sự Tuyển dụng Nội bộ</p>
</div>

<p>Vui lòng phản hồi lại email này trước 24 giờ để xác nhận bạn có thể tham gia đúng khung giờ trên.</p>

<p>Hẹn sớm gặp bạn tại buổi phỏng vấn!</p>

<p>Trân trọng,<br>
<strong>Hội Đồng Tuyển Dụng & Phát Triển Nhân Tài</strong></p>`,
    isAutoSend: true,
  },
  thank_you: {
    id: "thank_you",
    name: "Thư cảm ơn sau phỏng vấn",
    badge: "Post-Interview",
    category: "Phỏng vấn",
    description: "Gửi cảm ơn ứng viên sau khi hoàn thành buổi phỏng vấn.",
    subject: "Cảm ơn bạn đã tham gia phỏng vấn vị trí [Vị trí] - [Tên ứng viên]",
    body: `<p>Chào <strong>[Tên ứng viên]</strong>,</p>

<p>Hội đồng Tuyển dụng xin gửi lời cảm ơn chân thành đến bạn vì đã dành thời gian quý báu tham gia buổi phỏng vấn vị trí <strong>[Vị trí]</strong> vào lúc [Thời gian phỏng vấn].</p>

<p>Chúng tôi đánh giá rất cao những chia sẻ chuyên sâu và tâm huyết của bạn về định hướng phát triển nghề nghiệp. Hiện tại, Hội đồng đang tổng hợp điểm đánh giá khung năng lực và sẽ thông báo kết quả chính thức đến bạn trong vòng <strong>05 ngày làm việc</strong>.</p>

<p>Chúc bạn nhiều sức khỏe và thành công!</p>

<p>Thân mến,<br>
<strong>Bộ phận Nhân sự Công ty</strong></p>`,
    isAutoSend: false,
  },
  rejection: {
    id: "rejection",
    name: "Thư từ chối lịch sự",
    badge: "Talent Pool",
    category: "Kết quả",
    description: "Từ chối khéo léo và thông báo lưu hồ sơ vào Talent Pool.",
    subject: "Thông báo kết quả ứng tuyển vị trí [Vị trí] - [Tên ứng viên]",
    body: `<p>Thân gửi <strong>[Tên ứng viên]</strong>,</p>

<p>Lời đầu tiên, Ban Tuyển dụng xin chân thành cảm ơn bạn đã quan tâm và dành thời gian ứng tuyển vị trí <strong>[Vị trí]</strong>.</p>

<p>Sau quá trình cân nhắc kỹ lưỡng dựa trên yêu cầu đặc thù của dự án ở thời điểm hiện tại, chúng tôi rất tiếc phải thông báo chưa thể đồng hành cùng bạn cho vị trí này.</p>

<p>Tuy nhiên, chúng tôi đánh giá cao tiềm năng của bạn và đã lưu thông tin vào <strong>Kho Nhân Tài Nội Bộ (Talent Pool)</strong>. Khi có cơ hội nghề nghiệp mới phù hợp hơn, chúng tôi sẽ ưu tiên liên hệ lại với bạn.</p>

<p>Chúc bạn luôn gặt hái nhiều bước tiến mới trên con đường sự nghiệp!</p>

<p>Trân trọng,<br>
<strong>Ban Nhân Sự & Phát Triển Nhân Tài</strong></p>`,
    isAutoSend: false,
  },
  offer_letter: {
    id: "offer_letter",
    name: "Thư mời nhận việc (Offer)",
    badge: "Official Offer",
    category: "Kết quả",
    description: "Thông báo trúng tuyển và đính kèm gói đãi ngộ hấp dẫn.",
    subject: "Chúc mừng! Thư mời nhận việc (Job Offer) vị trí [Vị trí] - [Tên ứng viên]",
    body: `<p>Thân gửi <strong>[Tên ứng viên]</strong>,</p>

<p>Thay mặt Ban Giám Đốc và toàn thể đội ngũ, chúng tôi xin chúc mừng bạn đã xuất sắc vượt qua các vòng đánh giá năng lực cho vị trí <strong>[Vị trí]</strong>.</p>

<p>Chúng tôi tin rằng với kiến thức chuyên môn vững vàng và tinh thần làm việc của bạn, bạn sẽ là một mảnh ghép quan trọng đóng góp vào sự bứt phá của công ty.</p>

<div style="background-color: #f0fdf4; padding: 16px; border-left: 4px solid #16a34a; margin: 16px 0; border-radius: 8px;">
  <p style="margin: 0 0 8px 0; color: #166534;"><strong>TÓM TẮT ĐIỀU KHOẢN GIA NHẬP:</strong></p>
  <p style="margin: 4px 0;">• <strong>Họ và tên:</strong> [Tên ứng viên]</p>
  <p style="margin: 4px 0;">• <strong>Chức danh:</strong> [Vị trí]</p>
  <p style="margin: 4px 0;">• <strong>Ngày tiếp nhận (Onboarding):</strong> Thứ Hai tuần tới (08:30)</p>
  <p style="margin: 4px 0;">• <strong>Chế độ đãi ngộ:</strong> Đính kèm chi tiết trong file Thư Mời Nhận Việc chính thức.</p>
</div>

<p>Vui lòng phản hồi xác nhận đồng ý nhận việc bằng cách ký điện tử vào văn bản đính kèm trước 17:00 ngày mai.</p>

<p>Rất hân hạnh được chào đón bạn gia nhập đại gia đình chúng tôi!</p>

<p>Trân trọng,<br>
<strong>Giám Đốc Nhân Sự & Ban Giám Đốc</strong></p>`,
    isAutoSend: false,
  },
};

export const MOCK_REAL_CANDIDATE_DATA = {
  candidate_name: "Nguyễn Hải Đăng",
  job_title: "Senior Backend Engineer (Python/FastAPI)",
  interview_time: "09:30 - Thứ Năm, ngày 15/10/2026",
  department: "Trung Tâm Phát Triển Phần Mềm (Software Center)",
  location: "Phòng Họp Sáng Tạo Tầng 4, Tòa Nhà Innovation Hub",
  contact_person: "Lê Hoàng Yến - Chuyên viên Tuyển dụng (0908 123 456)",
};

// =========================================================================
// 3. SANITIZE XSS & ESCAPE UTILITIES
// =========================================================================

export function sanitizeCareerSiteHtml(rawHtml: string): {
  cleanHtml: string;
  blockedCount: number;
  warnings: string[];
} {
  if (!rawHtml) return { cleanHtml: "", blockedCount: 0, warnings: [] };

  let clean = rawHtml;
  let blockedCount = 0;
  const warnings: string[] = [];

  const scriptRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  const scriptMatches = clean.match(scriptRegex);
  if (scriptMatches && scriptMatches.length > 0) {
    blockedCount += scriptMatches.length;
    warnings.push(`Đã phát hiện và loại bỏ ${scriptMatches.length} thẻ <script> độc hại.`);
    clean = clean.replace(scriptRegex, "");
  }

  const danglingScriptRegex = /<\/?script\b[^>]*>/gi;
  if (danglingScriptRegex.test(clean)) {
    blockedCount += 1;
    warnings.push("Đã loại bỏ thẻ <script> mở/đóng độc hại.");
    clean = clean.replace(danglingScriptRegex, "");
  }

  const eventHandlerRegex = /\son\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi;
  const eventMatches = clean.match(eventHandlerRegex);
  if (eventMatches && eventMatches.length > 0) {
    blockedCount += eventMatches.length;
    warnings.push(`Đã vô hiệu hóa ${eventMatches.length} inline event handlers.`);
    clean = clean.replace(eventHandlerRegex, "");
  }

  const dangerousTags = /<\/?(iframe|object|embed|applet)\b[^>]*>/gi;
  if (dangerousTags.test(clean)) {
    blockedCount += 1;
    warnings.push("Đã loại bỏ các thẻ nhúng đối tượng không an toàn (iframe/object/embed).");
    clean = clean.replace(dangerousTags, "");
  }

  return { cleanHtml: clean, blockedCount, warnings };
}

export function escapeHtml(unsafeText: string): string {
  if (!unsafeText) return "";
  return unsafeText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function interpolateEmailTemplate(
  templateBody: string,
  data: typeof MOCK_REAL_CANDIDATE_DATA
): string {
  if (!templateBody) return "";

  const safeName = escapeHtml(data.candidate_name);
  const safeJob = escapeHtml(data.job_title);
  const safeTime = escapeHtml(data.interview_time);
  const safeDept = escapeHtml(data.department);
  const safeLocation = escapeHtml(data.location);

  let result = templateBody;
  result = result.replace(/\[Tên ứng viên\]|\{\{candidate_name\}\}/gi, safeName);
  result = result.replace(/\[Vị trí\]|\{\{job_title\}\}/gi, safeJob);
  result = result.replace(/\[Thời gian phỏng vấn\]|\{\{interview_time\}\}/gi, safeTime);
  result = result.replace(/\[Phòng ban\]|\{\{department\}\}/gi, safeDept);
  result = result.replace(/\[Địa điểm\]|\{\{location\}\}/gi, safeLocation);

  return result;
}

// =========================================================================
// 4. MAIN COMPONENT: HRSettingsManagementView
// =========================================================================

export function HRSettingsManagementView() {
  const [activeTab, setActiveTab] = useState<"career_site" | "email_templates">("career_site");

  // State Career Site
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string>("");
  const [logoFileName, setLogoFileName] = useState<string>("logo-tuyendung.png");
  const [heroTitle, setHeroTitle] = useState("Cùng nhau tạo nên những điều lớn lao");
  const [heroBadge, setHeroBadge] = useState("CƠ HỘI NGHỀ NGHIỆP NỘI BỘ");
  const [careerSiteContent, setCareerSiteContent] = useState<string>(
    `<p>Khám phá cơ hội phát triển sự nghiệp ngay trong nội bộ, đóng góp giá trị, lan tỏa tài năng và cùng phát triển tiến xa hơn mỗi ngày.</p>
<p>Chúng tôi xây dựng môi trường làm việc <strong>minh bạch</strong>, đề cao <em>tinh thần đổi mới</em> và khuyến khích mỗi cá nhân bứt phá giới hạn bản thân với lộ trình thăng tiến rõ ràng.</p>`
  );
  const [editorMode, setEditorMode] = useState<"visual" | "html">("visual");
  const [isCareerPreviewOpen, setIsCareerPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [securityNotification, setSecurityNotification] = useState<{
    blockedCount: number;
    warnings: string[];
  } | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const careerTextareaRef = useRef<HTMLTextAreaElement>(null);

  // State Email Templates
  const [emailTemplates, setEmailTemplates] = useState<Record<EmailTemplateType, EmailTemplateItem>>(
    INITIAL_EMAIL_TEMPLATES
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<EmailTemplateType>("interview_invite");
  const [isEmailPreviewOpen, setIsEmailPreviewOpen] = useState(false);
  const emailTextareaRef = useRef<HTMLTextAreaElement>(null);

  const currentEmailTemplate = emailTemplates[selectedTemplateId];

  // Toast Alert Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Upload Logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setCompanyLogoUrl(reader.result as string);
        showToast(`Đã tải lên logo công ty "${file.name}" thành công!`);
      };
      reader.readAsDataURL(file);
    }
  };

  // Insert tag in Career Editor
  const handleInsertTag = (openTag: string, closeTag: string) => {
    if (!careerTextareaRef.current) return;
    const textarea = careerTextareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const replacement = `${openTag}${selectedText || "Nội dung"}${closeTag}`;
    const newContent =
      textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    setCareerSiteContent(newContent);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + openTag.length,
        start + openTag.length + (selectedText ? selectedText.length : 7)
      );
    });
  };

  // Save Career Site & Sanitize XSS
  const handleSaveCareerSite = () => {
    const sanitizeResult = sanitizeCareerSiteHtml(careerSiteContent);
    if (sanitizeResult.blockedCount > 0) {
      setSecurityNotification({
        blockedCount: sanitizeResult.blockedCount,
        warnings: sanitizeResult.warnings,
      });
      setCareerSiteContent(sanitizeResult.cleanHtml);
      showToast(
        `Đã lưu cấu hình! Hệ thống phát hiện và loại bỏ ${sanitizeResult.blockedCount} mã độc <script> (Chặn XSS thành công).`
      );
    } else {
      setSecurityNotification(null);
      setCareerSiteContent(sanitizeResult.cleanHtml);
      showToast("Đã lưu nội dung Giới thiệu trang Tuyển dụng thành công!");
    }
  };

  // Simulate XSS
  const handleSimulateXssAttack = () => {
    const maliciousScript = `\n<script>alert('Mã độc XSS thử nghiệm!');</script>\n<img src="invalid.jpg" onerror="alert('XSS trigger')" />`;
    setCareerSiteContent((prev) => prev + maliciousScript);
    showToast("Đã chèn đoạn mã <script> thử nghiệm. Hãy bấm 'Lưu cấu hình' để kiểm tra bộ lọc XSS!");
  };

  // Toggle Auto Send Email
  const handleToggleAutoSend = (tplId: EmailTemplateType) => {
    setEmailTemplates((prev) => {
      const updated = {
        ...prev,
        [tplId]: {
          ...prev[tplId],
          isAutoSend: !prev[tplId].isAutoSend,
        },
      };
      const stateText = updated[tplId].isAutoSend ? "BẬT" : "TẮT";
      showToast(`Đã ${stateText} gửi tự động cho mẫu "${updated[tplId].name}"!`);
      return updated;
    });
  };

  // Insert Variable in Email Template
  const handleInsertVariable = (variableName: string) => {
    if (!emailTextareaRef.current) return;
    const textarea = emailTextareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = currentEmailTemplate.body;
    const newContent = currentText.substring(0, start) + variableName + currentText.substring(end);

    setEmailTemplates((prev) => ({
      ...prev,
      [selectedTemplateId]: {
        ...prev[selectedTemplateId],
        body: newContent,
      },
    }));

    requestAnimationFrame(() => {
      textarea.focus();
      const nextPos = start + variableName.length;
      textarea.setSelectionRange(nextPos, nextPos);
    });

    showToast(`Đã chèn biến "${variableName}" vào mẫu email.`);
  };

  const previewEmailContent = useMemo(() => {
    const interpolatedBody = interpolateEmailTemplate(
      currentEmailTemplate.body,
      MOCK_REAL_CANDIDATE_DATA
    );
    const interpolatedSubject = interpolateEmailTemplate(
      currentEmailTemplate.subject,
      MOCK_REAL_CANDIDATE_DATA
    );
    return { subject: interpolatedSubject, body: interpolatedBody };
  }, [currentEmailTemplate]);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-full bg-slate-900 text-white text-xs sm:text-sm font-semibold shadow-2xl animate-fade-in border border-slate-700 max-w-md">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
          <span className="flex-1">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* HEADER & TABS */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#4285F4] block">
              THIẾT LẬP THƯƠNG HIỆU & KÊNH TƯƠNG TÁC
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Cấu Hình Hiển Thị & Mẫu Thư Giao Tiếp
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Chỉnh sửa giao diện trang tuyển dụng công khai và thiết lập các mẫu email tự động hóa
            </p>
          </div>

          <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 border border-slate-200 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab("career_site")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "career_site"
                  ? "bg-white text-[#4285F4] shadow-sm font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>1. Trang Giới Thiệu (Career Site)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("email_templates")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "email_templates"
                  ? "bg-white text-[#4285F4] shadow-sm font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>2. Mẫu Email (Templates)</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: CAREER SITE */}
      {activeTab === "career_site" && (
        <div className="space-y-6 animate-fade-in">
          {securityNotification && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-3 text-xs text-amber-900 animate-fade-in shadow-xs">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <strong className="block text-sm font-bold text-amber-950">
                  CẢNH BÁO AN TOÀN BẢO MẬT (XSS PROTECTION KÍCH HOẠT)
                </strong>
                <p>
                  Hệ thống đã tự động lọc sạch <strong>{securityNotification.blockedCount}</strong> phần tử nguy hại:
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-800">
                  {securityNotification.warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => setSecurityNotification(null)}
                className="text-amber-500 hover:text-amber-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Thiết Lập Nhận Diện & Nội Dung Trang Chủ Tuyển Dụng
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dữ liệu hiển thị trên trang Landing Page công khai của công ty
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCareerPreviewOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-blue-200 text-[#4285F4] hover:bg-blue-50 text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Eye className="w-4 h-4" />
                  <span>Xem Trước (Preview)</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveCareerSite}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#4285F4] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Cấu Hình</span>
                </button>
              </div>
            </div>

            {/* Upload Logo */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center p-2 shrink-0 shadow-2xs overflow-hidden">
                  {companyLogoUrl ? (
                    <img src={companyLogoUrl} alt="Company Logo" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4285F4] to-blue-600 flex items-center justify-center text-white font-black text-lg">
                      HR
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-xs font-extrabold text-slate-900 block">Logo Công Ty</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tệp: <strong>{logoFileName}</strong> (PNG, SVG, JPG, dưới 2MB)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tải Lên Logo Mới</span>
                </button>
                {companyLogoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setCompanyLogoUrl("");
                      setLogoFileName("logo-tuyendung.png");
                      showToast("Đã khôi phục logo mặc định.");
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors"
                  >
                    Đặt lại
                  </button>
                )}
              </div>
            </div>

            {/* Tiêu đề & Badge */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Badge Khẩu Hiệu Trên Cùng *
                </label>
                <input
                  type="text"
                  value={heroBadge}
                  onChange={(e) => setHeroBadge(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tiêu Đề Lớn (Hero Heading) *
                </label>
                <input
                  type="text"
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                />
              </div>
            </div>

            {/* WYSIWYG Editor */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Nội Dung Giới Thiệu (HTML Supported) *
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditorMode("visual")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      editorMode === "visual"
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Trực quan
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorMode("html")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      editorMode === "html"
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Code2 className="w-3 h-3 inline mr-1" />
                    Mã HTML
                  </button>
                </div>
              </div>

              <div className="p-2 rounded-t-2xl bg-slate-100 border border-slate-200 flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleInsertTag("<strong>", "</strong>")}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition-colors cursor-pointer"
                  title="Chữ đậm"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTag("<em>", "</em>")}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition-colors cursor-pointer"
                  title="Chữ nghiêng"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTag("<u>", "</u>")}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition-colors cursor-pointer"
                  title="Gạch chân"
                >
                  <Underline className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTag("<ul>\n  <li>", "</li>\n</ul>")}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition-colors cursor-pointer"
                  title="Danh sách"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTag('<span class="text-[#4285F4] font-bold">', "</span>")}
                  className="px-2 py-1 rounded-lg hover:bg-white text-blue-600 transition-colors cursor-pointer text-xs font-bold"
                  title="Highlight Xanh"
                >
                  Highlight Xanh
                </button>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={handleSimulateXssAttack}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer text-[11px] font-bold flex items-center gap-1 border border-rose-200"
                  title="Thử chèn thẻ <script> để kiểm tra bộ lọc"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  <span>Thử nghiệm Chặn XSS</span>
                </button>
              </div>

              <textarea
                ref={careerTextareaRef}
                rows={6}
                value={careerSiteContent}
                onChange={(e) => setCareerSiteContent(e.target.value)}
                placeholder="Nhập nội dung HTML..."
                className="w-full px-4 py-3 bg-slate-50 border-x border-b border-slate-200 rounded-b-2xl text-xs sm:text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EMAIL TEMPLATES */}
      {activeTab === "email_templates" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Quản Lý & Tự Động Hóa Mẫu Thư Tuyển Dụng (Email Templates)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chèn biến động an toàn và thiết lập cơ chế gửi tự động theo từng giai đoạn
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEmailPreviewOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#4285F4] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 cursor-pointer self-start sm:self-auto"
              >
                <Eye className="w-4 h-4" />
                <span>Xem Trước Email (Preview Template)</span>
              </button>
            </div>

            {/* Danh sách loại thư */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {(Object.keys(emailTemplates) as EmailTemplateType[]).map((tplKey) => {
                const tpl = emailTemplates[tplKey];
                const isSelected = tplKey === selectedTemplateId;

                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplateId(tplKey)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100/70"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-blue-600 block">
                          {tpl.badge}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleAutoSend(tplKey);
                          }}
                          className={`w-8 h-4.5 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                            tpl.isAutoSend ? "bg-emerald-500" : "bg-slate-300"
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                              tpl.isAutoSend ? "translate-x-3.5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                      <strong className="text-xs font-bold text-slate-900 block leading-snug">
                        {tpl.name}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200/60">
                      <span className={`font-semibold ${tpl.isAutoSend ? "text-emerald-600" : "text-slate-400"}`}>
                        {tpl.isAutoSend ? "✓ Tự động" : "Thủ công"}
                      </span>
                      {isSelected && <span className="text-blue-600 font-bold">Đang chọn</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Soạn thảo template */}
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400">Đang chỉnh sửa:</span>
                  <h4 className="text-base font-extrabold text-slate-900">{currentEmailTemplate.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{currentEmailTemplate.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Trạng thái:</span>
                  <button
                    type="button"
                    onClick={() => handleToggleAutoSend(selectedTemplateId)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      currentEmailTemplate.isAutoSend
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {currentEmailTemplate.isAutoSend ? "BẬT (Gửi Tự Động)" : "TẮT (Gửi Thủ Công)"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tiêu Đề Thư (Email Subject) *
                </label>
                <input
                  type="text"
                  value={currentEmailTemplate.subject}
                  onChange={(e) =>
                    setEmailTemplates((prev) => ({
                      ...prev,
                      [selectedTemplateId]: {
                        ...prev[selectedTemplateId],
                        subject: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30"
                />
              </div>

              {/* Toolbar Chèn Biến */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Thanh Công Cụ Chèn Biến (Click để chèn vào vị trí con trỏ) *
                  </label>
                  <span className="text-[11px] text-slate-500">Tự động escape chống vỡ layout</span>
                </div>

                <div className="p-2.5 rounded-2xl bg-white border border-slate-200 flex flex-wrap items-center gap-2 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleInsertVariable("[Tên ứng viên]")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>[Tên ứng viên]</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertVariable("[Vị trí]")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>[Vị trí]</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertVariable("[Thời gian phỏng vấn]")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>[Thời gian phỏng vấn]</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertVariable("[Phòng ban]")}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>[Phòng ban]</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertVariable("[Địa điểm]")}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>[Địa điểm]</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nội Dung Mẫu Thư (HTML Body) *
                </label>
                <textarea
                  ref={emailTextareaRef}
                  rows={10}
                  value={currentEmailTemplate.body}
                  onChange={(e) =>
                    setEmailTemplates((prev) => ({
                      ...prev,
                      [selectedTemplateId]: {
                        ...prev[selectedTemplateId],
                        body: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/30 leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: PREVIEW CAREER SITE */}
      {isCareerPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex flex-col animate-fade-in">
          <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
              <strong className="text-sm font-extrabold text-white">
                Live Preview - Trang Chủ Tuyển Dụng (Career Site)
              </strong>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-xl bg-slate-800 border border-slate-700 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    previewDevice === "desktop" ? "bg-[#4285F4] text-white" : "text-slate-400"
                  }`}
                >
                  <Laptop className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    previewDevice === "mobile" ? "bg-[#4285F4] text-white" : "text-slate-400"
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsCareerPreviewOpen(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-200/80 p-4 sm:p-8 flex justify-center">
            <div
              className={`bg-white shadow-2xl transition-all duration-300 overflow-hidden flex flex-col ${
                previewDevice === "desktop"
                  ? "w-full max-w-[1400px] rounded-3xl min-h-[800px]"
                  : "w-[390px] rounded-[40px] border-8 border-slate-800 min-h-[750px]"
              }`}
            >
              <header className="h-16 sm:h-20 border-b border-gray-100 px-6 sm:px-10 flex items-center justify-between bg-white sticky top-0 z-20">
                <div className="flex items-center gap-3">
                  {companyLogoUrl ? (
                    <img src={companyLogoUrl} alt="Logo" className="h-9 sm:h-10 object-contain" />
                  ) : (
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#4285F4] to-blue-600 flex items-center justify-center text-white font-extrabold text-lg">
                      HR
                    </div>
                  )}
                  <span className="font-bold text-slate-900 tracking-tight text-sm sm:text-base hidden sm:inline">
                    TUYỂN DỤNG NỘI BỘ
                  </span>
                </div>
                <button className="px-4 py-2 rounded-full bg-[#4285F4] text-white font-bold text-xs">
                  Đăng nhập nội bộ
                </button>
              </header>

              <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden bg-gradient-to-b from-[#f8faff] via-[#fcfeff] to-white flex-1">
                <div className="max-w-6xl mx-auto px-6 sm:px-12">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                    <div className="space-y-6">
                      <div className="inline-flex items-center">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Sparkles className="w-3.5 h-3.5 text-[#4285F4]" />
                          {heroBadge}
                        </span>
                      </div>
                      <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                        {heroTitle}
                      </h1>
                      <div
                        className="text-sm sm:text-base text-slate-600 leading-relaxed space-y-3"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeCareerSiteHtml(careerSiteContent).cleanHtml,
                        }}
                      />
                      <div className="pt-2 flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                            <ShieldCheck className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <span className="text-sm font-bold text-slate-800 block">Minh bạch 100%</span>
                            <span className="text-xs text-slate-500">Quy trình công khai, rõ ràng</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#4285F4] flex items-center justify-center border border-blue-100">
                            <TrendingUp className="w-5 h-5 text-[#4285F4]" />
                          </div>
                          <div>
                            <span className="text-sm font-bold text-slate-800 block">Lộ trình thăng tiến</span>
                            <span className="text-xs text-slate-500">Đồng hành cùng phát triển</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl space-y-6">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white">
                        <Globe className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-bold">Khám Phá Vị Trí Đang Mở Tuyển Dụng</h3>
                      <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                        Hàng chục vị trí hấp dẫn đang chờ đón nhân tài nội bộ ứng tuyển hoặc giới thiệu đồng nghiệp.
                      </p>
                      <button className="px-5 py-2.5 rounded-full bg-white text-blue-700 font-extrabold text-xs">
                        Xem Danh Sách Việc Làm →
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PREVIEW EMAIL CLIENT */}
      {isEmailPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-400/30">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">
                    Xem Trước Email Thực Tế: {currentEmailTemplate.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Đã đắp dữ liệu thật của ứng viên <strong>{MOCK_REAL_CANDIDATE_DATA.candidate_name}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEmailPreviewOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 bg-slate-50 border-b border-slate-200 text-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold w-16">Từ:</span>
                <span className="text-slate-800 font-bold">
                  Hệ Thống Tuyển Dụng Nội Bộ &lt;recruitment@company.com&gt;
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-semibold w-16">Đến:</span>
                <span className="text-slate-800 font-bold">
                  {MOCK_REAL_CANDIDATE_DATA.candidate_name} &lt;haidang.nguyen@example.com&gt;
                </span>
              </div>
              <div className="flex items-start gap-2 pt-1 border-t border-slate-200/80">
                <span className="text-slate-400 font-semibold w-16">Tiêu đề:</span>
                <span className="text-slate-900 font-black text-xs sm:text-sm">
                  {previewEmailContent.subject}
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-4">
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs font-sans text-xs sm:text-sm text-slate-700 leading-relaxed">
                <div dangerouslySetInnerHTML={{ __html: previewEmailContent.body }} />
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-[11px] text-slate-600 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>An toàn định dạng:</strong> Các biến như <code>{MOCK_REAL_CANDIDATE_DATA.candidate_name}</code>, <code>{MOCK_REAL_CANDIDATE_DATA.job_title}</code> đã được escape an toàn chống vỡ cấu trúc HTML.
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Chế độ gửi:{" "}
                <strong className={currentEmailTemplate.isAutoSend ? "text-emerald-600" : "text-slate-600"}>
                  {currentEmailTemplate.isAutoSend ? "Tự động kích hoạt" : "Gửi thủ công"}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => setIsEmailPreviewOpen(false)}
                className="px-5 py-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold"
              >
                Đóng Xem Trước
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HRSettingsManagementView;
