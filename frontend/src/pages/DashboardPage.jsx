// frontend/src/pages/private/DashboardPage.jsx

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Section } from '@/components/layout/Section';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { LogOut, User, Trophy, Calendar, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom'; // Импортируем Link для навигации

export function DashboardPage() {
  const { user, signOut, isAdmin } = useAuth();

  // Плейсхолдер для статистики, позже будем брать реальные данные
  const stats = [
    { icon: Trophy, label: 'Турниры сыграно', value: '0' },
    { icon: User, label: 'Позиция в рейтинге', value: 'N/A' },
    { icon: Calendar, label: 'Ближайший турнир', value: 'не записан' },
  ];

  return (
    <Section>
      <div className="max-w-5xl mx-auto px-4">
        {/* Шапка дашборда */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GlassPanel>
            <div className="p-6 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-brand text-white mb-1">
                  Личный кабинет
                </h1>
                <p className="text-white/70">
                  Добро пожаловать, {user?.user_metadata?.nickname || user?.email.split('@')[0]}!
                </p>
              </div>
              <Button onClick={signOut} className="luxury-button px-6 py-2 rounded-xl">
                <LogOut className="w-4 h-4 mr-2" />
                Выйти
              </Button>
            </div>
          </GlassPanel>
        </motion.div>

        {/* Сетка со статистикой */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
            >
              <GlassPanel>
                <div className="p-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-white/70">{stat.label}</h3>
                    <stat.icon className="w-6 h-6 text-gold-accent" />
                  </div>
                  <p className="text-4xl font-brand text-white mt-2">{stat.value}</p>
                </div>
              </GlassPanel>
            </motion.div>
          ))}
        </div>

        {/* Админ-панель (только для администраторов) */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8"
          >
            <GlassPanel className="border-gold-accent/30">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-brand text-gold-accent flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Панель администратора
                  </h2>
                </div>
                <p className="text-white/70 mb-6 text-sm">
                  Управление турнирами, участниками и настройками клуба
                </p>
                <Link to="/admin">
                  <Button className="luxury-button px-6 py-3 rounded-xl flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Открыть админ-панель
                  </Button>
                </Link>
              </div>
            </GlassPanel>
          </motion.div>
        )}

        {/* Быстрые действия */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8"
        >
          <GlassPanel>
            <div className="p-8">
              <h2 className="text-2xl font-brand text-white text-center mb-6">Быстрые действия</h2>
              <div className="flex justify-center gap-6">
                <Link to="/#calendar" className="luxury-button px-8 py-4 rounded-xl">
                  Смотреть календарь
                </Link>
                <Link to="/#rating" className="luxury-button px-8 py-4 rounded-xl">
                  Рейтинг игроков
                </Link>
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      </div>
    </Section>
  );
}
