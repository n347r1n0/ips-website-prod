// frontend/src/components/features/Auth/TelegramLoginWidget.jsx

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function TelegramLoginWidget({ onAuthSuccess, onAuthError, onAuthDecline }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const widgetRef = useRef(null);
  const { signInWithTelegram } = useAuth();
//  const { signIn } = useAuth();

  useEffect(() => {
    // Create unique callback function name to avoid conflicts
    const callbackName = `onTelegramAuth_${Date.now()}`;
    const origin = window.location.origin;

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

        // Use AuthContext method for Telegram authentication
        const result = await signInWithTelegram(user);
        
        // Success callback
        onAuthSuccess?.(result);

      } catch (err) {
        console.error('Telegram auth error:', err);
        const errorMessage = err.message || 'Произошла ошибка при авторизации через Telegram';
        setError(errorMessage);
        onAuthError?.(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    // --- BOT username normalization (no leading "@", fallback var supported)
    const rawBot =
      import.meta.env.VITE_TELEGRAM_BOT_USERNAME ??
      import.meta.env.VITE_TELEGRAM_BOT_ID;
    const BOT = (rawBot ?? '').toString().trim().replace(/^@/, '');
    if (!BOT) {
      console.error('[TelegramLoginWidget] Missing bot username env');
      setError('Ошибка конфигурации Telegram.');
      return;
    }

    // --- Build auth URL for first-time login (redirect mode)
    const state = crypto.randomUUID();
    try {
      sessionStorage.setItem('tg_oauth_state', state);
      // запасной ключ — на случай экзотичных браузеров
      localStorage.setItem('tg_oauth_state_last', state);
    } catch {}
    const returnTo = '/dashboard'; // при необходимости поменяй
    const authUrl = `${origin}/auth/telegram/callback?state=${encodeURIComponent(state)}&return_to=${encodeURIComponent(returnTo)}`;

    // Create and configure the Telegram widget script (dual mode)
    const script = document.createElement('script');
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute('data-telegram-login', BOT);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-corner-radius', '8');
    script.setAttribute('data-onauth', `${callbackName}(user)`);
    script.setAttribute('data-request-access', 'write');
    // ключевая строка для «первичного» логина:
    script.setAttribute('data-auth-url', authUrl);
    // (опционально) язык виджета
    script.setAttribute('data-lang', 'ru');

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

  // Show loading state during authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center space-x-2 py-3 px-6 bg-[#0088cc] text-white rounded-lg">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Авторизация...</span>
      </div>
    );
  }

  // Show error state if authentication failed
  if (error) {
    return (
      <div className="text-center space-y-2">
        <div className="text-sm text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg p-3">
          {error}
        </div>
        <button
          onClick={() => {
            setError(null);
            // Force widget recreation by updating key
            if (widgetRef.current) {
              widgetRef.current.innerHTML = '';
              // Re-trigger useEffect by changing a dependency
              window.location.reload();
            }
          }}
          className="text-sm text-white/70 hover:text-white underline"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  // Widget container
  return (
    <div className="flex justify-center">
      <div ref={widgetRef} id="telegram-login-container" className="telegram-widget-container" />
    </div>
  );
}
