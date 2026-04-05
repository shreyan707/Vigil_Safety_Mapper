import React, { useEffect, useState } from 'react';
import { BarChart, Download, Filter, Map, PieChart, Activity, TrendingUp } from 'lucide-react';
import { AdminAnalyticsData } from '@/src/types';
import { getStoredToken, authHeaders, clearStoredSession } from '@/src/lib/session';
import { useNavigate } from 'react-router-dom';

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('30d');
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
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
      if (dateRange === '7d') start.setDate(start.getDate() - 7);
      else if (dateRange === '30d') start.setDate(start.getDate() - 30);
      else if (dateRange === '90d') start.setDate(start.getDate() - 90);
      else start.setFullYear(start.getFullYear() - 10);
      
      query.set('dateFrom', start.toISOString());
      query.set('dateTo', end.toISOString());

      const res = await fetch(`/api/admin/analytics?${query.toString()}`, { headers: authHeaders(token) });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!data) return;
    const header = ['Location', 'Total Requests', 'Urgent'];
    const rows = data.geographicDistribution.map(loc => [loc.location, loc.total, loc.urgent]);
    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vigil_analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-rose-600"></div>
      </div>
    );
  }

  const issueMax = Math.max(...data.issueTypes.map(i => i.value), 1);
  const totalFunnel = data.statusFunnel.find(f => f.name === 'New')?.value || 1;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Analytics & Reports</h1>
          <p className="text-slate-500 mt-1">Generate insights and visual reports.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm hover:bg-slate-50">
            <Download className="h-4 w-4" /> PDF
          </button>
          <button onClick={handleExportCSV} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm hover:bg-slate-50">
            <Download className="h-4 w-4" /> CSV
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Filter className="h-5 w-5 text-indigo-500" /> Report Builder
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Date Range</label>
            <select 
              className="w-full rounded-xl border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-rose-500 focus:ring-rose-500"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={loadAnalytics} className="w-full rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 shadow-sm">
              Generate Report
            </button>
          </div>
          <div className="md:col-span-2 flex items-center justify-end px-4 text-sm font-bold text-slate-500">
            <div className="text-right">
               <div className="text-slate-900 text-lg">{data.summary.totalRequests}</div>
               <div>Total Requests in Period</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart className="h-5 w-5 text-blue-500" /> Requests by Issue Type
          </h3>
          <div className="h-64 flex items-end gap-2 text-xs font-bold text-slate-500">
            {data.issueTypes.map((issue, idx) => {
              const heightStr = `${(issue.value / issueMax) * 100}%`;
              const colors = ['bg-blue-100', 'bg-emerald-100', 'bg-amber-100', 'bg-purple-100', 'bg-rose-100'];
              return (
                <div key={issue.name} className={`flex-1 ${colors[idx % colors.length]} rounded-t-lg relative group`} style={{ height: heightStr }}>
                  <div className="absolute inset-x-0 bottom-full mb-1 text-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white rounded py-1 z-10 px-1 whitespace-nowrap">
                    {issue.name}: {issue.value}
                  </div>
                  <div className="absolute bottom-2 inset-x-0 text-center truncate px-1 text-[10px] text-slate-700/60 font-black uppercase overflow-hidden">
                    {issue.name.substring(0, 4)}
                  </div>
                </div>
              );
            })}
            {data.issueTypes.length === 0 && <div className="w-full text-center pb-10">No data</div>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-rose-500" /> Trend Analysis (Time Series)
          </h3>
          <div className="h-64 flex items-end gap-1 text-xs font-bold text-slate-500 border-b border-slate-100 pb-2">
            {data.trendAnalysis.length > 0 ? (() => {
               const maxRequests = Math.max(...data.trendAnalysis.map(d => d.requests), 1);
               return data.trendAnalysis.map((d, i) => (
                 <div key={i} className="flex-1 flex flex-col justify-end group items-center">
                    <div className="w-full bg-indigo-100 hover:bg-indigo-200 transition-colors rounded-t-sm" style={{ height: `${(d.requests / maxRequests) * 200}px`, minHeight: '2px' }} title={`${d.name}: ${d.requests} requests`}></div>
                    <div className="text-[8px] mt-1 text-slate-400 rotate-45 transform origin-top-left ml-2 truncate w-8">{d.name.split(' ')[0]}</div>
                 </div>
               ));
            })() : (
              <div className="w-full text-center pb-10">No data</div>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Map className="h-5 w-5 text-emerald-500" /> Geographic Distribution
          </h3>
          <div className="overflow-auto max-h-64">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 sticky top-0">
                <tr>
                  <th className="p-2">Location</th>
                  <th className="p-2">Total Requests</th>
                  <th className="p-2">Urgent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.geographicDistribution.map((loc) => (
                  <tr key={loc.location}>
                    <td className="p-2 truncate max-w-[150px]">{loc.location}</td>
                    <td className="p-2 font-bold">{loc.total}</td>
                    <td className="p-2 text-rose-600 font-bold">{loc.urgent}</td>
                  </tr>
                ))}
                {data.geographicDistribution.length === 0 && (
                  <tr><td colSpan={3} className="text-center py-4">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-amber-500" /> Status Funnel
          </h3>
          <div className="space-y-4 pt-2">
            {data.statusFunnel.map((funnel) => {
               const percentage = totalFunnel > 0 ? (funnel.value / totalFunnel) * 100 : 0;
               return (
                 <div key={funnel.name}>
                   <div className="flex justify-between text-sm mb-1">
                     <span className="font-bold text-slate-700">{funnel.name}</span>
                     <span className="text-slate-500">{percentage.toFixed(1)}% ({funnel.value})</span>
                   </div>
                   <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div className={`h-full ${
                       funnel.name === 'New' ? 'bg-slate-400' :
                       funnel.name === 'Resolved' ? 'bg-emerald-500' :
                       'bg-blue-500'
                     }`} style={{ width: `${percentage}%` }}></div>
                   </div>
                 </div>
               );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
