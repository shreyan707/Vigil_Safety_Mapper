import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { AdminLog } from '@/src/types';
import { getStoredToken, authHeaders, clearStoredSession } from '@/src/lib/session';
import { useNavigate } from 'react-router-dom';

export default function AdminLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    loadLogs();
  }, [dateRange]);

  const loadLogs = async () => {
    setLoading(true);
    const token = getStoredToken();
    if (!token) {
      clearStoredSession();
      navigate('/login');
      return;
    }

    try {
      const query = new URLSearchParams();
      const end = new Date();
      let start = new Date();
      if (dateRange === 'today') start.setDate(start.getDate() - 0);
      else if (dateRange === '7d') start.setDate(start.getDate() - 7);
      else if (dateRange === '30d') start.setDate(start.getDate() - 30);
      else start.setFullYear(start.getFullYear() - 10);
      
      query.set('dateFrom', start.toISOString());
      query.set('dateTo', end.toISOString());

      const res = await fetch(`/api/admin/logs?${query.toString()}`, { headers: authHeaders(token) });
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const header = ['Timestamp', 'Actor ID', 'Actor Name', 'Action', 'Entity Type', 'Entity ID', 'Description'];
    const rows = logs.map(log => [
      new Date(log.created_at).toLocaleString(),
      log.actor_user_id || 'System',
      log.actor_name,
      log.action,
      log.entity_type,
      log.entity_id || '',
      log.description || ''
    ]);
    const csv = [header.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vigil_audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Audit Logs</h1>
          <p className="text-slate-500 mt-1">Review system activity and security events.</p>
        </div>
        <button onClick={handleExportCSV} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm hover:bg-slate-50">
          <Download className="h-4 w-4" /> Export Logs
        </button>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Date</label>
          <select 
            className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-rose-500 focus:ring-rose-500"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">User</th>
                <th className="p-4">Action</th>
                <th className="p-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="p-4 text-slate-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{log.actor_name}</div>
                    {log.actor_user_id && <div className="text-xs text-slate-400">ID: {log.actor_user_id}</div>}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold w-fit ${
                      log.action.includes('delete') ? 'bg-rose-100 text-rose-700' :
                      log.action.includes('create') ? 'bg-emerald-100 text-emerald-700' :
                      log.action.includes('update') || log.action.includes('patch') ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-slate-600">{log.description}</div>
                    <div className="text-xs text-slate-400 mt-1 truncate max-w-sm" title={JSON.stringify(log.metadata)}>
                      {log.entity_type} {log.entity_id ? `(${log.entity_id})` : ''}
                    </div>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500">No logs found for this period.</td></tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={4} className="p-8 text-center">
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
