// frontend/src/lib/russianMobileAuthFix.js
// Special handling for Russian ISP auth issues on mobile devices

import { supabase } from '@/lib/supabaseClient';

/**
 * Detects if user is likely affected by Russian ISP auth issues
 */
export function isRussianMobileContext() {
  const userAgent = navigator.userAgent;
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  // Check for Russian timezone
  const isRussianTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone?.includes('Moscow') ||
                           Intl.DateTimeFormat().resolvedOptions().timeZone?.includes('Europe/Moscow');
  
  // Check for Russian locale
  const isRussianLocale = navigator.language?.startsWith('ru') || 
                         navigator.languages?.some(lang => lang.startsWith('ru'));
  
  return isMobile && (isRussianTimezone || isRussianLocale);
}

/**
 * Enhanced auth retry logic for Russian mobile users
 */
export async function russianMobileAuthRetry(authFunction, options = {}) {
  const {
    maxRetries = 5,
    baseDelay = 1000,
    useExponentialBackoff = true,
    enableMobileWorkarounds = true
  } = options;
  
  console.log('🇷🇺 [RUSSIAN-MOBILE-AUTH] Enhanced auth retry starting...');
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 [RUSSIAN-MOBILE-AUTH] Attempt ${attempt}/${maxRetries}`);
      
      // Mobile-specific workarounds before each attempt
      if (enableMobileWorkarounds && isRussianMobileContext()) {
        await applyRussianMobileWorkarounds(attempt);
      }
      
      const result = await authFunction();
      console.log('✅ [RUSSIAN-MOBILE-AUTH] Auth succeeded on attempt', attempt);
      return result;
      
    } catch (error) {
      console.warn(`❌ [RUSSIAN-MOBILE-AUTH] Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        console.error('🚫 [RUSSIAN-MOBILE-AUTH] All attempts failed');
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = useExponentialBackoff 
        ? baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
        : baseDelay + Math.random() * 500;
      
      console.log(`⏳ [RUSSIAN-MOBILE-AUTH] Waiting ${Math.round(delay)}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Apply mobile-specific workarounds for Russian ISP issues
 */
async function applyRussianMobileWorkarounds(attempt) {
  console.log(`🔧 [RUSSIAN-MOBILE-AUTH] Applying workarounds for attempt ${attempt}`);
  
  // Workaround 1: Force DNS resolution by making a simple fetch
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (supabaseUrl) {
      // Make a lightweight request to "warm up" the connection
      await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      }).catch(() => {}); // Ignore errors, this is just a warmup
    }
  } catch {
    // Silent fail
  }
  
  // Workaround 2: Clear any stuck network state
  if (attempt > 2) {
    try {
      // Force reload Supabase client state
      await supabase.auth.getSession();
    } catch {
      // Silent fail
    }
  }
  
  // Workaround 3: Add randomized delay to avoid rate limiting
  if (attempt > 1) {
    const jitterDelay = Math.random() * 500 + 200;
    await new Promise(resolve => setTimeout(resolve, jitterDelay));
  }
  
  // Workaround 4: Check for network connectivity
  if (navigator.onLine === false) {
    console.warn('🌐 [RUSSIAN-MOBILE-AUTH] Network appears offline, waiting...');
    // Wait for network to come back
    await waitForNetworkConnectivity(5000);
  }
}

/**
 * Wait for network connectivity with timeout
 */
function waitForNetworkConnectivity(timeout = 5000) {
  return new Promise((resolve) => {
    if (navigator.onLine) {
      resolve();
      return;
    }
    
    const startTime = Date.now();
    
    const checkConnectivity = () => {
      if (navigator.onLine || (Date.now() - startTime) > timeout) {
        resolve();
      } else {
        setTimeout(checkConnectivity, 100);
      }
    };
    
    checkConnectivity();
  });
}

/**
 * Enhanced Telegram auth with Russian mobile fixes
 */
export async function enhancedTelegramAuth(telegramUserData, options = {}) {
  const authFunction = async () => {
    console.log('📱 [ENHANCED-TG-AUTH] Starting Telegram auth...');
    
    // Use edge function with enhanced error handling
    const response = await supabase.functions.invoke('telegram-auth-callback', {
      body: telegramUserData,
      headers: {
        'Content-Type': 'application/json',
        // Add User-Agent to help with ISP detection
        'X-Client-Info': `mobile-ru-${navigator.userAgent.substring(0, 50)}`
      }
    });

    if (response.error) {
      throw new Error(`Edge function error: ${response.error.message}`);
    }

    if (!response.data?.session) {
      throw new Error('No session returned from edge function');
    }

    // Set the session with enhanced error handling
    const { error: sessionError } = await supabase.auth.setSession(response.data.session);
    if (sessionError) {
      throw new Error(`Session error: ${sessionError.message}`);
    }

    // Verify session was set correctly
    const { data: verifySession, error: verifyError } = await supabase.auth.getSession();
    if (verifyError || !verifySession.session) {
      throw new Error('Session verification failed');
    }

    return {
      success: true,
      session: verifySession.session,
      duration: Date.now() - startTime
    };
  };

  const startTime = Date.now();
  
  // Use Russian mobile retry logic if needed
  if (isRussianMobileContext()) {
    return await russianMobileAuthRetry(authFunction, {
      maxRetries: 6,
      baseDelay: 1500,
      enableMobileWorkarounds: true,
      ...options
    });
  } else {
    return await authFunction();
  }
}

/**
 * Enhanced preAuthCleanup for Russian mobile
 */
export async function russianMobilePreAuthCleanup() {
  console.log('🇷🇺 [RUSSIAN-MOBILE-CLEANUP] Starting enhanced cleanup...');
  
  // Standard cleanup first
  const { preAuthCleanup } = await import('./preAuthCleanup.js');
  await preAuthCleanup({ preserveGuestData: true, preserveRedirectUrl: true });
  
  // Additional Russian mobile specific cleanup
  if (isRussianMobileContext()) {
    console.log('📱 [RUSSIAN-MOBILE-CLEANUP] Applying mobile-specific cleanup...');
    
    // Clear any cached DNS or connection state
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.update().catch(() => {});
        }
      }
    } catch {
      // Silent fail
    }
    
    // Clear web storage that might interfere
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          if (cacheName.includes('supabase') || cacheName.includes('auth')) {
            await caches.delete(cacheName);
          }
        }
      }
    } catch {
      // Silent fail
    }
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
    }
  }
  
  console.log('✅ [RUSSIAN-MOBILE-CLEANUP] Enhanced cleanup completed');
}