// src/components/features/TournamentCalendar/UpcomingTournamentsModal.jsx

import React, { useState, useEffect } from 'react';
import { Clock, Trophy, Star, Zap, Target, Plus, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { ModalBase } from '@/components/ui/ModalBase';
import { Button } from '@/components/ui/Button';
import { RegistrationConfirmationModal } from './RegistrationConfirmationModal';
import { AuthModal } from '../Auth/AuthModal';
import { participantsAPI } from '@/lib/participantsAPI';
import { useAuth } from '@/contexts/AuthContext';
import { useGuestStore } from '@/lib/guestStore';
import { useToast } from '@/components/ui/Toast';

export function UpcomingTournamentsModal({ tournaments, onClose }) {
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [tournamentDetailsView, setTournamentDetailsView] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userRegistrationIds, setUserRegistrationIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { guestData } = useGuestStore();
  const toast = useToast();

  // Load registrations efficiently with single API call
  useEffect(() => {
    let cancelled = false;

    const loadRegistrations = async () => {
      if (tournaments.length === 0 || (!user && !guestData?.name)) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const tournamentIds = tournaments.map(t => t.id);
        
        const registeredIds = await participantsAPI.getMyUpcomingRegistrations(
          tournamentIds,
          user?.id,
          guestData
        );
        
        if (!cancelled) {
          setUserRegistrationIds(new Set(registeredIds));
        }
      } catch (error) {
        console.error('Error loading registrations:', error);
        toast.error('Не удалось загрузить ваши регистрации.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadRegistrations();
    
    return () => { cancelled = true; };
  }, [tournaments, user, guestData, toast]);

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
    event.stopPropagation();
    
    setLoading(true);
    try {
      const registration = await participantsAPI.checkRegistration(
        tournamentId,
        user?.id,
        guestData
      );

      if (registration) {
        await participantsAPI.removeParticipant(registration.id);
        
        setUserRegistrationIds(prev => {
          const updated = new Set(prev);
          updated.delete(tournamentId);
          return updated;
        });
        
        toast.success('Регистрация отменена');
      } else {
        toast.warning('Регистрация не найдена.');
      }
    } catch (error) {
      console.error('Error canceling registration:', error);
      toast.error('Ошибка при отмене регистрации');
    } finally {
      setLoading(false);
    }
  };

  const handleTournamentClick = (tournament) => {
    // If user is logged in or has guest data, proceed with registration
    if (user || guestData) {
      setSelectedTournament(tournament);
    } else {
      // For logged-out users, show tournament details instead of registration
      setTournamentDetailsView(tournament);
    }
  };

  const handleDisabledRegisterClick = () => {
    // Close tournament details and open auth modal
    setTournamentDetailsView(null);
    setShowAuthModal(true);
  };

  const handleRegistrationSuccess = () => {
    if (selectedTournament) {
      setUserRegistrationIds(prev => new Set(prev).add(selectedTournament.id));
    }
    setSelectedTournament(null);
  };

  return (
    <>
      <ModalBase
        isOpen={true}
        onClose={onClose}
        title="Ближайшие турниры"
        subtitle={`${tournaments.length} турнир${tournaments.length === 1 ? '' : tournaments.length < 5 ? 'а' : 'ов'} в ближайшее время`}
      >
        <div className="spacing-content">
          {tournaments.map((tournament) => {
            const isRegistered = userRegistrationIds.has(tournament.id);
            const TypeIcon = getTournamentTypeIcon(tournament.settings_json?.tournament_type);
            const typeColor = getTournamentTypeColor(tournament.settings_json?.tournament_type);

            return (
              <motion.div
                key={tournament.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => !isRegistered && handleTournamentClick(tournament)}
                className={`glassmorphic-panel rounded-xl cursor-pointer transition-all duration-200 p-5 border relative ${
                  isRegistered 
                    ? 'border-gold-accent/40 bg-gold-accent/5' 
                    : 'border-white/15 hover:border-gold-accent/30'
                }`}
              >
                {/* Desktop Layout */}
                <div className="hidden md:flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <TypeIcon className={`w-5 h-5 ${typeColor} flex-shrink-0`} />
                      <h3 className="heading-sm truncate">{tournament.name}</h3>
                      {tournament.settings_json?.tournament_type && (
                        <span className={`text-xs px-3 py-1 rounded-full bg-black/20 ${typeColor} flex-shrink-0`}>
                          {tournament.settings_json.tournament_type}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-secondary mb-3">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(tournament.tournament_date)}</span>
                        <span>•</span>
                        <span>{formatTime(tournament.tournament_date)}</span>
                      </div>
                    </div>
                    
                    {tournament.settings_json?.buy_in_cost && (
                      <div className="text-gold-accent font-medium text-sm">
                        Вступительный взнос: ${tournament.settings_json.buy_in_cost}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    {isRegistered ? (
                      <>
                        <span className="text-xs text-gold-accent font-medium px-2 py-1 bg-gold-accent/10 rounded">
                          ✓ Зарегистрированы
                        </span>
                        <Button
                          className="btn-clay"
                          onClick={(e) => handleCancelRegistration(tournament.id, e)}
                          disabled={loading}
                        >
                          Отменить
                        </Button>
                      </>
                    ) : (
                      <Button
                        className="btn-clay luxury-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTournamentClick(tournament);
                        }}
                        disabled={loading}
                      >
                        Записаться
                      </Button>
                    )}
                  </div>
                </div>

                {/* Mobile Layout */}
                <div className="md:hidden">
                  <div className="mb-3">
                    <div className="flex items-center space-x-3 mb-3">
                      <TypeIcon className={`w-5 h-5 ${typeColor} flex-shrink-0`} />
                      <h3 className="heading-sm">{tournament.name}</h3>
                    </div>
                    
                    {tournament.settings_json?.tournament_type && (
                      <span className={`text-xs px-3 py-1 rounded-full bg-black/20 ${typeColor} inline-block mb-2`}>
                        {tournament.settings_json.tournament_type}
                      </span>
                    )}
                    
                    <div className="flex items-center space-x-4 text-secondary mb-3">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(tournament.tournament_date)}</span>
                        <span>•</span>
                        <span>{formatTime(tournament.tournament_date)}</span>
                      </div>
                    </div>
                    
                    {tournament.settings_json?.buy_in_cost && (
                      <div className="text-gold-accent font-medium text-sm">
                        Вступительный взнос: ${tournament.settings_json.buy_in_cost}
                      </div>
                    )}

                    {/* Registration Status Badge on Mobile */}
                    {isRegistered && (
                      <div className="text-xs text-gold-accent font-medium px-2 py-1 bg-gold-accent/10 rounded inline-block">
                        ✓ Зарегистрированы
                      </div>
                    )}
                  </div>

                  {/* Floating Action Button - Bottom Right */}
                  {isRegistered ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelRegistration(tournament.id, e);
                      }}
                      disabled={loading}
                      className="absolute bottom-4 right-4 w-11 h-11 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
                      aria-label="Отменить регистрацию"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTournamentClick(tournament);
                      }}
                      disabled={loading}
                      className="absolute bottom-4 right-4 w-11 h-11 bg-gradient-to-r from-gold-accent to-yellow-500 hover:from-yellow-500 hover:to-gold-accent disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
                      aria-label="Записаться"
                    >
                      <Plus className="w-5 h-5 text-white" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}

          {tournaments.length === 0 && (
            <div className="glassmorphic-panel rounded-xl p-8 text-center border border-white/15">
              <p className="text-secondary">Нет предстоящих турниров</p>
            </div>
          )}
        </div>
      </ModalBase>

      {/* Registration confirmation modal */}
      {selectedTournament && (
        <RegistrationConfirmationModal
          tournament={selectedTournament}
          onClose={() => setSelectedTournament(null)}
          onSuccess={handleRegistrationSuccess}
        />
      )}

      {/* Tournament details view for logged-out users */}
      {tournamentDetailsView && (
        <ModalBase
          isOpen={true}
          onClose={() => setTournamentDetailsView(null)}
          title={tournamentDetailsView.name}
          subtitle="Детали турнира"
          priority={true}
          footerActions={
            <>
              <Button
                onClick={() => setTournamentDetailsView(null)}
                className="btn-glass px-6 py-3 rounded-xl"
              >
                Назад
              </Button>
              <Button
                onClick={handleDisabledRegisterClick}
                disabled={true}
                aria-disabled={true}
                className="btn-clay luxury-button px-6 py-3 rounded-xl flex items-center opacity-50 cursor-not-allowed"
              >
                <Plus className="w-5 h-5 mr-2" />
                Записаться
              </Button>
            </>
          }
        >
          {/* Tournament card using same layout as day modal */}
          <div className="glassmorphic-panel rounded-xl p-5 border border-white/15">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-3">
                {(() => {
                  const TypeIcon = getTournamentTypeIcon(tournamentDetailsView.settings_json?.tournament_type);
                  const typeColor = getTournamentTypeColor(tournamentDetailsView.settings_json?.tournament_type);
                  return <TypeIcon className={`w-5 h-5 ${typeColor} flex-shrink-0`} />;
                })()}
                <h3 className="heading-sm">{tournamentDetailsView.name}</h3>
                {tournamentDetailsView.settings_json?.tournament_type && (
                  <span className={`text-xs px-3 py-1 rounded-full bg-black/20 ${getTournamentTypeColor(tournamentDetailsView.settings_json.tournament_type)} flex-shrink-0`}>
                    {tournamentDetailsView.settings_json.tournament_type}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-4 text-secondary mb-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(tournamentDetailsView.tournament_date)}</span>
                  <span>•</span>
                  <span>{formatTime(tournamentDetailsView.tournament_date)}</span>
                </div>
              </div>
              
              {tournamentDetailsView.settings_json?.buy_in_cost && (
                <div className="text-gold-accent font-medium text-sm">
                  Вступительный взнос: ${tournamentDetailsView.settings_json.buy_in_cost}
                </div>
              )}
            </div>
          </div>

          {/* Login hint */}
          <div className="mt-4 text-center">
            <p className="text-gray-400 text-sm">
              Войдите, чтобы зарегистрироваться
            </p>
          </div>
        </ModalBase>
      )}

      {/* Auth modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={true}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </>
  );
}