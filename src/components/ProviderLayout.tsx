import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import { 
  BarChart3, 
  Inbox, 
  User, 
  PieChart as PieChartIcon,
  Settings,
  LogOut,
  TrendingUp
} from 'lucide-react';
import { User as UserType } from '@/src/types';
import { cn } from '@/src/lib/utils';

export default function ProviderLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    setUser(JSON.parse(userData));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/provider/dashboard', icon: <BarChart3 className="w-5 h-5" /> },
    { name: 'Requests', path: '/provider/requests', icon: <Inbox className="w-5 h-5" /> },
    { name: 'Stats', path: '/provider/stats', icon: <TrendingUp className="w-5 h-5" /> },
    { name: 'Profile', path: '/provider/profile', icon: <User className="w-5 h-5" /> },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden lg:flex flex-col fixed h-full z-20">
        <div className="p-8">
          <div className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-black tracking-tight">VIGIL</span>
          </div>

          <nav className="space-y-2">
            {navItems.map(item => {
              const active = location.pathname === item.path || 
                             (item.path === '/provider/requests' && location.pathname.startsWith('/provider/requests'));
              return (
                <Link 
                  key={item.name}
                  to={item.path}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                    active ? "bg-rose-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  {item.icon}
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-slate-400" />
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-bold truncate">{user?.name}</div>
              <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{user?.role}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-rose-400 hover:bg-rose-400/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow lg:ml-64 p-8 md:p-12 overflow-x-hidden">
        <Outlet context={{ user }} />
      </main>
    </div>
  );
}
