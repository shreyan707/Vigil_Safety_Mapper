import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Save, ShieldCheck, UserCog } from 'lucide-react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AdminProvider, AdminReferenceData, AdminUser, User } from '@/src/types';
import { authHeaders, clearStoredSession, getStoredToken } from '@/src/lib/session';
import { cn } from '@/src/lib/utils';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

type ProviderFormState = {
  name: string;
  type: string;
  description: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  email: string;
  hours: string;
  languages: string;
  verified: boolean;
  provider_id: string;
  servicesOffered: {
    domesticViolence: boolean;
    harassment: boolean;
    legalAid: boolean;
    counseling: boolean;
    medicalEmergency: boolean;
  };
};

const DEFAULT_FORM: ProviderFormState = {
  name: '',
  type: 'NGO',
  description: '',
  address: '',
  lat: 20.5937,
  lng: 78.9629,
  phone: '',
  email: '',
  hours: '',
  languages: '',
  verified: false,
  provider_id: '',
  servicesOffered: {
    domesticViolence: true,
    harassment: true,
    legalAid: false,
    counseling: false,
    medicalEmergency: false,
  },
};

function LocationPicker({ position, onChange }: { position: [number, number]; onChange: (next: [number, number]) => void }) {
  useMapEvents({
    click(event) {
      onChange([event.latlng.lat, event.latlng.lng]);
    },
  });

  return <Marker position={position} />;
}

