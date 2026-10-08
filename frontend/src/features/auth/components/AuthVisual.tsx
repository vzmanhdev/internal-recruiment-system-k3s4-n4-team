import Image from "next/image";

export function AuthVisual({variant}:{variant:"login"|"register"}){
  const isLogin=variant==="login";
  return <section className={`auth-visual auth-visual--${variant} relative overflow-hidden bg-[#e8f4ff]`}>
    <div className="auth-copy">{isLogin?<><h1>Cơ hội phát triển<br/><span>bắt đầu từ bên trong</span></h1><i/><p>Cùng nhau kiến tạo môi trường làm việc<br/>tốt hơn mỗi ngày.</p></>:<p className="auth-kicker">Cùng phát triển<br/>Cùng tạo giá trị</p>}</div>
    <div className="auth-photo relative overflow-hidden"><Image className="object-cover" src={isLogin?"/images/login-team.png":"/images/register-employee.png"} alt={isLogin?"Nhóm nhân viên cùng trao đổi bên máy tính":"Nhân viên đang làm việc trên máy tính"} fill priority sizes="(max-width: 767px) 100vw, 55vw"/></div>
    {!isLogin&&<div className="register-copy"><h1>Bắt đầu hành trình mới<br/><span>từ chính nơi bạn đang làm việc</span></h1><i/><p>Những cơ hội tốt nhất đôi khi không nằm ở bên ngoài,<br/>mà ở ngay trong chính ngôi nhà chung của chúng ta.</p></div>}
    {!isLogin&&<div className="benefits"><span>↗ <b>Phát triển<br/>sự nghiệp</b></span><span>◎ <b>Kết nối<br/>tài năng nội bộ</b></span><span>☆ <b>Kiến tạo<br/>giá trị bền vững</b></span></div>}
  </section>
}
