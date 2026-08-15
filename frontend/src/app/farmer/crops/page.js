'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '../../../components/Sidebar';
import StatCard from '../../../components/StatCard';
import Badge from '../../../components/Badge';
import { formatINR } from '../../../utils/formatCurrency';

export default function MyCropsPage() {
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Initial state for farm crop inventory dataset
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state for adding new harvest batch
  const [newCrop, setNewCrop] = useState({
    cropType: 'Pumpkin',
    plotName: '',
    quantityKg: '',
    daysPassed: '0',
    grade: 'Grade A+',
  });

  const fetchCrops = () => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    fetch(`${API_BASE}/api/crops`)
      .then((res) => res.json())
      .then((data) => {
        setCrops(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch crops from backend:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCrops();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleAddCrop = async (e) => {
    e.preventDefault();
    if (!newCrop.plotName || !newCrop.quantityKg) {
      alert('Please fill out all required fields.');
      return;
    }

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      const res = await fetch(`${API_BASE}/api/crops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crop_type: newCrop.cropType,
          plot_name: newCrop.plotName,
          quantity_kg: parseFloat(newCrop.quantityKg) || 100,
          days_passed: parseInt(newCrop.daysPassed) || 0,
          grade: newCrop.grade,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const createdBatch = await res.json();
      setShowAddModal(false);
      setNewCrop({
        cropType: 'Pumpkin',
        plotName: '',
        quantityKg: '',
        daysPassed: '0',
        grade: 'Grade A+',
      });
      showToast(`Successfully added crop batch ${createdBatch.id} (${createdBatch.cropType})!`);
      fetchCrops();
    } catch (err) {
      console.error('Error adding crop:', err);
      alert('Failed to add crop to backend.');
    }
  };

  const handleDeleteCrop = async (cropId) => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      const res = await fetch(`${API_BASE}/api/crops/${cropId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast(`Crop ${cropId} removed successfully`);
      fetchCrops();
    } catch (err) {
      console.error('Failed to delete crop:', err);
      alert('Failed to delete crop.');
    }
  };

  const filteredCrops = crops.filter((crop) => {
    const matchesFilter = filter === 'ALL' || crop.cropType.toUpperCase() === filter;
    const matchesSearch =
      crop.cropType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crop.plotName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crop.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalBatches = crops.length;
  const totalQuantity = crops.reduce((acc, c) => acc + c.quantityKg, 0);
  const totalEstimatedValue = crops.reduce((acc, c) => acc + c.quantityKg * c.estimatedPricePerKg, 0);
  const avgSpoilageRisk = crops.length > 0 ? Math.round(crops.reduce((acc, c) => acc + c.spoilageRiskPct, 0) / crops.length) : 0;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      <Sidebar role="farmer" plan="premium" user={{ name: "Murugesan Selvam" }} />

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold font-serif text-green-primary">My Crop Inventory</h1>
              <p className="text-sm text-gray-500 mt-1">
                Monitor harvest batches, track spoilage risks, and connect with AI price prediction.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-green-primary hover:bg-emerald-800 text-white font-semibold px-5 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 text-sm cursor-pointer"
            >
              <span>➕</span> Add Harvest Batch
            </button>
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium animate-in fade-in flex justify-between items-center shadow-xs">
              <span>✅ {toastMessage}</span>
              <button onClick={() => setToastMessage(null)} className="text-emerald-600 hover:text-emerald-900 font-bold ml-4">✕</button>
            </div>
          )}

          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Crop Batches"
              value={`${totalBatches} Batches`}
              sub={`${totalQuantity.toLocaleString()} kg Total Yield`}
              icon="🌾"
            />
            <StatCard
              label="Portfolio Market Value"
              value={formatINR(totalEstimatedValue)}
              sub="Based on live market estimates"
              icon="💰"
            />
            <StatCard
              label="Avg Spoilage Risk"
              value={`${avgSpoilageRisk}%`}
              sub={avgSpoilageRisk > 40 ? "Needs Attention" : "Optimal Conditions"}
              icon="⚠️"
            />
            <StatCard
              label="Active Harvest Plots"
              value={`${new Set(crops.map(c => c.plotName)).size} Fields`}
              sub="Tamil Nadu Farming Hub"
              icon="📍"
            />
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex gap-2 flex-wrap w-full md:w-auto">
              {['ALL', 'PUMPKIN', 'POTATO', 'BEETROOT'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    filter === f
                      ? 'bg-green-primary text-white shadow-xs'
                      : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-emerald-50 hover:text-emerald-800'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="w-full md:w-72">
              <input
                type="text"
                placeholder="Search plot or crop..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:border-green-primary focus:ring-1 focus:ring-green-primary outline-none transition-all text-gray-900"
              />
            </div>
          </div>

          {/* Crop Batches Grid */}
          {filteredCrops.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center space-y-3">
              <span className="text-4xl">🌱</span>
              <h3 className="text-lg font-bold text-gray-800">No Crop Batches Found</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                No crops match your current search criteria or filter. Try adjusting your query or click &quot;Add Harvest Batch&quot;.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {filteredCrops.map((crop) => (
                <div
                  key={crop.id}
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Title & Badges */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold text-gray-900">{crop.cropType}</h2>
                          <span className="text-xs font-mono text-gray-400">({crop.id})</span>
                        </div>
                        <p className="text-xs font-medium text-gray-500 flex items-center gap-1 mt-0.5">
                          <span>📍</span> {crop.plotName}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge status={crop.grade} />
                        <Badge status={crop.riskLevel} />
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2 py-4 my-3 border-y border-gray-100 bg-gray-50/50 rounded-xl px-3 text-xs">
                      <div>
                        <p className="text-gray-400 font-medium">Days Post-Harvest</p>
                        <p className="font-bold text-gray-800 text-sm mt-0.5">{crop.daysPassed} days</p>
                      </div>
                      <div>
                        <p className="text-gray-400 font-medium">Safe Hold Window</p>
                        <p className={`font-bold text-sm mt-0.5 ${crop.safeStorageDays <= 5 ? 'text-amber-600' : 'text-emerald-700'}`}>
                          {crop.safeStorageDays} days left
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 font-medium">Spoilage Risk</p>
                        <p className={`font-bold text-sm mt-0.5 ${crop.spoilageRiskPct >= 60 ? 'text-red-600' : crop.spoilageRiskPct >= 30 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {crop.spoilageRiskPct}%
                        </p>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="flex justify-between items-center mb-4 text-sm">
                      <div>
                        <span className="text-xs text-gray-400 block">Harvest Quantity</span>
                        <span className="font-semibold text-gray-900">{crop.quantityKg.toLocaleString()} kg</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-400 block">Est. Market Value</span>
                        <span className="font-bold text-green-primary text-base">
                          {formatINR(crop.quantityKg * crop.estimatedPricePerKg)}
                        </span>
                        <span className="text-[11px] text-gray-400 block">(@ ₹{crop.estimatedPricePerKg}/kg)</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-2 justify-between items-center">
                    <Link
                      href="/farmer"
                      className="flex-1 bg-green-primary hover:bg-emerald-800 text-white font-semibold py-2.5 px-3 rounded-xl text-xs text-center transition-colors shadow-xs"
                    >
                      📈 Run AI Selling Analysis
                    </Link>
                    <button
                      onClick={() => showToast(`Batch ${crop.id} ready to list on Marketplace`)}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold py-2.5 px-3 rounded-xl text-xs transition-colors"
                    >
                      🛒 List
                    </button>
                    <button
                      onClick={() => handleDeleteCrop(crop.id)}
                      className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold py-2.5 px-3 rounded-xl text-xs transition-colors"
                      title="Remove crop batch"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Crop Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                  <h3 className="text-xl font-bold font-serif text-green-primary">Record New Harvest Batch</h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-gray-700 text-lg cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddCrop} className="space-y-4 text-sm">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Crop Type</label>
                    <select
                      value={newCrop.cropType}
                      onChange={(e) => setNewCrop({ ...newCrop, cropType: e.target.value })}
                      className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:border-green-primary outline-none text-gray-900"
                    >
                      <option>Pumpkin</option>
                      <option>Potato</option>
                      <option>Beetroot</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Plot / Field Name</label>
                    <input
                      type="text"
                      placeholder="e.g. North Plot - Section B"
                      value={newCrop.plotName}
                      onChange={(e) => setNewCrop({ ...newCrop, plotName: e.target.value })}
                      className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:border-green-primary outline-none text-gray-900"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Quantity (kg)</label>
                      <input
                        type="number"
                        placeholder="e.g. 500"
                        min="10"
                        value={newCrop.quantityKg}
                        onChange={(e) => setNewCrop({ ...newCrop, quantityKg: e.target.value })}
                        className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:border-green-primary outline-none text-gray-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Days Since Harvest</label>
                      <input
                        type="number"
                        placeholder="e.g. 2"
                        min="0"
                        value={newCrop.daysPassed}
                        onChange={(e) => setNewCrop({ ...newCrop, daysPassed: e.target.value })}
                        className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:border-green-primary outline-none text-gray-900"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Quality Grade</label>
                    <select
                      value={newCrop.grade}
                      onChange={(e) => setNewCrop({ ...newCrop, grade: e.target.value })}
                      className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:border-green-primary outline-none text-gray-900"
                    >
                      <option>Grade A+</option>
                      <option>Grade A</option>
                      <option>Grade B</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="w-1/2 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 py-3 bg-green-primary text-white rounded-xl font-semibold hover:bg-emerald-800 transition-colors shadow-xs"
                    >
                      Save Harvest
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
