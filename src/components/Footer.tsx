import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Phone, Globe, MessageSquare, AlertCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center">
                <Shield className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight">VIGIL</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              A compassionate initiative dedicated to making India a safer place for every woman through technology and community support.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">Quick Links</h4>
            <ul className="space-y-4">
              {[
                { name: 'Our Impact', path: '/#impact' },
                { name: 'Find Local NGOs', path: '/services?type=NGO' },
                { name: 'Self Defense Tips', path: '/resources' },
                { name: 'Privacy Policy', path: '/about' }
              ].map((item) => (
                <li key={item.name}>
                  <Link to={item.path} className="text-slate-400 hover:text-rose-500 text-sm transition-colors">{item.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">Resources</h4>
            <ul className="space-y-4">
              {[
                { name: 'Legal Rights Guide', path: '/resources' },
                { name: 'Emergency Protocols', path: '/resources' },
                { name: 'Mental Health Support', path: '/resources' },
                { name: 'Volunteer With Us', path: '/about' }
              ].map((item) => (
                <li key={item.name}>
                  <Link to={item.path} className="text-slate-400 hover:text-rose-500 text-sm transition-colors">{item.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Emergency */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">Emergency Contacts</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 group">
                <Phone className="w-4 h-4 text-rose-500" />
                <span className="text-slate-400 text-sm">1091 - <span className="text-white font-bold">Women Helpline</span></span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-rose-500" />
                <span className="text-slate-400 text-sm">181 - <span className="text-white font-bold">Distress Helpline</span></span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-rose-500" />
                <span className="text-slate-400 text-sm">100 - <span className="text-white font-bold">Police Emergency</span></span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 text-xs">
            © 2024 VIGIL Initiative. All Rights Reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-slate-500 hover:text-white transition-colors"><Globe className="w-5 h-5" /></a>
            <a href="#" className="text-slate-500 hover:text-white transition-colors"><MessageSquare className="w-5 h-5" /></a>
            <a href="#" className="text-slate-500 hover:text-white transition-colors"><AlertCircle className="w-5 h-5" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
