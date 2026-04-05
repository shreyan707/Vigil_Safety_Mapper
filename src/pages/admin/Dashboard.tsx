import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Activity, AlertTriangle, Building2, CalendarDays, ClipboardList, TrendingUp } from 'lucide-react';
import { CircleMarker, MapContainer, TileLayer, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { AdminDashboardData, User } from '@/src/types';
import { authHeaders, clearStoredSession, getStoredToken } from '@/src/lib/session';

const EMPTY_DASHBOARD: AdminDashboardData = {
  totals: { today: 0, week: 0, month: 0 },
  activeProviders: 0,
  pendingVerifications: 0,
  heatmap: [],
  recentActivity: [],
  quickLinks: [],
};

export default function AdminDashboard() {
  const { user } = useOutletContext<{ user: User }>();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<AdminDashboardData>(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      const token = getStoredToken();
      if (!token) {
        clearStoredSession();
        navigate('/login');
        return;
      }

      try {
        const res = await fetch('/api/admin/dashboard', { headers: authHeaders(token) });
        if (res.status === 401 || res.status === 403) {
          clearStoredSession();
          navigate('/login');
          return;
        }
        const data = await res.json();
        setDashboard(data);
      } catch (_error) {
        setDashboard(EMPTY_DASHBOARD);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-rose-600" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Requests Today',
      value: dashboard.totals.today,
      meta: `Week: ${dashboard.totals.week}`,
      icon: <ClipboardList className="h-6 w-6 text-blue-600" />,
      tone: 'bg-blue-50',
    },
    {
      label: 'Requests This Month',
      value: dashboard.totals.month,
      meta: 'System-wide volume',
      icon: <TrendingUp className="h-6 w-6 text-rose-600" />,
      tone: 'bg-rose-50',
    },
    {
      label: 'Active Providers',
      value: dashboard.activeProviders,
      meta: 'Currently active accounts',
      icon: <Building2 className="h-6 w-6 text-emerald-600" />,
      tone: 'bg-emerald-50',
    },
    {
      label: 'Pending Verifications',
      value: dashboard.pendingVerifications,
      meta: dashboard.pendingVerifications > 0 ? 'Needs admin review' : 'All caught up',
      icon: <AlertTriangle className="h-6 w-6 text-amber-600" />,
      tone: 'bg-amber-50',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-rose-600 shadow-sm">
            <Activity className="h-4 w-4" />
            System Overview
          </div>
          <h1 className="text-4xl font-black text-slate-900">Welcome back, {user.name.split(' ')[0]}</h1>
          <p className="mt-3 max-w-2xl text-slate-500">
            Monitor incoming requests, provider readiness, and high-priority activity across the platform.
          </p>
        </div>
        <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-sm">
          <CalendarDays className="h-5 w-5 text-rose-500" />
          {new Date().toLocaleString()}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${card.tone}`}>
                {card.icon}
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900">{card.value}</div>
            <div className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">{card.label}</div>
            <div className="mt-4 text-sm text-slate-500">{card.meta}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr),minmax(340px,1fr)]">
        <section className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-8">
            <h2 className="text-xl font-black text-slate-900">Request Heatmap</h2>
            <p className="mt-2 text-sm text-slate-500">Recent request clusters by location and urgency.</p>
          </div>
          <div className="h-[420px]">
            <MapContainer center={[20.5937, 78.9629]} zoom={5} className="h-full w-full z-0">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              {dashboard.heatmap.map((point) => (
                <CircleMarker
                  key={point.id}
                  center={[point.lat, point.lng]}
                  radius={10 + point.intensity * 10}
                  pathOptions={{
                    color: point.intensity >= 0.8 ? '#e11d48' : '#f59e0b',
                    fillColor: point.intensity >= 0.8 ? '#fb7185' : '#fbbf24',
                    fillOpacity: 0.45,
                  }}
                >
                  <Tooltip>
                    <div className="text-xs font-bold text-slate-700">{point.issueType || 'Request'}</div>
                  </Tooltip>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </section>

        <div className="space-y-8">
          <section className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-black text-slate-900">Quick Links</h2>
            <div className="mt-6 space-y-3">
              {dashboard.quickLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-5 py-4 text-left text-sm font-bold text-slate-700 transition-colors hover:bg-rose-50 hover:text-rose-700"
                >
                  {link.label}
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Open</span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Recent Activity</h2>
                <p className="mt-2 text-sm text-slate-500">Latest system and admin actions.</p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {dashboard.recentActivity.map((activity) => (
                <div key={activity.id} className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    {activity.actorName} · {new Date(activity.created_at).toLocaleString()}
                  </div>
                  <div className="mt-2 text-sm font-bold text-slate-800">{activity.description || activity.action}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {activity.entityType}
                    {activity.entityId ? ` · ${activity.entityId}` : ''}
                  </div>
                </div>
              ))}
              {dashboard.recentActivity.length === 0 && (
                <div className="rounded-2xl bg-slate-50 p-5 text-sm font-bold text-slate-500">
                  No activity recorded yet.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
