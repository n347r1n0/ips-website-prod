// frontend/src/components/layout/Header.jsx

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button.jsx";
import { Menu, X, User, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/features/Auth/AuthModal";

export default function Header({ isAuthModalOpen, setIsAuthModalOpen }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { user, signOut, nickname, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (sectionId) => {
    setIsMobileMenuOpen(false);
    
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

  const handleSignOut = async () => {
    await signOut();
    setIsMobileMenuOpen(false);
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
            <Link to="/" className="cursor-pointer">
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
                    <Button onClick={handleSignOut} variant="outline" className="glassmorphic-panel border-white/30 text-white hover:bg-white/10 px-4 py-2 rounded-xl">
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

              <button
                className="md:hidden p-2 glassmorphic-panel rounded-xl"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden glassmorphic-panel border-t border-white/10"
            >
              <div className="px-6 py-4 space-y-4">
                {navigationItems.map((item) => (
                  <button key={item.id} onClick={() => handleNavClick(item.id)}
                    className="block w-full text-left text-gray-300 hover:text-white py-2 font-body text-lg"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="pt-4 border-t border-white/10">
                  {user ? (
                    <div className="space-y-3">
                       {isAdmin && (
                         <Link to="/admin" className="w-full">
                           <Button className="w-full luxury-button py-3 rounded-xl" onClick={() => setIsMobileMenuOpen(false)}>
                             Админ-панель
                           </Button>
                         </Link>
                       )}
                       <Link to="/dashboard" className="w-full">
                         <Button className="w-full luxury-button py-3 rounded-xl" onClick={() => setIsMobileMenuOpen(false)}>
                           <User className="w-4 h-4 mr-2" />
                           Личный кабинет
                         </Button>
                       </Link>
                       <Button onClick={handleSignOut} className="w-full luxury-button py-3 rounded-xl">
                         <LogOut className="w-4 h-4 mr-2" />
                         Выйти
                       </Button>
                    </div>
                  ) : (
                    <Button onClick={() => { setIsAuthModalOpen(true); setIsMobileMenuOpen(false); }} className="w-full luxury-button py-3 rounded-xl">
                      <User className="w-4 h-4 mr-2" />
                      Вход / Регистрация
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <div className="h-20" />

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );

}
