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
  contentClassName = '',
  fullScreen = true, // Mobile-first full-screen default
  closeButton = true,
  backgroundLock = true,
  ...props
}) {
  // Lock background scroll when modal is open
  useEffect(() => {
    if (!backgroundLock) return;
    
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen, backgroundLock]);

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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={`fixed inset-0 z-50 flex ${fullScreen ? 'p-0' : 'p-4 items-center justify-center'}`}
        onClick={onClose}
        {...props}
      >
        {/* Background overlay */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
        
        {/* Modal container */}
        <motion.div
          initial={fullScreen 
            ? { y: '100%' } 
            : { scale: 0.8, y: 50, opacity: 0 }
          }
          animate={fullScreen 
            ? { y: 0 } 
            : { scale: 1, y: 0, opacity: 1 }
          }
          exit={fullScreen 
            ? { y: '100%' } 
            : { scale: 0.8, y: 50, opacity: 0 }
          }
          transition={{ 
            type: fullScreen ? 'spring' : 'spring', 
            stiffness: fullScreen ? 400 : 300, 
            damping: fullScreen ? 40 : 30 
          }}
          className={`relative ${fullScreen 
            ? 'w-full h-full flex flex-col' 
            : 'w-full max-w-2xl max-h-[90vh] rounded-2xl overflow-hidden'
          } ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Neomorphic inset shell */}
          <div className={`${fullScreen ? 'h-full flex flex-col' : 'h-full'} bg-gray-800 neumorphic-inset ${fullScreen ? 'rounded-none' : 'rounded-2xl'}`}>
            
            {/* Sticky Header */}
            {(title || headerActions || closeButton) && (
              <div className="flex-shrink-0 p-6 pb-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    {title && (
                      <h2 className="text-2xl font-heading text-white mb-1">
                        {title}
                      </h2>
                    )}
                    {subtitle && (
                      <p className="text-sm text-gray-400">
                        {subtitle}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {headerActions}
                    {closeButton && (
                      <button
                        onClick={onClose}
                        className="p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Decorative divider */}
                <div className="mt-4 h-px bg-gradient-to-r from-transparent via-gold-accent to-transparent opacity-50" />
              </div>
            )}
            
            {/* Scrollable Glass Content */}
            <div className={`flex-1 overflow-y-auto ${fullScreen ? 'min-h-0' : ''}`}>
              <div className={`glassmorphic-panel border-0 ${fullScreen ? 'h-full rounded-none' : 'rounded-none'} ${contentClassName}`}>
                {children}
              </div>
            </div>
            
            {/* Sticky Footer */}
            {footerActions && (
              <div className="flex-shrink-0 p-6 pt-4 border-t border-white/10">
                <div className="flex items-center justify-end space-x-3">
                  {footerActions}
                </div>
              </div>
            )}
            
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}