import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ProviderProfile as ProviderProfileType, User as UserType } from '@/src/types';
import { Save, User, MapPin, Clock, Languages, ShieldCheck, Upload, Briefcase } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }: { position: [number, number], setPosition: (pos: [number, number]) => void }) {
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
}

export default function ProviderProfile() {
  const { user } = useOutletContext<{ user: UserType }>();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<ProviderProfileType>({
    name: user.name || '',
    email: user.email || '',
    phone: '',
    address: 'New Delhi, India',
    lat: 28.6139,
    lng: 77.2090,
    operatingHours: '9 AM - 6 PM',
    languages: 'Hindi, English',
    servicesOffered: {
      domesticViolence: true,
      harassment: true,
      legalAid: false,
        counseling: true,
        medicalEmergency: false
      }
  });
  const [savedProfile, setSavedProfile] = useState<ProviderProfileType>(formData);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setInitialLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/provider/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          throw new Error('Failed to load profile');
        }

        const data = await res.json();
        setFormData(data);
        setSavedProfile(data);
      } catch (err) {
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCheckboxChange = (serviceKey: keyof typeof formData.servicesOffered) => {
    setFormData(prev => ({
      ...prev,
      servicesOffered: {
        ...prev.servicesOffered,
        [serviceKey]: !prev.servicesOffered[serviceKey]
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/provider/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        throw new Error('Failed to save profile');
      }

      const data = await res.json();
      setFormData(data.profile);
      setSavedProfile(data.profile);

      localStorage.setItem('user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('provider-user-updated'));

      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">Provider Profile</h1>
        <p className="text-slate-500">Manage your organization's public details and verified credentials.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-slate-400" /> Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Organization Name</label>
              <input 
                name="name" value={formData.name} onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Contact Email</label>
              <input 
                name="email" type="email" value={formData.email} onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Support Hotline / Phone</label>
              <input 
                name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 "
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Operating Hours</label>
              <input 
                name="operatingHours" value={formData.operatingHours} onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-slate-400" /> Headquarters Location
          </h3>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Full Address</label>
              <textarea 
                name="address" value={formData.address} onChange={handleChange}
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Adjust Map Pin (Click to correct location)</label>
              <div className="h-64 rounded-2xl overflow-hidden border border-slate-200 z-10 relative">
                <MapContainer center={[formData.lat, formData.lng]} zoom={11} className="w-full h-full">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationMarker 
                    position={[formData.lat, formData.lng]} 
                    setPosition={(pos) => setFormData(prev => ({ ...prev, lat: pos[0], lng: pos[1] }))} 
                  />
                </MapContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-slate-400" /> Services Provided
            </h3>

            <div className="space-y-3">
              {[
                { key: 'domesticViolence', label: 'Domestic Violence Support' },
                { key: 'harassment', label: 'Harassment Helpline' },
                { key: 'legalAid', label: 'Legal Aid & Advice' },
                { key: 'counseling', label: 'Mental Health Counseling' },
                { key: 'medicalEmergency', label: 'Medical Emergency Transport' },
              ].map(service => (
                <label key={service.key} className="flex items-center gap-3 cursor-pointer group">
                  <div className={cn(
                    "w-5 h-5 rounded flex items-center justify-center transition-colors border",
                    formData.servicesOffered[service.key as keyof typeof formData.servicesOffered] 
                      ? "bg-rose-500 border-rose-500 text-white" 
                      : "bg-slate-50 border-slate-300 group-hover:border-rose-400"
                  )}>
                    {formData.servicesOffered[service.key as keyof typeof formData.servicesOffered] && <ShieldCheck className="w-3 h-3" />}
                  </div>
                  <span className="text-sm font-bold text-slate-700 select-none">{service.label}</span>
                </label>
              ))}
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-100">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest block flex items-center gap-2">
                <Languages className="w-4 h-4" /> Languages Supported
              </label>
              <input 
                name="languages" value={formData.languages} onChange={handleChange} placeholder="e.g. Hindi, English, Regional"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-6 flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-slate-400" /> Verification Documents
            </h3>
            
            <p className="text-xs text-slate-500">
              Upload your official NGO registration, legal licenses, or police department affiliation documents to maintain verified status.
            </p>

            <div className="border-2 border-dashed border-slate-200 rounded-2xl flex-grow flex flex-col items-center justify-center p-8 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
              <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5 text-slate-400 group-hover:text-rose-600 transition-colors" />
              </div>
              <div className="text-sm font-bold text-slate-700 mb-1">Click to upload files</div>
              <div className="text-xs text-slate-400">PDF, JPG, or PNG (Max. 10MB)</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => setFormData(savedProfile)}
            className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-slate-900 text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {success ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
