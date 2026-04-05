import React, { useEffect, useState } from 'react';
import { Users as UsersIcon, UserPlus, Key, Ban, Shield, Clock, CheckCircle } from 'lucide-react';
import { AdminUser } from '@/src/types';
import { getStoredToken, authHeaders, clearStoredSession } from '@/src/lib/session';
import { useNavigate } from 'react-router-dom';

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const token = getStoredToken();
    if (!token) {
      clearStoredSession();
      navigate('/login');
      return;
    }

    try {
      const res = await fetch('/api/admin/users', { headers: authHeaders(token) });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    const email = prompt("Enter email address:");
    const name = prompt("Enter full name:");
    const role = prompt("Enter role (admin, provider):", "provider");
    const password = prompt("Enter password (leave blank for defaults):");

    if (!email || !name || !role) return;

    const token = getStoredToken();
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { ...authHeaders(token!), 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, role, password })
    });

    if (res.ok) loadUsers();
    else alert('Failed to create account.');
  };

  const handleToggleStatus = async (user: AdminUser) => {
    if (!confirm(`Are you sure you want to ${user.is_active ? 'deactivate' : 'activate'} this user?`)) return;

    const token = getStoredToken();
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { ...authHeaders(token!), 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !user.is_active })
    });

    if (res.ok) loadUsers();
    else alert('Failed to update status.');
  };

  const handleResetPassword = async (user: AdminUser) => {
    const newPassword = prompt(`Enter new password for ${user.email}:`);
    if (!newPassword) return;

    const token = getStoredToken();
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { ...authHeaders(token!), 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword })
    });

    if (res.ok) alert('Password reset successfully.');
    else alert('Failed to reset password.');
  };

  const handleViewLoginHistory = async (user: AdminUser) => {
    const token = getStoredToken();
    const res = await fetch(`/api/admin/users/${user.id}/login-history`, { headers: authHeaders(token!) });
    if (res.ok) {
      const history = await res.json();
      alert(`Recent logins for ${user.email}:\n` + history.map((h: any) => `${new Date(h.created_at).toLocaleString()} - ${h.success ? 'Success' : 'Failed'} (${h.ip_address})`).join('\n'));
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1">Manage provider and admin accounts.</p>
        </div>
        <button onClick={handleCreateUser} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-rose-700">
          <UserPlus className="h-4 w-4" /> Create Account
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Last Login</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{user.name}</div>
                    <div className="text-slate-500">{user.email}</div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {user.role === 'admin' ? <Shield className="h-3 w-3" /> : <UsersIcon className="h-3 w-3" />} 
                      <span className="capitalize">{user.role}</span>
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                      {user.is_active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-slate-600">{user.lastLogin ? new Date(user.lastLogin.created_at).toLocaleString() : 'Never'}</div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleResetPassword(user)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-600" title="Reset Password">
                        <Key className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleToggleStatus(user)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-amber-600" title={user.is_active ? "Deactivate" : "Activate"}>
                        {user.is_active ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </button>
                      <button onClick={() => handleViewLoginHistory(user)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600" title="Login History">
                        <Clock className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">No users found.</td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-b-2 border-rose-600"></div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
