'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import Badge from '../../../components/Badge';

export default function BuyerProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    fetch(`${API_BASE}/api/buyer/profile`)
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch buyer profile:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      <Sidebar role="buyer" plan="basic" user={{ name: profile?.name || "Nirmala Devi" }} />

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div>
            <h1 className="text-3xl font-bold font-serif text-green-primary">Buyer Profile</h1>
            <p className="text-sm text-gray-500 mt-1">Manage business information and procurement settings</p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
              Loading profile...
            </div>
          ) : profile ? (
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xs border border-gray-100 space-y-6">
              <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                <div className="w-16 h-16 rounded-full bg-green-primary text-white font-bold text-xl flex items-center justify-center">
                  ND
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 font-serif">{profile.name}</h2>
                  <p className="text-sm text-gray-500">{profile.role} • {profile.businessName}</p>
                </div>
                <div className="ml-auto">
                  <Badge status="Active" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <label className="block text-gray-400 font-medium mb-1">Business Name</label>
                  <p className="font-semibold text-gray-800">{profile.businessName}</p>
                </div>
                <div>
                  <label className="block text-gray-400 font-medium mb-1">Phone Number</label>
                  <p className="font-semibold text-gray-800">{profile.phone}</p>
                </div>
                <div>
                  <label className="block text-gray-400 font-medium mb-1">Email Address</label>
                  <p className="font-semibold text-gray-800">{profile.email}</p>
                </div>
                <div>
                  <label className="block text-gray-400 font-medium mb-1">Primary Delivery Complex</label>
                  <p className="font-semibold text-gray-800">{profile.deliveryAddress}</p>
                </div>
              </div>
            </div>
          ) : null}

        </div>
      </main>
    </div>
  );
}
