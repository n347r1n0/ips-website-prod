// frontend/src/pages/TelegramCallbackPage.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { iosSafariUtils } from '@/lib/iosSafariUtils';
import { completeTelegramAuthFlow } from '@/lib/sessionUtils';
import { verifyAndConsumeOAuthState } from '@/lib/preAuthCleanup';

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
      
      // iOS Safari specific context validation
      if (iosSafariUtils.isIOSSafari) {
        console.log('🍎 [TG-CALLBACK] iOS Safari detected');
        const contextSuspicious = iosSafariUtils.isContextSuspicious();
        const storageConsistency = iosSafariUtils.validateStorageConsistency();
        
        console.log('🍎 [TG-CALLBACK] iOS context check:', {
          suspicious: contextSuspicious,
          storageConsistent: storageConsistency.consistent,
          reason: storageConsistency.reason
        });

        if (contextSuspicious || !storageConsistency.consistent) {
          console.log('🍎 [TG-CALLBACK] iOS context issues detected, refreshing...');
          iosSafariUtils.refreshContextIfNeeded();
        }
      }
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

      // Enhanced OAuth state validation with TTL and comprehensive cleanup
      console.log('🔐 [TG-CALLBACK] Verifying OAuth state...');
      const stateValid = verifyAndConsumeOAuthState(state);
      
      // Fallback to legacy state validation for backward compatibility
      if (!stateValid) {
        console.log('🔄 [TG-CALLBACK] TTL state failed, trying legacy validation...');
        
        const expectedState = sessionStorage.getItem('tg_oauth_state');
        const expectedStateBackup = localStorage.getItem('tg_oauth_state_last');

        console.log('🔍 [TG-CALLBACK] Legacy state validation:', {
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
          console.error('❌ [TG-CALLBACK] Both TTL and legacy state validation failed. CSRF attack suspected.');
          setError('Ошибка безопасности. Пожалуйста, попробуйте войти снова.');
          setTimeout(() => navigate('/'), 5000);
          return;
        }
        
        console.log('✅ [TG-CALLBACK] Legacy state validation passed');
      } else {
        console.log('✅ [TG-CALLBACK] TTL OAuth state validation passed');
      }

      try {
        console.log('🔄 [TG-CALLBACK] Using robust auth flow');
        
        // Use the robust authentication flow with retries and verification
        const authResult = await completeTelegramAuthFlow(telegramAuthData, {
          edgeFunction: {
            maxAttempts: 3,
            initialDelay: 1000,
            timeoutPerAttempt: 15000 // Longer timeout for callback page
          },
          session: {
            maxWaitTime: 20000, // Longer wait for callback context
            verificationDelay: 300
          }
        });

        if (!authResult.success) {
          throw new Error(authResult.error || 'Authentication flow failed');
        }

        console.log(`✅ [TG-CALLBACK] Robust auth completed in ${authResult.duration}ms`);

        // For callback page, we navigate immediately after successful auth
        // The auth state change listener will handle the actual redirect
        const redirectTarget = return_to || '/dashboard';
        console.log(`🔄 [TG-CALLBACK] Navigating to: ${redirectTarget}`);
        navigate(redirectTarget, { replace: true });

      } catch (err) {
        console.error('❌ [TG-CALLBACK] Robust auth failed:', err);
        
        // Enhanced error message for iOS Safari issues
        let errorMessage = `Ошибка авторизации: ${err.message}`;
        
        if (iosSafariUtils.isIOSSafari && err.message.includes('timeout')) {
          errorMessage += '\n\nПопробуйте снова или используйте другой браузер.';
        }
        
        setError(`${errorMessage}. Вы будете перенаправлены.`);
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
