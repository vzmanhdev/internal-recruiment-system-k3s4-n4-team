import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata={title:"Tuyển dụng nội bộ",description:"Cổng cơ hội nghề nghiệp dành cho nhân viên"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="vi"><body>{children}</body></html>}
