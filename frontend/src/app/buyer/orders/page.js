'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import StatCard from '../../../components/StatCard';
import Badge from '../../../components/Badge';
import { formatINR } from '../../../utils/formatCurrency';

export default function BuyerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    fetch(`${API_BASE}/api/buyer/orders`)
      .then((res) => res.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch buyer orders:', err);
        setLoading(false);
      });
  }, []);

  const totalSpent = orders.reduce((acc, o) => acc + (o.totalValue || 0), 0);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      <Sidebar role="buyer" plan="basic" user={{ name: "Nirmala Devi" }} />

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div>
            <h1 className="text-3xl font-bold font-serif text-green-primary">My Purchase Orders</h1>
            <p className="text-sm text-gray-500 mt-1">Track crop orders purchased directly from farmers</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard label="Total Orders" value={`${orders.length} Orders`} icon="📦" />
            <StatCard label="Total Spent" value={formatINR(totalSpent)} icon="💰" />
            <StatCard label="Delivered Batches" value={`${orders.filter((o) => o.status === 'Delivered').length} Delivered`} icon="✅" />
          </div>

          <div className="bg-white rounded-2xl overflow-hidden shadow-xs border border-gray-100">
            <div className="p-6 border-b border-gray-50">
              <h2 className="text-lg font-bold text-gray-900 font-serif">Order History</h2>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No orders placed yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-medium">Order ID</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Farmer</th>
                      <th className="px-6 py-4 font-medium">Crop</th>
                      <th className="px-6 py-4 font-medium">Quantity</th>
                      <th className="px-6 py-4 font-medium">Price / kg</th>
                      <th className="px-6 py-4 font-medium">Total</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono font-medium text-gray-900">{order.id}</td>
                        <td className="px-6 py-4 text-gray-600">{order.date}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{order.farmerName}</td>
                        <td className="px-6 py-4 font-medium text-emerald-800">{order.cropType}</td>
                        <td className="px-6 py-4 text-gray-700">{order.quantityKg} kg</td>
                        <td className="px-6 py-4 text-gray-700">₹{order.agreedPrice}</td>
                        <td className="px-6 py-4 font-bold text-green-primary">{formatINR(order.totalValue)}</td>
                        <td className="px-6 py-4"><Badge status={order.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
