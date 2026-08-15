'use client';

import ProtectedRoute from '../../components/ProtectedRoute';

export default function FarmerLayout({ children }) {
  return <ProtectedRoute allowedRoles={['FARMER']}>{children}</ProtectedRoute>;
}
