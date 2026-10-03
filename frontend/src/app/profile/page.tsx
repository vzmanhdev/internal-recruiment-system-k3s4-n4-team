import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ProfileEditor } from "@/features/auth/components/ProfileEditor";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="px-4 py-10 sm:px-6">
        <div className="mx-auto mb-7 max-w-2xl text-center">
          <h1 className="text-3xl font-black text-slate-950">Hồ sơ cá nhân</h1>
          <p className="mt-2 text-sm text-slate-500">Cập nhật ảnh đại diện và thông tin liên hệ của bạn.</p>
        </div>
        <ProfileEditor />
      </main>
      <Footer />
    </div>
  );
}
