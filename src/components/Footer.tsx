import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Phone, Globe, MessageSquare, AlertCircle } from 'lucide-react';
import { EXTERNAL_RESOURCE_LINKS, HELPLINES, RESOURCES } from '../data/resources';

export default function Footer() {
  const featuredResources = RESOURCES.filter((resource) =>
    ['legal-rights-guide', 'safety-planning', 'mental-health-support'].includes(resource.slug)
  );

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
                { name: 'Self Defense Tips', path: '/resources/self-defense-tips' },
                { name: 'Privacy Policy', path: '/about' },
                { name: 'Provider Login', path: '/login' }
              ].map((item) => (
                <li key={item.name}>
                  {item.path.includes('#') ? (
                    <a href={item.path} className="text-slate-400 hover:text-rose-500 text-sm transition-colors">{item.name}</a>
                  ) : (
                    <Link to={item.path} className="text-slate-400 hover:text-rose-500 text-sm transition-colors">{item.name}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">Resources</h4>
            <ul className="space-y-4">
              {featuredResources.map((item) => (
                <li key={item.slug}>
                  <Link to={`/resources/${item.slug}`} className="text-slate-400 hover:text-rose-500 text-sm transition-colors">{item.title}</Link>
                </li>
              ))}
              <li>
                <Link to="/about" className="text-slate-400 hover:text-rose-500 text-sm transition-colors">Volunteer With Us</Link>
              </li>
            </ul>
          </div>

          {/* Emergency */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">Emergency Contacts</h4>
            <ul className="space-y-4">
              {HELPLINES.slice(0, 3).map((helpline) => (
                <li key={helpline.number} className="flex items-center gap-3 group">
                  <Phone className="w-4 h-4 text-rose-500" />
                  <a href={`tel:${helpline.number}`} className="text-slate-400 text-sm hover:text-white transition-colors">
                    {helpline.number} - <span className="text-white font-bold">{helpline.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 text-xs">
            © 2026 VIGIL Initiative. All Rights Reserved.
          </p>
          <div className="flex items-center gap-6">
            <a
              href={EXTERNAL_RESOURCE_LINKS[0].url}
              target="_blank"
              rel="noreferrer"
              aria-label={EXTERNAL_RESOURCE_LINKS[0].name}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <Globe className="w-5 h-5" />
            </a>
            <a
              href={EXTERNAL_RESOURCE_LINKS[2].url}
              target="_blank"
              rel="noreferrer"
              aria-label={EXTERNAL_RESOURCE_LINKS[2].name}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
            </a>
            <a
              href={EXTERNAL_RESOURCE_LINKS[1].url}
              target="_blank"
              rel="noreferrer"
              aria-label={EXTERNAL_RESOURCE_LINKS[1].name}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <AlertCircle className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
