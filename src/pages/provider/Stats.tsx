import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { TrendingUp, Clock, Target, CalendarDays, Activity } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const COLORS = ['#e11d48', '#2563eb', '#db2777', '#059669', '#f59e0b', '#8b5cf6'];

type StatsRange = '30d' | '90d' | '365d';

type ProviderStatsResponse = {
  summary: {
    avgResolutionHours: number | null;
    avgResolutionChange: number | null;
    resolutionRate: number;
    resolutionRateChange: number | null;
    peakRequestDay: string;
    totalCasesHandled: number;
    totalCasesChange: number | null;
  };
  requestsOverTime: { name: string; requests: number }[];
  issueBreakdown: { name: string; value: number }[];
  comparison: { name: string; previous: number; current: number }[];
};

const EMPTY_STATS: ProviderStatsResponse = {
  summary: {
    avgResolutionHours: null,
    avgResolutionChange: null,
    resolutionRate: 0,
    resolutionRateChange: null,
    peakRequestDay: 'No data',
    totalCasesHandled: 0,
    totalCasesChange: null,
  },
  requestsOverTime: [],
  issueBreakdown: [],
  comparison: [],
};

function formatChange(change: number | null, suffix = '%') {
  if (change === null) {
    return 'New';
  }

  const rounded = Number(change.toFixed(1));
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded}${suffix}`;
}

function getTrend(change: number | null) {
  if (change === null || change === 0) {
    return 'neutral';
  }

  return change > 0 ? 'up' : 'down';
}

export default function ProviderStats() {
  const [range, setRange] = useState<StatsRange>('30d');
  const [stats, setStats] = useState<ProviderStatsResponse>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/provider/stats?range=${range}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          throw new Error('Failed to load analytics');
        }

        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
        setStats(EMPTY_STATS);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [range]);

  const exportReport = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Average Resolution Hours', stats.summary.avgResolutionHours?.toString() || 'N/A'],
      ['Resolution Rate', `${stats.summary.resolutionRate}%`],
      ['Peak Request Day', stats.summary.peakRequestDay],
      ['Total Cases Handled', stats.summary.totalCasesHandled.toString()],
      [],
      ['Requests Over Time'],
      ['Label', 'Requests'],
      ...stats.requestsOverTime.map((point) => [point.name, point.requests.toString()]),
      [],
      ['Issue Breakdown'],
      ['Issue Type', 'Count'],
      ...stats.issueBreakdown.map((item) => [item.name, item.value.toString()]),
    ];

    const csvContent = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `provider-analytics-${range}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const issueBreakdownData = stats.issueBreakdown.length > 0
    ? stats.issueBreakdown
    : [{ name: 'No data', value: 1 }];

  const statCards = [
    {
      label: 'Avg Resolution Time',
      value: stats.summary.avgResolutionHours !== null ? `${stats.summary.avgResolutionHours} hrs` : 'N/A',
      change: formatChange(stats.summary.avgResolutionChange),
      icon: <Clock className="w-6 h-6 text-blue-600" />,
      trend: getTrend(stats.summary.avgResolutionChange),
    },
    {
      label: 'Resolution Rate',
      value: `${stats.summary.resolutionRate}%`,
      change: formatChange(stats.summary.resolutionRateChange),
      icon: <Target className="w-6 h-6 text-emerald-600" />,
      trend: getTrend(stats.summary.resolutionRateChange),
    },
    {
      label: 'Peak Request Day',
      value: stats.summary.peakRequestDay,
      change: 'Live',
      icon: <CalendarDays className="w-6 h-6 text-amber-600" />,
      trend: 'neutral',
    },
    {
      label: 'Total Cases Handled',
      value: stats.summary.totalCasesHandled.toString(),
      change: formatChange(stats.summary.totalCasesChange),
      icon: <Activity className="w-6 h-6 text-rose-600" />,
      trend: getTrend(stats.summary.totalCasesChange),
    },
  ];

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
          <h1 className="text-3xl font-black text-slate-900 mb-2">Performance Analytics</h1>
          <p className="text-slate-500">Track your organization's impact, response times, and request trends.</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as StatsRange)}
            className="bg-white border border-slate-200 text-sm font-bold text-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-rose-500/20 outline-none shadow-sm cursor-pointer"
          >
            <option value="30d">Last 30 Days</option>
            <option value="90d">This Quarter</option>
            <option value="365d">This Year</option>
          </select>
          <button
            onClick={exportReport}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm shadow-slate-200 hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                {stat.icon}
              </div>
              <span className={cn(
                'px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest',
                stat.trend === 'up' ? 'bg-emerald-100 text-emerald-700' :
                stat.trend === 'down' ? 'bg-blue-100 text-blue-700' :
                'bg-slate-100 text-slate-600'
              )}>
                {stat.change}
              </span>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 mb-1">{stat.value}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Requests Handled Over Time</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.requestsOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                  itemStyle={{ color: '#0f172a' }}
                />
                <Area type="monotone" dataKey="requests" stroke="#e11d48" strokeWidth={3} fillOpacity={1} fill="url(#colorRequests)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Issue Breakdown</h3>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={issueBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {issueBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                  itemStyle={{ color: '#0f172a' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900">
                {stats.issueBreakdown.reduce((sum, item) => sum + item.value, 0)}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {stats.issueBreakdown.length > 0 ? (
              stats.issueBreakdown.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-sm font-bold text-slate-600">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">{item.value}</span>
                </div>
              ))
            ) : (
              <div className="text-sm font-bold text-slate-500">No requests in this time range yet.</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Current vs Previous Period</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.comparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold' }} />
              <Bar dataKey="previous" name="Previous Period" fill="#cbd5e1" radius={[6, 6, 0, 0]} barSize={24} />
              <Bar dataKey="current" name="Current Period" fill="#e11d48" radius={[6, 6, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
