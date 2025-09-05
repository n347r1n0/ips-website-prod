// src/components/features/PlayerRatingWidget/PlayerRatingWidget.jsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crown, Trophy, Medal, Star, Target, Zap, Shield, 
  Flame, Award, Users, Calendar, TrendingUp, X,
  Clock, MapPin, Hash, Quote, Maximize2, Table
} from 'lucide-react';
import { GlassPanel } from '../../ui/GlassPanel.jsx';
import { ModalBase } from '../../ui/ModalBase';
import { Button } from '../../ui/Button';

// Расширенные данные игроков с достижениями
const achievementsList = {
  tournament_winner: { icon: Trophy, name: 'Победитель турнира', description: 'Выиграл крупный турнир', color: 'text-gold-accent' },
  high_roller: { icon: Crown, name: 'Хайроллер', description: 'Играет в высоких лимитах', color: 'text-gold-accent' },
  consistent_player: { icon: Target, name: 'Стабильная игра', description: 'Показывает стабильные результаты', color: 'text-deep-teal' },
  bluffer: { icon: Zap, name: 'Мастер блефа', description: 'Известен искусными блефами', color: 'text-ips-red' },
  defender: { icon: Shield, name: 'Защитник', description: 'Осторожная тайтовая игра', color: 'text-white' },
  hot_streak: { icon: Flame, name: 'Горячая полоса', description: 'Серия побед подряд', color: 'text-ips-red' },
  social_player: { icon: Users, name: 'Душа компании', description: 'Любимец клуба', color: 'text-gold-accent' },
  veteran: { icon: Calendar, name: 'Ветеран', description: 'Играет в клубе более года', color: 'text-white' },
  rising_star: { icon: TrendingUp, name: 'Восходящая звезда', description: 'Быстро поднимается в рейтинге', color: 'text-deep-teal' },
};

const topPlayers = [
  { 
    id: 1, rank: 1, name: 'Александр', surname: 'Петров', nickname: 'ROYAL_FLUSH', 
    points: 1540, avatar_url: null, games_played: 120, 
    achievements: ['tournament_winner', 'high_roller', 'consistent_player'],
    status: 'Покер - это не азарт, это искусство принимать решения под давлением.',
    location: 'Москва', joinDate: 'Январь 2023', winRate: 68
  },
  { 
    id: 2, rank: 2, name: 'Максим', surname: 'Иванов', nickname: 'BLUFF_KING', 
    points: 1512, avatar_url: null, games_played: 115,
    achievements: ['bluffer', 'hot_streak', 'social_player'],
    status: 'Лучший блеф - тот, который никто не раскусил.',
    location: 'СПб', joinDate: 'Март 2023', winRate: 64
  },
  { 
    id: 3, rank: 3, name: 'Елена', surname: 'Смирнова', nickname: 'LADY_LUCK', 
    points: 1498, avatar_url: null, games_played: 130,
    achievements: ['consistent_player', 'defender', 'veteran'],
    status: 'Терпение и расчет побеждают эмоции.',
    location: 'Москва', joinDate: 'Октябрь 2022', winRate: 72
  },
  { 
    id: 4, rank: 4, name: 'Дмитрий', surname: 'Козлов', nickname: 'ACE_HUNTER', 
    points: 1485, avatar_url: null, games_played: 110,
    achievements: ['rising_star', 'hot_streak'],
    status: 'Каждая рука - новая возможность.',
    location: 'Казань', joinDate: 'Июнь 2023', winRate: 59
  },
  { 
    id: 5, rank: 5, name: 'София', surname: 'Волкова', nickname: 'QUEEN_BEE', 
    points: 1470, avatar_url: null, games_played: 125,
    achievements: ['social_player', 'consistent_player', 'bluffer'],
    status: 'Улыбка - лучшая маска в покере.',
    location: 'Екатеринбург', joinDate: 'Апрель 2023', winRate: 61
  },
  // Добавляем еще игроков для полного рейтинга
  { id: 6, rank: 6, name: 'Иван', surname: 'Кузнецов', nickname: 'IRON_WILL', points: 1465, avatar_url: null, games_played: 100, achievements: ['defender', 'veteran'], status: 'Играю на долгосрочную перспективу.', location: 'НН', joinDate: 'Декабрь 2022', winRate: 55 },
  { id: 7, rank: 7, name: 'Анна', surname: 'Лебедева', nickname: 'SWAN_GRACE', points: 1450, avatar_url: null, games_played: 118, achievements: ['social_player', 'consistent_player'], status: 'Красота и ум — мои оружия.', location: 'Ростов', joinDate: 'Май 2023', winRate: 63 },
  { id: 8, rank: 8, name: 'Михаил', surname: 'Орлов', nickname: 'EAGLE_EYE', points: 1442, avatar_url: null, games_played: 105, achievements: ['bluffer', 'rising_star'], status: 'Вижу каждый телл, каждое сомнение.', location: 'Казань', joinDate: 'Июль 2023', winRate: 58 },
  { id: 9, rank: 9, name: 'Виктория', surname: 'Новикова', nickname: 'VICTORY_QUEEN', points: 1431, avatar_url: null, games_played: 112, achievements: ['hot_streak', 'social_player'], status: 'Победа любит подготовку.', location: 'СПб', joinDate: 'Август 2023', winRate: 60 },
  { id: 10, rank: 10, name: 'Сергей', surname: 'Воронов', nickname: 'RAVEN_MIND', points: 1420, avatar_url: null, games_played: 98, achievements: ['consistent_player', 'defender'], status: 'Логика и холодный расчет.', location: 'Москва', joinDate: 'Октябрь 2023', winRate: 67 }
];

