'use client';
import React, { useState } from 'react';
import { formatINR } from '../../utils/formatCurrency';
import Sidebar from '../../components/Sidebar';
import Badge from '../../components/Badge';

export default function BuyerDashboard() {
  const [filter, setFilter] = useState('ALL');
  
  const listings = [
    { id: 1, type: 'Potato', price: 18.5, days: 2, distance: '12km', verified: true },
    { id: 2, type: 'Pumpkin', price: 42.0, days: 5, distance: '4km', verified: false },
    { id: 3, type: 'Beetroot', price: 25.0, days: 1, distance: '25km', verified: true },
  ];

  const filtered = filter === 'ALL' ? listings : listings.filter(l => l.type.toUpperCase() === filter);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      <Sidebar role="buyer" plan="basic" user={{ name: "Nirmala Devi" }} />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold font-serif text-green-primary">Marketplace</h1>
              <p className="text-gray-500 mt-1">Discover fresh produce from local farmers</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {['ALL', 'PUMPKIN', 'POTATO', 'BEETROOT'].map(f => (
                <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filter === f 
                      ? 'bg-green-primary text-white shadow-sm' 
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-emerald-50 hover:text-emerald-800'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(item => (
              <div key={item.id} className="bg-white p-6 rounded-2xl shadow-xs hover:shadow-md transition-shadow border border-gray-100 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-gray-900">{item.type}</h2>
                  {item.verified && (
                     <Badge status="Approved" />
                  )}
                </div>
                
                <div className="text-sm text-gray-500 mb-6 space-y-1">
                  <p className="flex items-center gap-2"><span>🕒</span> Harvested {item.days} days ago</p>
                  <p className="flex items-center gap-2"><span>📍</span> {item.distance} away</p>
                </div>
                
                <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-1">Asking Price</p>
                    <p className="text-2xl font-bold text-green-primary">
                      {formatINR(item.price)}
                      <span className="text-sm font-normal text-gray-500">/kg</span>
                    </p>
                  </div>
                  <button className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold px-4 py-2 rounded-xl transition-colors text-sm border border-emerald-200">
                    Contact
                  </button>
                </div>
              </div>
            ))}
          </div>
          
        </div>
      </main>
    </div>
  );
}
