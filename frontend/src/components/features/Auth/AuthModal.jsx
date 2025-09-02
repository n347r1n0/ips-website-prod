// frontend/src/components/features/Auth/AuthModal.jsx

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { TelegramLoginRedirect } from './TelegramLoginRedirect';

export function AuthModal({ isOpen, onClose }) {
  const [mode, setMode] = useState('signIn'); // 'signIn', 'signUp', или 'resetPassword'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState(''); // Только для регистрации
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();


  const handlePasswordReset = async () => {
    if (!email.trim()) {
      setError('Введите email для восстановления пароля');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Указываем полный URL нашей новой страницы
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setIsSuccess(true);
      setMode('resetPassword');
    } catch (err) {
      setError('Ошибка при отправке письма для восстановления пароля');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Сбрасываем состояние при закрытии, чтобы форма всегда была чистой
    setError('');
    setFieldErrors({});
    setEmail('');
    setPassword('');
    setNickname('');
    setIsSuccess(false);
    setMode('signIn');
    onClose();
  };

  // Comprehensive client-side validation
  const validateForm = () => {
    const errors = [];
    
    // Nickname validation (signup only)
    if (mode === 'signUp') {
      if (!nickname.trim()) {
        errors.push('Введите никнейм');
      } else if (nickname.length < 2) {
        errors.push('Никнейм должен содержать минимум 2 символа');
      } else if (nickname.length > 50) {
        errors.push('Никнейм должен содержать максимум 50 символов');
      }
    }
    
    // Email validation
    if (!email.trim()) {
      errors.push('Введите email адрес');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push('Введите корректный email адрес');
      }
    }
    
    // Password validation
    if (!password.trim()) {
      errors.push('Введите пароль');
    } else if (password.length < 6) {
      errors.push('Пароль должен содержать минимум 6 символов');
    } else if (mode === 'signUp' && password.length > 72) {
      // Supabase has a 72 character limit for passwords
      errors.push('Пароль должен содержать максимум 72 символа');
    }
    
    return errors;
  };

  // Clear errors when user starts typing
  const handleInputChange = (field, value) => {
    // Clear general error
    if (error) setError('');
    
    // Clear field-specific error
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Update field value
    switch (field) {
      case 'email':
        setEmail(value);
        break;
      case 'password':
        setPassword(value);
        break;
      case 'nickname':
        setNickname(value);
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      // Display the first validation error
      setError(validationErrors[0]);
      return;
    }

    setLoading(true);

    try {
      let result;
      if (mode === 'signIn') {
        result = await signIn({ email, password });
      } else {
        // Используем базовый signUp. Наш триггер в БД сделает остальную работу.
        result = await signUp({
          email,
          password,
          options: {
            data: {
              nickname: nickname,
            },
          },
        });
      }

      if (result.error) {
        throw result.error;
      }

      if (mode === 'signUp') {
        // FREE PLAN SOLUTION: Detect existing users and provide helpful messaging
        const isExistingUser = result.data?.user?.identities?.length === 0;

        if (isExistingUser) {
          // User already exists - provide helpful guidance with action button
          setError('existing_user'); // Special error state
        } else {
          // New user - show email confirmation message
          setIsSuccess(true);
        }
      } else {
        handleClose();
      }
    } catch (err) {
      // Enhanced error handling for better UX
      if (mode === 'signUp') {
        // For signup, always show generic error to avoid revealing system info
        setError('Произошла ошибка при регистрации. Попробуйте еще раз.');
      } else if (mode === 'signIn') {
        // Transform technical errors into user-friendly messages with helpful actions
        const errorMessage = err.message?.toLowerCase() || '';
        
        if (errorMessage.includes('invalid login credentials') || 
            errorMessage.includes('email not confirmed') ||
            errorMessage.includes('invalid password') ||
            errorMessage.includes('user not found')) {
          // Set special error state for login failures
          setError('invalid_login');
        } else if (errorMessage.includes('email') && errorMessage.includes('invalid')) {
          setError('Пожалуйста, введите корректный email адрес.');
        } else if (errorMessage.includes('too many requests')) {
          setError('Слишком много попыток входа. Попробуйте через несколько минут.');
        } else {
          setError('Произошла непредвиденная ошибка. Попробуйте еще раз.');
        }
      } else {
        // For other modes (reset password, etc.)
        setError(err.message || 'Произошла непредвиденная ошибка.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isSignUp = mode === 'signUp';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <GlassPanel>
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="p-4">
                <div className="text-center mb-6">
                  <img src="/logo/Logo_IPS.svg" alt="IPS Logo" className="h-12 w-auto mx-auto mb-4" />
                  <h2 className="text-3xl font-brand text-white gold-highlight">
                    {isSignUp ? 'Создать аккаунт' : 'Вход в клуб'}
                  </h2>
                  {isSuccess && (
                     <p className="text-white/80 mt-2">Почти готово!</p>
                  )}
                </div>

                {isSuccess ? (
                  <div className="text-center space-y-4 text-white/90">
                    {mode === 'resetPassword' ? (
                      <>
                        <p>
                          Мы отправили письмо для восстановления пароля на адрес{' '}
                          <strong className="text-gold-accent">{email}</strong>.
                        </p>
                        <p>
                          Перейдите по ссылке в письме, чтобы создать новый пароль.
                        </p>
                      </>
                    ) : (
                      <>
                        <p>
                          Мы отправили письмо для подтверждения на адрес{' '}
                          <strong className="text-gold-accent">{email}</strong>.
                        </p>
                        <p>
                          Пожалуйста, перейдите по ссылке в письме, чтобы завершить регистрацию.
                        </p>
                      </>
                    )}
                     <Button onClick={handleClose} className="w-full luxury-button py-3 text-lg rounded-xl mt-4">
                        Понятно
                     </Button>
                  </div>
                ) : (
                  <>
                    <form onSubmit={handleSubmit} noValidate className="space-y-4">
                      {isSignUp && (
                        <div className="space-y-1">
                          <label htmlFor="nickname" className="text-white/80 text-sm">Ваш никнейм *</label>
                          <input
                            id="nickname" type="text" value={nickname}
                            onChange={(e) => handleInputChange('nickname', e.target.value)}
                            placeholder="Poker_Pro"
                            className="w-full bg-white/10 border rounded-lg p-3 text-white focus:outline-none focus:ring-2 border-white/20 focus:ring-deep-teal"
                          />
                        </div>
                      )}
                      <div className="space-y-1">
                        <label htmlFor="email" className="text-white/80 text-sm">Email *</label>
                        <input
                          id="email" type="email" value={email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="your@email.com" autoComplete="email"
                          className="w-full bg-white/10 border rounded-lg p-3 text-white focus:outline-none focus:ring-2 border-white/20 focus:ring-deep-teal"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="password" className="text-white/80 text-sm">Пароль *</label>
                        <input
                          id="password" type="password" value={password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          placeholder="••••••••"
                          autoComplete={isSignUp ? "new-password" : "current-password"}
                          className="w-full bg-white/10 border rounded-lg p-3 text-white focus:outline-none focus:ring-2 border-white/20 focus:ring-deep-teal"
                        />
                        {/* Password hint for signup */}
                        {isSignUp && password.length > 0 && password.length < 6 && (
                          <p className="text-xs text-amber-400 mt-1">
                            Минимум 6 символов ({password.length}/6)
                          </p>
                        )}
                      </div>

                      {error && (
                        <div className={`text-sm text-center rounded-lg p-3 space-y-3 ${
                          error === 'existing_user'
                            ? 'bg-amber-900/50 border border-amber-500/50 text-amber-300'
                            : error === 'invalid_login'
                            ? 'bg-orange-900/50 border border-orange-500/50 text-orange-300'
                            : 'bg-red-900/50 border border-red-500/50 text-red-300'
                        }`}>
                          {error === 'existing_user' ? (
                            <>
                              <p>Этот email уже зарегистрирован в системе.</p>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => { setMode('signIn'); setError(''); }}
                                  className="flex-1 glassmorphic-panel border border-white/30 text-white hover:bg-white/10 py-2 text-sm rounded-lg"
                                >
                                  Войти
                                </Button>
                                <Button
                                  onClick={handlePasswordReset}
                                  disabled={loading}
                                  className="flex-1 glassmorphic-panel border border-white/30 text-white hover:bg-white/10 py-2 text-sm rounded-lg"
                                >
                                  Забыли пароль?
                                </Button>
                              </div>
                            </>
                          ) : error === 'invalid_login' ? (
                            <>
                              <p>Неверный email или пароль.</p>
                              <div className="flex justify-center">
                                <Button
                                  onClick={handlePasswordReset}
                                  disabled={loading}
                                  className="glassmorphic-panel border border-white/30 text-white hover:bg-white/10 py-2 px-4 text-sm rounded-lg"
                                >
                                  Забыли пароль?
                                </Button>
                              </div>
                            </>
                          ) : (
                            error
                          )}
                        </div>
                      )}

                      <Button type="submit" disabled={loading} className="w-full luxury-button py-3 text-lg rounded-xl mt-4">
                        {loading ? (
                          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                        ) : (
                          isSignUp ? 'Зарегистрироваться' : 'Войти'
                        )}
                      </Button>
                    </form>

                    {!isSignUp && (
                      <>
                        <div className="flex items-center my-6">
                          <div className="flex-grow border-t border-white/20"></div>
                          <span className="flex-shrink mx-4 text-white/50 text-sm">ИЛИ</span>
                          <div className="flex-grow border-t border-white/20"></div>
                        </div>
                        <div className="flex justify-center">
                          <TelegramLoginRedirect />
                        </div>
                      </>
                    )}



                    <div className="text-center mt-6 space-y-3">
                      <button
                        onClick={() => { 
                          setMode(isSignUp ? 'signIn' : 'signUp'); 
                          setError(''); 
                          setFieldErrors({});
                        }}
                        className="text-white/70 hover:text-white text-sm transition-colors block w-full"
                      >
                        {isSignUp ? 'Уже есть аккаунт? Войти' : 'Впервые у нас? Зарегистрироваться'}
                      </button>
                      
                      {/* Show Forgot Password link only in sign-in mode */}
                      {!isSignUp && (
                        <button
                          onClick={handlePasswordReset}
                          disabled={loading}
                          className="text-white/50 hover:text-white/80 text-sm transition-colors block w-full"
                        >
                          Забыли пароль?
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </GlassPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
