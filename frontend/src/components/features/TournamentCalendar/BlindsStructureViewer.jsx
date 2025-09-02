// src/components/features/TournamentCalendar/BlindsStructureViewer.jsx

import React from 'react';
import { Clock, Coffee, TrendingUp } from 'lucide-react';

export function BlindsStructureViewer({ blindsStructure }) {
  if (!blindsStructure || blindsStructure.length === 0) {
    return (
      <div className="glassmorphic-panel border border-white/30 rounded-xl p-6">
        <h3 className="text-lg font-heading text-white mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-gold-accent" />
          Структура блайндов
        </h3>
        <p className="text-gray-400 italic">Структура блайндов не настроена</p>
      </div>
    );
  }

  const formatDuration = (minutes) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}ч ${mins}м` : `${hours}ч`;
    }
    return `${minutes}м`;
  };

  const totalLevels = blindsStructure.filter(level => !level.is_break).length;
  const totalBreaks = blindsStructure.filter(level => level.is_break).length;
  const estimatedDuration = blindsStructure.reduce((sum, level) => sum + (level.duration || 0), 0);

  return (
    <div className="glassmorphic-panel border border-white/30 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-heading text-white flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-gold-accent" />
          Структура блайндов
        </h3>
        <div className="text-sm text-gray-400">
          {totalLevels} уровней • {totalBreaks} перерывов • ~{formatDuration(estimatedDuration)}
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto">
        <div className="space-y-2">
          {blindsStructure.map((level, index) => (
            <div
              key={level.id || index}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                level.is_break
                  ? 'bg-blue-500/10 border border-blue-500/30'
                  : 'bg-white/5 border border-white/20 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center space-x-3">
                {level.is_break ? (
                  <Coffee className="w-4 h-4 text-blue-400" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gold-accent/20 text-gold-accent text-xs font-bold flex items-center justify-center">
                    {blindsStructure.filter((l, i) => i <= index && !l.is_break).length}
                  </div>
                )}
                
                <div>
                  <div className="text-white font-medium">
                    {level.is_break ? `Перерыв` : `${level.small_blind}/${level.big_blind}`}
                    {!level.is_break && level.ante > 0 && (
                      <span className="text-gray-400 text-sm ml-2">
                        (ante: {level.ante})
                      </span>
                    )}
                  </div>
                  <div className="text-gray-400 text-xs flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDuration(level.duration || 0)}
                  </div>
                </div>
              </div>

              {!level.is_break && (
                <div className="text-right">
                  <div className="text-white text-sm">
                    SB: {level.small_blind}
                  </div>
                  <div className="text-gray-400 text-xs">
                    BB: {level.big_blind}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {blindsStructure.length > 8 && (
        <div className="mt-4 text-center">
          <div className="text-xs text-gray-500">
            Прокрутите для просмотра всех уровней
          </div>
        </div>
      )}
    </div>
  );
}