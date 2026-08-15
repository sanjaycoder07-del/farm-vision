'use client';
import React, { useState, useEffect } from 'react';
import { formatINR } from '../../utils/formatCurrency';
import Sidebar from '../../components/Sidebar';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    fetch(`${API_BASE}/api/admin/stats`)
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch admin stats:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      <Sidebar role="admin" plan="basic" user={{ name: "Admin User" }} />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div>
            <h1 className="text-3xl font-bold font-serif text-green-primary">Control Panel</h1>
            <p className="text-gray-500 mt-1">Platform overview and management</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard label="Total Farmers" value={stats?.totalFarmers ? stats.totalFarmers.toLocaleString() : "1,245"} sub="+12% this month" icon="👥" />
            <StatCard label="Active Listings" value={stats?.activeListings ? stats.activeListings.toString() : "342"} sub="In last 24h" icon="🛒" />
            <StatCard label="Marketplace Volume" value={formatINR(stats?.totalMarketplaceVolume || 452000)} sub="Total value" icon="💰" />
          </div>

          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-medium">User</th>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium">Action</th>
                    <th className="px-6 py-4 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Kisan Kumar</td>
                    <td className="px-6 py-4"><Badge status="Active" /></td>
                    <td className="px-6 py-4 text-sm text-gray-600">Listed 50kg Potato</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatINR(900)}</td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">FreshFoods Ltd</td>
                    <td className="px-6 py-4"><Badge status="Submitted" /></td>
                    <td className="px-6 py-4 text-sm text-gray-600">Purchased Pumpkin</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatINR(4200)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
