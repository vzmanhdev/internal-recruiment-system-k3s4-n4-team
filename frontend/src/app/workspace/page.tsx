'use client';

import { authService } from '@/features/auth/services/auth.service';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import UnifiedAppShell from '@/components/layout/UnifiedAppShell';
import {
  FileText,
  Calendar,
  ClipboardCheck,
  CheckCircle2,
  Users,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Award,
  KeyRound,
} from 'lucide-react';

interface UserData {
  full_name: string;
  email: string;
  roles?: ({ code: string; name: string } | string)[];
  permissions?: string[];
  department?: string;
  job_title?: string;
}

export default function MultiRoleWorkspacePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cachedUserStr = localStorage.getItem('user') || localStorage.getItem('user_info');
    if (cachedUserStr) {
      try {
        setUser(JSON.parse(cachedUserStr));
      } catch (e) {}
    }

    if (authService.getToken()) {
      // Shared client: env-configured base URL, refresh-on-expiry and the 401/403 policy.
      authService.getCurrentUser()
        .then((data) => {
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
          localStorage.setItem('user_info', JSON.stringify(data));
        })
        .catch(() => undefined)
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const perms = new Set(user?.permissions || []);
  const isAdmin = Boolean(
    user?.roles?.some((r: any) => (typeof r === 'string' ? r === 'admin' : r.code === 'admin'))
  );

  const MODULE_CARDS = [
    {
      id: 'manager-requisitions',
      title: 'Đề xuất Tuyển dụng',
      desc: 'Khởi tạo và quản lý danh sách nhu cầu tuyển dụng nhân sự cho bộ phận.',
      href: '/manager/requisitions',
      icon: FileText,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      perm: 'requisition:view',
    },
    {
      id: 'interviews',
      title: 'Lịch phỏng vấn',
      desc: 'Xem danh sách các ca phỏng vấn được phân công và chuẩn bị đánh giá.',
      href: '/interviewer/interviews',
      icon: Calendar,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      perm: 'interview:view',
    },
    {
      id: 'evaluations',
      title: 'Phiếu đánh giá Phỏng vấn',
      desc: 'Nộp nhận xét, chấm điểm năng lực ứng viên sau mỗi buổi phỏng vấn.',
      href: '/interviewer/evaluations',
      icon: ClipboardCheck,
      color: 'bg-cyan-50 text-cyan-600 border-cyan-200',
      perm: 'interview:evaluate',
    },
    {
      id: 'approvals',
      title: 'Trung tâm Phê duyệt',
      desc: 'Duyệt các đề xuất tuyển dụng và đề nghị Offer tuyển dụng cần phê duyệt.',
      href: '/approver',
      icon: CheckCircle2,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      perm: 'offer:approve',
    },
    {
      id: 'candidates',
      title: 'Quản lý Ứng viên',
      desc: 'Theo dõi quy trình tuyển dụng, chuyển vòng và sàng lọc hồ sơ ứng viên.',
      href: '/hr/candidates',
      icon: Users,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      perm: 'candidate:view',
    },
    {
      id: 'offers',
      title: 'Đề xuất & Thư mời Offer',
      desc: 'Lập thư mời nhận việc và theo dõi phản hồi của ứng viên trúng tuyển.',
      href: '/hr/offers',
      icon: Award,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
      perm: 'offer:create',
    },
    {
      id: 'admin',
      title: 'Quản trị hệ thống RBAC',
      desc: 'Quản lý tài khoản, cấu hình Ma trận Phân quyền và kiểm tra Audit Logs.',
      href: '/admin',
      icon: ShieldCheck,
      color: 'bg-slate-100 text-slate-700 border-slate-300',
      perm: 'permission:manage',
    },
  ];

  const availableCards = MODULE_CARDS.filter(
    (card) => isAdmin || card.perm === null || perms.has(card.perm)
  );

  return (
    <UnifiedAppShell>
      <div className="space-y-8">
        {/* HERO WELCOME BANNER */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-blue-100 border border-white/20">
              <Sparkles size={14} className="text-yellow-300" />
              <span>Workspace đa vai trò</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold">
              Xin chào, {user?.full_name || 'Nhân sự nội bộ'}!
            </h1>
            <p className="text-blue-100 text-sm max-w-2xl">
              Hệ thống tự động hợp nhất (UNION) tất cả các quyền hạn và menu làm việc của bạn thành một không gian quản trị tập trung duy nhất.
            </p>

            {/* User roles tags */}
            {user?.roles && user.roles.length > 0 && (
              <div className="pt-2 flex flex-wrap gap-2 items-center">
                <span className="text-xs text-blue-200 font-medium mr-1">Quyền đang sở hữu:</span>
                {user.roles.map((r: any, idx: number) => {
                  const code = typeof r === 'string' ? r : r.code;
                  const name = typeof r === 'string' ? r : r.name;
                  return (
                    <span
                      key={code || idx}
                      className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-md border border-white/30 shadow-xs"
                    >
                      {name}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* QUICK ACCESS MODULES GRID */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#0F172A]">Truy cập nhanh Phân hệ Chức năng</h2>
            <span className="text-xs text-[#64748B]">
              Hiển thị theo Effective Permissions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {availableCards.map((card) => {
              const IconComp = card.icon;
              return (
                <Link
                  key={card.id}
                  href={card.href}
                  className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs hover:shadow-md hover:border-blue-400 transition-all group flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center border ${card.color}`}
                    >
                      <IconComp size={24} />
                    </div>
                    <h3 className="font-bold text-base text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-[#64748B] leading-relaxed">{card.desc}</p>
                  </div>

                  <div className="pt-2 flex items-center text-xs font-semibold text-[#2563EB] group-hover:translate-x-1 transition-transform">
                    <span>Truy cập làm việc</span>
                    <ArrowRight size={14} className="ml-1.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </UnifiedAppShell>
  );
}
