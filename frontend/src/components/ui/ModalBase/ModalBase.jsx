// src/components/ui/ModalBase/ModalBase.jsx

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export function ModalBase({
  children,
  isOpen = false,
  onClose,
  title,
  subtitle,
  headerActions,
  footerActions,
  className = '',
  ...props
}) {
  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Full-page neumorphic opaque container */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="neumorphic-container flex flex-col"
        {...props}
      >
          {/* Fixed Header */}
          {(title || headerActions) && (
            <div className="flex-shrink-0 px-6 py-6 border-b border-white/5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 pr-4">
                  {title && (
                    <h1 className="heading-lg mb-2 leading-tight">{title}</h1>
                  )}
                  {subtitle && (
                    <p className="text-secondary">{subtitle}</p>
                  )}
                </div>
                
                <div className="flex items-start space-x-3 flex-shrink-0">
                  {headerActions}
                  <button
                    onClick={onClose}
                    className="btn btn-neutral btn-sm p-2 aspect-square"
                    aria-label="Закрыть"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Elegant divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-gold-accent/30 to-transparent" />
            </div>
          )}
          
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto min-h-0 px-6">
            <div className="py-6 spacing-content max-w-full">
              {children}
            </div>
          </div>
          
          {/* Fixed Footer */}
          {footerActions && (
            <div className="flex-shrink-0 px-6 py-6 border-t border-white/5">
              <div className="flex items-center justify-end space-x-3">
                {footerActions}
              </div>
            </div>
          )}
      </motion.div>
    </AnimatePresence>
  );
}