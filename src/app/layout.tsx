import './globals.css';

export const metadata = {
  title: 'Nội Bộ Careers',
  description: 'Cổng tuyển dụng nội bộ nhân viên',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="bg-[#071322] text-white min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}