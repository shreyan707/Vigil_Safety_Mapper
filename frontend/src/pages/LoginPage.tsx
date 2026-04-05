import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { setStoredSession } from '@/src/lib/session';

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok) {
        setStoredSession(data.token, data.user);
        navigate(data.user.role === 'admin' ? '/admin/dashboard' : '/provider/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (_error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 pb-20 pt-32">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <Link to="/" className="mb-8 inline-flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-600 shadow-lg shadow-rose-200">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900">VIGIL</span>
          </Link>
          <h1 className="mb-2 text-3xl font-black text-slate-900">Dashboard Login</h1>
          <p className="text-slate-500">Sign in as a provider or admin to access your control panel.</p>
        </div>

        <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50 md:p-10">
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-600">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  required
                  type="email"
                  placeholder="provider@vigil.org or admin@vigil.org"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 font-medium focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Password</label>
                <Link to="/forgot-password" title="Forgot Password" className="text-[10px] font-black uppercase tracking-widest text-rose-600 hover:underline">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  required
                  type="password"
                  placeholder="********"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 font-medium focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 py-5 font-black text-white shadow-xl transition-all hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
              ) : (
                <>
                  Continue to Dashboard
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 border-t border-slate-100 pt-8 text-center">
            <p className="text-xs leading-relaxed text-slate-400">
              Provider accounts are created by administrators. If you need onboarding help, please{' '}
              <Link to="/about" className="font-bold text-rose-600 hover:underline">
                contact us
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
