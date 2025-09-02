// src/components/features/TournamentCalendar/RegistrationConfirmationModal.jsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BuyInSummary } from './BuyInSummary';
import { BlindsStructureViewer } from './BlindsStructureViewer';
import { participantsAPI } from '@/lib/participantsAPI';
import { useAuth } from '@/contexts/AuthContext';
import { useGuestStore } from '@/lib/guestStore';
import { useToast } from '@/components/ui/Toast';

export function RegistrationConfirmationModal({ tournament, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, profile } = useAuth();
  const { guestData, clearGuestData } = useGuestStore();
  const toast = useToast();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleConfirmRegistration = async () => {
    setLoading(true);
    setError(null);

    try {
      const registrationData = {
        tournamentId: tournament.id
      };

      if (user) {
        // Registered user
        registrationData.userId = user.id;
      } else if (guestData) {
        // Guest user
        registrationData.guestData = guestData;
      } else {
        throw new Error('Отсутствуют данные для регистрации');
      }

      await participantsAPI.registerForTournament(registrationData);
      
      // Clear guest data after successful registration
      if (guestData && !user) {
        clearGuestData();
      }

      // Show success message
      const playerName = profile?.nickname || guestData?.name || 'Игрок';
      toast.success(`${playerName}, вы успешно зарегистрированы на турнир!`);

      // Close modal and trigger success callback
      if (onSuccess) onSuccess();
      
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Произошла ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  };

  const playerName = profile?.nickname || guestData?.name;
  const playerContact = user?.email || guestData?.contact;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.8, y: 50, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="glassmorphic-panel rounded-2xl p-8">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-8">
              <h2 className="text-3xl font-heading text-white mb-2">
                Подтверждение регистрации
              </h2>
              <div className="h-px bg-gradient-to-r from-transparent via-gold-accent to-transparent mb-4" />
              <div className="text-gray-300">
                <p className="text-xl font-medium mb-2">{tournament.name}</p>
                <p>📅 {formatDate(tournament.tournament_date)}</p>
                <p>🕐 {formatTime(tournament.tournament_date)}</p>
              </div>
            </div>

            {/* Player Information */}
            <div className="glassmorphic-panel border border-white/30 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-heading text-white mb-4">
                Информация об игроке
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Игрок:</span>
                  <span className="text-white font-medium">
                    {playerName || 'Не указано'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Контакт:</span>
                  <span className="text-white">
                    {playerContact || 'Не указано'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Статус:</span>
                  <span className="text-gold-accent">
                    {user ? 'Участник клуба' : 'Гость'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tournament Details */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <BuyInSummary 
                buyInSettings={tournament.settings_json?.buy_in_settings}
                tournamentType={tournament.settings_json?.tournament_type}
                buyInCost={tournament.settings_json?.buy_in_cost}
              />
              <BlindsStructureViewer 
                blindsStructure={tournament.settings_json?.blinds_structure}
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6 flex items-center">
                <AlertCircle className="w-5 h-5 text-red-300 mr-3 flex-shrink-0" />
                <p className="text-red-300">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Button
                onClick={handleConfirmRegistration}
                disabled={loading || (!user && !guestData)}
                className={`flex-1 luxury-button px-8 py-4 rounded-xl flex items-center justify-center ${
                  loading || (!user && !guestData) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="w-5 h-5 mr-2" />
                )}
                {loading ? 'Регистрация...' : 'Подтвердить регистрацию'}
              </Button>
              
              <Button
                onClick={onClose}
                disabled={loading}
                className="glassmorphic-panel border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-xl"
              >
                Отмена
              </Button>
            </div>

            {(!user && !guestData) && (
              <div className="mt-4 text-center">
                <p className="text-gray-400 text-sm">
                  Для регистрации необходимо войти в систему или заполнить гостевую форму
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}