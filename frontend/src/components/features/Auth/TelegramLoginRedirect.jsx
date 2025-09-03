// frontend/src/components/features/Auth/TelegramLoginRedirect.jsx

import React, { useEffect, useRef } from 'react';

export function TelegramLoginRedirect({ returnTo = '/dashboard' }) {
  const ref = useRef(null);

  useEffect(() => {
    // --- ШАГ 1: "ЭКЗОРЦИЗМ" ---
    // Принудительно удаляем ВСЕ старые экземпляры виджета со страницы,
    // чтобы гарантировать, что останется только наша, правильная версия.
    document.querySelectorAll('script[data-telegram-login]').forEach(node => {
      try {
        node.remove();
      } catch (e) {
        console.warn("TelegramLoginRedirect: Failed to remove old widget script:", e);
      }
    });

    // Additional cleanup of any orphaned Telegram callback handlers
    if (window.Telegram) {
      try {
        delete window.Telegram;
      } catch (e) {
        // Silent fail - some contexts don't allow deletion
      }
    }

    // --- ШАГ 2: "ЗАПАСНОЙ КЛЮЧ" ---
    // Создаем ключ безопасности и сохраняем его в ДВУХ местах:
    // sessionStorage (основной) и localStorage (запасной для Я.Браузера).
    const state = crypto.randomUUID();
    sessionStorage.setItem('tg_oauth_state', state);
    localStorage.setItem('tg_oauth_state_last', state); // Запасной ключ

    const origin = window.location.origin;
    const authUrl = `${origin}/auth/telegram/callback?state=${encodeURIComponent(state)}&return_to=${encodeURIComponent(returnTo)}`;

    // Нормализуем имя бота (убираем "@", поддерживаем старое имя переменной)
    const rawBot =
      import.meta.env.VITE_TELEGRAM_BOT_USERNAME ??
      import.meta.env.VITE_TELEGRAM_BOT_ID;
    const BOT = (rawBot ?? '').toString().trim().replace(/^@/, '');
    if (!BOT) {
      console.error('VITE_TELEGRAM_BOT_USERNAME is not defined');
      if (ref.current) ref.current.innerText = 'Ошибка конфигурации Telegram.';
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.defer = true;
    script.setAttribute('data-telegram-login', BOT);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-auth-url', authUrl);
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-lang', 'ru');

    const container = ref.current;
    if (container) {
      container.innerHTML = '';
      container.appendChild(script);
    }

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [returnTo]);

  return <div ref={ref} />;
}
