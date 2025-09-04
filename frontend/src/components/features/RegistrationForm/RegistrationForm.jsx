// src/components/features/RegistrationForm/RegistrationForm.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui/Button.jsx';
import { Loader2 } from 'lucide-react';
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
  const [isSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  
  const validateContact = (contact) => {
    const trimmed = contact.trim();
    if (!trimmed) return { valid: false, message: 'Контактные данные обязательны' };
    
    // Check for Telegram username
    if (trimmed.startsWith('@')) {
      if (trimmed.length < 4) return { valid: false, message: 'Telegram username слишком короткий' };
      if (!/^@[a-zA-Z0-9_]{3,}$/.test(trimmed)) return { valid: false, message: 'Неверный формат Telegram username' };
      return { valid: true };
    }
    
    // Check for phone number
    if (trimmed.startsWith('+7') || trimmed.startsWith('8') || /^\d/.test(trimmed)) {
      const digits = trimmed.replace(/\D/g, '');
      if (digits.length < 10) return { valid: false, message: 'Номер телефона слишком короткий' };
      if (digits.length > 12) return { valid: false, message: 'Номер телефона слишком длинный' };
      return { valid: true };
    }
    
    return { valid: false, message: 'Введите @username или номер телефона (+7...)' };
  };
  
  // Computed properties for form state
  const isFormValid = formData.name.trim().length >= 2 && 
                     validateContact(formData.contact).valid &&
                     Object.keys(errors).length === 0;
  const isSubmitDisabled = !isFormValid || isSubmitting;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear existing error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Real-time validation for contact field
    if (name === 'contact' && value.trim()) {
      const contactValidation = validateContact(value);
      if (!contactValidation.valid) {
        setErrors(prev => ({ ...prev, contact: contactValidation.message }));
      }
    }
    
    // Real-time validation for name field
    if (name === 'name' && value.trim() && value.trim().length < 2) {
      setErrors(prev => ({ ...prev, name: 'Имя слишком короткое' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Имя обязательно';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Имя слишком короткое';
    }
    
    const contactValidation = validateContact(formData.contact);
    if (!contactValidation.valid) {
      newErrors.contact = contactValidation.message;
    }
    
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

  // Success state removed - form just closes and navigates

  return (
    <div>
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
        <Button 
          type="submit" 
          disabled={isSubmitDisabled} 
          className={`w-full luxury-button py-4 text-lg rounded-xl transition-opacity ${
            isSubmitDisabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "Забронировать место"}
        </Button>
      </form>
    </div>
  );
}
