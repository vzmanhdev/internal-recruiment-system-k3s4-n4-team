import React from "react";
import Link from "next/link";
import { BrandLogo } from "./BrandLogo";
import { Container } from "./Container";

export function Footer() {
  return (
    <footer className="bg-gradient-to-b from-sky-50/60 via-white to-blue-50/40 text-slate-600 border-t border-blue-100 pt-16 pb-12">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-blue-100/80">
          <div className="md:col-span-2 space-y-4">
            <div>
              <BrandLogo size="lg" />
            </div>
            <p className="text-sm text-slate-600 max-w-md leading-relaxed">
              Cổng tuyển dụng và phát triển cơ hội nghề nghiệp nội bộ. Nơi kết nối tài năng, tôn vinh đóng góp và tạo dựng lộ trình thăng tiến bền vững cho mọi nhân sự.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 tracking-wider uppercase">Khám phá</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/#jobs" className="text-slate-600 hover:text-blue-600 transition-colors">Vị trí đang tuyển</Link>
              </li>
              <li>
                <Link href="/#career-path" className="text-slate-600 hover:text-blue-600 transition-colors">Lộ trình phát triển</Link>
              </li>
              <li>
                <Link href="/#process" className="text-slate-600 hover:text-blue-600 transition-colors">Quy trình ứng tuyển</Link>
              </li>
              <li>
                <Link href="/#news" className="text-slate-600 hover:text-blue-600 transition-colors">Chương trình giới thiệu & Tin tức</Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 tracking-wider uppercase">Hỗ trợ & Pháp lý</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="#faq" className="text-slate-600 hover:text-blue-600 transition-colors">Câu hỏi thường gặp (FAQ)</Link>
              </li>
              <li>
                <Link href="#" className="text-slate-600 hover:text-blue-600 transition-colors">Chính sách bảo mật</Link>
              </li>
              <li>
                <Link href="#" className="text-slate-600 hover:text-blue-600 transition-colors">Điều khoản sử dụng</Link>
              </li>
              <li>
                <Link href="#" className="text-slate-600 hover:text-blue-600 transition-colors">Hỗ trợ kỹ thuật</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 TUYỂN DỤNG NỘI BỘ. Tất cả các quyền được bảo lưu.</p>
          <p>Hệ thống Tuyển dụng & Phát triển Cơ hội Nghề nghiệp Nội bộ Enterprise SaaS</p>
        </div>
      </Container>
    </footer>
  );
}