// Компонент для отображения достижений
function AchievementBadge({ achievement, onHover, onLeave }) {
  const data = achievementsList[achievement];
  if (!data) return null;
  
  const IconComponent = data.icon;
  
  return (
    <div 
      className={`relative w-5 h-5 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-125 bg-black/30 backdrop-blur-sm border border-white/20`}
      onMouseEnter={() => onHover(data)}
      onMouseLeave={onLeave}
    >
      <IconComponent className={`w-3 h-3 ${data.color} stroke-[1.5]`} />
    </div>
  );
}

// Модальное окно с полным рейтингом
function FullRatingModal({ isOpen, onClose, players, onPlayerClick, onAchievementHover, onTooltipLeave }) {
  const [sortBy, setSortBy] = useState('rank');
  const [sortDirection, setSortDirection] = useState('asc');
  
  const sortedPlayers = [...players].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    
    if (sortBy === 'name') {
      aVal = `${a.name} ${a.surname}`;
      bVal = `${b.name} ${b.surname}`;
    }
    
    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });
  
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const getRankDecoration = (rank) => {
    const decorations = {
      1: { icon: Crown, color: "text-gold-accent" },
      2: { icon: Trophy, color: "text-gray-300" },
      3: { icon: Medal, color: "text-amber-600" },
    };
    return decorations[rank] || { icon: Star, color: "text-deep-teal" };
  };

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Полный рейтинг клуба"
      subtitle="Кликните на заголовок столбца для сортировки"
    >

        <div className="overflow-auto">
          <table className="w-full">
                <thead className="sticky top-0 bg-black/70 backdrop-blur-sm">
                  <tr className="text-left text-white/80 border-b border-white/20">
                    <th 
                      className="p-3 cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => handleSort('rank')}
                    >
                      <div className="flex items-center gap-2">
                        # {sortBy === 'rank' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </div>
                    </th>
                    <th 
                      className="p-3 cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        Игрок {sortBy === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </div>
                    </th>
                    <th 
                      className="p-3 text-right cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => handleSort('points')}
                    >
                      <div className="flex items-center justify-end gap-2">
                        Очки {sortBy === 'points' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </div>
                    </th>
                    <th 
                      className="p-3 text-center cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => handleSort('games_played')}
                    >
                      <div className="flex items-center justify-center gap-2">
                        Игр {sortBy === 'games_played' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </div>
                    </th>
                    <th 
                      className="p-3 text-center cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => handleSort('winRate')}
                    >
                      <div className="flex items-center justify-center gap-2">
                        Вин% {sortBy === 'winRate' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </div>
                    </th>
                    <th className="p-3 text-center">Достижения</th>
                    <th className="p-3 text-center">Локация</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPlayers.map((player, index) => {
                    const decoration = getRankDecoration(player.rank);
                    const IconComponent = decoration.icon;
                    return (
                      <motion.tr 
                        key={player.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                        onClick={() => {
                          onPlayerClick(player);
                          onClose();
                        }}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <IconComponent className={`w-5 h-5 ${decoration.color}`} />
                            <span className="text-white font-bold text-lg">{player.rank}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg neumorphic-inset flex items-center justify-center overflow-hidden flex-shrink-0">
                              {player.avatar_url ? (
                                <img src={player.avatar_url} alt={player.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-sm font-bold text-white/80">
                                  {player.name[0]}{player.surname[0]}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="text-white font-bold">{player.name} {player.surname[0]}.</div>
                              <div className="text-sm text-gold-accent/80 font-mono">"{player.nickname}"</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <span className="text-white font-bold text-lg">{player.points.toLocaleString()}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-white/80">{player.games_played}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`font-medium ${
                            player.winRate >= 70 ? 'text-gold-accent' : 
                            player.winRate >= 60 ? 'text-deep-teal' : 'text-white/80'
                          }`}>{player.winRate}%</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            {player.achievements.map(achievement => (
                              <AchievementBadge
                                key={achievement}
                                achievement={achievement}
                                onHover={onAchievementHover}
                                onLeave={onTooltipLeave}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-white/70 text-sm">{player.location}</span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
          </table>
        </div>
    </ModalBase>
  );
}

// Модальное окно с детальной информацией игрока
function PlayerModal({ player, isOpen, onClose }) {
  if (!player) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="relative max-w-2xl w-full glassmorphic-panel rounded-3xl p-8 border border-white/15"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="neutral"
              size="sm"
              onClick={onClose}
              className="absolute -top-2 -right-2 p-2 aspect-square"
              aria-label="Закрыть"
            >
              <X className="w-4 h-4" />
            </Button>

            <div className="text-center mb-8">
              {/* Аватар */}
              <div className="w-24 h-24 mx-auto mb-4 rounded-full neumorphic-inset flex items-center justify-center overflow-hidden">
                {player.avatar_url ? (
                  <img src={player.avatar_url} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-white/80 font-syne">
                    {player.name[0]}{player.surname[0]}
                  </span>
                )}
              </div>
              
              {/* Основная информация */}
              <h2 className="text-3xl font-bold text-white mb-2 font-syne">
                {player.name} {player.surname[0]}.
              </h2>
              <p className="text-xl text-gold-accent mb-4 font-mono">"{player.nickname}"</p>
              
              {/* Статус цитата */}
              <div className="relative mb-6 p-4 glassmorphic-panel rounded-2xl">
                <Quote className="absolute top-2 left-2 w-4 h-4 text-gold-accent/50" />
                <p className="italic text-white/80 text-lg leading-relaxed pt-2">
                  {player.status}
                </p>
              </div>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 glassmorphic-panel rounded-xl">
                <div className="text-2xl font-bold text-gold-accent">{player.points.toLocaleString()}</div>
                <div className="text-xs text-white/60 uppercase">очков</div>
              </div>
              <div className="text-center p-3 glassmorphic-panel rounded-xl">
                <div className="text-2xl font-bold text-deep-teal">{player.games_played}</div>
                <div className="text-xs text-white/60 uppercase">игр</div>
              </div>
              <div className="text-center p-3 glassmorphic-panel rounded-xl">
                <div className="text-2xl font-bold text-white">{player.winRate}%</div>
                <div className="text-xs text-white/60 uppercase">побед</div>
              </div>
              <div className="text-center p-3 glassmorphic-panel rounded-xl">
                <div className="text-2xl font-bold text-ips-red">#{player.rank}</div>
                <div className="text-xs text-white/60 uppercase">место</div>
              </div>
            </div>

            {/* Дополнительная информация */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 p-3 glassmorphic-panel rounded-xl">
                <MapPin className="w-5 h-5 text-gold-accent" />
                <span className="text-white">{player.location}</span>
              </div>
              <div className="flex items-center gap-3 p-3 glassmorphic-panel rounded-xl">
                <Calendar className="w-5 h-5 text-deep-teal" />
                <span className="text-white">В клубе с {player.joinDate}</span>
              </div>
            </div>

            {/* Достижения */}
            <div className="p-4 glassmorphic-panel rounded-2xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-gold-accent" />
                Достижения
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {player.achievements.map(achievement => {
                  const data = achievementsList[achievement];
                  const IconComponent = data.icon;
                  return (
                    <div key={achievement} className="flex items-center gap-3 p-2 rounded-lg bg-black/20">
                      <IconComponent className={`w-5 h-5 ${data.color}`} />
                      <div>
                        <div className="text-white font-medium">{data.name}</div>
                        <div className="text-white/60 text-sm">{data.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function PlayerRatingWidget() {
  const [hoveredTooltip, setHoveredTooltip] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedView, setExpandedView] = useState(false);
  const [tableView, setTableView] = useState(false);

  const getRankDecoration = (rank) => {
    const decorations = {
      1: { icon: Crown, color: "text-gold-accent" },
      2: { icon: Trophy, color: "text-gray-300" },
      3: { icon: Medal, color: "text-amber-600" },
    };
    return decorations[rank] || { icon: Star, color: "text-deep-teal" };
  };

  const handleAchievementHover = (achievement, event) => {
    setHoveredTooltip(achievement);
    setTooltipPosition({ x: event.pageX, y: event.pageY });
  };

  const handlePlayerClick = (player) => {
    setSelectedPlayer(player);
    setModalOpen(true);
  };

  return (
    <>
      <GlassPanel>
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => setTableView(!tableView)}
            className="p-2 rounded-full glassmorphic-panel hover:scale-110 transition-transform duration-200"
            title={tableView ? 'Карточки' : 'Таблица'}
          >
            <Table className={`w-5 h-5 ${tableView ? 'text-gold-accent' : 'text-white/70'}`} />
          </button>
          
          <h2 className="text-3xl font-brand text-center text-white gold-highlight">
            Рейтинг игроков клуба
          </h2>
          
          <button 
            onClick={() => setExpandedView(true)}
            className="p-2 rounded-full glassmorphic-panel hover:scale-110 transition-transform duration-200"
            title="Полный рейтинг"
          >
            <Maximize2 className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {tableView ? (
          // Табличный вид
          <div className="h-96 overflow-y-auto pr-2">
            <table className="w-full">
              <thead className="sticky top-0 bg-black/50 backdrop-blur-sm">
                <tr className="text-left text-white/70 text-sm border-b border-white/10">
                  <th className="p-2">#</th>
                  <th className="p-2">Игрок</th>
                  <th className="p-2 text-right">Очки</th>
                  <th className="p-2 text-center">Игр</th>
                  <th className="p-2 text-center">Вин%</th>
                  <th className="p-2 text-center">Достижения</th>
                </tr>
              </thead>
              <tbody>
                {topPlayers.slice(0, 10).map((player, index) => {
                  const decoration = getRankDecoration(player.rank);
                  const IconComponent = decoration.icon;
                  return (
                    <motion.tr 
                      key={player.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                      onClick={() => handlePlayerClick(player)}
                    >
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <IconComponent className={`w-4 h-4 ${decoration.color}`} />
                          <span className="text-white font-bold">{player.rank}</span>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg neumorphic-inset flex items-center justify-center overflow-hidden flex-shrink-0">
                            {player.avatar_url ? (
                              <img src={player.avatar_url} alt={player.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold text-white/80">
                                {player.name[0]}{player.surname[0]}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="text-white font-medium">{player.name} {player.surname[0]}.</div>
                            <div className="text-xs text-gold-accent/80 font-mono">"{player.nickname}"</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-2 text-right">
                        <span className="text-white font-bold">{player.points.toLocaleString()}</span>
                      </td>
                      <td className="p-2 text-center">
                        <span className="text-white/80">{player.games_played}</span>
                      </td>
                      <td className="p-2 text-center">
                        <span className="text-white/80">{player.winRate}%</span>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center justify-center gap-1">
                          {player.achievements.slice(0, 3).map(achievement => (
                            <AchievementBadge
                              key={achievement}
                              achievement={achievement}
                              onHover={(data) => handleAchievementHover(data, event)}
                              onLeave={() => setHoveredTooltip(null)}
                            />
                          ))}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          // Карточный вид
          <div className="space-y-3 h-96 overflow-y-scroll pr-4 [mask-image:linear-gradient(to_bottom,black_80%,transparent_100%)]">
            {topPlayers.slice(0, 10).map((player, index) => {
              const decoration = getRankDecoration(player.rank);
              const IconComponent = decoration.icon;

              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="glassmorphic-panel rounded-2xl p-3 hover:scale-[1.02] transition-transform duration-300 group cursor-pointer"
                  onClick={() => handlePlayerClick(player)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Аватар */}
                      <div className="w-10 h-10 rounded-lg neumorphic-inset flex items-center justify-center overflow-hidden flex-shrink-0">
                        {player.avatar_url ? (
                          <img src={player.avatar_url} alt={player.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold text-white/80 font-syne">
                            {player.name[0]}{player.surname[0]}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Имя и фамилия */}
                        <h3 className="text-base font-bold text-white tracking-wider truncate">
                          {player.name} {player.surname[0]}.
                        </h3>
                        {/* Никнейм и достижения в одной строке */}
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gold-accent/80 font-mono truncate">
                            "{player.nickname}"
                          </p>
                          <div className="flex items-center gap-1">
                            {player.achievements.slice(0, 3).map(achievement => (
                              <AchievementBadge
                                key={achievement}
                                achievement={achievement}
                                onHover={(data) => handleAchievementHover(data, event)}
                                onLeave={() => setHoveredTooltip(null)}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">{player.points.toLocaleString()}</div>
                        <div className="text-xs text-white/60 uppercase tracking-wider">очков</div>
                      </div>
                      <div className="w-8 h-8 neumorphic-inset rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className={`w-5 h-5 ${decoration.color} drop-shadow-lg`} strokeWidth={2} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </GlassPanel>

      {/* Tooltip для достижений */}
      <AnimatePresence>
        {hoveredTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed z-50 glassmorphic-panel rounded-lg p-3 pointer-events-none border border-gold-accent/30"
            style={{ 
              left: tooltipPosition.x + 10, 
              top: tooltipPosition.y - 60,
              maxWidth: '250px'
            }}
          >
            <div className="text-white font-medium text-sm mb-1">{hoveredTooltip.name}</div>
            <div className="text-white/70 text-xs">{hoveredTooltip.description}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модальное окно игрока */}
      <PlayerModal 
        player={selectedPlayer}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedPlayer(null);
        }}
      />
      
      {/* Расширенный рейтинг */}
      <FullRatingModal 
        isOpen={expandedView}
        onClose={() => setExpandedView(false)}
        players={topPlayers}
        onPlayerClick={handlePlayerClick}
        onAchievementHover={handleAchievementHover}
        onTooltipLeave={() => setHoveredTooltip(null)}
      />
    </>
  );
}
