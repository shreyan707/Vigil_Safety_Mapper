import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, MapPin, Phone, Shield, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Service } from '@/src/types';
import { cn } from '@/src/lib/utils';

export default function ServicesPage() {
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
        s.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredServices(filtered);
  }, [searchQuery, selectedType, services]);

  return (
    <div className="pt-32 pb-20 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 mb-2">Service Directory</h1>
            <p className="text-slate-500">Find verified support services across India.</p>
          </div>
          <Link to="/map" className="inline-flex items-center gap-2 text-rose-600 font-bold hover:underline">
            <MapPin className="w-5 h-5" />
            Switch to Map View
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search services, areas, or keywords..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-50 font-medium text-slate-600"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="All">All Service Types</option>
                <option value="NGO">NGOs & Support Groups</option>
                <option value="Police">Police Stations</option>
                <option value="Helpline">Helplines</option>
                <option value="SafeZone">Safe Zones</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex-grow bg-slate-900 text-white font-bold py-3 rounded-2xl hover:bg-slate-800 transition-all">
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-3xl p-8 h-64 animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No results found</h3>
            <p className="text-slate-500">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map(service => (
              <motion.div 
                key={service.id}
                whileHover={{ y: -5 }}
                className="bg-white rounded-[2rem] p-8 shadow-lg shadow-slate-200/50 border border-slate-100 flex flex-col"
              >
                <div className="flex items-start justify-between mb-6">
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
                    <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                      <Shield className="w-4 h-4" fill="currentColor" fillOpacity={0.2} />
                      Verified
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-3 leading-tight">{service.name}</h3>
                <p className="text-slate-500 text-sm mb-6 line-clamp-2 leading-relaxed">
                  {service.description}
                </p>

                <div className="mt-auto space-y-4">
                  <div className="flex items-center gap-3 text-slate-400 text-sm">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="truncate">{service.address}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 text-sm">
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>{service.phone}</span>
                  </div>
                  
                  <div className="pt-6 flex items-center gap-3">
                    <Link 
                      to={`/services/${service.id}`}
                      className="flex-grow bg-slate-50 hover:bg-rose-600 text-slate-600 hover:text-white font-bold py-3 rounded-xl transition-all text-center text-sm"
                    >
                      View Details
                    </Link>
                    <a 
                      href={`tel:${service.phone}`}
                      className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"
                    >
                      <Phone className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination Placeholder */}
        <div className="mt-16 flex items-center justify-center gap-4">
          <button className="p-3 rounded-xl border border-slate-200 text-slate-400 hover:bg-white transition-all disabled:opacity-50" disabled>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-xl bg-rose-600 text-white font-bold text-sm">1</button>
            <button className="w-10 h-10 rounded-xl hover:bg-white text-slate-600 font-bold text-sm">2</button>
            <button className="w-10 h-10 rounded-xl hover:bg-white text-slate-600 font-bold text-sm">3</button>
          </div>
          <button className="p-3 rounded-xl border border-slate-200 text-slate-400 hover:bg-white transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
