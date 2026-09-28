"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/Icons";
import { AuthActions } from "@/features/auth/components/AuthActions";

const links=[{href:"/",label:"Trang chủ"},{href:"/jobs",label:"Vị trí tuyển dụng"},{href:"/process",label:"Quy trình"},{href:"/faq",label:"Câu hỏi thường gặp"}];
export function Header(){
 const pathname=usePathname(); const [open,setOpen]=useState(false);
 return <header className="site-header"><Link className="brand" href="/"><span className="brand__icon"><Icon name="people"/></span><span>TUYỂN DỤNG NỘI BỘ</span></Link><button className="icon-button mobile-menu" aria-label="Mở menu" aria-expanded={open} onClick={()=>setOpen(!open)}><Icon name="menu"/></button><nav className={`main-nav ${open?"is-open":""}`} aria-label="Điều hướng chính">{links.map(link=><Link key={link.href} className={pathname===link.href?"is-active":""} href={link.href} onClick={()=>setOpen(false)}>{link.label}</Link>)}<AuthActions mobile/></nav><AuthActions/></header>;
}
