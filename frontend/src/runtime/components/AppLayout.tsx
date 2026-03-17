import React, { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppUser } from '../types';
import {
  Home,
  Box,
  Receipt,
  Undo2,
  CheckCircle,
  Inbox,
  FolderTree,
  Wrench,
  Users,
  GraduationCap,
  Shield,
  History,
} from 'lucide-react';

const roleLabels = {
  user: 'นักศึกษา',
  admin: 'ผู้ดูแลระบบ',
} as const;

interface AppLayoutProps {
  user: AppUser;
  title: string;
  onLogout: () => void;
  children: ReactNode;
}

const navByRole = {
  user: [
    { label: 'แดชบอร์ด', to: '/user/dashboard', icon: Home as React.ComponentType<{ className?: string }> },
    { label: 'รายการอุปกรณ์', to: '/equipment', icon: Box as React.ComponentType<{ className?: string }> },
    { label: 'ประวัติการยืม', to: '/history', icon: History as React.ComponentType<{ className?: string }> },
    { label: 'คืนอุปกรณ์', to: '/returns', icon: Undo2 as React.ComponentType<{ className?: string }> },
  ],
  admin: [
    { label: 'แดชบอร์ด', to: '/admin/dashboard', icon: Home as React.ComponentType<{ className?: string }> },
    { label: 'อนุมัติคำขอ', to: '/admin/requests', icon: CheckCircle as React.ComponentType<{ className?: string }> },
    { label: 'ยืนยันการคืน', to: '/admin/returns', icon: Inbox as React.ComponentType<{ className?: string }> },
    { label: 'ประวัติทั้งหมด', to: '/admin/history', icon: History as React.ComponentType<{ className?: string }> },
    { label: 'จัดการหมวดหมู่', to: '/admin/categories', icon: FolderTree as React.ComponentType<{ className?: string }> },
    { label: 'จัดการอุปกรณ์', to: '/admin/equipment', icon: Wrench as React.ComponentType<{ className?: string }> },
    { label: 'จัดการผู้ใช้', to: '/admin/users', icon: Users as React.ComponentType<{ className?: string }> },
  ],
} as const;

const AppLayout = ({ user, title, onLogout, children }: AppLayoutProps) => {
  const location = useLocation();
  const navItems = navByRole[user.role];
  const userIdentityLabel = user.role === 'user' ? user.student_id : user.email;

  return (
    <div className="min-h-screen bg-parchment">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="relative overflow-hidden bg-gradient-to-b from-cardinal via-brick to-ink px-6 py-8 text-white">
          <div className="absolute inset-0 opacity-10 campus-overlay" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.4em] text-white/70">สโมสรนิสิตคณะวิศวกรรมศาสตร์</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight">ระบบยืมอุปกรณ์</h1>
            <p className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-white/85">
              {user.name}
              <br />
              {userIdentityLabel}
            </p>
            <nav className="mt-8 space-y-2">
              {navItems.map((item) => {
                const active = location.pathname === item.to;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                      active ? 'bg-white text-cardinal shadow-panel' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {Icon ? <Icon className="w-5 h-5" /> : null}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <button
              type="button"
              onClick={onLogout}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/25 bg-transparent px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <Undo2 className="w-5 h-5" />
              ออกจากระบบ
            </button>
          </div>
        </aside>
        <main className="px-4 py-6 sm:px-6 lg:px-10">
          <header className="mb-8 flex flex-col gap-3 rounded-[28px] border border-white/70 bg-white/80 px-6 py-5 shadow-panel backdrop-blur md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-stone-500">ระบบยืมอุปกรณ์ของสโมสรนิสิตคณะวิศวกรรมศาสตร์</p>
              <h2 className="mt-2 text-3xl font-semibold text-ink">{title}</h2>
            </div>
            <div className="text-sm text-stone-500">
              บทบาท: <span className="font-semibold text-cardinal">
                {user.role === 'admin'
                  ? <Shield className="w-5 h-5 inline align-middle mr-1" />
                  : <GraduationCap className="w-5 h-5 inline align-middle mr-1" />}
                {roleLabels[user.role]}
              </span>
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
