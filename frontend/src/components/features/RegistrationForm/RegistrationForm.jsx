// src/components/features/RegistrationForm/RegistrationForm.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui/Button.jsx';
import { GlassPanel } from '../../ui/GlassPanel.jsx';
import { CheckCircle, Loader2, MessageCircle, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGuestStore } from '@/lib/guestStore';
import { tournamentsAPI } from '@/lib/supabaseClient';

// REPURPOSED: Простая форма для гостевого бронирования (альтернатива боту)
// Этот компонент НЕ записывает данные в базу.

export function RegistrationForm({ onSuccess }) {
  const navigate = useNavigate();
  const { setGuestData } = useGuestStore();
  const [formData, setFormData] = useState({
    name: '',
    contact: '' // Единое поле для Telegram/Телефона
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Имя обязательно';
    if (!formData.contact.trim()) newErrors.contact = 'Контактные данные обязательны';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      // Save guest data to Zustand store
      setGuestData({ name: formData.name, contact: formData.contact });

      // Find nearest tournament
      const nearestTournamentId = await tournamentsAPI.findNearestTournament();

      if (nearestTournamentId) {
        // Close the modal first
        if (onSuccess) onSuccess();
        
        // Smooth scroll to calendar section with highlighting
        const calendarElement = document.getElementById('calendar');
        if (calendarElement) {
          // Update URL with highlight parameter
          const currentUrl = new URL(window.location);
          currentUrl.searchParams.set('highlightTournament', nearestTournamentId);
          window.history.pushState({}, '', currentUrl);
          
          // Smooth scroll to calendar section
          calendarElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        } else {
          // Fallback: navigate to calendar page if section not found
          navigate(`/calendar?highlightTournament=${nearestTournamentId}`);
        }
      } else {
        // No active tournaments found
        setErrors({ submit: 'На данный момент нет доступных турниров для регистрации.' });
      }
    } catch (error) {
      console.error('Error in guest registration flow:', error);
      setErrors({ submit: 'Произошла ошибка. Попробуйте еще раз.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="art-deco-divider mb-8" />
        <div className="p-6 glassmorphic-panel rounded-3xl mb-8 inline-block">
          <CheckCircle className="w-20 h-20 text-gold-accent mx-auto animate-pulse" />
        </div>
        <h3 className="text-3xl font-bold text-white mb-6 tracking-wider">
          Заявка принята!
        </h3>
        <p className="text-lg text-gray-300 leading-relaxed mb-8">
          Мы свяжемся с вами для подтверждения участия в турнире.
        </p>
        <a href="https://t.me/your_bot_username" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="glassmorphic-panel border-white/30 text-white hover:bg-white/10 px-6 py-3 rounded-xl">
             <MessageCircle className="w-5 h-5 mr-3" />
             Или записаться мгновенно через Telegram
             <ExternalLink className="w-4 h-4 ml-2 opacity-70" />
          </Button>
        </a>
        <div className="art-deco-divider mt-8" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      <div className="art-deco-divider mb-8" />
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2 text-left">
          <label htmlFor="name" className="text-white/80 text-sm font-medium">Ваше Имя *</label>
          <input
            name="name" placeholder="Иван Иванов" value={formData.name} onChange={handleChange}
            className={`w-full bg-white/10 border rounded-lg p-3 text-white focus:outline-none focus:ring-2
              ${errors.name ? 'border-red-400/50 focus:ring-red-400/50' : 'border-white/20 focus:ring-deep-teal'}`}
          />
          {errors.name && <p className="text-red-400 text-sm">{errors.name}</p>}
        </div>

        <div className="space-y-2 text-left">
          <label htmlFor="contact" className="text-white/80 text-sm font-medium">Контакт (Telegram или Телефон) *</label>
          <input
            name="contact" type="text" placeholder="@username или +7..." value={formData.contact} onChange={handleChange}
            className={`w-full bg-white/10 border rounded-lg p-3 text-white focus:outline-none focus:ring-2
              ${errors.contact ? 'border-red-400/50 focus:ring-red-400/50' : 'border-white/20 focus:ring-deep-teal'}`}
          />
          <p className="text-white/60 text-xs">Введите @username в Telegram или номер телефона (+7…)</p>
          {errors.contact && <p className="text-red-400 text-sm">{errors.contact}</p>}
        </div>

        {errors.submit && <p className="text-red-400 text-center">{errors.submit}</p>}
        <div className="art-deco-divider my-6" />
        <Button type="submit" disabled={isSubmitting} className="w-full luxury-button py-4 text-lg rounded-xl">
          {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "Забронировать место"}
        </Button>
      </form>
    </motion.div>
  );
}
