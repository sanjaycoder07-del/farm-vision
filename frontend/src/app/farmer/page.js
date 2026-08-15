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
  const [errorMsg, setErrorMsg] = useState(null);

  const handleLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setFormData(f => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude }));
          setErrorMsg(null);
        },
        err => {
          console.warn("Geolocation warning:", err);
          // Fallback location (e.g. Chennai / Tamil Nadu farming hub)
          setFormData(f => ({ ...f, lat: 13.0827, lng: 80.2707 }));
          alert("Could not retrieve precise location. Using regional farm location (13.08° N, 80.27° E).");
        }
      );
    } else {
      // Default fallback
      setFormData(f => ({ ...f, lat: 13.0827, lng: 80.2707 }));
      alert("Geolocation not supported. Default regional location set.");
    }
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (formData.lat === null || formData.lng === null) {
      // Auto-set default location if not yet captured
      setFormData(f => ({ ...f, lat: 13.0827, lng: 80.2707 }));
    }

    setIsAnalyzing(true);
    setErrorMsg(null);

    const payload = {
      crop_type: formData.cropType,
      days_passed: parseInt(formData.daysPassed) || 0,
      latitude: formData.lat || 13.0827,
      longitude: formData.lng || 80.2707
    };

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    try {
      const res = await fetch(`${API_BASE_URL}/api/predict-optimal-sale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("FastAPI Backend fetch failed:", err);
      setErrorMsg(`Failed to connect to FastAPI backend at ${API_BASE_URL}. Ensure backend is running.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      <Sidebar role="farmer" plan="premium" user={{ name: "Murugesan Selvam" }} />

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">

          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold font-serif text-green-primary">AI Optimal Selling Portal</h1>
              <p className="text-sm text-gray-500 mt-1">Dual ML model price prediction & spoilage risk analysis engine</p>
            </div>
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
                  min="0"
                  max="60"
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
                {formData.lat ? `📍 Location Captured (${formData.lat.toFixed(2)}°, ${formData.lng.toFixed(2)}°)` : '📍 Auto-Capture GPS Location'}
              </button>

              <button
                type="submit"
                disabled={isAnalyzing}
                className="w-full bg-green-primary hover:bg-emerald-800 text-white font-bold text-lg py-4 rounded-xl shadow-md transition-all active:scale-[0.98]"
              >
                {isAnalyzing ? 'Running ML Decision Engine...' : 'Calculate Optimal Selling Time'}
              </button>
            </form>
          </div>

          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
              ⚠️ {errorMsg}
            </div>
          )}

          {result && (
            <div className="space-y-6 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 font-serif">ML Analysis Results</h2>
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  result.recommended_action.includes('HOLD') 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {result.recommended_action}
                </span>
              </div>

              {/* Recommendation Banner */}
              <div className="bg-gradient-to-r from-emerald-900 to-green-800 text-white p-6 rounded-2xl shadow-md space-y-2">
                <div className="text-xs uppercase font-semibold text-emerald-200 tracking-wider">AI Selling Recommendation</div>
                <div className="text-2xl font-bold font-serif">{result.recommended_action}</div>
                <p className="text-sm text-emerald-100 leading-relaxed">{result.decision_rationale}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                  label="Optimal Sale Date"
                  value={result.optimal_selling_date}
                  icon="📅"
                />
                <StatCard
                  label="Spoilage Risk"
                  value={`${result.risk_level_percentage}%`}
                  icon="⚠️"
                />
                <StatCard
                  label="Safe Storage Days"
                  value={`${result.safe_hold_window_days} days`}
                  icon="📦"
                />
              </div>

              {/* Ambient Weather Info */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex flex-wrap justify-between items-center text-sm text-emerald-900">
                <div className="flex items-center gap-2">
                  <span>🌡️ Ambient Temp: <strong>{result.current_temperature}°C</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span>💧 Humidity: <strong>{result.current_humidity}%</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🌾 Base Shelf Life: <strong>{result.baseline_shelf_life_days} days</strong></span>
                </div>
              </div>

              {/* Price Forecast Chart */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800">14-Day Commodity Price Forecast</h3>
                  {result.projected_price_gain_pct > 0 && (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      +{result.projected_price_gain_pct}% Max Gain
                    </span>
                  )}
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={result.predicted_price_trend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(val) => `₹${val}`} width={45} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        formatter={(value) => [formatINR(value), "Predicted Price"]}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Line type="monotone" dataKey="price" stroke="#1a6b3a" strokeWidth={3} dot={{ r: 4, fill: '#1a6b3a', strokeWidth: 2, stroke: '#fff' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg py-4 rounded-xl shadow-md transition-all active:scale-[0.98]">
                List Produce on Marketplace Now
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

