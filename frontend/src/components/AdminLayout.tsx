import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Building2,
  ChartColumn,
  ClipboardList,
  LogOut,
  Settings,
  Shield,
  UserCog,
  Users,
} from 'lucide-react';
import { User } from '@/src/types';
import { clearStoredSession, getStoredToken, getStoredUser } from '@/src/lib/session';
import { cn } from '@/src/lib/utils';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: <ChartColumn className="h-5 w-5" /> },
  { name: 'Providers', path: '/admin/providers', icon: <Building2 className="h-5 w-5" /> },
  { name: 'Requests', path: '/admin/requests', icon: <ClipboardList className="h-5 w-5" /> },
  { name: 'Analytics', path: '/admin/analytics', icon: <Activity className="h-5 w-5" /> },
  { name: 'Users', path: '/admin/users', icon: <Users className="h-5 w-5" /> },
  { name: 'Settings', path: '/admin/settings', icon: <Settings className="h-5 w-5" /> },
  { name: 'Audit Logs', path: '/admin/logs', icon: <UserCog className="h-5 w-5" /> },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const syncUser = () => {
      const token = getStoredToken();
      const storedUser = getStoredUser();

      if (!token || !storedUser || storedUser.role !== 'admin') {
        navigate('/login');
        return;
      }

      setUser(storedUser);
    };

    syncUser();
    window.addEventListener('provider-user-updated', syncUser);

    return () => {
      window.removeEventListener('provider-user-updated', syncUser);
    };
  }, [navigate]);

  const handleLogout = () => {
    clearStoredSession();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="fixed hidden h-full w-72 flex-col bg-slate-950 text-white lg:flex">
        <div className="border-b border-slate-800 p-8">
          <Link to="/admin/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-600 shadow-lg shadow-rose-950/40">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-black tracking-tight">VIGIL Admin</div>
              <div className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">Control Center</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-2 p-6">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all',
                  active
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/40'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                )}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-800 p-6">
          <div className="mb-4 rounded-2xl bg-slate-900 p-4">
            <div className="text-sm font-bold text-white">{user.name}</div>
            <div className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">{user.role}</div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-rose-300 transition-colors hover:bg-rose-500/10 hover:text-rose-200"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      <main className="min-h-screen flex-1 p-6 md:p-8 lg:ml-72 lg:p-10">
        <Outlet context={{ user }} />
      </main>
    </div>
  );
}
