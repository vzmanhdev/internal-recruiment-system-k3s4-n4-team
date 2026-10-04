import type { Metadata } from "next";
import { Inter, Caveat } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TUYỂN DỤNG NỘI BỘ | Better People, Brighter Tomorrow",
  description: "Cổng tuyển dụng và phát triển cơ hội nghề nghiệp nội bộ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${inter.variable} ${caveat.variable}`} data-scroll-behavior="smooth">
      <body className="antialiased">{children}</body>
    </html>
  );
}
