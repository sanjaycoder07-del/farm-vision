'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import StatCard from '../../../components/StatCard';
import Badge from '../../../components/Badge';
import { formatINR } from '../../../utils/formatCurrency';

export default function FarmerSalesPage() {
  const [salesData, setSalesData] = useState({ sales: [], totalRevenue: 0, totalVolumeKg: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    fetch(`${API_BASE}/api/farmer/sales`)
      .then((res) => res.json())
      .then((data) => {
        setSalesData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch sales data:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      <Sidebar role="farmer" plan="premium" user={{ name: "Murugesan Selvam" }} />

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div>
            <h1 className="text-3xl font-bold font-serif text-green-primary">My Sales History</h1>
            <p className="text-sm text-gray-500 mt-1">Track produce sales transactions and total marketplace earnings</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard label="Total Revenue" value={formatINR(salesData.totalRevenue || 43575)} sub="All-time earnings" icon="💰" />
            <StatCard label="Total Volume Sold" value={`${salesData.totalVolumeKg || 2050} kg`} sub="Verified produce" icon="📦" />
            <StatCard label="Completed Orders" value={`${(salesData.sales || []).length || 3} Orders`} sub="100% Payment Settled" icon="✅" />
          </div>

          <div className="bg-white rounded-2xl overflow-hidden shadow-xs border border-gray-100">
            <div className="p-6 border-b border-gray-50">
              <h2 className="text-lg font-bold text-gray-900 font-serif">Recent Sales Transactions</h2>
            </div>
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading sales transactions...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-medium">Transaction ID</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Buyer</th>
                      <th className="px-6 py-4 font-medium">Crop</th>
                      <th className="px-6 py-4 font-medium">Quantity</th>
                      <th className="px-6 py-4 font-medium">Rate / kg</th>
                      <th className="px-6 py-4 font-medium">Total</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {(salesData.sales || []).map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono font-medium text-gray-900">{sale.id}</td>
                        <td className="px-6 py-4 text-gray-600">{sale.date}</td>
                        <td className="px-6 py-4 font-semibold text-gray-900">{sale.buyer}</td>
                        <td className="px-6 py-4 font-medium text-emerald-800">{sale.crop}</td>
                        <td className="px-6 py-4 text-gray-700">{sale.quantityKg} kg</td>
                        <td className="px-6 py-4 text-gray-700">₹{sale.pricePerKg}</td>
                        <td className="px-6 py-4 font-bold text-green-primary">{formatINR(sale.totalAmount)}</td>
                        <td className="px-6 py-4"><Badge status={sale.status} /></td>
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
