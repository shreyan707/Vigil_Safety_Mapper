import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, AlertCircle, Send, MapPin, MessageSquare, Phone, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

export default function RequestPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const providerId = searchParams.get('provider');
  
  const [formData, setFormData] = useState({
    issue_type: '',
    description: '',
    location: '',
    urgency: 'Medium',
    contact_preference: 'None',
    contact_info: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, provider_id: providerId })
      });
      const data = await res.json();
      navigate(`/request/track/${data.id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-20 bg-slate-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-200">
            <Shield className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-4">Anonymous Help Request</h1>
          <p className="text-slate-500 max-w-md mx-auto">
            Your safety and privacy are our top priorities. All information submitted here is encrypted and handled with strict confidentiality.
          </p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Issue Type */}
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Type of Issue</label>
                <select 
                  required
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium"
                  value={formData.issue_type}
                  onChange={e => setFormData({...formData, issue_type: e.target.value})}
                >
                  <option value="">Select an option...</option>
                  <option value="Domestic Violence">Domestic Violence</option>
                  <option value="Harassment">Harassment / Stalking</option>
                  <option value="Legal Support">Legal Support</option>
                  <option value="Mental Health">Mental Health / Counseling</option>
                  <option value="Other">Other Emergency</option>
                </select>
              </div>

              {/* Urgency */}
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Urgency Level</label>
                <div className="flex gap-2">
                  {['Low', 'Medium', 'High', 'Urgent'].map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFormData({...formData, urgency: level})}
                      className={cn(
                        "flex-grow py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border",
                        formData.urgency === level 
                          ? "bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-100" 
                          : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Describe your situation</label>
              <textarea 
                required
                rows={4}
                placeholder="Please provide as much detail as you feel comfortable sharing..."
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Current Location / Area</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  required
                  type="text"
                  placeholder="e.g. MG Road, Bengaluru"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                />
              </div>
            </div>

            {/* Contact Preference */}
            <div className="space-y-6 pt-6 border-t border-slate-100">
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest">How should we contact you?</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'None', label: 'No Contact', icon: <Shield className="w-4 h-4" /> },
                    { id: 'SMS', label: 'SMS Only', icon: <MessageSquare className="w-4 h-4" /> },
                    { id: 'Call', label: 'Phone Call', icon: <Phone className="w-4 h-4" /> }
                  ].map(pref => (
                    <button
                      key={pref.id}
                      type="button"
                      onClick={() => setFormData({...formData, contact_preference: pref.id as any})}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                        formData.contact_preference === pref.id 
                          ? "bg-slate-900 text-white border-slate-900 shadow-xl" 
                          : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100"
                      )}
                    >
                      {pref.icon}
                      <span className="text-[10px] font-black uppercase tracking-widest">{pref.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {formData.contact_preference !== 'None' && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                  <input 
                    required
                    type="tel"
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-medium"
                    value={formData.contact_info}
                    onChange={e => setFormData({...formData, contact_info: e.target.value})}
                  />
                </motion.div>
              )}
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex gap-4">
              <Info className="w-6 h-6 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Important:</strong> This is not a substitute for emergency services. If you are in immediate danger, call 100 or 1091. Your IP address is not logged, and your data is stored using industry-standard encryption.
              </p>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-rose-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Anonymously
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
