// src/components/features/TournamentCalendar/TournamentListForDay.jsx

import React, { useState } from 'react';
import { Clock, Trophy, Star, Zap, Target, Plus } from 'lucide-react';
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
                className="glassmorphic-panel rounded-xl p-5 border border-white/15 hover:border-gold-accent/30 transition-all duration-200 relative"
              >
                {/* Desktop Layout - Full buttons on the right */}
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
                        className="btn-clay"
                        onClick={() => setResultsTournament(tournament)}
                      >
                        Результаты
                      </Button>
                    ) : (
                      <Button
                        className="btn-clay luxury-button"
                        onClick={() => setSelectedTournament(tournament)}
                      >
                        Записаться
                      </Button>
                    )}
                  </div>
                </div>

                {/* Mobile Layout - Compact with floating icon button */}
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
                        <span>{formatTime(tournament.tournament_date)}</span>
                      </div>
                    </div>
                    
                    {tournament.settings_json?.buy_in_cost && (
                      <div className="text-gold-accent font-medium text-sm">
                        Вступительный взнос: ${tournament.settings_json.buy_in_cost}
                      </div>
                    )}
                  </div>

                  {/* Floating Action Button - Bottom Right */}
                  {tournament.status === 'completed' ? (
                    <button
                      onClick={() => setResultsTournament(tournament)}
                      className="absolute bottom-4 right-4 w-11 h-11 bg-gradient-to-r from-clay-400 to-clay-500 hover:from-clay-500 hover:to-clay-600 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
                      aria-label="Результаты"
                    >
                      <Trophy className="w-5 h-5 text-white" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedTournament(tournament)}
                      className="absolute bottom-4 right-4 w-11 h-11 bg-gradient-to-r from-gold-accent to-yellow-500 hover:from-yellow-500 hover:to-gold-accent rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
                      aria-label="Записаться"
                    >
                      <Plus className="w-5 h-5 text-white" />
                    </button>
                  )}
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