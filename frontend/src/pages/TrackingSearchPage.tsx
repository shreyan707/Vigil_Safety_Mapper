import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Shield } from 'lucide-react';
import { motion } from 'motion/react';

export default function TrackingSearchPage() {
  const [trackingId, setTrackingId] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingId.trim()) {
      navigate(`/request/track/${trackingId.trim()}`);
    }
  };

  return (
    <div className="pt-32 pb-20 bg-slate-50 min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-4 sm:px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 text-center"
        >
          <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Search className="w-8 h-8 text-rose-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Track Your Request</h1>
          <p className="text-slate-500 mb-8 text-sm">
            Enter the 8-character tracking ID you received when submitting your safety request.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="e.g. A1B2C3D4"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all outline-none font-mono text-center text-lg tracking-widest placeholder:tracking-normal placeholder:text-sm uppercase"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              Track Status
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
