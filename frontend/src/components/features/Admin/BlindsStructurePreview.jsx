// src/components/features/Admin/BlindsStructurePreview.jsx

import React from 'react';
import { Clock, Coffee } from 'lucide-react';

export function BlindsStructurePreview({ structure }) {
  if (!structure || structure.length === 0) {
    return (
      <div className="glassmorphic-panel border border-white/30 rounded-xl px-4 py-3">
        <p className="text-gray-400 text-sm italic">Structure not set</p>
      </div>
    );
  }

  const levels = structure.filter(level => !level.is_break).length;
  const breaks = structure.filter(level => level.is_break).length;
  const totalDuration = structure.reduce((sum, level) => sum + (level.duration || 0), 0);

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="glassmorphic-panel border border-white/30 rounded-xl px-4 py-3">
      <div className="flex items-center space-x-4 text-sm text-gray-300">
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-1 text-gold-accent" />
          <span>{levels} levels</span>
        </div>
        {breaks > 0 && (
          <div className="flex items-center">
            <Coffee className="w-4 h-4 mr-1 text-gold-accent" />
            <span>{breaks} breaks</span>
          </div>
        )}
        {totalDuration > 0 && (
          <div className="text-gold-accent">
            ~{formatDuration(totalDuration)} total
          </div>
        )}
      </div>
      {structure.length > 0 && (
        <div className="mt-2 text-xs text-gray-400">
          First level: {structure[0].small_blind}/{structure[0].big_blind}
          {structure[0].ante && ` (${structure[0].ante} ante)`}
        </div>
      )}
    </div>
  );
}