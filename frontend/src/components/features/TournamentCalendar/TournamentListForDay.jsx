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
          className="relative w-full max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="glassmorphic-panel rounded-2xl p-8 border border-white/15">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-heading text-white mb-2">
                Турниры на {dateString}
              </h2>
              <div className="h-px bg-gradient-to-r from-transparent via-gold-accent to-transparent" />
            </div>

            <div className="space-y-4">
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

            <div className="mt-8 text-center">
              <Button
                variant="secondary"
                size="lg"
                onClick={onClose}
              >
                Закрыть
              </Button>
            </div>
          </div>
        </motion.div>
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
