// src/components/features/TournamentCalendar/UpcomingTournamentsModal.jsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Trophy, Star, Zap, Target } from 'lucide-react';
import { RegistrationConfirmationModal } from './RegistrationConfirmationModal';
import { participantsAPI } from '@/lib/participantsAPI';
import { useAuth } from '@/contexts/AuthContext';
import { useGuestStore } from '@/lib/guestStore';
import { useToast } from '@/components/ui/Toast';

export function UpcomingTournamentsModal({ tournaments, onClose }) {
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [userRegistrations, setUserRegistrations] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { guestData } = useGuestStore();
  const toast = useToast();

  // Load user's existing registrations
  useEffect(() => {
    const loadRegistrations = async () => {
      if (!user && !guestData) return;

      try {
        const registrations = new Set();
        
        for (const tournament of tournaments) {
          try {
            const participants = await participantsAPI.getTournamentParticipants(tournament.id);
            
            const isRegistered = participants.some(p => 
              (user && p.club_members?.[0] && p.player_id === user.id) ||
              (!user && guestData && p.guest_name === guestData.name)
            );
            
            if (isRegistered) {
              registrations.add(tournament.id);
            }
          } catch (error) {
            console.warn(`Failed to check registration for tournament ${tournament.id}:`, error);
          }
        }
        
        setUserRegistrations(registrations);
      } catch (error) {
        console.error('Error loading registrations:', error);
      }
    };

    loadRegistrations();
  }, [tournaments, user, guestData]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      weekday: 'short',
      month: 'short',
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

  const getTournamentTypeIcon = (tournamentType) => {
    switch (tournamentType) {
      case 'Стандартный':
        return Target;
      case 'Специальный':
        return Star;
      case 'Фриролл':
        return Zap;
      case 'Рейтинговый':
        return Trophy;
      default:
        return Target;
    }
  };

  const getTournamentTypeColor = (tournamentType) => {
    switch (tournamentType) {
      case 'Стандартный':
        return 'text-deep-teal';
      case 'Специальный':
        return 'text-gold-accent';
      case 'Фриролл':
        return 'text-ips-red';
      case 'Рейтинговый':
        return 'text-gold-accent';
      default:
        return 'text-white';
    }
  };

  const handleCancelRegistration = async (tournamentId, event) => {
    event.stopPropagation(); // Prevent row click
    
    setLoading(true);
    try {
      const participants = await participantsAPI.getTournamentParticipants(tournamentId);
      
      const userParticipant = participants.find(p => 
        (user && p.player_id === user.id) ||
        (!user && guestData && p.guest_name === guestData.name)
      );

      if (userParticipant) {
        await participantsAPI.removeParticipant(userParticipant.id);
        
        // Update local state
        setUserRegistrations(prev => {
          const updated = new Set(prev);
          updated.delete(tournamentId);
          return updated;
        });
        
        toast.success('Регистрация отменена');
        // Note: Do NOT clear guest data here - preserve for re-registration
      }
    } catch (error) {
      console.error('Error canceling registration:', error);
      toast.error('Ошибка при отмене регистрации');
    } finally {
      setLoading(false);
    }
  };

  const handleTournamentClick = (tournament) => {
    // If user/guest has no data, close this modal and funnel to guest form
    if (!user && !guestData) {
      onClose(); // This should trigger opening guest form in the parent
      return;
    }
    
    setSelectedTournament(tournament);
  };

  const handleRegistrationSuccess = () => {
    // Update local registrations state
    if (selectedTournament) {
      setUserRegistrations(prev => new Set([...prev, selectedTournament.id]));
    }
    setSelectedTournament(null);
  };

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
          className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="glassmorphic-panel rounded-2xl p-6">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-heading text-white mb-2">
                Ближайшие турниры
              </h2>
              <div className="h-px bg-gradient-to-r from-transparent via-gold-accent to-transparent" />
            </div>

            <div className="space-y-3 h-[400px] overflow-y-auto">
              {tournaments.map((tournament) => {
                const isRegistered = userRegistrations.has(tournament.id);
                const TypeIcon = getTournamentTypeIcon(tournament.settings_json?.tournament_type);
                const typeColor = getTournamentTypeColor(tournament.settings_json?.tournament_type);

                return (
                  <motion.div
                    key={tournament.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTournamentClick(tournament)}
                    className={`glassmorphic-panel border rounded-xl cursor-pointer transition-all duration-300 ${
                      isRegistered 
                        ? 'border-gold-accent/50 bg-gold-accent/10' 
                        : 'border-white/30 hover:border-gold-accent/50 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between h-20 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-1">
                          <TypeIcon className={`w-5 h-5 ${typeColor} flex-shrink-0`} />
                          <h3 className="text-white font-medium truncate">{tournament.name}</h3>
                          {tournament.settings_json?.tournament_type && (
                            <span className={`text-xs px-2 py-1 rounded-full bg-black/20 ${typeColor} flex-shrink-0`}>
                              {tournament.settings_json.tournament_type}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-white/70">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatDate(tournament.tournament_date)}</span>
                              <span>•</span>
                              <span>{formatTime(tournament.tournament_date)}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {isRegistered && (
                              <span className="text-xs text-gold-accent font-medium">
                                ✓ Уже записаны
                              </span>
                            )}
                            
                            {/* Cancel button for registered tournaments */}
                            {isRegistered && (
                              <button
                                onClick={(e) => handleCancelRegistration(tournament.id, e)}
                                disabled={loading}
                                className="px-3 py-1 text-xs text-red-300 border border-red-300/50 rounded-lg hover:bg-red-300/10 transition-colors disabled:opacity-50 flex-shrink-0"
                              >
                                Отменить
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {tournaments.length === 0 && (
              <div className="text-center py-8">
                <p className="text-white/60">Нет предстоящих турниров</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Registration confirmation modal */}
      {selectedTournament && (
        <RegistrationConfirmationModal
          tournament={selectedTournament}
          onClose={() => setSelectedTournament(null)}
          onSuccess={handleRegistrationSuccess}
        />
      )}
    </AnimatePresence>
  );
}