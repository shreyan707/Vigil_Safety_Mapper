import React from 'react';
import { 
  MapPin, 
  Phone, 
  Heart, 
  Shield, 
  Globe, 
  Clock, 
  Users, 
  MessageSquare, 
  ArrowRight 
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import AsciiShield from '@/src/components/AsciiShield';

const HELPLINES = [
  { number: '1091', label: 'Women Helpline' },
  { number: '181', label: 'Distress' },
  { number: '100', label: 'Police' }
];

const IMPACT_STATS = [
  { icon: <Heart className="w-6 h-6 text-rose-500" />, value: '2,847', label: 'Requests Resolved' },
  { icon: <Shield className="w-6 h-6 text-rose-500" />, value: '156', label: 'Active Services' },
  { icon: <Globe className="w-6 h-6 text-rose-500" />, value: '12', label: 'Languages Supported' },
  { icon: <Clock className="w-6 h-6 text-rose-500" />, value: '<2 hrs', label: 'Response Time' }
];

const TESTIMONIALS = [
  {
    category: 'Legal Aid',
    quote: "I was hesitant at first, but the anonymous request feature helped me get legal counsel without facing any social pressure. They were so professional.",
    user: 'Verified User',
    location: 'South Mumbai'
  },
  {
    category: 'Harassment',
    quote: "The emergency map helped me find a safe shelter during a late-night commute crisis. The speed of response from the helpline was incredible.",
    user: 'Verified User',
    location: 'Bengaluru'
  },
  {
    category: 'Counseling',
    quote: "Finding a community that understands and supports you without judgment is life-changing. Thank you VIGIL for being there.",
    user: 'Verified User',
    location: 'New Delhi'
  }
];

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-rose-50 to-transparent -z-10 hidden lg:block" />
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-rose-100/50 rounded-full blur-3xl -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold uppercase tracking-wider mb-6">
                <div className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                India 24/7 Support
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-6">
                You Are Not Alone.<br />
                <span className="text-rose-600">Help is Here.</span>
              </h1>
              <p className="text-lg text-slate-600 mb-10 max-w-lg leading-relaxed">
                Dedicated emergency support and service mapping for women in India. 
                Immediate intervention is just a click or call away.
              </p>

              <div className="bg-white rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 max-w-md">
                <div className="flex items-center gap-2 text-rose-600 font-bold mb-4">
                  <Phone className="w-5 h-5" />
                  <span>IMMEDIATE HELPLINES</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {HELPLINES.map((h) => (
                    <div key={h.number} className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-2xl font-black text-slate-900">{h.number}</div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{h.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-rose-500 to-pink-600 p-1 shadow-2xl overflow-hidden">
                <div className="w-full h-full bg-slate-900 rounded-[1.4rem] relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] border border-rose-500/30 rounded-full animate-[spin_20s_linear_infinite]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-rose-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
                  </div>
                  
                  <div className="z-10 text-center px-8">
                    <div className="w-20 h-20 bg-rose-600/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-rose-500/30">
                      <MapPin className="w-10 h-10 text-rose-500" />
                    </div>
                    <div className="text-xs font-bold text-rose-500 uppercase tracking-[0.2em] mb-2">System Protected</div>
                    <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Empowered<br />Safe Zone</h3>
                    <div className="mt-12 text-[10px] text-slate-500 font-mono uppercase tracking-widest">Visualizing 256-bit Encryption</div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">Verified Secure</div>
                  <div className="text-xs text-slate-500">End-to-end encrypted</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section id="find-help" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 group"
            >
              <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-rose-600 transition-colors">
                <MapPin className="w-7 h-7 text-rose-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Find Help Now</h3>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Access our real-time interactive map of India's safety services including safe zones, NGOs and police posts.
              </p>
              <Link to="/map" className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2">
                Open Safety Map
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 group"
            >
              <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-slate-900 transition-colors">
                <MessageSquare className="w-7 h-7 text-rose-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Submit Anonymous Request</h3>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Report incidents or request assistance without revealing your identity. Your privacy is our priority.
              </p>
              <Link to="/request/new" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2">
                Submit Privately
                <Shield className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Map Section - NOW WITH ASCII SHIELD */}
      <section id="services" className="py-24 bg-rose-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-black text-slate-900 mb-4">Services Across India</h2>
          <p className="text-slate-600 mb-16 max-w-2xl mx-auto">
            Our map covers over 150+ locations verified for safety and support across the country.
          </p>

          <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white bg-rose-100 h-[500px] flex items-center justify-center">
            <AsciiShield />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-rose-600/5 backdrop-blur-[2px]">
              <Link to="/map" className="bg-white hover:bg-slate-50 text-slate-900 font-bold px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 transition-transform hover:scale-105">
                <MapPin className="w-6 h-6 text-rose-600" />
                Explore Interactive Map
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section id="impact" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
            {IMPACT_STATS.map((stat, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  {stat.icon}
                </div>
                <div className="text-4xl font-black text-slate-900 mb-2">{stat.value}</div>
                <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-rose-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-4xl font-black text-slate-900 mb-4">Community Voices</h2>
              <p className="text-slate-600 max-w-xl">
                Stories of resilience and support from women across India who found a safe space with us.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-3xl shadow-xl shadow-rose-100/50 border border-rose-50 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <MessageSquare className="w-20 h-20" />
                </div>
                <div className="inline-block px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest mb-6 border border-rose-100">
                  {t.category}
                </div>
                <p className="text-slate-700 italic mb-8 leading-relaxed">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{t.user}</div>
                    <div className="text-xs text-slate-400">{t.location}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
