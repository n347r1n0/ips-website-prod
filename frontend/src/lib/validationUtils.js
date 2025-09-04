// src/lib/validationUtils.js

/**
 * Validation utilities for guest registration forms
 */

export const validateContact = (contact) => {
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

export const validateName = (name) => {
  const trimmed = name.trim();
  if (!trimmed) return { valid: false, message: 'Имя обязательно' };
  if (trimmed.length < 2) return { valid: false, message: 'Имя слишком короткое' };
  return { valid: true };
};

export const validateGuestForm = (formData) => {
  const errors = {};
  
  const nameValidation = validateName(formData.name);
  if (!nameValidation.valid) {
    errors.name = nameValidation.message;
  }
  
  const contactValidation = validateContact(formData.contact);
  if (!contactValidation.valid) {
    errors.contact = contactValidation.message;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};