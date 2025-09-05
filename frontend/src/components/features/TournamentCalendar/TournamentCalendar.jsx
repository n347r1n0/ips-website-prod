// src/components/features/TournamentCalendar/TournamentCalendar.jsx

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { EventMarker } from './EventMarker.jsx';
import { TournamentListForDay } from './TournamentListForDay.jsx';
import { UpcomingTournamentsModal } from './UpcomingTournamentsModal.jsx';
import { supabase } from '@/lib/supabaseClient';
import { useSearchParams } from 'react-router-dom';
import { useAuthVersion } from '@/hooks/useAuthVersion';

export function TournamentCalendar() {
  const [searchParams] = useSearchParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [highlightedTournamentId, setHighlightedTournamentId] = useState(null);
  const [selectedDayTournaments, setSelectedDayTournaments] = useState(null);
  const [showUpcomingModal, setShowUpcomingModal] = useState(false);
  
  // Auth version that increments on any auth state change
  const authVersion = useAuthVersion();

  const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];



  // Загружаем турниры для видимого месяца

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // Make sure the client is aware of the session (important after OAuth redirect)
        await supabase.auth.getSession();

        const y = currentDate.getFullYear();
        const m = currentDate.getMonth();
        
        // Начало окна - 1-е число видимого месяца
        const start = new Date(y, m, 1).toISOString();
        // Конец окна - через 3 месяца вперед, чтобы всегда были данные для агрегатора
        const end = new Date(y, m + 3, 1).toISOString();

        const { data, error } = await supabase
          .from('tournaments')
          .select('id, name, tournament_date, status, settings_json, tournament_type, is_major')
          .gte('tournament_date', start)
          .lt('tournament_date', end)
          .order('tournament_date', { ascending: true });

        if (error) throw error;
        if (!cancelled) setTournaments(data ?? []);
      } catch (e) {
        if (!cancelled) setError('Failed to load tournaments.');
        console.error('[CAL] fetch error', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [currentDate, authVersion]); // ✅ only these two

  // --- ИЗМЕНЕНИЕ №2: Список ближайших турниров теперь ВЫЧИСЛЯЕТСЯ из уже загруженных данных ---
  const allUpcomingTournaments = useMemo(() => {
    const now = new Date();
    return tournaments
      .filter(t => new Date(t.tournament_date) >= now && t.status !== 'completed')
      .slice(0, 5); // Сортировка не нужна, так как данные уже отсортированы из БД
  }, [tournaments]);

  // Handle URL parameter for highlighting tournament + fallback to nearest
  useEffect(() => {
    const highlightParam = searchParams.get('highlightTournament');
    let targetTournamentId = null;

    if (highlightParam) {
      targetTournamentId = parseInt(highlightParam);
    } else if (allUpcomingTournaments.length > 0) {
      // Fallback: highlight nearest upcoming tournament for all users
      targetTournamentId = allUpcomingTournaments[0].id;
    }

    setHighlightedTournamentId(targetTournamentId);
  }, [searchParams, allUpcomingTournaments]);

  // Separate effect to handle month jumping to highlighted tournament (only when URL param changes)
  useEffect(() => {
    const highlightParam = searchParams.get('highlightTournament');
    if (highlightParam) {
      const targetTournamentId = parseInt(highlightParam);
      
      // Find the tournament in current month view or upcoming list
      let highlightedTournament = tournaments.find(t => t.id === targetTournamentId);
      if (!highlightedTournament) {
        highlightedTournament = allUpcomingTournaments.find(t => t.id === targetTournamentId);
      }
      
      if (highlightedTournament) {
        const tournamentDate = new Date(highlightedTournament.tournament_date);
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const tournamentMonth = tournamentDate.getMonth(); // Use local month
        const tournamentYear = tournamentDate.getFullYear(); // Use local year
        
        // Only jump to tournament month if we're not already there
        if (currentMonth !== tournamentMonth || currentYear !== tournamentYear) {
          setCurrentDate(new Date(tournamentYear, tournamentMonth, 1));
        }
      }
    }
  }, [searchParams, tournaments]); // Removed currentDate to prevent infinite loops

  const { month, year, firstDayOfMonth, daysInMonth } = useMemo(() => {
    const date = new Date(currentDate);
    return {
      month: date.getMonth(),
      year: date.getFullYear(),
      firstDayOfMonth: (new Date(date.getFullYear(), date.getMonth(), 1).getDay() + 6) % 7,
      daysInMonth: new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(),
    };
  }, [currentDate]);

  const tournamentsByDay = useMemo(() => {
    // Группируем турниры в массивы по дням
    return tournaments.reduce((acc, t) => {
      // Use local date to match calendar display
      const day = new Date(t.tournament_date).getDate();
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(t);
      return acc;
    }, {});
  }, [tournaments]);

  const changeMonth = (offset) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const handleDayClick = (day) => {
    const dayEvents = tournamentsByDay[day] || [];
    if (dayEvents.length > 0) {
      setSelectedDayTournaments(dayEvents);
    }
  };

  const hasUpcomingTournaments = allUpcomingTournaments.length > 0;

  return (
    <div className="relative w-full max-w-5xl mx-auto p-4 md:p-8 glassmorphic-panel rounded-3xl">
      {/* === ШАПКА КАЛЕНДАРЯ === */}
      <div className="flex items-center justify-between mb-6 relative z-40">
        <motion.button 
          onClick={() => changeMonth(-1)} 
          whileHover={{ scale: 1.1 }} 
          whileTap={{ scale: 0.9 }} 
          className="p-2 rounded-full hover:bg-white/10 transition-colors relative z-50 min-w-[44px] min-h-[44px]"
          type="button"
          aria-label="Предыдущий месяц"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </motion.button>
        <h2 className="text-2xl md:text-3xl font-bold font-brand text-white tracking-wider first-letter:uppercase">
          {currentDate.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}
        </h2>
        <motion.button 
          onClick={() => changeMonth(1)} 
          whileHover={{ scale: 1.1 }} 
          whileTap={{ scale: 0.9 }} 
          className="p-2 rounded-full hover:bg-white/10 transition-colors relative z-50 min-w-[44px] min-h-[44px]"
          type="button"
          aria-label="Следующий месяц"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </motion.button>
      </div>



      {/* === ИНДИКАТОР ЗАГРУЗКИ И ОШИБОК === */}
      {loading && <div className="text-center text-white/80 p-4">Загрузка событий...</div>}
      {error && <div className="text-center text-ips-red p-4">{error}</div>}

      {/* === СЕТКА КАЛЕНДАРЯ === */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 text-white">
        {daysOfWeek.map((day, index) => (
          <div key={day} className={`text-center font-bold text-sm py-2 ${index >= 5 ? 'text-gold-accent/80' : 'text-white/50'}`}>
            {day}
          </div>
        ))}

        {Array.from({ length: firstDayOfMonth }).map((_, index) => <div key={`empty-${index}`} />)}

        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const dayEvents = tournamentsByDay[day] || [];
          const tournament = dayEvents.length > 0 ? dayEvents[0] : null; // Для EventMarker берем первый
          const dayOfWeek = new Date(year, month, day).getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const hasHighlightedTournament = dayEvents.some(t => t.id === highlightedTournamentId);
          const isClickable = dayEvents.length > 0;

          return (
            <motion.div
              key={day}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: (firstDayOfMonth + index) * 0.02 }}
              onClick={() => isClickable && handleDayClick(day)}
              className={`relative aspect-square rounded-lg transition-all duration-300 ${
                hasHighlightedTournament 
                  ? 'bg-gold-accent/20 border-2 border-gold-accent shadow-[0_0_20px_rgba(212,175,55,0.4)] cursor-pointer hover:bg-gold-accent/30' 
                  : new Date(year, month, day).toDateString() === new Date().toDateString()
                    ? 'bg-white/10 border-2 border-white/30 hover:bg-white/15' // Today's styling
                    : isWeekend 
                      ? `bg-gold-accent/5 border-2 border-gold-accent/20 ${isClickable ? 'cursor-pointer hover:bg-gold-accent/20' : 'hover:bg-gold-accent/10'}` 
                      : `bg-black/20 border border-white/25 ${isClickable ? 'cursor-pointer hover:bg-white/25' : 'hover:bg-white/15'}`
              }`}
            >
              <div className={`absolute inset-0 flex justify-center transition-all duration-300 ${tournament ? 'items-start pt-1' : 'items-center'}`}>
                <span className={`absolute text-5xl md:text-6xl font-bold select-none pointer-events-none ${isWeekend ? 'text-gold-accent' : 'text-white'} watermark-number-outline ${tournament?.is_major ? '[text-shadow:0_0_10px_theme(colors.ips-red)]' : ''}`}>
                  {day}
                </span>
                <span className={`absolute text-5xl md:text-6xl font-bold select-none pointer-events-none ${isWeekend ? 'text-gold-accent' : 'text-white'} watermark-number-filled ${tournament?.is_major ? '[text-shadow:0_0_10px_theme(colors.ips-red)]' : ''}`}>
                  {day}
                </span>
              </div>

              {/* Рендер маркера и бейджа +N */}
              {dayEvents.length > 0 && (
                <>
                  <EventMarker tournament={dayEvents[0]} />
                  {dayEvents.length > 1 && (
                    <div className="absolute top-1 right-1 text-[10px] leading-none bg-white/10 border border-white/30 rounded px-1.5 py-0.5 z-20">
                      +{dayEvents.length - 1}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Ближайшие турниры button - responsive design */}
      {hasUpcomingTournaments && !selectedDayTournaments && !showUpcomingModal && (
        <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-30">
          <motion.button
            onClick={() => setShowUpcomingModal(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Ближайшие турниры"
            className={`
              bg-gold-accent/20 border-2 border-gold-accent shadow-[0_0_20px_rgba(212,175,55,0.4)] 
              text-gold-accent font-medium backdrop-blur-sm transition-all duration-300 hover:bg-gold-accent/30
              md:px-4 md:py-3 md:rounded-xl md:flex md:items-center md:space-x-2
              w-12 h-12 rounded-full flex items-center justify-center md:w-auto md:h-auto
            `}
          >
            <Calendar className="w-5 h-5 md:w-5 md:h-5" />
            <span className="hidden md:inline">Ближайшие турниры</span>
          </motion.button>
        </div>
      )}

      {/* Tournament List Modal */}
      {selectedDayTournaments && (
        <TournamentListForDay
          tournaments={selectedDayTournaments}
          onClose={() => setSelectedDayTournaments(null)}
        />
      )}

      {/* Upcoming Tournaments Modal */}
      {showUpcomingModal && (
        <UpcomingTournamentsModal
          tournaments={allUpcomingTournaments}
          onClose={() => setShowUpcomingModal(false)}
        />
      )}
    </div>
  );
}
