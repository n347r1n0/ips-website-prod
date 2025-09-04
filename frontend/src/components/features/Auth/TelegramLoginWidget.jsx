// frontend/src/components/features/Auth/TelegramLoginWidget.jsx

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { isAuthInProgress } from '@/lib/authSynchronizer';

export function TelegramLoginWidget({ onAuthSuccess, onAuthError, onAuthDecline }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const widgetRef = useRef(null);
  const { signInWithTelegram } = useAuth();

  useEffect(() => {
    // Create unique callback function name to avoid conflicts
    const callbackName = `onTelegramAuth_${Date.now()}`;

    // Define the callback function that handles Telegram auth response
    window[callbackName] = async (user) => {
      console.log('Telegram auth callback received:', user);
      setIsLoading(true);
      setError(null);

      try {
        // Handle user decline (user will be false)
        if (user === false) {
          console.log('User declined Telegram authorization');
          onAuthDecline?.();
          return;
        }

        // Validate user data
        if (!user || !user.id || !user.first_name || !user.hash) {
          throw new Error('Неполные данные авторизации от Telegram');
        }

        // Check if auth is already in progress for this user
        const userId = `tg_${user.id}`;
        if (isAuthInProgress(userId)) {
          console.log('⏳ [TG-WIDGET] Auth already in progress, showing user-friendly message');
          setError('Вход уже выполняется... Пожалуйста, подождите.');
          return;
        }

        // Use AuthContext method for Telegram authentication
        const result = await signInWithTelegram(user);

        // Success callback
        onAuthSuccess?.(result);

      } catch (err) {
        console.error('Telegram auth error:', err);
        let errorMessage = err.message || 'Произошла ошибка при авторизации через Telegram';
        
        // Provide user-friendly messages for common sync issues
        if (errorMessage.includes('Authentication already in progress')) {
          errorMessage = 'Вход уже выполняется с другого устройства. Пожалуйста, подождите или попробуйте снова через несколько секунд.';
        } else if (errorMessage.includes('cancelled')) {
          errorMessage = 'Авторизация была отменена из-за нового запроса входа. Попробуйте снова.';
        }
        
        setError(errorMessage);
        onAuthError?.(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    // Create and configure the Telegram widget script
    const script = document.createElement('script');
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute('data-telegram-login', import.meta.env.VITE_TELEGRAM_BOT_USERNAME);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-corner-radius', '8');
    script.setAttribute('data-onauth', `${callbackName}(user)`);
    script.setAttribute('data-request-access', 'write');

    // Insert script into widget container
    const widgetContainer = widgetRef.current;
    if (widgetContainer) {
      widgetContainer.appendChild(script);
    }

    // Cleanup function
    return () => {
      if (widgetContainer && script && widgetContainer.contains(script)) {
        widgetContainer.removeChild(script);
      }
      // Clean up global callback
      if (window[callbackName]) {
        delete window[callbackName];
      }
    };
  }, [onAuthSuccess, onAuthError, onAuthDecline]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center space-x-2 py-3 px-6 bg-[#0088cc] text-white rounded-lg">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Авторизация...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center space-y-2">
        <div className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg p-3">
          {error}
        </div>
        <button
          onClick={() => {
            setError(null);
            if (widgetRef.current) widgetRef.current.innerHTML = '';
            window.location.reload();
          }}
          className="text-sm text-white/70 hover:text-white underline"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div ref={widgetRef} id="telegram-login-container" className="telegram-widget-container" />
    </div>
  );
}

