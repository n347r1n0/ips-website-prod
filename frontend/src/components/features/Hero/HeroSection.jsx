// frontend/src/components/features/Hero/HeroSection.jsx

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Play } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

export function HeroSection({ videoSources, currentVideoIndex, scrollToUserPaths }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  function GoldLine() {
    return <div className="art-deco-divider" />;
  }

  return (
    <div className="relative h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0">
        <AnimatePresence>
          {videoSources.map((src, index) => (
            index === currentVideoIndex && (
              <motion.video
                // 👇 1. ИЗМЕНЕНИЕ ЗДЕСЬ: ключ должен быть строкой, а не объектом
                key={src.mp4}
                // 👇 2. ИЗМЕНЕНИЕ ЗДЕСЬ: удаляем ref, чтобы не было конфликта
                // ref={el => videoRefs.current[index] = el}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5 }}
                autoPlay muted loop playsInline
                className="absolute inset-0 w-full h-full object-cover brightness-[0.5] contrast-[1.1]"
              >
                <source src={src.webm} type="video/webm" />
                <source src={src.mp4} type="video/mp4" />
              </motion.video>
            )
          ))}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="home-hero-foreground relative z-10 w-full max-w-md sm:max-w-lg md:max-w-2xl"
      >
        <GlassPanel>
          <div className="text-center text-white p-4 md:p-8">
            <GoldLine />
            <div className="my-4 md:my-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-wider font-brand uppercase leading-tight">
                International
              </h1>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium text-gold-accent tracking-widest font-brand uppercase leading-tight">
                Poker Style
              </h2>
            </div>
            <p className="text-base md:text-lg text-white/80 italic mb-6">
              "Следующий турнир: 6 августа"
            </p>
            <Button
              onClick={() => {
                if (user) {
                  // Authenticated user - scroll to calendar
                  if (location.pathname !== '/') {
                    // Not on home page, navigate to home with calendar anchor
                    navigate('/#calendar');
                  } else {
                    // On home page, smooth scroll to calendar
                    const calendarElement = document.getElementById('calendar');
                    if (calendarElement) {
                      calendarElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }
                } else {
                  // Unauthenticated user - scroll to user paths
                  if (location.pathname !== '/') {
                    // Not on home page, navigate to home with user paths anchor
                    navigate('/#userpaths');
                  } else {
                    // On home page, use provided function or fallback
                    if (scrollToUserPaths) {
                      scrollToUserPaths();
                    } else {
                      const userPathsElement = document.getElementById('user-paths-section');
                      if (userPathsElement) {
                        userPathsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }
                  }
                }
              }}
              className="luxury-button px-6 py-3 text-base md:text-lg rounded-xl font-bold tracking-wide transform hover:scale-105"
            >
              <Play className="w-5 h-5 mr-2 inline-block" />
              Забронировать место
            </Button>
            <div className="mt-4 md:mt-6">
              <GoldLine />
            </div>
          </div>
        </GlassPanel>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-10"
      >
        <ChevronDown className="w-8 h-8 text-gold-accent animate-bounce" />
      </motion.div>
    </div>
  );
}