export default function AdminProviderForm() {
  const { user } = useOutletContext<{ user: User }>();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [form, setForm] = useState<ProviderFormState>(DEFAULT_FORM);
  const [referenceData, setReferenceData] = useState<AdminReferenceData | null>(null);
  const [providerUsers, setProviderUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const token = getStoredToken();
      if (!token) {
        clearStoredSession();
        navigate('/login');
        return;
      }

      try {
        const [referenceRes, usersRes, providerRes] = await Promise.all([
          fetch('/api/admin/reference-data', { headers: authHeaders(token) }),
          fetch('/api/admin/users?role=provider', { headers: authHeaders(token) }),
          isEditing ? fetch(`/api/admin/providers/${id}`, { headers: authHeaders(token) }) : Promise.resolve(null),
        ]);

        if (referenceRes.status === 401 || usersRes.status === 401 || providerRes?.status === 401) {
          clearStoredSession();
          navigate('/login');
          return;
        }

        const referencePayload = await referenceRes.json();
        const userPayload = await usersRes.json();
        setReferenceData(referencePayload);
        setProviderUsers(userPayload);

        if (providerRes) {
          const provider = await providerRes.json() as AdminProvider;
          setForm({
            name: provider.name || '',
            type: provider.type || 'NGO',
            description: provider.description || '',
            address: provider.address || '',
            lat: Number(provider.lat ?? 20.5937),
            lng: Number(provider.lng ?? 78.9629),
            phone: provider.phone || '',
            email: provider.email || '',
            hours: provider.hours || '',
            languages: provider.languages || '',
            verified: provider.verified === 1,
            provider_id: provider.provider_id ? String(provider.provider_id) : '',
            servicesOffered: {
              domesticViolence: provider.service_tags?.includes('domesticViolence') ?? false,
              harassment: provider.service_tags?.includes('harassment') ?? false,
              legalAid: provider.service_tags?.includes('legalAid') ?? false,
              counseling: provider.service_tags?.includes('counseling') ?? false,
              medicalEmergency: provider.service_tags?.includes('medicalEmergency') ?? false,
            },
          });
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, isEditing, navigate]);

  const linkedProviderName = useMemo(() => {
    const assigned = providerUsers.find((providerUser) => String(providerUser.id) === form.provider_id);
    return assigned?.name || 'Unassigned';
  }, [form.provider_id, providerUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getStoredToken();
    setSaving(true);

    try {
      await fetch(isEditing ? `/api/admin/providers/${id}` : '/api/admin/providers', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(token),
        },
        body: JSON.stringify({
          ...form,
          provider_id: form.provider_id || null,
        }),
      });

      navigate('/admin/providers');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-rose-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Link to="/admin/providers" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-rose-600 hover:text-rose-700">
            <ArrowLeft className="h-4 w-4" />
            Back to providers
          </Link>
          <h1 className="text-4xl font-black text-slate-900">{isEditing ? 'Edit Provider' : 'Add New Provider'}</h1>
          <p className="mt-3 max-w-2xl text-slate-500">
            Manage the provider record, service location, verification status, and linked staff account.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-sm">
          Signed in as {user.name}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr),380px]">
          <div className="space-y-8">
            <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-black text-slate-900">Service Provider Details</h2>
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-700 outline-none focus:border-rose-500 focus:bg-white" placeholder="Organization name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
                <select className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-700 outline-none focus:border-rose-500 focus:bg-white" value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}>
                  {(referenceData?.serviceTypes || ['NGO', 'Police', 'Helpline', 'SafeZone']).map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-700 outline-none focus:border-rose-500 focus:bg-white" placeholder="Public phone" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} />
                <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-700 outline-none focus:border-rose-500 focus:bg-white" placeholder="Public email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} />
                <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-700 outline-none focus:border-rose-500 focus:bg-white" placeholder="Operating hours" value={form.hours} onChange={(e) => setForm((prev) => ({ ...prev, hours: e.target.value }))} />
                <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-700 outline-none focus:border-rose-500 focus:bg-white" placeholder="Languages supported" value={form.languages} onChange={(e) => setForm((prev) => ({ ...prev, languages: e.target.value }))} />
              </div>
              <textarea className="mt-5 min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-700 outline-none focus:border-rose-500 focus:bg-white" placeholder="Provider description" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
              <textarea className="mt-5 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-700 outline-none focus:border-rose-500 focus:bg-white" placeholder="Full address" value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} />
            </div>

            <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-rose-600" />
                <h2 className="text-xl font-black text-slate-900">Map Picker</h2>
              </div>
              <p className="mt-3 text-sm text-slate-500">Click the map to place the provider’s exact latitude and longitude.</p>
              <div className="mt-6 h-80 overflow-hidden rounded-[2rem] border border-slate-200">
                <MapContainer center={[form.lat, form.lng]} zoom={6} className="h-full w-full z-0">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationPicker
                    position={[form.lat, form.lng]}
                    onChange={([lat, lng]) => setForm((prev) => ({ ...prev, lat, lng }))}
                  />
                </MapContainer>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-700 outline-none focus:border-rose-500 focus:bg-white" value={form.lat} onChange={(e) => setForm((prev) => ({ ...prev, lat: Number(e.target.value) }))} />
                <input className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-700 outline-none focus:border-rose-500 focus:bg-white" value={form.lng} onChange={(e) => setForm((prev) => ({ ...prev, lng: Number(e.target.value) }))} />
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h2 className="text-xl font-black text-slate-900">Verification Status</h2>
              </div>
              <label className="mt-6 flex cursor-pointer items-center justify-between rounded-2xl bg-slate-50 px-5 py-4">
                <div>
                  <div className="text-sm font-bold text-slate-800">Mark this provider as verified</div>
                  <div className="mt-1 text-xs text-slate-500">Visible on dashboards and eligible for verified-only auto-assignment.</div>
                </div>
                <input type="checkbox" checked={form.verified} onChange={(e) => setForm((prev) => ({ ...prev, verified: e.target.checked }))} className="h-5 w-5 accent-rose-600" />
              </label>
            </div>

            <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <UserCog className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-black text-slate-900">Assign Staff Account</h2>
              </div>
              <select className="mt-6 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-700 outline-none focus:border-rose-500 focus:bg-white" value={form.provider_id} onChange={(e) => setForm((prev) => ({ ...prev, provider_id: e.target.value }))}>
                <option value="">Unassigned</option>
                {providerUsers.map((providerUser) => (
                  <option key={providerUser.id} value={providerUser.id}>
                    {providerUser.name} · {providerUser.email}
                  </option>
                ))}
              </select>
              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                Linked account: <span className="font-bold text-slate-800">{linkedProviderName}</span>
              </div>
            </div>

            <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-black text-slate-900">Service Tags</h2>
              <div className="mt-5 space-y-3">
                {[
                  ['domesticViolence', 'Domestic Violence'],
                  ['harassment', 'Harassment'],
                  ['legalAid', 'Legal Aid'],
                  ['counseling', 'Counseling'],
                  ['medicalEmergency', 'Medical Emergency'],
                ].map(([key, label]) => (
                  <label key={key} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                    <div className={cn('flex h-5 w-5 items-center justify-center rounded border', form.servicesOffered[key as keyof ProviderFormState['servicesOffered']] ? 'border-rose-600 bg-rose-600 text-white' : 'border-slate-300 bg-white')}>
                      {form.servicesOffered[key as keyof ProviderFormState['servicesOffered']] ? '✓' : ''}
                    </div>
                    <input
                      type="checkbox"
                      checked={form.servicesOffered[key as keyof ProviderFormState['servicesOffered']]}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          servicesOffered: {
                            ...prev.servicesOffered,
                            [key]: e.target.checked,
                          },
                        }))
                      }
                      className="hidden"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Link to="/admin/providers" className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
            Cancel
          </Link>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:opacity-50">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : isEditing ? 'Save Provider' : 'Create Provider'}
          </button>
        </div>
      </form>
    </div>
  );
}
