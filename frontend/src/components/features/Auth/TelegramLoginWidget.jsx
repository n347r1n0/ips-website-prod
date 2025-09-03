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
    const origin = window.location.origin;

    // 1) Берём ТОЛЬКО username (виджету нужен username, не numeric id)
    const rawBot = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || '';
    const BOT = String(rawBot).trim().replace(/^@/, '');
    if (!BOT) {
      console.error('[TG] Missing VITE_TELEGRAM_BOT_USERNAME');
      setError('Ошибка конфигурации Telegram.');
      return;
    }

    // 2) Генерим state и сохраняем (для redirect-ветки)
    const state = crypto.randomUUID();
    try {
      sessionStorage.setItem('tg_oauth_state', state);
      localStorage.setItem('tg_oauth_state_last', state);
    } catch {}

    const returnTo = '/dashboard';
    const authUrl = `${origin}/auth/telegram/callback?state=${encodeURIComponent(state)}&return_to=${encodeURIComponent(returnTo)}`;

    // 3) Глобальный обработчик для onauth («знакомый» браузер)
    const callbackName = `onTelegramAuth_${Date.now()}`;
    window[callbackName] = async (user) => {
      console.log('[TG] onauth:', user);
      setIsLoading(true);
      setError(null);
      try {
        if (user === false) {
          onAuthDecline?.();
          return;
        }
        if (!user || !user.id || !user.first_name || !user.hash) {
          throw new Error('Неполные данные авторизации от Telegram');
        }
        const result = await signInWithTelegram(user);
        onAuthSuccess?.(result);
      } catch (err) {
        console.error('[TG] auth error:', err);
        const msg = err.message || 'Произошла ошибка при авторизации через Telegram';
        setError(msg);
        onAuthError?.(msg);
      } finally {
        setIsLoading(false);
      }
    };

    // 4) Удалим старые инстансы виджета (на всякий)
    try {
      document.querySelectorAll('script[data-telegram-login]').forEach(n => n.remove());
    } catch {}

    // 5) Создаём виджет: оставляем и onauth, и redirect
    const s = document.createElement('script');
    s.src = 'https://telegram.org/js/telegram-widget.js?22';
    s.async = true;
    s.setAttribute('data-telegram-login', BOT);
    s.setAttribute('data-size', 'large');
    s.setAttribute('data-radius', '8'); // согласно докам: data-radius
    s.setAttribute('data-onauth', `${callbackName}(user)`);
    s.setAttribute('data-request-access', 'write');
    s.setAttribute('data-auth-url', authUrl);
    s.setAttribute('data-lang', 'ru');

    console.log('[TG ENV]', {
      mode: import.meta.env.MODE,
      VITE_TELEGRAM_BOT_USERNAME: rawBot,
      origin
    });
    console.log('[TG-WIDGET]', { bot: BOT, authUrl });

    const container = widgetRef.current;
    if (container) container.appendChild(s);

    return () => {
      if (container && s && container.contains(s)) container.removeChild(s);
      if (window[callbackName]) delete window[callbackName];
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

