import React from 'react';
import { BookOpen, Shield, Phone, Download, ExternalLink, FileText, Scale, Heart } from 'lucide-react';
import { motion } from 'motion/react';

const RESOURCES = [
  {
    title: 'Legal Rights Guide',
    desc: 'Understanding your rights under Indian law regarding domestic violence and harassment.',
    icon: <Scale className="w-6 h-6" />,
    color: 'bg-blue-50 text-blue-600'
  },
  {
    title: 'Safety Planning',
    desc: 'Practical steps to create a safety plan for you and your children in dangerous situations.',
    icon: <Shield className="w-6 h-6" />,
    color: 'bg-rose-50 text-rose-600'
  },
  {
    title: 'Mental Health Support',
    desc: 'Resources for coping with trauma, anxiety, and finding professional counseling.',
    icon: <Heart className="w-6 h-6" />,
    color: 'bg-emerald-50 text-emerald-600'
  },
  {
    title: 'Self Defense Tips',
    desc: 'Basic awareness and physical techniques for personal safety in public spaces.',
    icon: <Shield className="w-6 h-6" />,
    color: 'bg-amber-50 text-amber-600'
  }
];

const HELPLINES = [
  { name: 'National Women Helpline', number: '181', desc: '24/7 Distress support' },
  { name: 'Women Helpline (Domestic)', number: '1091', desc: 'Specific for domestic issues' },
  { name: 'Police Emergency', number: '100', desc: 'Immediate police response' },
  { name: 'Cyber Crime Cell', number: '1930', desc: 'Reporting online harassment' }
];

export default function ResourcesPage() {
  return (
    <div className="pt-32 pb-20 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h1 className="text-5xl font-black text-slate-900 mb-4">Safety Resources</h1>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Empowering you with knowledge, tools, and direct connections to stay safe and informed.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Resources */}
          <div className="lg:col-span-2 space-y-12">
            <div className="grid md:grid-cols-2 gap-8">
              {RESOURCES.map((res, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ y: -5 }}
                  className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 group"
                >
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6", res.color)}>
                    {res.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{res.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-8">{res.desc}</p>
                  <button className="flex items-center gap-2 text-sm font-bold text-rose-600 hover:underline">
                    Read More <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>

            <div className="bg-white rounded-[3rem] p-10 md:p-16 border border-slate-100 shadow-sm">
              <h2 className="text-3xl font-black text-slate-900 mb-8">Downloadable Guides</h2>
              <div className="space-y-4">
                {[
                  { name: 'Emergency Protocol PDF', size: '1.2 MB' },
                  { name: 'Legal Rights Handbook', size: '2.4 MB' },
                  { name: 'Safety Planning Worksheet', size: '0.8 MB' }
                ].map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl hover:bg-rose-50 transition-all group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-rose-600 shadow-sm">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{file.name}</div>
                        <div className="text-xs text-slate-400">{file.size}</div>
                      </div>
                    </div>
                    <Download className="w-5 h-5 text-slate-300 group-hover:text-rose-600" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Helplines */}
          <div className="space-y-8">
            <div className="bg-rose-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-rose-100">
              <h3 className="text-2xl font-black mb-8 flex items-center gap-3">
                <Phone className="w-6 h-6" />
                Quick Helplines
              </h3>
              <div className="space-y-8">
                {HELPLINES.map((h, idx) => (
                  <div key={idx} className="border-b border-rose-500/30 pb-6 last:border-0 last:pb-0">
                    <div className="text-[10px] font-black uppercase tracking-widest text-rose-200 mb-1">{h.name}</div>
                    <a href={`tel:${h.number}`} className="text-3xl font-black block mb-1 hover:text-rose-100 transition-colors">{h.number}</a>
                    <div className="text-xs text-rose-200">{h.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-6">External Links</h3>
              <div className="space-y-4">
                {[
                  { name: 'National Commission for Women', url: '#' },
                  { name: 'National Women Helpline', url: '#' },
                  { name: 'Ministry of WCD', url: '#' }
                ].map((link, idx) => (
                  <a 
                    key={idx} 
                    href={link.url}
                    className="flex items-center justify-between text-sm font-bold text-slate-600 hover:text-rose-600 transition-colors group"
                  >
                    {link.name}
                    <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-rose-600" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}
