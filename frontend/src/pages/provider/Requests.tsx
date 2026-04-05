import React, { useState, useEffect } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { Inbox, Clock, CheckCircle2, MoreHorizontal, Filter, Search } from 'lucide-react';
import { HelpRequest, User as UserType } from '@/src/types';
import { cn } from '@/src/lib/utils';

export default function ProviderRequests() {
  const { user } = useOutletContext<{ user: UserType }>();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'All' | 'New' | 'In Progress' | 'Resolved'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('/api/provider/requests', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setRequests(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus as any } : r));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredRequests = requests.filter(r => {
    const matchesTab = activeTab === 'All' || r.status === activeTab;
    const matchesSearch = r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.issue_type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const exportCSV = () => {
    const headers = ['ID', 'Issue Type', 'Urgency', 'Status', 'Date', 'Location'];
    const csvContent = [
      headers.join(','),
      ...filteredRequests.map(r => [
        r.id, 
        `"${r.issue_type}"`, 
        r.urgency, 
        r.status, 
        new Date(r.created_at).toLocaleDateString(),
        `"${r.location}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'requests_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Request Inbox</h1>
          <p className="text-slate-500">Manage, sort, and update incoming help requests.</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={exportCSV} className="bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-sm shadow-slate-200 hover:bg-slate-800 transition-colors">
            Export to CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl overflow-x-auto w-full md:w-auto">
            {['All', 'New', 'In Progress', 'Resolved'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "px-4 md:px-6 py-2 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap",
                  activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search ID or type..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
              />
            </div>
            <button className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Request ID</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Issue Type & Date</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Urgency</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.map(req => (
                <tr 
                  key={req.id} 
                  onClick={() => navigate(`/provider/requests/${req.id}`)}
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                >
                  <td className="px-8 py-6">
                    <div className="font-mono font-bold text-slate-900 group-hover:text-rose-600 transition-colors">{req.id}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-sm font-bold text-slate-700">{req.issue_type}</div>
                    <div className="text-xs text-slate-400">{new Date(req.created_at).toLocaleDateString()}</div>
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
                    <div className="text-xs font-bold text-slate-500 max-w-[150px] truncate" title={req.location}>
                      {req.location}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full shadow-sm",
                        req.status === 'New' ? "bg-rose-500 shadow-rose-200" :
                        req.status === 'In Progress' ? "bg-amber-500 shadow-amber-200" :
                        "bg-emerald-500 shadow-emerald-200"
                      )} />
                      <span className="text-sm font-bold text-slate-700">{req.status}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {req.status !== 'In Progress' && (
                        <button 
                          onClick={(e) => handleStatusUpdate(req.id, 'In Progress', e)}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Mark In Progress"
                        >
                          <Clock className="w-5 h-5" />
                        </button>
                      )}
                      {req.status !== 'Resolved' && (
                        <button 
                          onClick={(e) => handleStatusUpdate(req.id, 'Resolved', e)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Mark Resolved"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                      )}
                      
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredRequests.length === 0 && (
            <div className="p-20 text-center">
              <Inbox className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 text-sm font-bold">No requests found matching your filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
