import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Globe, 
  Shield, 
  ChevronLeft, 
  ExternalLink, 
  Navigation,
  CheckCircle2,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';
import { Service } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';

export default function ServiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/services/${id}`)
      .then(res => res.json())
      .then(data => {
        setService(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="pt-32 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="pt-32 text-center min-h-screen">
        <h2 className="text-2xl font-bold text-slate-900">Service not found</h2>
        <Link to="/services" className="text-rose-600 font-bold hover:underline mt-4 inline-block">Back to Directory</Link>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 font-bold hover:text-rose-600 transition-colors mb-8"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-slate-100">
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <span className={cn(
                  "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                  service.type === 'NGO' ? "bg-rose-100 text-rose-700" :
                  service.type === 'Police' ? "bg-blue-100 text-blue-700" :
                  service.type === 'Helpline' ? "bg-pink-100 text-pink-700" :
                  "bg-emerald-100 text-emerald-700"
                )}>
                  {service.type}
                </span>
                {service.verified === 1 && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                    <CheckCircle2 className="w-4 h-4" />
                    Verified Provider
                  </div>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">{service.name}</h1>
              <p className="text-lg text-slate-600 leading-relaxed mb-10">
                {service.description}
              </p>

              <div className="grid md:grid-cols-2 gap-8 pt-10 border-t border-slate-100">
                <div>
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Contact Information</h3>
                  <div className="space-y-4">
                    <a href={`tel:${service.phone}`} className="flex items-center gap-4 text-slate-700 hover:text-rose-600 transition-colors group">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-rose-50">
                        <Phone className="w-5 h-5" />
                      </div>
                      <span className="font-bold">{service.phone}</span>
                    </a>
                    <a href={`mailto:${service.email}`} className="flex items-center gap-4 text-slate-700 hover:text-rose-600 transition-colors group">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-rose-50">
                        <Mail className="w-5 h-5" />
                      </div>
                      <span className="font-bold">{service.email}</span>
                    </a>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Operating Details</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-slate-700">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                      </div>
                      <span className="font-bold">{service.hours}</span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-700">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                        <Globe className="w-5 h-5" />
                      </div>
                      <span className="font-bold">{service.languages}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Section */}
            <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 h-96 relative">
              <MapContainer 
                center={[service.lat, service.lng]} 
                zoom={15} 
                style={{ height: '100%', width: '100%' }}
                className="z-0"
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[service.lat, service.lng]} />
              </MapContainer>
              <div className="absolute bottom-6 right-6 z-10">
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${service.lat},${service.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-slate-900 font-bold px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2 hover:bg-slate-50 transition-all border border-slate-100"
                >
                  <Navigation className="w-5 h-5 text-rose-600" />
                  Get Directions
                </a>
              </div>
            </div>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl shadow-slate-200">
              <h3 className="text-xl font-bold mb-4">Need Help?</h3>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                You can request immediate assistance from this provider anonymously.
              </p>
              <Link 
                to={`/request/new?provider=${service.id}`}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 mb-4"
              >
                <MessageSquare className="w-5 h-5" />
                Request Help
              </Link>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase font-black tracking-widest justify-center">
                <Shield className="w-3 h-3" />
                Encrypted & Anonymous
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 text-amber-600 mb-4">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-bold text-sm">Emergency?</span>
              </div>
              <p className="text-slate-500 text-xs mb-6 leading-relaxed">
                If you are in immediate danger, please call the national emergency numbers directly.
              </p>
              <div className="space-y-3">
                <a href="tel:1091" className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-rose-50 transition-colors group">
                  <span className="text-sm font-bold text-slate-700 group-hover:text-rose-600">1091 Helpline</span>
                  <Phone className="w-4 h-4 text-slate-300 group-hover:text-rose-600" />
                </a>
                <a href="tel:100" className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-rose-50 transition-colors group">
                  <span className="text-sm font-bold text-slate-700 group-hover:text-rose-600">100 Police</span>
                  <Phone className="w-4 h-4 text-slate-300 group-hover:text-rose-600" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
