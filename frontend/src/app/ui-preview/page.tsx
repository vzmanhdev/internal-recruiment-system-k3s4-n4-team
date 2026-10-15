"use client";

import React, { useState } from "react";
import { Search, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Container } from "@/components/layout/Container";
import { BrandLogo } from "@/components/layout/BrandLogo";

export default function UIPreviewPage() {
  const [isChecked, setIsChecked] = useState(true);

  return (
    <main className="py-12 bg-[#F8FAFC] min-h-screen">
      <Container className="space-y-12">
        <header className="border-b border-slate-200 pb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--color-heading)]">
              UI Component Showcase
            </h1>
            <p className="text-sm text-[var(--color-muted)] mt-1">
              Hệ thống Design System & Reusable Components — Enterprise SaaS
            </p>
          </div>
          <BrandLogo size="md" />
        </header>

        {/* Brand Logo Showcase */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-[var(--color-heading)]">1. Brand Logo</h2>
          <div className="flex flex-wrap items-center gap-8 p-6 bg-white rounded-2xl border border-slate-200">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400">Small (sm)</span>
              <div><BrandLogo size="sm" /></div>
            </div>
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400">Medium (md)</span>
              <div><BrandLogo size="md" /></div>
            </div>
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400">Large (lg)</span>
              <div><BrandLogo size="lg" /></div>
            </div>
          </div>
        </section>

        {/* Buttons Showcase */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-[var(--color-heading)]">2. Buttons</h2>
          <Card className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400">Variants</span>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="danger">Danger Button</Button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400">Sizes & Icons</span>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" leftIcon={<Search className="w-4 h-4" />}>Small Search</Button>
                <Button size="md" leftIcon={<User className="w-4 h-4" />}>Medium User</Button>
                <Button size="lg" rightIcon={<Mail className="w-5 h-5" />}>Large Send</Button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400">States (Disabled & Loading)</span>
              <div className="flex flex-wrap items-center gap-3">
                <Button disabled>Disabled Button</Button>
                <Button isLoading>Đang đăng nhập...</Button>
                <Button variant="secondary" isLoading>Loading State</Button>
              </div>
            </div>
          </Card>
        </section>

        {/* Inputs Showcase */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-[var(--color-heading)]">3. Inputs & Form Controls</h2>
          <Card className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Họ và tên"
              placeholder="Nhập họ và tên của bạn"
              leftIcon={<User className="w-5 h-5" />}
              required
            />
            <Input
              label="Email công ty"
              type="email"
              placeholder="user@company.com"
              leftIcon={<Mail className="w-5 h-5" />}
              helperText="Sử dụng email doanh nghiệp để nhận mã xác minh."
              required
            />
            <Input
              label="Mã nhân viên (Có lỗi)"
              placeholder="NV001"
              error="Mã nhân viên đã tồn tại trên hệ thống."
            />
            <Input
              label="Phòng ban (Vô hiệu hóa)"
              value="Khối Công nghệ Thông tin"
              disabled
            />
            <PasswordInput
              label="Mật khẩu"
              placeholder="Nhập mật khẩu (ít nhất 8 ký tự)"
              leftIcon={<Lock className="w-5 h-5" />}
              required
            />
            <Select
              label="Phòng ban hiện tại"
              required
              options={[
                { value: "", label: "Chọn phòng ban" },
                { value: "it", label: "Công nghệ thông tin" },
                { value: "hr", label: "Quản trị nhân sự" },
                { value: "product", label: "Phát triển sản phẩm" },
                { value: "sales", label: "Kinh doanh & Phát triển thị trường" },
              ]}
            />
          </Card>
        </section>

        {/* Checkbox Showcase */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-[var(--color-heading)]">4. Checkbox</h2>
          <Card className="space-y-4">
            <Checkbox
              label="Ghi nhớ đăng nhập"
              description="Duy trì phiên đăng nhập của bạn trong 30 ngày tới"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
            />
            <Checkbox
              label="Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật."
            />
            <Checkbox
              label="Quyền ưu tiên ứng tuyển nội bộ (Vô hiệu hóa)"
              disabled
              checked
            />
            <Checkbox
              label="Đã đọc thông tin quy trình (Có lỗi)"
              error="Bạn cần đồng ý với điều khoản để tiếp tục."
            />
          </Card>
        </section>

        {/* Badges & Alerts Showcase */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-[var(--color-heading)]">5. Badges & Alerts</h2>
          <Card className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400">Badges</span>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="default">Default</Badge>
                <Badge variant="primary">Ưu tiên nội bộ</Badge>
                <Badge variant="success">Đang tuyển</Badge>
                <Badge variant="warning">Sắp hết hạn</Badge>
                <Badge variant="danger">Hot</Badge>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-400">Alerts</span>
              <Alert variant="info" title="Thông báo hệ thống">
                Đợt tuyển dụng nội bộ Quý 3/2026 sẽ kết thúc vào ngày 30/10.
              </Alert>
              <Alert variant="success" title="Thành công">
                Tài khoản của bạn đã được đăng ký thành công trên hệ thống.
              </Alert>
              <Alert variant="warning" title="Lưu ý">
                Mật khẩu của bạn sẽ hết hạn sau 5 ngày tới.
              </Alert>
              <Alert variant="error" title="Đã có lỗi xảy ra">
                Email hoặc mật khẩu không chính xác. Vui lòng thử lại.
              </Alert>
            </div>
          </Card>
        </section>

        {/* Cards Showcase */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-[var(--color-heading)]">6. Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="default">
              <h3 className="font-bold text-lg text-[var(--color-heading)] mb-2">Default Card</h3>
              <p className="text-sm text-[var(--color-body)]">
                Thẻ hiển thị thông tin chuẩn enterprise với shadow dịu nhẹ và border tinh tế.
              </p>
            </Card>

            <Card variant="interactive">
              <Badge variant="primary" className="mb-3">Interactive</Badge>
              <h3 className="font-bold text-lg text-[var(--color-heading)] mb-2">Interactive Card</h3>
              <p className="text-sm text-[var(--color-body)]">
                Thẻ tương tác có hiệu ứng hover mượt mà dùng cho danh sách vị trí việc làm.
              </p>
            </Card>

            <Card variant="subtle">
              <h3 className="font-bold text-lg text-[var(--color-heading)] mb-2">Subtle Card</h3>
              <p className="text-sm text-[var(--color-body)]">
                Thẻ nền dịu phù hợp cho khối thông tin phụ hoặc tóm tắt quy trình.
              </p>
            </Card>
          </div>
        </section>
      </Container>
    </main>
  );
}
