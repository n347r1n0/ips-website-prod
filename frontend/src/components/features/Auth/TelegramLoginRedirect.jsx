// frontend/src/components/features/Auth/TelegramLoginRedirect.jsx

import React, { useEffect, useRef } from 'react';
import { preAuthCleanup, generateFreshOAuthState } from '@/lib/preAuthCleanup';
import { isRussianMobileContext, russianMobilePreAuthCleanup } from '@/lib/russianMobileAuthFix';

export function TelegramLoginRedirect({ returnTo = '/dashboard' }) {
  const ref = useRef(null);

  useEffect(() => {
    const initTelegramWidget = async () => {
      try {
        // Check if Russian mobile context requires enhanced cleanup
        const isRussianMobile = isRussianMobileContext();
        console.log(`📱 [TG-WIDGET] Russian mobile context: ${isRussianMobile}`);

        if (isRussianMobile) {
          // --- ENHANCED RUSSIAN MOBILE PRE-AUTH CLEANUP ---
          console.log('🇷🇺 [TG-WIDGET] Running enhanced Russian mobile pre-auth cleanup...');
          await russianMobilePreAuthCleanup();
        } else {
          // --- COMPREHENSIVE PRE-AUTH CLEANUP ---
          console.log('🧹 [TG-WIDGET] Running comprehensive pre-auth cleanup...');
          await preAuthCleanup({
            preserveGuestData: true,
            preserveRedirectUrl: true
          });
        }

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

        // --- ШАГ 2: "FRESH OAUTH STATE WITH TTL" ---
        // Generate fresh OAuth state with automatic expiry
        const { state, nonce } = generateFreshOAuthState(5); // 5 minute TTL
        console.log('🆕 [TG-WIDGET] Generated fresh OAuth state');

        // Legacy backup for compatibility
        sessionStorage.setItem('tg_oauth_state', state);
        localStorage.setItem('tg_oauth_state_last', state);

        const origin = window.location.origin;
        const authUrl = `${origin}/auth/telegram/callback?state=${encodeURIComponent(state)}&return_to=${encodeURIComponent(returnTo)}`;

        const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;
        if (!botUsername) {
          console.error('VITE_TELEGRAM_BOT_USERNAME is not defined');
          if (ref.current) ref.current.innerText = 'Ошибка конфигурации Telegram.';
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-widget.js?22';
        script.async = true;
        script.defer = true;
        script.setAttribute('data-telegram-login', botUsername);
        script.setAttribute('data-size', 'large');
        script.setAttribute('data-auth-url', authUrl);
        script.setAttribute('data-request-access', 'write');
        script.setAttribute('data-lang', 'ru');

        const container = ref.current;
        if (container) {
          container.innerHTML = '';
          container.appendChild(script);
        }

        console.log('✅ [TG-WIDGET] Telegram widget initialized with fresh state');

      } catch (error) {
        console.error('❌ [TG-WIDGET] Failed to initialize widget:', error);
        if (ref.current) {
          ref.current.innerText = 'Ошибка инициализации Telegram виджета';
        }
      }
    };

    // Start the async initialization
    initTelegramWidget();

    return () => {
      const container = ref.current;
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [returnTo]);

  return <div ref={ref} />;
}

