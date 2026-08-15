'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import StatCard from '../../../components/StatCard';
import Badge from '../../../components/Badge';
import { formatINR } from '../../../utils/formatCurrency';

export default function FarmerInsurancePage() {
  const [insurance, setInsurance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    fetch(`${API_BASE}/api/farmer/insurance`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setInsurance(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch insurance details:', err);
        setError('Failed to connect to insurance backend service.');
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      <Sidebar role="farmer" plan="premium" user={{ name: "Murugesan Selvam" }} />

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div>
            <h1 className="text-3xl font-bold font-serif text-green-primary">Insurance Policy Overview</h1>
            <p className="text-sm text-gray-500 mt-1">Manage crop spoilage insurance coverage and protect farm yields</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
              ⚠️ {error}
            </div>
          )}

          {loading ? (
            <div className="p-8 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
              Loading insurance policy...
            </div>
          ) : insurance ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StatCard label="Max Policy Coverage" value={formatINR(insurance.maxCoverageLimit)} sub="Per season cap" icon="🛡️" />
                <StatCard label="Active Claims" value={`${insurance.activeClaimsCount} Claims`} sub="Pending verification" icon="📋" />
                <StatCard label="Policy Status" value={insurance.status} sub="Verified & Active" icon="✅" />
              </div>

              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xs border border-gray-100 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 gap-2">
                  <div>
                    <span className="text-xs uppercase font-bold text-gray-400">Policy Identifier</span>
                    <h2 className="text-2xl font-bold text-gray-900 font-serif">{insurance.policyNumber}</h2>
                  </div>
                  <Badge status="Active" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="space-y-3">
                    <p className="text-gray-500 font-medium">Plan Name</p>
                    <p className="text-lg font-bold text-emerald-800">{insurance.planName}</p>
                  </div>
                  <div className="space-y-3">
                    <p className="text-gray-500 font-medium">Covered Crop Types</p>
                    <div className="flex gap-2 flex-wrap">
                      {insurance.coveredCrops.map((c) => (
                        <span key={c} className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                          🌾 {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
                  <a
                    href="/farmer/claims"
                    className="bg-green-primary hover:bg-emerald-800 text-white font-semibold px-6 py-3 rounded-xl text-center text-sm transition-colors shadow-xs"
                  >
                    File a Spoilage Claim
                  </a>
                </div>
              </div>
            </>
          ) : null}

        </div>
      </main>
    </div>
  );
}
