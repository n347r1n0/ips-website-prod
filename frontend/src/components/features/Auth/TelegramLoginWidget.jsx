// frontend/src/components/features/Auth/TelegramLoginWidget.jsx

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function TelegramLoginWidget({ onAuthSuccess, onAuthError, onAuthDecline }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const widgetRef = useRef(null);
  const { signInWithTelegram } = useAuth();

  useEffect(() => {
    console.log('[TG ENV]',
      import.meta.env.MODE,
      import.meta.env.VITE_TELEGRAM_BOT_USERNAME,
      import.meta.env.VITE_TELEGRAM_BOT_ID
    );

    const rawBot =
      import.meta.env.VITE_TELEGRAM_BOT_USERNAME ??
      import.meta.env.VITE_TELEGRAM_BOT_ID;

    const BOT = (rawBot ?? '').toString().trim().replace(/^@/, '');
    console.log('[TG BOT]', { origin: location.origin, rawBot, BOT });

    const state = crypto.randomUUID();
    const returnTo = '/dashboard';
    const authUrl = `${location.origin}/auth/telegram/callback?state=${encodeURIComponent(state)}&return_to=${encodeURIComponent(returnTo)}`;
    console.log('[TG AUTH URL]', authUrl);


    // Уникальное имя коллбэка для onauth
    const callbackName = `onTelegramAuth_${Date.now()}`;
    const origin = window.location.origin;

    // Обработчик ответа от Telegram (для "знакомого" браузера)
    window[callbackName] = async (user) => {
      console.log('Telegram auth callback received:', user);
      setIsLoading(true);
      setError(null);

      try {
        if (user === false) {
          console.log('User declined Telegram authorization');
          onAuthDecline?.();
          return;
        }

        if (!user || !user.id || !user.first_name || !user.hash) {
          throw new Error('Неполные данные авторизации от Telegram');
        }

        const result = await signInWithTelegram(user);
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

    // Нормализуем username бота (поддерживаем обе переменные, убираем "@")
    const rawBot =
      import.meta.env.VITE_TELEGRAM_BOT_USERNAME ?? import.meta.env.VITE_TELEGRAM_BOT_ID;
    const BOT = (rawBot ?? '').toString().trim().replace(/^@/, '');
    if (!BOT) {
      console.error('[TelegramLoginWidget] Missing bot username env');
      setError('Ошибка конфигурации Telegram.');
      return () => {
        if (window[callbackName]) delete window[callbackName];
      };
    }

    // На всякий случай: убираем любые старые виджеты на странице (чтобы не было гонок)
    try {
      document.querySelectorAll('script[data-telegram-login]').forEach((n) => n.remove());
    } catch {}

    // Формируем authUrl для редирект-ветки (первичный логин)
    const state = crypto.randomUUID();
    try {
      sessionStorage.setItem('tg_oauth_state', state);
      localStorage.setItem('tg_oauth_state_last', state);
    } catch {}
    const returnTo = '/dashboard';
    const authUrl = `${origin}/auth/telegram/callback?state=${encodeURIComponent(
      state
    )}&return_to=${encodeURIComponent(returnTo)}`;

    // Создаём виджет: оставляем И onauth, И auth-url (редирект для первого входа)
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', BOT);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-corner-radius', '8');
    script.setAttribute('data-onauth', `${callbackName}(user)`);
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-auth-url', authUrl);
    script.setAttribute('data-lang', 'ru');

    console.log('[TG-WIDGET] bot=', BOT, 'authUrl=', authUrl);

    const widgetContainer = widgetRef.current;
    if (widgetContainer) {
      widgetContainer.appendChild(script);
    }

    return () => {
      // Чистим за собой
      if (widgetContainer && script && widgetContainer.contains(script)) {
        widgetContainer.removeChild(script);
      }
      if (window[callbackName]) {
        delete window[callbackName];
      }
    };
  }, [onAuthSuccess, onAuthError, onAuthDecline, signInWithTelegram]);

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
            if (widgetRef.current) {
              widgetRef.current.innerHTML = '';
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

  // Контейнер под виджет
  return (
    <div className="flex justify-center">
      <div ref={widgetRef} id="telegram-login-container" className="telegram-widget-container" />
    </div>
  );
}
