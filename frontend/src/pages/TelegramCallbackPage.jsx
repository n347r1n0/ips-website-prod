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
      // === MOBILE DEBUG TELEMETRY START ===
      console.log('🔍 [TG-CALLBACK] Page context:', {
        origin: window.location.origin,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        visibilityState: document.visibilityState,
        timestamp: new Date().toISOString()
      });
      
      const urlParams = Object.fromEntries(searchParams.entries());
      console.log('🔍 [TG-CALLBACK] URL params:', urlParams);
      
      // Check storage availability before processing
      const storageCheck = {
        sessionStorage: {
          available: typeof sessionStorage !== 'undefined',
          tg_oauth_state: null,
        },
        localStorage: {
          available: typeof localStorage !== 'undefined', 
          tg_oauth_state_last: null,
        }
      };
      
      try {
        storageCheck.sessionStorage.tg_oauth_state = sessionStorage.getItem('tg_oauth_state');
        storageCheck.localStorage.tg_oauth_state_last = localStorage.getItem('tg_oauth_state_last');
      } catch (e) {
        console.warn('🔍 [TG-CALLBACK] Storage access error:', e);
      }
      
      console.log('🔍 [TG-CALLBACK] Storage state:', storageCheck);
      // === MOBILE DEBUG TELEMETRY END ===

      // "Быстрый путь": если сессия уже есть, немедленно уходим.
      // Это чинит "зависший" спиннер.
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('✅ [TG-CALLBACK] Session exists, redirecting immediately');
        navigate(searchParams.get('return_to') || '/dashboard', { replace: true });
        return;
      }

      const tgUserData = Object.fromEntries(searchParams.entries());
      const { state, return_to, ...telegramAuthData } = tgUserData;
      
      console.log('🔍 [TG-CALLBACK] Telegram auth data received:', {
        hasState: !!state,
        hasHash: !!telegramAuthData.hash,
        hasAuthDate: !!telegramAuthData.auth_date,
        hasId: !!telegramAuthData.id,
        authDate: telegramAuthData.auth_date,
        stateValue: state?.substring(0, 8) + '...' // Log partial state for debugging
      });

      // Улучшенная проверка безопасности с "запасным ключом"
      const expectedState = sessionStorage.getItem('tg_oauth_state');
      const expectedStateBackup = localStorage.getItem('tg_oauth_state_last');

      console.log('🔍 [TG-CALLBACK] State validation:', {
        providedState: state?.substring(0, 8) + '...',
        expectedState: expectedState?.substring(0, 8) + '...',
        expectedStateBackup: expectedStateBackup?.substring(0, 8) + '...',
        stateMatches: state === expectedState,
        backupMatches: state === expectedStateBackup,
        hasState: !!state
      });

      sessionStorage.removeItem('tg_oauth_state');
      localStorage.removeItem('tg_oauth_state_last');

      if (!state || (state !== expectedState && state !== expectedStateBackup)) {
        console.error('❌ [TG-CALLBACK] Invalid state parameter. CSRF attack suspected.', {
          state: state?.substring(0, 8) + '...',
          expected: expectedState?.substring(0, 8) + '...',
          backup: expectedStateBackup?.substring(0, 8) + '...'
        });
        setError('Ошибка безопасности. Пожалуйста, попробуйте войти снова.');
        setTimeout(() => navigate('/'), 5000);
        return;
      }

      console.log('✅ [TG-CALLBACK] State validation passed');

      try {
        console.log('🔄 [TG-CALLBACK] Calling edge function...');
        const { data, error: invokeError } = await supabase.functions.invoke(
          'telegram-auth-callback',
          { body: { tgUserData: telegramAuthData } }
        );

        console.log('🔍 [TG-CALLBACK] Edge function response:', {
          success: data?.success,
          hasSessionToken: !!(data?.session_token),
          hasAccessToken: !!(data?.session_token?.access_token),
          hasRefreshToken: !!(data?.session_token?.refresh_token),
          error: invokeError?.message || data?.error
        });

        if (invokeError) throw invokeError;
        if (!data.success) throw new Error(data.error || 'Произошла неизвестная ошибка на сервере');

        console.log('🔄 [TG-CALLBACK] Setting session...');
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.session_token.access_token,
          refresh_token: data.session_token.refresh_token,
        });

        if (sessionError) {
          console.error('❌ [TG-CALLBACK] Session set error:', sessionError);
          throw sessionError;
        }

        console.log('✅ [TG-CALLBACK] Session established successfully');

        // Verify session was actually set
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔍 [TG-CALLBACK] Final session check:', {
          hasSession: !!session,
          userId: session?.user?.id,
          expiresAt: session?.expires_at
        });

        navigate(return_to || '/dashboard', { replace: true });

      } catch (err) {
        console.error('❌ [TG-CALLBACK] Complete login error:', err);
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
