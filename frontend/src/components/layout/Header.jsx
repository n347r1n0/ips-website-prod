// frontend/src/components/layout/Header.jsx

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button.jsx";
import { User, LogOut, Instagram, Send, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { socialLinks } from "@/config/socialLinks";
import { VkIcon } from "@/components/ui/icons/VkIcon";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/features/Auth/AuthModal";

export default function Header({ isAuthModalOpen, setIsAuthModalOpen }) {
  const [isScrolled, setIsScrolled] = useState(false);

  const { user, signOut, nickname, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (sectionId) => {
    if (location.pathname !== '/') {
      // Если не на главной странице, переходим с hash
      navigate(`/#${sectionId}`);
    } else {
      // Если уже на главной, просто скроллим
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const navigationItems = [
    { label: 'Главная', id: 'hero' },
    { label: 'О клубе', id: 'about' },
    { label: 'Календарь', id: 'calendar' },
    { label: 'Рейтинг', id: 'rating' },
    { label: 'Галерея', id: 'gallery' },
  ];

  // NOTE: Mobile section links removed in favor of social actions (see below)

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'glassmorphic-panel border-b border-white/10'
            : 'bg-gradient-to-b from-black/50 to-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo → scroll to Hero via hash (handled globally) */}
            <Link to="/#hero" aria-label="Перейти к началу" className="cursor-pointer">
              <motion.div whileHover={{ scale: 1.05 }}>
                <img
                  src="/logo/Logo_IPS.svg"
                  alt="International Poker Style Logo"
                  className="h-14 w-auto"
                />
              </motion.div>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              {navigationItems.map((item) => (
                <button key={item.id} onClick={() => handleNavClick(item.id)}
                  className="text-gray-300 hover:text-white transition-colors duration-300 font-body text-lg relative group"
                >
                  {item.label}
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gold-accent transition-all duration-300 group-hover:w-full" />
                </button>
              ))}
            </nav>

            {/* 👇 2. ОБНОВЛЕННЫЙ БЛОК АУТЕНТИФИКАЦИИ 👇 */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-4">
                {user ? (
                  // Если пользователь залогинен
                  <>
                    {isAdmin && (
                      <Link to="/admin">
                        <Button className={`luxury-button px-6 py-2 rounded-xl ${location.pathname === '/admin' ? 'bg-gold-accent/80 cursor-default' : ''}`}>
                          Админ-панель
                        </Button>
                      </Link>
                    )}
                    {location.pathname === '/dashboard' ? (
                      // Если мы уже в кабинете - показываем неактивную кнопку
                      <Button className="luxury-button px-6 py-2 rounded-xl bg-gold-accent/80 cursor-default">
                        <User className="w-4 h-4 mr-2" />
                        {nickname || 'Кабинет'}
                      </Button>
                    ) : (
                      // Если мы НЕ в кабинете - показываем ссылку на него
                      <Link to="/dashboard">
                        <Button className="luxury-button px-6 py-2 rounded-xl">
                          <User className="w-4 h-4 mr-2" />
                          {nickname || 'Кабинет'}
                        </Button>
                      </Link>
                    )}
                    <Button onClick={handleSignOut} className="btn-glass px-4 py-2 rounded-xl text-white border-white/30 hover:bg-white/10">
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  // Если гость
                  <Button onClick={() => setIsAuthModalOpen(true)} className="luxury-button px-6 py-2 rounded-xl">
                    <User className="w-4 h-4 mr-2" />
                    Вход / Регистрация
                  </Button>
                )}
              </div>

              {/* Mobile actions: socials + auth/profile (no section tabs) */}
              <div className="md:hidden flex items-center gap-2 text-[--fg-strong]">
                {/* Each action: min 44x44 hit-area, inherits currentColor */}
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Открыть Instagram"
                  className="h-11 w-11 flex items-center justify-center rounded-[var(--r-m)] hover:opacity-90 focus:outline-none focus:[box-shadow:var(--ring)]"
                >
                  <Instagram className="w-5 h-5" aria-hidden="true" />
                </a>
                <a
                  href={socialLinks.vk}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Открыть VK"
                  className="h-11 w-11 flex items-center justify-center rounded-[var(--r-m)] hover:opacity-90 focus:outline-none focus:[box-shadow:var(--ring)]"
                >
                  <VkIcon className="w-5 h-5" aria-hidden="true" />
                </a>
                <a
                  href={socialLinks.tgChannel}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Открыть Telegram-канал"
                  className="h-11 w-11 flex items-center justify-center rounded-[var(--r-m)] hover:opacity-90 focus:outline-none focus:[box-shadow:var(--ring)]"
                >
                  <Send className="w-5 h-5" aria-hidden="true" />
                </a>
                <a
                  href={socialLinks.tgBot}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Открыть Telegram-бот"
                  className="h-11 w-11 flex items-center justify-center rounded-[var(--r-m)] hover:opacity-90 focus:outline-none focus:[box-shadow:var(--ring)]"
                >
                  <Bot className="w-5 h-5" aria-hidden="true" />
                </a>
                {/* Auth/Profile — bigger touch target, distinct states */}
                {user ? (
                  location.pathname === '/dashboard' ? (
                    <Link
                      to="/dashboard"
                      aria-label="Профиль (текущая страница)"
                      aria-current="page"
                      className="h-12 w-12 flex items-center justify-center rounded-[var(--r-m)] cursor-default text-gold-accent shadow-[0_0_8px_theme(colors.gold-accent/35%)] focus:outline-none focus:[box-shadow:var(--ring)]"
                    >
                      <User className="w-7 h-7" aria-hidden="true" />
                    </Link>
                  ) : (
                    <Link
                      to="/dashboard"
                      aria-label="Открыть профиль"
                      className="h-12 w-12 flex items-center justify-center rounded-[var(--r-m)] text-deep-teal shadow-[0_0_8px_theme(colors.deep-teal/35%)] hover:opacity-90 focus:outline-none focus:[box-shadow:var(--ring)]"
                    >
                      <User className="w-7 h-7" aria-hidden="true" />
                    </Link>
                  )
                ) : (
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    aria-label="Вход / Регистрация"
                    className="h-12 w-12 flex items-center justify-center rounded-[var(--r-m)] text-[--fg-strong] hover:opacity-90 focus:outline-none focus:[box-shadow:var(--ring)]"
                  >
                    <User className="w-7 h-7" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

      </motion.header>

      <div className="h-20" />

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );

}
