// frontend/src/components/features/UserPaths/UserPathsSection.jsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, UserPlus, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { useAuth } from '@/contexts/AuthContext';
import { useGuestStore } from '@/lib/guestStore';
import { tournamentsAPI } from '@/lib/supabaseClient';
import { validateContact, validateName } from '@/lib/validationUtils';

// Guest Registration Card Component
function GuestRegistrationCard() {
  const { guestData, setGuestData } = useGuestStore();
  const [formData, setFormData] = useState({ name: '', contact: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(!guestData?.name);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear existing error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Real-time validation
    if (name === 'contact' && value.trim()) {
      const contactValidation = validateContact(value);
      if (!contactValidation.valid) {
        setErrors(prev => ({ ...prev, contact: contactValidation.message }));
      }
    }
    
    if (name === 'name' && value.trim() && value.trim().length < 2) {
      setErrors(prev => ({ ...prev, name: 'Имя слишком короткое' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const nameValidation = validateName(formData.name);
    const contactValidation = validateContact(formData.contact);
    
    const newErrors = {};
    if (!nameValidation.valid) newErrors.name = nameValidation.message;
    if (!contactValidation.valid) newErrors.contact = contactValidation.message;
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      // Save guest data
      setGuestData({ name: formData.name, contact: formData.contact });

      // Find nearest tournament
      const nearestTournamentId = await tournamentsAPI.findNearestTournament();

      if (nearestTournamentId) {
        // Update URL with highlight parameter
        const currentUrl = new URL(window.location);
        currentUrl.searchParams.set('highlightTournament', nearestTournamentId);
        window.history.pushState({}, '', currentUrl);
        
        // Smooth scroll to calendar section
        const calendarElement = document.getElementById('calendar');
        if (calendarElement) {
          calendarElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      } else {
        setErrors({ submit: 'На данный момент нет доступных турниров для регистрации.' });
      }
    } catch (error) {
      console.error('Error in guest registration flow:', error);
      setErrors({ submit: 'Произошла ошибка. Попробуйте еще раз.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToCalendar = () => {
    const calendarElement = document.getElementById('calendar');
    if (calendarElement) {
      calendarElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  };

  const isFormValid = formData.name.trim().length >= 2 && 
                     validateContact(formData.contact).valid &&
                     Object.keys(errors).length === 0;
  const isSubmitDisabled = !isFormValid || isSubmitting;

  return (
    <GlassPanel className="h-full">
      <div className="p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl glassmorphic-panel flex items-center justify-center mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-brand text-white mb-2">
            Запись для Гостей
          </h3>
          <p className="text-gold-accent/80 text-sm uppercase tracking-wide mb-2">
            БЕЗ СОЗДАНИЯ АККАУНТА
          </p>
          <p className="text-white/70 text-sm leading-relaxed">
            Быстрая запись на турнир. Выберите удобный для вас способ.
          </p>
        </div>

        {/* Compact state for existing guest data */}
        {guestData?.name && !showForm && (
          <div className="space-y-4">
            <div className="text-center p-4 bg-gold-accent/10 border border-gold-accent/30 rounded-xl">
              <p className="text-white text-sm mb-2">
                Вы указали: <span className="font-medium">{guestData.name}</span> • <span className="font-medium">{guestData.contact}</span>
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="text-gold-accent text-xs underline hover:no-underline"
              >
                изменить
              </button>
            </div>
            <Button
              onClick={scrollToCalendar}
              className="btn-clay luxury-button w-full"
            >
              Перейти к календарю
            </Button>
          </div>
        )}

        {/* Inline form (primary path) */}
        {(!guestData?.name || showForm) && (
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2 text-left">
                <label htmlFor="guest-name" className="text-white/80 text-sm font-medium">
                  Имя *
                </label>
                <input
                  id="guest-name"
                  name="name"
                  type="text"
                  placeholder="Иван Иванов"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full bg-white/10 border rounded-lg p-3 text-white focus:outline-none focus:ring-2 ${
                    errors.name ? 'border-red-400/50 focus:ring-red-400/50' : 'border-white/20 focus:ring-deep-teal'
                  }`}
                />
                {errors.name && <p className="text-red-400 text-xs">{errors.name}</p>}
              </div>

              <div className="space-y-2 text-left">
                <label htmlFor="guest-contact" className="text-white/80 text-sm font-medium">
                  Контакт (Telegram или Телефон) *
                </label>
                <input
                  id="guest-contact"
                  name="contact"
                  type="text"
                  placeholder="@username или +7..."
                  value={formData.contact}
                  onChange={handleChange}
                  className={`w-full bg-white/10 border rounded-lg p-3 text-white focus:outline-none focus:ring-2 ${
                    errors.contact ? 'border-red-400/50 focus:ring-red-400/50' : 'border-white/20 focus:ring-deep-teal'
                  }`}
                />
                <p className="text-white/60 text-xs">Введите @username в Telegram или номер телефона (+7…)</p>
                {errors.contact && <p className="text-red-400 text-xs">{errors.contact}</p>}
              </div>

              {errors.submit && <p className="text-red-400 text-center text-sm">{errors.submit}</p>}

              <Button 
                type="submit" 
                disabled={isSubmitDisabled}
                className="btn-clay luxury-button w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Загрузка...
                  </>
                ) : (
                  'Забронировать место'
                )}
              </Button>
            </form>

          </div>
        )}
      </div>
    </GlassPanel>
  );
}

export function UserPathsSection({ onAuthModalOpen, onGuestModalOpen }) {
  const { user } = useAuth();

  const memberPath = {
    id: 'member',
    icon: UserPlus,
    title: 'Членство в клубе',
    subtitle: 'Войти или зарегистрироваться',
    description: 'Получите доступ к личному кабинету, статистике игр, рейтингам и эксклюзивным бонусам клуба.',
    cta: user ? 'Уже член клуба ✓' : 'Войти / Стать членом клуба',
    action: user ? null : onAuthModalOpen,
    primary: !user,
    disabled: !!user
  };

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
          {/* Member Registration Card */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0 }}
            viewport={{ once: true }}
            className="relative group"
          >
            <GlassPanel className={`h-full transition-all duration-300 group-hover:scale-105 ${
              memberPath.primary ? 'ring-2 ring-gold-accent/50' : ''
            }`}>
              <div className="p-8 text-center h-full flex flex-col">
                {memberPath.primary && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gold-accent text-black px-4 py-1 rounded-full text-sm font-bold">
                      РЕКОМЕНДУЕМ
                    </div>
                  </div>
                )}
                
                <div className="mb-6">
                  <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${
                    memberPath.primary ? 'bg-gold-accent/20' : 'glassmorphic-panel'
                  }`}>
                    <UserPlus className={`w-8 h-8 ${
                      memberPath.primary ? 'text-gold-accent' : 'text-white'
                    }`} />
                  </div>
                </div>

                <h3 className="text-2xl font-brand text-white mb-2">
                  {memberPath.title}
                </h3>
                <p className="text-gold-accent/80 text-sm uppercase tracking-wide mb-4">
                  {memberPath.subtitle}
                </p>
                <p className="text-white/70 text-sm leading-relaxed mb-8 flex-grow">
                  {memberPath.description}
                </p>

                <Button
                  onClick={memberPath.action}
                  disabled={memberPath.disabled}
                  className={`w-full ${memberPath.primary ? 'btn-clay luxury-button' : memberPath.disabled ? 'btn-glass' : 'btn-clay'}`}
                >
                  {memberPath.cta}
                </Button>
              </div>
            </GlassPanel>
          </motion.div>

          {/* Guest Registration Card - show only if user is not logged in */}
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="transition-all duration-300 group-hover:scale-105">
                <GuestRegistrationCard />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}