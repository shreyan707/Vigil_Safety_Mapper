import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Phone, 
  MessageSquare, 
  AlertTriangle,
  CheckCircle2,
  MoreVertical,
  ShieldAlert
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { HelpRequest } from '@/src/types';
import { cn } from '@/src/lib/utils';

// Fix for default marker icon in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function ProviderRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<HelpRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [internalNote, setInternalNote] = useState('');
  const [notes, setNotes] = useState<{date: string, text: string}[]>([]);

  useEffect(() => {
    const fetchRequest = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`/api/requests/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setRequest(data);
        
        // Mock notes for now since we don't have a notes table
        setNotes([
          { date: new Date(data.created_at).toLocaleString(), text: 'Request received and automatically assigned based on proximity.' }
        ]);
      } catch (err) {
        console.error(err);
        navigate('/provider/requests');
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [id, navigate]);

  const handleStatusUpdate = async (newStatus: string) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`/api/requests/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      setRequest(prev => prev ? { ...prev, status: newStatus as any } : null);
      
      setNotes(prev => [
        { date: new Date().toLocaleString(), text: `Status updated to ${newStatus}.` },
        ...prev
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddNote = () => {
    if (!internalNote.trim()) return;
    setNotes(prev => [
      { date: new Date().toLocaleString(), text: internalNote },
      ...prev
    ]);
    setInternalNote('');
  };

  if (loading || !request) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600" />
      </div>
    );
  }

  const defaultLocation = { lat: 20.5937, lng: 78.9629 }; // India center
  const locationLat = request.lat ?? defaultLocation.lat;
  const locationLng = request.lng ?? defaultLocation.lng;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/provider/requests" className="p-2 bg-white rounded-xl border border-slate-200 text-slate-400 hover:text-slate-900 shadow-sm transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-slate-900">Request {request.id}</h1>
              <span className={cn(
                "px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border",
                request.status === 'New' ? "bg-rose-50 border-rose-200 text-rose-600" :
                request.status === 'In Progress' ? "bg-amber-50 border-amber-200 text-amber-600" :
                "bg-emerald-50 border-emerald-200 text-emerald-600"
              )}>
                {request.status}
              </span>
            </div>
            <p className="text-sm font-bold text-slate-500 flex items-center gap-2">
              <Clock className="w-4 h-4" /> {new Date(request.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {request.status !== 'Resolved' && (
            <>
              <select 
                value={request.status}
                onChange={(e) => handleStatusUpdate(e.target.value)}
                className="bg-white border border-slate-200 text-sm font-bold text-slate-700 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-rose-500/20 outline-none shadow-sm cursor-pointer"
              >
                <option value="New">Mark: New</option>
                <option value="In Progress">Mark: In Progress</option>
                <option value="Resolved">Mark: Resolved</option>
              </select>
              
              <button 
                onClick={() => handleStatusUpdate('Resolved')}
                className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm shadow-emerald-200 hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Resolve
              </button>
            </>
          )}

          <button className="bg-rose-100 text-rose-600 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-rose-200 transition-colors flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> Escalate
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="col-span-2 space-y-8">
          {/* Info Card */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8 pb-8 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <div className="text-xs font-black text-rose-600 uppercase tracking-widest mb-1">Issue Type</div>
                  <div className="text-xl font-black text-slate-900">{request.issue_type}</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Urgency Level</div>
                <div className={cn(
                  "inline-block px-3 py-1 rounded-lg text-sm font-black uppercase tracking-widest",
                  request.urgency === 'Urgent' ? "bg-rose-100 text-rose-600" :
                  request.urgency === 'High' ? "bg-amber-100 text-amber-600" :
                  "bg-slate-100 text-slate-600"
                )}>
                  {request.urgency}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Description</h3>
                <div className="p-4 bg-slate-50 rounded-2xl text-slate-700 text-sm leading-relaxed whitespace-pre-wrap border border-slate-100 relative">
                  <div className="absolute top-0 right-0 p-2 text-[10px] font-black tracking-widest uppercase text-slate-400">Decrypted</div>
                  {request.description}
                </div>
              </div>

              {request.contact_preference !== 'None' && (
                <div>
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Contact Preference</h3>
                  <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{request.contact_preference} Preferred</div>
                      <div className="text-sm text-slate-600 font-mono">{request.contact_info || 'No details provided'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Internal Notes */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-slate-400" /> Internal Notes & Timeline
            </h3>

            <div className="flex gap-4 mb-8">
              <input
                type="text"
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Add a private note to this request..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
              />
              <button 
                onClick={handleAddNote}
                disabled={!internalNote.trim()}
                className="bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-slate-800 transition-colors"
              >
                Save
              </button>
            </div>

            <div className="space-y-6 relative before:absolute before:top-4 before:bottom-4 before:left-[11px] before:w-0.5 before:bg-slate-100">
              {notes.map((note, idx) => (
                <div key={idx} className="relative pl-8">
                  <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-4 border-slate-100 z-10" />
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="text-xs font-bold text-slate-400 mb-2">{note.date}</div>
                    <p className="text-sm text-slate-700 font-medium">{note.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Location Map */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-slate-400" /> Location Details
            </h3>
            
            <p className="text-sm text-slate-600 mb-6 font-medium">{request.location}</p>

            <div className="h-48 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
              <MapContainer 
                center={[locationLat, locationLng]} 
                zoom={14} 
                className="w-full h-full z-0"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={[locationLat, locationLng]}>
                  <Popup>Report Location</Popup>
                </Marker>
              </MapContainer>
            </div>
            
            <a 
              href={`https://www.google.com/maps/dir/?api=1&destination=${locationLat},${locationLng}`}
              target="_blank"
              rel="noreferrer"
              className="mt-6 w-full py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <MapPin className="w-4 h-4" /> Get Directions
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
