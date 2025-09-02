// src/components/features/Admin/AdminRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function AdminRoute({ children }) {
  const { user, profile, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="glassmorphic-panel p-8 rounded-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-accent mx-auto"></div>
          <p className="text-center text-gray-300 mt-4">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
