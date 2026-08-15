'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, getRoleRedirect } from '../../context/AuthContext';

export default function SignupPage() {
  const [selectedRole, setSelectedRole] = useState('farmer');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    company_name: '',
    agency_name: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setError(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // TODO (Production): Admin registration should require an invite code or manual approval.
    if (selectedRole === 'admin') {
      console.warn('TODO (Production): Admin self-registration requires invite code or super-admin approval.');
    }

    const payload = {
      role: selectedRole,
      name: formData.name,
      phone: selectedRole === 'farmer' ? formData.phone : undefined,
      email: selectedRole !== 'farmer' ? formData.email : undefined,
      password: selectedRole !== 'farmer' ? formData.password : undefined,
      company_name: selectedRole === 'buyer' ? formData.company_name : undefined,
      agency_name: selectedRole === 'insurance' ? formData.agency_name : undefined,
    };

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      login(data.user, data.token);
      const redirectPath = getRoleRedirect(data.user.role || selectedRole);
      router.push(redirectPath);
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Something went wrong during sign-up');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: 'farmer', title: 'Farmer', icon: '👨‍🌾', desc: 'Price forecasts, spoilage risk & marketplace' },
    { id: 'buyer', title: 'Buyer', icon: '🛒', desc: 'Direct produce sourcing & order management' },
    { id: 'insurance', title: 'Insurance Agency', icon: '🛡️', desc: 'Spoilage risk verification & claims audit' },
    { id: 'admin', title: 'Admin', icon: '⚙️', desc: 'Platform oversight & user management' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-900 to-slate-900 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-800/20">
        
        {/* Header */}
        <div className="bg-emerald-950 p-6 md:p-8 text-white text-center border-b border-emerald-800/30">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-600 rounded-2xl font-serif text-2xl font-bold mb-3 shadow-lg">
            FV
          </div>
          <h1 className="text-2xl md:text-3xl font-bold font-serif">Join FarmVision</h1>
          <p className="text-emerald-300 text-sm mt-1">Select your account interface to get started</p>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          
          {/* Step 1: Role Selection Cards */}
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-gray-500 mb-3">
              1. Choose User Interface Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((r) => {
                const isSelected = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRoleSelect(r.id)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/80 shadow-sm ring-2 ring-emerald-500/20'
                        : 'border-gray-200 hover:border-emerald-300 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{r.icon}</div>
                    <div>
                      <h3 className={`font-bold text-sm ${isSelected ? 'text-emerald-900' : 'text-gray-800'}`}>
                        {r.title}
                      </h3>
                      <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{r.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
              ⚠️ {error}
            </div>
          )}

          {/* Step 2: Role Specific Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="border-t border-gray-100 pt-4">
              <label className="block text-xs uppercase tracking-wider font-semibold text-gray-500 mb-3">
                2. Enter Account Details ({roles.find(r => r.id === selectedRole)?.title})
              </label>

              {/* Common Name Field */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all text-gray-900"
                />
              </div>

              {/* Farmer Fields */}
              {selectedRole === 'farmer' && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all text-gray-900"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Farmers sign in securely using mobile OTP verification.</p>
                </div>
              )}

              {/* Buyer / Insurance / Admin Email & Password */}
              {selectedRole !== 'farmer' && (
                <>
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Work Email</label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder={selectedRole === 'buyer' ? 'purchasing@freshmarket.in' : selectedRole === 'insurance' ? 'agent@agriprotect.org' : 'admin@farmvision.io'}
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all text-gray-900"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      name="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all text-gray-900"
                    />
                  </div>
                </>
              )}

              {/* Buyer Specific Fields */}
              {selectedRole === 'buyer' && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Company / Produce Business Name</label>
                  <input
                    type="text"
                    name="company_name"
                    placeholder="e.g. Tamil Nadu Fresh Foods Ltd"
                    value={formData.company_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all text-gray-900"
                  />
                </div>
              )}

              {/* Insurance Specific Fields */}
              {selectedRole === 'insurance' && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Insurance Agency / License ID</label>
                  <input
                    type="text"
                    name="agency_name"
                    placeholder="e.g. AgriProtect Spoilage Coverage Corp"
                    value={formData.agency_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-emerald-600/30 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all text-gray-900"
                  />
                </div>
              )}

              {/* Admin Note */}
              {selectedRole === 'admin' && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
                  ℹ️ <strong>Demo Admin Sign-Up</strong>: Self-registration for Admin role enabled for evaluation.
                  {/* TODO (Production): Admin registration should require an invite code or manual approval. */}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-base rounded-2xl shadow-lg transition-all active:scale-[0.98] cursor-pointer"
            >
              {loading ? 'Creating Account...' : `Register as ${roles.find(r => r.id === selectedRole)?.title}`}
            </button>
          </form>

          <div className="text-center border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="font-bold text-emerald-700 hover:underline">
                Sign In
              </Link>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
