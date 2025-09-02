// frontend/src/components/features/UserPaths/UserPathsSection.jsx

import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, UserPlus, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { useAuth } from '@/contexts/AuthContext';

export function UserPathsSection({ onAuthModalOpen, onGuestModalOpen }) {
  const { user } = useAuth();

  const paths = [
    {
      id: 'guest',
      icon: MessageCircle,
      title: 'Запись для Гостей',
      subtitle: 'Без создания аккаунта',
      description: 'Быстрая запись на турнир. Выберите удобный для вас способ.',
      actions: [
        {
          type: 'telegram',
          cta: 'Записаться в Telegram',
          href: 'https://t.me/your_bot_username',
          external: true,
          primary: true
        },
        {
          type: 'form',
          cta: 'Или заполнить форму на сайте',
          action: onGuestModalOpen,
          primary: false
        }
      ],
      primary: false
    },
    {
      id: 'member',
      icon: UserPlus,
      title: 'Членство в клубе',
      subtitle: 'Войти или зарегистрироваться',
      description: 'Получите доступ к личному кабинету, статистике игр, рейтингам и эксклюзивным бонусам клуба.',
      cta: user ? 'Уже член клуба ✓' : 'Войти / Стать членом клуба',
      action: user ? null : onAuthModalOpen,
      primary: !user,
      disabled: !!user
    }
  ];

  return (
    <section className="py-20 relative">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-brand text-white mb-4 gold-highlight">
            Способы участия
          </h2>
          <p className="text-xl text-white/70 tracking-wide max-w-2xl mx-auto">
            Выберите наиболее удобный способ записи на турнир
          </p>
        </motion.div>

        <div className={`grid gap-8 ${user ? 'md:grid-cols-1 max-w-md mx-auto' : 'md:grid-cols-2'}`}>
          {paths.filter(path => !(path.id === 'guest' && user)).map((path, index) => {
            const IconComponent = path.icon;
            return (
              <motion.div
                key={path.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative group"
              >
                <GlassPanel className={`h-full transition-all duration-300 group-hover:scale-105 ${
                  path.primary ? 'ring-2 ring-gold-accent/50' : ''
                }`}>
                  <div className="p-8 text-center h-full flex flex-col">
                    {path.primary && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className="bg-gold-accent text-black px-4 py-1 rounded-full text-sm font-bold">
                          РЕКОМЕНДУЕМ
                        </div>
                      </div>
                    )}
                    
                    <div className="mb-6">
                      <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${
                        path.primary ? 'bg-gold-accent/20' : 'glassmorphic-panel'
                      }`}>
                        <IconComponent className={`w-8 h-8 ${
                          path.primary ? 'text-gold-accent' : 'text-white'
                        }`} />
                      </div>
                    </div>

                    <h3 className="text-2xl font-brand text-white mb-2">
                      {path.title}
                    </h3>
                    <p className="text-gold-accent/80 text-sm uppercase tracking-wide mb-4">
                      {path.subtitle}
                    </p>
                    <p className="text-white/70 text-sm leading-relaxed mb-8 flex-grow">
                      {path.description}
                    </p>

                    {path.actions ? (
                      <div className="space-y-3">
                        {path.actions.map((actionItem, actionIndex) => (
                          actionItem.external ? (
                            <a
                              key={actionIndex}
                              href={actionItem.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full block"
                            >
                              <Button 
                                className={`w-full py-3 rounded-xl font-medium tracking-wide transition-all ${
                                  actionItem.primary ? 'luxury-button' : 'glassmorphic-panel border border-white/30 text-white hover:bg-white/10'
                                }`}
                              >
                                {actionItem.cta}
                                <ExternalLink className="w-4 h-4 ml-2" />
                              </Button>
                            </a>
                          ) : (
                            <Button
                              key={actionIndex}
                              onClick={actionItem.action}
                              className="w-full py-3 rounded-xl font-medium tracking-wide transition-all text-white underline decoration-gold-accent/50 hover:decoration-gold-accent bg-transparent hover:bg-white/5"
                            >
                              {actionItem.cta}
                            </Button>
                          )
                        ))}
                      </div>
                    ) : (
                      <Button
                        onClick={path.action}
                        disabled={path.disabled}
                        className={`w-full py-3 rounded-xl font-medium tracking-wide transition-all ${
                          path.primary 
                            ? 'luxury-button' 
                            : path.disabled
                            ? 'bg-green-500/20 text-green-400 cursor-not-allowed border border-green-400/30'
                            : 'glassmorphic-panel border border-white/30 text-white hover:bg-white/10'
                        }`}
                      >
                        {path.cta}
                      </Button>
                    )}
                  </div>
                </GlassPanel>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}