'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, getRoleRedirect } from '../../context/AuthContext';

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState('farmer');
  
  // Farmer OTP state
  const [phone, setPhone] = useState('+91 98765 43210');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [demoOtp, setDemoOtp] = useState(null);

  // Email/Password state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  // Cooldown countdown timer effect
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRoleTab = (role) => {
    setSelectedRole(role);
    setError(null);
    setToast(null);
    if (role === 'buyer') setEmail('nirmala@freshmarket.in');
    else if (role === 'insurance') setEmail('rajesh@agriprotect.org');
    else if (role === 'admin') setEmail('admin@farmvision.io');
    setPassword('password123');
  };

  // Task 2: Farmer Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!phone) {
      setError('Please enter your mobile phone number.');
      return;
    }
    if (cooldown > 0) return;

    setError(null);
    setLoading(true);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    try {
      const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Failed to send OTP');
      }

      setOtpSent(true);
      setCooldown(data.cooldown_seconds || 60);
      setDemoOtp(data.demo_otp || '123456');
      setToast(`OTP code sent! (Demo Code: ${data.demo_otp || '123456'})`);
    } catch (err) {
      console.error('Send OTP error:', err);
      setError(err.message || 'Error requesting OTP');
    } finally {
      setLoading(false);
    }
  };

  // Task 2: Farmer Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    setError(null);
    setLoading(true);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: otpCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Invalid OTP verification');
      }

      login(data.user, data.token);
      router.push('/farmer');
    } catch (err) {
      console.error('Verify OTP error:', err);
      setError(err.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  // Tasks 3, 4, 5: Password Login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      login(data.user, data.token);
      const redirectPath = getRoleRedirect(data.user.role || selectedRole);
      router.push(redirectPath);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  const roleTabs = [
    { id: 'farmer', label: 'Farmer', icon: '👨‍🌾' },
    { id: 'buyer', label: 'Buyer', icon: '🛒' },
    { id: 'insurance', label: 'Insurance Agency', icon: '🛡️' },
    { id: 'admin', label: 'Admin', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-green-900 to-slate-900 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-800/20">
        
        {/* Brand Header */}
        <div className="bg-emerald-950 p-6 md:p-8 text-white text-center border-b border-emerald-800/30">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-600 rounded-2xl font-serif text-2xl font-bold mb-3 shadow-lg">
            FV
          </div>
          <h1 className="text-2xl font-bold font-serif">Sign In to FarmVision</h1>
          <p className="text-emerald-300 text-xs mt-1">Select your interface role to sign in</p>
        </div>

        {/* Role Tabs */}
        <div className="grid grid-cols-4 bg-gray-100 p-1 border-b border-gray-200">
          {roleTabs.map((tab) => {
            const isActive = selectedRole === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleRoleTab(tab.id)}
                className={`py-3 px-1 text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  isActive
                    ? 'bg-white font-bold text-emerald-900 shadow-xs rounded-xl'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <span className="text-base">{tab.icon}</span>
                <span className="text-[11px] truncate w-full">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6 md:p-8 space-y-5">

          {toast && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
              ✅ {toast}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
              ⚠️ {error}
            </div>
          )}

          {/* Task 2: Farmer Phone + OTP Flow */}
          {selectedRole === 'farmer' ? (
            !otpSent ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Farmer Phone Number (OTP Login)
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all text-gray-900"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    We will send a 6-digit OTP code to verify your phone number.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || cooldown > 0}
                  className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  {loading ? 'Sending OTP...' : cooldown > 0 ? `Wait ${cooldown}s` : '📱 Send OTP Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      Enter 6-Digit OTP Code
                    </label>
                    <span className="text-[11px] text-emerald-700 font-mono">Sent to {phone}</span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full px-4 py-3 rounded-xl border border-emerald-500/50 text-center font-mono text-xl tracking-widest focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all text-gray-900"
                  />
                  {demoOtp && (
                    <div className="mt-2 text-center text-xs bg-amber-50 border border-amber-200 text-amber-800 p-2 rounded-lg font-mono">
                      Demo OTP Code: <strong>{demoOtp}</strong>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  {loading ? 'Verifying...' : '✅ Verify OTP & Sign In'}
                </button>

                <div className="flex justify-between items-center pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="text-gray-500 hover:underline cursor-pointer"
                  >
                    Change Phone Number
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={cooldown > 0}
                    className={`font-semibold ${
                      cooldown > 0 ? 'text-gray-400' : 'text-emerald-700 hover:underline cursor-pointer'
                    }`}
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                  </button>
                </div>
              </form>
            )
          ) : (
            /* Tasks 3, 4, 5: Email + Password Login */
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {selectedRole === 'buyer' ? 'Buyer Email' : selectedRole === 'insurance' ? 'Agency Email' : 'Admin Email'}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    selectedRole === 'buyer'
                      ? 'nirmala@freshmarket.in'
                      : selectedRole === 'insurance'
                      ? 'rajesh@agriprotect.org'
                      : 'admin@farmvision.io'
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all text-gray-900"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-gray-700">Password</label>
                  <button
                    type="button"
                    onClick={() => alert('Forgot Password feature stub: Please contact administrator or re-register.')}
                    className="text-[11px] text-emerald-700 hover:underline cursor-pointer"
                  >
                    Forgot password? (TODO)
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all text-gray-900"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                {loading ? 'Authenticating...' : `Sign In as ${selectedRole.toUpperCase()}`}
              </button>
            </form>
          )}

          {/* Sign Up Link */}
          <div className="text-center border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-500">
              New to FarmVision?{' '}
              <Link href="/signup" className="font-bold text-emerald-700 hover:underline">
                Create Account
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
