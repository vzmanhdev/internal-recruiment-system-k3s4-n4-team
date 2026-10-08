'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, FileCheck, ShieldCheck, Briefcase, Users, Calendar, 
  FileText, Award, Layers, Target, Mail, Send, BarChart3, History, 
  ChevronRight, Sparkles, Building2, UserCheck, Sparkle, UserPlus
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavGroup {
  groupName: string;
  items: NavItem[];
}

const hrNavigationGroups: NavGroup[] = [
  {
    groupName: "TỔNG QUAN",
    items: [
      { label: "Dashboard Control Center", href: "/hr/dashboard", icon: LayoutDashboard },
    ]
  },
  {
    groupName: "TUYỂN DỤNG",
    items: [
      { label: "Yêu cầu tuyển dụng (REQ)", href: "/hr/requisitions", icon: FileCheck, badge: "SLA" },
      { label: "Trung tâm Phê duyệt", href: "/hr/approvals", icon: ShieldCheck, badge: "3 cấp" },
      { label: "Tin tuyển dụng", href: "/hr/job-postings", icon: Briefcase },
      { label: "Ứng viên & Pipeline", href: "/hr/candidates", icon: Users },
      { label: "Kho tiềm năng (Talent Pool)", href: "/hr/talent-pool", icon: Sparkles },
      { label: "Lịch phỏng vấn", href: "/hr/interviews", icon: Calendar },
      { label: "Offer thư mời", href: "/hr/offers", icon: FileText },
      { label: "Checklist Onboarding", href: "/hr/onboarding", icon: UserPlus },
    ]
  },
  {
    groupName: "QUẢN TRỊ NGHIỆP VỤ",
    items: [
      { label: "Cơ cấu phòng ban", href: "/hr/master-data/departments", icon: Building2 },
      { label: "Chức danh & Dải lương", href: "/hr/master-data/positions", icon: Award },
      { label: "Ngân sách Headcount", href: "/hr/master-data/headcount", icon: Target, badge: "Override" },
      { label: "Luồng phê duyệt động", href: "/hr/master-data/approval-flows", icon: Layers },
      { label: "Khung năng lực & Câu hỏi", href: "/hr/master-data/competencies", icon: UserCheck },
      { label: "Danh mục dùng chung", href: "/hr/master-data/lookups", icon: Layers },
    ]
  },
  {
    groupName: "TỰ ĐỘNG HÓA",
    items: [
      { label: "Cấu hình Mẫu Email", href: "/hr/automation/email-templates", icon: Mail },
      { label: "Nhật ký gửi Email", href: "/hr/automation/email-logs", icon: Send },
    ]
  },
  {
    groupName: "BÁO CÁO & HỆ THỐNG",
    items: [
      { label: "Báo cáo Analytics & Excel", href: "/hr/reports", icon: BarChart3, badge: "Excel" },
      { label: "Nhật ký hệ thống Audit", href: "/hr/audit-logs", icon: History },
    ]
  }
];

export const HRSidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200/80 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between select-none">
      <div className="space-y-6">
        {hrNavigationGroups.map((group, idx) => (
          <div key={idx} className="space-y-1.5">
            <div className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              {group.groupName}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item, itemIdx) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/hr/dashboard' && pathname?.startsWith(item.href));
                
                return (
                  <Link
                    key={itemIdx}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group cursor-pointer ${
                      isActive 
                        ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100/80 shadow-sm shadow-blue-500/5' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                        isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer System Status */}
      <div className="pt-4 border-t border-slate-100 px-3 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center justify-between">
          <span>Enterprise ATS v3.4</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <p className="text-[10px]">Hệ thống Tuyển dụng Nội bộ</p>
      </div>
    </aside>
  );
};
