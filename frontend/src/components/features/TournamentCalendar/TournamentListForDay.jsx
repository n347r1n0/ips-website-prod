// src/components/features/TournamentCalendar/TournamentListForDay.jsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Trophy, Star, Zap, Target } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { RegistrationConfirmationModal } from './RegistrationConfirmationModal';
import { TournamentResultsModal } from './TournamentResultsModal';

export function TournamentListForDay({ tournaments, onClose }) {
  const [selectedTournament, setSelectedTournament] = useState(null); // для регистрации
  const [resultsTournament, setResultsTournament] = useState(null); // для результатов

  if (!tournaments || tournaments.length === 0) {
    return null;
  }

  const selectedDate = new Date(tournaments[0].tournament_date);
  const dateString = selectedDate.toLocaleDateString('ru-RU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

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

  return (
    <AnimatePresence>
      {/* Full-screen neumorphic container */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="neumorphic-container flex flex-col"
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-6 border-b border-white/5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 pr-4">
              <h1 className="heading-lg mb-2 leading-tight">
                Турниры на {dateString}
              </h1>
            </div>
            
            <div className="flex items-start space-x-3 flex-shrink-0">
              <Button
                variant="neutral"
                size="sm"
                onClick={onClose}
                className="p-2 aspect-square"
                aria-label="Закрыть"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          {/* Elegant divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gold-accent/30 to-transparent" />
        </div>
        
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6">
          <div className="py-6 spacing-content">
            <div className="spacing-content">
              {tournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  className="glassmorphic-panel border border-white/20 rounded-xl p-6 hover:border-gold-accent/40 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-heading text-white mb-2">
                        {tournament.name}
                      </h3>
                      <div className="flex items-center space-x-4 text-gray-300 text-sm">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2 text-gold-accent" />
                          <span>{formatTime(tournament.tournament_date)}</span>
                        </div>
                        {tournament.settings_json?.tournament_type && (
                          <div className="flex items-center">
                            {(() => {
                              const TypeIcon = getTournamentTypeIcon(tournament.settings_json.tournament_type);
                              const typeColor = getTournamentTypeColor(tournament.settings_json.tournament_type);
                              return <TypeIcon className={`w-4 h-4 mr-2 ${typeColor}`} />;
                            })()}
                            <span>{tournament.settings_json.tournament_type}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {tournament.status === 'completed' ? (
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => setResultsTournament(tournament)}
                      >
                        Результаты
                      </Button>
                    ) : (

                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => setSelectedTournament(tournament)}
                      >
                        Записаться
                      </Button>
                    )}

                  </div>

                  {tournament.settings_json?.buy_in_cost && (
                    <div className="text-gold-accent font-medium">
                      Вступительный взнос: ${tournament.settings_json.buy_in_cost}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {selectedTournament && (
        <RegistrationConfirmationModal
          tournament={selectedTournament}
          onClose={() => setSelectedTournament(null)}
          onSuccess={() => {
            setSelectedTournament(null);
            onClose();
          }}
        />
      )}

      {resultsTournament && (
        <TournamentResultsModal
          tournament={resultsTournament}
          onClose={() => setResultsTournament(null)}
        />
      )}

    </AnimatePresence>
  );
}
