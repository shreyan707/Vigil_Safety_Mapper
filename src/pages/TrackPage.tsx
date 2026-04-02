import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, Clock, CheckCircle2, AlertCircle, MapPin, ChevronRight, Copy, Check } from 'lucide-react';
import { HelpRequest } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { motion } from 'motion/react';

export default function TrackPage() {
  const { id } = useParams();
  const [request, setRequest] = useState<HelpRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchRequest = () => {
      fetch(`/api/requests/${id}`)
        .then(res => res.json())
        .then(data => {
          setRequest(data);
          setLoading(false);
        });
    };

    fetchRequest();
    const interval = setInterval(fetchRequest, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(id || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="pt-32 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="pt-32 text-center min-h-screen px-4">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-slate-200" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Request not found</h2>
        <p className="text-slate-500 mb-8">Please check your Request ID and try again.</p>
        <Link to="/" className="bg-rose-600 text-white font-bold px-8 py-3 rounded-xl">Go Home</Link>
      </div>
    );
  }

  const isAssigned = request.provider_id != null;

  const steps = [
    {
      label: isAssigned ? 'Submitted' : 'Submitted but not assigned',
      status: 'completed',
      date: request.created_at
    },
    {
      label: 'Assigned',
      status: isAssigned ? 'completed' : 'pending',
      date: isAssigned ? request.created_at : undefined
    },
    {
      label: 'In Progress',
      status: request.status === 'In Progress' || request.status === 'Resolved' ? 'completed' : 'pending'
    },
    {
      label: 'Resolved',
      status: request.status === 'Resolved' ? 'completed' : 'pending'
    },
  ];

  return (
    <div className="pt-32 pb-20 bg-slate-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-emerald-600 rounded-[2rem] p-8 md:p-10 text-white mb-8 shadow-xl shadow-emerald-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Shield className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <div className="text-emerald-200 text-xs font-black uppercase tracking-widest mb-2">Request Submitted Successfully</div>
            <h1 className="text-3xl font-black mb-6">Track Your Request</h1>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-white/20">
              <div>
                <div className="text-[10px] text-emerald-200 font-bold uppercase tracking-widest mb-1">Your Request ID</div>
                <div className="text-xl font-mono font-black tracking-tighter">{id}</div>
              </div>
              <button
                onClick={handleCopy}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <p className="mt-6 text-emerald-100 text-sm leading-relaxed">
              Please save this ID. You will need it to check the status of your request later. We do not store your personal information to link this request back to you.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Status Timeline */}
          <div className="md:col-span-2 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-10">Status Timeline</h3>

              <div className="space-y-12">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex gap-6 relative">
                    {idx !== steps.length - 1 && (
                      <div className={cn(
                        "absolute left-4 top-10 bottom-[-48px] w-0.5",
                        step.status === 'completed' ? "bg-emerald-500" : "bg-slate-100"
                      )} />
                    )}
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10",
                      step.status === 'completed' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100" : "bg-slate-100 text-slate-300"
                    )}>
                      {step.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-2 h-2 rounded-full bg-current" />}
                    </div>
                    <div>
                      <div className={cn(
                        "font-bold mb-1",
                        step.status === 'completed' ? "text-slate-900" : "text-slate-300"
                      )}>{step.label}</div>
                      {step.date && (
                        <div className="text-xs text-slate-400">
                          {new Date(step.date).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Request Details Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Request Details</h3>
              <div className="space-y-6">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Issue Type</div>
                  <div className="font-bold text-slate-900">{request.issue_type}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Urgency</div>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
                    request.urgency === 'Urgent' ? "bg-rose-100 text-rose-600" :
                      request.urgency === 'High' ? "bg-amber-100 text-amber-600" :
                        "bg-slate-100 text-slate-600"
                  )}>
                    {request.urgency}
                  </span>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Location</div>
                  <div className="text-sm text-slate-600 flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-rose-500" />
                    {request.location}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
              <div className="flex items-center gap-3 text-rose-600 mb-4">
                <Clock className="w-5 h-5" />
                <span className="font-bold text-sm">Response Time</span>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed">
                Average response time for {request.urgency} requests is currently <strong>under 2 hours</strong>. Please keep this page open or save your ID.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
