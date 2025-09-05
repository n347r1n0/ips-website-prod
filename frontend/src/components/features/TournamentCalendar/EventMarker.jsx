// src/components/features/TournamentCalendar/EventMarker.jsx

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Zap, Target } from 'lucide-react';

export function EventMarker({ tournament }) {
  const getEventStyles = () => {
    // Check the new database field first, then fall back to legacy settings_json
    const tournamentType = tournament.tournament_type || tournament.settings_json?.tournament_type || tournament.type;
    switch (tournamentType) {
      case 'Стандартный':
        return {
          Icon: Target,
          glassBg: 'bg-black/10 backdrop-blur-sm',
          colorOverlay: 'bg-deep-teal/15',
          glowColor: 'shadow-[0_0_12px_#38a3ab99]',
          borderColor: 'border-deep-teal',
          iconColor: 'text-deep-teal'
        };
      case 'Специальный':
        return {
          Icon: Star,
          glassBg: 'bg-black/10 backdrop-blur-sm',
          colorOverlay: 'bg-gold-accent/15',
          glowColor: 'shadow-[0_0_12px_#D4AF3799]',
          borderColor: 'border-gold-accent',
          iconColor: 'text-gold-accent'
        };
      case 'Фриролл':
        return {
          Icon: Zap,
          glassBg: 'bg-black/10 backdrop-blur-sm',
          colorOverlay: 'bg-ips-red/15',
          glowColor: 'shadow-[0_0_12px_#ee234699]',
          borderColor: 'border-ips-red',
          iconColor: 'text-ips-red'
        };
      case 'Рейтинговый':
        return {
          Icon: Trophy,
          glassBg: 'bg-black/10 backdrop-blur-sm',
          colorOverlay: 'bg-gradient-to-br from-gold-accent/20 to-deep-teal/20',
          glowColor: 'shadow-[0_0_15px_#D4AF37b3]',
          borderColor: 'border-gold-accent',
          iconColor: 'text-gold-accent'
        };
      default:
        return {
          Icon: Target,
          glassBg: 'bg-black/10 backdrop-blur-sm',
          colorOverlay: 'bg-white/10',
          glowColor: 'shadow-md',
          borderColor: 'border-white/50',
          iconColor: 'text-white'
        };
    }
  };

  const { Icon, glassBg, colorOverlay, glowColor, borderColor, iconColor } = getEventStyles();
  const isMajorEvent = tournament.is_major;

  // Reduced icon sizes by half as requested
  const iconSizeClass = isMajorEvent ? 'w-3 h-3' : 'w-2 h-2';



  // 👇 ЗАМЕНЯЕМ ВЕСЬ БЛОК RETURN НА НОВЫЙ 👇
  return (
    // Используем React Fragment (<>), чтобы сгруппировать несколько независимых элементов
    <>
      {/* === БЛОК №1: ПУЛЬСАЦИЯ (всегда по центру) === */}
      {/* Этот блок будет рендериться только для важных событий */}
      {isMajorEvent && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Эти два div'а отвечают за саму анимацию пульса */}
          <div className="absolute w-full h-full rounded-full bg-gold-accent/20 animate-ping-rare" />
          <div className={`absolute w-8 h-8 rounded-full ${colorOverlay} animate-pulse-rare`} />
        </div>
      )}

      {/* === БЛОК №2: ИКОНКА (остается смещенной вниз) === */}
      <div className="absolute inset-0 flex items-end justify-center pb-3 pointer-events-none">
        {/* Основная glassmorphic иконка */}
        <motion.div
          whileHover={{ scale: 1.15, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          className={`relative z-10 p-2.5 rounded-full border-2 cursor-pointer pointer-events-auto overflow-hidden ${
            glassBg
          } ${
            glowColor
          } ${
            borderColor
          } ${isMajorEvent ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-black/20' : ''}`}
        >
          {/* Цветной overlay поверх "стекла" */}
          <div className={`absolute inset-0 ${colorOverlay}`} />

          {/* Иконка с ярким цветом и обводкой */}
          <Icon className={`relative z-10 ${iconSizeClass} ${iconColor} drop-shadow-lg stroke-2`} />
{/*           <Icon className={`relative z-10 w-4 h-4 ${iconColor} drop-shadow-lg stroke-2`} /> */}
        </motion.div>
      </div>
    </>
  );
}
