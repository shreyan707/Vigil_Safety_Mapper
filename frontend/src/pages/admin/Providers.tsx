import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, FileUp, MapPin, Plus, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { AdminProvider } from '@/src/types';
import { authHeaders, clearStoredSession, getStoredToken } from '@/src/lib/session';

function parseCsv(text: string) {
  const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);
  if (!headerLine) {
    return [];
  }

  const headers = headerLine.split(',').map((item) => item.trim());
  return lines.map((line) => {
    const columns = line.split(',').map((item) => item.trim());
    return headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = columns[index] || '';
      return acc;
    }, {});
  });
}

export default function AdminProviders() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [providers, setProviders] = useState<AdminProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'All',
    verified: 'All',
    location: '',
  });
  const [importing, setImporting] = useState(false);

  const loadProviders = async () => {
    const token = getStoredToken();
    if (!token) {
      clearStoredSession();
      navigate('/login');
      return;
    }

    setLoading(true);
    const params = new URLSearchParams();
    if (filters.type !== 'All') params.set('type', filters.type);
    if (filters.verified !== 'All') params.set('verified', filters.verified);
    if (filters.location.trim()) params.set('location', filters.location.trim());

    try {
      const res = await fetch(`/api/admin/providers?${params.toString()}`, {
        headers: authHeaders(token),
      });
      if (res.status === 401 || res.status === 403) {
        clearStoredSession();
        navigate('/login');
        return;
      }
      setProviders(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, [filters.type, filters.verified, filters.location]);

  const stats = useMemo(() => ({
    total: providers.length,
    verified: providers.filter((provider) => provider.verified === 1).length,
    pending: providers.filter((provider) => provider.verified !== 1).length,
  }), [providers]);

  const handleDelete = async (provider: AdminProvider) => {
    if (!window.confirm(`Delete ${provider.name}? This cannot be undone.`)) {
      return;
    }

    const token = getStoredToken();
    await fetch(`/api/admin/providers/${provider.id}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });
    await loadProviders();
  };

  const handleVerificationToggle = async (provider: AdminProvider) => {
    const token = getStoredToken();
    await fetch(`/api/admin/providers/${provider.id}/verification`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(token),
      },
      body: JSON.stringify({ verified: provider.verified !== 1 }),
    });
    await loadProviders();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const token = getStoredToken();
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length === 0) {
      return;
    }

    setImporting(true);
    try {
      await fetch('/api/admin/providers/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(token),
        },
        body: JSON.stringify({ rows }),
      });
      await loadProviders();
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-rose-600 shadow-sm">
            <Building2 className="h-4 w-4" />
            Provider Directory
          </div>
          <h1 className="text-4xl font-black text-slate-900">Manage Providers</h1>
          <p className="mt-3 max-w-2xl text-slate-500">
            Search, verify, edit, remove, and bulk-import service providers across the network.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <FileUp className="h-4 w-4" />
            {importing ? 'Importing...' : 'Bulk Import CSV'}
          </button>
          <Link
            to="/admin/providers/new"
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Add New Provider
          </Link>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleImportFile}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="text-3xl font-black text-slate-900">{stats.total}</div>
          <div className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Visible Providers</div>
        </div>
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="text-3xl font-black text-emerald-600">{stats.verified}</div>
          <div className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Verified</div>
        </div>
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <div className="text-3xl font-black text-amber-600">{stats.pending}</div>
          <div className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Pending Review</div>
        </div>
      </div>

      <section className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={filters.location}
              onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="Filter by city or address"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm font-bold text-slate-700 focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>
          <select
            value={filters.type}
            onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          >
            <option value="All">All Types</option>
            <option value="NGO">NGO</option>
            <option value="Police">Police</option>
            <option value="Helpline">Helpline</option>
            <option value="SafeZone">Safe Zone</option>
          </select>
          <select
            value={filters.verified}
            onChange={(e) => setFilters((prev) => ({ ...prev, verified: e.target.value }))}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 focus:border-rose-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          >
            <option value="All">All Verification States</option>
            <option value="Verified">Verified</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Provider</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Type</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Location</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Assigned Staff</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Verification</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {providers.map((provider) => (
                <tr key={provider.id} className="align-top">
                  <td className="px-6 py-5">
                    <div className="font-bold text-slate-900">{provider.name}</div>
                    <div className="mt-1 text-sm text-slate-500">{provider.email}</div>
                    <div className="mt-2 text-xs text-slate-400">{provider.phone}</div>
                  </td>
                  <td className="px-6 py-5 text-sm font-bold text-slate-600">{provider.type}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-start gap-2 text-sm text-slate-500">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                      <span>{provider.address}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm font-bold text-slate-700">{provider.providerName || 'Unassigned'}</div>
                    <div className="mt-1 text-xs text-slate-400">{provider.providerEmail || 'No linked account'}</div>
                  </td>
                  <td className="px-6 py-5">
                    <button
                      onClick={() => handleVerificationToggle(provider)}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black uppercase tracking-[0.18em] ${
                        provider.verified === 1
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      <ShieldCheck className="h-4 w-4" />
                      {provider.verified === 1 ? 'Verified' : 'Pending'}
                    </button>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/admin/providers/${provider.id}/edit`}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-800"
                      >
                        Edit
                      </Link>
                      <Link
                        to={`/admin/providers/${provider.id}/edit`}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        View Details
                      </Link>
                      <button
                        onClick={() => handleDelete(provider)}
                        className="rounded-xl border border-rose-200 px-3 py-2 text-rose-600 transition-colors hover:bg-rose-50"
                        title="Delete provider"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && providers.length === 0 && (
            <div className="p-10 text-center text-sm font-bold text-slate-500">No providers match the current filters.</div>
          )}
        </div>
      </section>
    </div>
  );
}
