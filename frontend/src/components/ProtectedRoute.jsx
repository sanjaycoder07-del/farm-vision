'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, getRoleRedirect } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (allowedRoles.length > 0) {
        const userRole = (user?.role || '').toUpperCase();
        const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());
        
        // Match INSURANCE_AGENT with AGENT / INSURANCE
        const isMatch = normalizedAllowed.some(r => {
          if (r === userRole) return true;
          if ((r === 'AGENT' || r === 'INSURANCE') && userRole === 'INSURANCE_AGENT') return true;
          if (r === 'INSURANCE_AGENT' && (userRole === 'AGENT' || userRole === 'INSURANCE')) return true;
          return false;
        });

        if (!isMatch) {
          const redirectPath = getRoleRedirect(userRole);
          router.push(redirectPath);
        }
      }
    }
  }, [isAuthenticated, loading, user, allowedRoles, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50 text-gray-500 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Verifying FarmVision session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles.length > 0) {
    const userRole = (user?.role || '').toUpperCase();
    const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());
    const isMatch = normalizedAllowed.some(r => {
      if (r === userRole) return true;
      if ((r === 'AGENT' || r === 'INSURANCE') && userRole === 'INSURANCE_AGENT') return true;
      if (r === 'INSURANCE_AGENT' && (userRole === 'AGENT' || userRole === 'INSURANCE')) return true;
      return false;
    });
    if (!isMatch) return null;
  }

  return children;
}
