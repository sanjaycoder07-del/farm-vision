'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import StatCard from '../../../components/StatCard';
import Badge from '../../../components/Badge';
import { formatINR } from '../../../utils/formatCurrency';

export default function FarmerClaimsPage() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newClaim, setNewClaim] = useState({ listingId: 'CRP-101', spoilageReason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchClaims = () => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    fetch(`${API_BASE}/api/farmer/claims`)
      .then((res) => res.json())
      .then((data) => {
        setClaims(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch claims:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleCreateClaim = async (e) => {
    e.preventDefault();
    if (!newClaim.spoilageReason.trim()) return;

    setSubmitting(true);
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    try {
      const res = await fetch(`${API_BASE}/api/farmer/claims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: newClaim.listingId,
          spoilage_reason: newClaim.spoilageReason,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setShowModal(false);
      setNewClaim({ listingId: 'CRP-101', spoilageReason: '' });
      setToast('Spoilage insurance claim submitted successfully!');
      setTimeout(() => setToast(null), 4000);
      fetchClaims();
    } catch (err) {
      console.error('Error submitting claim:', err);
      alert('Failed to submit claim. Ensure backend is running.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      <Sidebar role="farmer" plan="premium" user={{ name: "Murugesan Selvam" }} />

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold font-serif text-green-primary">My Spoilage Claims</h1>
              <p className="text-sm text-gray-500 mt-1">Track insurance claims and submit evidence for spoiled crops</p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-green-primary hover:bg-emerald-800 text-white font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-colors text-sm"
            >
              ➕ File New Claim
            </button>
          </div>

          {toast && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium animate-in fade-in">
              ✅ {toast}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard label="Total Claims Filed" value={`${claims.length} Claims`} icon="📋" />
            <StatCard
              label="Pending Review"
              value={`${claims.filter((c) => c.status !== 'Approved' && c.status !== 'Rejected').length} Pending`}
              icon="⏳"
            />
            <StatCard
              label="Total Approved"
              value={formatINR(claims.filter((c) => c.status === 'Approved').reduce((acc, c) => acc + (c.claimedAmount || 0), 0))}
              icon="💰"
            />
          </div>

          <div className="bg-white rounded-2xl overflow-hidden shadow-xs border border-gray-100">
            <div className="p-6 border-b border-gray-50">
              <h2 className="text-lg font-bold text-gray-900 font-serif">Claims History</h2>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading claims...</div>
            ) : claims.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No claims submitted yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-medium">Claim ID</th>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Listing ID</th>
                      <th className="px-6 py-4 font-medium">Crop</th>
                      <th className="px-6 py-4 font-medium">Spoilage Reason</th>
                      <th className="px-6 py-4 font-medium">Claim Value</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {claims.map((claim) => (
                      <tr key={claim.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono font-medium text-gray-900">{claim.id}</td>
                        <td className="px-6 py-4 text-gray-600">{claim.claimDate}</td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-500">{claim.listingId}</td>
                        <td className="px-6 py-4 font-semibold text-emerald-800">{claim.crop}</td>
                        <td className="px-6 py-4 text-gray-700 max-w-xs truncate">{claim.spoilageReason}</td>
                        <td className="px-6 py-4 font-bold text-green-primary">{formatINR(claim.claimedAmount || 8000)}</td>
                        <td className="px-6 py-4"><Badge status={claim.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* New Claim Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                  <h3 className="text-xl font-bold font-serif text-green-primary">Submit Spoilage Claim</h3>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700 text-lg">✕</button>
                </div>

                <form onSubmit={handleCreateClaim} className="space-y-4 text-sm">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Select Crop Batch Listing</label>
                    <select
                      value={newClaim.listingId}
                      onChange={(e) => setNewClaim({ ...newClaim, listingId: e.target.value })}
                      className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:border-green-primary outline-none text-gray-900"
                    >
                      <option value="CRP-101">CRP-101 (Pumpkin - North Field)</option>
                      <option value="CRP-102">CRP-102 (Potato - South River Plot)</option>
                      <option value="CRP-103">CRP-103 (Beetroot - East Field)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Spoilage Reason & Evidence Description</label>
                    <textarea
                      rows="4"
                      placeholder="Describe heatwave, storage damage, or humidity moisture seepage..."
                      value={newClaim.spoilageReason}
                      onChange={(e) => setNewClaim({ ...newClaim, spoilageReason: e.target.value })}
                      className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:border-green-primary outline-none text-gray-900 resize-none"
                      required
                    ></textarea>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="w-1/2 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-1/2 py-3 bg-green-primary text-white rounded-xl font-semibold hover:bg-emerald-800 transition-colors shadow-xs"
                    >
                      {submitting ? 'Submitting...' : 'Submit Claim'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
