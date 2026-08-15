'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  login: (user, token) => {},
  logout: () => {},
  subscribeBuyer: async () => {},
  getRoleRedirect: (role) => '/login',
});

export const getRoleRedirect = (roleStr) => {
  const r = (roleStr || '').toUpperCase();
  if (r === 'FARMER') return '/farmer';
  if (r === 'BUYER') return '/buyer';
  if (r === 'INSURANCE_AGENT' || r === 'INSURANCE' || r === 'AGENT') return '/agent';
  if (r === 'ADMIN') return '/admin';
  return '/login';
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('farmvision_user');
      const savedToken = localStorage.getItem('farmvision_token');
      if (savedUser && savedToken) {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      }
    } catch (e) {
      console.error('Failed to load session from localStorage:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    try {
      localStorage.setItem('farmvision_user', JSON.stringify(userData));
      localStorage.setItem('farmvision_token', authToken);
    } catch (e) {
      console.error('Failed to save session to localStorage:', e);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem('farmvision_user');
      localStorage.removeItem('farmvision_token');
    } catch (e) {
      console.error('Failed to remove session from localStorage:', e);
    }
    router.push('/login');
  };

  const subscribeBuyer = async () => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      const res = await fetch(`${API_BASE}/api/buyer/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          email: user?.email,
          plan: 'Premium PRO',
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const updatedUser = {
        ...user,
        subscriptionStatus: 'active',
        subscriptionPlan: 'Premium PRO',
        subscriptionExpiry: '2026-12-31',
        ...data.user,
      };

      setUser(updatedUser);
      localStorage.setItem('farmvision_user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (err) {
      console.error('Subscription update failed:', err);
      const updatedUser = {
        ...(user || { name: 'Buyer' }),
        subscriptionStatus: 'active',
        subscriptionPlan: 'Premium PRO',
      };
      setUser(updatedUser);
      localStorage.setItem('farmvision_user', JSON.stringify(updatedUser));
      return updatedUser;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        subscribeBuyer,
        getRoleRedirect,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
