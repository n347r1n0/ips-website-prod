// frontend/src/components/ui/AuthErrorDisplay.jsx

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { Button } from './Button';
import { useAuth } from '@/contexts/AuthContext';

/**
 * AuthErrorDisplay - Shows authentication errors with recovery options
 * This component can be placed anywhere in the app to display auth errors
 */
export function AuthErrorDisplay() {
  const { error, clearError, recoverAuthState } = useAuth();

  if (!error) return null;

  const isDevMode = import.meta.env.DEV;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 right-4 z-50 max-w-md"
      >
        <div className="glassmorphic-panel border border-red-500/50 bg-red-900/50 text-red-100 p-4 rounded-lg shadow-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            
            <div className="flex-grow">
              <h4 className="font-medium text-sm mb-1">
                Authentication Issue
              </h4>
              <p className="text-xs text-red-200 mb-3">
                {error}
              </p>
              
              <div className="flex gap-2">
                <Button
                  onClick={recoverAuthState}
                  className="text-xs px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
                
                {isDevMode && (
                  <Button
                    onClick={() => window.clearCorruptedAuthTokens?.()}
                    className="text-xs px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded"
                  >
                    Clear Tokens
                  </Button>
                )}
              </div>
            </div>
            
            <button
              onClick={clearError}
              className="text-red-300 hover:text-red-100 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * AuthErrorBoundary - Wrapper component that shows errors inline
 */
export function AuthErrorBoundary({ children, fallback = null }) {
  const { error } = useAuth();

  if (error && fallback) {
    return fallback;
  }

  return (
    <>
      {children}
      <AuthErrorDisplay />
    </>
  );
}