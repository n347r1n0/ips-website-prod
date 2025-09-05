// src/components/features/TournamentCalendar/TournamentListForDay.jsx

import React, { useState } from 'react';
import { Clock, Trophy, Star, Zap, Target } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ModalBase } from '@/components/ui/ModalBase';
import { RegistrationConfirmationModal } from './RegistrationConfirmationModal';
import { TournamentResultsModal } from './TournamentResultsModal';

export function TournamentListForDay({ tournaments, onClose }) {
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [resultsTournament, setResultsTournament] = useState(null);

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
    <>
      <ModalBase
        isOpen={true}
        onClose={onClose}
        title={`Турниры на ${dateString}`}
        fullScreen={false}
      >
        <div className="spacing-content">
          {tournaments.map((tournament) => {
            const TypeIcon = getTournamentTypeIcon(tournament.settings_json?.tournament_type || tournament.tournament_type);
            const typeColor = getTournamentTypeColor(tournament.settings_json?.tournament_type || tournament.tournament_type);

            return (
              <div
                key={tournament.id}
                className="glassmorphic-panel rounded-xl p-5 border border-white/15 hover:border-gold-accent/30 transition-all duration-200"
              >
                <div className="flex items-start justify-between">
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
                </div>
              </div>
            );
          })}
        </div>
      </ModalBase>

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
    </>
  );
}