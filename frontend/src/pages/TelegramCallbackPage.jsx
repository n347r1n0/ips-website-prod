// frontend/src/pages/TelegramCallbackPage.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';

export function TelegramCallbackPage() {
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Guard 1: Immediate redirect on SDK auth state change
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        const ret = searchParams.get('return_to') || '/dashboard';
        navigate(ret, { replace: true });
      }
    });
    return () => authListener?.subscription.unsubscribe();
  }, [navigate, searchParams]);

  // Guard 2: Timeout fallback - if session exists, navigate away
  useEffect(() => {
    const timeout = setTimeout(async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session) {
          const ret = searchParams.get('return_to') || '/dashboard';
          navigate(ret, { replace: true });
        }
      } catch (e) {
        // Silent fail
      }
    }, 3500);
    return () => clearTimeout(timeout);
  }, [navigate, searchParams]);

  // Main callback processing logic
  useEffect(() => {
    const completeLogin = async () => {
      // "Быстрый путь": если сессия уже есть, немедленно уходим.
      // Это чинит "зависший" спиннер.
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate(searchParams.get('return_to') || '/dashboard', { replace: true });
        return;
      }

      const tgUserData = Object.fromEntries(searchParams.entries());
      const { state, return_to, ...telegramAuthData } = tgUserData;

      // Улучшенная проверка безопасности с "запасным ключом"
      const expectedState = sessionStorage.getItem('tg_oauth_state');
      const expectedStateBackup = localStorage.getItem('tg_oauth_state_last');

      sessionStorage.removeItem('tg_oauth_state');
      localStorage.removeItem('tg_oauth_state_last');

      if (!state || (state !== expectedState && state !== expectedStateBackup)) {
        console.error('Invalid state parameter. CSRF attack suspected.');
        setError('Ошибка безопасности. Пожалуйста, попробуйте войти снова.');
        setTimeout(() => navigate('/'), 5000);
        return;
      }

      try {
        const { data, error: invokeError } = await supabase.functions.invoke(
          'telegram-auth-callback',
          { body: { tgUserData: telegramAuthData } }
        );

        if (invokeError) throw invokeError;
        if (!data.success) throw new Error(data.error || 'Произошла неизвестная ошибка на сервере');

        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.session_token.access_token,
          refresh_token: data.session_token.refresh_token,
        });

        if (sessionError) throw sessionError;

        navigate(return_to || '/dashboard', { replace: true });

      } catch (err) {
        console.error('Ошибка на странице callback:', err);
        setError(`Ошибка авторизации: ${err.message}. Вы будете перенаправлены.`);
        setTimeout(() => navigate('/'), 5000);
      }
    };

    completeLogin();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[url('/textures/dark_texture.png')] text-white text-center p-4">
      <GlassPanel className="p-10 rounded-2xl">
        {error ? (
          <>
            <h1 className="text-2xl font-brand text-red-400 mb-4">Ошибка</h1>
            <p>{error}</p>
          </>
        ) : (
          <>
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-gold-accent" />
            <h1 className="text-2xl font-brand">Завершаем вход...</h1>
            <p className="text-white/70">Пожалуйста, подождите.</p>
          </>
        )}
      </GlassPanel>
    </div>
  );
}
