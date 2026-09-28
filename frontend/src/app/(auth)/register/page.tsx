import Link from "next/link";
import { Icon } from "@/components/ui/Icons";
import { AuthVisual } from "@/features/auth/components/AuthVisual";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
export default function RegisterPage(){return <div className="register-shell min-h-screen bg-[#f3f9ff]"><header className="register-header flex items-center justify-between"><Link className="brand" href="/"><span className="brand__icon"><Icon name="people"/></span><span>TUYỂN DỤNG NỘI BỘ</span></Link><p>Con người từ nội bộ tạo nên những điều lớn lao <i/></p></header><main className="auth-page auth-page--register grid grid-cols-1 md:grid-cols-[55.5%_44.5%]"><AuthVisual variant="register"/><section className="auth-panel grid place-items-center bg-[#eef7ff]"><RegisterForm/></section></main></div>}
