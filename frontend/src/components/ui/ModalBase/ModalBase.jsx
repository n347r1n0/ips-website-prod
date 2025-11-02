// src/components/ui/ModalBase/ModalBase.jsx

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function ModalBase({
  children,
  isOpen = false,
  onClose,
  title,
  subtitle,
  headerActions,
  footerActions,
  className = '',
  fullScreen = false, // Add fullScreen prop
  priority = false, // Add priority prop for high z-index portal mounting
  usePortal = false, // Add portal prop
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

  const modalContent = (
    <>
      {/* Fixed Header */}
      {(title || headerActions) && (
        <div className="flex-shrink-0 px-4 sm:px-6 py-4 sm:py-6 border-b border-[var(--divider-weak)]">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 pr-3 sm:pr-4">
              {title && (
                <h1 className="text-lg sm:text-2xl font-brand text-white mb-2 leading-tight">{title}</h1>
              )}
              {subtitle && (
                <p className="text-secondary text-sm sm:text-base">{subtitle}</p>
              )}
            </div>
            
            <div className="flex items-start space-x-2 sm:space-x-3 flex-shrink-0">
              {headerActions}
              <Button
                onClick={onClose}
                className="btn-glass btn-sm p-2 aspect-square min-w-[40px] min-h-[40px]"
                aria-label="Закрыть"
              >
                <X className="w-5 h-5" />
              </Button>
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
        <div className="flex-shrink-0 px-6 py-6 border-t border-[var(--divider-weak)]">
          <div className="flex items-center justify-end space-x-3">
            {footerActions}
          </div>
        </div>
      )}
    </>
  );

  const modalMarkup = (
    <AnimatePresence>
      {fullScreen ? (
        /* Full-screen neumorphic container */
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="neumorphic-container flex flex-col"
          style={{ zIndex: priority ? 60 : 40 }}
          {...props}
        >
          {modalContent}
        </motion.div>
      ) : (
        /* Backdrop for windowed modals */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 bg-[var(--backdrop-heavy)] backdrop-blur-[var(--backdrop-blur)] flex items-center justify-center p-4 ${priority ? 'z-[60]' : 'z-40'}`}
          style={{
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(1rem, env(safe-area-inset-left))',
            paddingRight: 'max(1rem, env(safe-area-inset-right))'
          }}
          onClick={onClose}
        >
          {/* Rounded neumorphic mother panel */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="neumorphic-panel w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden"
            {...props}
          >
            {modalContent}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Use portal if specified or if priority is true
  if ((usePortal || priority) && typeof window !== 'undefined') {
    return createPortal(modalMarkup, document.body);
  }

  return modalMarkup;
}
