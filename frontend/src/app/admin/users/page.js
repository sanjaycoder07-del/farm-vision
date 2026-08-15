'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import Badge from '../../../components/Badge';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState(null);

  const fetchUsers = () => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    fetch(`${API_BASE}/api/admin/users`)
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch admin users:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleUserStatus = async (userId) => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, { method: 'PUT' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fetchUsers();
    } catch (err) {
      console.error('Failed to update user status:', err);
      alert('Failed to update user status.');
    }
  };

  const toggleBuyerSubscription = async (user) => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      const isSubbed = user.subscriptionStatus === 'active';
      const res = await fetch(`${API_BASE}/api/buyer/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          plan: isSubbed ? 'Basic Buyer' : 'Premium PRO',
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setActionMsg(`Subscription for ${user.name} updated successfully.`);
      setTimeout(() => setActionMsg(null), 4000);
      fetchUsers();
    } catch (err) {
      console.error('Failed to update subscription:', err);
      alert('Failed to update buyer subscription.');
    }
  };

  const buyers = users.filter((u) => u.role === 'BUYER');

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      <Sidebar role="admin" plan="basic" user={{ name: "Admin User" }} />

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold font-serif text-green-primary">User & Subscription Audit</h1>
              <p className="text-sm text-gray-500 mt-1">Audit registered farmers, buyers, agents, and active subscriptions</p>
            </div>
            
            <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-2xs">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'ALL'
                    ? 'bg-green-primary text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                👥 All Platform Users ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('SUBSCRIPTIONS')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'SUBSCRIPTIONS'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                👑 Buyer Subscriptions ({buyers.length})
              </button>
            </div>
          </div>

          {actionMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium animate-in fade-in">
              ✅ {actionMsg}
            </div>
          )}

          {activeTab === 'ALL' ? (
            <div className="bg-white rounded-2xl overflow-hidden shadow-xs border border-gray-100">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900 font-serif">Registered Platform Accounts</h2>
                <span className="text-xs text-gray-400 font-medium">Total: {users.length}</span>
              </div>

              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading platform users...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                        <th className="px-6 py-4 font-medium">User ID</th>
                        <th className="px-6 py-4 font-medium">Name</th>
                        <th className="px-6 py-4 font-medium">Role</th>
                        <th className="px-6 py-4 font-medium">Contact</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono font-medium text-gray-900">{user.id}</td>
                          <td className="px-6 py-4 font-semibold text-gray-900">{user.name}</td>
                          <td className="px-6 py-4 font-medium text-emerald-800">{user.role}</td>
                          <td className="px-6 py-4 text-gray-600">{user.email || user.phone || 'N/A'}</td>
                          <td className="px-6 py-4"><Badge status={user.status} /></td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleUserStatus(user.id)}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              {user.isVerified ? 'Deactivate' : 'Verify Account'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* Task 7: Admin Buyer Subscription Audit View */
            <div className="bg-white rounded-2xl overflow-hidden shadow-xs border border-gray-100 space-y-0">
              <div className="p-6 border-b border-gray-50 bg-gradient-to-r from-amber-500/10 to-orange-50/40">
                <h2 className="text-lg font-bold text-amber-950 font-serif">👑 Buyer Premium Subscription Audit</h2>
                <p className="text-xs text-amber-800/80 mt-0.5">Manage buyer membership tiers, active PRO access, and expiry schedules</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-medium">Buyer ID</th>
                      <th className="px-6 py-4 font-medium">Buyer / Business</th>
                      <th className="px-6 py-4 font-medium">Email</th>
                      <th className="px-6 py-4 font-medium">Subscription Tier</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium">Demo Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {buyers.map((b) => {
                      const isSub = b.subscriptionStatus === 'active';
                      return (
                        <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-mono font-medium text-gray-900">{b.id}</td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">{b.name}</div>
                            <div className="text-xs text-gray-400">{b.companyName || 'Wholesale Buyer'}</div>
                          </td>
                          <td className="px-6 py-4 text-gray-600 font-mono text-xs">{b.email}</td>
                          <td className="px-6 py-4 font-medium">
                            {isSub ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold">
                                👑 Premium PRO
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                Basic Free Tier
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <Badge status={isSub ? 'Active' : 'Submitted'} />
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleBuyerSubscription(b)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                isSub
                                  ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                  : 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600 shadow-xs'
                              }`}
                            >
                              {isSub ? 'Cancel Subscription' : 'Grant PRO Subscription'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
