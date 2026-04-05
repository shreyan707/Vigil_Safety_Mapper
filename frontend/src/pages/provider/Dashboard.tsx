import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Clock, Inbox, AlertCircle, CheckCircle2, ChevronRight, User } from 'lucide-react';
import { HelpRequest, User as UserType } from '@/src/types';
import { cn } from '@/src/lib/utils';

export default function ProviderDashboard() {
  const { user } = useOutletContext<{ user: UserType }>();
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
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
        setRequests(requestsData.slice(0, 5)); // Just take top 5 recent for dashboard preview
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Welcome back, {user?.name.split(' ')[0]}</h1>
          <p className="text-slate-500">Here is your operational overview for today.</p>
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
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-blue-50">
            <Inbox className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Total Assigned</div>
            <div className="text-3xl font-black text-slate-900">{stats.total}</div>
          </div>
        </div>

        <div className="bg-rose-600 p-8 rounded-[2rem] shadow-lg shadow-rose-200 flex items-center gap-6 text-white relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-10 rounded-full" />
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/20 backdrop-blur-md">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-rose-100 uppercase tracking-widest mb-1">Pending Action</div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black">{stats.pending}</span>
              {stats.pending > 0 && (
                <span className="px-2 py-1 bg-white text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-md">
                  Action Req
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-emerald-50">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Resolved (Monthly)</div>
            <div className="text-3xl font-black text-slate-900">{stats.resolved}</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Requests Preview Grid */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Recent Requests</h3>
            <Link to="/provider/requests" className="text-sm font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="divide-y divide-slate-100 flex-grow">
            {requests.map(req => (
              <div key={req.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    req.status === 'New' ? "bg-rose-500" :
                    req.status === 'In Progress' ? "bg-amber-500" :
                    "bg-emerald-500"
                  )} />
                  <div>
                    <div className="font-bold text-slate-900 mb-1">{req.issue_type}</div>
                    <div className="text-xs text-slate-500 font-mono">ID: {req.id} • {new Date(req.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest",
                    req.urgency === 'Urgent' ? "bg-rose-100 text-rose-600" :
                    req.urgency === 'High' ? "bg-amber-100 text-amber-600" :
                    "bg-slate-100 text-slate-600"
                  )}>
                    {req.urgency}
                  </span>
                  <Link to={`/provider/requests/${req.id}`} className="opacity-0 group-hover:opacity-100 text-white bg-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:bg-rose-600">
                    Review
                  </Link>
                </div>
              </div>
            ))}
            {requests.length === 0 && (
              <div className="p-12 text-center text-slate-500 text-sm">No recent requests found</div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
            <h3 className="text-lg font-bold mb-6">Quick Actions</h3>
            <div className="space-y-3">
              <Link to="/provider/requests" className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                <div className="flex items-center gap-3 font-bold text-sm">
                  <Inbox className="w-5 h-5 text-rose-400" /> Browse Inbox
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link to="/provider/profile" className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                <div className="flex items-center gap-3 font-bold text-sm">
                  <User className="w-5 h-5 text-blue-400" /> Manage Profile
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
