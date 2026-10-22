"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, Users as UsersIcon, ShieldCheck, UserCheck, Phone, Mail } from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, totalUsers: 0, totalAdmins: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleActive = async (user) => {
    setUpdatingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !user.is_active }),
      });
      const data = await res.json();
      if (data.success) fetchUsers();
      else alert('Failed to update user status.');
    } catch (err) {
      console.error('Error updating user:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            <UsersIcon className="w-6 h-6 text-slate-700" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Registered</p>
            <p className="text-2xl font-semibold text-slate-900">{loading ? '—' : stats.total}</p>
          </div>
        </div>
        <div className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Site Users</p>
            <p className="text-2xl font-semibold text-slate-900">{loading ? '—' : stats.totalUsers}</p>
          </div>
        </div>
        <div className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Admins</p>
            <p className="text-2xl font-semibold text-slate-900">{loading ? '—' : stats.totalAdmins}</p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-white">
          <h2 className="text-lg font-semibold text-slate-900">Registered Users</h2>
          <p className="text-sm text-slate-500 mt-1">Everyone who has created an account on the website.</p>
        </div>

        <div className="p-6">
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                <Loader2 className="animate-spin w-8 h-8 mb-2" />
                <span className="text-sm">Loading users...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
                <UsersIcon className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-sm">No one has registered yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Contact</th>
                      <th className="px-6 py-3">Role</th>
                      <th className="px-6 py-3">Joined</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-slate-600 divide-y divide-slate-100 bg-white">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{user.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">ID: #{user.id}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
                            <Mail className="w-3.5 h-3.5 text-slate-400" /> {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-600">
                              <Phone className="w-3.5 h-3.5 text-slate-400" /> {user.phone}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                            user.role === 'ADMIN'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                            user.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => toggleActive(user)}
                            disabled={updatingId === user.id}
                            className="text-xs font-semibold text-slate-600 border border-slate-300 px-3 py-1.5 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50"
                          >
                            {updatingId === user.id ? '...' : user.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
