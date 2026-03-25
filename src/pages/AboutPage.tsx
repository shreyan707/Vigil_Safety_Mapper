import React from 'react';
import { Shield, Users, Heart, Globe, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="pt-32 pb-20 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mission */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold uppercase tracking-wider mb-6">
              Our Mission
            </div>
            <h1 className="text-5xl lg:text-6xl font-black text-slate-900 mb-8 leading-tight">
              Creating a <span className="text-rose-600">Safe Space</span> for Every Woman.
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              VIGIL was born out of a critical need for immediate, accessible, and anonymous support for women in India. Our platform bridges the gap between those in distress and the verified services that can help them.
            </p>
            <div className="space-y-4">
              {[
                "Real-time emergency service mapping",
                "100% anonymous help requests",
                "Verified network of NGOs and Police",
                "Multilingual support and resources"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-slate-700 font-bold">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
          <div className="relative">
            <div className="aspect-square rounded-[3rem] bg-rose-100 overflow-hidden shadow-2xl">
              <img 
                src="https://picsum.photos/seed/community/800/800" 
                alt="Community" 
                className="w-full h-full object-cover mix-blend-multiply opacity-80"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-10 -right-10 bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 hidden md:block">
              <div className="text-4xl font-black text-rose-600 mb-2">150+</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verified Locations</div>
            </div>
          </div>
        </div>

        {/* How it Works */}
        <div className="bg-slate-50 rounded-[4rem] p-12 md:p-20 mb-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">How It Works</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              A simple, secure process designed to get you the help you need without compromise.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { 
                step: '01', 
                title: 'Find or Request', 
                desc: 'Use our interactive map to find nearby services or submit an anonymous request directly through the platform.',
                icon: <Globe className="w-8 h-8" />
              },
              { 
                step: '02', 
                title: 'Instant Routing', 
                desc: 'Our system instantly routes your request to the nearest verified provider based on your location and urgency.',
                icon: <Shield className="w-8 h-8" />
              },
              { 
                step: '03', 
                title: 'Secure Response', 
                desc: 'A verified professional responds to your request. You can track the status using your unique Request ID.',
                icon: <Heart className="w-8 h-8" />
              }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="text-8xl font-black text-slate-200 absolute -top-10 -left-6 -z-0">{item.step}</div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-6 text-rose-600">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">{item.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-rose-600 rounded-[3rem] p-12 md:p-20 text-white text-center shadow-2xl shadow-rose-200">
          <h2 className="text-4xl md:text-5xl font-black mb-8">Ready to make a difference?</h2>
          <p className="text-rose-100 text-lg mb-12 max-w-2xl mx-auto">
            Whether you need help or want to provide it, VIGIL is here to facilitate a safer environment for everyone.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link to="/map" className="bg-white text-rose-600 font-black px-10 py-5 rounded-2xl shadow-xl hover:bg-slate-50 transition-all">
              Find Help Now
            </Link>
            <Link to="/resources" className="bg-rose-700 text-white font-black px-10 py-5 rounded-2xl shadow-xl hover:bg-rose-800 transition-all border border-rose-500">
              Access Resources
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
