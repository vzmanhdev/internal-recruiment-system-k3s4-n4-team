'use client';

import { useState } from 'react';

export default function Home() {
  // Trạng thái quản lý 2 Modal
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // --- Trạng thái cho Form Đăng nhập ---
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // --- Trạng thái cho Form Đăng ký ---
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDepartment, setRegDepartment] = useState('');
  const [regPosition, setRegPosition] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // --- Hàm xử lý ---
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Đăng nhập thành công với Email: ${loginEmail}`);
    setShowLoginModal(false);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regConfirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }
    if (!agreeTerms) {
      alert('Vui lòng đồng ý với Điều khoản sử dụng!');
      return;
    }
    
    // Đăng ký thành công: Tắt form đăng ký, bật form đăng nhập
    alert('Tạo tài khoản thành công! Vui lòng đăng nhập.');
    setShowRegisterModal(false);
    setShowLoginModal(true);
  };

  // Hàm chuyển đổi giữa 2 form
  const switchToRegister = () => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
  };

  const switchToLogin = () => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
  };

  return (
    <div className="relative min-h-screen bg-[#071322] text-white flex flex-col justify-between p-6 md:p-10 overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-cyan-900/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-teal-900/30 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header / Logo */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-9 h-9 bg-[#1ABC9C] rounded-lg flex items-center justify-center text-[#071322] font-bold">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" transform="rotate(45 10 10)" />
          </svg>
        </div>
        <span className="text-xl font-bold tracking-tight">Nội Bộ Careers</span>
      </div>

      {/* Content chính */}
      <div className="relative z-10 my-auto max-w-md mx-auto w-full py-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#162C46] border border-cyan-500/20 text-[#1ABC9C] text-xs font-semibold tracking-wider uppercase mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1ABC9C]"></span>
          Dành riêng cho nhân viên
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold leading-tight text-white mb-4">
          Cơ hội tiếp theo của bạn có thể ở ngay đây.
        </h1>

        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          Khám phá vị trí mới, phát huy thế mạnh và phát triển sự nghiệp lâu dài trong chính tổ chức bạn đã thấu hiểu.
        </p>
      </div>

      {/* Nút ngoài màn hình chính */}
      <div className="relative z-10 max-w-md mx-auto w-full space-y-4 text-center">
        <button
          onClick={() => setShowLoginModal(true)}
          className="w-full py-3.5 px-6 rounded-xl bg-[#1ABC9C] hover:bg-[#16a085] text-[#071322] font-bold text-base transition-all duration-200 shadow-lg shadow-teal-500/10 active:scale-[0.98] cursor-pointer"
        >
          Đăng nhập
        </button>

        <div className="text-xs text-gray-400">
          Chưa có tài khoản?{' '}
          <button onClick={() => setShowRegisterModal(true)} className="text-white hover:underline font-medium cursor-pointer">
            Đăng ký
          </button>
        </div>

        <p className="text-[11px] text-gray-500 pt-6">
          Cổng tuyển dụng nội bộ • Bảo mật thông tin nhân viên
        </p>
      </div>

      {/* ================= MODAL FORM ĐĂNG NHẬP ================= */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 border border-gray-100 text-gray-800">
            <button onClick={() => setShowLoginModal(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="mb-6">
              <span className="text-[11px] font-bold tracking-wider text-[#10b981] uppercase">CHÀO MỪNG TRỞ LẠI</span>
              <h2 className="text-2xl font-extrabold text-[#111827] mt-1 mb-2">Đăng nhập</h2>
              <p className="text-xs text-gray-500 leading-relaxed">Sử dụng email công ty để tiếp tục khám phá cơ hội nghề nghiệp.</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email công ty</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </span>
                  <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="tenban@noibo.vn" className="w-full pl-10 pr-3 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#10b981] focus:bg-white transition-all text-gray-800 placeholder-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mật khẩu</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </span>
                  <input type={showLoginPassword ? 'text' : 'password'} required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Nhập mật khẩu" className="w-full pl-10 pr-10 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#10b981] focus:bg-white transition-all text-gray-800 placeholder-gray-400" />
                  <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-3.5 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">{showLoginPassword ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a8.962 8.962 0 012.122-.163c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />}</svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-gray-500 cursor-pointer select-none">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-[#10b981] focus:ring-[#10b981]" />
                  Ghi nhớ đăng nhập
                </label>
                <a href="#" className="text-[#10b981] hover:underline font-semibold">Quên mật khẩu?</a>
              </div>

              <button type="submit" className="w-full py-3 px-4 mt-2 bg-[#10b981] hover:bg-[#059669] text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer">
                Đăng nhập
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-gray-500">
              Chưa có tài khoản?{' '}
              <button onClick={switchToRegister} className="text-[#10b981] font-bold hover:underline cursor-pointer">
                Đăng ký ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL FORM ĐĂNG KÝ ================= */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg p-7 border border-gray-100 text-gray-800 my-auto">
            {/* Nút tắt */}
            <button onClick={() => setShowRegisterModal(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            {/* Tiêu đề Modal Đăng ký */}
            <div className="mb-6">
              <span className="text-[11px] font-bold tracking-wider text-[#1ABC9C] uppercase">BẮT ĐẦU HÀNH TRÌNH MỚI</span>
              <h2 className="text-2xl font-extrabold text-[#111827] mt-1 mb-2">Tạo tài khoản nội bộ</h2>
              <p className="text-xs text-gray-500 leading-relaxed">Hoàn tất thông tin để xem các vị trí phù hợp trong tổ chức.</p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Họ và tên */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Họ và tên</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </span>
                  <input type="text" required value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="Nguyễn Minh Anh" className="w-full pl-10 pr-3 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1ABC9C] focus:bg-white transition-all placeholder-gray-400" />
                </div>
              </div>

              {/* Email công ty */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email công ty</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </span>
                  <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="tenban@noibo.vn" className="w-full pl-10 pr-3 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1ABC9C] focus:bg-white transition-all placeholder-gray-400" />
                </div>
              </div>

              {/* Grid 2 cột: Phòng ban & Vị trí */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phòng ban</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </span>
                    <select required value={regDepartment} onChange={(e) => setRegDepartment(e.target.value)} className="w-full pl-10 pr-3 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1ABC9C] focus:bg-white transition-all text-gray-600 appearance-none">
                      <option value="" disabled hidden>Chọn phòng ban</option>
                      <option value="IT">Công nghệ thông tin</option>
                      <option value="HR">Nhân sự</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Sales">Kinh doanh</option>
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Vị trí hiện tại</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </span>
                    <input type="text" required value={regPosition} onChange={(e) => setRegPosition(e.target.value)} placeholder="Nhập vị trí" className="w-full pl-10 pr-3 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1ABC9C] focus:bg-white transition-all placeholder-gray-400" />
                  </div>
                </div>
              </div>

              {/* Grid 2 cột: Mật khẩu */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mật khẩu</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </span>
                    <input type={showRegPassword ? 'text' : 'password'} required minLength={8} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Tối thiểu 8 ký tự" className="w-full pl-10 pr-10 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1ABC9C] focus:bg-white transition-all placeholder-gray-400" />
                    <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute right-3.5 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">{showRegPassword ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a8.962 8.962 0 012.122-.163c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />}</svg>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Xác nhận mật khẩu</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </span>
                    <input type={showRegConfirmPassword ? 'text' : 'password'} required minLength={8} value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)} placeholder="Nhập lại mật khẩu" className="w-full pl-10 pr-10 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1ABC9C] focus:bg-white transition-all placeholder-gray-400" />
                    <button type="button" onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)} className="absolute right-3.5 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">{showRegConfirmPassword ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a8.962 8.962 0 012.122-.163c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21M3 3l18 18" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />}</svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Điều khoản */}
              <div className="pt-2">
                <label className="flex items-start gap-2 text-[11px] text-gray-500 cursor-pointer select-none">
                  <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-0.5 w-3.5 h-3.5 rounded border-gray-300 text-[#1ABC9C] focus:ring-[#1ABC9C]" />
                  <span>Tôi đồng ý với <a href="#" className="text-[#1ABC9C] hover:underline font-medium">Điều khoản sử dụng</a> và <a href="#" className="text-[#1ABC9C] hover:underline font-medium">Chính sách bảo mật</a>.</span>
                </label>
              </div>

              {/* Nút Tạo tài khoản */}
              <button type="submit" className="w-full py-3 px-4 mt-2 bg-[#1ABC9C] hover:bg-[#16a085] text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]">
                <span>Tạo tài khoản</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-gray-500">
              Đã có tài khoản?{' '}
              <button onClick={switchToLogin} className="text-[#1ABC9C] font-bold hover:underline cursor-pointer">
                Đăng nhập
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}