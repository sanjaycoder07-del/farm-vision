'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import StatCard from '../../../components/StatCard';

export default function AdminReportsPage() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    fetch(`${API_BASE}/api/admin/reports`)
      .then((res) => res.json())
      .then((data) => {
        setReports(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch admin reports:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      <Sidebar role="admin" plan="basic" user={{ name: "Admin User" }} />

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div>
            <h1 className="text-3xl font-bold font-serif text-green-primary">System Analytics & Reports</h1>
            <p className="text-sm text-gray-500 mt-1">Platform health, market volume analytics, and insurance performance</p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
              Loading analytics reports...
            </div>
          ) : reports ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Spoilage Risk Index" value={reports.spoilageRiskIndex} icon="⚠️" />
                <StatCard label="Top Traded Commodity" value={reports.topTradedCrop} icon="🌾" />
                <StatCard label="Insurance Claim Rate" value={reports.insuranceClaimRate} icon="🛡️" />
                <StatCard label="System Status" value="Operational" sub={reports.systemHealth} icon="⚡" />
              </div>

              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xs border border-gray-100 space-y-4">
                <h2 className="text-xl font-bold text-gray-900 font-serif">Platform Performance Summary</h2>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex justify-between items-center">
                    <span>ML Spoilage & Price Prediction Engine</span>
                    <span className="font-bold text-emerald-800">Healthy (200 OK)</span>
                  </div>
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex justify-between items-center">
                    <span>FastAPI Application Gateways</span>
                    <span className="font-bold text-emerald-800">127.0.0.1:8000</span>
                  </div>
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex justify-between items-center">
                    <span>Next.js Client Dashboards</span>
                    <span className="font-bold text-emerald-800">localhost:3000</span>
                  </div>
                </div>
              </div>
            </>
          ) : null}

        </div>
      </main>
    </div>
  );
}
