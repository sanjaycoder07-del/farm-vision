'use client';

import ProtectedRoute from '../../components/ProtectedRoute';

export default function AgentLayout({ children }) {
  return <ProtectedRoute allowedRoles={['INSURANCE_AGENT', 'AGENT', 'INSURANCE']}>{children}</ProtectedRoute>;
}
