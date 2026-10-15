import React from "react";
import Link from "next/link";
import { BrandLogo } from "./BrandLogo";
import { Container } from "./Container";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 pt-16 pb-12">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          <div className="md:col-span-2 space-y-4">
            <div className="brightness-200">
              <BrandLogo size="lg" />
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Cổng tuyển dụng và phát triển cơ hội nghề nghiệp nội bộ. Nơi kết nối tài năng, tôn vinh đóng góp và tạo dựng lộ trình thăng tiến bền vững cho mọi nhân sự.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase">Khám phá</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/#jobs" className="hover:text-white transition-colors">Vị trí đang tuyển</Link>
              </li>
              <li>
                <Link href="/#career-path" className="hover:text-white transition-colors">Lộ trình phát triển</Link>
              </li>
              <li>
                <Link href="/#process" className="hover:text-white transition-colors">Quy trình ứng tuyển</Link>
              </li>
              <li>
                <Link href="/#news" className="hover:text-white transition-colors">Chương trình giới thiệu & Tin tức</Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase">Hỗ trợ & Pháp lý</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="#faq" className="hover:text-white transition-colors">Câu hỏi thường gặp (FAQ)</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">Chính sách bảo mật</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">Điều khoản sử dụng</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">Hỗ trợ kỹ thuật</Link>
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
