import React, { useEffect, useState } from 'react';
import { Download, Edit, RefreshCw, Trash2 } from 'lucide-react';
import { AdminRequest } from '@/src/types';
import { getStoredToken, authHeaders, clearStoredSession } from '@/src/lib/session';
import { useNavigate } from 'react-router-dom';

export default function AdminRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateRange, setDateRange] = useState('30d');
  
  useEffect(() => {
    loadRequests();
  }, [statusFilter, dateRange]);

  const loadRequests = async () => {
    setLoading(true);
    const token = getStoredToken();
    if (!token) {
      clearStoredSession();
      navigate('/login');
      return;
    }

    try {
      const query = new URLSearchParams();
      if (statusFilter !== 'All') query.set('status', statusFilter);
      
      const end = new Date();
      let start = new Date();
      if (dateRange === 'today') start.setDate(start.getDate() - 0);
      else if (dateRange === 'week') start.setDate(start.getDate() - 7);
      else if (dateRange === 'month') start.setMonth(start.getMonth() - 1);
      else start.setFullYear(start.getFullYear() - 10);
      
      query.set('dateFrom', start.toISOString());
      query.set('dateTo', end.toISOString());

      const res = await fetch(`/api/admin/requests?${query.toString()}`, { headers: authHeaders(token) });
      if (res.status === 401 || res.status === 403) {
        clearStoredSession();
        navigate('/login');
        return;
      }
      
      if (res.ok) {
        const data = await res.json();
        setRequests(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleForceStatus = async (id: string, currentStatus: string) => {
    const newStatus = prompt(`Enter new status (New, In Progress, Resolved) [Current: ${currentStatus}]:`, currentStatus);
    if (!newStatus || !['New', 'In Progress', 'Resolved'].includes(newStatus) || newStatus === currentStatus) return;
    
    const token = getStoredToken();
    const res = await fetch(`/api/admin/requests/${id}`, {
      method: 'PATCH',
      headers: { ...authHeaders(token!), 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    
    if (res.ok) loadRequests();
    else alert('Failed to change status');
  };

  const handleReassign = async (id: string) => {
    const providerId = prompt("Enter new numeric Provider ID (or leave blank for unassigned):");
    if (providerId === null) return; 
    
    const token = getStoredToken();
    const res = await fetch(`/api/admin/requests/${id}`, {
      method: 'PATCH',
      headers: { ...authHeaders(token!), 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider_id: providerId === "" ? "" : providerId })
    });
    
    if (res.ok) loadRequests();
    else alert('Failed to reassign provider');
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete request ${id} permanently?`)) return;
    
    const token = getStoredToken();
    const res = await fetch(`/api/admin/requests/${id}`, {
      method: 'DELETE',
      headers: authHeaders(token!)
    });
    
    if (res.ok) loadRequests();
    else alert('Failed to delete request');
  };

  const handleExportCSV = () => {
    const header = ['ID', 'Date', 'Location', 'Type', 'Urgency', 'Contact', 'Status', 'Provider'];
    const rows = requests.map(r => [
      r.id, 
      new Date(r.created_at).toLocaleString(),
      r.location || 'Unknown',
      r.issue_type || 'Unknown',
      r.urgency || 'Medium',
      r.contact_info || 'None',
      r.status,
      r.providerName || 'Unassigned'
    ]);
    const csv = [header.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vigil_requests_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Manage Requests</h1>
          <p className="text-slate-500 mt-1">View and manage all system requests.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportCSV} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm hover:bg-slate-50">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Status</label>
          <select 
            className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-rose-500 focus:ring-rose-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All</option>
            <option>New</option>
            <option>In Progress</option>
            <option>Resolved</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Date Range</label>
          <select 
            className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-rose-500 focus:ring-rose-500"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="p-4">ID / Date</th>
                <th className="p-4">Location / Type</th>
                <th className="p-4">Status</th>
                <th className="p-4">Provider</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/50">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{req.id}</div>
                    <div className="text-slate-500">{new Date(req.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{req.location || 'Unknown'}</div>
                    <div className="text-slate-500">{req.issue_type}</div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                      req.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                      req.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{req.providerName || 'Unassigned'}</div>
                    {req.providerName && <div className="text-slate-500 text-xs">ID: {req.provider_id}</div>}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleReassign(req.id)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600" title="Reassign">
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleForceStatus(req.id, req.status)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-amber-600" title="Force Status">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(req.id)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No requests found matching your filters.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-b-2 border-rose-600"></div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
