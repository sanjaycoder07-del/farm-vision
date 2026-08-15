'use client';

import ProtectedRoute from '../../components/ProtectedRoute';

export default function BuyerLayout({ children }) {
  return <ProtectedRoute allowedRoles={['BUYER']}>{children}</ProtectedRoute>;
}
