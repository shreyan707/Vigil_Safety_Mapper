import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { User as UserType } from '@/src/types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { TrendingUp, Clock, Target, CalendarDays, Activity } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const COLORS = ['#e11d48', '#2563eb', '#db2777', '#059669', '#f59e0b', '#8b5cf6'];

const mockLineData = [
  { name: 'Jan', requests: 40 },
  { name: 'Feb', requests: 30 },
  { name: 'Mar', requests: 60 },
  { name: 'Apr', requests: 80 },
  { name: 'May', requests: 50 },
  { name: 'Jun', requests: 90 },
];

const mockPieData = [
  { name: 'Domestic Violence', value: 45 },
  { name: 'Harassment', value: 25 },
  { name: 'Legal Support', value: 15 },
  { name: 'General Safety', value: 10 },
  { name: 'Other', value: 5 },
];

const mockComparisonData = [
  { name: 'Week 1', lastMonth: 20, thisMonth: 30 },
  { name: 'Week 2', lastMonth: 25, thisMonth: 40 },
  { name: 'Week 3', lastMonth: 35, thisMonth: 30 },
  { name: 'Week 4', lastMonth: 15, thisMonth: 45 },
];

export default function ProviderStats() {
  const { user } = useOutletContext<{ user: UserType }>();
  // Use state to simulate loading if we fetch from API later
  const [loading, setLoading] = useState(false);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Performance Analytics</h1>
          <p className="text-slate-500">Track your organization's impact, response times, and request trends.</p>
        </div>
        <div className="flex items-center gap-4">
          <select className="bg-white border border-slate-200 text-sm font-bold text-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-rose-500/20 outline-none shadow-sm cursor-pointer">
            <option>Last 30 Days</option>
            <option>This Quarter</option>
            <option>This Year</option>
          </select>
          <button className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm shadow-slate-200 hover:bg-slate-800 transition-colors flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Avg Resolution Time', value: '2.4 hrs', change: '-15%', icon: <Clock className="w-6 h-6 text-blue-600" />, trend: 'down' },
          { label: 'Resolution Rate', value: '94%', change: '+2%', icon: <Target className="w-6 h-6 text-emerald-600" />, trend: 'up' },
          { label: 'Peak Request Day', value: 'Saturday', change: 'Consistent', icon: <CalendarDays className="w-6 h-6 text-amber-600" />, trend: 'neutral' },
          { label: 'Total Cases Handled', value: '1,245', change: '+18%', icon: <Activity className="w-6 h-6 text-rose-600" />, trend: 'up' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                {stat.icon}
              </div>
              <span className={cn(
                "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                stat.trend === 'up' ? "bg-emerald-100 text-emerald-700" :
                stat.trend === 'down' ? "bg-blue-100 text-blue-700" :
                "bg-slate-100 text-slate-600"
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
              <AreaChart data={mockLineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  data={mockPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {mockPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} 
                  itemStyle={{ color: '#0f172a' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900">{mockPieData.reduce((a, b) => a + b.value, 0)}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {mockPieData.slice(0, 4).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-sm font-bold text-slate-600">{item.name}</span>
                </div>
                <span className="text-sm font-black text-slate-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Monthly Comparison (Week over Week)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }} 
                contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold' }} />
              <Bar dataKey="lastMonth" name="Last Month" fill="#cbd5e1" radius={[6, 6, 0, 0]} barSize={24} />
              <Bar dataKey="thisMonth" name="This Month" fill="#e11d48" radius={[6, 6, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
