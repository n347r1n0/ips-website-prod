// frontend/src/pages/DashboardPage.jsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  LogOut, User, Trophy, Calendar, Settings, Edit3, Camera, 
  MapPin, Clock, Star, Target, Zap, Award, TrendingUp,
  Users, Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Section } from '@/components/layout/Section';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/Toast';
import { ModalBase } from '@/components/ui/ModalBase/ModalBase';
import { AvatarField } from '@/components/features/Profile/AvatarField';

export function DashboardPage() {
  const { user, profile, signOut, isAdmin, loadUserProfile } = useAuth();
  const toast = useToast();
  const avatarRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // State for dashboard data
  const [dashboardData, setDashboardData] = useState({
    playedTournaments: 0,
    ratingPosition: null,
    totalPoints: 0,
    nextTournament: null,
    upcomingRegistrations: [],
    recentResults: [],
    loading: true
  });
  
  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    nickname: '',
    full_name: '',
    avatar_url: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Load dashboard data
  useEffect(() => {
    if (!user) return;
    
    const loadDashboardData = async () => {
      try {
        await supabase.auth.getSession();
        
        // Get played tournaments count (completed tournaments with final_place)
        const { data: playedData } = await supabase
          .from('tournament_participants')
          .select(`
            tournament_id,
            tournaments!inner(status)
          `)
          .eq('user_id', user.id)
          .or('final_place.not.is.null,tournaments.status.eq.completed');
        
        const playedCount = playedData?.length || 0;

        // Get rating position and points
        const { data: ratingsData } = await supabase
          .from('global_player_ratings_v1')
          .select('*')
          .order('total_points', { ascending: false });
        
        let ratingPosition = null;
        let totalPoints = 0;
        
        if (ratingsData) {
          const userKey = `user:${user.id}`;
          const userRating = ratingsData.find(r => r.player_key === userKey);
          if (userRating) {
            totalPoints = userRating.total_points;
            ratingPosition = ratingsData.findIndex(r => r.player_key === userKey) + 1;
          }
        }

        // Get next tournament user is registered for
        const { data: nextTournamentData } = await supabase
          .from('tournament_participants')
          .select(`
            tournaments!inner(
              id, name, tournament_date, status,
              settings_json, tournament_type
            )
          `)
          .eq('user_id', user.id)
          .gte('tournaments.tournament_date', new Date().toISOString())
          .neq('tournaments.status', 'completed')
          .order('tournaments.tournament_date', { ascending: true })
          .limit(1);
        
        const nextTournament = nextTournamentData?.[0]?.tournaments || null;

        // Get upcoming registrations (next 5)
        const { data: upcomingData } = await supabase
          .from('tournament_participants')
          .select(`
            tournaments!inner(
              id, name, tournament_date, status,
              settings_json, tournament_type, is_major
            )
          `)
          .eq('user_id', user.id)
          .gte('tournaments.tournament_date', new Date().toISOString())
          .neq('tournaments.status', 'completed')
          .order('tournaments.tournament_date', { ascending: true })
          .limit(5);
        
        const upcomingRegistrations = upcomingData?.map(item => item.tournaments) || [];

        // Get recent results (last 5 completed tournaments)
        const { data: recentData } = await supabase
          .from('tournament_participants')
          .select(`
            final_place, rating_points,
            tournaments!inner(
              id, name, tournament_date, status,
              settings_json, tournament_type, is_major
            )
          `)
          .eq('user_id', user.id)
          .eq('tournaments.status', 'completed')
          .not('final_place', 'is', null)
          .order('tournaments.tournament_date', { ascending: false })
          .limit(5);
        
        const recentResults = recentData || [];

        setDashboardData({
          playedTournaments: playedCount,
          ratingPosition,
          totalPoints,
          nextTournament,
          upcomingRegistrations,
          recentResults,
          loading: false
        });
        
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast.error('Ошибка загрузки данных профиля');
        setDashboardData(prev => ({ ...prev, loading: false }));
      }
    };

    loadDashboardData();
  }, [user, toast]);

  // Viewport for fullScreen modal on mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 480);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Initialize profile form when profile loads
  useEffect(() => {
    if (profile) {
      setProfileForm({
        nickname: profile.nickname || '',
        full_name: profile.full_name || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile]);

  // Helper function to get tournament type color
  const getTournamentTypeColor = (tournament) => {
    const tournamentType = tournament.settings_json?.tournament_type || tournament.tournament_type;
    switch (tournamentType) {
      case 'Стандартный': return 'text-deep-teal';
      case 'Специальный': return 'text-gold-accent';
      case 'Фриролл': return 'text-ips-red';
      case 'Рейтинговый': return 'text-gold-accent';
      default: return 'text-white';
    }
  };

  // Helper function to get tournament type icon
  const getTournamentTypeIcon = (tournament) => {
    const tournamentType = tournament.settings_json?.tournament_type || tournament.tournament_type;
    switch (tournamentType) {
      case 'Стандартный': return Target;
      case 'Специальный': return Star;
      case 'Фриролл': return Zap;
      case 'Рейтинговый': return Trophy;
      default: return Target;
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!user) return;

    setProfileLoading(true);
    try {
      await supabase.auth.getSession();
      // Prepare avatar based on draft/delete flags from AvatarField
      const uploadedUrl = await avatarRef.current?.applyDraft?.();
      const avatarUrl = uploadedUrl ?? (profileForm.avatar_url || '').trim() ?? '';
      
      const { error } = await supabase
        .from('club_members')
        .update({
          nickname: profileForm.nickname.trim(),
          full_name: profileForm.full_name.trim(),
          avatar_url: avatarUrl
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Профиль обновлен');
      setIsEditingProfile(false);
      await loadUserProfile(); // Reload profile data
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Ошибка обновления профиля');
    } finally {
      setProfileLoading(false);
    }
  };

  const displayName = profile?.nickname || profile?.full_name || user?.email?.split('@')[0] || 'Игрок';

  const stats = [
    { 
      icon: Trophy, 
      label: 'Турниры сыграно', 
      value: dashboardData.loading ? '...' : dashboardData.playedTournaments,
      color: 'text-gold-accent'
    },
    { 
      icon: TrendingUp, 
      label: 'Позиция в рейтинге', 
      value: dashboardData.loading ? '...' : (dashboardData.ratingPosition ? `#${dashboardData.ratingPosition}` : 'N/A'),
      color: 'text-deep-teal',
      subtitle: dashboardData.totalPoints > 0 ? `${dashboardData.totalPoints} очков` : null
    },
    { 
      icon: Calendar, 
      label: 'Ближайший турнир', 
      value: dashboardData.loading ? '...' : (dashboardData.nextTournament ? 'записан' : 'не записан'),
      color: dashboardData.nextTournament ? 'text-green-400' : 'text-white/70',
      subtitle: dashboardData.nextTournament ? new Date(dashboardData.nextTournament.tournament_date).toLocaleDateString('ru-RU') : null
    },
  ];

  return (
    <Section>
      <div className="max-w-6xl mx-auto px-4">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GlassPanel>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div className="flex flex-col min-[381px]:flex-row items-center gap-4 sm:gap-6">
                  {/* Avatar */}
                  <div className="w-20 h-20 rounded-full neumorphic-inset flex items-center justify-center overflow-hidden">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-brand-role font-bold text-white/80">
                        {displayName[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  {/* Profile Info */}
                  <div className="text-center min-[381px]:text-left">
                    <h1 className="text-3xl font-brand-role font-bold text-white mb-2">
                      Добро пожаловать, {displayName}!
                    </h1>
                    <p className="text-white/70 text-lg">Личный кабинет участника клуба</p>
                    {profile?.full_name && profile.full_name !== displayName && (
                      <p className="text-gold-accent/80 text-sm">{profile.full_name}</p>
                    )}
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => setIsEditingProfile(true)}
                    className="btn-clay btn-secondary p-2"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={signOut}
                    className="btn-neutral btn-sm"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Выйти
                  </Button>
                </div>
              </div>
            </div>
          </GlassPanel>
        </motion.div>

        {/* Profile Edit Modal (ModalBase with portal/priority; fullScreen allowed on mobile) */}
        <ModalBase
          isOpen={isEditingProfile}
          onClose={() => setIsEditingProfile(false)}
          title="Редактировать профиль"
          usePortal
          priority
          footerActions={(
            <>
              <Button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="btn-neutral btn-md"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                form="profile-edit-form"
                className="btn-clay btn-primary btn-md"
                disabled={profileLoading}
              >
                Сохранить
              </Button>
            </>
          )}
        >
          <form id="profile-edit-form" className="space-y-4" onSubmit={handleProfileUpdate}>
            <div>
              <label className="text-white/80 text-sm font-medium mb-2 block">Никнейм</label>
              <input
                type="text"
                value={profileForm.nickname}
                onChange={(e) => setProfileForm(prev => ({ ...prev, nickname: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-gold-accent/50"
                placeholder="Ваш игровой никнейм"
              />
            </div>
            <div>
              <label className="text-white/80 text-sm font-medium mb-2 block">Полное имя</label>
              <input
                type="text"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-gold-accent/50"
                placeholder="Ваше полное имя"
              />
            </div>
            <div>
              <AvatarField
                ref={avatarRef}
                value={profileForm.avatar_url}
                onChange={(url) => setProfileForm(prev => ({ ...prev, avatar_url: url }))}
                initialValue={profile?.avatar_url || ''}
                telegramHint={Boolean(profile?.telegram_id || (profile?.avatar_url && /t\.me|telegram|tg\./i.test(profile.avatar_url)))}
                userId={user?.id || ''}
              />
            </div>
          </form>
        </ModalBase>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
            >
              <GlassPanel className="h-full">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-white/70 font-medium">{stat.label}</h3>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <p className={`text-3xl font-brand-role font-bold ${stat.color} mb-1`}>
                    {stat.value}
                  </p>
                  {stat.subtitle && (
                    <p className="text-white/60 text-sm">{stat.subtitle}</p>
                  )}
                </div>
              </GlassPanel>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Upcoming Registrations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <GlassPanel className="h-full">
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Calendar className="w-5 h-5 text-gold-accent" />
                  <h2 className="text-xl font-brand-role font-bold text-white">Предстоящие турниры</h2>
                </div>
                
                {dashboardData.loading ? (
                  <div className="text-center text-white/70 py-8">Загрузка...</div>
                ) : dashboardData.upcomingRegistrations.length === 0 ? (
                  <div className="text-center text-white/70 py-8">
                    <p>Нет предстоящих регистраций</p>
                    <Link to="/#calendar" className="text-gold-accent hover:underline text-sm">
                      Перейти к календарю
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dashboardData.upcomingRegistrations.map((tournament) => {
                      const TypeIcon = getTournamentTypeIcon(tournament);
                      const typeColor = getTournamentTypeColor(tournament);
                      return (
                        <div key={tournament.id} className="glassmorphic-panel rounded-xl p-4 border border-white/10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <TypeIcon className={`w-4 h-4 ${typeColor}`} />
                              <div>
                                <h3 className="text-white font-medium">{tournament.name}</h3>
                                <p className="text-white/60 text-sm">
                                  {new Date(tournament.tournament_date).toLocaleDateString('ru-RU')} • {' '}
                                  {new Date(tournament.tournament_date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                            {tournament.is_major && (
                              <Star className="w-4 h-4 text-ips-red" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </GlassPanel>
          </motion.div>

          {/* Recent Results */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <GlassPanel className="h-full">
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Trophy className="w-5 h-5 text-gold-accent" />
                  <h2 className="text-xl font-brand-role font-bold text-white">Последние результаты</h2>
                </div>
                
                {dashboardData.loading ? (
                  <div className="text-center text-white/70 py-8">Загрузка...</div>
                ) : dashboardData.recentResults.length === 0 ? (
                  <div className="text-center text-white/70 py-8">
                    <p>Нет завершенных турниров</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dashboardData.recentResults.map((result, index) => {
                      const tournament = result.tournaments;
                      const TypeIcon = getTournamentTypeIcon(tournament);
                      const typeColor = getTournamentTypeColor(tournament);
                      return (
                        <div key={`${tournament.id}-${index}`} className="glassmorphic-panel rounded-xl p-4 border border-white/10">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <TypeIcon className={`w-4 h-4 ${typeColor}`} />
                              <div>
                                <h3 className="text-white font-medium">{tournament.name}</h3>
                                <p className="text-white/60 text-sm">
                                  {new Date(tournament.tournament_date).toLocaleDateString('ru-RU')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-white font-bold">#{result.final_place}</div>
                              <div className={`text-sm ${result.rating_points > 0 ? 'text-gold-accent' : 'text-white/60'}`}>
                                +{result.rating_points} очков
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </GlassPanel>
          </motion.div>
        </div>

        {/* Admin Panel */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-8"
          >
            <GlassPanel className="border-gold-accent/30">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-brand-role font-bold text-gold-accent flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Admin Panel
                  </h2>
                </div>
                <p className="text-white/70 mb-6 text-sm">
                  Tournament management, participants, and club settings
                </p>
                <Link to="/admin">
                  <Button className="btn-clay btn-secondary btn-lg flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Open Admin Panel
                  </Button>
                </Link>
              </div>
            </GlassPanel>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-8"
        >
          <GlassPanel>
            <div className="p-8">
              <h2 className="text-2xl font-brand-role font-bold text-white text-center mb-6">Быстрые действия</h2>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/#calendar">
                  <Button className="btn-clay btn-primary btn-lg flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Календарь турниров
                  </Button>
                </Link>
                <Link to="/#rating">
                  <Button className="btn-clay btn-secondary btn-lg flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Рейтинг игроков
                  </Button>
                </Link>
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </Section>
  );
}
