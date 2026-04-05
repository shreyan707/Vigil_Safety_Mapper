import React, { useEffect, useState } from 'react';
import { Save, Database, Map as MapIcon, Mail, MessageSquare, Zap } from 'lucide-react';
import { AdminSettings } from '@/src/types';
import { getStoredToken, authHeaders } from '@/src/lib/session';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('sms');
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const token = getStoredToken();
      if (!token) return;
      const res = await fetch('/api/admin/settings', { headers: authHeaders(token) });
      if (res.ok) setSettings(await res.json());
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const token = getStoredToken();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { ...authHeaders(token!), 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setSettings(await res.json());
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    const token = getStoredToken();
    const res = await fetch('/api/admin/settings/backup', { headers: authHeaders(token!) });
    if (res.ok) {
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vigil_backup_${data.exportedAt.split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      alert('Backup failed.');
    }
  };

  const tabs = [
    { id: 'sms', label: 'SMS Gateway', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'email', label: 'Email (SMTP)', icon: <Mail className="h-4 w-4" /> },
    { id: 'map', label: 'Map Defaults', icon: <MapIcon className="h-4 w-4" /> },
    { id: 'routing', label: 'Auto-Assignment', icon: <Zap className="h-4 w-4" /> },
    { id: 'backup', label: 'System Backup', icon: <Database className="h-4 w-4" /> },
  ];

  if (!settings) return <div className="p-8 text-center"><div className="inline-block h-6 w-6 animate-spin rounded-full border-b-2 border-rose-600"></div></div>;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">System Settings</h1>
          <p className="text-slate-500 mt-1">Configure platform integrations and rules.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 border border-transparent px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div> : <Save className="h-4 w-4" />} 
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-bold transition-colors ${
                activeTab === tab.id
                  ? 'bg-rose-50 text-rose-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className={activeTab === tab.id ? 'text-rose-500' : 'text-slate-400'}>
                {tab.icon}
              </div>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="md:col-span-3">
          {activeTab === 'sms' && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-6">
              <h2 className="text-xl font-black text-slate-900">SMS Gateway Configuration</h2>
              <p className="text-sm text-slate-500">Integrate Twilio to send automated SMS to providers and users.</p>
              
              <div className="space-y-4 pt-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Twilio Account SID</label>
                  <input type="text" className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" 
                    value={settings.twilio.accountSid} onChange={e => setSettings({...settings, twilio: {...settings.twilio, accountSid: e.target.value}})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Auth Token</label>
                  <input type="password" className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" 
                    value={settings.twilio.authToken} onChange={e => setSettings({...settings, twilio: {...settings.twilio, authToken: e.target.value}})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">From Number</label>
                  <input type="text" className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500" 
                    value={settings.twilio.fromNumber} onChange={e => setSettings({...settings, twilio: {...settings.twilio, fromNumber: e.target.value}})} />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="enable_sms" className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4" 
                    checked={settings.twilio.enabled} onChange={e => setSettings({...settings, twilio: {...settings.twilio, enabled: e.target.checked}})} />
                  <label htmlFor="enable_sms" className="text-sm font-bold text-slate-700">Enable SMS Notifications</label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-6">
              <h2 className="text-xl font-black text-slate-900">Email Settings (SMTP)</h2>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">SMTP Host</label>
                    <input type="text" className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-rose-500" 
                      value={settings.smtp.host} onChange={e => setSettings({...settings, smtp: {...settings.smtp, host: e.target.value}})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Port</label>
                    <input type="number" className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-rose-500" 
                      value={settings.smtp.port} onChange={e => setSettings({...settings, smtp: {...settings.smtp, port: Number(e.target.value)}})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Username</label>
                  <input type="text" className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-rose-500" 
                    value={settings.smtp.username} onChange={e => setSettings({...settings, smtp: {...settings.smtp, username: e.target.value}})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                  <input type="password" className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-rose-500" 
                    value={settings.smtp.password} onChange={e => setSettings({...settings, smtp: {...settings.smtp, password: e.target.value}})} />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="enable_email" className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4" 
                    checked={settings.smtp.enabled} onChange={e => setSettings({...settings, smtp: {...settings.smtp, enabled: e.target.checked}})} />
                  <label htmlFor="enable_email" className="text-sm font-bold text-slate-700">Enable Email Delivery</label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'map' && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-6">
              <h2 className="text-xl font-black text-slate-900">Map Defaults</h2>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Default Center Lat</label>
                    <input type="number" step="0.0001" className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-rose-500"
                      value={settings.map.centerLat} onChange={e => setSettings({...settings, map: {...settings.map, centerLat: Number(e.target.value)}})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Default Center Lng</label>
                    <input type="number" step="0.0001" className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-rose-500"
                      value={settings.map.centerLng} onChange={e => setSettings({...settings, map: {...settings.map, centerLng: Number(e.target.value)}})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Default Zoom Level</label>
                  <input type="number" className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-rose-500"
                    value={settings.map.zoom} onChange={e => setSettings({...settings, map: {...settings.map, zoom: Number(e.target.value)}})} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'routing' && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-6">
              <h2 className="text-xl font-black text-slate-900">Auto-Assignment Rules</h2>
              <p className="text-sm text-slate-500">Configure how incoming requests are routed to providers.</p>
              
              <div className="space-y-4 pt-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Maximum Radius (km)</label>
                  <input type="number" className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-rose-500"
                    value={settings.autoAssignment.maxRadiusKm} onChange={e => setSettings({...settings, autoAssignment: {...settings.autoAssignment, maxRadiusKm: Number(e.target.value)}})} />
                </div>
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="rule1" className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
                      checked={settings.autoAssignment.enabled} onChange={e => setSettings({...settings, autoAssignment: {...settings.autoAssignment, enabled: e.target.checked}})} />
                    <label htmlFor="rule1" className="text-sm font-bold text-slate-700">Enable automatic assignment</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="rule2" className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
                      checked={settings.autoAssignment.assignOnlyVerified} onChange={e => setSettings({...settings, autoAssignment: {...settings.autoAssignment, assignOnlyVerified: e.target.checked}})} />
                    <label htmlFor="rule2" className="text-sm font-bold text-slate-700">Only assign to VERIFIED providers</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="rule3" className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
                      checked={settings.autoAssignment.allowFallbackUnassigned} onChange={e => setSettings({...settings, autoAssignment: {...settings.autoAssignment, allowFallbackUnassigned: e.target.checked}})} />
                    <label htmlFor="rule3" className="text-sm font-bold text-slate-700">Allow fallback to unassigned queue if no provider found</label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-6 text-center py-12">
              <Database className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-xl font-black text-slate-900">Database Backup & Recovery</h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto">Create a point-in-time snapshot of all configurations, users, and request data.</p>
              
              <div className="pt-6 flex justify-center gap-4">
                <button onClick={handleBackup} className="rounded-xl bg-slate-900 px-6 py-2 text-sm font-bold text-white hover:bg-slate-800 shadow-sm">
                  Create Backup
                </button>
                <button onClick={() => alert('To restore a backup, please use the CLI directly or POST /api/admin/settings/restore')} className="rounded-xl border border-slate-200 bg-white px-6 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm">
                  Restore Instructions
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
