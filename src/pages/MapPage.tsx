import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Filter, Search, MapPin, Navigation, Info, Phone, ExternalLink, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Service } from '@/src/types';
import { cn } from '@/src/lib/utils';

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const SERVICE_COLORS: Record<string, string> = {
  NGO: '#e11d48', // rose-600
  Police: '#2563eb', // blue-600
  Helpline: '#db2777', // pink-600
  SafeZone: '#059669', // emerald-600
};

function LocationMarker() {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const map = useMap();

  useEffect(() => {
    map.locate().on("locationfound", function (e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    });
  }, [map]);

  return position === null ? null : (
    <Marker position={position}>
      <Popup>You are here</Popup>
    </Marker>
  );
}

export default function MapPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => {
        setServices(data);
        setFilteredServices(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let filtered = services;
    if (selectedType !== 'All') {
      filtered = filtered.filter(s => s.type === selectedType);
    }
    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredServices(filtered);
  }, [searchQuery, selectedType, services]);

  return (
    <div className="h-screen pt-16 flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col z-10">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5 text-rose-600" />
            Find Services
          </h2>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by name or area..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {['All', 'NGO', 'Police', 'Helpline', 'SafeZone'].map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  selectedType === type 
                    ? "bg-rose-600 text-white shadow-md shadow-rose-100" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600" />
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <Info className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 text-sm">No services found matching your criteria.</p>
            </div>
          ) : (
            filteredServices.map(service => (
              <div 
                key={service.id}
                className="p-4 rounded-2xl border border-slate-100 hover:border-rose-200 hover:shadow-lg hover:shadow-rose-50 transition-all group cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                    service.type === 'NGO' ? "bg-rose-100 text-rose-700" :
                    service.type === 'Police' ? "bg-blue-100 text-blue-700" :
                    service.type === 'Helpline' ? "bg-pink-100 text-pink-700" :
                    "bg-emerald-100 text-emerald-700"
                  )}>
                    {service.type}
                  </span>
                  {service.verified === 1 && (
                    <Shield className="w-4 h-4 text-emerald-500" fill="currentColor" fillOpacity={0.2} />
                  )}
                </div>
                <h3 className="font-bold text-slate-900 mb-1 group-hover:text-rose-600 transition-colors">{service.name}</h3>
                <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {service.address}
                </p>
                <div className="flex items-center gap-2">
                  <a 
                    href={`tel:${service.phone}`}
                    className="flex-grow flex items-center justify-center gap-2 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 py-2 rounded-lg text-xs font-bold transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                    Call
                  </a>
                  <Link 
                    to={`/services/${service.id}`}
                    className="p-2 bg-slate-50 hover:bg-rose-600 text-slate-400 hover:text-white rounded-lg transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Map Container */}
      <div className="flex-grow relative">
        <MapContainer 
          center={[28.6139, 77.2090]} 
          zoom={12} 
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker />
          {filteredServices.map(service => (
            <Marker 
              key={service.id} 
              position={[service.lat, service.lng]}
              icon={new L.Icon({
                iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${
                  service.type === 'NGO' ? 'red' : 
                  service.type === 'Police' ? 'blue' : 
                  service.type === 'Helpline' ? 'violet' : 'green'
                }.png`,
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
              })}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-bold text-slate-900 mb-1">{service.name}</h3>
                  <p className="text-xs text-slate-500 mb-2">{service.address}</p>
                  <Link 
                    to={`/services/${service.id}`}
                    className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1"
                  >
                    View Details <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
          <button 
            className="p-3 bg-white shadow-xl rounded-2xl text-slate-600 hover:text-rose-600 transition-all border border-slate-100"
            title="My Location"
            onClick={() => {
              // Location logic is handled by LocationMarker component
            }}
          >
            <Navigation className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}
