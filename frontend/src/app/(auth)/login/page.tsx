import { AuthVisual } from "@/features/auth/components/AuthVisual";
import { LoginForm } from "@/features/auth/components/LoginForm";
export default function LoginPage(){return <main className="auth-page grid min-h-screen grid-cols-1 md:grid-cols-[54.3%_45.7%]"><AuthVisual variant="login"/><section className="auth-panel grid place-items-center bg-[#eef7ff]"><LoginForm/></section></main>}
