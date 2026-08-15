'use client';

import React, { useState, useEffect } from 'react';
import { formatINR } from '../../utils/formatCurrency';
import Sidebar from '../../components/Sidebar';
import Badge from '../../components/Badge';
import { useAuth } from '../../context/AuthContext';

export default function BuyerDashboard() {
  const [filter, setFilter] = useState('ALL');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState(null);
  const [toast, setToast] = useState(null);
  
  // Subscription Gate Modal state
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [selectedFarmerModal, setSelectedFarmerModal] = useState(null);
  const [subscribing, setSubscribing] = useState(false);

  const { user, subscribeBuyer } = useAuth();
  const isSubscribed = user?.subscriptionStatus === 'active';

  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    fetch(`${API_BASE}/api/buyer/listings`)
      .then((res) => res.json())
      .then((data) => {
        setListings(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch marketplace listings:', err);
        setLoading(false);
      });
  }, []);

  const handleBuyOrder = async (item) => {
    setPurchasingId(item.id);
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      const res = await fetch(`${API_BASE}/api/buyer/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: item.id,
          crop_type: item.cropType || item.type,
          quantity_kg: item.quantityKg || 100,
          agreed_price_per_kg: item.price,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setToast(`Order placed successfully for ${item.cropType || item.type}! Check 'My Orders'.`);
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      console.error('Failed to place order:', err);
      alert('Failed to place order.');
    } finally {
      setPurchasingId(null);
    }
  };

  // Task 7: Mock Payment & Subscription Activation
  const handleMockSubscribe = async () => {
    setSubscribing(true);
    // TODO: Placeholder for Razorpay / Stripe payment gateway integration.
    console.log('TODO: Replace mock payment button with Razorpay / Stripe checkout modal.');
    try {
      await subscribeBuyer();
      setToast('🎉 Congratulations! Premium PRO Subscription activated successfully. Farmer contact details unlocked!');
      setShowSubscribeModal(false);
      setTimeout(() => setToast(null), 5000);
    } catch (err) {
      console.error('Subscription failed:', err);
      alert('Failed to activate subscription.');
    } finally {
      setSubscribing(false);
    }
  };

  const handleConnectClick = (item) => {
    if (!isSubscribed) {
      setShowSubscribeModal(true);
    } else {
      setSelectedFarmerModal(item);
    }
  };

  const filtered = filter === 'ALL'
    ? listings
    : listings.filter(l => (l.cropType || l.type || '').toUpperCase() === filter);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      <Sidebar role="buyer" plan={isSubscribed ? "premium" : "basic"} user={user || { name: "Nirmala Devi" }} />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold font-serif text-green-primary">Marketplace</h1>
              <p className="text-gray-500 mt-1">Discover fresh produce directly from local farmers</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {['ALL', 'PUMPKIN', 'POTATO', 'BEETROOT'].map(f => (
                <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
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

          {/* Task 7: Premium Subscription Banner */}
          <div className={`p-5 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs transition-all ${
            isSubscribed 
              ? 'bg-gradient-to-r from-emerald-900 to-green-800 text-white border-emerald-700' 
              : 'bg-gradient-to-r from-amber-500/10 via-amber-100/50 to-orange-50 text-amber-900 border-amber-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className="text-3xl">{isSubscribed ? '👑' : '🔒'}</div>
              <div>
                <h3 className="font-bold text-base">
                  {isSubscribed ? 'Premium PRO Subscription Active' : 'Unlock Direct Farmer Connections & Contact Info'}
                </h3>
                <p className="text-xs opacity-90">
                  {isSubscribed
                    ? 'You have unlimited access to farmer contact numbers, direct messaging, and priority negotiations.'
                    : 'Subscribed buyers get verified farmer mobile numbers, direct WhatsApp connectivity, and spoilage risk reports.'}
                </p>
              </div>
            </div>
            {!isSubscribed && (
              <button
                onClick={() => setShowSubscribeModal(true)}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl shadow-md transition-all whitespace-nowrap cursor-pointer"
              >
                Upgrade to PRO (₹499/mo)
              </button>
            )}
          </div>

          {toast && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium animate-in fade-in">
              ✅ {toast}
            </div>
          )}

          {loading ? (
            <div className="p-8 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
              Loading marketplace listings...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(item => (
                <div key={item.id} className="bg-white p-6 rounded-2xl shadow-xs hover:shadow-md transition-shadow border border-gray-100 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{item.cropType || item.type}</h2>
                      <p className="text-xs font-semibold text-gray-600 mt-0.5">Farmer: {item.farmer}</p>
                    </div>
                    {item.verified && (
                      <Badge status="Approved" />
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-500 mb-4 space-y-1">
                    <p className="flex items-center gap-2"><span>🕒</span> Harvested {item.daysPassed || item.days} days ago</p>
                    <p className="flex items-center gap-2"><span>📍</span> {item.distance || '10 km'} away</p>
                    <p className="flex items-center gap-2"><span>📦</span> {item.quantityKg} kg Available</p>
                  </div>

                  {/* Task 7: Gated Farmer Contact Details */}
                  <div className="mb-6 p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-500 font-medium">Farmer Contact:</span>
                      {isSubscribed ? (
                        <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded text-[10px]">UNLOCKED</span>
                      ) : (
                        <span className="text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded text-[10px]">PRO ONLY</span>
                      )}
                    </div>
                    {isSubscribed ? (
                      <p className="font-mono text-gray-900 font-bold text-sm">📞 +91 98765 43210</p>
                    ) : (
                      <p className="font-mono text-gray-400 font-bold text-sm select-none blur-[2px]">📞 +91 98765 *****</p>
                    )}
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-1">Asking Price</p>
                      <p className="text-2xl font-bold text-green-primary">
                        {formatINR(item.price)}
                        <span className="text-sm font-normal text-gray-500">/kg</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConnectClick(item)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          isSubscribed 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {isSubscribed ? '📞 Contact' : '🔒 Connect'}
                      </button>
                      <button
                        onClick={() => handleBuyOrder(item)}
                        disabled={purchasingId === item.id}
                        className="bg-green-primary hover:bg-emerald-800 text-white font-bold px-3 py-2 rounded-xl transition-colors text-xs shadow-xs cursor-pointer"
                      >
                        {purchasingId === item.id ? '...' : 'Buy'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
        </div>
      </main>

      {/* Task 7: Premium Subscription Gating Modal */}
      {showSubscribeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 space-y-6 shadow-2xl border border-gray-100">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-3xl mx-auto font-bold shadow-inner">
                👑
              </div>
              <h2 className="text-2xl font-bold font-serif text-gray-900">FarmVision Buyer PRO</h2>
              <p className="text-xs text-gray-500">Subscribe to connect directly with farmers & view verified phone numbers</p>
            </div>

            <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-100 space-y-3 text-xs text-amber-900">
              <div className="flex items-center gap-2 font-semibold text-sm text-amber-950">
                <span>✨ Included in Buyer PRO:</span>
              </div>
              <ul className="space-y-2 font-medium">
                <li className="flex items-center gap-2">✅ Direct 1-on-1 phone contact with all registered farmers</li>
                <li className="flex items-center gap-2">✅ Spoilage risk index report for every produce batch</li>
                <li className="flex items-center gap-2">✅ Priority order booking & direct price negotiation</li>
                <li className="flex items-center gap-2">✅ Unlimited marketplace farmer connections</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl text-center border border-gray-100">
              <p className="text-xs text-gray-400 uppercase font-semibold">Monthly Membership</p>
              <p className="text-3xl font-bold font-serif text-emerald-800 mt-1">₹499 <span className="text-xs font-sans text-gray-500 font-normal">/ month</span></p>
              <p className="text-[11px] text-gray-400 mt-1">Cancel or switch plans anytime</p>
            </div>

            {/* TODO Placeholder Note */}
            <p className="text-[11px] text-center text-gray-400 italic">
              {/* TODO: Placeholder for Razorpay / Stripe payment gateway integration. */}
              Demo Mock Payment: Clicking below will activate your subscription instantly.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubscribeModal(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition-colors cursor-pointer"
              >
                Maybe Later
              </button>
              <button
                onClick={handleMockSubscribe}
                disabled={subscribing}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl shadow-lg transition-all active:scale-[0.98] cursor-pointer"
              >
                {subscribing ? 'Activating...' : 'Subscribe Now (₹499)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connected Farmer Modal */}
      {selectedFarmerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Direct Connect</span>
                <h3 className="text-xl font-bold text-gray-900 font-serif">{selectedFarmerModal.farmer}</h3>
                <p className="text-xs text-gray-500">{selectedFarmerModal.cropType} Listing</p>
              </div>
              <button
                onClick={() => setSelectedFarmerModal(null)}
                className="text-gray-400 hover:text-gray-700 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Phone Number:</span>
                <span className="font-mono font-bold text-emerald-900 text-sm">+91 98765 43210</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Location:</span>
                <span className="font-semibold text-gray-800">Thanjavur ({selectedFarmerModal.distance})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Produce Volume:</span>
                <span className="font-semibold text-gray-800">{selectedFarmerModal.quantityKg} kg</span>
              </div>
            </div>

            <a
              href="tel:+919876543210"
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              📞 Call Farmer Directly
            </a>
          </div>
        </div>
      )}

    </div>
  );
}
