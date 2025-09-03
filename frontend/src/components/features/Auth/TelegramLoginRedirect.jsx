// frontend/src/components/features/Auth/TelegramLoginRedirect.jsx

import React, { useEffect, useRef } from 'react';

export function TelegramLoginRedirect({ returnTo = '/dashboard' }) {
  const ref = useRef(null);

  useEffect(() => {
    // 1) Жёсткая зачистка любых старых виджетов на странице
    try {
      document.querySelectorAll('script[data-telegram-login]').forEach((n) => n.remove());
    } catch {}
    if (window.Telegram) {
      try {
        delete window.Telegram;
      } catch {}
    }

    // 2) Генерим state и кладём в session/localStorage
    const state = crypto.randomUUID();
    try {
      sessionStorage.setItem('tg_oauth_state', state);
      localStorage.setItem('tg_oauth_state_last', state);
    } catch {}

    const origin = window.location.origin;
    const authUrl = `${origin}/auth/telegram/callback?state=${encodeURIComponent(
      state
    )}&return_to=${encodeURIComponent(returnTo)}`;

    // 3) Нормализуем username бота (поддерживаем обе переменные, убираем "@")
    const rawBot =
      import.meta.env.VITE_TELEGRAM_BOT_USERNAME ?? import.meta.env.VITE_TELEGRAM_BOT_ID;
    const botUsername = (rawBot ?? '').toString().trim().replace(/^@/, '');

    if (!botUsername) {
      console.error('[TG-REDIRECT] Missing bot username env');
      if (ref.current) ref.current.innerText = 'Ошибка конфигурации Telegram.';
      return;
    }

    // 4) Создаём виджет в режиме redirect
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.defer = true;
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-auth-url', authUrl);
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-lang', 'ru');

    console.log('[TG-REDIRECT] bot=', botUsername, 'authUrl=', authUrl);

    const container = ref.current;
    if (container) {
      container.innerHTML = '';
      container.appendChild(script);
    }

    return () => {
      if (container) container.innerHTML = '';
    };
  }, [returnTo]);

  return <div ref={ref} />;
}

