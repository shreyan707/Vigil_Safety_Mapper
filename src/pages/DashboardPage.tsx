import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Inbox, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  MoreHorizontal,
  ChevronRight,
  LogOut,
  User,
  Settings,
  PieChart as PieChartIcon,
  TrendingUp
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { HelpRequest, User as UserType } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

const COLORS = ['#e11d48', '#2563eb', '#db2777', '#059669'];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserType | null>(null);
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'New' | 'In Progress' | 'Resolved' | 'All'>('All');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    setUser(JSON.parse(userData));

    const fetchData = async () => {
      try {
        const [statsRes, requestsRes] = await Promise.all([
          fetch('/api/provider/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/provider/requests', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        const statsData = await statsRes.json();
        const requestsData = await requestsRes.json();
        
        setStats({
          total: statsData.total?.count || 0,
          pending: statsData.pending?.count || 0,
          resolved: statsData.resolved?.count || 0
        });
        setRequests(requestsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`/api/requests/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      // Refresh data
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredRequests = activeTab === 'All' 
    ? requests 
    : requests.filter(r => r.status === activeTab);

  const chartData = [
    { name: 'Mon', count: 4 },
    { name: 'Tue', count: 7 },
    { name: 'Wed', count: 5 },
    { name: 'Thu', count: 9 },
    { name: 'Fri', count: 12 },
    { name: 'Sat', count: 8 },
    { name: 'Sun', count: 6 },
  ];

  const pieData = [
    { name: 'Domestic Violence', value: 40 },
    { name: 'Harassment', value: 30 },
    { name: 'Legal Support', value: 20 },
    { name: 'Other', value: 10 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600" />
      </div>
    );
  }

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
            {[
              { name: 'Dashboard', icon: <BarChart3 className="w-5 h-5" />, active: true },
              { name: 'Requests', icon: <Inbox className="w-5 h-5" /> },
              { name: 'Analytics', icon: <TrendingUp className="w-5 h-5" /> },
              { name: 'Profile', icon: <User className="w-5 h-5" /> },
              { name: 'Settings', icon: <Settings className="w-5 h-5" /> },
            ].map(item => (
              <button 
                key={item.name}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                  item.active ? "bg-rose-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                {item.icon}
                {item.name}
              </button>
            ))}
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
      <main className="flex-grow lg:ml-64 p-8 md:p-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="text-3xl font-black text-slate-900 mb-2">Welcome back, {user?.name.split(' ')[0]}</h1>
              <p className="text-slate-500">Here is what's happening with your requests today.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-2 text-sm font-bold text-slate-600">
                <Clock className="w-4 h-4 text-rose-500" />
                {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              { label: 'Total Assigned', value: stats.total, icon: <Inbox className="text-blue-600" />, bg: 'bg-blue-50' },
              { label: 'Pending Requests', value: stats.pending, icon: <AlertCircle className="text-rose-600" />, bg: 'bg-rose-50' },
              { label: 'Resolved Cases', value: stats.resolved, icon: <CheckCircle2 className="text-emerald-600" />, bg: 'bg-emerald-50' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center", stat.bg)}>
                  {React.cloneElement(stat.icon as React.ReactElement, { className: 'w-8 h-8' })}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</div>
                  <div className="text-3xl font-black text-slate-900">{stat.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold text-slate-900">Request Volume</h3>
                <select className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border-none focus:ring-0">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="count" fill="#e11d48" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-8">Issue Breakdown</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {pieData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-slate-500">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-900">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Request Inbox */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <h3 className="text-lg font-bold text-slate-900">Request Inbox</h3>
              <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl">
                {['All', 'New', 'In Progress', 'Resolved'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                      activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Request ID</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Issue Type</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Urgency</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="font-mono font-bold text-slate-900">{req.id}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-sm font-bold text-slate-700">{req.issue_type}</div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
                          req.urgency === 'Urgent' ? "bg-rose-100 text-rose-600" :
                          req.urgency === 'High' ? "bg-amber-100 text-amber-600" :
                          "bg-slate-100 text-slate-600"
                        )}>
                          {req.urgency}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            req.status === 'New' ? "bg-blue-500" :
                            req.status === 'In Progress' ? "bg-amber-500" :
                            "bg-emerald-500"
                          )} />
                          <span className="text-sm font-bold text-slate-700">{req.status}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-xs text-slate-400">{new Date(req.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleStatusUpdate(req.id, 'In Progress')}
                            className="p-2 text-slate-400 hover:text-amber-600 transition-colors"
                            title="Mark In Progress"
                          >
                            <Clock className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleStatusUpdate(req.id, 'Resolved')}
                            className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                            title="Mark Resolved"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                          <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredRequests.length === 0 && (
              <div className="p-20 text-center">
                <Inbox className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500 text-sm">No requests found in this category.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
