// frontend/src/components/features/RegistrationForm/GuestFormModal.jsx

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { RegistrationForm } from './RegistrationForm';

export function GuestFormModal({ isOpen, onClose }) {
  const handleClose = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <GlassPanel>
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="p-6">
                <div className="text-center mb-6">
                  <img src="/logo/Logo_IPS.svg" alt="IPS Logo" className="h-12 w-auto mx-auto mb-4" />
                  <h2 className="text-3xl font-brand text-white gold-highlight">
                    Резервация места
                  </h2>
                  <p className="text-white/70 mt-2">
                    Быстрая запись для гостей клуба
                  </p>
                </div>

                <RegistrationForm onSuccess={handleClose} />
              </div>
            </GlassPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}