'use client';
import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatINR } from '../../utils/formatCurrency';
import Sidebar from '../../components/Sidebar';
import StatCard from '../../components/StatCard';

export default function FarmerDashboard() {
  const [formData, setFormData] = useState({ cropType: 'Pumpkin', daysPassed: '', lat: null, lng: null });
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(pos => {
        setFormData(f => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude }));
      });
    } else {
      alert('Geolocation not supported');
    }
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (!formData.lat || !formData.lng) {
      alert("Please capture location first.");
      return;
    }

    setIsAnalyzing(true);
    // Simulate API Call
    setTimeout(() => {
      setResult({
        riskLevel: 30,
        optimalDate: '2026-08-20',
        trend: [
          { date: 'Aug 15', price: 25.50 }, { date: 'Aug 17', price: 28.10 },
          { date: 'Aug 19', price: 32.00 }, { date: 'Aug 21', price: 30.50 }
        ]
      });
      setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      <Sidebar role="farmer" plan="premium" user={{ name: "Murugesan Selvam" }} />

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">

          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold font-serif text-green-primary">AI Prediction Portal</h1>
            <button className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-xl text-sm font-semibold border border-emerald-200">
              EN / LO
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <form onSubmit={submitForm} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Crop Type</label>
                <select
                  value={formData.cropType}
                  onChange={e => setFormData({ ...formData, cropType: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:border-green-primary focus:ring-1 focus:ring-green-primary outline-none transition-all text-gray-900"
                >
                  <option>Pumpkin</option>
                  <option>Potato</option>
                  <option>Beetroot</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Days Since Harvest</label>
                <input
                  type="number"
                  placeholder="e.g. 3"
                  value={formData.daysPassed}
                  onChange={e => setFormData({ ...formData, daysPassed: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:border-green-primary focus:ring-1 focus:ring-green-primary outline-none transition-all text-gray-900"
                  required
                />
              </div>

              <button
                type="button"
                onClick={handleLocation}
                className={`w-full p-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${formData.lat ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {formData.lat ? '📍 Location Captured' : '📍 Auto-Capture GPS Location'}
              </button>

              <button
                type="submit"
                disabled={isAnalyzing}
                className="w-full bg-green-primary hover:bg-emerald-800 text-white font-bold text-lg py-4 rounded-xl shadow-md transition-all active:scale-[0.98]"
              >
                {isAnalyzing ? 'Analyzing Risk...' : 'Get Optimal Selling Time'}
              </button>
            </form>
          </div>

          {result && (
            <div className="space-y-6 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-bold text-gray-900 font-serif">Analysis Results</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatCard
                  label="Optimal Sale Date"
                  value={result.optimalDate}
                  icon="📅"
                />
                <StatCard
                  label="Spoilage Risk"
                  value={`${result.riskLevel}%`}
                  icon="⚠️"
                />
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-700 mb-6">14-Day Price Forecast</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={result.trend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(val) => `₹${val}`} width={40} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        formatter={(value) => [formatINR(value), "Predicted"]}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Line type="monotone" dataKey="price" stroke="#1a6b3a" strokeWidth={3} dot={{ r: 4, fill: '#1a6b3a', strokeWidth: 2, stroke: '#fff' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg py-4 rounded-xl shadow-md transition-all active:scale-[0.98]">
                List on Marketplace Now
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
