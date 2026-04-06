import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Filter, Search, MapPin, Navigation, Info, Phone, ExternalLink, Shield, ChevronLeft, ChevronRight, Home, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
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

const userLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface LocationMarkerProps {
  position: L.LatLng | null;
  onPositionChange: (pos: L.LatLng) => void;
}

function LocationMarker({ position, onPositionChange }: LocationMarkerProps) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 15);
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker position={position} icon={userLocationIcon}>
      <Popup>You are here</Popup>
    </Marker>
  );
}

export default function MapPage() {
  const navigate = useNavigate();
  const [mapServices, setMapServices] = useState<Service[]>([]); // ALL services for markers
  const [sidebarServices, setSidebarServices] = useState<Service[]>([]); // Paginated for sidebar
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const pageSize = 10;

  // Fetch ALL for map markers (only once)
  useEffect(() => {
    fetch('/api/services?all=true')
      .then(res => res.json())
      .then(data => setMapServices(data));
  }, []);

  // Fetch paginated/filtered for sidebar
  const fetchSidebarServices = async (page: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        type: selectedType,
        search: searchQuery
      });
      const res = await fetch(`/api/services?${params.toString()}`);
      const data = await res.json();
      setSidebarServices(data.services || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch sidebar services", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSidebarServices(currentPage);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [currentPage, selectedType, searchQuery]);

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newPos = new L.LatLng(latitude, longitude);
        setUserLocation(newPos);
        setLocationLoading(false);
      },
      (error) => {
        setLocationLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location permission denied. Please allow location access in your browser settings.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out.');
            break;
          default:
            setLocationError('An unknown error occurred.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setCurrentPage(1);
  };

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col z-10 max-h-[40vh] md:max-h-none">
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
              onChange={handleSearchChange}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {['All', 'NGO', 'Police', 'Helpline', 'SafeZone'].map(type => (
              <button
                key={type}
                onClick={() => handleTypeChange(type)}
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
          ) : sidebarServices.length === 0 ? (
            <div className="text-center py-12">
              <Info className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 text-sm">No services found matching your criteria.</p>
            </div>
          ) : (
            <>
              {sidebarServices.map(service => (
                <div 
                  key={service.id}
                  className="p-4 rounded-2xl border border-slate-100 hover:border-rose-200 hover:shadow-lg hover:shadow-rose-50 transition-all group cursor-pointer"
                  onClick={() => {
                    // Logic to zoom to marker can go here if lat/lng exists
                  }}
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
                      onClick={(e) => e.stopPropagation()}
                      className="flex-grow flex items-center justify-center gap-2 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 py-2 rounded-lg text-xs font-bold transition-colors"
                    >
                      <Phone className="w-3 h-3" />
                      Call
                    </a>
                    <Link 
                      to={`/services/${service.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 bg-slate-50 hover:bg-rose-600 text-slate-400 hover:text-white rounded-lg transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}

              {/* Sidebar Pagination */}
              {totalPages > 1 && (
                <div className="pt-4 pb-6 border-t border-slate-100 flex items-center justify-between">
                  <button 
                    className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button 
                    className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
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
          <LocationMarker position={userLocation} onPositionChange={setUserLocation} />
          {mapServices.filter(s => s.lat != null && s.lng != null).map(service => (
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
            title="Home"
            onClick={() => navigate('/')}
          >
            <Home className="w-5 h-5" />
          </button>
          <button 
            className={cn(
              "p-3 shadow-xl rounded-2xl transition-all border border-slate-100",
              locationLoading ? "bg-slate-100 text-slate-400 cursor-wait" : "bg-white text-slate-600 hover:text-rose-600"
            )}
            title="My Location"
            onClick={handleMyLocation}
            disabled={locationLoading}
          >
            {locationLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Navigation className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Location Error Toast */}
        {locationError && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-3 rounded-xl shadow-lg z-20 flex items-center gap-2 max-w-xs">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{locationError}</span>
            <button 
              onClick={() => setLocationError(null)}
              className="ml-2 hover:bg-red-600 rounded p-1"
            >
              <span className="sr-only">Close</span>
              <span>&times;</span>
            </button>
          </div>
        )}
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
