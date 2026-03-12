import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppUser } from '../types';

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
    { label: 'แดชบอร์ด', to: '/user/dashboard', icon: '🏠' },
    { label: 'รายการอุปกรณ์', to: '/equipment', icon: '📦' },
    { label: 'ประวัติการยืม', to: '/history', icon: '🧾' },
    { label: 'คืนอุปกรณ์', to: '/returns', icon: '↩️' },
  ],
  admin: [
    { label: 'แดชบอร์ด', to: '/admin/dashboard', icon: '🏠' },
    { label: 'อนุมัติคำขอ', to: '/admin/requests', icon: '✅' },
    { label: 'ยืนยันการคืน', to: '/admin/returns', icon: '📥' },
    { label: 'ประวัติทั้งหมด', to: '/admin/history', icon: '🧾' },
    { label: 'จัดการหมวดหมู่', to: '/admin/categories', icon: '🗂️' },
    { label: 'จัดการอุปกรณ์', to: '/admin/equipment', icon: '🛠️' },
    { label: 'จัดการผู้ใช้', to: '/admin/users', icon: '👥' },
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
            <p className="text-xs uppercase tracking-[0.4em] text-white/70">ชมรมมหาวิทยาลัย</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight">ระบบยืมอุปกรณ์</h1>
            <p className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-white/85">
              {user.name}
              <br />
              {userIdentityLabel}
            </p>
            <nav className="mt-8 space-y-2">
              {navItems.map((item) => {
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                      active ? 'bg-white text-cardinal shadow-panel' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <span aria-hidden="true" className="text-base leading-none">{item.icon}</span>
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
              <span aria-hidden="true">↩</span>
              ออกจากระบบ
            </button>
          </div>
        </aside>
        <main className="px-4 py-6 sm:px-6 lg:px-10">
          <header className="mb-8 flex flex-col gap-3 rounded-[28px] border border-white/70 bg-white/80 px-6 py-5 shadow-panel backdrop-blur md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-stone-500">ระบบจัดการชมรมมหาวิทยาลัย</p>
              <h2 className="mt-2 text-3xl font-semibold text-ink">{title}</h2>
            </div>
            <div className="text-sm text-stone-500">
              บทบาท: <span className="font-semibold text-cardinal">{user.role === 'admin' ? '🛡️ ' : '🎓 '}{roleLabels[user.role]}</span>
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
